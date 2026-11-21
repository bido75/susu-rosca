'use client';

import * as Sentry from '@sentry/nextjs';
import { replayIntegration, feedbackAsyncIntegration } from '@sentry/react';

// Runs once at module load on the client, guaranteeing the browser SDK is
// initialized before hydration regardless of Turbopack instrumentation quirks.
// (Sentry.init is idempotent; a second init is a no-op.)
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,

  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  integrations: [replayIntegration(), feedbackAsyncIntegration({ colorScheme: 'system' })],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Renders nothing; exists only to be imported by the root layout.
export default function SentryInit() {
  return null;
}