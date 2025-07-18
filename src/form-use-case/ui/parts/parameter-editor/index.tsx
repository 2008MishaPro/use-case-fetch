import { Input, Button, InputNumber, AutoComplete, Tooltip, Divider, Collapse } from 'antd';
import { DeleteOutlined, InfoCircleOutlined, LinkOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
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
            <div className={styles.titleSection}>
                <div className={styles.title}>{title}</div>
                <Tooltip title="Параметры используются для передачи данных в запросе. Вы можете указать статические значения или извлечь данные из предыдущих запросов.">
                    <InfoCircleOutlined className={styles.infoIcon} />
                </Tooltip>
            </div>
            
            <div className={styles.paramSpace}>
                <Collapse 
                    className={styles.paramCollapse}
                    defaultActiveKey={params.map((_, index) => index.toString())}
                    ghost
                >
                    {params.map((param, index) => (
                        <Collapse.Panel 
                            key={index} 
                            header={
                                <div className={styles.paramHeader}>
                                    <div className={styles.paramHeaderLeft}>
                                        <SettingOutlined className={styles.paramIcon} />
                                        <span className={styles.paramNumber}>Параметр #{index + 1}</span>
                                        {param.key && <span className={styles.paramPreview}>({param.key})</span>}
                                    </div>
                                    <Tooltip title="Удалить параметр">
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeParam(index);
                                            }}
                                            className={styles.deleteButton}
                                            size="small"
                                        />
                                    </Tooltip>
                                </div>
                            }
                            className={styles.paramPanel}
                        >
                        
                        <div className={styles.paramContent}>
                            <div className={styles.inputGroup}>
                                <div className={styles.inputLabel}>
                                    <EditOutlined className={styles.labelIcon} />
                                    Название параметра
                                </div>
                                <Input
                                    placeholder="Например: userId, token, page"
                                    value={param.key}
                                    onChange={(e) => updateParam(index, { key: e.target.value })}
                                    className={styles.keyInput}
                                />
                            </div>
                            
                            {showHideKey && (
                                <div className={styles.optionGroup}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={param.hideKey || false}
                                            onChange={(e) => updateParam(index, { hideKey: e.target.checked })}
                                        />
                                        <span>Скрыть в URL (использовать флаг)</span>
                                        <Tooltip title="Параметр будет заменён на флаг вида !flagName! в URL">
                                            <InfoCircleOutlined className={styles.tooltipIcon} />
                                        </Tooltip>
                                    </label>
                                    
                                    {param.hideKey && (
                                        <div className={styles.inputGroup}>
                                            <div className={styles.inputLabel}>Имя флага</div>
                                            <Input
                                                placeholder="Например: id (для флага !id!)"
                                                value={param.flagName || ''}
                                                onChange={(e) => updateParam(index, { flagName: e.target.value })}
                                                className={styles.flagInput}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <Divider className={styles.divider} />
                            
                            <div className={styles.valueSection}>
                                <div className={styles.valueTypeSelector}>
                                    <label className={styles.checkboxLabel}>
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
                                        <LinkOutlined className={styles.linkIcon} />
                                        <span>Взять значение из предыдущего запроса</span>
                                        <Tooltip title="Автоматически извлечь значение из ответа одного из предыдущих запросов">
                                            <InfoCircleOutlined className={styles.tooltipIcon} />
                                        </Tooltip>
                                    </label>
                                </div>
                                
                                {!param.extractor ? (
                                    <div className={styles.inputGroup}>
                                        <div className={styles.inputLabel}>Значение параметра</div>
                                        <Input
                                            placeholder="Введите статическое значение"
                                            value={param.value}
                                            onChange={(e) => updateParam(index, { value: e.target.value })}
                                            className={styles.valueInput}
                                        />
                                    </div>
                                ) : (
                                    <div className={styles.extractorSpace}>
                                        <div className={styles.extractorTitle}>
                                            <LinkOutlined className={styles.extractorIcon} />
                                            Настройка извлечения данных
                                        </div>
                                        
                                        <div className={styles.extractorControls}>
                                            <div className={styles.inputGroup}>
                                                <div className={styles.inputLabel}>Номер запроса</div>
                                                <InputNumber
                                                    placeholder="0"
                                                    min={0}
                                                    max={requestIndex - 1}
                                                    value={param.extractor.fromResponse}
                                                    onChange={(value) => updateParam(index, {
                                                        extractor: { ...param.extractor!, fromResponse: value || 0 }
                                                    })}
                                                    className={styles.indexInput}
                                                />
                                                <div className={styles.helperText}>
                                                    Из какого запроса взять данные (начиная с 0)
                                                </div>
                                            </div>
                                            
                                            <div className={styles.inputGroup}>
                                                <div className={styles.inputLabel}>Путь к данным</div>
                                                <AutoComplete
                                                    placeholder="Например: data.user.id или users.0.name"
                                                    value={param.extractor.searchKey}
                                                    onChange={(value) => updateParam(index, {
                                                        extractor: { ...param.extractor!, searchKey: value }
                                                    })}
                                                    options={
                                                        availablePaths
                                                            .find(pathData => pathData.index === param.extractor!.fromResponse)
                                                            ?.paths.map(path => ({ value: path })) || []
                                                    }
                                                    filterOption={(inputValue, option) =>
                                                        option?.value.toLowerCase().includes(inputValue.toLowerCase()) || false
                                                    }
                                                    allowClear
                                                    className={styles.searchKeyInput}
                                                />
                                                <div className={styles.helperText}>
                                                    Путь к нужному полю в JSON ответе
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                         </div>
                         </Collapse.Panel>
                     ))}
                 </Collapse>
                 
                <Button
                    type="dashed"
                    onClick={addParam}
                    className={styles.addButton}
                    icon={<EditOutlined />}
                >
                    Добавить новый параметр
                </Button>
            </div>
        </div>
    );
})