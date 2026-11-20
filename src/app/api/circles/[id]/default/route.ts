import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { organizerOnly, lockCircle, audit, applyScoreChange } from '@/lib/circles';
import { verifySchema } from '@/lib/schemas';
import { TRUST_DELTAS } from '@/lib/trust';

// Organizer marks a contribution as defaulted (member failed to pay). Applies
// the -10 trust delta exactly once (idempotent; guarded by the state transition).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const { contributionId } = verifySchema.parse(await req.json());
    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUniqueOrThrow({ where: { id: params.id } });
      organizerOnly(circle, user.id);
      if (circle.status !== 'ACTIVE') throw new ApiError(409, 'Circle not active');
      const cycle = await tx.cycle.findUniqueOrThrow({
        where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: circle.currentCycle } },
      });
      const contribution = await tx.contribution.findUnique({ where: { id: contributionId } });
      if (!contribution || contribution.cycleId !== cycle.id) throw new ApiError(404, 'Contribution not found');
      if (contribution.status === 'VERIFIED') throw new ApiError(409, 'Contribution already verified');
      if (contribution.status === 'DEFAULTED') return { contribution, already: true };

      const updated = await tx.contribution.update({
        where: { id: contributionId },
        data: { status: 'DEFAULTED' },
      });
      await applyScoreChange(tx, contribution.userId, TRUST_DELTAS.DEFAULTED, 'Contribution defaulted', 'Contribution', contribution.id);
      await audit(tx, user.id, params.id, 'CONTRIBUTION_DEFAULTED', updated.id, {
        cycle: circle.currentCycle,
        memberId: contribution.userId,
      });
      return { contribution: updated, already: false };
    });
      void notifyCircle(params.id);
  return success(result);
  } catch (e) {
    return failure(e);
  }
}