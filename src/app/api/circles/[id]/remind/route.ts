import { notifyCircle } from '@/lib/realtime';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { organizerOnly, lockCircle, audit } from '@/lib/circles';

const schema = z.object({ userId: z.uuid() });

// Organizer sends an email reminder to a member with a pending contribution.
// Real email when SMTP is configured; logged (dev only) otherwise.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const { userId } = schema.parse(await req.json());
    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({ where: { id: params.id } });
      if (!circle) throw new ApiError(404, 'Circle not found');
      organizerOnly(circle, user.id);
      const member = await tx.circleMember.findUnique({ where: { circleId_userId: { circleId: params.id, userId } } });
      if (!member) throw new ApiError(404, 'Member not found');
      const memberUser = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const cycle = await tx.cycle.findUniqueOrThrow({
        where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: circle.currentCycle } },
      });

      const amount = circle.contributionAmount.toString();
      const subject = `Reminder: your ${circle.name} contribution is due`;
      const text = `Hi ${memberUser.fullName.split(' ')[0]}, this is a friendly reminder that your $${amount} contribution for "${circle.name}" (Cycle ${circle.currentCycle}) is due. Please pay your organizer outside SusuFlow and submit your payment reference.`;

      if (process.env.SMTP_HOST) {
        const { default: nodemailer } = await import('nodemailer');
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT || 587) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        });
        await transport.sendMail({ from: process.env.SMTP_FROM, to: memberUser.email, subject, text });
      } else if (process.env.NODE_ENV === 'development') {
        console.info(`[DEV ONLY] Reminder for ${memberUser.email}: ${text}`);
      }

      await audit(tx, user.id, params.id, 'REMINDER_SENT', userId, { cycle: circle.currentCycle, memberId: userId });
      return { reminded: true };
    });
      void notifyCircle(params.id);
  return success(result);
  } catch (e) {
    return failure(e);
  }
}