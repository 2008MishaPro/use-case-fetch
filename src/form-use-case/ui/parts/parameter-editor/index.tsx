import React from 'react';
import { Input, Space, Button, Card, Typography, Select, InputNumber } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type {RequestParams} from '../../../model';
import styles from './styles.module.css';

const { Text } = Typography;

interface ParameterEditorProps {
    params: RequestParams[];
    onChange: (params: RequestParams[]) => void;
    title: string;
    requestIndex: number;
    showHideKey?: boolean;
}

export const ParameterEditor: React.FC<ParameterEditorProps> = ({ 
    params, 
    onChange, 
    title, 
    requestIndex,
    showHideKey = false
}) => {
    const addParam = () => {
        onChange([...params, { key: '', value: '' }]);
    };

    const updateParam = (index: number, updates: Partial<RequestParams>) => {
        const newParams = [...params];
        newParams[index] = { ...newParams[index], ...updates };
        onChange(newParams);
    };

    const removeParam = (index: number) => {
        onChange(params.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.container}>
            <Text strong>{title}</Text>
            {params.map((param, index) => (
                <Card key={index} size="small" className={styles.paramCard}>
                    <Space direction="vertical" className={styles.paramSpace}>
                        <Space className={styles.paramRow}>
                            <Input
                                placeholder="Ключ"
                                value={param.key}
                                onChange={(e) => updateParam(index, { key: e.target.value })}
                                className={styles.keyInput}
                            />
                            {showHideKey && (
                                <label className={styles.hideKeyLabel}>
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
                                        updateParam(index, { value: '', extractor: undefined });
                                    } else {
                                        updateParam(index, { 
                                            value: undefined, 
                                            extractor: { fromResponse: 0, searchKey: '', defaultValue: '' }
                                        });
                                    }
                                }}
                                className={styles.typeSelect}
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
                            <Space direction="vertical" className={styles.extractorSpace}>
                                <Space className={styles.extractorRow}>
                                    <InputNumber
                                        placeholder="Индекс запроса"
                                        min={0}
                                        max={requestIndex - 1}
                                        value={param.extractor.fromResponse}
                                        onChange={(value) => updateParam(index, {
                                            extractor: { ...param.extractor!, fromResponse: value || 0 }
                                        })}
                                        className={styles.indexInput}
                                    />
                                    <Input
                                        placeholder="Ключ для поиска (например: id)"
                                        value={param.extractor.searchKey}
                                        onChange={(e) => updateParam(index, {
                                            extractor: { ...param.extractor!, searchKey: e.target.value }
                                        })}
                                        className={styles.searchKeyInput}
                                    />
                                </Space>
                                <Space className={styles.extractorRow}>
                                    <Input
                                        placeholder="Конкретное значение (необязательно)"
                                        value={param.extractor.specificValue || ''}
                                        onChange={(e) => updateParam(index, {
                                            extractor: { ...param.extractor!, specificValue: e.target.value || undefined }
                                        })}
                                        className={styles.specificValueInput}
                                    />
                                    <Input
                                        placeholder="По умолчанию"
                                        value={param.extractor.defaultValue}
                                        onChange={(e) => updateParam(index, {
                                            extractor: { ...param.extractor!, defaultValue: e.target.value }
                                        })}
                                        className={styles.defaultValueInput}
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
                className={styles.addButton}
                size="small"
            >
                Добавить параметр
            </Button>
        </div>
    );
};