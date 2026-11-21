import { notifyCircle } from '@/lib/realtime';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { organizerOnly, lockCircle, audit } from '@/lib/circles';
import { sendMail } from '@/lib/mail';
import { logger } from '@/lib/logger';

const schema = z.object({ userId: z.uuid() });

// Organizer sends an email reminder to a member with a pending contribution.
// Real email when SMTP is configured; logged (dev only) otherwise.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const { userId } = schema.parse(await req.json());
    const { email, subject, text, cycle } = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({ where: { id: params.id } });
      if (!circle) throw new ApiError(404, 'Circle not found');
      organizerOnly(circle, user.id);
      const member = await tx.circleMember.findUnique({ where: { circleId_userId: { circleId: params.id, userId } } });
      if (!member) throw new ApiError(404, 'Member not found');
      const memberUser = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const cyc = await tx.cycle.findUniqueOrThrow({
        where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: circle.currentCycle } },
      });

      const amount = circle.contributionAmount.toString();
      await audit(tx, user.id, params.id, 'REMINDER_SENT', userId, { cycle: circle.currentCycle, memberId: userId });
      return {
        email: memberUser.email,
        subject: `Reminder: your ${circle.name} contribution is due`,
        text: `Hi ${memberUser.fullName.split(' ')[0]}, this is a friendly reminder that your $${amount} contribution for "${circle.name}" (Cycle ${circle.currentCycle}) is due. Please pay your organizer outside SusuFlow and submit your payment reference.`,
        cycle: circle.currentCycle,
      };
    });

    // Send outside the transaction/lock so a slow mail provider can't block
    // other members and an email failure doesn't roll back the audit record.
    try {
      await sendMail({ to: email, subject, text });
    } catch (e) {
      logger.error('Reminder email delivery failed', {
        message: e instanceof Error ? e.message : String(e),
        to: email,
      });
    }

    void notifyCircle(params.id);
    return success({ reminded: true, cycle });
  } catch (e) {
    return failure(e);
  }
}