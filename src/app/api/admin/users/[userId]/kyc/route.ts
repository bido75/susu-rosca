import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';

const schema = z.object({ kycStatus: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']) });

// Admin sets a user's KYC status after manual identity review. There is no
// self-service verification — this mirrors an offline review workflow.
export async function POST(req: Request, ctx: { params: Promise<{ userId: string }> }) {
  try {
    const params = await ctx.params;
    const admin = await requireAdmin();
    const { kycStatus } = schema.parse(await req.json());
    const target = await db.user.findUnique({ where: { id: params.userId } });
    if (!target) throw new ApiError(404, 'User not found');
    const updated = await db.user.update({ where: { id: params.userId }, data: { kycStatus } });
    return success({ user: { id: updated.id, kycStatus: updated.kycStatus }, by: admin.id });
  } catch (e) {
    return failure(e);
  }
}