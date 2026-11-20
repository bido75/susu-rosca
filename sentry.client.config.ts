import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,

  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Tracing: 100% in dev, 10% in production (tune with traffic).
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  integrations: [
    // Session Replay — video-like reproduction of what users saw before an error.
    Sentry.replayIntegration(),
    // User Feedback — let users describe what happened on an error.
    Sentry.feedbackIntegration({ colorScheme: 'system' }),
  ],

  // Replay 10% of sessions, plus 100% of error sessions.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;