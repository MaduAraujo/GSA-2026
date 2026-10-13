import type * as SentryType from '@sentry/react';

let sentry: typeof SentryType | null = null;

export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || !import.meta.env.PROD) return;

  sentry = await import('@sentry/react');
  sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    integrations: [sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (sentry) {
    sentry.captureException(error, context ? { extra: context } : undefined);
  }
}

export function setMonitoringUser(userId: string | null) {
  sentry?.setUser(userId ? { id: userId } : null);
}
