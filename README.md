# SusuFlow — database-backed ROSCA beta

Mobile-first Next.js 14 / TypeScript / Tailwind web app with PostgreSQL, Prisma, secure email magic-link login, circle invitations, cryptographically shuffled slot assignment, member-approved future-slot swaps, off-platform payment evidence, organizer verification, recorded disbursements, audit trails, and server-sent events updates.

## Quick start

1. Install Node.js 20+ and Docker Compose.
2. `cp .env.example .env` and change database credentials for real deployments.
3. `docker compose up -d db`
4. `npm install`
5. `npx prisma generate`
6. `npx prisma migrate deploy`
7. `npm run dev` — open `http://localhost:3000`.

### Backups

The `docker-compose.yml` includes a `backups` service that automatically dumps PostgreSQL on a
schedule (default daily) with retention rotation into the `backups` volume. See
[docs/BACKUP.md](docs/BACKUP.md) for configuration, restore, and off-machine guidance.
8. Sign in with an email. In development, without SMTP, the magic link is printed **only in your terminal**, not in the UI. Configure SMTP for actual email.
9. Create a circle, share its join link with different signed-in members, then draw the order as organizer after reaching capacity.
10. Each member uses an external payment tool and submits a transaction reference. The organizer verifies only after checking real receipt outside SusuFlow. After all references are verified, record a **completed off-platform payout reference** to advance the circle.

## What works

- Persistent PostgreSQL data and Prisma migration with constraints.
- Single-use, short-lived hashed magic-link tokens and hashed seven-day HTTP-only session cookies.
- A cryptographically random 6-digit sign-in code (also single-use, hashed, brute-force limited) in addition to the email link.
- Organizer-only slot draws, contribution verification, and payout confirmation.
- Transaction-scoped PostgreSQL advisory locks serialize sensitive updates per circle, unique member/slot/contribution constraints, and append-only audit trigger.
- One payout per cycle; advancement after every member's contribution is verified.
- A current cycle locks, completed payouts stay historical, future slot swaps require receiving member acceptance.
- Live refresh via authorized SSE notifications (two-second database polling), with app re-fetching current ledger and slot state.
- Responsive dashboard, creation form, slot map, ledger, profile and organizer audit view.
- `AUTOMATED_SIMULATED` is visibly **simulation only**; no bank credentials are collected.
- An animated payout wheel visualizes the server-generated slot order (the animation is cosmetic; the database assignment is authoritative).
- Automated tests: unit tests for pure helpers plus a full six-member integration suite against a disposable Postgres.

## Deliberate scope boundaries

**No real ACH, Plaid, Stripe, Zelle, Venmo, cash custody, payment capture, or transfer is implemented.** `disburse` **records** an organizer-confirmed payment made separately. A submitted reference is not proof that a payment settled. No screenshot uploads are implemented in this beta: transaction references only. There is no independent reconciliation, bank settlement, dispute handling, KYC verification, fraud monitoring, or money-transmitter legal determination. Do not use this code as a live money-moving service without compliance counsel, provider contracts and extensive review.

### Before deployment to public users

- Add email/OTP delivery rate limiting, IP quotas, bot protection, account recovery and verified name handling.
- Integrate managed monitoring, alerting, transactional email reliability, secret management, backups and PITR.
- Add fraud/organizer conflict-of-interest safeguards, dual approval or external evidence for payout records, and dispute workflows.
- Introduce background jobs for missed contributions/default handling and payment reminders.
- Complete authorization/security pen tests, load tests, accessibility review and end-to-end tests against disposable test Postgres.
- Protect invite links, minimize PII and apply privacy/retention policies. Configure HTTPS and CSRF/origin restrictions for deployments; consider a managed IdP.
- Regulatory counsel must assess the activities and jurisdictions before implementing real money movement, AML, KYC, sanctions requirements, licensing and consumer disclosures.
- For scale, replace per-client SSE DB polling with PostgreSQL NOTIFY, Redis/Pusher, or Supabase Realtime, keeping tenant authorization.

## Testing

Vitest runs unit tests (due-date generation, crypto shuffle, trust policy, Zod validation) and a full integration suite that drives the real API route handlers against a **disposable** PostgreSQL database.

1. `docker compose -f docker-compose.test.yml up -d` — starts an isolated test database on `127.0.0.1:5434` (the dev database stays on `5432`).
2. `npm run test` — resets the test database to a clean, migrated state and runs all tests.

The integration suite covers: magic-link registration, circle creation, capacity-enforced joins, cryptographically shuffled draws, peer slot swaps, contribution submission/verification, payout confirmation, cycle advancement, completion, trust scoring, and append-only audit enforcement (including negative cases for duplicate joins, duplicate contributions, disburse-before-verified, duplicate payouts, and unauthorized actions).

### Playwright end-to-end

A real browser drives the full six-member lifecycle through the UI: magic-link registration for six users, circle creation, joining, the payout draw, and six complete contribute → verify → disburse cycles, plus completion and audit persistence.

1. `docker compose -f docker-compose.e2e.yml up -d` — starts an isolated e2e database on `127.0.0.1:5435`.
2. `npx playwright install chromium` (once).
3. `npm run test:e2e` — resets the e2e database, boots the app in dev mode, and runs the browser scenario (magic links are captured from the dev-server console log).

## API endpoints

`POST /api/auth/request-link`, `GET /api/auth/verify?token=...`, `POST /api/auth/verify-code`, `POST /api/auth/logout`

`GET|POST /api/circles`, `GET /api/circles/:id`, `POST /api/circles/:id/join`, `POST /api/circles/:id/draw`, `POST /api/circles/:id/swaps`, `POST /api/circles/:id/swaps/:swapId/accept`, `POST /api/circles/:id/contributions`, `POST /api/circles/:id/verify`, `POST /api/circles/:id/simulate`, `POST /api/circles/:id/disburse`, `GET /api/circles/:id/events`.

### Payout accounting

For a circle with 6 members, each contributing $500 per cycle, each payout is $3,000, and exactly six complete cycles pay exactly one member each. No interest or extra fee. Trust score begins at 100 and increases by one per verified-on-time cycle, not a credit rating. There is no platform financial double-entry ledger because the platform **never holds funds**. Add a rigorously reconciled double-entry ledger before any real payment integration.

`PROTOTYPE_REFERENCE.tsx` is the exact uploaded local-state proof of concept, preserved as design reference and excluded from compilation. Production flows live under `src/`.
