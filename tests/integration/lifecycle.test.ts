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
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

import { db } from '@/lib/db';
import { POST as requestLink } from '@/app/api/auth/request-link/route';
import { POST as createCircle } from '@/app/api/circles/route';
import { GET as getCircle } from '@/app/api/circles/[id]/route';
import { POST as joinCircle } from '@/app/api/circles/[id]/join/route';
import { POST as drawSlots } from '@/app/api/circles/[id]/draw/route';
import { POST as submitContribution } from '@/app/api/circles/[id]/contributions/route';
import { POST as verifyContribution } from '@/app/api/circles/[id]/verify/route';
import { POST as disbursePot } from '@/app/api/circles/[id]/disburse/route';
import { POST as requestSwap } from '@/app/api/circles/[id]/swaps/route';
import { POST as acceptSwap } from '@/app/api/circles/[id]/swaps/[swapId]/accept/route';

type Json = Record<string, unknown>;

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');
const sessionTokens = new Map<string, string>();

async function issueSession(userId: string) {
  const raw = randomBytes(32).toString('hex');
  await db.session.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 3600_000) },
  });
  sessionTokens.set(userId, raw);
}

function loginAs(userId: string) {
  const raw = sessionTokens.get(userId);
  if (raw) cookieJar.set('susuflow_session', raw);
}

function logout() {
  cookieJar.delete('susuflow_session');
}

async function createUser(email: string, fullName: string) {
  const user = await db.user.create({ data: { email, fullName } });
  await issueSession(user.id);
  return user;
}

type Handler = (req: Request, ctx?: any) => Promise<Response>;

