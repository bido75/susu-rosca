export type Frequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

/**
 * Compute a cycle due date from a base date, frequency, and zero-based
 * cycle index. Monthly cycles clamp to the original day-of-month.
 */
export function dueDate(base: Date, frequency: Frequency, index: number): Date {
  const d = new Date(base);
  if (frequency === 'MONTHLY') {
    const originalDay = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + index);
    const maxDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(originalDay, maxDay));
  } else {
    d.setUTCDate(d.getUTCDate() + index * (frequency === 'WEEKLY' ? 7 : 14));
  }
  return d;
}
