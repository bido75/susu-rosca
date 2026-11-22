import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { lockCircle, audit } from '@/lib/circles';
import { circlePayoutPreferenceSchema } from '@/lib/schemas';

// A member selects which of their receiving methods to use for this circle.
// Does NOT alter membership, contribution obligations, payout order, or trust.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const { receivingMethodId } = circlePayoutPreferenceSchema.parse(await req.json());

    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({ where: { id: params.id }, include: { members: true } });
      if (!circle || !circle.members.some((m) => m.userId === user.id)) {
        throw new ApiError(403, 'Not a member');
      }
      const method = await tx.payoutReceivingMethod.findUnique({ where: { id: receivingMethodId } });
      if (!method || method.userId !== user.id) throw new ApiError(404, 'Payout method not found');
      if (method.status !== 'CONFIRMED') throw new ApiError(409, 'Confirm the payout details first');

      const pref = await tx.circlePayoutPreference.upsert({
        where: { circleId_userId: { circleId: params.id, userId: user.id } },
        create: { circleId: params.id, userId: user.id, receivingMethodId },
        update: { receivingMethodId },
      });

      await audit(tx, user.id, params.id, 'PAYOUT_PREFERENCE_SET', pref.id, {
        receivingMethodId,
      });
      return pref;
    });

    void notifyCircle(params.id);
    return success({ preference: result });
  } catch (e) {
    return failure(e);
  }
}