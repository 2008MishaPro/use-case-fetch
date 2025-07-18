import { atom, action } from '@reatom/framework'
const { api } = await import('../../shared/api')
type RequestsType = 'get' | 'post' | 'put' | 'delete' | 'patch'

interface DataExtractor {
    fromResponse: number
    searchKey: string
}

interface RequestParams {
    key: string
    value?: any
    extractor?: DataExtractor
    hideKey?: boolean
    flagName?: string
}

interface RequestItem {
    id: string
    method: RequestsType | null
    url: string | null
    urlParams?: RequestParams[]
    bodyParams?: RequestParams[]
    queryParams?: RequestParams[]
    description?: string
    body?: string
}

interface RequestResult {
    requestId: string
    status: number
    data: any
    error?: string
    timestamp: number
    success: boolean
    url: string
}

interface UseCaseExecution {
    isExecuting: boolean
    currentStep: number
    results: RequestResult[]
    error?: string
}

interface RequestPathsData {
    index: number
    paths: string[]
}

export const baseUrlAtom = atom<string>('', 'baseUrlAtom')

export const requestsTypeAtom = atom<string[]>(['get', 'post', 'put', 'delete', 'patch'], 'requestsTypeAtom')

export const requestItemsAtom = atom<RequestItem[]>([{
    id: '1',
    method: null,
    url: null,
    description: 'Первый запрос'
}], 'requestItemsAtom')

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

// Поиск значения по ключу в JSON с поддержкой путей
function findValueByKey(data: any, searchKey: string): any {
    try {
        if (searchKey.includes('.')) {
            return findValueByPath(data, searchKey)
        }
        
        function searchInObject(obj: any, key: string): any[] {
            const results: any[] = []
            
            if (obj === null || obj === undefined) {
                return results
            }
            
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    results.push(...searchInObject(item, key))
                }
            }
            else if (typeof obj === 'object') {
                if (obj.hasOwnProperty(key)) {
                    results.push(obj[key])
                }
                
                for (const prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        results.push(...searchInObject(obj[prop], key))
                    }
                }
            }
            
            return results
        }
        
        const foundValues = searchInObject(data, searchKey)
        return foundValues.length === 0 ? undefined : foundValues[0]
        
    } catch (error) {
        console.error('Error finding value by key:', error)
        return undefined
    }
}

function findValueByPath(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined
        }
        
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
            if (param.flagName) {
                const flagPattern = `!${param.flagName}!`
                url = url.replace(flagPattern, value)
            }
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
            
            const result = await executeHttpRequest(ctx, request, results)
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

export const resetUseCaseAction = action((ctx) => {
    useCaseExecutionAtom(ctx, {
        isExecuting: false,
        currentStep: -1,
        results: [],
        error: undefined
    })
}, 'resetUseCaseAction')

export const individualRequestResultsAtom = atom<Record<string, RequestResult>>({})

// Выполнение HTTP-запроса с обработкой параметров
async function executeHttpRequest(ctx: any, request: RequestItem, results: RequestResult[]): Promise<RequestResult> {
    const baseUrl = ctx.get(baseUrlAtom)
    let url = request.url!
    
    // Объединяем базовый URL с конкретным URL
    const fullUrl = baseUrl.endsWith('/') && url.startsWith('/') 
        ? baseUrl + url.slice(1)
        : baseUrl.endsWith('/') || url.startsWith('/')
        ? baseUrl + url
        : baseUrl + '/' + url
    
    url = fullUrl
    
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

export const executeIndividualRequestAction = action(async (ctx, requestId: string) => {
    const requests = ctx.get(requestItemsAtom)
    const request = requests.find(r => r.id === requestId)
    
    if (!request || !request.method || !request.url) {
        throw new Error('Запрос не найден или не настроен')
    }
    
    const currentResults = ctx.get(individualRequestResultsAtom)
    const allResults = Object.values(currentResults)
    
    try {
        const result = await executeHttpRequest(ctx, request, allResults)

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

export const availablePathsAtom = atom((ctx) => {
    const results = ctx.spy(individualRequestResultsAtom)
    const requests = ctx.spy(requestItemsAtom)
    const pathsData: RequestPathsData[] = []
    
    requests.forEach((request, index) => {
        const result = results[request.id]
        if (result && result.success && result.data) {
            const paths = extractJsonPaths(result.data)
            pathsData.push({
                index: index,
                paths: [...new Set(paths)].sort()
            })
        }
    })
    
    return pathsData
})

export type { RequestItem, RequestParams, DataExtractor, RequestResult, UseCaseExecution, RequestPathsData }
