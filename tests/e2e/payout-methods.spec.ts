import { test, expect, type Browser } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { APP_URL, SERVER_LOG } from './env';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function readMagicLink(email: string): Promise<string> {
  const re = new RegExp(`Magic link for ${escapeRegExp(email)}: (${escapeRegExp(APP_URL)}/api/auth/verify\\?token=[0-9a-f]+)`);
  for (let i = 0; i < 60; i++) {
    if (existsSync(SERVER_LOG)) {
      const log = readFileSync(SERVER_LOG, 'utf8');
      const m = log.match(re);
      if (m) return m[1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No magic link found in server log for ${email}`);
}

async function registerUser(browser: Browser, name: string, email: string) {
  const context = await browser.newContext({ baseURL: APP_URL });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByLabel('Full name (new accounts)').fill(name);
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: /Send secure sign-in link/ }).click();
  await expect(page.getByText(/sign-in link has been sent/i)).toBeVisible();
  const link = await readMagicLink(email);
  await page.goto(link);
  await expect(page).toHaveURL(/\/circles/);
  return { page };
}

test('member registers a Zelle payout method on their profile', async ({ browser }) => {
  const { page } = await registerUser(browser, 'Payout Test User', 'payout-e2e@example.com');

  await page.goto('/profile');
  await expect(page.getByText('My Payout Methods')).toBeVisible();

  // Add a Zelle receiving method.
  await page.getByRole('button', { name: 'Add another method' }).click();
  await page.getByLabel('Method').selectOption('ZELLE');
  await page.getByLabel(/Receiving identifier/).fill('payout-e2e@example.com');
  await page.getByRole('button', { name: 'Save method' }).click();

  // The new method appears with its identifier and member confirmation status.
  await expect(page.getByText('payout-e2e@example.com')).toBeVisible();
  await expect(page.getByText('Member Confirmed')).toBeVisible();
  await expect(page.getByText('Add another method')).toBeVisible(); // form collapsed again
});