import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { organizerOnly, lockCircle, audit } from '@/lib/circles';
import { cryptoShuffle } from '@/lib/shuffle';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({
        where: { id: params.id },
        include: { members: true },
      });
      if (!circle) throw new ApiError(404, 'Circle not found');
      organizerOnly(circle, user.id);
      if (circle.status !== 'FORMING') throw new ApiError(409, 'Draw already completed.');
      if (circle.members.length !== circle.totalCycles) {
        throw new ApiError(409, `Need ${circle.totalCycles} members before drawing.`);
      }
      const members = cryptoShuffle(circle.members);
      for (let i = 0; i < members.length; i++) {
        await tx.circleMember.update({
          where: { id: members[i].id },
          data: { slotNumber: i + 1 },
        });
        await tx.cycle.update({
          where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: i + 1 } },
          data: { recipientUserId: members[i].userId, status: i === 0 ? 'ACTIVE' : 'PENDING' },
        });
      }
      const cycle = await tx.cycle.findUniqueOrThrow({
        where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: 1 } },
      });
      for (const m of members) {
        await tx.contribution.create({
          data: { cycleId: cycle.id, userId: m.userId, amount: circle.contributionAmount },
        });
      }
      await tx.circle.update({ where: { id: params.id }, data: { status: 'ACTIVE' } });
      await audit(tx, user.id, params.id, 'SLOTS_DRAWN', params.id, {
        assignments: members.map((m, i) => ({ userId: m.userId, slot: i + 1 })),
      });
      return { assignments: members.map((m, i) => ({ userId: m.userId, slot: i + 1 })) };
    });
    return success(result);
  } catch (e) {
    return failure(e);
  }
}
