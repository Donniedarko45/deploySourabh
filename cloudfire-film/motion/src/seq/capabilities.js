// S07–S10 (frames 420–900): both sides of the moment; a person approves; an ordinary afternoon; obvious.
import { THREE, C, HEX, E, key, range, clamp, lerp, rng, drift, el, css3d, eyebrow, lineMat, segments, polySegments,
  pointAlong, roundRect, glowSprite, lightPool, STAGE_W, STAGE_H, V, vfov } from '../core.js';

const seq = { start: 420, end: 900 };
let S, cam, cap = {};
const X = {}; // per-shot handles
const HORIZON = 1250 / 2160; // screen fraction of the surface line (matches S06's last frame)

const card = (w, h, html, style = {}) => el('div', { width: w + 'px', height: h + 'px', background: '#131313', border: '2px solid rgba(255,255,255,.12)',
  borderRadius: '14px', color: HEX.fg, font: "400 34px/1.35 Inter", padding: '34px 38px', overflow: 'hidden', position: 'relative', ...style }, html);
const mono = (t, c = HEX.muted, s = 28) => `<div style="font:400 ${s}px/1 'IBM Plex Mono';letter-spacing:.14em;color:${c}">${t}</div>`;
const bars = (n, seed = 1) => { const r = rng(seed); return Array.from({ length: n }, () => `<div style="height:14px;margin:18px 0;border-radius:3px;background:rgba(255,255,255,.1);width:${45 + r() * 50}%"></div>`).join(''); };
const check = (c = HEX.accent) => `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
const cursorSVG = `<svg width="56" height="56" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))"><path d="M5 3l14 8.5-6.2 1.3L9.6 19z" fill="#f4f3ef" stroke="#0a0a0a" stroke-width="1.3" stroke-linejoin="round"/></svg>`;

