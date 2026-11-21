import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const PORT = 3219;
const BASE = `http://127.0.0.1:${PORT}`;

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
  cwd: process.cwd(),
  stdio: 'ignore',
  env: { ...process.env, NODE_ENV: 'production' },
});

async function waitForServer(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server not ready at ${url}`);
}

try {
  await waitForServer(`${BASE}/login`, 80);

  const browser = await chromium.launch();

  // --- PWA asset checks ---
  const manifestRes = await fetch(`${BASE}/manifest.webmanifest`);
  const manifest = manifestRes.ok ? await manifestRes.json() : null;
  check('manifest served + JSON', manifestRes.ok && !!manifest, `status=${manifestRes.status}`);
  check(
    'manifest has 3 icons incl maskable',
    Array.isArray(manifest?.icons) && manifest.icons.length === 3 && manifest.icons.some((i) => i.purpose === 'maskable'),
  );
  check('manifest start_url === /circles', manifest?.start_url === '/circles');
  check('manifest theme #059669', manifest?.theme_color === '#059669');

  for (const p of ['/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png', '/sw.js', '/offline.html']) {
    const r = await fetch(`${BASE}${p}`);
    check(`200 ${p}`, r.ok, `status=${r.status} type=${r.headers.get('content-type')}`);
  }
  const swText = await (await fetch(`${BASE}/sw.js`)).text();
  check('sw.js never caches API (network-only passthrough)', swText.includes("request.method !== 'GET'") && swText.includes('navigate'));

  const loginHtml = await (await fetch(`${BASE}/login`)).text();
  check('head: manifest link', loginHtml.includes('manifest.webmanifest'));
  check('head: theme-color #059669', loginHtml.includes('theme-color') && loginHtml.includes('#059669'));
  check('head: viewport-fit=cover', loginHtml.includes('viewport-fit=cover'));
  check('head: apple-touch-icon link', loginHtml.includes('apple-touch-icon.png'));
  check('head: apple-mobile-web-app-capable', loginHtml.includes('apple-mobile-web-app-capable'));

  // --- Cross-viewport layout smoke (public pages: landing + login) ---
  const viewports = [
    { name: 'iphone-320', width: 320, height: 568 },
    { name: 'iphone-390', width: 390, height: 844 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1440', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    const landingOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(`landing no horizontal scroll @${vp.name}`, landingOverflow <= 1, `overflow=${landingOverflow}px`);
    await page.close();

    const login = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await login.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    const loginOverflow = await login.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    const emailVisible = await login.getByPlaceholder('you@example.com').isVisible();
    check(`login no horizontal scroll @${vp.name}`, loginOverflow <= 1, `overflow=${loginOverflow}px`);
    check(`login form visible @${vp.name}`, emailVisible);
    await login.close();
  }

  await browser.close();
} catch (e) {
  check('smoke run completed', false, String(e));
} finally {
  server.kill();
}

for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
