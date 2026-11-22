import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { memberAccess } from '@/lib/circles';

export const dynamic = 'force-dynamic';

// Authorized retrieval of the CURRENT cycle's payout instructions for the
// assigned recipient. A circle member needs the FULL identifier to actually send
// money, so all members of the active cycle's circle see the full value here.
// Non-members never reach this code (memberAccess throws 403 first). History and
// audit views of past cycles remain masked (see CyclePayoutInstruction consumers).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const circle = await memberAccess(params.id, user.id);

    const cycle = circle.cycles.find((c) => c.cycleNumber === circle.currentCycle) ?? null;
    if (!cycle || !cycle.recipientUserId) {
      return success({ instructions: null, reason: 'No recipient assigned for the current cycle' });
    }

    const instruction = await db.cyclePayoutInstruction.findFirst({
      where: { cycleId: cycle.id, status: 'CONFIRMED' },
      orderBy: { version: 'desc' },
      include: { receivingMethod: { select: { id: true, kind: true, label: true } } },
    });

    if (!instruction) {
      return success({ instructions: null, recipientId: cycle.recipientUserId, reason: 'Payout instructions not yet confirmed' });
    }

    return success({
      instructions: {
        id: instruction.id,
        version: instruction.version,
        kind: instruction.kind,
        label: instruction.receivingMethod.label,
        // Full identifier for the active cycle — payers must see exactly where to
        // send funds. Membership is already enforced server-side.
        identifier: instruction.identifier ?? '',
        confirmedAt: instruction.confirmedAt,
        recipientId: cycle.recipientUserId,
        recipientName: circle.members.find((m) => m.userId === cycle.recipientUserId)?.user.fullName ?? null,
      },
      fullVisible: true,
    });
  } catch (e) {
    return failure(e);
  }
}