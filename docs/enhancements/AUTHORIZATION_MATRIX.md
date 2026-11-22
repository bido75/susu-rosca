# Authorization Matrix — Payout Methods

Enforced server-side in each route via `requireUser`, `memberAccess`, and
explicit ownership checks (`method.userId !== user.id`).

| Actor | Receive-method CRUD | Circle preference | View instructions | Confirm instructions | Acknowledge receipt |
|---|---|---|---|---|---|
| Owner/member | ✅ own methods only | ✅ own, own method | full (active cycle) | — | — |
| Assigned recipient | ✅ own | ✅ own | full | ✅ (self, current cycle) | ✅ (self) |
| Authorized payer (circle member) | — | ✅ own | full (active cycle) | — | — |
| Organizer | — | ✅ own | full (active cycle) | — | — |
| Non-member | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |

Rules:
- One user can never create/edit/delete another user's receiving method.
- Full identifier is returned to every authorized member of the *current cycle's*
  circle (payers must see exactly where to send funds); non-members are blocked
  server-side. Masked forms are used only for history/audit of past cycles.
- Only the assigned recipient of the *current* cycle may confirm instructions or
  acknowledge receipt.
- Preferences and confirmations do not alter membership, contribution
  obligations, payout order, or trust.