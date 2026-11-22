# Payout Instruction Security

## Model
- A member's receiving identifier (Zelle email/phone/tag, `$Cashtag`, `@venmo`) is
  a *routing* identifier — sensitive but not a bank credential.
- It is stored server-side, returned only via authenticated, authorization-gated
  endpoints, and masked for everyone except the owner.

## Controls
- **Server-side authorization**: every endpoint runs `requireUser` (or
  `memberAccess`), and ownership checks reject cross-user access (404).
- **Visibility policy**: for the *current* cycle, every authorized circle member
  sees the **full** identifier (they must see exactly where to send funds).
  Non-members are blocked by `memberAccess` (403). Masked forms are used only for
  **history/audit** views of past cycles — not for the active payout instructions.
- **No exposure vectors**: identifiers are not written to audit logs (only
  `kind`/`version`/`type`), not placed in URLs/notifications/analytics, and never
  cached by the service worker (which caches only static assets, never API data).
- **No bank data**: raw routing/account numbers are never accepted; ACH requires an
  approved provider (unavailable this release) and would store only provider tokens.
- **Versioning**: cycle instructions are snapshotted per confirmation; updates
  supersede (never overwrite) prior versions, so distributed instructions cannot
  be silently changed.

## Explicit non-claims
- Entering an identifier does NOT verify Zelle/Cash App/Venmo enrollment.
- A recipient acknowledgment is NOT bank/provider settlement.
- The platform never holds or moves funds and is not a payment gateway.