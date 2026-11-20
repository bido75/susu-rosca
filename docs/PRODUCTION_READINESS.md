# Production Readiness & Operations

## What is production-ready now

- **Containerized stack** — `docker compose up -d` runs Postgres, Mailpit, and the app (production `next start`) with `restart: unless-stopped`, self-migrating on boot.
- **CI/CD** — GitHub Actions runs typecheck, production build, vitest (unit+integration), Playwright E2E, then publishes a `ghcr.io/...:staging` image.
- **Authentication** — single-use hashed magic-link **and** a 6-digit sign-in code (hashed, brute-force limited), httpOnly session cookies, origin-check CSRF guard, per-email + per-endpoint rate limits.
- **Database** — Postgres with enumerated types, CHECK constraints, unique constraints, Decimal money, advisory-lock serialized financial transitions, and an append-only audit trigger with a tamper-evident (append-only) table.
- **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP (+ HSTS only when `APP_URL` is HTTPS).
- **Health check** — `GET /api/health`.
- **Structured logs** — JSON-lines via `src/lib/logger.ts` (`npm run build` logs become machine-parseable).

## Not yet production-ready (explicit gaps)

### 1. Dependency advisories (blocking)
`npm audit --omit=dev` currently reports 4 advisories requiring **breaking major upgrades**:

| Package | Current | Fix | Breaking |
|---|---|---|---|
| nodemailer | 6.10.1 | 10.6.1 | ESM-only since v7 |
| zod | 3.25.76 | 4.6.7 | API/error-message changes |
| postcss (via next) | ≤8.5.22 | via next 16 | Next.js 16 migration |
| next (implied) | 14.2.35 | 16.x | App Router migration |

These are a deliberate migration track, not a blind `npm audit fix --force`. The nodemailer criticals are mitigated in practice because the only address we send to is a Zod-validated email (no `>`/`;`/whitespace injection), and the DoS vectors require a malicious SMTP server. Track and schedule the upgrades before external deployment.

### 2. Compliance / fintech (blocking for real money movement)
SusuFlow records organizer-attested off-platform transfers; the platform never moves money. Before any real payment integration or public launch: KYC/AML, sanctions screening, state money-transmitter licensing, consumer disclosures, and payments-provider contracts. No bank credentials are collected.

### 3. Data model gaps (from the original spec)
- No separate `Disbursement` table (payout recorded on `Cycle`).
- No `ScoreHistory` table (trust changes are applied inline, not individually historicized).
- No payment-evidence file uploads (transaction references only).

### 4. Operations hardening
- **Reverse proxy + TLS** — for real deployments, front the app with nginx/Caddy/Traefik or a managed platform for HTTPS + real per-IP rate limiting. The in-process limiter is single-instance only.
- **Backups / PITR** — `scripts/backup.ps1` produces `pg_dump` archives; schedule it and store off-machine (or use managed Postgres with PITR).
- **Error monitoring** — no Sentry/analytics DSN configured; `src/lib/logger.ts` is the integration point.
- **Secrets** — no real SMTP credentials/database passwords are committed; provision real ones via environment/secret manager.

## Backup

```powershell
pwsh -File scripts/backup.ps1   # -> ./backups/susuflow-YYYYMMDD-HHmmss.sql.gz
```

Restore:

```bash
docker exec -i susuflow-beta-db-1 psql -U susuflow -d susuflow < backups/<file>.sql
```

## Health check

`GET /api/health` → `{"status":"ok","db":"up"}` (or `503` if the database is unreachable).
