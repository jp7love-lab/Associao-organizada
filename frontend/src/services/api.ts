import axios from 'axios';
import { Capacitor } from '@capacitor/core';

function getBaseURL(): string {
  if (Capacitor.isNativePlatform()) {
    // URL pública via Cloudflare Tunnel - sem precisar de firewall
    return 'https://chris-retailer-farmer-tradition.trycloudflare.com/api';
  }
  return '/api';
}

const api = axios.create({
  baseURL: getBaseURL()
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('amfac_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('amfac_token');
        localStorage.removeItem('amfac_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
