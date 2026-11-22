import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';

export const dynamic = 'force-dynamic';

// List candidate independent witnesses for a cash handoff: circle members who
// are neither the organizer (payer) nor the current cycle recipient. Used by the
// organizer to assign an independent witness at approval time.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const circle = await db.circle.findUnique({
      where: { id: params.id },
      include: { members: { include: { user: { select: { id: true, fullName: true } } } }, cycles: true },
    });
    if (!circle) throw new ApiError(404, 'Circle not found');
    if (circle.createdBy !== user.id) throw new ApiError(403, 'Organizer only');

    const currentRecipient = circle.cycles.find((c) => c.cycleNumber === circle.currentCycle)?.recipientUserId ?? null;

    const members = circle.members
      .map((m) => ({ id: m.userId, name: m.user.fullName }))
      .filter((m) => m.id !== circle.createdBy && m.id !== currentRecipient);

    return success({ members });
  } catch (e) {
    return failure(e);
  }
}