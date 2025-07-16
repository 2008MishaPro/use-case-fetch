import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Интерцептор для обработки ответов
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);