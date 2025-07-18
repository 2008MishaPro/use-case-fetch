import axios, {type AxiosResponse, AxiosError } from 'axios';

export const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

// Интерцептор для обработки ответов
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);