import React from 'react';
import { Input, Button, InputNumber, AutoComplete } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { reatomComponent } from '@reatom/npm-react';
import type {RequestParams} from '../../../model';
import { availablePathsAtom } from '../../../model';
import styles from './styles.module.css';

interface ParameterEditorProps {
    params: RequestParams[];
    onChange: (params: RequestParams[]) => void;
    title: string;
    requestIndex: number;
    showHideKey?: boolean;
}

export const ParameterEditor = reatomComponent<ParameterEditorProps>(({ 
    ctx,
    params, 
    onChange, 
    title, 
    requestIndex,
    showHideKey = false
}) => {
    const availablePaths = ctx.spy(availablePathsAtom);

    console.log('availablePaths', availablePaths)
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
            <div className={styles.title}>{title}</div>
            <div className={styles.paramSpace}>
                {params.map((param, index) => (
                    <div key={index} className={styles.paramCard}>
                        <div className={styles.paramRow}>
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
                                    Скрыть ключ в URL
                                </label>
                            )}
                            {param.hideKey && (
                                <Input
                                    placeholder="Имя флага (например: id для !id!)"
                                    value={param.flagName || ''}
                                    onChange={(e) => updateParam(index, { flagName: e.target.value })}
                                    className={styles.flagInput}
                                />
                            )}
                            <label className={styles.extractorLabel}>
                                <input
                                    type="checkbox"
                                    checked={!!param.extractor}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            updateParam(index, {
                                                extractor: { fromResponse: 0, searchKey: '' },
                                                value: undefined
                                            })
                                        } else {
                                            updateParam(index, { extractor: undefined, value: '' })
                                        }
                                    }}
                                />
                                Использовать данные из предыдущего запроса
                            </label>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeParam(index)}
                                className={styles.deleteButton}
                            />
                        </div>
                        {!param.extractor ? (
                            <Input
                                placeholder="Значение"
                                value={param.value}
                                onChange={(e) => updateParam(index, { value: e.target.value })}
                            />
                        ) : (
                            <div className={styles.extractorSpace}>
                                <div className={styles.extractorLabel}>
                                    Извлечение параметров из ответа запроса № {param.extractor.fromResponse}
                                </div>
                                <div className={styles.extractorRow}>
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
                                    <AutoComplete
                                        placeholder="Ключ для поиска (например: users.0.id)"
                                        value={param.extractor.searchKey}
                                        onChange={(value) => updateParam(index, {
                                            extractor: { ...param.extractor!, searchKey: value }
                                        })}
                                        options={availablePaths.map(path => ({ value: path }))}
                                        filterOption={(inputValue, option) =>
                                            option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                                        }
                                        allowClear
                                        className={styles.searchKeyInput}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <Button
                    type="dashed"
                    onClick={addParam}
                    className={styles.addButton}
                >
                    Добавить параметр
                </Button>
            </div>
        </div>
    );
})