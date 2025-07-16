import {reatomComponent} from "@reatom/npm-react";
import {Form, Select, Input, Space, Button, Card, Typography, message, Collapse, InputNumber, Divider, Tag, Steps} from "antd";
const { TextArea } = Input;
const { Title } = Typography;
import {PlusOutlined, PlayCircleOutlined, StopOutlined, DeleteOutlined, SettingOutlined} from "@ant-design/icons";
import {
    requestItemsAtom, 
    requestsTypeAtom, 
    addRequestItemAction,
    useCaseExecutionAtom,
    executeUseCaseAction,
    resetUseCaseAction,
    type RequestItem,
    type RequestParam,
    type DataExtractor
} from "../model";
import {useState} from "react";

const { Text, Paragraph } = Typography;

export const FormUseCaseUI = reatomComponent(({ctx}) => {
    const requestItems = ctx.spy(requestItemsAtom)
    const requestTypes = ctx.spy(requestsTypeAtom)
    const execution = ctx.spy(useCaseExecutionAtom)
    const [form] = Form.useForm()
    const [editingRequest, setEditingRequest] = useState<string | null>(null)

    const addNewRequest = () => {
        addRequestItemAction(ctx)
    }

    const handleExecuteUseCase = () => {
        console.log('Выполнение use-case начато')
        console.log('Текущие запросы:', requestItems)
        console.log('Текущее состояние выполнения:', execution)
        executeUseCaseAction(ctx)
    }

    const handleResetExecution = () => {
        resetUseCaseAction(ctx)
    }

    const updateRequestItem = (requestId: string, updates: Partial<RequestItem>) => {
        const currentItems = ctx.get(requestItemsAtom)
        const updatedItems = currentItems.map(item => 
            item.id === requestId ? { ...item, ...updates } : item
        )
        requestItemsAtom(ctx, updatedItems)
    }

    const removeRequestItem = (requestId: string) => {
         const currentItems = ctx.get(requestItemsAtom)
         const filteredItems = currentItems.filter(item => item.id !== requestId)
         requestItemsAtom(ctx, filteredItems)
     }

     // Компонент для редактирования параметров
     const ParameterEditor = ({ 
         params, 
         onChange, 
         title, 
         requestIndex,
         showHideKey = false
     }: { 
         params: RequestParam[], 
         onChange: (params: RequestParam[]) => void, 
         title: string,
         requestIndex: number,
         showHideKey?: boolean
     }) => {
         const addParam = () => {
             onChange([...params, { key: '', value: '' }])
         }

         const updateParam = (index: number, updates: Partial<RequestParam>) => {
             const newParams = [...params]
             newParams[index] = { ...newParams[index], ...updates }
             onChange(newParams)
         }

         const removeParam = (index: number) => {
             onChange(params.filter((_, i) => i !== index))
         }

         return (
             <div>
                 <Text strong>{title}</Text>
                 {params.map((param, index) => (
                     <Card key={index} size="small" style={{ marginTop: 8 }}>
                         <Space direction="vertical" style={{ width: '100%' }}>
                             <Space style={{ width: '100%' }}>
                                 <Input
                                     placeholder="Ключ"
                                     value={param.key}
                                     onChange={(e) => updateParam(index, { key: e.target.value })}
                                     style={{ width: 120 }}
                                 />
                                 {showHideKey && (
                                     <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                         <input
                                             type="checkbox"
                                             checked={param.hideKey || false}
                                             onChange={(e) => updateParam(index, { hideKey: e.target.checked })}
                                         />
                                         Скрыть ключ
                                     </label>
                                 )}
                                 <Select
                                     placeholder="Тип значения"
                                     value={param.extractor ? 'dynamic' : 'static'}
                                     onChange={(type) => {
                                         if (type === 'static') {
                                             updateParam(index, { value: '', extractor: undefined })
                                         } else {
                                             updateParam(index, { 
                                                 value: undefined, 
                                                 extractor: { fromResponse: 0, searchKey: '', defaultValue: '' }
                                             })
                                         }
                                     }}
                                     style={{ width: 100 }}
                                 >
                                     <Select.Option value="static">Статич.</Select.Option>
                                     <Select.Option value="dynamic">Динамич.</Select.Option>
                                 </Select>
                                 <Button 
                                     type="text" 
                                     danger 
                                     icon={<DeleteOutlined />}
                                     onClick={() => removeParam(index)}
                                 />
                             </Space>
                             {!param.extractor ? (
                                 <Input
                                     placeholder="Значение"
                                     value={param.value}
                                     onChange={(e) => updateParam(index, { value: e.target.value })}
                                 />
                             ) : (
                                 <Space direction="vertical" style={{ width: '100%' }}>
                                     <Space style={{ width: '100%' }}>
                                         <InputNumber
                                             placeholder="Индекс запроса"
                                             min={0}
                                             max={requestIndex - 1}
                                             value={param.extractor.fromResponse}
                                             onChange={(value) => updateParam(index, {
                                                 extractor: { ...param.extractor!, fromResponse: value || 0 }
                                             })}
                                             style={{ width: 120 }}
                                         />
                                         <Input
                                             placeholder="Ключ для поиска (например: id)"
                                             value={param.extractor.searchKey}
                                             onChange={(e) => updateParam(index, {
                                                 extractor: { ...param.extractor!, searchKey: e.target.value }
                                             })}
                                             style={{ flex: 1 }}
                                         />
                                     </Space>
                                     <Space style={{ width: '100%' }}>
                                         <Input
                                             placeholder="Конкретное значение (необязательно)"
                                             value={param.extractor.specificValue || ''}
                                             onChange={(e) => updateParam(index, {
                                                 extractor: { ...param.extractor!, specificValue: e.target.value || undefined }
                                             })}
                                             style={{ flex: 1 }}
                                         />
                                         <Input
                                             placeholder="По умолчанию"
                                             value={param.extractor.defaultValue}
                                             onChange={(e) => updateParam(index, {
                                                 extractor: { ...param.extractor!, defaultValue: e.target.value }
                                             })}
                                             style={{ width: 100 }}
                                         />
                                     </Space>
                                 </Space>
                             )}
                         </Space>
                     </Card>
                 ))}
                 <Button 
                     type="dashed" 
                     onClick={addParam}
                     style={{ width: '100%', marginTop: 8 }}
                     size="small"
                 >
                     Добавить параметр
                 </Button>
             </div>
         )
     }
    return (
        <div>
            <Title level={2}>HTTP Request Form</Title>
              
              {/* Кнопка добавления нового запроса */}
              <Button 
                  type="primary" 
                  onClick={addNewRequest}
                  style={{ marginBottom: 16 }}
                  icon={<PlusOutlined />}
              >
                  Добавить запрос
              </Button>

            {/* Список запросов */}
            {requestItems.map((item, index) => (
                <Card 
                    key={item.id} 
                    title={`Запрос ${index + 1}: ${item.description || 'Без описания'}`}
                    style={{ marginBottom: 16 }}
                    extra={
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => removeRequestItem(item.id)}
                        />
                    }
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {/* Описание запроса */}
                        <Input
                            placeholder="Описание запроса"
                            value={item.description}
                            onChange={(e) => updateRequestItem(item.id, { description: e.target.value })}
                        />
                        
                        {/* Метод и URL */}
                        <Space style={{ width: '100%' }}>
                            <Select
                                value={item.method}
                                onChange={(value) => updateRequestItem(item.id, { method: value })}
                                style={{ width: 100 }}
                            >
                                <Select.Option value="GET">GET</Select.Option>
                                <Select.Option value="POST">POST</Select.Option>
                                <Select.Option value="PUT">PUT</Select.Option>
                                <Select.Option value="DELETE">DELETE</Select.Option>
                                <Select.Option value="PATCH">PATCH</Select.Option>
                            </Select>
                            <Input
                                placeholder="URL (например: /users)"
                                value={item.url}
                                onChange={(e) => updateRequestItem(item.id, { url: e.target.value })}
                                style={{ flex: 1 }}
                            />
                        </Space>

                        {/* Параметры URL */}
                        <ParameterEditor
                            params={item.urlParams || []}
                            onChange={(params) => updateRequestItem(item.id, { urlParams: params })}
                            title="Параметры URL"
                            requestIndex={index}
                            showHideKey={true}
                        />

                        {/* Query параметры */}
                        <ParameterEditor
                            params={item.queryParams || []}
                            onChange={(params) => updateRequestItem(item.id, { queryParams: params })}
                            title="Query параметры"
                            requestIndex={index}
                        />

                        {/* Body для POST/PUT/PATCH */}
                        {['POST', 'PUT', 'PATCH'].includes(item.method) && (
                            <>
                                <ParameterEditor
                                    params={item.bodyParams || []}
                                    onChange={(params) => updateRequestItem(item.id, { bodyParams: params })}
                                    title="Параметры Body"
                                    requestIndex={index}
                                />
                                <TextArea
                                     placeholder="Request Body (JSON) - необязательно, если используются параметры Body"
                                     value={item.body}
                                     onChange={(e) => updateRequestItem(item.id, { body: e.target.value })}
                                     rows={4}
                                 />
                            </>
                        )}
                    </Space>
                </Card>
            ))}

            {/* Кнопка выполнения use-case */}
            <Space style={{ marginTop: 16 }}>
                <Button 
                    type="primary" 
                    onClick={handleExecuteUseCase}
                    loading={execution.isExecuting}
                    disabled={requestItems.length === 0}
                    size="large"
                >
                    Выполнить Use-Case
                </Button>
                <Button 
                    onClick={handleResetExecution}
                    disabled={execution.isExecuting}
                >
                    Сбросить
                </Button>
            </Space>

            {/* Результаты выполнения */}
            {execution.results.length > 0 && (
                <Card title="Результаты выполнения" style={{ marginTop: 16 }}>
                    <Collapse>
                        {execution.results.map((result, index) => (
                            <Collapse.Panel 
                                key={index} 
                                header={`Запрос ${index + 1}: ${result.success ? 'Успешно' : 'Ошибка'}`}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Text strong>URL:</Text>
                                    <Text code>{result.url}</Text>
                                    
                                    <Text strong>Статус:</Text>
                                    <Tag color={result.success ? 'green' : 'red'}>
                                        {result.status}
                                    </Tag>
                                    
                                    <Text strong>Ответ:</Text>
                                    <pre style={{ 
                                        background: '#f5f5f5', 
                                        padding: '8px', 
                                        borderRadius: '4px',
                                        maxHeight: '200px',
                                        overflow: 'auto'
                                    }}>
                                        {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                    
                                    {result.error && (
                                        <>
                                            <Text strong>Ошибка:</Text>
                                            <Text type="danger">{result.error}</Text>
                                        </>
                                    )}
                                </Space>
                            </Collapse.Panel>
                        ))}
                    </Collapse>
                </Card>
            )}
        </div>
    );
}, 'FormUseCaseUI');