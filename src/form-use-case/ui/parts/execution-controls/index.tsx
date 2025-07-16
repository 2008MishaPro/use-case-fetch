import React from 'react';
import { Space, Button } from 'antd';
import styles from './styles.module.css';

interface ExecutionControlsProps {
    onExecute: () => void;
    onReset: () => void;
    isExecuting: boolean;
    hasRequests: boolean;
}

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({ 
    onExecute, 
    onReset, 
    isExecuting, 
    hasRequests 
}) => {
    return (
        <Space className={styles.controlsContainer}>
            <Button 
                type="primary" 
                onClick={onExecute}
                loading={isExecuting}
                disabled={!hasRequests}
                size="large"
            >
                Выполнить Use-Case
            </Button>
            <Button 
                onClick={onReset}
                disabled={isExecuting}
            >
                Сбросить
            </Button>
        </Space>
    );
};