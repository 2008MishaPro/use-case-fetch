import { atom, action } from '@reatom/framework'

type RequestsType = 'get' | 'post' | 'put' | 'delete' | 'patch'

// Тип для извлечения данных из предыдущих ответов
interface DataExtractor {
    fromResponse: number; // индекс предыдущего запроса (0-based)
    searchKey: string; // ключ для поиска в ответе (например: "id", "name")
    specificValue?: any; // конкретное значение (например: 2), если не указано - берется первое найденное
    defaultValue?: any; // значение по умолчанию если ключ не найден
}

// Конфигурация параметра запроса
interface RequestParam {
    key: string; // ключ параметра
    value?: any; // статическое значение
    extractor?: DataExtractor; // извлечение из предыдущего ответа
    hideKey?: boolean; // скрыть ключ в URL (для создания /users/2 вместо /users?id=2)
}

interface RequestItem {
    id: string;
    method: RequestsType | null;
    url: string | null;
    urlParams?: RequestParam[]; // для динамических частей URL (например /users/{id})
    bodyParams?: RequestParam[]; // параметры для тела запроса
    queryParams?: RequestParam[]; // параметры для query string
    description?: string; // описание запроса
    body?: string; // JSON тело запроса
}

// Результат выполнения запроса
interface RequestResult {
    requestId: string;
    status: number;
    data: any;
    error?: string;
    timestamp: number;
    success: boolean;
    url: string;
}

// Состояние выполнения use-case
interface UseCaseExecution {
    isExecuting: boolean;
    currentStep: number;
    results: RequestResult[];
    error?: string;
}

export const requestsTypeAtom = atom<string[]>(['get', 'post', 'put', 'delete', 'patch'], 'requestsTypeAtom')

export const requestItemsAtom = atom<RequestItem[]>([{
    id: '1',
    method: null,
    url: null,
    description: 'Первый запрос'
}], 'requestItemsAtom')

// Атом для состояния выполнения use-case
export const useCaseExecutionAtom = atom<UseCaseExecution>({
    isExecuting: false,
    currentStep: -1,
    results: [],
    error: undefined
}, 'useCaseExecutionAtom')

export const addRequestItemAction = action((ctx) => {
    const currentItems = ctx.get(requestItemsAtom)
    const newItem: RequestItem = {
        id: Date.now().toString(),
        method: null,
        url: null,
        description: `Запрос ${currentItems.length + 1}`
    }
    requestItemsAtom(ctx, [...currentItems, newItem])
}, 'addRequestItemAction')

// Функция для умного поиска значения по ключу в JSON
function findValueByKey(data: any, searchKey: string, specificValue?: any, defaultValue: any = undefined): any {
    try {
        // Рекурсивная функция для поиска ключа
        function searchInObject(obj: any, key: string): any[] {
            const results: any[] = []
            
            if (obj === null || obj === undefined) {
                return results
            }
            
            // Если это массив, ищем в каждом элементе
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    results.push(...searchInObject(item, key))
                }
            }
            // Если это объект
            else if (typeof obj === 'object') {
                // Проверяем, есть ли искомый ключ в текущем объекте
                if (obj.hasOwnProperty(key)) {
                    results.push(obj[key])
                }
                
                // Рекурсивно ищем в дочерних объектах
                for (const prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        results.push(...searchInObject(obj[prop], key))
                    }
                }
            }
            
            return results
        }
        
        const foundValues = searchInObject(data, searchKey)
        
        if (foundValues.length === 0) {
            return defaultValue
        }
        
        // Если указано конкретное значение, ищем его
        if (specificValue !== undefined) {
            const found = foundValues.find(val => val == specificValue)
            return found !== undefined ? found : defaultValue
        }
        
        // Иначе возвращаем первое найденное значение
        return foundValues[0]
        
    } catch (error) {
        console.error('Error finding value by key:', error)
        return defaultValue
    }
}

// Функция для построения URL с параметрами (только для hideKey=true)
function buildUrlWithParams(baseUrl: string, urlParams: RequestParam[], results: RequestResult[]): string {
    let url = baseUrl
    
    // Обрабатываем только параметры с hideKey=true
    urlParams.forEach(param => {
        if (!param.hideKey) return // Пропускаем параметры без hideKey
        
        let value: any
        
        if (param.value !== undefined) {
            value = param.value
        } else if (param.extractor) {
            const result = results[param.extractor.fromResponse]
            if (result) {
                value = findValueByKey(
                    result.data, 
                    param.extractor.searchKey, 
                    param.extractor.specificValue,
                    param.extractor.defaultValue
                )
            } else {
                value = param.extractor.defaultValue
            }
        }
        
        if (value !== undefined && value !== null) {
            // Добавляем значение прямо к URL без ключа
            url = url.endsWith('/') ? url + value : url + '/' + value
        }
    })
    
    return url
}

