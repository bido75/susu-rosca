// This file is imported by Next.js to initialize the client Sentry SDK.
// It must live under src/ (alongside instrumentation.ts at root) and re-export
// the router-transition hook for Next to use.
import { onRouterTransitionStart } from '../sentry.client.config';

export { onRouterTransitionStart };