# Database Migration Review

## Migration
`prisma/migrations/20261122092207_add_payout_receiving_methods/`

## Content
- Additive only: 4 new tables (`PayoutReceivingMethod`, `CirclePayoutPreference`,
  `CyclePayoutInstruction`, `PayoutAcknowledgment`), 3 new enums, new indexes, and
  new foreign keys.
- Existing tables/columns are unaltered; no data is reset, dropped, or rewritten.
- The migration also re-creates a set of FOREIGN KEY constraints and one index
  (Prisma's standard emit). These re-add constraints that are functionally
  identical to the originals — no semantic change, no data loss.
- No `prisma migrate reset` on production; the migration is NOT applied to the
  production or dev database (verified: `to_regclass('PayoutReceivingMethod')`
  is false in dev).

## Safety
- All new fields are nullable or have safe defaults where relevant.
- Historical payouts/audit are untouched.
- Tested against an isolated database via `npm run test` (which runs
  `prisma migrate reset` on `susuflow_test`), not against production.

## Data protection
- Receiving identifiers are stored as plaintext strings (they are *routing*
  identifiers like email/$Cashtag/@username, not bank credentials). Access is
  authorization-gated and masked for non-owners.
- No routing numbers, account numbers, or bank credentials are collected this
  release (ACH is provider-gated and unavailable).
- Full identifiers are never written to audit logs (only `kind`/`version`/`type`
  metadata, or a note truncated to 120 chars).