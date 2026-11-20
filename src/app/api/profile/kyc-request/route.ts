import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';

// A user requests verification, moving them UNVERIFIED -> PENDING for review.
export async function POST() {
  try {
    const user = await requireUser();
    if (user.kycStatus === 'VERIFIED') throw new ApiError(409, 'Already verified');
    await db.user.update({ where: { id: user.id }, data: { kycStatus: 'PENDING' } });
    return success({ kycStatus: 'PENDING' });
  } catch (e) {
    return failure(e);
  }
}