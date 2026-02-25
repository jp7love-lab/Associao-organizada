import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const RAILWAY_URL = 'https://amfac-backend-production.up.railway.app';

function getBaseURL(): string {
  if (Capacitor.isNativePlatform()) {
    return `${RAILWAY_URL}/api`;
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
