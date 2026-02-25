import axios from 'axios';
import { Capacitor } from '@capacitor/core';

function getBaseURL(): string {
  if (Capacitor.isNativePlatform()) {
    // App Android — usa URL do Railway (permanente, sem precisar de computador)
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;
  }
  // Browser — usa proxy do Vite em dev, URL direta em produção
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }
  return '/api';
}

const api = axios.create({
  baseURL: getBaseURL()
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