function shot() { return { bg: new THREE.Scene(), css: new THREE.Scene(), fg: new THREE.Scene() }; }
// Camera at distance D looking horizontally at height h so that world y=0 lands on screen row HORIZON_Y.
function horizonCam(x, D, fov = 30) {
  fov = vfov(fov, .62);
  const focal = (STAGE_H / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const h = (HORIZON * STAGE_H - STAGE_H / 2) * D / focal;
  cam.fov = fov; cam.position.set(x, h, D); cam.up.set(0, 1, 0); cam.lookAt(x, h, 0); cam.updateProjectionMatrix();
}

function frameDOM(w, h, title, imgSrc) {
  const f = el('div', { width: w + 'px', height: (h + 70) + 'px', background: '#0d0d0d', border: '2px solid rgba(255,255,255,.14)', borderRadius: '18px', overflow: 'hidden', position: 'relative',
    boxShadow: '0 60px 160px rgba(0,0,0,.6)' });
  f.innerHTML = `<div style="height:70px;display:flex;align-items:center;gap:16px;padding:0 30px;border-bottom:2px solid rgba(255,255,255,.08);background:#121212">
      <i style="width:18px;height:18px;border-radius:50%;background:#3a3a3a"></i><i style="width:18px;height:18px;border-radius:50%;background:#3a3a3a"></i><i style="width:18px;height:18px;border-radius:50%;background:#3a3a3a"></i>
      <span style="margin-left:auto;margin-right:auto;font:400 26px/1 'IBM Plex Mono';letter-spacing:.12em;color:${HEX.muted}">${title}</span></div>
    <div style="position:relative;width:${w}px;height:${h}px;overflow:hidden"><div class="inner" style="position:absolute;inset:0;transform-origin:0 0">
    <img class="shot" style="display:block;width:${w}px;height:${h}px" ${imgSrc ? `src="${imgSrc}"` : ''}>
    <div class="cursor" style="position:absolute;left:0;top:0;opacity:0">${cursorSVG}</div></div></div>`;
  return f;
}

seq.init = async (stage, params) => {
  S = stage; seq.layer = stage.layer();
  cam = new THREE.PerspectiveCamera(30, stage.W / stage.H, 10, 200000);
  cap = await fetch('../assets/ui-captures/raw/captures.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  X.capDir = '../assets/ui-captures/raw';

  // ---------- S07 ----------
  const a = X.s07 = shot();
  a.bg.add(segments([-60000, 0, 0, 60000, 0, 0], lineMat(S, { width: 2, opacity: .32 })));
  const FW = 2560, FH = 1440;
  a.frameEl = frameDOM(FW, FH, 'AEGISSTORE', `${X.capDir}/upload/f00000.png`);
  a.frame = css3d(a.frameEl, { x: 0, y: (FH + 70) / 2 + 30, z: 0 }); a.css.add(a.frame);
  a.img = a.frameEl.querySelector('.shot'); a.cursor = a.frameEl.querySelector('.cursor'); a.inner = a.frameEl.querySelector('.inner');
  a.reflEl = el('div', { width: FW + 'px', height: (FH + 70) + 'px', overflow: 'hidden', borderRadius: '18px',
    maskImage: 'linear-gradient(to top, rgba(0,0,0,.5), transparent 45%)', WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,.5), transparent 45%)' });
  a.reflImg = el('img', { width: FW + 'px', height: FH + 'px', marginTop: '70px', display: 'block' }); a.reflEl.appendChild(a.reflImg);
  a.refl = css3d(a.reflEl, { x: 0, y: -(FH + 70) / 2 - 30, z: 0 }); a.refl.scale.set(1, -1, 1); a.css.add(a.refl);
  const replicaNodes = (cap.uploadReplicas || ['storage-node-1', 'storage-node-3']);
  a.nodes = [-900, 900].map((x, i) => {
    const c = card(620, 150, `<div style="display:flex;align-items:center;gap:22px;height:100%"><span style="width:16px;height:16px;border-radius:50%;background:${HEX.accent}"></span>
      <div><div style="font:500 36px/1 'IBM Plex Mono';color:${HEX.fg}">${replicaNodes[i]}</div><div style="margin-top:14px;font:400 24px/1 'IBM Plex Mono';letter-spacing:.14em;color:${HEX.muted}">REPLICA · SHA-256 ✓</div></div></div>`,
      { padding: '0 36px', background: '#101010' });
    const o = css3d(c, { x, y: -820, z: 0 }); a.css.add(o); return o;
  });
  a.routes = [-900, 900].map(x => [[0, -4, 0], [0, -420, 0], [x, -420, 0], [x, -745, 0]]);
  a.lines = a.routes.map(() => { const l = segments([0, 0, 0, 0, 0, 0], lineMat(S, { color: C.accent, width: 3.5 })); a.bg.add(l); return l; });
  a.packets = a.routes.map(() => { const p = glowSprite(C.accent, 150, 1); a.fg.add(p); return p; });
  a.eyebrow = eyebrow('01 · PRODUCT ENGINEERING'); Object.assign(a.eyebrow.style, { left: '192px', top: '1960px' });

  // ---------- S08: request → extract → retrieve → draft → human review → result ----------
  const b = X.s08 = shot();
  const Y = 260;
  b.flow = [[-2900, Y, 0], [3000, Y, 0]];
  b.flowLine = segments([0, 0, 0, 0, 0, 0], lineMat(S, { width: 2.2, opacity: .3 })); b.bg.add(b.flowLine);
  b.pool = lightPool(5200, 3200, 0, Y, -700, .6); b.bg.add(b.pool);
  b.doc = css3d(card(600, 760, `${mono('INCOMING · INVOICE.PDF')}<div style="margin-top:34px;font:500 46px/1.15 'Instrument Sans';letter-spacing:-.02em">Northwind Supplies</div>
    <div style="margin-top:10px;font:400 30px/1.3 Inter;color:${HEX.muted}">Invoice for PO 1182 · Net 30</div>${bars(8, 3)}
    <div class="scan" style="position:absolute;left:0;right:0;height:3px;background:${HEX.accent};box-shadow:0 0 24px 6px rgba(255,90,54,.5);top:0;opacity:0"></div>`), { x: -2200, y: Y, z: -120 });
  b.css.add(b.doc); b.scan = b.doc.element.querySelector('.scan');
  b.chips = ['SUPPLIER · Northwind Supplies', 'ORDER · PO 1182', 'TERMS · Net 30'].map((t, i) => {
    const [k, v] = t.split(' · ');
    const c = card(560, 120, `<div style="display:flex;align-items:center;gap:22px;height:100%">${mono(k, HEX.accent, 24)}<span style="font:500 32px/1 Inter">${v}</span></div>`, { padding: '0 30px', borderRadius: '10px' });
    const o = css3d(c, { x: -1300, y: Y + 200 - i * 160, z: 40 }); b.css.add(o); return o; });
  b.store = css3d(card(700, 130, `<div style="display:flex;align-items:center;justify-content:center;height:100%;gap:20px">${mono('KNOWLEDGE · RECORDS', HEX.fg, 30)}</div>`,
    { padding: 0, background: '#101010' }), { x: -350, y: Y + 980, z: -200 }); b.css.add(b.store);
  b.ctx = [['Purchase order 1182', 'Approved · within budget'], ['Supplier record', 'Bank details unchanged']].map(([t, s], i) => {
    const c = card(560, 190, `<div style="font:500 36px/1.2 'Instrument Sans'">${t}</div><div style="margin-top:12px;display:flex;align-items:center;gap:12px;font:400 28px/1 Inter;color:${HEX.muted}">${check()}${s}</div>`);
    const o = css3d(c, { x: -350, y: Y + 150 - i * 240, z: 60 }); b.css.add(o); return o; });
  b.ctxLines = [0, 1].map(() => { const l = segments([0, 0, 0, 0, 0, 0], lineMat(S, { width: 2, opacity: .35 })); b.bg.add(l); return l; });
  b.draft = css3d(card(640, 520, `${mono('DRAFT')}<div style="margin-top:26px;font:500 44px/1.15 'Instrument Sans';letter-spacing:-.02em">Ready to schedule</div>
    ${['Matches PO 1182', 'Terms: net 30', 'Bank details unchanged'].map(t => `<div class="dl" style="margin-top:22px;display:flex;align-items:center;gap:14px;font:400 30px/1 Inter;color:#cfcfcb">${check('#8a8a8a')}${t}</div>`).join('')}`),
    { x: 650, y: Y, z: 0 }); b.css.add(b.draft); b.draftLines = [...b.draft.element.querySelectorAll('.dl')];
  b.review = css3d(card(660, 560, `${mono('HUMAN REVIEW', HEX.accent)}<div style="margin-top:30px;display:flex;align-items:center;gap:22px">
      <div style="width:84px;height:84px;border-radius:50%;background:#262626;display:grid;place-items:center;font:500 34px/1 Inter;color:${HEX.fg}">F</div>
      <div><div style="font:500 36px/1 Inter">Finance reviewer</div><div style="margin-top:10px;font:400 26px/1 Inter;color:${HEX.muted}">Approves every payment</div></div></div>
    <div style="display:flex;gap:20px;margin-top:64px">
      <div class="approve" style="position:relative;flex:1;height:120px;background:${HEX.fg};color:#0a0a0a;display:flex;align-items:center;justify-content:center;gap:14px;font:600 38px/1 'Instrument Sans'">
        <span class="al">Approve</span><span class="ad" style="position:absolute;display:flex;align-items:center;gap:12px;opacity:0;color:${HEX.fg}">${check(HEX.accent)}Approved</span></div>
      <div style="width:170px;height:120px;border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font:500 34px/1 Inter;color:${HEX.muted}">Edit</div></div>
    <div class="cursor" style="position:absolute;left:0;top:0">${cursorSVG}</div>`), { x: 1500, y: Y, z: 0 });
  b.css.add(b.review); b.approve = b.review.element.querySelector('.approve'); b.al = b.review.element.querySelector('.al'); b.ad = b.review.element.querySelector('.ad');
  b.cursor = b.review.element.querySelector('.cursor');
  b.result = css3d(card(560, 200, `<div style="display:flex;align-items:center;gap:22px;height:100%"><svg class="ring" width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="44" fill="none" stroke="${HEX.accent}" stroke-width="3"/><path d="M29 49l13 13 26-27" fill="none" stroke="${HEX.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div><div style="font:500 38px/1.1 'Instrument Sans'">Scheduled</div><div style="margin-top:10px;font:400 26px/1 Inter;color:${HEX.muted}">Sent to payments</div></div></div>`, { padding: '0 36px' }),
    { x: 2400, y: Y, z: 0 }); b.css.add(b.result);
  b.packet = glowSprite(C.accent, 180, 1); b.fg.add(b.packet);
  b.ring = segments(circlePts(0, 0, 1, 128), lineMat(S, { color: C.accent, width: 3 })); b.fg.add(b.ring);
  b.eyebrow = eyebrow('02 · AI & AUTOMATION'); Object.assign(b.eyebrow.style, { left: '192px', top: '1960px' });

  // ---------- S09: delivery loop, rolling update, a calm trace ----------
  const c = X.s09 = shot();
  c.R = 720;
  c.ring = segments(circlePts(0, 0, c.R, 160), lineMat(S, { width: 2.4, opacity: .4 })); c.bg.add(c.ring);
  c.bg.add(lightPool(3600, 3600, 0, 0, -500, .55)); const cp = lightPool(5200, 3000, 0, -1980, -700, .5); cp.rotation.x = -Math.PI / 2; c.bg.add(cp);
  c.ringLit = segments([0, 0, 0, 0, 0, 0], lineMat(S, { color: C.accent, width: 4 })); c.bg.add(c.ringLit);
  c.stages = ['COMMIT', 'BUILD', 'TEST', 'DEPLOY', 'OBSERVE'].map((t, i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
    const e = card(400, 104, `<div style="display:flex;align-items:center;justify-content:space-between;height:100%"><span style="font:500 32px/1 'IBM Plex Mono';letter-spacing:.12em">${t}</span><span class="ok" style="opacity:0">${check()}</span></div>`,
      { padding: '0 30px', borderRadius: '10px', background: '#111' });
    const o = css3d(e, { x: Math.cos(a) * c.R, y: -Math.sin(a) * c.R, z: 0 }); c.css.add(o); return { o, a, ok: e.querySelector('.ok') };
  });
  c.center = css3d(el('div', { textAlign: 'center' }, `${mono('MAIN', HEX.muted, 28)}<div style="margin-top:20px;font:500 54px/1 'IBM Plex Mono';color:${HEX.fg}">a3f9c1e</div>`), { x: 0, y: 0, z: 0 });
  c.css.add(c.center);
  c.packet = glowSprite(C.accent, 200, 1); c.fg.add(c.packet);
  c.boxes = []; const GW = 6, GH = 3;
  for (let i = 0; i < GW; i++) for (let j = 0; j < GH; j++) {
    const g = new THREE.Group(); g.position.set((i - (GW - 1) / 2) * 420, -1900, -j * 420 - 200);
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(260, 260, 260));
    const pos = []; const arr = geo.attributes.position.array; for (let k = 0; k < arr.length; k++) pos.push(arr[k]);
    const old = segments(pos, lineMat(S, { width: 2, opacity: .35 })); const neu = segments(pos, lineMat(S, { width: 2.6, opacity: 0 }));
    const top = segments([-130, 131, -130, 130, 131, -130, 130, 131, -130, 130, 131, 130, 130, 131, 130, -130, 131, 130, -130, 131, 130, -130, 131, -130], lineMat(S, { color: C.accent, width: 3.5, opacity: 0 }));
    g.add(old, neu, top); c.bg.add(g); c.boxes.push({ g, old, neu, top, order: i * GH + j });
  }
  c.trace = segments([0, 0, 0, 0, 0, 0], lineMat(S, { width: 2.4, opacity: .55 })); c.fg.add(c.trace);
  c.traceLabel = el('div', { position: 'absolute', left: '192px', top: '1700px', font: "400 30px/1 'IBM Plex Mono'", letterSpacing: '.14em', color: HEX.muted }, 'P95 LATENCY · STEADY');
  c.log = el('div', { position: 'absolute', left: '192px', top: '1590px', display: 'flex', alignItems: 'center', gap: '22px', font: "500 44px/1 'IBM Plex Mono'", color: HEX.fg },
    `<span style="width:16px;height:16px;border-radius:50%;background:${HEX.accent}"></span>Deployed · Tue 15:42`);
  c.eyebrow = eyebrow('03 · CLOUD & PLATFORM'); Object.assign(c.eyebrow.style, { left: '192px', top: '1960px' });

  // ---------- S10: a tangled journey becomes one obvious screen ----------
  const d = X.s10 = shot();
  const rr = rng(44);
  d.screens = Array.from({ length: 8 }, (_, i) => {
    const e = card(560, 360, `<div style="height:30px;width:42%;border-radius:4px;background:rgba(255,255,255,.2)"></div>${bars(4, 50 + i)}
      <div style="position:absolute;right:34px;bottom:30px;width:150px;height:52px;border-radius:4px;background:rgba(255,255,255,${i % 3 ? .12 : .3})"></div>
      <div style="position:absolute;left:34px;bottom:34px;font:400 26px/1 'IBM Plex Mono';letter-spacing:.12em;color:${HEX.dim}">STEP ${[1, 5, 3, 6, 2, 8, 4, 7][i]}</div>`, { padding: '34px 38px' });
    const o = css3d(e, { x: 0, y: 0, z: 0 }); d.css.add(o);
    const grid = V.vertical ? [[-650, 3400], [650, 2600], [-700, 1700], [600, 900], [-600, 100], [700, -700], [-650, -1500], [600, -2300]][i]
      : [[-2300, 1050], [-700, 1250], [900, 1000], [2400, 1200], [-1900, -250], [-300, -450], [1300, -200], [2700, -400]][i];
    return { o, sx: grid[0] + (rr() - .5) * 300, sy: grid[1] + (rr() - .5) * 200, sz: (rr() - .5) * 500, order: [0, 5, 2, 6, 1, 7, 3, 4][i] };
  });
  d.path = segments([0, 0, 0, 0, 0, 0], lineMat(S, { width: 5, opacity: .7 })); d.bg.add(d.path);
  d.bg.add(lightPool(6400, 3800, 0, 300, -700, .55));
  d.pathOrange = segments([0, 0, 0, 0, 0, 0], lineMat(S, { color: C.accent, width: 4, opacity: 0 })); d.bg.add(d.pathOrange);
  d.finalEl = el('div', { width: '1600px', height: '940px', background: '#131313', border: '2px solid rgba(255,255,255,.14)', borderRadius: '18px', padding: '90px 110px', color: HEX.fg, overflow: 'hidden' },
    `${mono('DELIVERY')}<div style="margin-top:36px;font:500 84px/1.05 'Instrument Sans';letter-spacing:-.04em">Choose a delivery time</div>
    <div style="display:flex;gap:26px;margin-top:64px">${['Morning', 'Afternoon', 'Evening'].map((t, i) => `<div style="flex:1;height:150px;border:2px solid ${i === 1 ? HEX.accent : 'rgba(255,255,255,.16)'};display:flex;align-items:center;justify-content:center;gap:16px;font:500 40px/1 Inter;color:${i === 1 ? HEX.fg : HEX.muted}">${i === 1 ? `<span style="width:16px;height:16px;border-radius:50%;background:${HEX.accent}"></span>` : ''}${t}</div>`).join('')}</div>
    <div style="margin-top:80px;height:150px;background:${HEX.fg};color:#0a0a0a;display:flex;align-items:center;justify-content:center;font:600 54px/1 'Instrument Sans';letter-spacing:-.02em">Confirm</div>`);
  d.final = css3d(d.finalEl, { x: 0, y: 300, z: 0 }); d.css.add(d.final);
  d.eyebrow = eyebrow('04 · EXPERIENCE & GROWTH'); Object.assign(d.eyebrow.style, { left: '192px', top: '1960px' });

  for (const s of [a, b, c, d]) { s.hud = el('div', { position: 'absolute', inset: 0 }); seq.layer.overlay.appendChild(s.hud); s.hud.appendChild(s.eyebrow);
    if (V.vertical) Object.assign(s.eyebrow.style, { left: '150px', top: '300px' }); }  // top: social platforms cover the bottom fifth
  if (V.vertical) { Object.assign(c.traceLabel.style, { left: '150px', top: '400px' }); Object.assign(c.log.style, { left: '150px', top: '480px' }); }
  c.hud.append(c.traceLabel, c.log);
};

function catmull(pts, steps) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < steps; k++) { const t = k / steps, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map(j => .5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  out.push(pts[pts.length - 1]); return out;
}
function circlePts(cx, cy, r, n) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2;
  p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0, cx + Math.cos(b) * r, cy + Math.sin(b) * r, 0); } return p; }
