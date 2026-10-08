// Shared compositor primitives. Everything is a pure function of the frame number: no accumulated state,
// no wall-clock time, no Math.random (seeded generators only), so any frame can be rendered alone.
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export { THREE, CSS3DObject };
export const FPS = 24;
export let STAGE_W = 3840, STAGE_H = 2160;
// Vertical (9:16) edition: the same world, recomposed shot by shot (see V.vertical branches in each sequence).
export const V = { vertical: false };
export function setStage(w, h) { STAGE_W = w; STAGE_H = h; V.vertical = h > w; }
// Horizontal coverage relative to the 16:9 master, used by sequences to widen the vertical field of view.
export function vfov(fov16x9, coverage = 0.62) {
  if (!V.vertical) return fov16x9;
  const h = 2 * Math.atan(Math.tan(fov16x9 * Math.PI / 360) * 16 / 9);          // horizontal fov of the master
  return 2 * Math.atan(Math.tan(h * coverage / 2) * STAGE_H / STAGE_W) * 180 / Math.PI;
}
export const C = { bg: 0x0a0a0a, surface: 0x111111, fg: 0xf4f3ef, muted: 0x979797, accent: 0xff5a36, warm: 0xff9d42 };
export const HEX = { bg: '#0a0a0a', surface: '#111111', fg: '#f4f3ef', muted: '#979797', dim: '#6b6b6b', accent: '#ff5a36', warm: '#ff9d42' };

// ---------- timing ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (f, a, b) => clamp((f - a) / (b - a));
export const smooth = t => t * t * (3 - 2 * t);
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t, dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-6) break; t -= e / (dx(t) || 1e-6); }
    return sy(clamp(t));
  };
}
export const E = {
  out: bezier(.23, 1, .32, 1),        // site --ease-out
  inOut: bezier(.77, 0, .175, 1),     // site --ease-in-out
  soft: bezier(.45, 0, .2, 1),        // camera: gentle start, long settle
  in: bezier(.55, 0, .9, .6),
  linear: t => t,
};
// Keyframes: [[frame, value, easeIntoThisKey?], ...]; values may be numbers or arrays.
export function key(f, keys) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    if (f <= f1) {
      const [f0, v0] = keys[i - 1];
      const t = (e || E.inOut)((f - f0) / (f1 - f0));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], t)) : lerp(v0, v1, t);
    }
  }
  return keys[keys.length - 1][1];
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// Smooth deterministic noise in [-1, 1] for drift.
export function drift(f, seed = 1, speed = 0.02) {
  const t = f * speed + seed * 17.13;
  return (Math.sin(t) * 0.6 + Math.sin(t * 2.31 + 1.7) * 0.3 + Math.sin(t * 5.17 + 4.1) * 0.1);
}

// ---------- stage ----------
export class Stage {
  constructor(root, scale) {
    this.scale = scale; this.W = Math.round(STAGE_W * scale); this.H = Math.round(STAGE_H * scale);
    this.w = STAGE_W; this.h = STAGE_H;
    const mk = (z, alpha) => { const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha });
      r.setPixelRatio(1); r.setSize(this.W, this.H); r.setClearColor(alpha ? 0x000000 : 0x0a0a0a, alpha ? 0 : 1); r.outputColorSpace = THREE.SRGBColorSpace;
      Object.assign(r.domElement.style, { position: 'absolute', left: 0, top: 0, zIndex: z }); root.appendChild(r.domElement); return r; };
    this.bg = mk(1, false);
    this.cssHost = document.createElement('div');
    Object.assign(this.cssHost.style, { position: 'absolute', left: 0, top: 0, width: this.W + 'px', height: this.H + 'px', zIndex: 2, overflow: 'hidden' });
    root.appendChild(this.cssHost);
    this.fg = mk(3, true);
    this.overlayHost = document.createElement('div');
    Object.assign(this.overlayHost.style, { position: 'absolute', left: 0, top: 0, width: STAGE_W + 'px', height: STAGE_H + 'px', zIndex: 4,
      transform: `scale(${scale})`, transformOrigin: '0 0', pointerEvents: 'none' });
    root.appendChild(this.overlayHost);
    this.fade = document.createElement('div');
    Object.assign(this.fade.style, { position: 'absolute', inset: 0, background: '#000', zIndex: 9, opacity: 0 });
    root.appendChild(this.fade);
  }
  // Each shot gets its own CSS3D renderer + overlay layer so switching shots never leaves stale DOM behind.
  layer() {
    const css = new CSS3DRenderer(); css.setSize(this.W, this.H);
    Object.assign(css.domElement.style, { position: 'absolute', left: 0, top: 0, display: 'none' });
    this.cssHost.appendChild(css.domElement);
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'absolute', inset: 0, display: 'none' });
    this.overlayHost.appendChild(overlay);
    return { css, overlay };
  }
  px(v) { return v * this.scale; } // stage pixels → device pixels (line widths)
}

