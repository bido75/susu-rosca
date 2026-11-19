import { describe, it, expect } from 'vitest';
import { dueDate } from '@/lib/dates';

function utc(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d));
}

describe('dueDate', () => {
  it('returns the base date at index 0', () => {
    const base = utc(2026, 1, 10);
    expect(dueDate(base, 'MONTHLY', 0).toISOString()).toBe('2026-01-10T00:00:00.000Z');
  });

  it('advances weekly by 7 days per index', () => {
    const base = utc(2026, 1, 10);
    expect(dueDate(base, 'WEEKLY', 1).toISOString()).toBe('2026-01-17T00:00:00.000Z');
    expect(dueDate(base, 'WEEKLY', 3).toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });

  it('advances biweekly by 14 days per index', () => {
    const base = utc(2026, 1, 10);
    expect(dueDate(base, 'BIWEEKLY', 2).toISOString()).toBe('2026-02-07T00:00:00.000Z');
  });

  it('advances monthly and preserves the day of month', () => {
    const base = utc(2026, 1, 10);
    expect(dueDate(base, 'MONTHLY', 1).toISOString()).toBe('2026-02-10T00:00:00.000Z');
    expect(dueDate(base, 'MONTHLY', 5).toISOString()).toBe('2026-06-10T00:00:00.000Z');
  });

  it('clamps month-end dates to the last day of the target month', () => {
    expect(dueDate(utc(2026, 1, 31), 'MONTHLY', 1).toISOString()).toBe('2026-02-28T00:00:00.000Z');
    expect(dueDate(utc(2026, 1, 31), 'MONTHLY', 2).toISOString()).toBe('2026-03-31T00:00:00.000Z');
  });

  it('handles leap years for February', () => {
    expect(dueDate(utc(2024, 1, 31), 'MONTHLY', 1).toISOString()).toBe('2024-02-29T00:00:00.000Z');
  });
});
