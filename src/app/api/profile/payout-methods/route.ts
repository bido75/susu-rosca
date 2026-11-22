import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { payoutMethodSchema } from '@/lib/schemas';
import { normalizeIdentifier } from '@/lib/payoutMethods';

export const dynamic = 'force-dynamic';

// List the authenticated user's own payout receiving methods (full identifier
// returned only because it is the caller's own data).
export async function GET() {
  try {
    const user = await requireUser();
    const methods = await db.payoutReceivingMethod.findMany({
      where: { userId: user.id },
      orderBy: [{ isPreferred: 'desc' }, { createdAt: 'asc' }],
    });
    return success({ methods });
  } catch (e) {
    return failure(e);
  }
}

// Register a new payout receiving method (Zelle / Cash App / Venmo only).
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = payoutMethodSchema.parse(await req.json());
    const norm = normalizeIdentifier(input.kind, input.identifier);

    // A preferred method requires confirmation this release; otherwise keep it ENTERED.
    const status = input.confirm ? 'CONFIRMED' : 'ENTERED';
    const method = await db.payoutReceivingMethod.create({
      data: {
        userId: user.id,
        kind: input.kind,
        identifier: norm.value,
        label: input.label,
        status,
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
        isPreferred: false,
      },
    });

    return success({ method }, 201);
  } catch (e) {
    return failure(e);
  }
}