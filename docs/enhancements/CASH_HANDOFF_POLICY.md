# Cash Handoff Policy

Status: **implemented** — the exceptional cash-payout workflow is now additive on
this branch. It operates strictly as an exception: organizer approval + an
independent witness + three independent confirmations, and never bypasses the
existing contribution-verification / open-dispute / duplicate-disbursement rules.

## Principles
- Cash is an **exception**, never a normal selectable payout preference.
- Requires **organizer prior approval**, an **independent adult witness** (not the
  payer, not the recipient), and three separate acknowledgments (payer, recipient,
  witness) — each confirming only facts personally observed.
- No cash handoff while any dispute is open; any conflicting acknowledgment marks
  the case disputed and blocks automatic completion.
- A witness's presence does not guarantee safety or legitimacy and is never
  represented as such.

## Data models
- `CashHandoffRequest` (circle, cycle, recipient, amount, reason, proposed date +
  safe arrangement, approval state, assigned independent witness).
- `CashHandoffConfirmation` (PAYER / RECIPIENT / WITNESS, one per role, each
  confirming only facts personally observed).

## Guardrails (enforced in `src/app/api/circles/[id]/cash-handoff/**`)
- No automatic approval — organizer must explicitly approve, assigning an
  independent witness (not the payer, not the recipient).
- No forced payout during an open dispute (request is blocked while a dispute is
  OPEN on the cycle).
- No duplicate request; no duplicate per-role confirmation.
- A cash request/approval/confirmation never auto-completes a disbursement — it
  documents the handoff only; the existing `Disbursement` flow remains the single
  source of payout recording.
- Approval does not confirm cash changed hands; a witness's presence does not
  guarantee legitimacy and is never represented as such.