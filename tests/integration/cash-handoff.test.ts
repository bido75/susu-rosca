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
import { POST as createCircle } from '@/app/api/circles/route';
import { POST as joinCircle } from '@/app/api/circles/[id]/join/route';
import { POST as drawSlots } from '@/app/api/circles/[id]/draw/route';
import { POST as requestCash, GET as getCash } from '@/app/api/circles/[id]/cash-handoff/route';
import { POST as reviewCash } from '@/app/api/circles/[id]/cash-handoff/[handoffId]/review/route';
import { POST as confirmCash } from '@/app/api/circles/[id]/cash-handoff/[handoffId]/confirm/route';

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
function logout() {
  cookieJar.delete('susuflow_session');
}

async function call(fn: (req: Request, ctx?: any) => Promise<Response>, opts: { method?: string; params?: Record<string, string>; body?: unknown } = {}) {
  const method = opts.method ?? 'POST';
  const req = new Request('http://localhost/api/x', {
    method,
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const res = await fn(req, { params: Promise.resolve(opts.params ?? {}) });
  return { status: res.status, json: (await res.json()) as Json };
}

describe('cash handoff exception workflow', () => {
  let organizer: { id: string };
  let member2: { id: string };
  let member3: { id: string };
  let member4: { id: string };
  let circleId = '';
  let inviteCode = '';
  let recipientId = '';

  beforeAll(async () => {
    organizer = await db.user.create({ data: { email: 'ch-org@example.com', fullName: 'CH Organizer' } });
    member2 = await db.user.create({ data: { email: 'ch-m2@example.com', fullName: 'CH Member 2' } });
    member3 = await db.user.create({ data: { email: 'ch-m3@example.com', fullName: 'CH Member 3' } });
    member4 = await db.user.create({ data: { email: 'ch-m4@example.com', fullName: 'CH Member 4' } });
    for (const u of [organizer, member2, member3, member4]) await issueSession(u.id);

    loginAs(organizer.id);
    const created = await call(createCircle, { body: { name: 'Cash Test', contributionAmount: 500, frequency: 'MONTHLY', totalCycles: 4, mode: 'LEDGER', startDate: '2030-01-05' } });
    circleId = (created.json.circle as any).id;
    inviteCode = (created.json.circle as any).inviteCode;

    for (const m of [member2, member3, member4]) {
      loginAs(m.id);
      await call(joinCircle, { params: { id: circleId }, body: { code: inviteCode } });
    }
    loginAs(organizer.id);
    await call(drawSlots, { params: { id: circleId } });

    // Determine the recipient assigned to cycle 1.
    loginAs(organizer.id);
    const c = await db.circle.findUniqueOrThrow({ where: { id: circleId }, include: { cycles: true } });
    recipientId = c.cycles.find((cyc) => cyc.cycleNumber === 1)!.recipientUserId!;
  });

  afterAll(async () => {
    logout();
    await db.$disconnect();
  });

  it('lets the assigned recipient request a cash payout', async () => {
    loginAs(recipientId);
    const res = await call(requestCash, {
      params: { id: circleId },
      body: { amount: 2000, reason: 'No bank on the island', proposedDate: '2030-01-06', arrangement: 'Meet at the public library' },
    });
    expect(res.status).toBe(201);
    expect((res.json.request as any).status).toBe('PENDING');
  });

  it('blocks a non-recipient from requesting cash', async () => {
    loginAs(member2.id);
    const res = await call(requestCash, {
      params: { id: circleId },
      body: { amount: 2000, reason: 'Not my turn', proposedDate: '2030-01-06', arrangement: 'N/A location' },
    });
    expect(res.status).toBe(403);
  });

  it('requires a witness when the organizer approves', async () => {
    loginAs(organizer.id);
    const req = await db.cashHandoffRequest.findFirst({ where: { circleId } });
    const res = await call(reviewCash, { params: { id: circleId, handoffId: req!.id }, body: { approve: true } });
    expect(res.status).toBe(400); // missing witness
  });

  it('approves with an independent witness and accrues separate confirmations', async () => {
    loginAs(organizer.id);
    const req = await db.cashHandoffRequest.findFirst({ where: { circleId } });
    // Pick an independent witness: a circle member who is neither the recipient
    // nor the organizer (payer).
    const witness = [member2, member3, member4].find((m) => m.id !== recipientId)!;
    const res = await call(reviewCash, {
      params: { id: circleId, handoffId: req!.id },
      body: { approve: true, witnessUserId: witness.id },
    });
    expect(res.status).toBe(200);
    expect((res.json.request as any).status).toBe('APPROVED');

    // Witness confirms
    loginAs(witness.id);
    const w = await call(confirmCash, { params: { id: circleId, handoffId: req!.id }, body: { role: 'WITNESS' } });
    expect(w.status).toBe(201);

    // Recipient confirms
    loginAs(recipientId);
    const r = await call(confirmCash, { params: { id: circleId, handoffId: req!.id }, body: { role: 'RECIPIENT' } });
    expect(r.status).toBe(201);

    // Payer (organizer) confirms
    loginAs(organizer.id);
    const p = await call(confirmCash, { params: { id: circleId, handoffId: req!.id }, body: { role: 'PAYER' } });
    expect(p.status).toBe(201);

    const confirmations = await db.cashHandoffConfirmation.findMany({ where: { handoffId: req!.id } });
    expect(confirmations).toHaveLength(3);
    expect(new Set(confirmations.map((c) => c.role))).toEqual(new Set(['PAYER', 'RECIPIENT', 'WITNESS']));
  });

  it('prevents a duplicate confirmation for the same role', async () => {
    loginAs(organizer.id);
    const req = await db.cashHandoffRequest.findFirst({ where: { circleId } });
    const res = await call(confirmCash, { params: { id: circleId, handoffId: req!.id }, body: { role: 'PAYER' } });
    expect(res.status).toBe(409);
  });

  it('excludes a non-member from viewing the handoff', async () => {
    const outsider = await db.user.create({ data: { email: 'ch-out@example.com', fullName: 'Outsider' } });
    await issueSession(outsider.id);
    loginAs(outsider.id);
    const res = await call(getCash, { method: 'GET', params: { id: circleId } });
    expect(res.status).toBe(403);
  });
});