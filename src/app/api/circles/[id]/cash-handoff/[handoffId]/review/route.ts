import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { organizerOnly, lockCircle, audit } from '@/lib/circles';
import { cashHandoffReviewSchema } from '@/lib/schemas';

// Organizer approves/rejects an exceptional cash payout request. Approval does
// NOT confirm cash changed hands — it only authorizes the handoff arrangement.
// An independent witness (not payer, not recipient) must be assigned on approval.
export async function POST(req: Request, ctx: { params: Promise<{ id: string; handoffId: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const input = cashHandoffReviewSchema.parse(await req.json());

    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUniqueOrThrow({ where: { id: params.id } });
      organizerOnly(circle, user.id);

      const request = await tx.cashHandoffRequest.findUnique({ where: { id: params.handoffId } });
      if (!request || request.circleId !== params.id) throw new ApiError(404, 'Cash request not found');
      if (request.status !== 'PENDING') throw new ApiError(409, 'Cash request already reviewed');

      if (input.approve) {
        if (!input.witnessUserId) throw new ApiError(400, 'A witness is required to approve a cash handoff');
        if (input.witnessUserId === request.recipientUserId || input.witnessUserId === user.id) {
          throw new ApiError(400, 'Witness must not be the payer or the recipient');
        }
        const updated = await tx.cashHandoffRequest.update({
          where: { id: request.id },
          data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date(), witnessUserId: input.witnessUserId },
        });
        await audit(tx, user.id, params.id, 'CASH_APPROVED', request.id, { witnessUserId: input.witnessUserId });
        return updated;
      }

      if (!input.reason) throw new ApiError(400, 'A reason is required to reject');
      const updated = await tx.cashHandoffRequest.update({
        where: { id: request.id },
        data: { status: 'REJECTED', rejectionReason: input.reason, approvedBy: user.id, approvedAt: new Date() },
      });
      await audit(tx, user.id, params.id, 'CASH_REJECTED', request.id, { reason: input.reason.slice(0, 120) });
      return updated;
    });

    void notifyCircle(params.id);
    return success({ request: result });
  } catch (e) {
    return failure(e);
  }
}