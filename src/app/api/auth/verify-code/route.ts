import { z } from 'zod';
import { db } from '@/lib/db';
import { hashToken, newToken, cookieOptions, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { rateLimit, clientKey } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    rateLimit(clientKey(req, 'auth:verify-code'), 20);
    const { email, code } = z
      .object({ email: z.email().max(255), code: z.string().regex(/^\d{6}$/) })
      .parse(await req.json());
    const normalized = email.trim().toLowerCase();
    const raw = newToken();
    const expiry = new Date(Date.now() + 7 * 86400000);

    const accepted = await db.$transaction(async (tx) => {
      const link = await tx.magicLink.findFirst({
        where: { user: { email: normalized }, codeHash: { not: null }, usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!link) return false;

      if (link.codeHash !== hashToken(code)) {
        const attempts = link.attempts + 1;
        await tx.magicLink.update({
          where: { id: link.id },
          data: attempts >= MAX_ATTEMPTS ? { attempts, usedAt: new Date() } : { attempts },
        });
        return false;
      }

      await tx.magicLink.update({ where: { id: link.id }, data: { usedAt: new Date() } });
      await tx.session.create({ data: { userId: link.userId, tokenHash: hashToken(raw), expiresAt: expiry } });
      return true;
    });

    if (!accepted) throw new ApiError(401, 'Invalid or expired sign-in code.');

    const res = success({ ok: true });
    res.cookies.set('susuflow_session', raw, cookieOptions(expiry));
    return res;
  } catch (e) {
    return failure(e);
  }
}
