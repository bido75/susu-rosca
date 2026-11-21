// Client-side Sentry SDK initialization. Per the SDK docs this file is the
// canonical client entry; the SentryInit component (mounted in the root layout)
// is a belt-and-suspenders guarantee that init runs before hydration under
// Next 16 Turbopack.
import * as Sentry from '@sentry/nextjs';
import { replayIntegration, feedbackAsyncIntegration } from '@sentry/react';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,

  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  integrations: [replayIntegration(), feedbackAsyncIntegration({ colorScheme: 'system' })],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;