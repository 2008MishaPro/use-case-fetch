import React from 'react';
import { Card, Input, Select, Button, Space, message, Modal, Popconfirm } from 'antd';
import { DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { reatomComponent } from '@reatom/npm-react';
import type { RequestItem } from '../../../model';
import { executeIndividualRequestAction, individualRequestResultsAtom } from '../../../model';
import { ParameterEditor } from '../parameter-editor';
import styles from './styles.module.css';

const { TextArea } = Input;

interface RequestItemProps {
    item: RequestItem;
    index: number;
    onUpdate: (updates: Partial<RequestItem>) => void;
    onRemove: () => void;
}

export const RequestItemComponent = reatomComponent<RequestItemProps>(({ ctx, item, index, onUpdate, onRemove }) => {
    const individualResults = ctx.spy(individualRequestResultsAtom);
    const currentResult = individualResults[item.id];
    const [isExecuting, setIsExecuting] = React.useState(false);
    const [showResult, setShowResult] = React.useState(false);

    const handleSendRequest = async () => {
        if (!item.method || !item.url) {
            message.error('Метод и URL обязательны для выполнения запроса');
            return;
        }
        
        setIsExecuting(true);
        try {
            await executeIndividualRequestAction(ctx, item.id);
            message.success(`Запрос ${index + 1} выполнен успешно`);
            setShowResult(true);
        } catch (error: any) {
            message.error(`Ошибка выполнения запроса ${index + 1}: ${error.message}`);
            setShowResult(true);
        } finally {
            setIsExecuting(false);
        }
    };

    const renderResultModal = () => {
        if (!currentResult) return null;
        
        return (
            <Modal
                title={`Результат запроса ${index + 1}`}
                open={showResult}
                onCancel={() => setShowResult(false)}
                footer={[
                    <Button key="close" onClick={() => setShowResult(false)}>
                        Закрыть
                    </Button>
                ]}
                width={800}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <strong>URL:</strong> {currentResult.url}
                    </div>
                    <div>
                        <strong>Статус:</strong> 
                        <span style={{ color: currentResult.success ? 'green' : 'red', marginLeft: 8 }}>
                            {currentResult.status}
                        </span>
                    </div>
                    <div>
                        <strong>Время:</strong> {new Date(currentResult.timestamp).toLocaleString()}
                    </div>
                    {currentResult.error && (
                        <div>
                            <strong>Ошибка:</strong>
                            <div style={{ color: 'red', marginTop: 4 }}>{currentResult.error}</div>
                        </div>
                    )}
                    <div>
                        <strong>Данные ответа:</strong>
                        <pre style={{ 
                            background: '#f5f5f5', 
                            padding: 12, 
                            borderRadius: 4, 
                            maxHeight: 400, 
                            overflow: 'auto',
                            fontSize: 12
                        }}>
                            {JSON.stringify(currentResult.data, null, 2)}
                        </pre>
                    </div>
                </Space>
            </Modal>
        );
    };
    return (
        <div style={{ display: 'flex', gap: 16, paddingBottom: 16 }}>
            <Card 
                key={item.id}
                title={`Запрос ${index + 1}: ${item.description || 'Без описания'}`}
                className={styles.requestCard}
                style={{ flex: 1 }}
                extra={
                <Space direction="horizontal">
                    <Button 
                        type="primary" 
                        icon={<SendOutlined />}
                        onClick={handleSendRequest}
                        loading={isExecuting}
                        disabled={isExecuting}
                    >
                        {isExecuting ? 'Выполняется...' : 'Отправить'}
                    </Button>
                    {currentResult && (
                        <Button 
                            type="default"
                            onClick={() => setShowResult(true)}
                            style={{ 
                                color: currentResult.success ? 'green' : 'red',
                                borderColor: currentResult.success ? 'green' : 'red'
                            }}
                        >
                            Результат
                        </Button>
                    )}
                    <Popconfirm
                        title="Вы уверены?"
                        onConfirm={() => onRemove()}
                        okText="Да"
                        cancelText="Нет"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
                }
            >
            <Space direction="vertical" className={styles.requestSpace}>
                {/* Метод и URL */}
                <Space className={styles.methodUrlRow}>
                    <Select
                        value={item.method}
                        onChange={(value) => onUpdate({ method: value })}
                        className={styles.methodSelect}
                    >
                        <Select.Option value="GET">GET</Select.Option>
                        <Select.Option value="POST">POST</Select.Option>
                        <Select.Option value="PUT">PUT</Select.Option>
                        <Select.Option value="DELETE">DELETE</Select.Option>
                        <Select.Option value="PATCH">PATCH</Select.Option>
                    </Select>
                    <Input
                        placeholder="URL (например: /users)"
                        value={item.url as string}
                        onChange={(e) => onUpdate({ url: e.target.value })}
                        className={styles.urlInput}
                    />
                </Space>

                {/* Параметры URL */}
                <ParameterEditor
                    ctx={ctx}
                    params={item.urlParams || []}
                    onChange={(params) => onUpdate({ urlParams: params })}
                    title="Параметры URL"
                    requestIndex={index}
                    showHideKey={true}
                />

                {/* Query параметры */}
                <ParameterEditor
                    ctx={ctx}
                    params={item.queryParams || []}
                    onChange={(params) => onUpdate({ queryParams: params })}
                    title="Query параметры"
                    requestIndex={index}
                />

                {/* Body для POST/PUT/PATCH */}
                {['POST', 'PUT', 'PATCH'].includes(item.method as string) && (
                    <>
                        <ParameterEditor
                            ctx={ctx}
                            params={item.bodyParams || []}
                            onChange={(params) => onUpdate({ bodyParams: params })}
                            title="Параметры Body"
                            requestIndex={index}
                        />
                        <TextArea
                            placeholder="Request Body (JSON) - необязательно, если используются параметры Body"
                            value={item.body}
                            onChange={(e) => onUpdate({ body: e.target.value })}
                            rows={4}
                            className={styles.bodyTextArea}
                        />
                    </>
                )}
                {/* Описание запроса */}
                <Space direction="vertical">
                    Добавить описание запроса
                    <Input
                        placeholder="Описание запроса"
                        value={item.description}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                    />
                </Space>
            </Space>
            </Card>
            
            {currentResult && (
                <Card 
                    title="Результат"
                    size="small"
                    style={{ 
                        width: 300,
                        overflow: 'auto',
                        borderColor: currentResult.success ? 'green' : 'red'
                    }}
                    extra={
                        <Button 
                            type="link" 
                            size="small"
                            onClick={() => setShowResult(true)}
                        >
                            Подробнее
                        </Button>
                    }
                >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div>
                            <strong>Статус:</strong> 
                            <span style={{ color: currentResult.success ? 'green' : 'red', marginLeft: 4 }}>
                                {currentResult.status}
                            </span>
                        </div>
                        <div>
                            <strong>Время:</strong> {new Date(currentResult.timestamp).toLocaleTimeString()}
                        </div>
                        {currentResult.error ? (
                            <div style={{ color: 'red', fontSize: 12 }}>
                                {currentResult.error}
                            </div>
                        ) : (
                            <div>
                                <strong>Данные:</strong>
                                <pre style={{ 
                                    background: '#f9f9f9', 
                                    padding: 8, 
                                    borderRadius: 4, 
                                    fontSize: 10,
                                    maxHeight: "fit-content",
                                    overflow: 'auto',
                                    margin: '4px 0 0 0'
                                }}>
                                    {JSON.stringify(currentResult.data, null, 2)}
                                </pre>
                            </div>
                        )}
                    </Space>
                </Card>
            )}
            
            {renderResultModal()}
        </div>
    );
});
