import { describe, it, expect } from 'vitest';
import { cryptoShuffle } from '@/lib/shuffle';

describe('cryptoShuffle', () => {
  it('returns a permutation of the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = cryptoShuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b));
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const snapshot = [...input];
    cryptoShuffle(input);
    expect(input).toEqual(snapshot);
  });

  it('produces unique orderings over many shuffles (no fixed bias)', () => {
    const input = ['a', 'b', 'c', 'd', 'e', 'f'];
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(cryptoShuffle(input).join(''));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('handles empty and single-element inputs', () => {
    expect(cryptoShuffle([])).toEqual([]);
    expect(cryptoShuffle(['only'])).toEqual(['only']);
  });
});
