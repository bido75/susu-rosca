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
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

import { db } from '@/lib/db';
import { hashToken } from '@/lib/auth';
import { POST as createCircle } from '@/app/api/circles/route';
import { POST as joinCircle } from '@/app/api/circles/[id]/join/route';
import { POST as drawSlots } from '@/app/api/circles/[id]/draw/route';
import { POST as markDefault } from '@/app/api/circles/[id]/default/route';
import { POST as remind } from '@/app/api/circles/[id]/remind/route';

type Handler = (req: Request, ctx?: any) => Promise<Response>;
async function post(fn: Handler, opts: { params?: Record<string, string>; body?: unknown } = {}) {
  const req = new Request('http://localhost/api/x', {
    method: 'POST',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const res = await fn(req, { params: Promise.resolve(opts.params ?? {}) });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

const sessions = new Map<string, string>();
async function issueSession(userId: string) {
  const raw = randomBytes(32).toString('hex');
  await db.session.create({ data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 3600_000) } });
  sessions.set(userId, raw);
}
function loginAs(id: string) { cookieJar.set('susuflow_session', sessions.get(id)!); }
async function createUser(email: string) {
  const u = await db.user.create({ data: { email, fullName: email.split('@')[0] } });
  await issueSession(u.id);
  return u;
}

describe('default & reminder lifecycle', () => {
  let organizer: { id: string };
  let member: { id: string };
  let circleId = '';

  beforeAll(async () => { vi.stubEnv('NODE_ENV', 'development'); cookieJar.delete('susuflow_session'); });
  afterAll(async () => { await db.$disconnect(); });

  it('defaults a member and applies -10 exactly once', async () => {
    organizer = await createUser('dr-org@example.com');
    member = await createUser('dr-member@example.com');

    loginAs(organizer.id);
    const c = await post(createCircle, { body: { name: 'Default Circle', contributionAmount: 100, frequency: 'MONTHLY', totalCycles: 2, mode: 'LEDGER', startDate: '2030-01-05' } });
    circleId = (c.json.circle as any).id;

    loginAs(member.id);
    await post(joinCircle, { params: { id: circleId }, body: { code: (c.json.circle as any).inviteCode } });

    loginAs(organizer.id);
    await post(drawSlots, { params: { id: circleId } });

    const cycle = await db.cycle.findUniqueOrThrow({ where: { circleId_cycleNumber: { circleId, cycleNumber: 1 } } });
    const contrib = await db.contribution.findUniqueOrThrow({ where: { cycleId_userId: { cycleId: cycle.id, userId: member.id } } });
    const before = (await db.user.findUniqueOrThrow({ where: { id: member.id } })).susuTrustScore;

    const r1 = await post(markDefault, { params: { id: circleId }, body: { contributionId: contrib.id } });
    expect(r1.status).toBe(200);
    expect((r1.json as any).already).toBe(false);

    const c1 = await db.contribution.findUniqueOrThrow({ where: { id: contrib.id } });
    expect(c1.status).toBe('DEFAULTED');

    const after = (await db.user.findUniqueOrThrow({ where: { id: member.id } })).susuTrustScore;
    expect(after).toBe(before - 10);

    // Idempotent: second default does not apply another -10.
    const r2 = await post(markDefault, { params: { id: circleId }, body: { contributionId: contrib.id } });
    expect(r2.status).toBe(200);
    expect((r2.json as any).already).toBe(true);
    const after2 = (await db.user.findUniqueOrThrow({ where: { id: member.id } })).susuTrustScore;
    expect(after2).toBe(after);
  });

  it('lets the organizer send a reminder (organizer-only)', async () => {
    loginAs(organizer.id);
    const r = await post(remind, { params: { id: circleId }, body: { userId: member.id } });
    expect(r.status).toBe(200);

    // Non-organizer is rejected.
    loginAs(member.id);
    const denied = await post(remind, { params: { id: circleId }, body: { userId: organizer.id } });
    expect(denied.status).toBe(403);
  });
});