import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomBytes, createHash } from 'node:crypto';

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
  }),
}));

import { db } from '@/lib/db';
import { POST as createMethod, GET as listMethods } from '@/app/api/profile/payout-methods/route';
import { PATCH as patchMethod } from '@/app/api/profile/payout-methods/[id]/route';
import { POST as setPreferred } from '@/app/api/profile/payout-methods/[id]/preferred/route';
import { normalizeIdentifier } from '@/lib/payoutMethods';

type Json = Record<string, unknown>;
const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');
const sessionTokens = new Map<string, string>();

async function issueSession(userId: string) {
  const raw = randomBytes(32).toString('hex');
  await db.session.create({ data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 3600_000) } });
  sessionTokens.set(userId, raw);
}
function loginAs(userId: string) {
  const raw = sessionTokens.get(userId);
  if (raw) cookieJar.set('susuflow_session', raw);
}

type Handler = (req: Request, ctx?: any) => Promise<Response>;

async function call(fn: Handler, opts: { method?: string; params?: Record<string, string>; body?: unknown } = {}) {
  const method = opts.method ?? 'POST';
  const req = new Request('http://localhost/api/x', {
    method,
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const res = await fn(req, { params: Promise.resolve(opts.params ?? {}) });
  return { status: res.status, json: (await res.json()) as Json };
}

describe('payout receiving methods (Phases 2-3)', () => {
  let userA: { id: string };
  let userB: { id: string };

  beforeAll(async () => {
    userA = await db.user.create({ data: { email: 'pa@example.com', fullName: 'Payer A' } });
    userB = await db.user.create({ data: { email: 'pb@example.com', fullName: 'Payer B' } });
    await issueSession(userA.id);
    await issueSession(userB.id);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('normalizes and validates Zelle / Cash App / Venmo identifiers', () => {
    expect(normalizeIdentifier('ZELLE', 'Elena@Example.com').value).toBe('elena@example.com');
    expect(normalizeIdentifier('CASHAPP', '$janedoe').value).toBe('$janedoe');
    expect(normalizeIdentifier('VENMO', '@janedoe').value).toBe('@janedoe');
    expect(() => normalizeIdentifier('CASHAPP', 'not a cashtag!')).toThrow();
    expect(() => normalizeIdentifier('ACH', '123456789')).toThrow();
    expect(() => normalizeIdentifier('CASH', 'cash')).toThrow();
  });

  it('creates and lists the member\'s own Zelle method', async () => {
    loginAs(userA.id);
    const res = await call(createMethod, { method: 'POST', body: { kind: 'ZELLE', identifier: 'elena@example.com', confirm: true } });
    expect(res.status).toBe(201);
    const methodId = (res.json.method as any).id as string;
    expect(methodId).toBeTruthy();

    const list = await call(listMethods, { method: 'GET' });
    expect(list.status).toBe(200);
    expect((list.json.methods as any[]).some((m) => m.id === methodId && m.kind === 'ZELLE' && m.status === 'CONFIRMED')).toBe(true);
  });

  it('rejects an ACH method (no provider)', async () => {
    loginAs(userA.id);
    const res = await call(createMethod, { method: 'POST', body: { kind: 'ACH', identifier: 'x' } });
    expect(res.status).toBe(400);
  });

  it('prevents one member from editing another member\'s method', async () => {
    const mine = await db.payoutReceivingMethod.findFirst({ where: { userId: userA.id } });
    loginAs(userB.id);
    const res = await call(patchMethod, { method: 'PATCH', params: { id: mine!.id }, body: { status: 'DISABLED' } });
    expect(res.status).toBe(404);
  });

  it('lets a member set a confirmed method as preferred', async () => {
    loginAs(userA.id);
    const mine = await db.payoutReceivingMethod.findFirst({ where: { userId: userA.id } });
    const res = await call(setPreferred, { method: 'POST', params: { id: mine!.id } });
    expect(res.status).toBe(200);
    const updated = await db.payoutReceivingMethod.findUniqueOrThrow({ where: { id: mine!.id } });
    expect(updated.isPreferred).toBe(true);
  });
});