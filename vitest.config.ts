import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { TEST_DATABASE_URL } from './tests/setup/testConfig';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/setup/globalSetup.ts'],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      APP_URL: 'http://localhost:3000',
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: 'forks',
  },
});
