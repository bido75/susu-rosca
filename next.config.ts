import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow the dev server to be reached at 127.0.0.1 (Docker/Playwright) rather
  // than only localhost, which Next.js otherwise blocks for dev-only resources.
  allowedDevOrigins: ['127.0.0.1'],
  // Auto-generated AGENTS.md is noise for this repo; keep the tree clean.
  agentRules: false,
};

export default nextConfig;
