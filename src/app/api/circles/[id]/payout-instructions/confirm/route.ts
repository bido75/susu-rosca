import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { lockCircle, audit } from '@/lib/circles';
import { cycleInstructionConfirmSchema } from '@/lib/schemas';

// The assigned recipient confirms (or reconfirms) their payout instructions for
// the current cycle. Creates a new versioned snapshot; a prior confirmed version
// is superseded (never silently overwritten). Only the assigned recipient may
// confirm their own instructions.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const { receivingMethodId } = cycleInstructionConfirmSchema.parse(await req.json());

    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({
        where: { id: params.id },
        include: { members: true, cycles: { include: { payoutInstructions: true } } },
      });
      if (!circle || circle.status !== 'ACTIVE') throw new ApiError(409, 'Circle not active');

      const cycle = circle.cycles.find((c) => c.cycleNumber === circle.currentCycle);
      if (!cycle || cycle.recipientUserId !== user.id) {
        throw new ApiError(403, 'Only the assigned recipient may confirm payout instructions');
      }

      const method = await tx.payoutReceivingMethod.findUnique({ where: { id: receivingMethodId } });
      if (!method || method.userId !== user.id) throw new ApiError(404, 'Payout method not found');
      if (method.status !== 'CONFIRMED') throw new ApiError(409, 'Confirm the payout details first');

      // Supersede any currently-confirmed instruction for this cycle.
      const prior = cycle.payoutInstructions.filter((i) => i.status === 'CONFIRMED');
      for (const p of prior) {
        await tx.cyclePayoutInstruction.update({
          where: { id: p.id },
          data: { status: 'DISABLED', supersededAt: new Date() },
        });
      }

      const nextVersion = (prior.reduce((m, p) => Math.max(m, p.version), 0)) + 1;
      const instruction = await tx.cyclePayoutInstruction.create({
        data: {
          circleId: params.id,
          cycleId: cycle.id,
          recipientUserId: user.id,
          receivingMethodId: method.id,
          kind: method.kind,
          identifier: method.identifier,
          version: nextVersion,
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      await audit(tx, user.id, params.id, 'PAYOUT_INSTRUCTIONS_CONFIRMED', instruction.id, {
        cycle: circle.currentCycle,
        version: nextVersion,
        kind: method.kind,
      });
      return instruction;
    });

    void notifyCircle(params.id);
    return success({ instruction: result });
  } catch (e) {
    return failure(e);
  }
}