function arcPts(r, a0, a1, n = 96) { const p = []; for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n, b = a0 + (a1 - a0) * (i + 1) / n;
  p.push(Math.cos(a) * r, -Math.sin(a) * r, 0, Math.cos(b) * r, -Math.sin(b) * r, 0); } return p; }
function showHud(s) { for (const k of ['s07', 's08', 's09', 's10']) X[k].hud.style.display = X[k] === s ? '' : 'none'; }
function eyebrowFade(s, f, a, b) { s.eyebrow.style.opacity = E.out(range(f, a + 6, a + 20)) * (1 - E.inOut(range(f, b - 14, b - 2))); }
const pending = [];
function setImg(img, src) { if (img.getAttribute('src') !== src) { img.setAttribute('src', src); pending.push(img.decode().catch(() => {})); } }
seq.ready = async () => { while (pending.length) await pending.shift(); };

seq.render = (f) => {
  if (f < 525) return s07(f);
  if (f < 660) return s08(f);
  if (f < 795) return s09(f);
  return s10(f);
};

function s07(f) {
  const a = X.s07; showHud(a); eyebrowFade(a, f, 420, 525);
  horizonCam(drift(f, 7, .02) * 40 + key(f, [[420, -120], [525, 120, E.linear]]) + (V.vertical ? key(f, [[420, 0], [500, 560, E.soft]]) : 0),
    key(f, [[420, 5950], [525, 5380, E.soft]]) * (V.vertical ? 1.12 : 1));
  // the product rises out of the surface line
  const rise = E.inOut(range(f, 420, 446));
  a.frameEl.style.clipPath = `inset(${(1 - rise) * 100}% 0 0 0 round 18px)`;
  a.reflEl.style.opacity = rise;
  // inner camera: ease toward the table and the upload panel where the copies are reported
  const z = E.soft(range(f, 446, 500)), zs = lerp(1, 1.55, z);
  a.inner.style.transform = `translate(${lerp(0, -(2560 * zs - 2560), z)}px, ${lerp(0, -(1440 * zs - 1440) * .92, z)}px) scale(${zs})`;
  const cfr = Math.min((cap.upload?.frames || 1) - 1, Math.max(0, f - 420 + 2));
  const src = `${X.capDir}/upload/f${String(cfr).padStart(5, '0')}.png`;
  setImg(a.img, src); setImg(a.reflImg, src);
  // cursor: glides to the real Upload button, presses, leaves
  const ev = cap.upload?.events?.find(e => e.action === 'click-upload');
  if (ev?.target) {
    const sx = 2560 / 1920, tx = ev.target.cx * sx, ty = ev.target.cy * sx, clickF = 420 + ev.frame - 2;
    const t = E.inOut(range(f, clickF - 14, clickF - 1));
    const x = lerp(tx + 520, tx, t), y = lerp(ty + 380, ty, t), press = f >= clickF && f < clickF + 4 ? .86 : 1;
    a.cursor.style.opacity = range(f, clickF - 16, clickF - 10) * (1 - range(f, clickF + 16, clickF + 26));
    a.cursor.style.transform = `translate(${x - 8}px, ${y - 6}px) scale(${press})`;
  }
  // beneath the line: the same moment as structure, two copies landing on two nodes
  a.routes.forEach((r, i) => {
    const t = E.inOut(range(f, 462 + i * 3, 492 + i * 3));
    a.lines[i].geometry.setPositions(polySegments(r, t)); a.lines[i].visible = t > 0;
    a.packets[i].position.set(...pointAlong(r, t)); a.packets[i].material.opacity = t > 0 && t < 1 ? 1 : t >= 1 ? .6 : 0;
    a.nodes[i].element.style.opacity = E.out(range(f, 480 + i * 3, 496 + i * 3));
  });
  return { bg: a.bg, css: a.css, fg: a.fg, camera: cam };
}

