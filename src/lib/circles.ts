import { db } from './db';
import { ApiError } from './auth';
import { Prisma, type Circle } from '@prisma/client';
import { applyTrustDelta, TRUST_POLICY_VERSION } from './trust';

export { dueDate } from './dates';

/**
 * Apply a trust-score delta and append an immutable ScoreChange history row,
 * recording the previous/new values and the source event that caused it.
 * Must run inside the same transaction that produced the source event.
 */
export async function applyScoreChange(
  tx: Prisma.TransactionClient,
  userId: string,
  delta: number,
  reason: string,
  sourceEntity: string,
  sourceId: string | null,
) {
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
  const previousScore = user.susuTrustScore;
  const newScore = applyTrustDelta(previousScore, delta);
  await tx.user.update({ where: { id: userId }, data: { susuTrustScore: newScore } });
  await tx.scoreChange.create({
    data: {
      userId,
      delta,
      previousScore,
      newScore,
      reason,
      sourceEntity,
      sourceId,
      policyVersion: TRUST_POLICY_VERSION,
    },
  });
}

export async function memberAccess(circleId: string, userId: string) {
  const circle = await db.circle.findUnique({
    where: { id: circleId },
    include: {
      members: { include: { user: { select: { id: true, fullName: true, susuTrustScore: true, email: true, phoneNumber: true } } } },
      cycles: {
        orderBy: { cycleNumber: 'asc' },
        include: {
          contributions: {
            include: {
              user: { select: { id: true, fullName: true } },
              evidence: { select: { id: true, fileName: true, mimeType: true } },
            },
          },
          payoutInstructions: { orderBy: { version: 'desc' } },
          payoutAcknowledgments: { orderBy: { createdAt: 'desc' } },
        },
      },
      swaps: { orderBy: { createdAt: 'desc' }, take: 20 },
      disputes: { orderBy: { createdAt: 'desc' }, take: 20 },
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
    include: {
      contributions: {
        include: {
          user: { select: { id: true, fullName: true } },
          evidence: { select: { id: true, fileName: true, mimeType: true } },
        },
      },
      payoutInstructions: { orderBy: { version: 'desc' as const } },
      payoutAcknowledgments: { orderBy: { createdAt: 'desc' as const } },
    },
  },
  swaps: { orderBy: { createdAt: 'desc' as const }, take: 20 },
  disputes: { orderBy: { createdAt: 'desc' as const }, take: 20 },
};
