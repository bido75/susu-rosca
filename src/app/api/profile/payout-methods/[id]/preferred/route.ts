import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';

export const dynamic = 'force-dynamic';

// Mark one of the caller's own receiving methods as preferred (un-setting any
// previous preferred method atomically). Requires the method to be CONFIRMED.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const params = await ctx.params;
    const method = await db.payoutReceivingMethod.findUnique({ where: { id: params.id } });
    if (!method || method.userId !== user.id) throw new ApiError(404, 'Payout method not found');
    if (method.status !== 'CONFIRMED') {
      throw new ApiError(409, 'Confirm the payout details before setting as preferred');
    }

    await db.$transaction([
      db.payoutReceivingMethod.updateMany({
        where: { userId: user.id, isPreferred: true },
        data: { isPreferred: false },
      }),
      db.payoutReceivingMethod.update({ where: { id: method.id }, data: { isPreferred: true } }),
    ]);

    return success({ preferred: true });
  } catch (e) {
    return failure(e);
  }
}