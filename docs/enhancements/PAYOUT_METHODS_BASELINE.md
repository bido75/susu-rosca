# Payout Methods — Baseline Audit

> Read-only audit of how SusuFlow currently handles member payment methods,
> contribution submission, evidence, verification, recipient selection, payout
> eligibility, disbursement, authorization, audit, disputes, notifications,
> mobile layout, circle rules, and cycle advancement — performed before adding
> member-controlled receiving methods. Branch: `feature/secure-payout-methods-and-cash-handoff`.

Date: 2026-11-22

## 1. What already exists

| Concern | Current behavior | Source |
|---|---|---|
| Member payment methods | `PaymentMethod` enum: `ZELLE`, `VENMO`, `ACH`, `CASH`, `CASHAPP`, `OTHER` — used by *contributions* (how members pay), not how recipients *receive*. | `prisma/schema.prisma` |
| Contribution submission | `POST /api/circles/[id]/contributions` records method + externalTxRef, `PENDING → SUBMITTED`. | `src/app/api/circles/[id]/contributions/route.ts` |
| Uploaded evidence | `ContributionEvidence` with private filesystem storage (`data/evidence`), 5 MiB, image/PDF MIME allow-list, randomized `storageKey`. | `src/lib/evidence.ts` |
| Organizer verification | `POST /api/circles/[id]/verify` marks a contribution `VERIFIED`. | `src/app/api/circles/[id]/verify/route.ts` |
| Recipient selection | Payout wheel `draw` assigns `Cycle.recipientUserId`; peer slot swaps trade future slots. | `draw`/`swaps` routes |
| Payout eligibility | `disburse` requires ACTIVE circle, assigned recipient, all contributions `VERIFIED`, no open dispute. | `disburse/route.ts` |
| Disbursement reference | `Disbursement` records flat pot (`contribution × cycles`) + `externalReference`, audited, unique per cycle. | `disburse/route.ts` |
| Authorization | `requireUser`, `organizerOnly`, `memberAccess` (member org-gated). | `src/lib/auth.ts`, `src/lib/circles.ts` |
| Audit logs | Append-only `AuditLog` (actor, action, entity, metadata). | `src/lib/circles.ts` |
| Disputes | `Dispute` per cycle; OPEN dispute blocks disbursement until `RESOLVED`. | `disputes` routes |
| Notifications | Postgres LISTEN/NOTIFY → SSE; best-effort refetch hints only. No email/SMS/push delivery. | `src/lib/realtime.ts` |
| Trust scores | `applyTrustDelta` + immutable `ScoreChange` history. | `src/lib/trust.ts`, `src/lib/circles.ts` |
| Mobile/PWA | Responsive bottom nav, standalone PWA, service worker (no financial caching). | `CircleWorkspace.tsx`, `public/sw.js` |
| Fair-value bonus | `Circle.fairValueBonusPercent` (editable, 0 removes it). | prior work |

## 2. The gap (not currently present)

There is **no** member-level receiving-method profile, no circle-specific payout
preference, no per-cycle versioned payout instructions, no recipient
acknowledgment, and no cash-handoff workflow. The `Disbursement`/`Contribution`
models record *that* a payment was recorded/claimed, but not a recipient's
acknowledgment of receipt, and there is no protected storage of a member's
"how I want to receive my pot" identifiers.

## 3. Constraints honored

- Additive Prisma models only; no reset/truncate; nullable/safe defaults.
- Do not alter payout wheel, slot assignments, trust scores, contribution
  verification rules, or existing financial calculations.
- Platform remains a coordination ledger — never holds/moves money, never
  claims bank/provider verification that did not happen.
- Receiving identifiers (Zelle email/phone/tag, $Cashtag, @venmo) are treated as
  sensitive: authorization-gated retrieval, no public exposure, no logging of
  full values, no caching in the service worker.
- ACH provider onboarding and external SMS/email/push delivery are out of scope
  this pass (kept behind "not yet available" UI; no raw bank numbers collected).

## 4. Regression baseline (must remain green)

- `npx tsc --noEmit` — clean
- `npm run build` — clean
- `npm run test` — 12 files / 77 tests passing
- `npm run test:e2e` — 1 lifecycle spec passing
- `node scripts/pwa-smoke.mjs` — 28/28 checks