import { db } from './db';
import { sendMail } from './mail';
import { logger } from './logger';

/**
 * Best-effort external notifications (email) for payout events.
 *
 * Every notifier is fire-and-forget (`void`) and runs OUTSIDE any transaction or
 * advisory lock, so a slow or failing mail provider can never block or roll back
 * a financial mutation. Delivery failures are logged, never surfaced to the
 * caller. SMS and push are NOT configured (no provider / no Web Push plumbing),
 * so this module intentionally only sends email.
 */

async function trySend(to: string, subject: string, text: string): Promise<void> {
  try {
    await sendMail({ to, subject, text });
  } catch (e) {
    logger.error('Notification email failed', { to, message: e instanceof Error ? e.message : String(e) });
  }
}

/** Email a single user by id. */
export function notifyUser(userId: string, subject: string, text: string): void {
  void (async () => {
    try {
      const u = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (u?.email) await trySend(u.email, subject, text);
    } catch (e) {
      logger.error('notifyUser failed', { userId, message: e instanceof Error ? e.message : String(e) });
    }
  })();
}

/** Email the circle organizer. */
export function notifyOrganizer(circleId: string, subject: string, text: string): void {
  void (async () => {
    try {
      const c = await db.circle.findUnique({
        where: { id: circleId },
        select: { organizer: { select: { email: true } } },
      });
      if (c?.organizer.email) await trySend(c.organizer.email, subject, text);
    } catch (e) {
      logger.error('notifyOrganizer failed', { circleId, message: e instanceof Error ? e.message : String(e) });
    }
  })();
}

/** Email all circle members, optionally excluding a member (e.g. the actor). */
export function notifyCircleMembers(circleId: string, subject: string, text: string, excludeUserId?: string): void {
  void (async () => {
    try {
      const c = await db.circle.findUnique({
        where: { id: circleId },
        select: { name: true, members: { select: { userId: true, user: { select: { email: true } } } } },
      });
      if (!c) return;
      const targets = c.members
        .map((m) => ({ id: m.userId, email: m.user.email }))
        .filter((m) => m.id !== excludeUserId && m.email);
      await Promise.all(targets.map((m) => trySend(m.email!, subject, text)));
    } catch (e) {
      logger.error('notifyCircleMembers failed', { circleId, message: e instanceof Error ? e.message : String(e) });
    }
  })();
}
