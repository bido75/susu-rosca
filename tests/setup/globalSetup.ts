import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './testConfig';

/**
 * Reset the disposable test database to a clean, fully-migrated state
 * before every test run. Runs `prisma migrate reset` so the migration's
 * CHECK constraints and append-only audit trigger are present.
 */
export default function globalSetup() {
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}
