import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from './styles.module.css';

interface FormHeaderProps {
    onAddRequest: () => void;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ onAddRequest }) => {
    return (
        <div className={styles.headerContainer}>
            <h1 className={styles.title}>HTTP Request Form</h1>
            
            <Button 
                type="primary" 
                onClick={onAddRequest}
                className={styles.addButton}
                icon={<PlusOutlined />}
                size="large"
            >
                Добавить запрос
            </Button>
        </div>
    );
};