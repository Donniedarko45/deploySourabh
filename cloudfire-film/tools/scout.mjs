// Scouting pass: full-viewport screenshots of authentic product pages for location research.
// Usage: node tools/scout.mjs <outDir> <baseUrl> <path...>
// AegisStore paths require the seeded admin login; pass --aegis to sign in first.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright');

const args = process.argv.slice(2);
const aegis = args.includes('--aegis');
const [outDir, base, ...paths] = args.filter(a => a !== '--aegis');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, colorScheme: 'dark' });
if (aegis) {
  await page.goto(base + '/login', { waitUntil: 'load', timeout: 20000 });
  await page.fill('input[type=email]', 'admin@aegis.local');
  await page.fill('input[type=password]', 'ChangeMe123!');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
}
for (const p of paths) {
  await page.goto(base + p, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const name = (p.replace(/[^a-z0-9]+/gi, '_') || 'root').replace(/^_|_$/g, '') || 'root';
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log('captured', p);
}
await browser.close();
