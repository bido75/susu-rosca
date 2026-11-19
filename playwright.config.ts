import { defineConfig, devices } from '@playwright/test';
import { E2E_DATABASE_URL, APP_URL, SERVER_LOG, APP_PORT } from './tests/e2e/env';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 600_000,
  expect: { timeout: 15_000 },
  globalSetup: './tests/e2e/global-setup.ts',
  reporter: [['list']],
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next dev -p ${APP_PORT} > ${SERVER_LOG} 2>&1`,
    url: APP_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      APP_URL,
      NODE_ENV: 'development',
    },
  },
});
