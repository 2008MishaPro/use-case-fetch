import React from 'react';
import { Button, Collapse } from 'antd';
import styles from './styles.module.css';

interface ResultCardProps {
    result: {
        success: boolean;
        status: number;
        url: string;
        data: any;
        error?: string;
        timestamp: number;
    };
    onClose: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onClose }) => {
    const getHeaderTitle = () => {
        return (
            <div className={styles.resultHeaderContent}>
                <span>Результат запроса</span>
                <Button 
                    type="text" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className={styles.closeButton}
                >
                    ✕
                </Button>
            </div>
        );
    };

    return (
        <div className={styles.resultSidebar}>
            <Collapse 
                defaultActiveKey={['1']} 
                className={styles.resultCollapse}
            >
                <Collapse.Panel key="1" header={getHeaderTitle()}>
                    <div className={styles.resultContent}>
                        <div className={`${styles.resultStatus} ${result.success ? styles.success : styles.error}`}>
                            Статус: {result.status} {result.success ? '✅' : '❌'}
                        </div>
                        <div className={styles.resultUrl}>
                            URL: {result.url}
                        </div>
                        <div className={styles.timestamp}>
                            Время: {new Date(result.timestamp).toLocaleString()}
                        </div>
                        {result.error && (
                            <div className={styles.errorMessage}>
                                Ошибка: {result.error}
                            </div>
                        )}
                        <div>
                            <strong className={styles.dataLabel}>Данные:</strong>
                            <pre className={styles.dataContent}>
                                {JSON.stringify(result.data, null, 2)}
                            </pre>
                        </div>
                    </div>
                </Collapse.Panel>
            </Collapse>
        </div>
    );
};