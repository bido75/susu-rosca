import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { lockCircle, audit } from '@/lib/circles';
import { cashHandoffRequestSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

// The assigned recipient requests an exceptional cash payout for the current
// cycle. Cash is NOT a normal payout preference and always requires organizer
// approval + an independent witness before any handoff may be recorded.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const input = cashHandoffRequestSchema.parse(await req.json());

    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({ where: { id: params.id }, include: { cycles: true } });
      if (!circle || circle.status !== 'ACTIVE') throw new ApiError(409, 'Circle not active');
      const cycle = circle.cycles.find((c) => c.cycleNumber === circle.currentCycle);
      if (!cycle) throw new ApiError(409, 'No current cycle');
      // Authorization first: only the assigned recipient may request cash, and we
      // must not leak state (e.g. "already requested") to non-recipients.
      if (cycle.recipientUserId !== user.id) {
        throw new ApiError(403, 'Only the assigned recipient may request a cash payout');
      }
      if (cycle.status === 'DISBURSED') throw new ApiError(409, 'Cycle already disbursed');

      const openDispute = await tx.dispute.findFirst({
        where: { circleId: params.id, cycleId: cycle.id, status: 'OPEN' },
      });
      if (openDispute) throw new ApiError(409, 'Cannot schedule cash while a dispute is open');

      const existing = await tx.cashHandoffRequest.findFirst({
        where: { cycleId: cycle.id, status: { in: ['PENDING', 'APPROVED'] } },
      });
      if (existing) throw new ApiError(409, 'A cash request already exists for this cycle');

      const request = await tx.cashHandoffRequest.create({
        data: {
          circleId: params.id,
          cycleId: cycle.id,
          recipientUserId: user.id,
          amount: input.amount,
          reason: input.reason,
          proposedDate: new Date(`${input.proposedDate}T12:00:00Z`),
          arrangement: input.arrangement,
        },
      });

      await audit(tx, user.id, params.id, 'CASH_REQUESTED', request.id, {
        cycle: circle.currentCycle,
        amount: input.amount.toFixed(2),
      });
      return request;
    });

    void notifyCircle(params.id);
    return success({ request: result }, 201);
  } catch (e) {
    return failure(e);
  }
}

// Authorized members retrieve the current cash-handoff request (if any).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const circle = await db.circle.findUnique({
      where: { id: params.id },
      include: { members: true, cycles: true },
    });
    if (!circle || !circle.members.some((m) => m.userId === user.id)) throw new ApiError(403, 'Not a member');
    const cycle = circle.cycles.find((c) => c.cycleNumber === circle.currentCycle);
    if (!cycle) return success({ request: null });

    const request = await db.cashHandoffRequest.findFirst({
      where: { cycleId: cycle.id },
      orderBy: { createdAt: 'desc' },
      include: {
        confirmations: { select: { role: true, userId: true, confirmedAt: true } },
        witness: { select: { id: true, fullName: true } },
      },
    });
    return success({ request });
  } catch (e) {
    return failure(e);
  }
}