import { db } from './db';
import { sendMail } from './mail';
import { sendSms } from './sms';
import { sendPush } from './push';
import { logger } from './logger';

/**
 * Best-effort external notifications for payout events, across all configured
 * channels: email (always available via sendMail), Web Push (free, opt-in), and
 * SMS (only when a provider is configured and the user has a phone number).
 *
 * Every notifier is fire-and-forget (`void`), runs OUTSIDE any transaction or
 * advisory lock, and swallows delivery errors, so a slow or failing provider can
 * never block or roll back a financial mutation.
 */

interface Delivery {
  to: string;
  subject: string;
  text: string;
}

async function trySendMail(d: Delivery): Promise<void> {
  try {
    await sendMail({ to: d.to, subject: d.subject, text: d.text });
  } catch (e) {
    logger.error('Notification email failed', { to: d.to, message: e instanceof Error ? e.message : String(e) });
  }
}

async function trySendSms(to: string, text: string): Promise<void> {
  try {
    await sendSms(to, text);
  } catch (e) {
    logger.error('Notification sms failed', { to, message: e instanceof Error ? e.message : String(e) });
  }
}

// Deliver to a single user across all channels. `text` doubles as the SMS body
// (truncated for SMS length limits); push uses the email subject + text.
async function deliver(userId: string, subject: string, text: string): Promise<void> {
  try {
    const u = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, phoneNumber: true },
    });
    if (!u) return;

    if (u.email) await trySendMail({ to: u.email, subject, text });
    if (u.phoneNumber) await trySendSms(u.phoneNumber, text.slice(0, 300));
    await sendPush(userId, subject, text);
  } catch (e) {
    logger.error('deliver notification failed', { userId, message: e instanceof Error ? e.message : String(e) });
  }
}

/** Notify a single user by id. */
export function notifyUser(userId: string, subject: string, text: string): void {
  void deliver(userId, subject, text);
}

/** Notify the circle organizer. */
export function notifyOrganizer(circleId: string, subject: string, text: string): void {
  void (async () => {
    try {
      const c = await db.circle.findUnique({
        where: { id: circleId },
        select: { createdBy: true },
      });
      if (c?.createdBy) await deliver(c.createdBy, subject, text);
    } catch (e) {
      logger.error('notifyOrganizer failed', { circleId, message: e instanceof Error ? e.message : String(e) });
    }
  })();
}

/** Notify all circle members, optionally excluding a member (e.g. the actor). */
export function notifyCircleMembers(circleId: string, subject: string, text: string, excludeUserId?: string): void {
  void (async () => {
    try {
      const c = await db.circle.findUnique({
        where: { id: circleId },
        select: { members: { select: { userId: true, user: { select: { email: true, phoneNumber: true } } } } },
      });
      if (!c) return;
      const targets = c.members.filter((m) => m.userId !== excludeUserId);
      await Promise.all(targets.map((m) => deliver(m.userId, subject, text)));
    } catch (e) {
      logger.error('notifyCircleMembers failed', { circleId, message: e instanceof Error ? e.message : String(e) });
    }
  })();
}
