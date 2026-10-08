// Render each caption as a transparent PNG at the target size, then write an FFmpeg filter script that overlays them
// on their frame-accurate windows.   node tools/captions/burn.mjs --size 1920x1080 --out renders/captions/16x9
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from '../render/server.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const [w, h] = arg('size', '1920x1080').split('x').map(Number);
const out = path.resolve(arg('out', 'renders/captions/16x9'));
const caps = JSON.parse(fs.readFileSync('audio/narration/captions.json', 'utf8'));
fs.mkdirSync(out, { recursive: true });
const s = await serve(0); const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: w, height: h } });
await p.goto(`http://127.0.0.1:${s.address().port}/motion/caption.html`);
const inputs = [], chain = [];
for (const [i, c] of caps.entries()) {
  await p.evaluate(([l, w, h]) => window.setCaption(l, w, h), [c.lines, w, h]);
  const file = path.join(out, `cap${String(i).padStart(2, '0')}.png`);
  await p.screenshot({ path: file, omitBackground: true });
  inputs.push(file);
  chain.push({ file, start: c.start, end: c.end });
}
// filter: [0:v][1:v]overlay=enable='between(t,a,b)'[v1];[v1][2:v]overlay=...
let f = '', prev = '0:v';
chain.forEach((c, i) => { const o = i === chain.length - 1 ? 'vout' : `v${i + 1}`; f += `[${prev}][${i + 1}:v]overlay=0:0:enable='between(t,${c.start.toFixed(3)},${(c.end - 0.001).toFixed(3)})'[${o}];`; prev = o; });
fs.writeFileSync(path.join(out, 'filter.txt'), f.replace(/;$/, ''));
fs.writeFileSync(path.join(out, 'inputs.json'), JSON.stringify(inputs));
await b.close(); s.close();
console.log(`${chain.length} captions → ${out}`);
