import axios from 'axios';
import { env } from '../config/env';
import { mapApiError } from './errors';
import { normalizeIds } from './normalize';
import { clearStoredToken, getStoredToken } from './token-storage';

export const http = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use(config => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  response => {
    response.data = normalizeIds(response.data);
    return response;
  },
  error => {
    const mappedError = mapApiError(error);

    if (mappedError.statusCode === 401) {
      clearStoredToken();
    }

    return Promise.reject(mappedError);
  },
);
