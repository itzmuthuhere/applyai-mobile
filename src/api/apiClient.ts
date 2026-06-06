import axios from 'axios';
import { getJwt, clearJwt } from '../utils/auth';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getJwt();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// onUnauthorized is set by AppNavigator so apiClient can trigger logout navigation
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearJwt();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
