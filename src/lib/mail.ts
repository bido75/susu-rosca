import { logger } from './logger';

/**
 * Sends a transactional email. Provider order:
 *
 * 1. Resend (recommended) — when RESEND_API_KEY + MAIL_FROM_ADDRESS are set.
 * 2. SMTP (nodemailer) — when SMTP_HOST is set (cPanel / self-hosted).
 * 3. Dev console log — when NODE_ENV is development and neither is configured.
 *
 * In production with no provider configured, it throws so the caller surfaces a
 * clear error rather than silently dropping auth links.
 */
export async function sendMail(opts: { to: string; subject: string; text: string }): Promise<void> {
  const { to, subject, text } = opts;

  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM || 'SusuFlow <onboarding@resend.dev>';
    const { data, error } = await resend.emails.send({ from, to: [to], subject, text });
    if (error) throw new Error(`Resend error: ${error.message}`);
    return;
  }

  if (process.env.SMTP_HOST) {
    const { default: nodemailer } = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    // Plain-text log (not JSON) so local dev and the E2E harness can read the
    // link/code directly from the server console.
    console.info(`[DEV ONLY] Email to ${to}: ${text}`);
    return;
  }

  throw new Error('Email delivery not configured');
}