import { z } from 'zod';

export const circleCreateSchema = z.object({
  name: z.string().trim().min(3).max(80),
  contributionAmount: z.number().min(50).max(5000).multipleOf(0.01),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  totalCycles: z.number().int().min(2).max(30),
  mode: z.enum(['LEDGER', 'AUTOMATED_SIMULATED']),
  fairValueSlots: z.boolean().optional(),
  startDate: z.string().date(),
});

export const contributionSchema = z.object({
  paymentMethod: z.enum(['ZELLE', 'VENMO', 'ACH', 'CASH', 'CASHAPP', 'OTHER']),
  externalTxRef: z.string().trim().min(3).max(120),
});

export const payoutRefSchema = z.object({
  externalTxRef: z.string().trim().min(3).max(120),
});

export const verifySchema = z.object({
  contributionId: z.string().uuid(),
});

export const swapRequestSchema = z.object({
  targetUserId: z.string().uuid(),
});

export const joinSchema = z.object({
  code: z.string().min(1).max(64),
});

export type CircleCreateInput = z.infer<typeof circleCreateSchema>;
export type ContributionInput = z.infer<typeof contributionSchema>;
