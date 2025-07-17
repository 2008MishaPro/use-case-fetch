import { atom, action } from '@reatom/framework'
const { api } = await import('../../shared/api')
type RequestsType = 'get' | 'post' | 'put' | 'delete' | 'patch'

// Тип для извлечения данных из предыдущих ответов
interface DataExtractor {
    fromResponse: number; // индекс предыдущего запроса (0-based)
    searchKey: string; // ключ для поиска в ответе (например: "id", "name")
}

// Конфигурация параметра запроса
interface RequestParams {
    key: string; // ключ параметра
    value?: any; // статическое значение
    extractor?: DataExtractor; // извлечение из предыдущего ответа
    hideKey?: boolean; // скрыть ключ в URL (для создания /users/2 вместо /users?id=2)
    flagName?: string; // имя флага для вставки в URL (например: "id" для замены !id! в /api/users/!id!/posts)
}

interface RequestItem {
    id: string;
    method: RequestsType | null;
    url: string | null;
    urlParams?: RequestParams[]; // для динамических частей URL (например /users/{id})
    bodyParams?: RequestParams[]; // параметры для тела запроса
    queryParams?: RequestParams[]; // параметры для query string
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
function findValueByKey(data: any, searchKey: string): any {
    try {
        // Если ключ содержит точки, это путь (например: users.0.id)
        if (searchKey.includes('.')) {
            return findValueByPath(data, searchKey)
        }
        
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
            return undefined
        }
        
        // Возвращаем первое найденное значение
        return foundValues[0]
        
    } catch (error) {
        console.error('Error finding value by key:', error)
        return undefined
    }
}

// Функция для поиска значения по пути (например: users.0.id)
function findValueByPath(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined
        }
        
        // Проверяем, является ли ключ числом (индекс массива)
        const numericKey = parseInt(key, 10)
        if (!isNaN(numericKey) && Array.isArray(current)) {
            current = current[numericKey]
        } else if (typeof current === 'object' && current.hasOwnProperty(key)) {
            current = current[key]
        } else {
            return undefined
        }
    }
    
    return current
}

// Функция для построения URL с параметрами
function buildUrlWithParams(baseUrl: string, urlParams: RequestParams[], results: RequestResult[]): string {
    let url = baseUrl
    
    urlParams.forEach(param => {
        let value: any
        
        if (param.value !== undefined) {
            value = param.value
        } else if (param.extractor) {
            const result = results[param.extractor.fromResponse]
            if (result) {
                value = findValueByKey(
                    result.data, 
                    param.extractor.searchKey
                )
            }
        }
        
        if (value !== undefined && value !== null) {
            // Если есть flagName, заменяем флаг в URL
            if (param.flagName) {
                const flagPattern = `!${param.flagName}!`
                url = url.replace(flagPattern, value)
            }
            // Иначе, если hideKey=true, добавляем значение в конец URL
            else if (param.hideKey) {
                url = url.endsWith('/') ? url + value : url + '/' + value
            }
        }
    })
    
    return url
}

function buildRequestParams(params: RequestParams[], results: RequestResult[]): Record<string, any> {
    const result: Record<string, any> = {}
    
    params.forEach(param => {
        if (param.value !== undefined) {
            result[param.key] = param.value
        } else if (param.extractor) {
            const responseResult = results[param.extractor.fromResponse]
            if (responseResult) {
                const extractedValue = findValueByKey(
                    responseResult.data, 
                    param.extractor.searchKey
                )
                if (extractedValue !== undefined) {
                    result[param.key] = extractedValue
                }
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
            
            const result = await executeHttpRequest(request, results)
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

// Атом для хранения результатов индивидуальных запросов
export const individualRequestResultsAtom = atom<Record<string, RequestResult>>({})

// Общая функция для выполнения HTTP-запроса
async function executeHttpRequest(request: RequestItem, results: RequestResult[]): Promise<RequestResult> {
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
    
    // Добавляем URL параметры с hideKey=false и без flagName как query параметры
    if (request.urlParams && request.urlParams.length > 0) {
        const urlQueryParams = buildRequestParams(
            request.urlParams.filter(param => !param.hideKey && !param.flagName), 
            results
        )
        queryParams = { ...queryParams, ...urlQueryParams }
    }

    if (Object.keys(queryParams).length > 0) {
        const queryString = new URLSearchParams(queryParams).toString()
        url += (url.includes('?') ? '&' : '?') + queryString
    }

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
    
    return {
        requestId: request.id,
        status: response.status,
        data: response.data,
        timestamp: Date.now(),
        success: response.status >= 200 && response.status < 300,
        url: url
    }
}

// Действие для выполнения индивидуального запроса
export const executeIndividualRequestAction = action(async (ctx, requestId: string) => {
    const requests = ctx.get(requestItemsAtom)
    const request = requests.find(r => r.id === requestId)
    
    if (!request || !request.method || !request.url) {
        throw new Error('Запрос не найден или не настроен')
    }
    
    const currentResults = ctx.get(individualRequestResultsAtom)
    const allResults = Object.values(currentResults)
    
    try {
        const result = await executeHttpRequest(request, allResults)
        
        // Сохраняем результат
        individualRequestResultsAtom(ctx, {
            ...currentResults,
            [requestId]: result
        })
        
        return result
        
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка'
        
        const errorResult: RequestResult = {
            requestId: request.id,
            status: error.response?.status || 0,
            data: error.response?.data || null,
            timestamp: Date.now(),
            success: false,
            url: request.url,
            error: errorMessage
        }
        
        // Сохраняем результат с ошибкой
        individualRequestResultsAtom(ctx, {
            ...currentResults,
            [requestId]: errorResult
        })
        
        throw error
    }
}, 'executeIndividualRequestAction')

// Функция для извлечения всех возможных путей из JSON объекта
function extractJsonPaths(obj: any, prefix = ''): string[] {
    const paths: string[] = []
    
    if (obj === null || obj === undefined) {
        return paths
    }
    
    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            const currentPath = prefix ? `${prefix}.${index}` : `${index}`
            paths.push(currentPath)
            paths.push(...extractJsonPaths(item, currentPath))
        })
    } else if (typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
            const currentPath = prefix ? `${prefix}.${key}` : key
            paths.push(currentPath)
            paths.push(...extractJsonPaths(obj[key], currentPath))
        })
    }
    
    return paths
}

// Атом для получения доступных путей из результатов запросов
export const availablePathsAtom = atom((ctx) => {
    const results = ctx.spy(individualRequestResultsAtom)
    const allPaths: string[] = []
    
    Object.values(results).forEach(result => {
        if (result.success && result.data) {
            const paths = extractJsonPaths(result.data)
            allPaths.push(...paths)
        }
    })
    
    // Убираем дубликаты и сортируем
    return [...new Set(allPaths)].sort()
})

// Экспорт типов для использования в UI
export type { RequestItem, RequestParams, DataExtractor, RequestResult, UseCaseExecution }
