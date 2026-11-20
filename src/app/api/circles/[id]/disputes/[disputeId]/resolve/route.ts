import { notifyCircle } from '@/lib/realtime';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { organizerOnly, lockCircle, audit } from '@/lib/circles';

const schema = z.object({ resolution: z.string().trim().min(3).max(1000) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string; disputeId: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const { resolution } = schema.parse(await req.json());
    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUniqueOrThrow({ where: { id: params.id } });
      organizerOnly(circle, user.id);
      const dispute = await tx.dispute.findUnique({ where: { id: params.disputeId } });
      if (!dispute || dispute.circleId !== params.id) throw new ApiError(404, 'Dispute not found');
      if (dispute.status !== 'OPEN') throw new ApiError(409, 'Dispute already resolved');
      const updated = await tx.dispute.update({
        where: { id: params.disputeId },
        data: { status: 'RESOLVED', resolution, resolvedBy: user.id, resolvedAt: new Date() },
      });
      await audit(tx, user.id, params.id, 'DISPUTE_RESOLVED', dispute.id, { cycle: circle.currentCycle });
      return updated;
    });
      void notifyCircle(params.id);
    return success({ dispute: result });
  } catch (e) {
    return failure(e);
  }
}