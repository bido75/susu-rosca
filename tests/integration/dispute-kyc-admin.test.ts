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
import { POST as raiseDispute } from '@/app/api/circles/[id]/disputes/route';
import { POST as resolveDispute } from '@/app/api/circles/[id]/disputes/[disputeId]/resolve/route';
import { POST as setKyc } from '@/app/api/admin/users/[userId]/kyc/route';
import { POST as requestKyc } from '@/app/api/profile/kyc-request/route';

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

describe('disputes, KYC, and admin role', () => {
  let organizer: { id: string };
  let member: { id: string };
  let admin: { id: string };
  let adminEmail = 'admin@example.com';
  let circleId = '';
  let disputeId = '';

  beforeAll(async () => { vi.stubEnv('NODE_ENV', 'development'); cookieJar.delete('susuflow_session'); });
  afterAll(async () => { await db.$disconnect(); });

  it('raises and resolves a dispute', async () => {
    organizer = await createUser('dk-org@example.com');
    member = await createUser('dk-member@example.com');
    admin = await createUser(adminEmail);
    await db.user.update({ where: { id: admin.id }, data: { isAdmin: true, email: adminEmail } });

    loginAs(organizer.id);
    const c = await post(createCircle, { body: { name: 'Dispute Circle', contributionAmount: 100, frequency: 'MONTHLY', totalCycles: 2, mode: 'LEDGER', startDate: '2030-01-05' } });
    circleId = (c.json.circle as any).id;
    loginAs(member.id);
    await post(joinCircle, { params: { id: circleId }, body: { code: (c.json.circle as any).inviteCode } });
    loginAs(organizer.id);
    await post(drawSlots, { params: { id: circleId } });

    loginAs(member.id);
    const r = await post(raiseDispute, { params: { id: circleId }, body: { description: 'I believe my contribution was misrecorded' } });
    expect(r.status).toBe(201);
    disputeId = (r.json.dispute as any).id;

    const open = await db.dispute.findMany({ where: { circleId, status: 'OPEN' } });
    expect(open).toHaveLength(1);

    loginAs(organizer.id);
    const resol = await post(resolveDispute, { params: { id: circleId, disputeId }, body: { resolution: 'Verified and corrected' } });
    expect(resol.status).toBe(200);

    const d = await db.dispute.findUniqueOrThrow({ where: { id: disputeId } });
    expect(d.status).toBe('RESOLVED');
    expect(d.resolution).toBe('Verified and corrected');
  });

  it('requires organizer (not member) to resolve a dispute', async () => {
    loginAs(member.id);
    const r = await post(raiseDispute, { params: { id: circleId }, body: { description: 'another dispute raised' } });
    const d2 = (r.json.dispute as any).id;
    const resol = await post(resolveDispute, { params: { id: circleId, disputeId: d2 }, body: { resolution: 'not allowed' } });
    expect(resol.status).toBe(403);
  });

  it('enforces the admin role for KYC changes', async () => {
    // A normal member cannot set KYC.
    loginAs(member.id);
    const denied = await post(setKyc, { params: { userId: member.id }, body: { kycStatus: 'VERIFIED' } });
    expect(denied.status).toBe(403);

    // An admin can.
    loginAs(admin.id);
    const r = await post(setKyc, { params: { userId: member.id }, body: { kycStatus: 'VERIFIED' } });
    expect(r.status).toBe(200);
    const u = await db.user.findUniqueOrThrow({ where: { id: member.id } });
    expect(u.kycStatus).toBe('VERIFIED');
  });

  it('lets any user request verification (UNVERIFIED -> PENDING)', async () => {
    loginAs(organizer.id);
    const r = await post(requestKyc, {});
    expect(r.status).toBe(200);
    const u = await db.user.findUniqueOrThrow({ where: { id: organizer.id } });
    expect(u.kycStatus).toBe('PENDING');
  });
});