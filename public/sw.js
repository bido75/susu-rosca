/* SusuFlow service worker.
 *
 * Safety model (financial data must never be served stale or cached):
 *  - Navigation requests  -> network-first, fall back to the branded offline
 *    page when there is no connection.
 *  - Static assets         -> stale-while-revalidate for immutable/public files
 *    only (/_next/static/*, /icons/*, /offline.html).
 *  - API & dynamic routes  -> network only. Never cached, never replayed.
 *  - Mutations (POST/PUT/...) -> always pass straight through; this SW never
 *    intercepts them, so there are no offline-or-queued financial writes.
 */

const CACHE = 'susuflow-shell-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png'];

const STATIC_PREFIXES = ['/_next/static/', '/icons/', '/offline.html'];

function isStaticAsset(pathname) {
  return STATIC_PREFIXES.some((p) => (p.endsWith('/') ? pathname.startsWith(p) : pathname === p));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never touch non-GET requests (all financial mutations pass through).
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Same-origin only — never proxy or cache cross-origin traffic.
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first with a branded offline fallback. We intentionally
  // do NOT cache the response, so authenticated/financial pages are never replayed.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Only the safe, public, versioned static assets get cached.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Everything else (API responses, dynamic pages, RSC payloads): network only.
  // No handler means the browser performs the request as normal.
});
