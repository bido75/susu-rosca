import { notifyCircle } from '@/lib/realtime';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { organizerOnly, lockCircle, audit } from '@/lib/circles';
import { circleFairValueSchema } from '@/lib/schemas';

// Organizer-only edit of the Fair-Value slot adjustment. Lets the organizer
// change or remove (0%) the early-slot fee / anchor bonus — e.g. when members
// dispute the 2% anchor bonus as unfair. The adjustment is display guidance
// (the platform never holds or moves money), so it may be edited at any time
// and is audited for transparency.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const { fairValueSlots, fairValueBonusPercent } = circleFairValueSchema.parse(await req.json());

    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUniqueOrThrow({ where: { id: params.id } });
      organizerOnly(circle, user.id);

      await tx.circle.update({
        where: { id: params.id },
        data: { fairValueSlots, fairValueBonusPercent },
      });

      await audit(tx, user.id, params.id, 'FAIR_VALUE_UPDATED', circle.id, {
        fairValueSlots,
        fairValueBonusPercent,
      });

      return { fairValueSlots, fairValueBonusPercent };
    });

    void notifyCircle(params.id);
    return success(result);
  } catch (e) {
    return failure(e);
  }
}