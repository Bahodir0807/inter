import { env } from '../config/env';

type ObservabilityContext = Record<string, unknown>;

export function createRequestId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function initObservability() {
  if (!env.sentryDsn) {
    return;
  }

  window.dispatchEvent(new CustomEvent('ibrat:observability-ready', {
    detail: {
      provider: 'sentry',
      dsnConfigured: true,
      environment: env.appEnv,
      release: `${env.appVersion}+${env.buildHash}`,
    },
  }));
}

export function captureFrontendError(error: unknown, context: ObservabilityContext = {}) {
  const payload = {
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    context,
    environment: env.appEnv,
    release: `${env.appVersion}+${env.buildHash}`,
  };

  window.dispatchEvent(new CustomEvent('ibrat:frontend-error', { detail: payload }));

  if (!env.sentryDsn) {
    return;
  }

  // Integration point: initialize Sentry in initObservability and forward payload here.
}
