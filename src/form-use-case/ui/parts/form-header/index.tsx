import React from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from './styles.module.css';

const { Title } = Typography;

interface FormHeaderProps {
    onAddRequest: () => void;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ onAddRequest }) => {
    return (
        <div className={styles.headerContainer}>
            <Title level={2}>HTTP Request Form</Title>
            
            <Button 
                type="primary" 
                onClick={onAddRequest}
                className={styles.addButton}
                icon={<PlusOutlined />}
            >
                Добавить запрос
            </Button>
        </div>
    );
};