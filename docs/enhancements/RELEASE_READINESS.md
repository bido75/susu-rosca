# Release Readiness

Phase 1–8 implementation for secure payout receiving methods.

## Ready for review
- Additive schema + migration (unapplied to production).
- Member receiving methods (Zelle/Cash App/Venmo), profile UI, circle preference,
  versioned cycle instructions, masked payer view, recipient acknowledgment.
- Authorization matrix enforced server-side; identifiers masked for non-owners.
- Tests + build + smoke all green.

## Blocking before any deploy/merge
- **Explicit approval** to merge `feature/secure-payout-methods-and-cash-handoff`
  into `main` (not performed).
- **Migration application** decision (production migration is intentionally not
  run automatically).

## Requires separate business/compliance approval (not implemented)
- ACH banking-provider onboarding + tokenization.
- Cash exception handoff with independent witness.
- External SMS/email/push notifications.

## Outstanding items for a later pass
- Cash handoff workflow (Phases 9 + related).
- Payment method change-history UI (version history is stored; a full history view
  is not yet surfaced).
- Reminder notifications.
- E2E browser tests for the new profile/circle UI flows.