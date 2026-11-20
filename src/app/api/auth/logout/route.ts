import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/auth';

export async function POST(req: Request) {
  const store = await cookies();
  const token = store.get('susuflow_session')?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  const res = NextResponse.redirect(new URL('/login', req.url), 303);
  res.cookies.delete('susuflow_session');
  return res;
}