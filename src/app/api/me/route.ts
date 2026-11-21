import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Minimal identity payload for the signed-in user, used by the client to attach
// Sentry user context (so bug reports can be attributed). Deliberately limited to
// non-sensitive fields; the session is read from the HTTP-only cookie server-side.
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return Response.json({ user: null });
  }
  return Response.json({
    user: {
      id: user.id,
      name: user.fullName,
      email: user.email,
    },
  });
}