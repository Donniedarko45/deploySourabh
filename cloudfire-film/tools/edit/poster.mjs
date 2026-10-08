// Poster / thumbnail: a designed frame over a master still.  node tools/edit/poster.mjs renders/frames/master/f00200.png renders/final/cloudfire-poster.png
import { createRequire } from 'node:module';
import path from 'node:path';
import { serve } from '../render/server.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [bg, out] = process.argv.slice(2);
const s = await serve(0); const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 3840, height: 2160 } });
await p.goto(`http://127.0.0.1:${s.address().port}/motion/poster.html`);
await p.evaluate(src => window.setBg(src), '/' + path.relative(process.cwd(), path.resolve(bg)));
await p.screenshot({ path: out });
await b.close(); s.close(); console.log('poster →', out);
