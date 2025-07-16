import React from 'react';
import { Card, Collapse, Space, Typography, Tag } from 'antd';
import styles from './styles.module.css';

const { Text } = Typography;

interface ExecutionResult {
    success: boolean;
    status: number;
    url: string;
    data: any;
    error?: string;
}

interface ExecutionResultsProps {
    results: ExecutionResult[];
}

export const ExecutionResults: React.FC<ExecutionResultsProps> = ({ results }) => {
    if (results.length === 0) {
        return null;
    }

    return (
        <Card title="Результаты выполнения" className={styles.resultsCard}>
            <Collapse>
                {results.map((result, index) => (
                    <Collapse.Panel 
                        key={index} 
                        header={`Запрос ${index + 1}: ${result.success ? 'Успешно' : 'Ошибка'}`}
                    >
                        <Space direction="vertical" className={styles.resultSpace}>
                            <Text strong>URL:</Text>
                            <Text code>{result.url}</Text>
                            
                            <Text strong>Статус:</Text>
                            <Tag color={result.success ? 'green' : 'red'}>
                                {result.status}
                            </Tag>
                            
                            <Text strong>Ответ:</Text>
                            <pre className={styles.responseData}>
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
    );
};