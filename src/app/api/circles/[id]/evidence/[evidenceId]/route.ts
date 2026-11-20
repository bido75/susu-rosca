import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure } from '@/lib/http';
import { readEvidence } from '@/lib/evidence';

export const runtime = 'nodejs';

// Serve a stored evidence file. Only the contribution owner (or the circle
// organizer) may read it — other members see nothing.
export async function GET(
  _: Request,
  ctx: { params: Promise<{ id: string; evidenceId: string }> },
) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    const evidence = await db.contributionEvidence.findUnique({
      where: { id: params.evidenceId },
      include: {
        contribution: { select: { userId: true, cycle: { select: { circleId: true } } } },
      },
    });
    if (!evidence || evidence.contribution.cycle.circleId !== params.id) {
      throw new ApiError(404, 'Evidence not found');
    }
    // Verify membership and organizer status without loading the full circle.
    const circle = await db.circle.findUnique({
      where: { id: params.id },
      select: { createdBy: true, members: { where: { userId: user.id }, select: { id: true } } },
    });
    if (!circle || circle.members.length === 0) throw new ApiError(403, 'Not a member');
    const isOwner = evidence.contribution.userId === user.id;
    const isOrganizer = circle.createdBy === user.id;
    if (!isOwner && !isOrganizer) throw new ApiError(403, 'Not authorized to view this evidence');

    const buf = await readEvidence(evidence.storageKey);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': evidence.mimeType,
        'Content-Length': String(buf.length),
        'Content-Disposition': `inline; filename="${encodeURIComponent(evidence.fileName)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    return failure(e);
  }
}