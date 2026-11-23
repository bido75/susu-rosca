import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { lockCircle, audit } from '@/lib/circles';
import { payoutAcknowledgmentSchema } from '@/lib/schemas';
import { notifyOrganizer } from '@/lib/notifications';

// The assigned recipient acknowledgments receipt — or reports a discrepancy
// (not received, wrong amount, wrong identifier, duplicate, other). This is a
// claim, NOT bank/provider settlement, and never overrides organizer verification.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const input = payoutAcknowledgmentSchema.parse(await req.json());

    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({
        where: { id: params.id },
        include: { cycles: true },
      });
      if (!circle) throw new ApiError(404, 'Circle not found');
      const cycle = circle.cycles.find((c) => c.cycleNumber === circle.currentCycle);
      if (!cycle) throw new ApiError(409, 'No current cycle');
      if (cycle.recipientUserId !== user.id) {
        throw new ApiError(403, 'Only the assigned recipient may acknowledge this payout');
      }

      const ack = await tx.payoutAcknowledgment.create({
        data: {
          cycleId: cycle.id,
          recipientUserId: user.id,
          type: input.type,
          note: input.note,
        },
      });

      await audit(tx, user.id, params.id, 'PAYOUT_ACKNOWLEDGED', ack.id, {
        cycle: circle.currentCycle,
        type: input.type,
        note: input.type === 'RECEIVED' ? undefined : input.note?.slice(0, 120),
      });
      return ack;
    });

    void notifyCircle(params.id);
    notifyOrganizer(
      params.id,
      result.type === 'RECEIVED' ? 'Recipient confirmed receipt' : 'Payout discrepancy reported',
      result.type === 'RECEIVED'
        ? 'The recipient acknowledged receiving this payout. Confirm it matches your records.'
        : 'The recipient reported a payout discrepancy. Review it in SusuFlow.',
    );
    return success({ acknowledgment: result }, 201);
  } catch (e) {
    return failure(e);
  }
}