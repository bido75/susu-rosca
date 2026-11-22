import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { payoutMethodSchema, payoutMethodStatusSchema } from '@/lib/schemas';
import { normalizeIdentifier } from '@/lib/payoutMethods';

export const dynamic = 'force-dynamic';

// Update the caller's own receiving method (identifier/label/confirm), or its
// status (CONFIRMED/DISABLED). Preferred flag is set via the set-preferred route.
async function patch(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const params = await ctx.params;
  const method = await db.payoutReceivingMethod.findUnique({ where: { id: params.id } });
  if (!method || method.userId !== user.id) throw new ApiError(404, 'Payout method not found');

  const body = await req.json();

  // Status-only updates (confirm/disable/enable) do not re-validate the identifier.
  if (body && typeof body === 'object' && 'status' in body && !('identifier' in body)) {
    const { status } = payoutMethodStatusSchema.parse(body);
    const updated = await db.payoutReceivingMethod.update({
      where: { id: method.id },
      data: {
        status,
        confirmedAt: status === 'CONFIRMED' ? new Date() : method.confirmedAt,
      },
    });
    return success({ method: updated });
  }

  const input = payoutMethodSchema.parse(body);
  const norm = normalizeIdentifier(input.kind, input.identifier);
  const updated = await db.payoutReceivingMethod.update({
    where: { id: method.id },
    data: {
      kind: input.kind,
      identifier: norm.value,
      label: input.label,
      status: input.confirm ? 'CONFIRMED' : 'ENTERED',
      confirmedAt: input.confirm ? new Date() : null,
    },
  });
  return success({ method: updated });
}

// Deactivate/remove the caller's own receiving method.
async function del(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const params = await ctx.params;
  const method = await db.payoutReceivingMethod.findUnique({ where: { id: params.id } });
  if (!method || method.userId !== user.id) throw new ApiError(404, 'Payout method not found');
  await db.payoutReceivingMethod.delete({ where: { id: method.id } });
  return success({ removed: true });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    return await patch(req, ctx);
  } catch (e) {
    return failure(e);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    return await del(req, ctx);
  } catch (e) {
    return failure(e);
  }
}