# SusuFlow — Mobile & PWA Baseline Audit

> Read-only audit performed before the mobile-first / PWA enhancement work on
> branch `feature/mobile-pwa-progressive-enhancements` (off `main` @ `1ceaa66`).

Date: 2026-11-21

## 1. Purpose

Establish a factual, non-destructive baseline for the progressive enhancement of
SusuFlow into a mobile-first, cross-device, installable PWA. No database schema,
auth model, or financial rule changes are in scope.

## 2. Application architecture

- **Framework**: Next.js 16.4.6 (App Router, Turbopack) + React 19 + TypeScript.
- **Styling**: Tailwind CSS (v3 `@tailwind` directives) via `src/app/globals.css`,
  with a small set of shared component classes (`.card`, `.btn`, `.field`, `.pill`, …).
- **Data**: Prisma + PostgreSQL (`prisma/schema.prisma` — **not modified**).
- **Auth**: HTTP-only cookie (`susuflow_session`); magic-link + 6-digit code flow.
  All protected routes are gated server-side.
- **Routing**: Public landing at `/`; auth-gated app under `/circles`, `/profile`,
  `/admin/audit`, `/join/[code]`; `/dashboard` redirects to the app.
- **Real-time**: `EventSource` (`/api/circles/[id]/events`) over Postgres LISTEN/NOTIFY.
- **Security**: CSP + `X-Frame-Options` + origin checks handled in `src/proxy.ts`.

## 3. PWA baseline (before changes)

| Concern                          | State at baseline                                  |
| -------------------------------- | -------------------------------------------------- |
| Web app manifest                 | Present but **`icons: []`** (not installable)      |
| App icons (PNG)                  | **None** (only a manifest file, no image assets)   |
| Service worker                   | **None**                                           |
| Offline fallback                 | **None**                                           |
| Apple Web App meta (touch icon, capable, status bar) | **None**                     |
| `theme-color` / viewport `viewport-fit` | Default only (no safe-area `viewport-fit=cover`) |
| Install prompt (Chromium)        | **None**                                           |
| iOS install instructions         | **None**                                           |
| Mobile bottom navigation         | Horizontal scroll nav at top of sidebar only       |
| Safe-area handling               | **None**                                           |
| `prefers-reduced-motion` scope   | Landing page only (inline CSS in `page.tsx`)       |

## 4. Component inventory (touched by this work)

- `src/app/layout.tsx` — root layout (metadata only; no Apple meta at baseline).
- `src/app/globals.css` — shared utilities; has `:focus-visible` ring already.
- `src/components/CircleWorkspace.tsx` — the authenticated app shell (sidebar,
  overview/wheel/ledger/audit tabs, ledger tables, swap UI, create modal).
- `src/components/PayoutWheel.tsx` — reusable wheel (already fixed-size responsive).
- `src/app/page.tsx` — public landing (already fully responsive to 320 px).
- `src/app/login/page.tsx` — magic-link login gateway.
- `src/app/profile/page.tsx` — profile + KYC + sign-out (has its own sign-out form).

## 5. Financial-safety constraints (non-negotiable)

- The service worker must **never** cache or replay authenticated, financial, or
  API responses.
- There must be **no offline mutations**: every `POST/PUT/PATCH/DELETE` passes
  straight through to the network; no request queueing.
- The platform remains a coordination ledger — it does not hold, move, or debit
  money. PWA changes must not imply otherwise.

## 6. Verification baseline

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (3 pre-existing `evidence.ts` tracing warnings).
- `npm run test` — 11 files / 73 tests passing (Vitest).
- `npm run test:e2e` — 1 Playwright lifecycle spec passing (desktop Chromium).

## 7. Recommendation

Enhance in place (no rebuild) on an isolated feature branch: add real PNG icons,
complete the manifest, add a financially-safe service worker + offline page, wire
Apple/`theme-color`/safe-area meta, add install prompts + iOS instructions, and
apply mobile ergonomics (bottom nav, responsive ledger, touch targets, reduced-motion).
