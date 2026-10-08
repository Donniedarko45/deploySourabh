// S13–S15 (frames 1200–1560): everything resolves into one line; the dot returns; it becomes the period of the wordmark.
import { THREE, C, HEX, E, key, range, clamp, lerp, rng, el, lineMat, segments, roundRect, glowSprite, STAGE_W, STAGE_H, V, vfov } from '../core.js';

const seq = { start: 1200, end: 1560 };
let S, cam, bg, fg, W = {};

// Genuine mark paths from components/cloudfire/Brand.tsx
const CLOUD = 'M16 40C8.3 40 3 34.9 3 28.2C3 21.6 7.9 16.4 14.3 15.8C16 8.7 22.2 4 29.5 4C37.1 4 43.2 8.6 45.2 15.3C53.3 14.4 61 20.4 61 28.4C61 35.1 55.7 40 48 40Z';
const FIRE = 'M34.7 17C37.4 28.3 27.4 31.5 24.4 38.1C20.6 46.3 26 56 34.4 56C44.9 56 49.6 46.2 44.8 38.6C42.8 35.5 40.4 34 40.7 29.9C36.9 32.8 37.4 38.4 34.4 40.3C37 31.9 35.1 24.7 34.7 17Z';
const CORE = 'M33.4 40.8C34.2 45 29.1 46.8 30.7 50C32.5 53.5 38.5 52.7 39 48.9C39.4 46.7 36.7 45.6 36.8 43.7C35.6 44.7 35.8 46.6 34.5 47.5C35.6 44.6 34.4 42.6 33.4 40.8Z';

function buildPlane(scene) {
  // The film's motifs laid on one horizontal plane (y = 0): nodes, rings, records, routes, threads.
  const r = rng(91), flat = [], soft = [], routes = [], threads = [];
  for (let i = 0; i < 70; i++) {
    const x = (r() - .5) * 16000, z = -r() * 14000 + 2500;
    if (Math.abs(x) < 900 && z > -1500) continue;
    flat.push(...roundRect(x, 0, z, 360 + r() * 260, 150 + r() * 60, 16, 'xz'));
  }
  const ring = (cx, cz, rad, n) => { const pts = []; for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2, b = (i + 1) / 96 * Math.PI * 2;
    pts.push(cx + Math.cos(a) * rad, 0, cz + Math.sin(a) * rad, cx + Math.cos(b) * rad, 0, cz + Math.sin(b) * rad); }
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; pts.push(...roundRect(cx + Math.cos(a) * rad, 0, cz + Math.sin(a) * rad, 300, 140, 14, 'xz')); }
    return pts; };
  soft.push(...ring(-3600, -4200, 1300, 5), ...ring(4200, -6400, 1500, 6));
  for (let i = 0; i < 26; i++) { const x = 1200 + (i % 2) * 520, z = -1400 - Math.floor(i / 2) * 210; soft.push(x, 0, z, x + 380 - (i % 3) * 70, 0, z); }
  // orange routes converge on the centre point where the dot will be
  for (const pts of [[[-7000, -6000], [-7000, -2200], [-1600, -2200], [-1600, 0], [0, 0]], [[6800, -9000], [2400, -9000], [2400, -900], [0, -900], [0, 0]]])
    for (let i = 1; i < pts.length; i++) routes.push(pts[i - 1][0], 0, pts[i - 1][1], pts[i][0], 0, pts[i][1]);
  for (let i = 0; i < 60; i++) { const x = (r() - .5) * 15000, z = -r() * 12000; threads.push([x, z, 600 + r() * 2200]); }
  W.flat = segments(flat, lineMat(S, { width: 2, opacity: .3 })); scene.add(W.flat);
  W.soft = segments(soft, lineMat(S, { width: 2, opacity: .26 })); scene.add(W.soft);
  W.routes = segments(routes, lineMat(S, { color: C.accent, width: 3.5, opacity: .9 })); scene.add(W.routes);
  W.routesGlow = segments(routes, lineMat(S, { color: C.accent, width: 14, opacity: .14 })); scene.add(W.routesGlow);
  W.threadData = threads;
  W.threads = segments(threads.flatMap(([x, z, h]) => [x, 0, z, x, h, z]), lineMat(S, { width: 1.6, opacity: .16 })); scene.add(W.threads);
  W.horizon = segments([-200000, 0, 0, 200000, 0, 0], lineMat(S, { width: 2, opacity: 0 })); scene.add(W.horizon);
}

