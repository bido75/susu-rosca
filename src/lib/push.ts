import { db } from './db';
import { logger } from './logger';

/**
 * Web Push delivery (browser-native, free — no external provider). Uses the
 * `web-push` library with VAPID keys. Requires VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY;
 * silently no-ops if they are not configured (push is opt-in). Invalid/stale
 * subscriptions (HTTP 404/410) are pruned so they don't accumulate.
 */

function vapidConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

async function removeSubscription(id: string): Promise<void> {
  try {
    await db.pushSubscription.delete({ where: { id } });
  } catch {
    /* already gone */
  }
}

export async function sendPush(userId: string, title: string, body: string, url = '/circles'): Promise<void> {
  if (!vapidConfigured()) return;
  try {
    const subs = await db.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) return;

    const webpush = (await import('web-push')).default ?? (await import('web-push'));
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@giscop.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );

    const payload = JSON.stringify({ title, body, url });
    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await removeSubscription(s.id);
          else throw e;
        }
      }),
    );
  } catch (e) {
    logger.error('Push send failed', { userId, message: e instanceof Error ? e.message : String(e) });
  }
}
