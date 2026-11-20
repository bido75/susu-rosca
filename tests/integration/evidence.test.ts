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
import { POST as submitContribution } from '@/app/api/circles/[id]/contributions/route';
import { POST as uploadEvidence } from '@/app/api/circles/[id]/evidence/route';
import { GET as getEvidence } from '@/app/api/circles/[id]/evidence/[evidenceId]/route';

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

async function postFile(fn: Handler, params: Record<string, string>, file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const req = new Request('http://localhost/api/x', { method: 'POST', body: fd });
  const res = await fn(req, { params: Promise.resolve(params) });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

const sessionTokens = new Map<string, string>();
async function issueSession(userId: string) {
  const raw = randomBytes(32).toString('hex');
  await db.session.create({ data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 3600_000) } });
  sessionTokens.set(userId, raw);
}
function loginAs(userId: string) {
  cookieJar.set('susuflow_session', sessionTokens.get(userId)!);
}
async function createUser(email: string) {
  const user = await db.user.create({ data: { email, fullName: email.split('@')[0] } });
  await issueSession(user.id);
  return user;
}

const makePng = () => new File([randomBytes(64)], 'receipt.png', { type: 'image/png' });
const makeEvil = () => new File([randomBytes(64)], 'evil.exe', { type: 'application/x-msdownload' });

describe('payment evidence uploads', () => {
  let organizer: { id: string };
  let member: { id: string };
  let outsider: { id: string };
  let circleId = '';
  let inviteCode = '';

  beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'development');
    cookieJar.delete('susuflow_session');
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('sets up a 2-member circle and draws slots', async () => {
    organizer = await createUser('ev-org@example.com');
    member = await createUser('ev-member@example.com');
    outsider = await createUser('ev-outsider@example.com');

    loginAs(organizer.id);
    const c = await post(createCircle, {
      body: { name: 'Evidence Circle', contributionAmount: 100, frequency: 'MONTHLY', totalCycles: 2, mode: 'LEDGER', startDate: '2030-01-05' },
    });
    circleId = (c.json.circle as any).id;
    inviteCode = (c.json.circle as any).inviteCode;

    loginAs(member.id);
    await post(joinCircle, { params: { id: circleId }, body: { code: inviteCode } });

    loginAs(organizer.id);
    const d = await post(drawSlots, { params: { id: circleId } });
    expect(d.status).toBe(200);
  });

  it('uploads accepted evidence for a submitted contribution', async () => {
    loginAs(member.id);
    const s = await post(submitContribution, {
      params: { id: circleId },
      body: { paymentMethod: 'ZELLE', externalTxRef: 'ZL-EVID-1' },
    });
    expect(s.status).toBe(200);

    const up = await postFile(uploadEvidence, { id: circleId }, makePng());
    expect(up.status).toBe(201);
    const stored = await db.contributionEvidence.findFirst({ where: { uploadedBy: member.id } });
    expect(stored).not.toBeNull();
    expect(stored!.mimeType).toBe('image/png');
  });

  it('rejects a disallowed file type', async () => {
    loginAs(member.id);
    const up = await postFile(uploadEvidence, { id: circleId }, makeEvil());
    expect(up.status).toBe(400);
  });

  it('allows the owner and organizer to read evidence, but not an outsider', async () => {
    const ev = await db.contributionEvidence.findFirstOrThrow({ where: { uploadedBy: member.id } });

    loginAs(member.id);
    const own = await getEvidence(new Request('http://localhost/api'), { params: Promise.resolve({ id: circleId, evidenceId: ev.id }) });
    expect(own.status).toBe(200);

    loginAs(organizer.id);
    const org = await getEvidence(new Request('http://localhost/api'), { params: Promise.resolve({ id: circleId, evidenceId: ev.id }) });
    expect(org.status).toBe(200);

    loginAs(outsider.id);
    const out = await getEvidence(new Request('http://localhost/api'), { params: Promise.resolve({ id: circleId, evidenceId: ev.id }) });
    expect(out.status).toBe(403);
  });

  it('rejects evidence for a non-member uploader', async () => {
    loginAs(outsider.id);
    const up = await postFile(uploadEvidence, { id: circleId }, makePng());
    expect(up.status).toBe(403);
  });
});