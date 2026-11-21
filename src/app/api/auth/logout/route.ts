import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/auth';

export async function POST(req: Request) {
  const store = await cookies();
  const token = store.get('susuflow_session')?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });

  // Redirect to the PUBLIC origin (APP_URL), not the internal `req.url`, so the
  // user is sent to the real login page when served behind a tunnel/proxy.
  const base = process.env.APP_URL || new URL(req.url).origin;
  const res = NextResponse.redirect(new URL('/login', base), 303);
  res.cookies.delete('susuflow_session');
  return res;
}