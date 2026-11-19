import { randomInt } from 'node:crypto';

/**
 * Unbiased Fisher-Yates shuffle using a cryptographically secure
 * source of randomness. Never use Math.random() for financial order.
 */
export function cryptoShuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
