import { z } from 'zod';

export const circleCreateSchema = z.object({
  name: z.string().trim().min(3).max(80),
  contributionAmount: z.number().min(50).max(5000).multipleOf(0.01),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  totalCycles: z.number().int().min(2).max(30),
  mode: z.enum(['LEDGER', 'AUTOMATED_SIMULATED']),
  fairValueSlots: z.boolean().optional(),
  fairValueBonusPercent: z.number().min(0).max(100).multipleOf(0.01).optional(),
  startDate: z.iso.date(),
});

// Organizer-only edit of the Fair-Value adjustment. `fairValueBonusPercent` of 0
// removes the early-slot fee / anchor bonus entirely; `fairValueSlots` toggles
// whether the adjustment is applied at all.
export const circleFairValueSchema = z.object({
  fairValueSlots: z.boolean(),
  fairValueBonusPercent: z.number().min(0).max(100).multipleOf(0.01),
});

export const contributionSchema = z.object({
  paymentMethod: z.enum(['ZELLE', 'VENMO', 'ACH', 'CASH', 'CASHAPP', 'OTHER']),
  externalTxRef: z.string().trim().min(3).max(120),
});

export const payoutRefSchema = z.object({
  externalTxRef: z.string().trim().min(3).max(120),
});

export const verifySchema = z.object({
  contributionId: z.uuid(),
});

export const swapRequestSchema = z.object({
  targetUserId: z.uuid(),
});

export const joinSchema = z.object({
  code: z.string().min(1).max(64),
});

// ---- Payout receiving methods (Phases 2-8) ----

const payoutKinds = z.enum(['ZELLE', 'CASHAPP', 'VENMO']);

// A member registers/updates their own payout receiving method. Only
// Zelle / Cash App / Venmo are self-serve this release; ACH requires an approved
// provider (not yet available) and CASH is exception-only.
export const payoutMethodSchema = z.object({
  kind: payoutKinds,
  identifier: z.string().trim().min(2).max(120),
  label: z.string().trim().min(1).max(60).optional(),
  confirm: z.boolean().optional(), // member asserts the identifier is enrolled
});

export const payoutMethodStatusSchema = z.object({
  status: z.enum(['ENTERED', 'CONFIRMED', 'DISABLED']),
});

// Circle-specific preference: which of the member's receiving methods to use.
export const circlePayoutPreferenceSchema = z.object({
  receivingMethodId: z.uuid(),
});

// Recipient confirms/reconfirms the instructions for the current cycle.
export const cycleInstructionConfirmSchema = z.object({
  receivingMethodId: z.uuid(),
});

// Recipient acknowledgment or discrepancy report.
export const payoutAcknowledgmentSchema = z.object({
  type: z.enum(['RECEIVED', 'NOT_RECEIVED', 'WRONG_AMOUNT', 'WRONG_IDENTIFIER', 'DUPLICATE', 'OTHER']),
  note: z.string().trim().max(1000).optional(),
});

// Exceptional cash payout request (recipient submits).
export const cashHandoffRequestSchema = z.object({
  amount: z.number().min(1).max(100000).multipleOf(0.01),
  reason: z.string().trim().min(3).max(1000),
  proposedDate: z.iso.date(),
  arrangement: z.string().trim().min(3).max(500),
});

// Organizer approves/rejects a cash request, optionally assigning a witness.
export const cashHandoffReviewSchema = z.object({
  approve: z.boolean(),
  reason: z.string().trim().max(1000).optional(), // required on reject
  witnessUserId: z.uuid().optional(), // required on approve
});

// Cash handoff confirmation (payer/recipient/witness, one per role).
export const cashHandoffConfirmationSchema = z.object({
  role: z.enum(['PAYER', 'RECIPIENT', 'WITNESS']),
});

// Member phone number for SMS notifications (normalized to E.164 server-side).
export const phoneNumberSchema = z.object({
  phoneNumber: z.string().trim().min(7).max(20),
});

export type CircleCreateInput = z.infer<typeof circleCreateSchema>;
export type ContributionInput = z.infer<typeof contributionSchema>;
