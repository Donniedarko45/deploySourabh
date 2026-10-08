// Frame scheduler: window.__seek(frame) renders exactly one frame, deterministically.
import { Stage, setStage } from './core.js';
import opening from './seq/opening.js';      // S01–S06  frames 0–420
import capabilities from './seq/capabilities.js'; // S07–S10 frames 420–900
import proof from './seq/proof.js';          // S11–S12  frames 900–1200
import reveal from './seq/reveal.js';        // S13–S15  frames 1200–1560

const params = new URLSearchParams(location.search);
const scale = Number(params.get('scale') || 0.5);
if (params.get('aspect') === '9x16') setStage(2160, 3840);
const stage = new Stage(document.getElementById('root'), scale);
window.__stage = stage;
const sequences = [opening, capabilities, proof, reveal];

await document.fonts.load('500 40px "Instrument Sans"');
await document.fonts.load('600 40px "Instrument Sans"');
await document.fonts.load('400 40px "Instrument Sans"');
await document.fonts.load('400 40px "Inter"');
await document.fonts.load('500 40px "Inter"');
await document.fonts.load('400 40px "IBM Plex Mono"');
await document.fonts.load('500 40px "IBM Plex Mono"');
for (const s of sequences) await s.init(stage, params);

let active = null;
const lastCss = new Map();
window.__seek = async (f) => {
  const seq = sequences.find(s => f >= s.start && f < s.end) || sequences[sequences.length - 1];
  if (seq !== active) {
    for (const s of sequences) { s.layer.css.domElement.style.display = s === seq ? '' : 'none'; s.layer.overlay.style.display = s === seq ? '' : 'none'; }
    active = seq;
  }
  const out = seq.render(f);
  stage.bg.clear(); stage.fg.clear();
  if (out.bg) stage.bg.render(out.bg, out.camera);
  if (out.css) {
    // CSS3DRenderer leaves elements of previously rendered scenes in its DOM; hide them when the scene changes.
    const r = seq.layer.css, prev = lastCss.get(r);
    if (prev && prev !== out.css) prev.traverse(o => { if (o.element) o.element.style.display = 'none'; });
    lastCss.set(r, out.css);
    r.render(out.css, out.camera);
  }
  if (out.fg) stage.fg.render(out.fg, out.camera);
  stage.fade.style.opacity = out.fade ?? 0;
  if (seq.ready) await seq.ready(f);
  return f;
};
window.__filmReady = true;
console.log('[film] ready at scale', scale);
