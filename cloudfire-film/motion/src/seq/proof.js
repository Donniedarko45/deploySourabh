// S11–S12 (frames 900–1200): proof, not promises. Real AegisStore footage survives a crashed node; the MODULX site.
import { THREE, C, HEX, E, key, range, clamp, lerp, drift, el, css3d, eyebrow, lineMat, segments, roundRect, glowSprite, STAGE_H } from '../core.js';

const seq = { start: 900, end: 1200 };
let S, cam, cap = {};
const P = {};
const cursorSVG = `<svg width="56" height="56" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))"><path d="M5 3l14 8.5-6.2 1.3L9.6 19z" fill="#f4f3ef" stroke="#0a0a0a" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const FW = 2880, FH = 1620, CH = 78; // frame content (16:9) + chrome
const SX = FW / 1920;                // capture CSS px → frame px

// Which capture plays when (film frame → capture frame), and where attention goes (capture CSS px rects).
const CUTS = [ // focus rects measured from the live UI at 1920×1080 (see qa/capture-focus.json)
  { from: 900, to: 950, cap: 'overview', offset: 6, focus: [1270, 215, 1556, 449], zoom: 1.12 },
  { from: 950, to: 1012, cap: 'lab', offset: 0, focus: [767, 295, 1153, 681], zoom: 1.5 },
  { from: 1012, to: 1038, cap: 'nodes-offline', offset: 10, focus: [767, 235, 1153, 594], zoom: 1.5 },
  { from: 1038, to: 1080, cap: 'object', offset: 20, focus: [1280, 60, 1920, 520], zoom: 1.65 },
];

function frameDOM(w, h, title) {
  const f = el('div', { width: w + 'px', height: (h + CH) + 'px', background: '#0d0d0d', border: '2px solid rgba(255,255,255,.14)', borderRadius: '20px', overflow: 'hidden', position: 'relative',
    boxShadow: '0 80px 200px rgba(0,0,0,.65)' });
  f.innerHTML = `<div style="height:${CH}px;display:flex;align-items:center;gap:18px;padding:0 34px;border-bottom:2px solid rgba(255,255,255,.08);background:#121212">
      <i style="width:20px;height:20px;border-radius:50%;background:#3a3a3a"></i><i style="width:20px;height:20px;border-radius:50%;background:#3a3a3a"></i><i style="width:20px;height:20px;border-radius:50%;background:#3a3a3a"></i>
      <span class="title" style="margin-left:auto;margin-right:auto;font:400 30px/1 'IBM Plex Mono';letter-spacing:.12em;color:${HEX.muted}">${title}</span></div>
    <div class="view" style="position:relative;width:${w}px;height:${h}px;overflow:hidden">
      <div class="cam" style="position:absolute;left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0">
        <img class="a" style="position:absolute;left:0;top:0;width:${w}px;height:${h}px">
        <img class="b" style="position:absolute;left:0;top:0;width:${w}px;height:${h}px;opacity:0">
        <div class="cursor" style="position:absolute;left:0;top:0;opacity:0">${cursorSVG}</div>
      </div>
      <div class="spot" style="position:absolute;inset:0;pointer-events:none"></div>
    </div>`;
  return f;
}

seq.init = async (stage) => {
  S = stage; seq.layer = stage.layer();
  cam = new THREE.PerspectiveCamera(30, stage.W / stage.H, 10, 200000);
  cap = await fetch('../assets/ui-captures/raw/captures.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  // ---------- S11 ----------
  const a = P.a = { bg: new THREE.Scene(), css: new THREE.Scene(), fg: new THREE.Scene() };
  a.bg.fog = new THREE.Fog(0x000000, 6000, 16000);
  a.frameEl = frameDOM(FW, FH, 'AEGISSTORE');
  a.frame = css3d(a.frameEl, { x: 0, y: 0, z: 0 }); a.css.add(a.frame);
  [a.imgA, a.imgB] = [a.frameEl.querySelector('img.a'), a.frameEl.querySelector('img.b')];
  a.camEl = a.frameEl.querySelector('.cam'); a.spot = a.frameEl.querySelector('.spot'); a.cursor = a.frameEl.querySelector('.cursor');
  // behind the frame: the cluster as a ring of three storage nodes and their placement arcs
  const RX = 2600, RY = 1450, ringZ = -1900;
  const ring = []; for (let i = 0; i < 200; i++) { const t0 = i / 200 * Math.PI * 2, t1 = (i + 1) / 200 * Math.PI * 2; ring.push(Math.cos(t0) * RX, Math.sin(t0) * RY, ringZ, Math.cos(t1) * RX, Math.sin(t1) * RY, ringZ); }
  for (let i = 0; i < 128; i++) { const t = i / 128 * Math.PI * 2; ring.push(Math.cos(t) * (RX - 26), Math.sin(t) * (RY - 26), ringZ, Math.cos(t) * (RX + 26), Math.sin(t) * (RY + 26), ringZ); }
  a.ring = segments(ring, lineMat(S, { width: 1.8, opacity: .24 })); a.bg.add(a.ring);
  a.nodes = [200, 342, 92].map((deg, i) => {
    const t = THREE.MathUtils.degToRad(deg), x = Math.cos(t) * RX, y = Math.sin(t) * RY;
    const outline = segments(roundRect(x, y, ringZ, 640, 180, 18, 'xy'), lineMat(S, { width: 2.6, opacity: .55 }));
    const dash = segments(roundRect(x, y, ringZ, 640, 180, 18, 'xy', 8), lineMat(S, { width: 2.6, opacity: 0, dashed: true, dash: 18, gap: 14 }));
    const dot = glowSprite(C.fg, 110, .8); dot.position.set(x - 250, y, ringZ + 2);
    const label = css3d(el('div', { font: "500 56px/1 'IBM Plex Mono'", color: HEX.fg, whiteSpace: 'nowrap' }, `storage-node-${i + 1}`), { x: x + 50, y, z: ringZ + 2 });
    a.bg.add(outline, dash); a.fg.add(dot); a.css.add(label);
    return { outline, dash, dot, label, x, y };
  });
  a.label = eyebrow('AEGISSTORE · DISTRIBUTED OBJECT STORE', false); Object.assign(a.label.style, { left: '192px', top: '1960px' });
  // ---------- S12 ----------
  const b = P.b = { bg: new THREE.Scene(), css: new THREE.Scene(), fg: new THREE.Scene() };
  const MW = 2400, MH = 1120; // crop to the hero: MODULX’s own figures row stays out of frame
  b.frameEl = frameDOM(MW, MH, 'modulx.in');
  b.frame = css3d(b.frameEl, { x: 0, y: 0, z: 0 }); b.css.add(b.frame);
  b.img = b.frameEl.querySelector('img.a');
  Object.assign(b.img.style, { height: 'auto', width: MW + 'px' }); b.img.src = '../assets/footage/modulx-page.jpg';
  b.camEl = b.frameEl.querySelector('.cam'); b.MW = MW; b.MH = MH;
  b.label = eyebrow('MODULX · PRODUCT & QUOTE SITE', false); Object.assign(b.label.style, { left: '192px', top: '1960px' });
  for (const s of [a, b]) { s.hud = el('div', { position: 'absolute', inset: 0 }); s.hud.appendChild(s.label); seq.layer.overlay.appendChild(s.hud); }
  await b.img.decode().catch(() => {});
};

const pending = [];
function setImg(img, src) { if (img.getAttribute('src') !== src) { img.setAttribute('src', src); pending.push(img.decode().catch(() => {})); } }
seq.ready = async () => { while (pending.length) await pending.shift(); };
const capSrc = (name, i) => `../assets/ui-captures/raw/${name}/f${String(Math.max(0, Math.min((cap[name]?.frames || 1) - 1, i))).padStart(5, '0')}.png`;

function focusTransform(cut, f) {
  // Reframe inside the UI: ease toward the focus rect, then hold. Returns {s, tx, ty} for the inner camera.
  if (!cut.focus || cut.zoom <= 1) return { s: 1, tx: 0, ty: 0 };
  const [x0, y0, x1, y1] = cut.focus.map(v => v * SX);
  const t = E.soft(range(f, cut.from, cut.from + 30));
  const s = lerp(1, cut.zoom, t);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const tx = clamp(FW / 2 - cx * s, FW - FW * s, 0), ty = clamp(FH / 2 - cy * s, FH - FH * s, 0);
  return { s, tx: lerp(0, tx, t), ty: lerp(0, ty, t) };
}

seq.render = (f) => (f < 1080 ? s11(f) : s12(f));

function s11(f) {
  const a = P.a; a.hud.style.display = ''; P.b.hud.style.display = 'none';
  a.label.style.opacity = E.out(range(f, 906, 922)) * (1 - E.inOut(range(f, 1066, 1078)));
  const D = key(f, [[900, 4600], [930, 4950, E.out], [1080, 4450, E.soft]]);
  const yaw = key(f, [[900, 0], [940, 5, E.soft], [1080, -3, E.soft]]);
  const y = THREE.MathUtils.degToRad(yaw);
  cam.fov = 30; cam.position.set(Math.sin(y) * D, 40 + drift(f, 2, .02) * 25, Math.cos(y) * D); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
  const cut = CUTS.find(c => f >= c.from && f < c.to) || CUTS[CUTS.length - 1];
  const i = cut.offset + (f - cut.from);
  setImg(a.imgA, capSrc(cut.cap, i));
  // short dissolve from the previous capture (time compression inside real footage)
  const prev = CUTS[CUTS.indexOf(cut) - 1];
  const dis = prev ? 1 - range(f, cut.from, cut.from + 6) : 0;
  if (prev && dis > 0) { setImg(a.imgB, capSrc(prev.cap, prev.offset + (f - prev.from))); a.imgB.style.opacity = dis; } else a.imgB.style.opacity = 0;
  const ft = focusTransform(cut, f);
  a.camEl.style.transform = `translate(${ft.tx}px, ${ft.ty}px) scale(${ft.s})`;
  // a soft spotlight on what matters in this beat
  if (cut.focus) {
    const [x0, y0, x1, y1] = cut.focus.map(v => v * SX);
    const cx = ((x0 + x1) / 2) * ft.s + ft.tx, cy = ((y0 + y1) / 2) * ft.s + ft.ty, rx = (x1 - x0) * ft.s * .9, ry = (y1 - y0) * ft.s * 1.1;
    const amt = E.inOut(range(f, cut.from + 8, cut.from + 24)) * (1 - range(f, cut.to - 4, cut.to));
    a.spot.style.background = `radial-gradient(${rx}px ${ry}px at ${cx}px ${cy}px, transparent 55%, rgba(0,0,0,${.42 * amt}) 100%)`;
  } else a.spot.style.background = 'none';
  // cursor for the real clicks recorded during capture
  const ev = (cap[cut.cap]?.events || [])[0];
  if (ev?.target) {
    const clickF = cut.from + ev.frame - cut.offset;
    const tx = ev.target.cx * SX, ty = ev.target.cy * SX, t = E.inOut(range(f, clickF - 16, clickF - 1));
    const press = f >= clickF && f < clickF + 4 ? .86 : 1;
    a.cursor.style.opacity = range(f, clickF - 18, clickF - 12) * (1 - range(f, clickF + 14, clickF + 22));
    a.cursor.style.transform = `translate(${lerp(tx + 420, tx, t) - 8}px, ${lerp(ty + 300, ty, t) - 6}px) scale(${press})`;
  } else a.cursor.style.opacity = 0;
  // the ring behind loses storage-node-2 when the real crash is switched on
  const crashF = 950 + ((cap.lab?.events || [])[0]?.frame ?? 14);
  const down = E.out(range(f, crashF + 10, crashF + 24));
  const n2 = a.nodes[1];
  n2.outline.material.opacity = .55 * (1 - down);
  n2.dot.material.color.set(down > .5 ? C.accent : C.fg); n2.dash.material.opacity = .45 * down;
  n2.dot.material.opacity = .8 * (1 - down) + .15 * down * (Math.sin(f * 1.7) > 0 ? 1 : .4) * (1 - range(f, crashF + 30, crashF + 40));
  n2.label.element.style.opacity = 1 - down * .6;
  a.nodes.forEach(n => n.label.element.style.color = HEX.fg);
  return { bg: a.bg, css: a.css, fg: a.fg, camera: cam };
}

function s12(f) {
  const b = P.b; b.hud.style.display = ''; P.a.hud.style.display = 'none';
  b.label.style.opacity = E.out(range(f, 1084, 1100)) * (1 - E.inOut(range(f, 1184, 1198)));
  // on-screen width of the 1440 px source is kept near 1.3–1.4× (disclosed in the production report)
  const D = key(f, [[1080, 5600], [1200, 5050, E.soft]]);
  const yaw = THREE.MathUtils.degToRad(key(f, [[1080, -6], [1200, 2, E.soft]]));
  cam.fov = 30; cam.position.set(Math.sin(yaw) * D, -40, Math.cos(yaw) * D); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
  // inner move: from the headline toward the pack-size selector and "Ask for a price"
  const t = E.soft(range(f, 1080, 1200));
  const s = lerp(1, 1.035, t), pageScale = b.MW / 1440;
  const tx = lerp(0, -0.36 * b.MW * (s - 1) - 120, t), ty = lerp(-40, -120, t) * pageScale;
  b.camEl.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  b.frame.element.style.opacity = 1; // a clean cut on the bar line (frame 1080), never a fade through black
  return { bg: b.bg, css: b.css, fg: b.fg, camera: cam };
}

export default seq;
