import { notifyCircle } from '@/lib/realtime';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { lockCircle, audit } from '@/lib/circles';

const schema = z.object({ description: z.string().trim().min(3).max(1000) });

// Any member can raise a dispute on the current cycle, which blocks disbursement
// until the organizer resolves it.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const { description } = schema.parse(await req.json());
    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({ where: { id: params.id }, include: { members: true } });
      if (!circle || circle.status !== 'ACTIVE') throw new ApiError(409, 'Circle not active');
      if (!circle.members.some((m) => m.userId === user.id)) throw new ApiError(403, 'Not a member');
      const cycle = await tx.cycle.findUniqueOrThrow({
        where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: circle.currentCycle } },
      });
      const dispute = await tx.dispute.create({
        data: { circleId: params.id, cycleId: cycle.id, raisedBy: user.id, description },
      });
      await audit(tx, user.id, params.id, 'DISPUTE_RAISED', dispute.id, { cycle: circle.currentCycle });
      return dispute;
    });
      void notifyCircle(params.id);
    return success({ dispute: result }, 201);
  } catch (e) {
    return failure(e);
  }
}