function s08(f) {
  const b = X.s08; showHud(b); eyebrowFade(b, f, 525, 660);
  const cx = key(f, [[525, -1500], [600, 200, E.soft], [646, 2150, E.soft]]);
  const D = key(f, [[525, 3300], [640, 3500], [660, 2000, E.in]]);
  cam.fov = vfov(30, .62); cam.position.set(cx, 260 + drift(f, 3, .02) * 30, D * (V.vertical ? 1.15 : 1)); cam.up.set(0, 1, 0); cam.lookAt(cx, 260, 0); cam.updateProjectionMatrix();
  b.flowLine.geometry.setPositions(polySegments(b.flow, E.inOut(range(f, 525, 640))));
  // document: read
  b.scan.style.opacity = range(f, 530, 533) * (1 - range(f, 556, 560));
  b.scan.style.top = `${lerp(30, 730, E.inOut(range(f, 531, 557)))}px`;
  b.chips.forEach((o, i) => { const t = E.out(range(f, 548 + i * 3, 566 + i * 3)); o.position.x = lerp(-2000, -1300, t); o.element.style.opacity = t; });
  // retrieve context from records
  b.store.element.style.opacity = E.out(range(f, 552, 566));
  b.ctx.forEach((o, i) => {
    const t = E.inOut(range(f, 560 + i * 6, 586 + i * 6));
    o.position.y = lerp(1240 - 0, 410 - i * 240, t); o.element.style.opacity = E.out(range(f, 560 + i * 6, 570 + i * 6));
    b.ctxLines[i].geometry.setPositions([-350 + (i ? 120 : -120), 1180, -100, -350 + (i ? 120 : -120), o.position.y + 95, 0]);
    b.ctxLines[i].material.opacity = .35 * range(f, 560, 570);
  });
  b.draft.element.style.opacity = E.out(range(f, 584, 598));
  b.draftLines.forEach((dl, i) => { dl.style.opacity = E.out(range(f, 592 + i * 4, 602 + i * 4)); });
  b.review.element.style.opacity = E.out(range(f, 600, 612));
  // a person approves
  const press = f >= 622 && f < 626 ? .97 : 1;
  b.approve.style.transform = `scale(${press})`;
  const done = E.out(range(f, 624, 632));
  b.approve.style.background = `rgba(${lerp(244, 20, done)},${lerp(243, 20, done)},${lerp(239, 20, done)},1)`;
  b.approve.style.border = done > 0 ? '2px solid rgba(255,90,54,.7)' : 'none';
  b.al.style.opacity = 1 - done; b.ad.style.opacity = done;
  const ct = E.inOut(range(f, 606, 621));
  b.cursor.style.opacity = range(f, 604, 610) * (1 - range(f, 632, 640));
  b.cursor.style.transform = `translate(${lerp(560, 230, ct)}px, ${lerp(560, 400, ct)}px) scale(${press < 1 ? .86 : 1})`;
  b.result.element.style.opacity = E.out(range(f, 632, 644));
  // packet follows the work along the flow line
  const pt = E.inOut(range(f, 528, 640));
  b.packet.position.set(lerp(-2600, 2400, pt), 260, 30); b.packet.material.opacity = f < 640 ? .9 : 0;
  // the approval ring grows into the delivery loop (match cut)
  const g = E.in(range(f, 642, 660));
  b.ring.position.set(2400 - 280 + 48 + 36 - 200 + 52, 260, 10);
  const r0 = 44, r1 = 720 * (2000 / 3500);
  b.ring.scale.setScalar(lerp(r0, r1, g)); b.ring.material.opacity = g > 0 ? 1 : 0;
  return { bg: b.bg, css: b.css, fg: b.fg, camera: cam };
}

