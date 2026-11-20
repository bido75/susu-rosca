import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

const nextConfig: NextConfig = {
  // Allow the dev server to be reached at 127.0.0.1 (Docker/Playwright) rather
  // than only localhost, which Next.js otherwise blocks for dev-only resources.
  allowedDevOrigins: ['127.0.0.1'],
  // Auto-generated AGENTS.md is noise for this repo; keep the tree clean.
  agentRules: false,
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? 'v-and-j-web-design-and-hosting',
  project: process.env.SENTRY_PROJECT ?? 'susuflow',

  // Upload source maps (and pass a token when set) so production stack traces
  // stay readable. The auth token is secret and lives only in CI, never here.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print source-map upload logs in CI to keep dev output clean.
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces.
  widenClientFileUpload: true,
});
