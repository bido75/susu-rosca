import { db } from './db';
import { ApiError } from './auth';
import { Prisma, type Circle } from '@prisma/client';

export { dueDate } from './dates';

export async function memberAccess(circleId: string, userId: string) {
  const circle = await db.circle.findUnique({
    where: { id: circleId },
    include: {
      members: { include: { user: { select: { id: true, fullName: true, susuTrustScore: true, email: true, phoneNumber: true } } } },
      cycles: {
        orderBy: { cycleNumber: 'asc' },
        include: { contributions: { include: { user: { select: { id: true, fullName: true } } } } },
      },
      swaps: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!circle || !circle.members.some((m) => m.userId === userId)) {
    throw new ApiError(404, 'Circle not found.');
  }
  return circle;
}

export function organizerOnly(circle: { createdBy: string }, userId: string) {
  if (circle.createdBy !== userId) throw new ApiError(403, 'Organizer only.');
}

export async function lockCircle(tx: Prisma.TransactionClient, id: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
}

export async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  circleId: string,
  action: string,
  entityId: string,
  metadata: Prisma.InputJsonValue = {},
) {
  await tx.auditLog.create({
    data: { actorId, circleId, action, targetEntity: 'Circle', entityId, metadata },
  });
}

export function ensureForming(circle: Circle) {
  if (circle.status !== 'FORMING') throw new ApiError(409, 'Circle is no longer forming.');
}

export const fullCircle = {
  members: { include: { user: { select: { id: true, fullName: true, susuTrustScore: true, email: true, phoneNumber: true } } } },
  cycles: {
    orderBy: { cycleNumber: 'asc' as const },
    include: { contributions: { include: { user: { select: { id: true, fullName: true } } } } },
  },
  swaps: { orderBy: { createdAt: 'desc' as const }, take: 20 },
};
