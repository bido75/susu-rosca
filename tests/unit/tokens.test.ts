import { describe, it, expect } from 'vitest';
import { newCode, newToken, hashToken } from '@/lib/tokens';

describe('auth tokens', () => {
  it('generates a 6-digit code', () => {
    for (let i = 0; i < 200; i++) {
      expect(newCode()).toMatch(/^\d{6}$/);
    }
  });

  it('produces a variety of codes over many draws', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(newCode());
    expect(seen.size).toBeGreaterThan(10);
  });

  it('generates a 64-hex token', () => {
    expect(newToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes to a stable 64-hex digest', () => {
    expect(hashToken('123456')).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken('123456')).toBe(hashToken('123456'));
    expect(hashToken('123456')).not.toBe(hashToken('123457'));
  });
});
