import { z } from 'zod';
import { db } from '@/lib/db';
import { newToken, newCode, hashToken, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    rateLimit(clientKey(req, 'auth:request-link'), 30);
    const { email, fullName } = z
      .object({ email: z.email().max(255), fullName: z.string().min(2).max(100).optional() })
      .parse(await req.json());
    const normalized = email.trim().toLowerCase();

    const recent = await db.magicLink.count({
      where: { user: { email: normalized }, createdAt: { gt: new Date(Date.now() - 60 * 60_000) } },
    });
    if (recent >= 5) throw new ApiError(429, 'Too many sign-in requests. Please try again later.');

    const user = await db.user.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized, fullName: fullName?.trim() || normalized.split('@')[0] },
    });

    // Invalidate any previously issued, unused links/codes for this user.
    await db.magicLink.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });

    const token = newToken();
    const code = newCode();
    await db.magicLink.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        codeHash: hashToken(code),
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const link = `${appUrl}/api/auth/verify?token=${token}`;
    const body = `Your secure sign-in link (expires in 15 minutes): ${link}\n\nYour one-time sign-in code (expires in 15 minutes): ${code}`;

    if (process.env.SMTP_HOST) {
      // nodemailer v7+ is ESM-only; load it dynamically so this route works
      // regardless of the bundle format.
      const { default: nodemailer } = await import('nodemailer');
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });
      await transport.sendMail({ from: process.env.SMTP_FROM, to: normalized, subject: 'Sign in to SusuFlow', text: body });
    } else if (process.env.NODE_ENV === 'development') {
      console.info(`[DEV ONLY] Magic link for ${normalized}: ${link}`);
      console.info(`[DEV ONLY] Sign-in code for ${normalized}: ${code}`);
    } else {
      throw new Error('SMTP delivery not configured');
    }

    return success({
      message:
        'If this address can receive mail, a sign-in link has been sent. Your one-time sign-in code was also sent. ' +
        (process.env.SMTP_HOST ? 'Check your inbox.' : 'In local development without SMTP, check the terminal.'),
    });
  } catch (e) {
    return failure(e);
  }
}
