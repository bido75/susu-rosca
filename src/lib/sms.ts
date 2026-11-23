import { logger } from './logger';

/**
 * Send an SMS via Twilio (the de-facto standard provider with a free trial) using
 * its plain REST API — no `twilio` package needed. Provider-agnostic by design:
 * swap the body below for Telnyx/Vonage/etc. without touching callers.
 *
 * Requires TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM. When unset:
 *   - development → logs to console (so the E2E/dev flow is visible),
 *   - production  → silently skips (SMS delivery is opt-in and must never block
 *     or fail a financial mutation).
 */
export async function sendSms(to: string, text: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  if (!sid || !token || !from) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[DEV ONLY] SMS to ${to}: ${text}`);
    }
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
  const body = new URLSearchParams({ To: to, From: from, Body: text });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Twilio error ${res.status}: ${detail.slice(0, 200)}`);
  }
  logger.info('SMS sent', { to });
}
