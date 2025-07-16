import React from 'react';
import { Input, Space, Button, Card, Select } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type {RequestItem} from '../../../model';
import { ParameterEditor } from '../parameter-editor';
import styles from './styles.module.css';

const { TextArea } = Input;

interface RequestItemProps {
    item: RequestItem;
    index: number;
    onUpdate: (updates: Partial<RequestItem>) => void;
    onRemove: () => void;
}

export const RequestItemComponent: React.FC<RequestItemProps> = ({
    item, 
    index, 
    onUpdate, 
    onRemove 
}) => {
    return (
        <Card 
            key={item.id} 
            title={`Запрос ${index + 1}: ${item.description || 'Без описания'}`}
            className={styles.requestCard}
            extra={
                <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => onRemove()}
                />
            }
        >
            <Space direction="vertical" className={styles.requestSpace}>
                {/* Описание запроса */}
                <Input
                    placeholder="Описание запроса"
                    value={item.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                />
                
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
                            rows={4}
                            className={styles.bodyTextArea}
                        />
                    </>
                )}
            </Space>
        </Card>
    );
};