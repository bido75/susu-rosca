// Client-side Sentry SDK initialization. Per the SDK docs this file is the
// canonical client entry; the SentryInit component (mounted in the root layout)
// is a belt-and-suspenders guarantee that init runs before hydration under
// Next 16 Turbopack.
import * as Sentry from '@sentry/nextjs';
import { replayIntegration, feedbackIntegration } from '@sentry/react';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,

  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  integrations: [
    replayIntegration(),
    // User Feedback ("Report a bug"). We disable the auto-injected floating
    // button and instead attach the widget to our own in-app buttons (see
    // components/ReportBugButton) so it never overlaps the mobile bottom nav
    // or the sidebar account actions. The synchronous integration is used (not
    // feedbackAsyncIntegration) so the widget loads eagerly and always works.
    feedbackIntegration({
      autoInject: false,
      colorScheme: 'system',
      enableScreenshot: true,
      isNameRequired: false,
      isEmailRequired: false,
      formTitle: 'Report an issue',
    }),
  ],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;