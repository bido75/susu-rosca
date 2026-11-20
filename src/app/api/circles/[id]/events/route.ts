import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { memberAccess } from '@/lib/circles';
import { failure } from '@/lib/http';
import { subscribeCircle } from '@/lib/realtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Push-based Server-Sent Events via PostgreSQL LISTEN/NOTIFY. The database
// stays the source of truth; this only tells authorized clients to refetch.
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const user = await requireUser();
    await memberAccess(params.id, user.id);

    const encoder = new TextEncoder();
    let controllerRef: ReadableStreamDefaultController | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const emit = () => {
      controllerRef?.enqueue(encoder.encode(`event: changed\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`));
    };

    const stream = new ReadableStream({
      start(controller) {
        controllerRef = controller;
        controller.enqueue(encoder.encode('retry: 3000\n\n'));

        const ac = new AbortController();
        void subscribeCircle(params.id, emit, ac.signal).catch(() => {});

        // Slow heartbeat keeps the stream alive and guards against a missed
        // notification (e.g. a mutation that predates subscription).
        heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        }, 25_000);

        // Track a stable version so a reconnect can still reconcile.
        const versionPoll = setInterval(() => emit(), 60_000);
        ac.abort = () => clearInterval(versionPoll);
      },
      cancel() {
        if (heartbeat) clearInterval(heartbeat);
        controllerRef = null;
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    return failure(e);
  }
}