function lockupDOM() {
  const root = el('div', { position: 'absolute', left: 0, top: 0, width: STAGE_W + 'px', height: STAGE_H + 'px', transformOrigin: '0 0' });
  const FS = 256, MARK = 384;
  const lock = el('div', { position: 'absolute', top: V.vertical ? '980px' : '560px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: V.vertical ? '70px' : '84px', flexDirection: V.vertical ? 'column' : 'row' });
  lock.innerHTML = `
    <svg class="mark" width="${MARK}" height="${MARK}" viewBox="0 0 64 64" fill="none" style="overflow:visible">
      <defs><mask id="cut" x="0" y="0" width="64" height="64" maskUnits="userSpaceOnUse"><rect width="64" height="64" fill="white"/>
        <path d="${FIRE}" fill="black" stroke="black" stroke-width="5" stroke-linejoin="round"/></mask>
        <clipPath id="rise"><rect class="riseRect" x="0" y="64" width="64" height="64"/></clipPath></defs>
      <path class="cloudStroke" d="${CLOUD}" fill="none" stroke="${HEX.fg}" stroke-width="0.9" mask="url(#cut)" pathLength="1" stroke-dasharray="1 1"/>
      <path class="cloudFill" d="${CLOUD}" fill="${HEX.fg}" mask="url(#cut)" opacity="0"/>
      <g clip-path="url(#rise)"><path d="${FIRE}" fill="${HEX.accent}"/><path class="core" d="${CORE}" fill="${HEX.bg}" opacity="0"/></g>
    </svg>
    <div class="words" style="display:flex;flex-direction:column;gap:46px">
      <div class="wm" style="position:relative;font:600 ${FS}px/1 'Instrument Sans';letter-spacing:-.065em;color:${HEX.fg};white-space:nowrap;padding-right:70px">${
        [...'cloudfire'].map(ch => `<span class="lm" style="display:inline-block;overflow:hidden;vertical-align:top;padding:0 .02em .08em"><span class="li" style="display:inline-block">${ch}</span></span>`).join('')}<span class="pdot" style="opacity:0">.</span></div>
      <div class="desc" style="display:flex;align-items:center;gap:30px;margin-left:10px;font:400 44px/1 'IBM Plex Mono';letter-spacing:.24em;color:#b8b7b3">
        <span class="rule" style="display:block;height:3px;width:0;background:${HEX.accent}"></span><span class="dtext">IT SERVICES</span></div>
    </div>`;
  const tag = el('div', { position: 'absolute', top: V.vertical ? '2330px' : '1230px', left: 0, width: '100%', textAlign: 'center',
    font: "500 124px/1.1 'Instrument Sans'", letterSpacing: '-.045em' });
  tag.innerHTML = `<div class="tl" style="overflow:hidden;padding-bottom:.08em"><div class="ti" style="color:${HEX.fg}">Products that ship.</div></div>
    <div class="tl" style="overflow:hidden;padding-bottom:.08em"><div class="ti" style="color:${HEX.muted}">Systems that last<span style="color:${HEX.accent}">.</span></div></div>`;
  const url = el('div', { position: 'absolute', top: V.vertical ? '3050px' : '1745px', left: 0, width: '100%', textAlign: 'center', font: "400 46px/1 'IBM Plex Mono'",
    letterSpacing: '.16em', color: HEX.muted, opacity: 0 }, 'cloudfireitservices.com');
  root.append(lock, tag, url);
  // the travelling dot (S14 → period) and the surface line
  const line = el('div', { position: 'absolute', height: '3px', background: 'linear-gradient(90deg, transparent, rgba(244,243,239,.32) 18%, rgba(244,243,239,.32) 82%, transparent)' });
  const dot = el('div', { position: 'absolute', background: HEX.accent });
  const placed = el('div', { position: 'absolute', font: "600 80px/1 'Instrument Sans'", letterSpacing: '-.025em', color: HEX.fg, whiteSpace: 'nowrap', opacity: 0 }, 'Order placed');
  const glow = el('div', { position: 'absolute', width: '14000px', height: '2600px', background: 'radial-gradient(closest-side, rgba(255,240,222,.10), rgba(255,240,222,.03) 55%, transparent 100%)' });
  root.append(glow, line, placed, dot);
  return { root, lock, tag, url, line, dot, placed, glow, FS };
}

function measurePeriod(L) {
  // Ink box of the "." glyph in the wordmark, in stage coordinates, at scale 1 with no transforms.
  const wm = L.root.querySelector('.wm'), pd = L.root.querySelector('.pdot');
  const range = document.createRange(); range.selectNodeContents(pd);
  const rect = range.getBoundingClientRect(), base = W.overlayRect;
  const ctx = document.createElement('canvas').getContext('2d'); ctx.font = `600 ${L.FS}px "Instrument Sans"`;
  const m = ctx.measureText('.');
  // rects are in device px (the overlay is scaled by S.scale); convert to stage px before using font metrics
  const lineTop = (rect.top - base.top) / S.scale, lineH = rect.height / S.scale;
  const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
  const baseline = lineTop + (lineH - (asc + desc)) / 2 + asc;
  const x0 = (rect.left - base.left) / S.scale;
  return { x: x0 - m.actualBoundingBoxLeft, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
    top: baseline - m.actualBoundingBoxAscent, h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, baseline };
}

seq.init = async (stage) => {
  S = stage; seq.layer = stage.layer();
  cam = new THREE.PerspectiveCamera(30, stage.W / stage.H, 10, 200000);
  bg = new THREE.Scene(); fg = new THREE.Scene(); bg.fog = new THREE.Fog(0x000000, 4000, 22000);
  buildPlane(bg);
  W.dot3 = glowSprite(C.accent, 300, 1); fg.add(W.dot3);
  W.L = lockupDOM(); seq.layer.overlay.appendChild(W.L.root);
  // measure with the layer visible but transparent
  seq.layer.overlay.style.display = ''; seq.layer.overlay.style.opacity = 0;
  W.overlayRect = seq.layer.overlay.getBoundingClientRect();
  W.P = measurePeriod(W.L);
  seq.layer.overlay.style.display = 'none'; seq.layer.overlay.style.opacity = 1;
  W.marks = { stroke: W.L.root.querySelector('.cloudStroke'), fill: W.L.root.querySelector('.cloudFill'), rise: W.L.root.querySelector('.riseRect'),
    core: W.L.root.querySelector('.core'), rule: W.L.root.querySelector('.rule'), dtext: W.L.root.querySelector('.dtext'),
    letters: [...W.L.root.querySelectorAll('.li')], tl: [...W.L.root.querySelectorAll('.ti')] };
};

seq.render = (f) => {
  const L = W.L, P = W.P, m = W.marks;
  // ----- S13: the camera lowers to the plane's own level, so the whole world becomes one line -----
  const t = E.soft(range(f, 1200, 1306));
  const camY = lerp(3400, 0.6, t), camZ = lerp(5600, 7200, t);
  cam.position.set(lerp(-500, 0, t), camY, camZ); cam.up.set(0, 1, 0);
  cam.lookAt(lerp(200, 0, t), lerp(-900, 0, t), lerp(-3000, -6000, t)); cam.fov = vfov(lerp(36, 30, t), .62); cam.updateProjectionMatrix();
  const retract = E.inOut(range(f, 1210, 1290));
  W.threads.geometry.setPositions(W.threadData.flatMap(([x, z, h]) => [x, 0, z, x, h * (1 - retract), z]));
  W.threads.material.opacity = .16 * (1 - retract);
  const fadeWorld = 1 - E.inOut(range(f, 1270, 1316));
  W.flat.material.opacity = .3 * fadeWorld; W.soft.material.opacity = .26 * fadeWorld;
  W.routes.material.opacity = .9 * fadeWorld; W.routesGlow.material.opacity = .14 * fadeWorld;
  W.horizon.material.opacity = .32 * E.inOut(range(f, 1250, 1300));
  W.dot3.position.set(0, 0, 0); W.dot3.material.opacity = E.out(range(f, 1236, 1270)); W.dot3.scale.setScalar(lerp(380, 300, t));
  const threeOn = f < 1320;

  // ----- S14–S15: 2D lockup layer with a virtual camera (zoom Z around an anchor) -----
  const overlayOn = f >= 1316;
  L.root.style.display = overlayOn ? '' : 'none';
  const pc = [P.x + P.w / 2, P.top + P.h / 2];       // period centre in lockup space
  const zoomOut = E.inOut(range(f, 1384, 1452));
  const Z0 = 150 / P.w;                              // dot ≈ 150 px on screen at the start, as in S01
  const Z = lerp(Z0 * (1 + .08 * E.soft(range(f, 1300, 1386))), 1, zoomOut);   // a slow living push on the dot before the pull-back
  const ax = lerp(STAGE_W / 2, pc[0], zoomOut), ay = lerp(STAGE_H / 2, pc[1], zoomOut);
  const k = lerp(1, 1.018, E.soft(range(f, 1452, 1560)));            // slow push about frame centre during the hold
  const tx = (STAGE_W / 2) * (1 - k) + k * (ax - pc[0] * Z), ty = (STAGE_H / 2) * (1 - k) + k * (ay - pc[1] * Z);
  L.root.style.transform = `translate(${tx}px, ${ty}px) scale(${k * Z})`;
  // dot: a circle (from S01) that settles into the square period glyph
  const sq = E.inOut(range(f, 1386, 1404));
  const d = lerp(P.w * .78, P.w, sq), dh = lerp(P.w * .78, P.h, sq);
  const pulse = 1 + Math.max(0, Math.sin(range(f, 1324, 1346) * Math.PI)) * .18;
  Object.assign(L.dot.style, { left: `${pc[0] - d * pulse / 2}px`, top: `${pc[1] - dh * pulse / 2}px`, width: `${d * pulse}px`, height: `${dh * pulse}px`,
    borderRadius: `${lerp(50, 4, sq)}%`, boxShadow: `0 0 ${lerp(40, 0, sq)}px ${lerp(10, 0, sq)}px rgba(255,90,54,${lerp(.55, 0, sq)})` });
  // surface line through the dot, fading as the words arrive
  const lineW = 9000;
  Object.assign(L.line.style, { left: `${pc[0] - lineW / 2}px`, width: `${lineW}px`, top: `${pc[1] - 1.5 / Z}px`, height: `${3 / Z}px`,
    opacity: 1 - E.inOut(range(f, 1386, 1410)) });
  L.glow.style.top = `${pc[1] - 1300}px`; L.glow.style.left = `${pc[0] - 7000}px`;
  L.glow.style.clipPath = `inset(0 0 50% 0)`; L.glow.style.opacity = (1 - E.inOut(range(f, 1390, 1430))) * .9;
  // the faint memory of "Order placed" beside the dot
  const pfs = (V.vertical ? 150 : 300) / Z0;  // ≈ the S01 type size on screen (smaller in 9:16 so it stays in frame)
  Object.assign(L.placed.style, { left: `${pc[0] + 120 / Z0}px`, top: `${pc[1] - pfs * .53}px`, fontSize: `${pfs}px`,
    opacity: E.out(range(f, 1326, 1342)) * (1 - E.inOut(range(f, 1352, 1374))) * .42 });
  // wordmark letters rise right-to-left from the dot
  m.letters.forEach((li, i) => { const k = m.letters.length - 1 - i; const u = E.out(range(f, 1392 + k * 2, 1408 + k * 2));
    li.style.transform = `translateY(${(1 - u) * 105}%)`; });
  // the mark: outline draws, fills, the flame rises
  m.stroke.setAttribute('stroke-dashoffset', String(1 - E.inOut(range(f, 1398, 1426))));
  m.stroke.style.opacity = 1 - range(f, 1426, 1436);
  m.fill.setAttribute('opacity', String(E.out(range(f, 1418, 1432))));
  m.rise.setAttribute('y', String(lerp(64, 0, E.out(range(f, 1422, 1440)))));
  m.core.setAttribute('opacity', String(E.out(range(f, 1432, 1442))));
  m.rule.style.width = `${80 * E.out(range(f, 1430, 1446))}px`;
  m.dtext.style.opacity = E.out(range(f, 1434, 1448));
  m.tl.forEach((ti, i) => { const u = E.out(range(f, 1442 + i * 3, 1464 + i * 3)); ti.style.transform = `translateY(${(1 - u) * 110}%)`; });
  L.url.style.opacity = E.out(range(f, 1462, 1478));
  return { bg: threeOn ? bg : null, fg: threeOn ? fg : null, camera: cam, fade: E.inOut(range(f, 1530, 1560)) };
};

export default seq;