function buildRequestParams(params: RequestParam[], results: RequestResult[]): Record<string, any> {
    const result: Record<string, any> = {}
    
    params.forEach(param => {
        if (param.value !== undefined) {
            result[param.key] = param.value
        } else if (param.extractor) {
            const responseResult = results[param.extractor.fromResponse]
            if (responseResult) {
                const extractedValue = findValueByKey(
                    responseResult.data, 
                    param.extractor.searchKey, 
                    param.extractor.specificValue,
                    param.extractor.defaultValue
                )
                result[param.key] = extractedValue
            }
        }
    })
    
    return result
 }

export const executeUseCaseAction = action(async (ctx) => {
    const requests = ctx.get(requestItemsAtom)
    
    const invalidRequests = requests.filter(req => !req.method || !req.url)
    if (invalidRequests.length > 0) {
        useCaseExecutionAtom(ctx, {
            isExecuting: false,
            currentStep: -1,
            results: [],
            error: `Не все запросы настроены. Проверьте запросы: ${invalidRequests.map(r => r.description).join(', ')}`
        })
        return
    }
    
    // Начинаем выполнение
    useCaseExecutionAtom(ctx, {
        isExecuting: true,
        currentStep: 0,
        results: [],
        error: undefined
    })
    
    const results: RequestResult[] = []
    
    try {
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i]
            
            useCaseExecutionAtom(ctx, {
                isExecuting: true,
                currentStep: i,
                results: [...results],
                error: undefined
            })
            
            let url = request.url!
            if (request.urlParams && request.urlParams.length > 0) {
                url = buildUrlWithParams(url, request.urlParams, results)
            }

            let bodyData: any = undefined
            if (request.bodyParams && request.bodyParams.length > 0) {
                bodyData = buildRequestParams(request.bodyParams, results)
            }

            let queryParams: Record<string, any> = {}
            if (request.queryParams && request.queryParams.length > 0) {
                queryParams = buildRequestParams(request.queryParams, results)
            }
            
            // Добавляем URL параметры с hideKey=false как query параметры
            if (request.urlParams && request.urlParams.length > 0) {
                const urlQueryParams = buildRequestParams(
                    request.urlParams.filter(param => !param.hideKey), 
                    results
                )
                queryParams = { ...queryParams, ...urlQueryParams }
            }

            if (Object.keys(queryParams).length > 0) {
                const queryString = new URLSearchParams(queryParams).toString()
                url += (url.includes('?') ? '&' : '?') + queryString
            }
            
            // Выполняем запрос
            const { api } = await import('../../shared/api')
            let response: any
            
            switch (request.method!.toUpperCase()) {
                case 'GET':
                    response = await api.get(url)
                    break
                case 'POST':
                    response = await api.post(url, bodyData)
                    break
                case 'PUT':
                    response = await api.put(url, bodyData)
                    break
                case 'DELETE':
                    response = await api.delete(url)
                    break
                case 'PATCH':
                    response = await api.patch(url, bodyData)
                    break
                default:
                    throw new Error(`Неподдерживаемый метод: ${request.method}`)
            }
            
            // Сохраняем результат
            const result: RequestResult = {
                requestId: request.id,
                status: response.status,
                data: response.data,
                timestamp: Date.now(),
                success: response.status >= 200 && response.status < 300,
                url: url
            }
            
            results.push(result)
            
            // Обновляем состояние с новым результатом
            useCaseExecutionAtom(ctx, {
                isExecuting: true,
                currentStep: i,
                results: [...results],
                error: undefined
            })
            
            // Небольшая задержка между запросами
            await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // Завершаем выполнение успешно
        useCaseExecutionAtom(ctx, {
            isExecuting: false,
            currentStep: requests.length - 1,
            results: [...results],
            error: undefined
        })
        
    } catch (error: any) {
        // Обрабатываем ошибку
        const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка'
        
        // Добавляем результат с ошибкой, если есть текущий запрос
        if (results.length < requests.length) {
            const currentRequest = requests[results.length]
            const errorResult: RequestResult = {
                requestId: currentRequest.id,
                status: error.response?.status || 0,
                data: error.response?.data || null,
                timestamp: Date.now(),
                success: false,
                url: currentRequest.url || '',
                error: errorMessage
            }
            results.push(errorResult)
        }
        
        useCaseExecutionAtom(ctx, {
            isExecuting: false,
            currentStep: results.length,
            results: [...results],
            error: errorMessage
        })
    }
}, 'executeUseCaseAction')

// Действие для сброса состояния выполнения
export const resetUseCaseAction = action((ctx) => {
    useCaseExecutionAtom(ctx, {
        isExecuting: false,
        currentStep: -1,
        results: [],
        error: undefined
    })
}, 'resetUseCaseAction')

// Экспорт типов для использования в UI
export type { RequestItem, RequestParam, DataExtractor, RequestResult, UseCaseExecution }
