import { Client } from 'pg';

/**
 * Real-time notification helpers backed by PostgreSQL LISTEN/NOTIFY.
 *
 * `notifyCircle` publishes a short-lived NOTIFY from a throwaway connection
 * after a mutation; `subscribeCircle` holds a dedicated LISTEN connection for
 * the lifetime of an SSE stream. The database is the source of truth — these
 * notifications only tell clients to refetch authorized data.
 */

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 5432),
    database: u.pathname.slice(1) || undefined,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: u.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : undefined,
  };
}

export function circleChannel(circleId: string) {
  return `circle_${circleId.replace(/-/g, '')}`;
}

/** Publish a one-shot change notification for a circle. */
export async function notifyCircle(circleId: string): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const client = new Client(parseDbUrl(url));
  try {
    await client.connect();
    // NOTIFY cannot be parameterized; the channel name is derived from a
    // validated UUID and carries no user input, so this is safe.
    await client.query(`NOTIFY ${circleChannel(circleId)}, '${circleId}'`);
  } catch {
    // Notifications are best-effort; a failed notify must never fail the mutation.
  } finally {
    await client.end().catch(() => {});
  }
}

/** Subscribe to a circle's notifications, invoking `onChange` on each event. */
export async function subscribeCircle(
  circleId: string,
  onChange: () => void,
  signal: AbortSignal,
): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const client = new Client(parseDbUrl(url));
  const channel = circleChannel(circleId);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    void client.end().catch(() => {});
  };

  client.on('notification', () => onChange());
  client.on('error', () => {});
  client.once('end', () => {
    // Reconnect on connection drop until aborted.
    if (!signal.aborted && !closed) {
      setTimeout(() => {
        if (signal.aborted || closed) return;
        void client.connect().then(() => client.query(`LISTEN ${channel}`)).catch(() => {});
      }, 1000);
    }
  });

  signal.addEventListener('abort', close, { once: true });

  try {
    await client.connect();
    await client.query(`LISTEN ${channel}`);
  } catch {
    close();
  }
}