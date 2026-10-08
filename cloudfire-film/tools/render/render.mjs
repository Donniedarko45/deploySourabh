// Deterministic frame renderer: drives motion/index.html with window.__seek(frame) and screenshots each frame.
//
//   node tools/render/render.mjs --from 0 --to 1560 --scale 1 --out renders/frames/master --workers 3
//   node tools/render/render.mjs --frames 0,24,48 --scale 0.25 --out /tmp/stills
//
// The composition is a pure function of the frame number, so frames can be rendered in any order, by any
// number of workers, and re-rendered individually. Existing frames are skipped unless --force is passed,
// which makes renders resumable after an interruption.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './server.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright');

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const flag = name => process.argv.includes('--' + name);
const scale = Number(arg('scale', '1'));
const out = path.resolve(arg('out', 'renders/frames/test'));
const workers = Number(arg('workers', '2'));
const format = arg('format', 'png');
const page_ = arg('page', 'motion/index.html');
const extra = arg('query', '');
let frames;
if (arg('frames')) frames = arg('frames').split(',').map(Number);
else { const a = Number(arg('from', '0')), b = Number(arg('to', '1560')), step = Number(arg('step', '1'));
  frames = []; for (let f = a; f < b; f += step) frames.push(f); }
fs.mkdirSync(out, { recursive: true });
const name = f => path.join(out, `f${String(f).padStart(5, '0')}.${format}`);
const todo = flag('force') ? frames : frames.filter(f => !fs.existsSync(name(f)));
const vertical = arg('aspect', '16x9') === '9x16';
const W = Math.round((vertical ? 2160 : 3840) * scale), H = Math.round((vertical ? 3840 : 2160) * scale);

const server = await serve(0);
const port = server.address().port;
const chunks = Array.from({ length: workers }, (_, i) => {
  const n = Math.ceil(todo.length / workers); return todo.slice(i * n, (i + 1) * n);
}).filter(c => c.length);
const t0 = Date.now();
let done = 0;

async function worker(list, id) {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    '--disable-gpu-vsync', '--font-render-hinting=none', '--force-color-profile=srgb', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error' || m.text().startsWith('[film]')) console.log(`[w${id}]`, m.text()); });
  page.on('pageerror', e => console.log(`[w${id}] pageerror`, e.message));
  await page.goto(`http://127.0.0.1:${port}/${page_}?scale=${scale}${vertical ? '&aspect=9x16' : ''}${extra ? '&' + extra : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__filmReady === true, null, { timeout: 120000 });
  for (const f of list) {
    await page.evaluate(f => window.__seek(f), f);
    const opts = { path: name(f), type: format === 'jpg' ? 'jpeg' : 'png' };
    if (format === 'jpg') opts.quality = 92;
    await page.screenshot(opts);
    done++;
    if (done % 20 === 0 || done === todo.length) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${todo.length} frames  ${(el / done).toFixed(2)} s/frame  eta ${((todo.length - done) * el / done / 60).toFixed(1)} min`);
    }
  }
  await browser.close();
}
await Promise.all(chunks.map((c, i) => worker(c, i)));
server.close();
console.log(`rendered ${todo.length} frames (${frames.length - todo.length} cached) to ${out} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
