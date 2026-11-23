import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Web Push subscription save/remove. The endpoint is the natural unique key for a
// device; keys are opaque tokens provided by the browser (not secret server data).

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = subSchema.parse(await req.json());
    await db.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: { userId: user.id, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth },
      update: { userId: user.id, p256dh: input.keys.p256dh, auth: input.keys.auth },
    });
    return success({ subscribed: true });
  } catch (e) {
    return failure(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const input = subSchema.pick({ endpoint: true }).parse(await req.json());
    await db.pushSubscription.deleteMany({ where: { endpoint: input.endpoint, userId: user.id } });
    return success({ subscribed: false });
  } catch (e) {
    return failure(e);
  }
}