import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { lockCircle, audit } from '@/lib/circles';
import { cashHandoffConfirmationSchema } from '@/lib/schemas';
import { notifyOrganizer } from '@/lib/notifications';

// Payer / recipient / witness independently confirm a cash handoff. Each role
// confirms once, and may only confirm facts it personally observed. A payer may
// not impersonate the witness; the organizer may not impersonate the witness.
export async function POST(req: Request, ctx: { params: Promise<{ id: string; handoffId: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const { role } = cashHandoffConfirmationSchema.parse(await req.json());

    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({ where: { id: params.id }, include: { members: true } });
      if (!circle) throw new ApiError(404, 'Circle not found');

      const request = await tx.cashHandoffRequest.findUnique({
        where: { id: params.handoffId },
        include: { confirmations: true },
      });
      if (!request || request.circleId !== params.id) throw new ApiError(404, 'Cash handoff not found');
      if (request.status !== 'APPROVED') throw new ApiError(409, 'Cash handoff must be approved first');

      // Authorize by role against the actual assigned identities.
      const payerId = circle.createdBy;
      if (role === 'WITNESS' && (request.witnessUserId !== user.id || user.id === payerId || user.id === request.recipientUserId)) {
        throw new ApiError(403, 'You are not the assigned independent witness for this handoff');
      }
      if (role === 'RECIPIENT' && request.recipientUserId !== user.id) {
        throw new ApiError(403, 'Only the recipient may confirm receipt');
      }
      if (role === 'PAYER' && payerId !== user.id) {
        throw new ApiError(403, 'Only the organizer (payer) may confirm the handover');
      }
      if (!circle.members.some((m) => m.userId === user.id)) throw new ApiError(403, 'Not a member');

      const already = request.confirmations.find((c) => c.role === role);
      if (already) throw new ApiError(409, `${role} already confirmed`);

      const confirmation = await tx.cashHandoffConfirmation.create({
        data: { handoffId: request.id, role, userId: user.id },
      });

      await audit(tx, user.id, params.id, 'CASH_HANDOFF_CONFIRMED', request.id, { role });
      return confirmation;
    });

    void notifyCircle(params.id);
    notifyOrganizer(params.id, 'Cash handoff confirmation recorded', `A ${result.role.toLowerCase()} confirmation was recorded for an approved cash handoff.`);
    return success({ confirmation: result }, 201);
  } catch (e) {
    return failure(e);
  }
}