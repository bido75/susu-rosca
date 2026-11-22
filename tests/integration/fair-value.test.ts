import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { randomBytes, createHash } from 'node:crypto';

// --- Mock next/headers so server-side auth works under Vitest (node) ---
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
import { POST as createCircle } from '@/app/api/circles/route';
import { POST as editFairValue } from '@/app/api/circles/[id]/fair-value/route';

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

async function post(fn: (req: Request, ctx?: any) => Promise<Response>, opts: { params?: Record<string, string>; body?: unknown } = {}) {
  const req = new Request('http://localhost/api/x', {
    method: 'POST',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const res = await fn(req, { params: Promise.resolve(opts.params ?? {}) });
  return { status: res.status, json: (await res.json()) as Json };
}

describe('fair-value slot adjustment (editable anchor bonus)', () => {
  let organizer: { id: string };
  let circleId = '';

  beforeAll(async () => {
    organizer = await db.user.create({ data: { email: 'fv-organizer@example.com', fullName: 'FV Organizer' } });
    await issueSession(organizer.id);
    loginAs(organizer.id);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('persists a custom fair-value bonus percent at creation (default 2)', async () => {
    const res = await post(createCircle, {
      body: {
        name: 'Default Pct Circle',
        contributionAmount: 500,
        frequency: 'MONTHLY',
        totalCycles: 4,
        mode: 'LEDGER',
        startDate: '2030-01-05',
      },
    });
    expect(res.status).toBe(201);
    const c = await db.circle.findUniqueOrThrow({ where: { id: (res.json.circle as any).id } });
    expect(Number(c.fairValueBonusPercent)).toBe(2);
  });

  it('persists an explicit fair-value bonus percent at creation', async () => {
    const res = await post(createCircle, {
      body: {
        name: 'Custom Pct Circle',
        contributionAmount: 1000,
        frequency: 'MONTHLY',
        totalCycles: 4,
        mode: 'LEDGER',
        fairValueSlots: true,
        fairValueBonusPercent: 5,
        startDate: '2030-01-05',
      },
    });
    expect(res.status).toBe(201);
    circleId = (res.json.circle as any).id;
    const c = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    expect(Number(c.fairValueBonusPercent)).toBe(5);
  });

  it('lets the organizer edit the bonus percent (audited)', async () => {
    const res = await post(editFairValue, {
      params: { id: circleId },
      body: { fairValueSlots: true, fairValueBonusPercent: 0 },
    });
    expect(res.status).toBe(200);
    const c = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    expect(Number(c.fairValueBonusPercent)).toBe(0);

    const audit = await db.auditLog.findFirst({ where: { circleId, action: 'FAIR_VALUE_UPDATED' } });
    expect(audit).not.toBeNull();
  });

  it('rejects a non-organizer member editing the fair-value settings', async () => {
    const member = await db.user.create({ data: { email: 'fv-member@example.com', fullName: 'FV Member' } });
    await issueSession(member.id);
    loginAs(member.id);
    const res = await post(editFairValue, {
      params: { id: circleId },
      body: { fairValueSlots: true, fairValueBonusPercent: 3 },
    });
    expect(res.status).toBe(403);
  });
});