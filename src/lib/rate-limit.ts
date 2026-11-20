import { ApiError } from './auth';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function cleanup(now: number) {
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

/**
 * In-process sliding-window rate limiter. Suitable for a single self-hosted
 * instance. For horizontally scaled deployments, replace this with a shared
 * store (Redis / Upstash) so limits are consistent across instances.
 */
export function rateLimit(key: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  cleanup(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) {
    throw new ApiError(429, 'Too many requests. Please try again shortly.');
  }
}

/** Best-effort client key for a Next.js route handler Request. */
export function clientKey(req: Request, prefix: string) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return `${prefix}:${ip}`;
}
