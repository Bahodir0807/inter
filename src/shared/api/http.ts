import axios from 'axios';
import { env } from '../config/env';
import { ApiMeta } from '../types/api';
import { captureFrontendError } from '../lib/observability';
import { toast } from '../ui/feedback/toaster';

declare module 'axios' {
  interface AxiosResponse<T = any, D = any> {
    apiMeta?: ApiMeta;
  }
}

function unwrapEnvelope(payload: unknown): { data: unknown; meta?: ApiMeta } {
  if (
    payload
    && typeof payload === 'object'
    && 'success' in payload
    && 'data' in payload
  ) {
    const envelope = payload as { data: unknown; meta?: ApiMeta };
    return { data: envelope.data, meta: envelope.meta };
  }

  return { data: payload };
}

function getErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Request failed';
  }

  const status = error.response?.status;
  const body = error.response?.data as {
    message?: string | string[];
    error?: { message?: string; details?: string[] };
  } | undefined;
  const message = body?.message ?? body?.error?.message;
  const details = body?.error?.details;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (details?.length) {
    return details.join(', ');
  }

  if (message) {
    return message;
  }

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have access to this action.';
  if (status === 404) return 'The requested record was not found.';
  if (status && status >= 500) return 'Server error. Please try again later or contact support.';
  if (status === 429) return 'Too many requests. Please wait and try again.';
  if (!error.response) return 'Could not reach the server. Check your connection and try again.';

  return error.message || 'Request failed';
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || env.apiUrl,
  withCredentials: false,
});

let refreshPromise: Promise<string | null> | null = null;
let sessionExpired = false;

const publicRequests = [
  { method: 'post', path: '/auth/login' },
  { method: 'post', path: '/auth/register' },
  { method: 'post', path: '/auth/refresh' },
  { method: 'post', path: '/phone-request' },
  { method: 'get', path: '/phone-request' },
  { method: 'post', path: '/phone-request/tg-request' },
  { method: 'get', path: '/phone-request/tg-check' },
];

function getRequestPath(url?: string) {
  if (!url) {
    return '';
  }

  try {
    return new URL(url, env.apiUrl).pathname;
  } catch {
    return url;
  }
}

function isPublicRequest(config?: { method?: string; url?: string }) {
  const method = config?.method?.toLowerCase() ?? 'get';
  const path = getRequestPath(config?.url);
  return publicRequests.some(publicRequest => publicRequest.method === method && publicRequest.path === path);
}

function expireSession() {
  if (sessionExpired) {
    return;
  }

  localStorage.removeItem('neduco_auth_token');
  localStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionExpired = true;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ibrat:auth-expired'));
  }
}

async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios.post(`${env.apiUrl}/auth/refresh`, { refreshToken }, {
      headers: {
        'content-type': 'application/json',
      },
    })
      .then((response) => {
        const payload = unwrapEnvelope(response.data).data as { token?: string; accessToken?: string; refreshToken?: string };
        const nextAccessToken = payload.token ?? payload.accessToken ?? null;
        if (nextAccessToken) {
          localStorage.setItem('neduco_auth_token', nextAccessToken);
          localStorage.setItem('token', nextAccessToken);
          sessionExpired = false;
        }
        if (payload.refreshToken) {
          sessionStorage.setItem('refreshToken', payload.refreshToken);
        }
        return nextAccessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('neduco_auth_token') || localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    sessionExpired = false;
    return config;
  }

  if (!isPublicRequest(config)) {
    const error = new Error('Your session has expired. Please sign in again.');
    expireSession();
    return Promise.reject(error);
  }

  return config;
});

http.interceptors.response.use(
  (response) => {
    const unwrapped = unwrapEnvelope(response.data);
    response.data = unwrapped.data;
    response.apiMeta = unwrapped.meta;
    return response;
  },
  async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean };
      if (
        !sessionExpired
        && !originalRequest?._retry
        && !isPublicRequest(originalRequest)
        && sessionStorage.getItem('refreshToken')
      ) {
        originalRequest._retry = true;
        const nextToken = await refreshAccessToken();
        if (nextToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${nextToken}`;
          return http(originalRequest);
        }
      }

      expireSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    if (status === 403) {
      toast.error('У вас нет прав для этого действия');
    }

    if (status && status >= 500) {
      toast.error('Ошибка сервера. Пожалуйста, попробуйте позже или обратитесь в поддержку');
    }

    error.message = getErrorMessage(error);
    captureFrontendError(error, {
      status: error?.response?.status,
      requestId: error?.response?.headers ? error.response.headers['x-request-id'] : undefined,
      url: error?.config?.url,
    });
    return Promise.reject(error);
  },
);