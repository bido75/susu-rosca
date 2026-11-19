import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { organizerOnly, lockCircle, audit } from '@/lib/circles';
import { payoutRefSchema } from '@/lib/schemas';
import { contributionTrustDelta } from '@/lib/trust';

// Records a confirmed OFF-PLATFORM disbursement; never claims to transfer funds.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { externalTxRef } = payoutRefSchema.parse(await req.json());
    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUniqueOrThrow({
        where: { id: params.id },
        include: { members: true },
      });
      organizerOnly(circle, user.id);
      if (circle.status !== 'ACTIVE') throw new ApiError(409, 'Circle not active');
      const cycle = await tx.cycle.findUniqueOrThrow({
        where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: circle.currentCycle } },
        include: { contributions: true },
      });
      if (!cycle.recipientUserId) throw new ApiError(409, 'Recipient not assigned');
      if (
        cycle.status !== 'ACTIVE' ||
        cycle.contributions.length !== circle.totalCycles ||
        cycle.contributions.some((c) => c.status !== 'VERIFIED' || !c.amount.equals(circle.contributionAmount))
      ) {
        throw new ApiError(409, 'All member contributions must be verified first');
      }
      await tx.cycle.update({
        where: { id: cycle.id },
        data: { status: 'DISBURSED', disbursedAt: new Date(), disbursementRef: externalTxRef },
      });
      await audit(tx, user.id, params.id, 'POT_DISBURSEMENT_RECORDED', cycle.id, {
        recipientId: cycle.recipientUserId,
        amount: circle.contributionAmount.mul(circle.totalCycles).toFixed(2),
        externalTxRef,
      });
      for (const m of circle.members) {
        const c = cycle.contributions.find((x) => x.userId === m.userId);
        if (!c?.verifiedAt) continue;
        const delta = contributionTrustDelta(c.verifiedAt, cycle.dueDate);
        if (delta !== 0) {
          await tx.user.update({
            where: { id: m.userId },
            data: { susuTrustScore: { increment: delta } },
          });
        }
      }
      if (circle.currentCycle === circle.totalCycles) {
        await tx.circle.update({ where: { id: params.id }, data: { status: 'COMPLETED' } });
        return { completed: true };
      }
      const nextNumber = circle.currentCycle + 1;
      const next = await tx.cycle.update({
        where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: nextNumber } },
        data: { status: 'ACTIVE' },
      });
      await tx.circle.update({ where: { id: params.id }, data: { currentCycle: nextNumber } });
      for (const m of circle.members) {
        await tx.contribution.create({
          data: { cycleId: next.id, userId: m.userId, amount: circle.contributionAmount },
        });
      }
      return { completed: false, currentCycle: nextNumber };
    });
    return success(result);
  } catch (e) {
    return failure(e);
  }
}
