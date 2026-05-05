import axios from 'axios';
import { env } from '../config/env';

function unwrapEnvelope(payload: unknown) {
  if (
    payload
    && typeof payload === 'object'
    && 'success' in payload
    && 'data' in payload
  ) {
    return (payload as { data: unknown }).data;
  }

  return payload;
}

function getErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Request failed';
  }

  const status = error.response?.status;
  const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (message) {
    return message;
  }

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have access to this action.';
  if (status === 429) return 'Too many requests. Please wait and try again.';

  return error.message || 'Request failed';
}

export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: false,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => {
    response.data = unwrapEnvelope(response.data);
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }

    error.message = getErrorMessage(error);
    return Promise.reject(error);
  },
);
