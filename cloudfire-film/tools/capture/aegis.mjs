// Authentic AegisStore footage from a controlled local build (http://localhost:8080, seeded with the repo's own
// scripts/seed-demo.mjs). UI animation is stepped with a virtual clock (vclock.js) so every frame is exact; the
// cluster events (uploads, heartbeats, a crashed node) are real.
//
//   node tools/capture/aegis.mjs [--dpr 2] [--only upload,lab] [--out assets/ui-captures/raw]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:8080');
const DPR = Number(arg('dpr', '2'));
const OUT = path.resolve(ROOT, arg('out', 'assets/ui-captures/raw'));
const only = arg('only') ? arg('only').split(',') : null;
const FRAME_MS = 1000 / 24;
const meta = fs.existsSync(path.join(OUT, 'captures.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'captures.json'))) : {};

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: DPR, colorScheme: 'dark', acceptDownloads: true });
await context.addInitScript({ path: path.join(here, 'vclock.js') });
const page = await context.newPage();
page.on('pageerror', e => console.log('pageerror', e.message));
const api = context.request;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function login() {
  await page.goto(BASE + '/login', { waitUntil: 'load' });
  await page.fill('input[type=email]', 'admin@aegis.local');
  await page.fill('input[type=password]', 'ChangeMe123!');
  await page.keyboard.press('Enter');
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 20000 });
}
const box = async (loc) => { const b = await loc.boundingBox(); return b && { x: b.x, y: b.y, w: b.width, h: b.height, cx: b.x + b.width / 2, cy: b.y + b.height / 2 }; };

// Record `frames` frames; `actions[frameIndex]` runs before that frame is stepped.
async function record(name, frames, actions = {}, settleMs = 3000) {
  if (only && !only.includes(name)) return;
  const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  await sleep(settleMs);
  await page.evaluate(() => window.__vfreeze());
  const events = [];
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    if (actions[i]) { const e = await actions[i](); if (e) events.push({ frame: i, ...e }); await sleep(120); }
    await page.evaluate(ms => window.__vstep(ms), FRAME_MS);
    await sleep(40); // let React commit (real time); page timers stay frozen
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.png`) });
  }
  await page.evaluate(() => window.__vunfreeze());
  meta[name] = { frames, fps: 24, dpr: DPR, viewport: [1920, 1080], pixels: [1920 * DPR, 1080 * DPR], url: page.url().replace(BASE, ''), events, capturedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(OUT, 'captures.json'), JSON.stringify(meta, null, 1));
  console.log(`${name}: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`, events);
}

async function nodes() { return (await (await api.get(BASE + '/api/nodes')).json()); }
async function nodeByName(name) { const n = await nodes(); return (n.items || n.nodes || n).find(x => x.name === name); }
async function chaos(name, patch) { const n = await nodeByName(name); return (await api.post(`${BASE}/api/simulation/nodes/${n.id}/chaos`, { data: patch })).json(); }
async function waitStatus(name, status, timeout = 60000) {
  const t = Date.now();
  while (Date.now() - t < timeout) { const n = await nodeByName(name); if (n?.status === status) return true; await sleep(1000); }
  throw new Error(`${name} did not reach ${status}`);
}

await login();
await chaos('storage-node-2', { offline: false, latencyMs: 0, errorRate: 0, diskFillPct: 0 }).catch(() => {});
await waitStatus('storage-node-2', 'HEALTHY', 90000).catch(e => console.log(e.message));

// 1. Upload (S07): a real object is uploaded and replicated; the panel reports where the copies landed.
if (!only || only.includes('upload')) {
  await page.goto(BASE + '/buckets/research-data', { waitUntil: 'load' });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 20, downloadThroughput: -1, uploadThroughput: 420 * 1024 });
  const file = { name: 'launch-plan-q4.pdf', mimeType: 'application/pdf', buffer: crypto.randomBytes(7 * 1024 * 1024) };
  await record('upload', 132, {
    12: async () => { const b = await box(page.getByRole('button', { name: /^Upload$/ }).first()); await page.locator('input[type=file]:not([webkitdirectory])').first().setInputFiles(file); return { action: 'click-upload', target: b }; },
  });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await sleep(3000);
  if (!only || only.includes('upload')) await record('upload-done', 36, {}, 1500);
}

// 2. Overview (S11a): all three storage nodes healthy, live.
await page.goto(BASE + '/', { waitUntil: 'load' });
await record('overview', 72, {}, 5000);

// 3. Simulation Lab (S11b): crash storage-node-2 with the real switch.
await page.goto(BASE + '/lab', { waitUntil: 'load' });
let crashBox = null;
await record('lab', 84, {
  14: async () => { const sw = page.getByRole('switch').nth(1); crashBox = await box(sw); await sw.click({ force: true }); return { action: 'click-crash', target: crashBox, node: 'storage-node-2' }; },
});
if (only && !only.includes('lab')) await chaos('storage-node-2', { offline: true });
console.log('waiting for storage-node-2 to go OFFLINE (real heartbeat timeout)…');
await waitStatus('storage-node-2', 'OFFLINE', 90000);

// 4. Nodes page with the node offline (S11c).
await page.goto(BASE + '/nodes', { waitUntil: 'load' });
await record('nodes-offline', 60, {}, 4000);

// 5. An object with a replica on the dead node: overview says downloads still work; replicas show checksum matches.
const list = await (await api.get(BASE + '/api/buckets/research-data/objects?limit=100')).json();
const items = list.items || list.objects || list;
console.log('objects listed', items.length);
let target = null, details = null;
for (const o of items) {
  const key = o.key || o.name; if (!key || key.endsWith('/')) continue;
  const d = await (await api.get(`${BASE}/api/buckets/research-data/object/details?key=${encodeURIComponent(key)}`)).json();
  if ((d.replicas || []).some(r => (r.nodeName || r.node) === 'storage-node-2')) { target = key; details = d; break; }
}
if (target) {
  await page.goto(`${BASE}/buckets/research-data?object=${encodeURIComponent(target)}`, { waitUntil: 'load' });
  await record('object', 96, {
    44: async () => { const t = page.getByRole('tab', { name: /Replicas/ }).first(); const b = await box(t); await t.click({ force: true }); return { action: 'click-replicas', target: b }; },
  }, 4000);
  // Evidence: download the object through the API while the node is down and verify its SHA-256.
  const res = await api.get(`${BASE}/api/buckets/research-data/object?key=${encodeURIComponent(target)}`);
  const body = await res.body();
  const sha = crypto.createHash('sha256').update(body).digest('hex');
  const cur = details.current || details.versions?.[0] || {};
  const evidence = { capturedAt: new Date().toISOString(), node_down: 'storage-node-2', node_status: (await nodeByName('storage-node-2')).status,
    bucket: 'research-data', key: target, http_status: res.status(), bytes: body.length, sha256_downloaded: sha,
    sha256_recorded: cur.sha256 || cur.checksum || null, replicas: details.replicas?.map(r => ({ node: r.nodeName || r.node, state: r.state, nodeStatus: r.nodeStatus, checksumMatch: r.checksumMatch })) };
  evidence.match = !!evidence.sha256_recorded && evidence.sha256_recorded === sha;
  fs.mkdirSync(path.join(ROOT, 'qa'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'qa', 'aegisstore-failover-evidence.json'), JSON.stringify(evidence, null, 1));
  console.log('failover evidence', evidence);
} else console.log('no object with a replica on storage-node-2 found');

// Restore the cluster.
await chaos('storage-node-2', { offline: false, latencyMs: 0, errorRate: 0, diskFillPct: 0 });
await browser.close();
