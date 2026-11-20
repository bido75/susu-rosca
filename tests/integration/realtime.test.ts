import { describe, it, expect, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { notifyCircle, subscribeCircle } from '@/lib/realtime';

describe('PostgreSQL LISTEN/NOTIFY realtime', () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it('notifies a subscribed listener', async () => {
    const circleId = randomUUID();
    const ac = new AbortController();
    let received = 0;

    const done = new Promise<void>((resolve) => {
      void subscribeCircle(circleId, () => {
        received += 1;
        resolve();
      }, ac.signal).catch(() => {});
    });

    // Give LISTEN a moment to establish, then notify.
    await new Promise((r) => setTimeout(r, 300));
    await notifyCircle(circleId);

    await Promise.race([done, new Promise<void>((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))]);
    ac.abort();
    expect(received).toBe(1);
  }, 10_000);
});