import { describe, it, expect } from 'vitest';
import { circleCreateSchema, contributionSchema, payoutRefSchema } from '@/lib/schemas';

const validCircle = {
  name: 'Family & Friends Savings',
  contributionAmount: 500,
  frequency: 'MONTHLY',
  totalCycles: 6,
  mode: 'LEDGER',
  startDate: '2030-01-05',
};

describe('circleCreateSchema', () => {
  it('accepts a valid circle', () => {
    expect(circleCreateSchema.parse(validCircle)).toMatchObject(validCircle);
  });

  it('rejects contribution amount below 50', () => {
    expect(() => circleCreateSchema.parse({ ...validCircle, contributionAmount: 49.99 })).toThrow();
  });

  it('rejects contribution amount above 5000', () => {
    expect(() => circleCreateSchema.parse({ ...validCircle, contributionAmount: 5000.01 })).toThrow();
  });

  it('rejects amounts not a multiple of one cent', () => {
    expect(() => circleCreateSchema.parse({ ...validCircle, contributionAmount: 500.005 })).toThrow();
  });

  it('accepts the exact boundaries', () => {
    expect(() => circleCreateSchema.parse({ ...validCircle, contributionAmount: 50 })).not.toThrow();
    expect(() => circleCreateSchema.parse({ ...validCircle, contributionAmount: 5000 })).not.toThrow();
  });

  it('rejects invalid frequency', () => {
    expect(() => circleCreateSchema.parse({ ...validCircle, frequency: 'DAILY' })).toThrow();
  });

  it('rejects member counts outside 2..30', () => {
    expect(() => circleCreateSchema.parse({ ...validCircle, totalCycles: 1 })).toThrow();
    expect(() => circleCreateSchema.parse({ ...validCircle, totalCycles: 31 })).toThrow();
    expect(() => circleCreateSchema.parse({ ...validCircle, totalCycles: 6.5 })).toThrow();
  });

  it('rejects an invalid start date string', () => {
    expect(() => circleCreateSchema.parse({ ...validCircle, startDate: 'not-a-date' })).toThrow();
  });
});

describe('contributionSchema', () => {
  it('accepts a valid contribution', () => {
    expect(contributionSchema.parse({ paymentMethod: 'ZELLE', externalTxRef: 'ZL-123456' })).toEqual({
      paymentMethod: 'ZELLE',
      externalTxRef: 'ZL-123456',
    });
  });

  it('rejects references shorter than 3 characters', () => {
    expect(() => contributionSchema.parse({ paymentMethod: 'ZELLE', externalTxRef: 'ab' })).toThrow();
  });

  it('rejects references longer than 120 characters', () => {
    expect(() => contributionSchema.parse({ paymentMethod: 'ZELLE', externalTxRef: 'x'.repeat(121) })).toThrow();
  });

  it('rejects unknown payment methods', () => {
    expect(() => contributionSchema.parse({ paymentMethod: 'BITCOIN', externalTxRef: 'abc' })).toThrow();
  });
});

describe('payoutRefSchema', () => {
  it('accepts a valid external payout reference', () => {
    expect(payoutRefSchema.parse({ externalTxRef: 'PAY-0001' })).toEqual({ externalTxRef: 'PAY-0001' });
  });

  it('rejects an empty reference', () => {
    expect(() => payoutRefSchema.parse({ externalTxRef: '  ' })).toThrow();
  });
});
