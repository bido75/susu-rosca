import { execSync } from 'node:child_process';
import { E2E_DATABASE_URL } from './env';

export default function globalSetup() {
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: 'inherit',
  });
}