function s09(f) {
  const c = X.s09; showHud(c); eyebrowFade(c, f, 660, 795);
  const tilt = E.inOut(range(f, 724, 760));
  const camY = lerp(0, -1250, tilt), lookY = lerp(0, -1900, tilt), D = lerp(2600, 3400, E.out(range(f, 660, 700))) + tilt * 900;
  cam.fov = vfov(30, .62); cam.position.set(drift(f, 9, .02) * 40, camY + tilt * 900, D * (V.vertical ? 1.2 : 1)); cam.up.set(0, 1, 0); cam.lookAt(0, lookY, -400 * tilt); cam.updateProjectionMatrix();
  // packet travels the loop; each stage it passes is checked
  const lt = E.inOut(range(f, 664, 728));
  const ang = Math.PI / 2 - lt * Math.PI * 2;
  c.packet.position.set(Math.cos(ang) * c.R, Math.sin(ang) * c.R, 10); c.packet.material.opacity = lt > 0 && lt < 1 ? 1 : 0;
  c.ringLit.geometry.setPositions(lt > 0 ? arcPts(c.R, -Math.PI / 2 * -1, Math.PI / 2 - lt * Math.PI * 2, 120) : [0, 0, 0, 0, 0, 0]);
  c.stages.forEach((s, i) => { const on = range(f, 664 + i * 64 / 5, 668 + i * 64 / 5); s.ok.style.opacity = on;
    s.o.element.style.borderColor = on > .5 ? 'rgba(255,90,54,.8)' : 'rgba(255,255,255,.12)'; });
  // rolling update, one container at a time
  for (const bx of c.boxes) {
    const t = E.inOut(range(f, 738 + bx.order * 2.2, 748 + bx.order * 2.2));
    bx.g.rotation.x = t * Math.PI; bx.old.material.opacity = .35 * (1 - t); bx.neu.material.opacity = .7 * t; bx.top.material.opacity = t;
  }
  // a calm trace runs along the bottom of frame (screen-anchored)
  const pts = []; const n = 140;
  const ndc = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = Math.sin(u * 13 + f * .22) * .010 + Math.sin(u * 31 - f * .31) * .004;
    ndc.set(lerp(-1.05, 1.05, u), -0.55 + v, 0.5).unproject(cam); pts.push([ndc.x, ndc.y, ndc.z]);
  }
  const trace = polySegments(pts, E.inOut(range(f, 672, 712)));
  c.trace.geometry.setPositions(trace);
  c.traceLabel.style.opacity = E.out(range(f, 690, 706));
  c.log.style.opacity = E.out(range(f, 770, 782));
  c.log.style.transform = `translateY(${(1 - E.out(range(f, 770, 784))) * 20}px)`;
  return { bg: c.bg, css: c.css, fg: c.fg, camera: cam };
}

