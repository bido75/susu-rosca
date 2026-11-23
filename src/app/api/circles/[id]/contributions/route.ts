import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { lockCircle, audit } from '@/lib/circles';
import { contributionSchema } from '@/lib/schemas';
import { notifyOrganizer } from '@/lib/notifications';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const input = contributionSchema.parse(await req.json());
    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({
        where: { id: params.id },
        include: { members: true },
      });
      if (!circle || circle.status !== 'ACTIVE') throw new ApiError(409, 'Circle not active');
      if (circle.mode === 'AUTOMATED_SIMULATED') {
        throw new ApiError(409, 'Use simulated ACH in this test-only circle.');
      }
      if (!circle.members.some((x) => x.userId === user.id)) throw new ApiError(403, 'Not a member');
      const cycle = await tx.cycle.findUniqueOrThrow({
        where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: circle.currentCycle } },
      });
      const contrib = await tx.contribution.findUnique({
        where: { cycleId_userId: { cycleId: cycle.id, userId: user.id } },
      });
      if (!contrib || contrib.status !== 'PENDING') {
        throw new ApiError(409, 'Contribution already submitted or unavailable');
      }
      const updated = await tx.contribution.update({
        where: { id: contrib.id },
        data: { status: 'SUBMITTED', paymentMethod: input.paymentMethod, externalTxRef: input.externalTxRef },
      });
      await audit(tx, user.id, params.id, 'PROOF_SUBMITTED', updated.id, {
        cycle: circle.currentCycle,
        method: input.paymentMethod,
      });
      return { contribution: updated };
    });
      void notifyCircle(params.id);
  notifyOrganizer(params.id, 'Payment reference submitted', 'A member submitted a payment reference. Review and verify it in SusuFlow.');
  return success(result);
  } catch (e) {
    return failure(e);
  }
}
