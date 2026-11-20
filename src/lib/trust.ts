/**
 * Susu Trust Score — a versioned, deterministic community-activity metric.
 * This is NOT a credit bureau score and does not predict creditworthiness.
 */
export const TRUST_SCORE_MIN = 0;
export const TRUST_SCORE_MAX = 200;
export const TRUST_SCORE_INITIAL = 100;
export const TRUST_POLICY_VERSION = 1;

export const TRUST_DELTAS = {
  ON_TIME_CONTRIBUTION: 1,
  CYCLE_COMPLETED: 2,
  LATE_CONTRIBUTION: -2,
  DEFAULTED: -10,
} as const;

export function clampTrustScore(score: number): number {
  return Math.max(TRUST_SCORE_MIN, Math.min(TRUST_SCORE_MAX, score));
}

export function applyTrustDelta(current: number, delta: number): number {
  return clampTrustScore(current + delta);
}

/**
 * Trust delta for a verified contribution. Returns the on-time bonus when the
 * contribution was verified by its due date, otherwise the late penalty.
 */
export function contributionTrustDelta(verifiedAt: Date | null, dueDate: Date): number {
  if (!verifiedAt) return 0;
  return verifiedAt.getTime() <= dueDate.getTime()
    ? TRUST_DELTAS.ON_TIME_CONTRIBUTION
    : TRUST_DELTAS.LATE_CONTRIBUTION;
}

/**
 * Why a given delta is applied, for display in the score history.
 */
export function contributionTrustReason(delta: number): string {
  if (delta === TRUST_DELTAS.ON_TIME_CONTRIBUTION) return 'On-time contribution verified';
  if (delta === TRUST_DELTAS.LATE_CONTRIBUTION) return 'Late contribution verified';
  if (delta === TRUST_DELTAS.CYCLE_COMPLETED) return 'Cycle completed';
  if (delta === TRUST_DELTAS.DEFAULTED) return 'Contribution defaulted';
  return 'Score adjustment';
}