function s10(f) {
  const d = X.s10; showHud(d); eyebrowFade(d, f, 795, 900);
  const D = key(f, [[795, 6300], [870, 6000], [900, 2555, E.inOut]]);  // final screen matches the S11 browser frame on screen
  cam.fov = vfov(30, .62); cam.position.set(0, 300, D * (V.vertical ? 1.25 : 1)); cam.up.set(0, 1, 0); cam.lookAt(0, 300, 0); cam.updateProjectionMatrix();
  const untangle = E.inOut(range(f, 826, 856)), merge = E.inOut(range(f, 856, 880));
  const keep = new Set([0, 3, 7]);
  const row = (i) => { const k = d.screens[i].order; return V.vertical ? [0, 3450 - k * 900, 0] : [-3150 + k * 900, 300, 0]; };
  const kept = [...keep].sort((a, b) => d.screens[a].order - d.screens[b].order);
  const pos = d.screens.map((s, i) => {
    let p = [lerp(s.sx, row(i)[0], untangle), lerp(s.sy, row(i)[1], untangle), lerp(s.sz, 0, untangle)];
    if (keep.has(i)) { const k = kept.indexOf(i), ax = V.vertical ? 1 : 0; p[ax] = lerp(p[ax], lerp(V.vertical ? 1700 - k * 1400 : -1400 + k * 1400, 300 * ax, merge), untangle > .99 ? 1 : untangle); }
    return p;
  });
  d.screens.forEach((s, i) => {
    s.o.position.set(...pos[i]);
    const vis = E.out(range(f, 795 + s.order * 2, 806 + s.order * 2)) * (keep.has(i) ? 1 - E.inOut(range(f, 870, 880)) : 1 - E.inOut(range(f, 844, 858)));
    s.o.element.style.opacity = vis;
  });
  // the journey path through the screens, in their tangled order with back-tracks, then straight
  const order = d.screens.map((s, i) => [s.order, i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
  const ctrl = [[-3600, -900, 0]];
  const jr = rng(8);
  order.forEach((i, k) => { ctrl.push(pos[i]); if (k % 3 === 1) ctrl.push([pos[i][0] + (jr() - .5) * 2200, pos[i][1] + (jr() - .5) * 1600, 0], pos[order[Math.max(0, k - 1)]]); });
  ctrl.push([3800, -1100, 0]);
  const tangled = catmull(ctrl, 14).map((p, j, arr) => V.vertical
    ? [lerp(p[0], 0, untangle), lerp(p[1], lerp(4200, -3400, j / (arr.length - 1)), untangle), 0]
    : [lerp(p[0], lerp(-3600, 3800, j / (arr.length - 1)), untangle), lerp(p[1], 300, untangle), 0]);
  const t = E.inOut(range(f, 797, 834));
  d.path.geometry.setPositions(polySegments(tangled, t)); d.path.material.opacity = .7 * (1 - E.inOut(range(f, 840, 856)));
  const straight = kept.map(i => pos[i]);
  d.pathOrange.geometry.setPositions(polySegments(V.vertical ? [[0, 4200, 0], ...straight, [0, -3400, 0]] : [[-2800, 300, 0], ...straight, [2800, 300, 0]], 1));
  d.pathOrange.material.opacity = E.out(range(f, 846, 858)) * (1 - E.inOut(range(f, 870, 882)));
  const fin = E.out(range(f, 872, 892));
  d.final.element.style.opacity = fin; d.final.scale.setScalar(lerp(.6, 1, fin));
  return { bg: d.bg, css: d.css, fg: d.fg, camera: cam };
}

export default seq;
