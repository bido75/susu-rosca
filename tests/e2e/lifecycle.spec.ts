import { test, expect, type Browser, type Page } from '@playwright/test';
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

type Session = { page: Page };

async function registerUser(browser: Browser, name: string, email: string): Promise<Session> {
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

async function submitOwnContribution(page: Page, ref: string) {
  await page.getByPlaceholder('External transaction reference').fill(ref);
  await page.getByRole('button', { name: 'Submit proof' }).click();
  await expect(page.getByRole('button', { name: 'Submit proof' })).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByPlaceholder('External transaction reference')).toHaveCount(0, { timeout: 20_000 });
}

async function verifyAllContributions(page: Page, expected: number) {
  const verify = page.getByRole('button', { name: 'Verify', exact: true });
  await expect(verify).toHaveCount(expected, { timeout: 20_000 });
  for (let i = 0; i < expected; i++) {
    await page.getByRole('button', { name: 'Verify', exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Verify', exact: true })).toHaveCount(expected - i - 1, { timeout: 20_000 });
  }
}

test('six-member monthly Susu lifecycle through the UI', async ({ browser }) => {
  // --- Register organizer + five members via email magic link ---
  const organizer = await registerUser(browser, 'Organizer One', 'organizer@e2e.test');
  organizer.page.on('dialog', (d) => d.accept());

  const members: Session[] = [];
  for (let i = 1; i <= 5; i++) {
    members.push(await registerUser(browser, `Member ${i}`, `member${i}@e2e.test`));
  }

  // --- Create the circle via the modal on /circles/new ---
  await organizer.page.goto('/circles/new');
  await organizer.page.getByPlaceholder('e.g., Family & Friends Savings').fill('Family & Friends Savings');
  await organizer.page.locator('input[type="number"]').first().fill('500');
  await organizer.page.locator('select').first().selectOption('MONTHLY');
  await organizer.page.locator('input[type="number"]').nth(1).fill('6');
  await organizer.page.locator('input[type="date"]').fill('2030-01-05');
  await organizer.page.locator('select').nth(1).selectOption('LEDGER');
  await organizer.page.getByRole('button', { name: /Create Circle & Generate Invite/ }).click();

  await expect(organizer.page).toHaveURL(/\/circles\/[0-9a-f-]{36}\/wheel/);
  const circleUrl = organizer.page.url().replace(/\/wheel$/, '');
  const invite = await organizer.page.getByText(/SUSU-[0-9A-F]{16}/).innerText();

  // --- Five members join via the invite code ---
  for (const m of members) {
    await m.page.goto(`${APP_URL}/join/${invite}`);
    await m.page.getByRole('button', { name: 'Join this circle' }).click();
    await expect(m.page).toHaveURL(/\/circles\/[0-9a-f-]{36}/);
  }

  await organizer.page.goto(circleUrl);
  await expect(organizer.page.getByText('6/6 members')).toBeVisible();

  // --- Organizer draws the payout order ---
  await organizer.page.goto(`${circleUrl}/wheel`);
  await organizer.page.getByRole('button', { name: /Spin to Assign Payout Order/ }).click();
  await expect(organizer.page.getByText('0 unassigned')).toBeVisible({ timeout: 20_000 });
  await expect(organizer.page.getByText('ACTIVE', { exact: true })).toBeVisible();

  // --- Run all six cycles ---
  for (let cycle = 1; cycle <= 6; cycle++) {
    for (let i = 0; i < members.length; i++) {
      await members[i].page.goto(`${circleUrl}/ledger`);
      await submitOwnContribution(members[i].page, `REF-${cycle}-${i + 1}`);
    }

    await organizer.page.goto(`${circleUrl}/ledger`);
    await submitOwnContribution(organizer.page, `REF-${cycle}-ORG`);
    await verifyAllContributions(organizer.page, 6);

    await organizer.page.getByPlaceholder('Confirmed external payout reference').fill(`PAYOUT-CYCLE-${cycle}`);
    const disburseBtn = organizer.page.getByRole('button', { name: /Confirm External Payout/ });
    await expect(disburseBtn).toBeEnabled({ timeout: 20_000 });
    await disburseBtn.click();

    if (cycle < 6) {
      await expect(organizer.page.getByText(`Cycle ${cycle + 1} of 6`).first()).toBeVisible({ timeout: 20_000 });
    } else {
      await expect(organizer.page.getByText('COMPLETED', { exact: true })).toBeVisible({ timeout: 20_000 });
    }
  }

  // --- Completion + persistence + audit ---
  await organizer.page.goto(circleUrl);
  await expect(organizer.page.getByText('COMPLETED', { exact: true })).toBeVisible();
  await organizer.page.reload();
  await expect(organizer.page.getByText('COMPLETED', { exact: true })).toBeVisible();

  await organizer.page.goto('/admin/audit');
  await expect(organizer.page.getByText('Organizer Audit Trail')).toBeVisible();
  for (const action of ['CIRCLE_CREATED', 'SLOTS_DRAWN', 'PAYMENT_VERIFIED', 'POT_DISBURSEMENT_RECORDED']) {
    await expect(organizer.page.getByText(action).first()).toBeVisible();
  }
});
