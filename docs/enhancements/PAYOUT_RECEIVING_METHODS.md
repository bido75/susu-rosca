# Payout Receiving Methods — Implementation (Phases 2–8)

Additive implementation enabling members to register how they want to receive
their Susu payout, and to confirm/share those instructions with authorized
payers for each cycle. ACH (bank onboarding) and live external notifications are
out of scope this pass and remain unavailable.

## What was added

### Data model (additive, all new tables)
- `PayoutReceivingMethod` — a member's saved receiving method (kind, protected
  identifier, label, status, preferred, confirmedAt).
- `CirclePayoutPreference` — per-member, per-circle preferred receiving method.
- `CyclePayoutInstruction` — versioned snapshot of the recipient's confirmed
  instructions for a cycle (superseded, never overwritten).
- `PayoutAcknowledgment` — recipient receipt/discrepancy claim.
- New enums: `PayoutMethodKind`, `PayoutMethodStatus`, `PayoutAcknowledgmentType`.

### API
- `GET/POST /api/profile/payout-methods` — list/register own methods.
- `PATCH/DELETE /api/profile/payout-methods/[id]` — update/remove own method.
- `POST /api/profile/payout-methods/[id]/preferred` — set preferred (confirmed only).
- `POST /api/circles/[id]/payout-preference` — member selects circle method.
- `GET /api/circles/[id]/payout-instructions` — authorized, masked retrieval.
- `POST /api/circles/[id]/payout-instructions/confirm` — recipient confirm/reconfirm (versioned).
- `POST /api/circles/[id]/payout-acknowledgment` — recipient receipt/discrepancy.

### UI
- `PayoutMethodsManager` (mounted on the profile page) — "My Payout Methods".
- `RecipientPayoutCard` (overview column) — "Recipient Payout Instructions" with
  masked identifier, copy-for-owner, and receipt/discrepancy actions.

### Method support this release
- **Zelle** — enrolled email / U.S. phone / eligible tag.
- **Cash App** — `$Cashtag` (normalized).
- **Venmo** — `@username`.
- **ACH** — "Not yet available" (provider onboarding required); raw account/routing
  numbers are never collected.
- **Cash** — exception-only (organizer approval + witness), not self-serve.

## Safety & non-goals
- Identifiers are authorization-gated. For the active cycle, all circle members
  see the full identifier (they must know exactly where to send funds); non-members
  are blocked. Masked forms are reserved for history/audit of past cycles.
- No bank credentials collected; no claim of provider/bank verification.
- Acknowledgment ≠ settlement; organizer verification rules are unchanged.
- Payout order, contributions, trust, and fair-value rules are untouched.