// ---------- geometry helpers ----------
export function lineMat(stage, { color = C.fg, width = 2, opacity = 1, additive = true, dashed = false, dash = 12, gap = 10 } = {}) {
  const m = new LineMaterial({ color, linewidth: stage.px(width), transparent: true, opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, dashed, dashSize: dash, gapSize: gap, worldUnits: false });
  m.resolution.set(stage.W, stage.H);
  return m;
}
export function segments(positions, material) {
  const g = new LineSegmentsGeometry(); g.setPositions(positions);
  const l = new LineSegments2(g, material); if (material.dashed) l.computeLineDistances(); return l;
}
// Polyline points [[x,y,z],...] → segment pairs; `t` (0..1) reveals the path progressively by length.
export function polySegments(pts, t = 1) {
  const lens = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); lens.push(d); total += d; }
  let remain = total * clamp(t); const out = [];
  for (let i = 1; i < pts.length && remain > 0; i++) {
    const a = pts[i - 1], b = pts[i], k = Math.min(1, remain / (lens[i - 1] || 1));
    out.push(...a, a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
    remain -= lens[i - 1];
  }
  if (!out.length) out.push(...pts[0], ...pts[0]);
  return out;
}
export function pointAlong(pts, t) {
  const lens = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); lens.push(d); total += d; }
  let remain = total * clamp(t);
  for (let i = 1; i < pts.length; i++) {
    if (remain <= lens[i - 1]) { const k = remain / (lens[i - 1] || 1); const a = pts[i - 1], b = pts[i];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
    remain -= lens[i - 1];
  }
  return pts[pts.length - 1].slice();
}
// Rounded rectangle outline in a plane. axis 'xz' lies flat (y up), 'xy' faces +z.
export function roundRect(cx, cy, cz, w, h, r = 14, axis = 'xz', steps = 5) {
  const pts = [], hw = w / 2, hh = h / 2;
  const corners = [[hw - r, hh - r, 0], [-hw + r, hh - r, Math.PI / 2], [-hw + r, -hh + r, Math.PI], [hw - r, -hh + r, Math.PI * 1.5]];
  for (const [x, y, a0] of corners) for (let i = 0; i <= steps; i++) { const a = a0 + (i / steps) * Math.PI / 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  pts.push(pts[0]);
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    if (axis === 'xz') out.push(cx + a[0], cy, cz - a[1], cx + b[0], cy, cz - b[1]);
    else out.push(cx + a[0], cy + a[1], cz, cx + b[0], cy + b[1], cz);
  }
  return out;
}
let _glowTex;
export function glowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.08, 'rgba(255,255,255,.95)'); grd.addColorStop(0.16, 'rgba(255,255,255,.35)');
  grd.addColorStop(0.4, 'rgba(255,255,255,.08)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  _glowTex = new THREE.CanvasTexture(c); _glowTex.colorSpace = THREE.SRGBColorSpace; return _glowTex;
}
export function glowSprite(color = C.accent, size = 60, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); return s;
}
export function plane(w, h, color, opacity = 1, additive = false) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }));
  return m;
}

// ---------- DOM helpers ----------
export function el(tag, style = {}, html = '') {
  const e = document.createElement(tag); Object.assign(e.style, style); if (html) e.innerHTML = html; return e;
}
export function css3d(element, { x = 0, y = 0, z = 0, flat = false, rx = 0, ry = 0, rz = 0 } = {}) {
  const o = new CSS3DObject(element); o.position.set(x, y, z);
  o.rotation.set(flat ? -Math.PI / 2 + rx : rx, ry, rz); return o;
}
// Screen-space depth of field for CSS3D objects: blur so that the on-screen radius matches a thin-lens estimate.
export function dofBlur(stage, camera, obj, focusDist, strength = 1, maxPx = 40) {
  const p = new THREE.Vector3(); obj.getWorldPosition(p);
  const d = p.distanceTo(camera.position);
  const coc = Math.abs(1 / d - 1 / focusDist) * focusDist * 18 * strength; // stage px of blur on screen
  const screenPerUnit = (STAGE_H / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / d;
  const local = Math.min(maxPx, coc) / Math.max(1e-3, screenPerUnit * Math.abs(obj.scale.x || 1));
  obj.element.style.filter = local > 0.25 ? `blur(${local.toFixed(2)}px)` : 'none';
  return coc;
}
export function eyebrow(text, accentIndex = true) {
  const [num, label] = text.split(' · ');
  return el('div', { position: 'absolute', display: 'flex', alignItems: 'center', gap: '28px', font: '400 34px/1 "IBM Plex Mono"',
    letterSpacing: '.14em', color: HEX.muted, whiteSpace: 'nowrap' },
    `<span style="width:56px;height:2px;background:${HEX.accent};display:block"></span>${accentIndex && label ? `<span style="color:${HEX.accent}">${num}</span><span>·</span><span>${label}</span>` : text}`);
}
export function setOpacity(objOrEl, o) {
  const e = objOrEl.element || objOrEl; if (e.style) e.style.opacity = o; else if (objOrEl.material) objOrEl.material.opacity = o;
}
