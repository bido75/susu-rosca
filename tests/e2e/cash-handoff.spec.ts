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

async function register(browser: Browser, name: string, email: string): Promise<{ page: Page; name: string }> {
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
  return { page, name };
}

test('cash payout exception: request → approve+witness → three confirmations', async ({ browser }) => {
  test.setTimeout(900_000);

  const org = await register(browser, 'Cash Organizer', 'cash-org@example.com');
  org.page.on('dialog', (d) => d.accept());
  const members = [
    await register(browser, 'Cash Member Two', 'cash-m2@example.com'),
    await register(browser, 'Cash Member Three', 'cash-m3@example.com'),
    await register(browser, 'Cash Member Four', 'cash-m4@example.com'),
  ];

  // Organizer creates a 4-member circle.
  await org.page.goto('/circles/new');
  await org.page.getByPlaceholder('e.g., Family & Friends Savings').fill('Cash E2E');
  await org.page.locator('input[type="number"]').first().fill('500');
  await org.page.locator('select').first().selectOption('MONTHLY');
  await org.page.locator('input[type="number"]').nth(1).fill('4');
  await org.page.locator('input[type="date"]').fill('2030-01-05');
  await org.page.locator('select').nth(1).selectOption('LEDGER');
  await org.page.getByRole('button', { name: /Create Circle & Generate Invite/ }).click();
  await expect(org.page).toHaveURL(/\/circles\/[0-9a-f-]{36}\/wheel/);
  const circleUrl = org.page.url().replace(/\/wheel$/, '');
  const invite = await org.page.getByText(/SUSU-[0-9A-F]{16}/).innerText();

  for (const m of members) {
    await m.page.goto(`${APP_URL}/join/${invite}`);
    await m.page.getByRole('button', { name: 'Join this circle' }).click();
    await expect(m.page).toHaveURL(/\/circles\/[0-9a-f-]{36}/);
  }

  // Draw the payout order.
  await org.page.goto(`${circleUrl}/wheel`);
  await org.page.getByRole('button', { name: /Spin to Assign Payout Order/ }).click();
  await expect(org.page.getByText('0 unassigned')).toBeVisible({ timeout: 20_000 });

  // Find which member is the cycle-1 recipient: the one whose ledger shows the
  // "Request a cash payout" action (recipient-only). Wait for the ledger to load.
  const ledger = `${circleUrl}/ledger`;
  let recipient: { page: Page; name: string } | null = null;
  for (const m of members) {
    await m.page.goto(ledger);
    // Wait for the panel header, which renders only once the circle data is loaded.
    await m.page.getByText('Cash Payout Exception').first().waitFor({ timeout: 20_000 });
    const btn = m.page.getByRole('button', { name: 'Request a cash payout' });
    if (await btn.count()) {
      recipient = m;
      break;
    }
  }
  expect(recipient).not.toBeNull();

  // Pick an independent witness = first member who is not the recipient.
  const witness = members.find((m) => m.name !== recipient!.name)!;
  expect(witness.name).not.toBe(recipient!.name);

  // Recipient requests cash.
  await recipient!.page.getByRole('button', { name: 'Request a cash payout' }).click();
  await recipient!.page.getByLabel(/Reason/).fill('Testing the cash exception workflow');
  await recipient!.page.getByLabel(/Proposed handoff date/).fill('2030-01-06');
  await recipient!.page.getByLabel(/Safe handoff arrangement/).fill('Public library, well-lit area');
  await recipient!.page.getByRole('button', { name: 'Submit request' }).click();
  // The request form collapses and the request details (with the reason) appear.
  await expect(recipient!.page.getByText('Testing the cash exception workflow')).toBeVisible({ timeout: 20_000 });

  // Organizer approves + assigns the independent witness (select by name).
  await org.page.goto(ledger);
  await expect(org.page.getByText('Cash Payout Exception')).toBeVisible();
  await org.page.getByRole('combobox', { name: 'Choose an independent witness' }).selectOption({ label: witness.name });
  await org.page.getByRole('button', { name: 'Approve + assign witness' }).click();
  await expect(org.page.getByText('APPROVED')).toBeVisible({ timeout: 20_000 });

  // Recipient confirms receipt.
  await recipient!.page.goto(ledger);
  await recipient!.page.getByRole('button', { name: 'Confirm I received cash' }).click();

  // Witness confirms.
  await witness.page.goto(ledger);
  await witness.page.getByRole('button', { name: 'Confirm I witnessed it' }).click();

  // Organizer (payer) confirms handing over cash.
  await org.page.goto(ledger);
  await org.page.getByRole('button', { name: 'Confirm I handed over cash' }).click();

  await expect(org.page.getByText('All three confirmations recorded')).toBeVisible({ timeout: 20_000 });
});