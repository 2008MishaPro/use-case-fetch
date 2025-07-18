import React from 'react';
import { Input } from 'antd';
import { reatomComponent } from '@reatom/npm-react';
import { baseUrlAtom } from '../../../model';
import styles from './styles.module.css';

export const UrlInput = reatomComponent(({ ctx }) => {
    const baseUrl = ctx.spy(baseUrlAtom);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        baseUrlAtom(ctx, e.target.value);
    };

    return (
        <div className={styles.container}>
            <div className={styles.label}>Базовый URL API:</div>
            <Input
                placeholder="Введите базовый URL (например: http://path/api)"
                value={baseUrl}
                onChange={handleUrlChange}
                className={styles.urlInput}
                size="large"
            />
        </div>
    );
});