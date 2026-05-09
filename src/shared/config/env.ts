const fallbackEnvironment = 'prod';
const localApiUrl = 'http://localhost:3000';
const productionApiUrl = 'https://b.sultonoway.uz';

function normalizeApiUrl(value: string | undefined) {
  const fallbackApiUrl = import.meta.env.DEV ? localApiUrl : productionApiUrl;
  const url = value?.trim() || fallbackApiUrl;
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
  apiUrl: normalizeApiUrl(import.meta.env.VITE_API_URL as string | undefined),
  appEnv: normalizeEnvironment(import.meta.env.VITE_APP_ENV as string | undefined),
  appVersion: (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || '0.0.0',
  buildHash: (import.meta.env.VITE_BUILD_HASH as string | undefined)?.trim() || 'local',
  sentryDsn: (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim() || '',
};
