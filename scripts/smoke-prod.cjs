const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  const res = await page.goto('http://127.0.0.1:3210/login', { waitUntil: 'networkidle' });
  console.log('GET /login status:', res.status());
  await page.waitForSelector('text=Welcome to SusuFlow', { timeout: 10000 });
  console.log('login form rendered OK');
  console.log('console/page errors:', errors.length ? errors : 'none');

  await browser.close();
})().catch((e) => {
  console.error('SMOKE FAILED:', e.message);
  process.exit(1);
});
