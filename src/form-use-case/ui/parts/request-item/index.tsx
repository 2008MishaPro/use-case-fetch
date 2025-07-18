import React from 'react';
import { Input, Select, Button, message, Modal, Popconfirm, Collapse } from 'antd';
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
                title="Результат запроса"
                open={showResult}
                onCancel={() => setShowResult(false)}
                footer={null}
                width={800}
            >
                <div className={styles.resultCard}>
                    <div className={`${styles.resultStatus} ${currentResult.success ? styles.success : styles.error}`}>
                        Статус: {currentResult.status} {currentResult.success ? '✅' : '❌'}
                    </div>
                    <div className={styles.resultUrl}>
                        URL: {currentResult.url}
                    </div>
                    <div style={{ marginBottom: 16, fontSize: '13px', color: '#8c8c8c' }}>
                        Время: {new Date(currentResult.timestamp).toLocaleString()}
                    </div>
                    {currentResult.error && (
                        <div style={{ marginBottom: 16, color: '#ff4d4f', fontWeight: 500 }}>
                            Ошибка: {currentResult.error}
                        </div>
                    )}
                    <div>
                        <strong style={{ color: '#262626' }}>Данные:</strong>
                        <pre style={{ 
                            background: '#f5f5f5', 
                            padding: '16px', 
                            borderRadius: '6px',
                            maxHeight: '400px',
                            overflow: 'auto',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            border: '1px solid #e8e8e8',
                            marginTop: '8px'
                        }}>
                            {JSON.stringify(currentResult.data, null, 2)}
                        </pre>
                    </div>
                </div>
            </Modal>
        );
    };
    const getRequestStatus = () => {
        if (!currentResult) return '';
        return currentResult.success ? ' ✅' : ' ❌';
    };

    const getHeaderTitle = () => {
        const baseTitle = `Запрос ${index + 1}`;
        const status = getRequestStatus();
        const methodUrl = item.method && item.url ? ` (${item.method} ${item.url})` : '';
        return baseTitle + status + methodUrl;
    };

    return (
        <div className={styles.requestContainer}>
            <Collapse defaultActiveKey={[]} className={styles.requestCollapse}>
                <Collapse.Panel key="1" header={getHeaderTitle()}>
                    <div className={styles.requestSpace}>

                    {/* Метод и URL */}
                    <div className={styles.methodUrlRow}>
                        <Select
                            placeholder="Метод"
                            value={item.method}
                            onChange={(value) => onUpdate({ method: value })}
                            className={styles.methodSelect}
                            size="large"
                        >
                            <Select.Option value="GET">GET</Select.Option>
                            <Select.Option value="POST">POST</Select.Option>
                            <Select.Option value="PUT">PUT</Select.Option>
                            <Select.Option value="DELETE">DELETE</Select.Option>
                            <Select.Option value="PATCH">PATCH</Select.Option>
                        </Select>
                        <Input
                            placeholder="URL (например: /api/users)"
                            value={item.url as string}
                            onChange={(e) => onUpdate({ url: e.target.value })}
                            className={styles.urlInput}
                            size="large"
                        />
                    </div>

                    {/* Параметры URL */}
                    <ParameterEditor
                        params={item.urlParams || []}
                        onChange={(params) => onUpdate({ urlParams: params })}
                        title="Параметры URL"
                        requestIndex={index}
                        showHideKey={true}
                    />

                    {/* Query параметры */}
                    <ParameterEditor
                        params={item.queryParams || []}
                        onChange={(params) => onUpdate({ queryParams: params })}
                        title="Query параметры"
                        requestIndex={index}
                    />

                    {/* Body для POST/PUT/PATCH */}
                    {['POST', 'PUT', 'PATCH'].includes(item.method as string) && (
                        <>
                            <ParameterEditor
                                params={item.bodyParams || []}
                                onChange={(params) => onUpdate({ bodyParams: params })}
                                title="Параметры Body"
                                requestIndex={index}
                            />
                            <TextArea
                                placeholder="Request Body (JSON) - необязательно, если используются параметры Body"
                                value={item.body}
                                onChange={(e) => onUpdate({ body: e.target.value })}
                                className={styles.bodyTextArea}
                                rows={4}
                            />
                        </>
                    )}

                    {/* Кнопки действий */}
                    <div className={styles.actionButtons}>
                        <Button 
                            type="primary" 
                            icon={<SendOutlined />}
                            onClick={handleSendRequest}
                            loading={isExecuting}
                            className={styles.sendButton}
                        >
                            Отправить
                        </Button>
                        
                        {currentResult && (
                            <Button 
                                onClick={() => setShowResult(true)}
                                className={styles.resultButton}
                            >
                                Результат
                            </Button>
                        )}
                        
                        <Popconfirm
                            title="Удалить запрос?"
                            description="Вы уверены, что хотите удалить этот запрос?"
                            onConfirm={onRemove}
                            okText="Да"
                            cancelText="Нет"
                        >
                            <Button 
                                danger 
                                icon={<DeleteOutlined />}
                                className={styles.deleteButton}
                            />
                        </Popconfirm>
                    </div>

                    {/* Карточка результата */}
                    {currentResult && (
                        <div className={`${styles.resultCard} ${currentResult.success ? styles.success : styles.error}`}>
                            <div className={`${styles.resultStatus} ${currentResult.success ? styles.success : styles.error}`}>
                                Статус: {currentResult.status} {currentResult.success ? '✅' : '❌'}
                            </div>
                            <div className={styles.resultUrl}>
                                {currentResult.url}
                            </div>
                        </div>
                    )}
                    </div>
                </Collapse.Panel>
            </Collapse>
            {renderResultModal()}
        </div>
    );
});