async function post(fn: Handler, opts: { params?: Record<string, string>; body?: unknown } = {}) {
  const req = new Request('http://localhost/api/x', {
    method: 'POST',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const res = await fn(req, { params: opts.params ?? {} });
  return { status: res.status, json: (await res.json()) as Json };
}

describe('SusuFlow six-member monthly lifecycle', () => {
  let organizer: { id: string };
  let members: { id: string }[] = [];
  let circleId = '';
  let inviteCode = '';

  beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'development'); // allow dev-only magic-link path (no SMTP)
    logout();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('registers a user via magic-link request (hashed, single-use token)', async () => {
    const res = await post(requestLink, {
      body: { email: 'organizer@example.com', fullName: 'Organizer One' },
    });
    expect(res.status).toBe(200);

    const user = await db.user.findUnique({ where: { email: 'organizer@example.com' } });
    expect(user).not.toBeNull();
    expect(user!.susuTrustScore).toBe(100);
    expect(user!.kycStatus).toBe('UNVERIFIED');

    const link = await db.magicLink.findFirst({ where: { userId: user!.id } });
    expect(link).not.toBeNull();
    expect(link!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(link!.usedAt).toBeNull();
  });

  it('provisions sessions for the organizer and five more members', async () => {
    organizer = await db.user.findUniqueOrThrow({ where: { email: 'organizer@example.com' } });
    await issueSession(organizer.id);
    loginAs(organizer.id);

    members = [];
    for (let i = 1; i <= 5; i++) {
      members.push(await createUser(`member${i}@example.com`, `Member ${i}`));
    }
    expect(members).toHaveLength(5);
  });

  it('creates a $500 monthly circle with six cycles', async () => {
    const res = await post(createCircle, {
      body: {
        name: 'Family & Friends Savings',
        contributionAmount: 500,
        frequency: 'MONTHLY',
        totalCycles: 6,
        mode: 'LEDGER',
        startDate: '2030-01-05',
      },
    });
    expect(res.status).toBe(201);

    circleId = (res.json.circle as any).id;
    inviteCode = (res.json.circle as any).inviteCode;
    expect(inviteCode).toMatch(/^SUSU-[0-9A-F]{16}$/);

    const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    expect(circle.status).toBe('FORMING');
    expect(circle.currentCycle).toBe(1);
    expect(Number(circle.contributionAmount)).toBe(500);

    const cycleCount = await db.cycle.count({ where: { circleId } });
    expect(cycleCount).toBe(6);

    // organizer auto-added as a member
    const memberCount = await db.circleMember.count({ where: { circleId } });
    expect(memberCount).toBe(1);
  });

  it('lets five invited members join via the invite code', async () => {
    for (const m of members) {
      loginAs(m.id);
      const res = await post(joinCircle, { params: { id: circleId }, body: { code: inviteCode } });
      expect(res.status).toBe(200);
      expect(res.json.joined).toBe(true);
    }
    loginAs(organizer.id);
    const memberCount = await db.circleMember.count({ where: { circleId } });
    expect(memberCount).toBe(6);
  });

  it('rejects a seventh member (capacity enforced)', async () => {
    const extra = await createUser('extra@example.com', 'Extra Member');
    loginAs(extra.id);
    const res = await post(joinCircle, { params: { id: circleId }, body: { code: inviteCode } });
    expect(res.status).toBe(409);
    loginAs(organizer.id);
  });

  it('rejects an invalid invitation code', async () => {
    const res = await post(joinCircle, { params: { id: circleId }, body: { code: 'SUSU-BAD' } });
    expect(res.status).toBe(404);
  });

  it('requires authentication to access a circle', async () => {
    logout();
    const res = await getCircle(new Request('http://localhost/api/x'), { params: { id: circleId } });
    expect(res.status).toBe(401);
    loginAs(organizer.id);
  });

  it('draws a cryptographically shuffled slot order (organizer only)', async () => {
    const res = await post(drawSlots, { params: { id: circleId } });
    expect(res.status).toBe(200);

    const assignments = res.json.assignments as { userId: string; slot: number }[];
    expect(assignments).toHaveLength(6);
    const slots = assignments.map((a) => a.slot).sort((a, b) => a - b);
    expect(slots).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(assignments.map((a) => a.userId)).size).toBe(6);

    const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    expect(circle.status).toBe('ACTIVE');

    const cycle1 = await db.cycle.findUniqueOrThrow({
      where: { circleId_cycleNumber: { circleId, cycleNumber: 1 } },
    });
    expect(cycle1.status).toBe('ACTIVE');
    expect(cycle1.recipientUserId).not.toBeNull();

    const contribs = await db.contribution.count({ where: { cycleId: cycle1.id } });
    expect(contribs).toBe(6);
  });

  it('enforces unique slot assignment and one payout per member', async () => {
    const allMembers = await db.circleMember.findMany({ where: { circleId } });
    const assigned = allMembers.filter((m) => m.slotNumber !== null);
    expect(assigned).toHaveLength(6);
    expect(new Set(assigned.map((m) => m.slotNumber)).size).toBe(6);
  });

  it('rejects a duplicate contribution (unique cycle/user constraint)', async () => {
    const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    const cycle = await db.cycle.findUniqueOrThrow({
      where: { circleId_cycleNumber: { circleId, cycleNumber: circle.currentCycle } },
    });
    const existing = await db.contribution.findFirstOrThrow({ where: { cycleId: cycle.id } });
    await expect(
      db.contribution.create({ data: { cycleId: existing.cycleId, userId: existing.userId, amount: 500 } }),
    ).rejects.toThrow();
  });

  it('executes a peer slot swap with mutual consent (future slots only)', async () => {
    const allMembers = await db.circleMember.findMany({
      where: { circleId },
      orderBy: { slotNumber: 'asc' },
    });
    const a = allMembers.find((m) => m.slotNumber === 3)!;
    const b = allMembers.find((m) => m.slotNumber === 4)!;

    loginAs(a.userId);
    const reqRes = await post(requestSwap, { params: { id: circleId }, body: { targetUserId: b.userId } });
    expect(reqRes.status).toBe(201);
    const swapId = (reqRes.json.swap as any).id;

    loginAs(b.userId);
    const accRes = await post(acceptSwap, { params: { id: circleId, swapId } });
    expect(accRes.status).toBe(200);

    const after = await db.circleMember.findMany({ where: { circleId } });
    expect(after.find((m) => m.id === a.id)!.slotNumber).toBe(4);
    expect(after.find((m) => m.id === b.id)!.slotNumber).toBe(3);

    const cycle3 = await db.cycle.findUniqueOrThrow({
      where: { circleId_cycleNumber: { circleId, cycleNumber: 3 } },
    });
    const cycle4 = await db.cycle.findUniqueOrThrow({
      where: { circleId_cycleNumber: { circleId, cycleNumber: 4 } },
    });
    expect(cycle3.recipientUserId).toBe(b.userId);
    expect(cycle4.recipientUserId).toBe(a.userId);

    loginAs(organizer.id);
  });

  it('rejects a swap of a current/completed slot', async () => {
    const allMembers = await db.circleMember.findMany({
      where: { circleId },
      orderBy: { slotNumber: 'asc' },
    });
    const current = allMembers.find((m) => m.slotNumber === 1)!;
    const future = allMembers.find((m) => m.slotNumber === 5)!;
    loginAs(current.userId);
    const res = await post(requestSwap, { params: { id: circleId }, body: { targetUserId: future.userId } });
    expect(res.status).toBe(409);
    loginAs(organizer.id);
  });

  it('submits all six cycle-1 contributions as each member', async () => {
    const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    const cycle = await db.cycle.findUniqueOrThrow({
      where: { circleId_cycleNumber: { circleId, cycleNumber: circle.currentCycle } },
    });
    const contribs = await db.contribution.findMany({ where: { cycleId: cycle.id } });
    expect(contribs).toHaveLength(6);

    for (const c of contribs) {
      loginAs(c.userId);
      const res = await post(submitContribution, {
        params: { id: circleId },
        body: { paymentMethod: 'ZELLE', externalTxRef: `REF-${c.userId.slice(0, 8)}` },
      });
      expect(res.status).toBe(200);
    }
    loginAs(organizer.id);

    const submitted = await db.contribution.count({ where: { cycleId: cycle.id, status: 'SUBMITTED' } });
    expect(submitted).toBe(6);
  });

  it('blocks disbursement until all six contributions are verified', async () => {
    const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    const cycle = await db.cycle.findUniqueOrThrow({
      where: { circleId_cycleNumber: { circleId, cycleNumber: circle.currentCycle } },
    });
    const contribs = await db.contribution.findMany({ where: { cycleId: cycle.id } });

    // verify only five
    for (let i = 0; i < 5; i++) {
      const res = await post(verifyContribution, {
        params: { id: circleId },
        body: { contributionId: contribs[i].id },
      });
      expect(res.status).toBe(200);
    }

    const res = await post(disbursePot, { params: { id: circleId }, body: { externalTxRef: 'PAY-1' } });
    expect(res.status).toBe(409);

    // verify the sixth, then disburse
    const last = await post(verifyContribution, {
      params: { id: circleId },
      body: { contributionId: contribs[5].id },
    });
    expect(last.status).toBe(200);
  });

  it('records the cycle-1 payout and advances to cycle 2', async () => {
    const res = await post(disbursePot, { params: { id: circleId }, body: { externalTxRef: 'PAYOUT-CYCLE-1' } });
    expect(res.status).toBe(200);
    expect(res.json.completed).toBe(false);
    expect(res.json.currentCycle).toBe(2);

    const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    expect(circle.currentCycle).toBe(2);

    const cycle1 = await db.cycle.findUniqueOrThrow({
      where: { circleId_cycleNumber: { circleId, cycleNumber: 1 } },
    });
    expect(cycle1.status).toBe('DISBURSED');
    expect(cycle1.disbursementRef).toBe('PAYOUT-CYCLE-1');

    const cycle2 = await db.cycle.findUniqueOrThrow({
      where: { circleId_cycleNumber: { circleId, cycleNumber: 2 } },
    });
    expect(cycle2.status).toBe('ACTIVE');
    expect(await db.contribution.count({ where: { cycleId: cycle2.id } })).toBe(6);
  });

  it('advances through cycles 2..6 and completes the circle', async () => {
    for (let cycle = 2; cycle <= 6; cycle++) {
      const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
      expect(circle.currentCycle).toBe(cycle);

      const cyc = await db.cycle.findUniqueOrThrow({
        where: { circleId_cycleNumber: { circleId, cycleNumber: cycle } },
      });
      const contribs = await db.contribution.findMany({ where: { cycleId: cyc.id } });
      expect(contribs).toHaveLength(6);

      for (const c of contribs) {
        loginAs(c.userId);
        const s = await post(submitContribution, {
          params: { id: circleId },
          body: { paymentMethod: 'VENMO', externalTxRef: `VM-${cycle}-${c.userId.slice(0, 4)}` },
        });
        expect(s.status).toBe(200);
      }

      loginAs(organizer.id);
      for (const c of contribs) {
        const v = await post(verifyContribution, {
          params: { id: circleId },
          body: { contributionId: c.id },
        });
        expect(v.status).toBe(200);
      }

      const d = await post(disbursePot, {
        params: { id: circleId },
        body: { externalTxRef: `PAYOUT-CYCLE-${cycle}` },
      });
      expect(d.status).toBe(200);
      expect(d.json.completed).toBe(cycle === 6);
    }

    const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    expect(circle.status).toBe('COMPLETED');

    const cycles = await db.cycle.findMany({ where: { circleId }, orderBy: { cycleNumber: 'asc' } });
    expect(cycles).toHaveLength(6);
    expect(cycles.every((c) => c.status === 'DISBURSED')).toBe(true);

    // exactly one payout per member across the whole rotation
    const recipients = cycles.map((c) => c.recipientUserId);
    const everyone = [organizer.id, ...members.map((m) => m.id)];
    expect(new Set(recipients).size).toBe(6);
    expect(recipients.sort()).toEqual(everyone.sort());
  });

  it('rejects a duplicate payout (cycle already advanced)', async () => {
    const res = await post(disbursePot, { params: { id: circleId }, body: { externalTxRef: 'DUPE' } });
    expect(res.status).toBe(409);
  });

  it('rejects organizer actions from a non-organizer member', async () => {
    loginAs(members[0].id);
    const circle = await db.circle.findUniqueOrThrow({ where: { id: circleId } });
    const res = await post(verifyContribution, {
      params: { id: circleId },
      body: { contributionId: '00000000-0000-0000-0000-000000000000' },
    });
    // organizer check fails first (403) regardless of the bogus id
    expect(res.status).toBe(403);
    expect(circle.status).toBe('COMPLETED');
  });

  it('updates each member trust score once per on-time cycle', async () => {
    const everyone = await db.user.findMany({ where: { id: { in: [organizer.id, ...members.map((m) => m.id)] } } });
    for (const u of everyone) {
      expect(u.susuTrustScore).toBe(106); // 100 + six on-time contributions
    }
  });

  it('records audit events and keeps them append-only', async () => {
    const actions = await db.auditLog.findMany({ where: { circleId } });
    const kinds = actions.map((a) => a.action);
    expect(kinds).toContain('CIRCLE_CREATED');
    expect(kinds).toContain('MEMBER_JOINED');
    expect(kinds).toContain('SLOTS_DRAWN');
    expect(kinds).toContain('SLOT_SWAP_ACCEPTED');
    expect(kinds).toContain('PROOF_SUBMITTED');
    expect(kinds).toContain('PAYMENT_VERIFIED');
    expect(kinds).toContain('POT_DISBURSEMENT_RECORDED');

    const first = actions[0];
    await expect(
      db.$executeRaw`UPDATE "AuditLog" SET action = action WHERE id = ${first.id}`,
    ).rejects.toThrow();
  });
});
