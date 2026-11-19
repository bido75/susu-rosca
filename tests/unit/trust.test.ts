import { describe, it, expect } from 'vitest';
import {
  TRUST_SCORE_MIN,
  TRUST_SCORE_MAX,
  TRUST_SCORE_INITIAL,
  TRUST_DELTAS,
  clampTrustScore,
  applyTrustDelta,
  contributionTrustDelta,
} from '@/lib/trust';

describe('trust score policy', () => {
  it('initial score is 100 and range is 0..200', () => {
    expect(TRUST_SCORE_INITIAL).toBe(100);
    expect(TRUST_SCORE_MIN).toBe(0);
    expect(TRUST_SCORE_MAX).toBe(200);
  });

  it('defines the versioned beta deltas', () => {
    expect(TRUST_DELTAS.ON_TIME_CONTRIBUTION).toBe(1);
    expect(TRUST_DELTAS.CYCLE_COMPLETED).toBe(2);
    expect(TRUST_DELTAS.LATE_CONTRIBUTION).toBe(-2);
    expect(TRUST_DELTAS.DEFAULTED).toBe(-10);
  });

  it('clamps scores to the allowed range', () => {
    expect(clampTrustScore(-5)).toBe(0);
    expect(clampTrustScore(50)).toBe(50);
    expect(clampTrustScore(999)).toBe(200);
  });

  it('applies deltas with clamping', () => {
    expect(applyTrustDelta(100, 1)).toBe(101);
    expect(applyTrustDelta(0, -1)).toBe(0);
    expect(applyTrustDelta(199, 10)).toBe(200);
  });

  it('awards +1 for on-time verification and -2 for late', () => {
    const due = new Date('2026-01-10T00:00:00.000Z');
    expect(contributionTrustDelta(new Date('2026-01-09T23:59:59.000Z'), due)).toBe(1);
    expect(contributionTrustDelta(new Date('2026-01-10T00:00:00.000Z'), due)).toBe(1);
    expect(contributionTrustDelta(new Date('2026-01-11T00:00:00.000Z'), due)).toBe(-2);
  });

  it('returns 0 for unverified contributions', () => {
    expect(contributionTrustDelta(null, new Date())).toBe(0);
  });
});
