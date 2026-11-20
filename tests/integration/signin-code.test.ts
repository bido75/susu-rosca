import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const { cookieJar } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    cookieJar: {
      set: (k: string, v: string) => store.set(k, v),
      get: (k: string) => store.get(k),
      delete: (k: string) => store.delete(k),
    },
  };
});

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => (cookieJar.get(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

import { db } from '@/lib/db';
import { hashToken } from '@/lib/auth';
import { POST as requestLink } from '@/app/api/auth/request-link/route';
import { POST as verifyCode } from '@/app/api/auth/verify-code/route';

type Handler = (req: Request, ctx?: any) => Promise<Response>;

async function post(fn: Handler, body: unknown) {
  const req = new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const res = await fn(req, { params: {} });
  return { status: res.status, json: (await res.json()) as Record<string, unknown>, headers: res.headers };
}

async function createUserWithCode(email: string, code: string) {
  const user = await db.user.create({ data: { email, fullName: 'Code User' } });
  await db.magicLink.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(`token-${email}`),
      codeHash: hashToken(code),
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  return user;
}

describe('sign-in code authentication', () => {
  beforeAll(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('issues a hashed sign-in code via request-link', async () => {
    const res = await post(requestLink, { email: 'code@example.com', fullName: 'Code User' });
    expect(res.status).toBe(200);
    const link = await db.magicLink.findFirst({ where: { user: { email: 'code@example.com' } } });
    expect(link).not.toBeNull();
    expect(link!.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('signs in with a correct code and creates a session', async () => {
    const user = await createUserWithCode('ok@example.com', '123456');
    const res = await post(verifyCode, { email: 'ok@example.com', code: '123456' });
    expect(res.status).toBe(200);
    expect(await db.session.count({ where: { userId: user.id } })).toBe(1);
    expect(res.headers.get('set-cookie')).toContain('susuflow_session');
  });

  it('rejects a wrong code and increments attempts', async () => {
    const user = await createUserWithCode('wrong@example.com', '111111');
    const res = await post(verifyCode, { email: 'wrong@example.com', code: '999999' });
    expect(res.status).toBe(401);
    const link = await db.magicLink.findFirst({ where: { userId: user.id } });
    expect(link!.attempts).toBe(1);
  });

  it('rejects a consumed code', async () => {
    const user = await createUserWithCode('reuse@example.com', '222222');
    await post(verifyCode, { email: 'reuse@example.com', code: '222222' });
    const res = await post(verifyCode, { email: 'reuse@example.com', code: '222222' });
    expect(res.status).toBe(401);
  });

  it('rejects an expired code', async () => {
    const user = await db.user.create({ data: { email: 'expired@example.com', fullName: 'Expired' } });
    await db.magicLink.create({
      data: {
        userId: user.id,
        tokenHash: hashToken('token-expired'),
        codeHash: hashToken('333333'),
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const res = await post(verifyCode, { email: 'expired@example.com', code: '333333' });
    expect(res.status).toBe(401);
  });

  it('locks a code after too many failed attempts', async () => {
    const user = await createUserWithCode('locked@example.com', '444444');
    for (let i = 0; i < 5; i++) {
      await post(verifyCode, { email: 'locked@example.com', code: '000000' });
    }
    const res = await post(verifyCode, { email: 'locked@example.com', code: '444444' });
    expect(res.status).toBe(401);
  });
});
