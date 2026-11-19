import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { audit, dueDate } from '@/lib/circles';
import { circleCreateSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const user = await requireUser();
    const circles = await db.circle.findMany({
      where: { members: { some: { userId: user.id } } },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success({ circles });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = circleCreateSchema.parse(await req.json());
    const start = new Date(`${input.startDate}T12:00:00Z`);
    const created = await db.$transaction(async (tx) => {
      const circle = await tx.circle.create({
        data: {
          name: input.name,
          contributionAmount: input.contributionAmount,
          frequency: input.frequency,
          totalCycles: input.totalCycles,
          mode: input.mode,
          startDate: start,
          createdBy: user.id,
          inviteCode: 'SUSU-' + randomBytes(8).toString('hex').toUpperCase(),
        },
      });
      await tx.circleMember.create({ data: { circleId: circle.id, userId: user.id } });
      for (let i = 1; i <= input.totalCycles; i++) {
        await tx.cycle.create({
          data: { circleId: circle.id, cycleNumber: i, dueDate: dueDate(start, input.frequency, i - 1) },
        });
      }
      await audit(tx, user.id, circle.id, 'CIRCLE_CREATED', circle.id, {
        name: circle.name,
        mode: circle.mode,
      });
      return circle;
    });
    return success({ circle: created }, 201);
  } catch (e) {
    return failure(e);
  }
}
