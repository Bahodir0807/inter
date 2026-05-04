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

    // 401: Unauthorized - clear token and redirect to login (automatic via auth store)
    if (mappedError.statusCode === 401) {
      clearStoredToken();
    }

    // 403: Forbidden - user lacks permissions (handled by UI error state)
    // 429: Rate limit - request throttled (handled by UI error state)
    // All other errors propagated to caller for handling

    return Promise.reject(mappedError);
  },
);
