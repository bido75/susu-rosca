import { cookies } from 'next/headers';
import { db } from './db';
import { hashToken, newToken, newCode } from './tokens';

export { hashToken, newToken, newCode };

export async function currentUser() {
  const store = await cookies();
  const token = store.get('susuflow_session')?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  return session && session.expiresAt > new Date() ? session.user : null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new ApiError(401, 'Please sign in.');
  return user;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function cookieOptions(expires: Date) {
  // Secure by default in production. Set COOKIE_SECURE=false to serve over
  // plain HTTP (e.g. local Docker at http://127.0.0.1:3210).
  const secure =
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production';
  return { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', expires };
}