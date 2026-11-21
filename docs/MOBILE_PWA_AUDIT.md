# SusuFlow — Mobile & PWA Enhancement Audit

> Implementation and verification report for the mobile-first, cross-device,
> installable PWA work on branch `feature/mobile-pwa-progressive-enhancements`.

Date: 2026-11-21

## 1. Scope & constraints honored

- **Non-destructive**: no schema, auth, or financial-rule changes. The Prisma
  schema (`prisma/schema.prisma`) was not touched.
- **Brand preserved**: emerald `#059669` / slate palette and the refresh glyph.
- **Isolated branch**: all work is on `feature/mobile-pwa-progressive-enhancements`;
  nothing committed to `main` (and no merge/deploy performed).

## 2. What changed

### 2.1 Installability & assets
- **Icons** (generated as real PNGs via `sharp`, not renamed SVGs) →
  `public/icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
  `apple-touch-icon.png`. Source/regeneration script: `scripts/generate-icons.mjs`.
- **Manifest** (`public/manifest.webmanifest`): added `id`, `description`,
  `scope`, `orientation`, `categories`, and a correct `icons` array including a
  dedicated `purpose: "maskable"` icon. `start_url` is `/circles`, `display:
  standalone`, `theme_color: #059669`, `background_color: #f8fafc`.

### 2.2 Service worker & offline (financial-safety model)
- **`public/sw.js`**: a deliberately conservative service worker.
  - **Navigation** → network-first, falls back to the branded offline page only
    when there is no connection. Navigations are **not** cached.
  - **Static assets only** (`/_next/static/*`, `/icons/*`, `/offline.html`) →
    stale-while-revalidate.
  - **API & dynamic routes** → network-only passthrough. Never cached, never replayed.
  - **Mutations** (`POST`/`PUT`/…) → skipped entirely by the fetch handler and pass
    straight to the network. No offline writing or request queueing.
- **`public/offline.html`**: branded "You're Offline" fallback (emerald mark,
  safe-area aware, explicitly states financial data is never stored on-device).
- **`src/components/ServiceWorkerRegister.tsx`**: registers `/sw.js` on load;
  best-effort and silently ignored on unsupported/insecure contexts.

### 2.3 Install prompts (cross-platform)
- **`src/components/InstallPWA.tsx`**:
  - Chromium (Android/desktop): captures `beforeinstallprompt`, surfaces an
    "Install SusuFlow" floating button.
  - iOS Safari: a floating "Install app" button opens an accessible instruction
    sheet ("Add to Home Screen" steps) — iOS has no automated prompt.
  - Hidden once installed (`display-mode: standalone` / `appinstalled` / iOS
    standalone flag).

### 2.4 Metadata & viewport
- **`src/app/layout.tsx`**:
  - `metadata.appleWebApp` (`capable`, `title`, `statusBarStyle`) → iOS meta tags.
  - `metadata.icons` (`icon` 192, `apple` apple-touch-icon).
  - `metadata.applicationName`.
  - `viewport` export with `viewportFit: 'cover'` and `themeColor: '#059669'`.
  - Mounts `ServiceWorkerRegister` + `InstallPWA`.

### 2.5 Mobile ergonomics & accessibility
- **`src/app/globals.css`**: safe-area utilities (`.pt-safe`, `.pb-safe`, …),
  `-webkit-tap-highlight-color` removal, `min-height: 44px` touch targets on
  coarse pointers, and a global `prefers-reduced-motion` override.
- **`src/components/CircleWorkspace.tsx`**:
  - New **fixed mobile bottom navigation** (`lg:hidden`) — Overview / Wheel /
    Ledger / Audit / Profile, safe-area padded, with an unassigned-slot indicator
    dot on Wheel.
  - Desktop sidebar nav is now `hidden lg:flex lg:flex-col` (removed duplicate
    horizontal nav on mobile).
  - **Responsive contribution ledger**: desktop table is now `hidden sm:block` and
    a mobile card list (`sm:hidden`) renders each member, rail/ref, amount, status,
    evidence links, and organizer actions. Shared `renderLedgerActions` helper
    avoids logic duplication.
  - Toast + install button offsets raised above the new bottom nav.

## 3. Verification results

| Check                                        | Result                              |
| -------------------------------------------- | ----------------------------------- |
| `npx tsc --noEmit`                           | ✅ clean (no errors)                |
| `npm run build`                              | ✅ clean (3 pre-existing warnings)  |
| `npm run test` (Vitest)                      | ✅ 11 files / 73 tests passed       |
| `npm run test:e2e` (Playwright lifecycle)    | ✅ 1 passed (7.0m)                  |
| `node scripts/pwa-smoke.mjs` (PWA smoke)     | ✅ 23/23 checks passed              |

The PWA smoke (`scripts/pwa-smoke.mjs`) verifies, against a production `next start`:

- Manifest served as JSON with 3 icons (incl. maskable), correct `start_url` + theme.
- All icons, `sw.js`, and `offline.html` return `200` with correct `Content-Type`.
- `sw.js` contains the network-only passthrough guard (never caches API/mutations).
- No horizontal overflow on landing + login at 320 / 390 / 768 / 1440 px;
  login form visible at every viewport.

## 4. Limitations / notes

- The cross-viewport smoke covers the public pages (landing + login) and PWA
  assets; the authenticated app shell (bottom nav, responsive ledger) is exercised
  by the Playwright lifecycle spec on desktop Chromium. A dedicated authenticated
  mobile-viewport spec is a reasonable follow-up.
- The `evidence.ts` build warnings (dynamic filesystem tracing) are pre-existing
  and unrelated to this change.
- Docs, icons, and the two `scripts/` helpers are additive; no existing behavior
  was altered.

## 5. Next steps (not performed — require explicit authorization)

- Draft PR from `feature/mobile-pwa-progressive-enhancements` (no merge).
- Optional Lighthouse PWA + accessibility audit on the live deployment.
- Optional authenticated mobile-viewport Playwright spec.
