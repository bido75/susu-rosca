import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const { cookieJar } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return { cookieJar: { get: (k: string) => store.get(k) ? { name: k, value: store.get(k)! } : undefined, set: (k: string, v: string) => store.set(k, v), delete: (k: string) => store.delete(k) } };
});

vi.mock('next/headers', () => ({ cookies: () => ({ get: (n: string) => (cookieJar.get(n) ? { name: n, value: cookieJar.get(n)! } : undefined), set: (n: string, v: string) => cookieJar.set(n, v), delete: (n: string) => cookieJar.delete(n) }) }));

const smsCalls: { to: string; text: string }[] = [];
vi.mock('@/lib/sms', () => ({
  sendSms: vi.fn(async (to: string, text: string) => { smsCalls.push({ to, text }); }),
}));

import { db } from '@/lib/db';
import { POST as requestLink } from '@/app/api/auth/request-link/route';

describe('SMS sign-in code delivery', () => {
  beforeAll(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });
  afterAll(async () => {
    await db.$disconnect();
  });

  it('sends the code via SMS when the user has a phone number', async () => {
    await db.user.create({ data: { email: 'sms-signin@example.com', fullName: 'SMS User', phoneNumber: '+15551234567' } });
    smsCalls.length = 0;
    const res = await requestLink(new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'sms-signin@example.com' }) }), { params: {} });
    expect(res.status).toBe(200);
    expect(smsCalls).toHaveLength(1);
    expect(smsCalls[0].to).toBe('+15551234567');
    expect(smsCalls[0].text).toMatch(/sign-in code: \d{6}/);
  });

  it('does not send SMS when the user has no phone number', async () => {
    await db.user.create({ data: { email: 'sms-none@example.com', fullName: 'No SMS' } });
    smsCalls.length = 0;
    const res = await requestLink(new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'sms-none@example.com' }) }), { params: {} });
    expect(res.status).toBe(200);
    expect(smsCalls).toHaveLength(0);
  });
});