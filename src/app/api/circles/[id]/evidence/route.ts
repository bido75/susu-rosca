import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { lockCircle, audit } from '@/lib/circles';
import { storeEvidence, deleteEvidence } from '@/lib/evidence';

export const runtime = 'nodejs';

// Upload payment evidence (screenshot/receipt) for the caller's current-cycle
// contribution. Multipart form-data with a single `file` field.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const user = await requireUser();
  let storageKey: string | null = null;
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const stored = await storeEvidence(file as File);
    storageKey = stored.storageKey;

    const result = await db.$transaction(async (tx) => {
      await lockCircle(tx, params.id);
      const circle = await tx.circle.findUnique({ where: { id: params.id }, include: { members: true } });
      if (!circle || circle.status !== 'ACTIVE') throw new ApiError(409, 'Circle not active');
      if (!circle.members.some((m) => m.userId === user.id)) throw new ApiError(403, 'Not a member');
      const cycle = await tx.cycle.findUniqueOrThrow({
        where: { circleId_cycleNumber: { circleId: params.id, cycleNumber: circle.currentCycle } },
      });
      const contribution = await tx.contribution.findUnique({
        where: { cycleId_userId: { cycleId: cycle.id, userId: user.id } },
      });
      if (!contribution) throw new ApiError(404, 'Contribution not found');
      if (contribution.status !== 'PENDING' && contribution.status !== 'SUBMITTED') {
        throw new ApiError(409, 'Evidence can only be added before verification');
      }

      const evidence = await tx.contributionEvidence.create({
        data: {
          contributionId: contribution.id,
          fileName: (file as File).name || 'evidence',
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          storageKey: stored.storageKey,
          uploadedBy: user.id,
        },
      });
      await audit(tx, user.id, params.id, 'EVIDENCE_UPLOADED', evidence.id, {
        cycle: circle.currentCycle,
        contributionId: contribution.id,
      });
      return evidence;
    });

    return success({ evidence: result }, 201);
  } catch (e) {
    // Roll back the orphaned file if the DB write failed.
    if (storageKey) await deleteEvidence(storageKey).catch(() => {});
    return failure(e);
  }
}