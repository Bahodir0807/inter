import axios from 'axios';
import { env } from '../config/env';
import { ApiMeta } from '../types/api';
import { captureFrontendError, createRequestId } from '../lib/observability';

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
  if (status === 429) return 'Too many requests. Please wait and try again.';

  return error.message || 'Request failed';
}

export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: false,
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios.post(`${env.apiUrl}/auth/refresh`, { refreshToken }, {
      headers: {
        'content-type': 'application/json',
        'X-Request-Id': createRequestId(),
      },
    })
      .then((response) => {
        const payload = unwrapEnvelope(response.data).data as { token?: string; accessToken?: string; refreshToken?: string };
        const nextAccessToken = payload.token ?? payload.accessToken ?? null;
        if (nextAccessToken) {
          localStorage.setItem('token', nextAccessToken);
        }
        if (payload.refreshToken) {
          localStorage.setItem('refreshToken', payload.refreshToken);
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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers = config.headers ?? {};
  config.headers['X-Request-Id'] = String(config.headers['X-Request-Id'] ?? createRequestId());

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
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean };
      if (!originalRequest?._retry && originalRequest?.url !== '/auth/refresh') {
        originalRequest._retry = true;
        const nextToken = await refreshAccessToken();
        if (nextToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${nextToken}`;
          return http(originalRequest);
        }
      }

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }

    error.message = getErrorMessage(error);
    captureFrontendError(error, {
      status: axios.isAxiosError(error) ? error.response?.status : undefined,
      requestId: axios.isAxiosError(error) ? error.response?.headers?.['x-request-id'] : undefined,
      url: axios.isAxiosError(error) ? error.config?.url : undefined,
    });
    return Promise.reject(error);
  },
);
