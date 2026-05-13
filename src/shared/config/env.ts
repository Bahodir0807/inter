const fallbackEnvironment = 'prod';
const defaultApiUrl = 'https://ibrat-backend-hi7w.onrender.com';

function normalizeApiUrl(value: string | undefined) {
  const url = value?.trim() || defaultApiUrl;
  return url.replace(/\/+$/, '');
}

function normalizeEnvironment(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'development') return 'dev';
  if (normalized === 'production') return 'prod';
  if (normalized === 'staging') return 'qa';
  if (normalized === 'dev' || normalized === 'qa' || normalized === 'prod') return normalized;
  return fallbackEnvironment;
}

export const env = {
  apiUrl: normalizeApiUrl(import.meta.env.VITE_API_BASE_URL as string | undefined),
  appEnv: normalizeEnvironment(import.meta.env.VITE_APP_ENV as string | undefined),
  appVersion: (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || '0.0.0',
  buildHash: (import.meta.env.VITE_BUILD_HASH as string | undefined)?.trim() || 'local',
  sentryDsn: (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim() || '',
};
