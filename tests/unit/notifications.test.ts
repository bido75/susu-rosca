import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock next/headers so auth-free helpers can import db safely (not strictly
// needed, but keeps the test environment consistent with other suites).
vi.mock('next/headers', () => ({ cookies: () => ({ get: () => undefined }) }));

const sent: { to: string; subject: string }[] = [];
vi.mock('@/lib/mail', () => ({
  sendMail: vi.fn(async (opts: { to: string; subject: string; text: string }) => {
    sent.push({ to: opts.to, subject: opts.subject });
  }),
}));

import { db } from '@/lib/db';
import { notifyUser, notifyOrganizer, notifyCircleMembers } from '@/lib/notifications';

describe('payout notification emails', () => {
  let org: { id: string };
  let m1: { id: string };
  let m2: { id: string };
  let circleId: string;

  beforeAll(async () => {
    org = await db.user.create({ data: { email: 'notif-org@example.com', fullName: 'Notif Org' } });
    m1 = await db.user.create({ data: { email: 'notif-m1@example.com', fullName: 'Notif M1' } });
    m2 = await db.user.create({ data: { email: 'notif-m2@example.com', fullName: 'Notif M2' } });
    const circle = await db.circle.create({
      data: {
        name: 'Notif Circle',
        contributionAmount: '500.00',
        frequency: 'MONTHLY',
        totalCycles: 4,
        status: 'ACTIVE',
        startDate: new Date('2030-01-05T12:00:00Z'),
        createdBy: org.id,
        inviteCode: 'SUSU-NOTIF0000000000',
      },
    });
    circleId = circle.id;
    await db.circleMember.createMany({
      data: [
        { circleId, userId: org.id },
        { circleId, userId: m1.id },
        { circleId, userId: m2.id },
      ],
    });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('emails a single user by id', async () => {
    sent.length = 0;
    notifyUser(m1.id, 'Hello', 'Body');
    await vi.waitFor(() => {
      expect(sent).toContainEqual({ to: 'notif-m1@example.com', subject: 'Hello' });
    });
  });

  it('emails the organizer', async () => {
    sent.length = 0;
    notifyOrganizer(circleId, 'Org subject', 'Body');
    await vi.waitFor(() => {
      expect(sent).toContainEqual({ to: 'notif-org@example.com', subject: 'Org subject' });
    });
  });

  it('emails all circle members and honors the exclusion', async () => {
    sent.length = 0;
    notifyCircleMembers(circleId, 'Circle subject', 'Body', m2.id);
    await vi.waitFor(() => {
      const tos = sent.map((s) => s.to).sort();
      expect(tos).toEqual(['notif-m1@example.com', 'notif-org@example.com']);
    });
  });

  it('never throws when delivery fails (best-effort)', async () => {
    const { sendMail } = await import('@/lib/mail');
    vi.mocked(sendMail).mockRejectedValueOnce(new Error('SMTP down'));
    expect(() => notifyUser(m1.id, 'x', 'y')).not.toThrow();
    await new Promise((r) => setTimeout(r, 50));
  });
});