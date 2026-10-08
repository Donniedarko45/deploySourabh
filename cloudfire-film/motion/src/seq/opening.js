// S01–S06 (frames 0–420): the press, the layers part, the dive, the world beneath, the pipeline, the worst day.
import { THREE, C, HEX, E, key, range, clamp, lerp, rng, drift, el, css3d, dofBlur, lineMat, segments, polySegments,
  pointAlong, roundRect, glowSprite, STAGE_H } from '../core.js';

const DOT = [-250, 0, 170];          // the status dot on the card (world)
const LAYER_GAP = 330;
const LAYERS = ['LAYOUT', 'REQUEST', 'SERVICES', 'DATA', 'INFRASTRUCTURE'];
const CEIL_Y = -LAYER_GAP * 5 - 90;  // underside of the stack, the "ceiling of light"
const FIELD_Y = -6000;
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

const seq = { start: 0, end: 420 };
let S, cam, cssA, bgA, fgA, cssB, bgB, fgB, cssC, bgC, fgC;
const A = {}; // handles

function cardDOM() {
  const mono = (t, extra = '') => `<span style="font:400 30px/1 'IBM Plex Mono';letter-spacing:.14em;color:${HEX.muted};${extra}">${t}</span>`;
  const row = (w, h, html, style = {}) => el('div', { width: w + 'px', height: h + 'px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', ...style }, html);
  const plate = el('div', { width: '1600px', height: '1000px', background: '#111', border: '2px solid rgba(255,255,255,.11)',
    borderRadius: '12px', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.05)' });
  const rows = [
    [row(1440, 60, `<span style="display:flex;align-items:center;gap:22px">${'<span style="width:46px;height:2px;background:' + HEX.accent + ';display:block"></span>'}${mono('ORDER SUMMARY')}</span>${mono('2 ITEMS')}`), -405],
    [row(1440, 80, `<span style="font:500 50px/1 Inter;color:${HEX.fg};letter-spacing:-.01em">Linen notebook, A5</span>${mono('× 1', 'font-size:34px')}`), -295],
    [row(1440, 80, `<span style="font:500 50px/1 Inter;color:${HEX.fg};letter-spacing:-.01em">Brass fountain pen</span>${mono('× 1', 'font-size:34px')}`), -195],
    [el('div', { width: '1440px', height: '2px', background: 'rgba(255,255,255,.1)' }), -122],
    [row(1440, 70, `<span style="font:400 42px/1 Inter;color:${HEX.muted}">Arrives</span><span style="font:500 42px/1 Inter;color:${HEX.fg}">Thursday, before noon</span>`), -55],
    [row(1440, 60, `<span style="font:400 34px/1 Inter;color:#7d7d7d;width:100%;text-align:center">You won’t be charged until it ships.</span>`), 395],
  ];
  // The button carries three states: label → spinner → "Order placed" with the dot.
  const btn = el('div', { position: 'relative', width: '1440px', height: '210px', background: HEX.fg, overflow: 'hidden' });
  btn.innerHTML = `
    <div class="bg2" style="position:absolute;inset:0;background:#141414;border:2px solid rgba(255,255,255,.14);opacity:0"></div>
    <div class="label" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:40px;font:600 80px/1 'Instrument Sans';letter-spacing:-.025em;color:#0a0a0a">
      Place order<svg width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
    <svg class="spin" style="position:absolute;left:670px;top:55px;opacity:0" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(10,10,10,.12)" stroke-width="7"/>
      <circle class="arc" cx="50" cy="50" r="34" fill="none" stroke="${HEX.accent}" stroke-width="7" stroke-linecap="round" stroke-dasharray="70 300"/></svg>
    <div class="placed" style="position:absolute;left:520px;top:0;height:210px;display:flex;align-items:center;font:600 80px/1 'Instrument Sans';letter-spacing:-.025em;color:${HEX.fg};opacity:0">Order placed</div>
    <div class="sheen" style="position:absolute;inset:-20px;background:linear-gradient(100deg,transparent 42%,rgba(255,255,255,.55) 50%,transparent 58%);mix-blend-mode:soft-light;background-size:300% 100%"></div>`;
  return { plate, rows, btn };
}

function layerDOM(i) {
  const name = LAYERS[i];
  const d = el('div', { width: '1600px', height: '1000px', position: 'relative', border: '3px solid rgba(255,255,255,.16)', borderRadius: '12px',
    background: 'radial-gradient(rgba(255,255,255,.09) 2px, transparent 2.2px) 0 0/48px 48px, rgba(16,16,16,.86)' });
  d.innerHTML = `<div style="position:absolute;left:40px;bottom:-92px;display:flex;gap:22px;font:400 46px/1 'IBM Plex Mono';letter-spacing:.14em;color:${HEX.muted}">
    <span style="color:${HEX.accent}">0${i + 1}</span><span>${name}</span></div>`;
  const box = (x, y, w, h, html = '', s = '') => `<div style="position:absolute;left:${800 + x - w / 2}px;top:${500 + y - h / 2}px;width:${w}px;height:${h}px;${s}">${html}</div>`;
  const node = (x, y, label, primary) => box(x, y, 400, 130, `<div style="height:100%;display:flex;align-items:center;gap:26px;padding:0 34px;font:500 40px/1 'IBM Plex Mono';letter-spacing:.06em;color:${HEX.fg}">
    <span style="width:14px;height:14px;border-radius:50%;background:${primary ? HEX.accent : '#3a3a3a'}"></span>${label}</div>`,
    `border:2px solid ${primary ? 'rgba(255,90,54,.85)' : 'rgba(255,255,255,.16)'};border-radius:10px;background:#121212`);
  const wire = (x1, y1, x2, y2) => box((x1 + x2) / 2, (y1 + y2) / 2, Math.max(3, Math.abs(x2 - x1)), Math.max(3, Math.abs(y2 - y1)), '', 'background:rgba(255,255,255,.18)');
  // card-local coords: x right, y = world z (down the card = toward camera)
  if (name === 'LAYOUT') {
    const o = 'border:2px solid rgba(255,90,54,.55)';
    d.innerHTML += box(0, -405, 1440, 60, '', o) + box(0, -295, 1440, 80, '', o) + box(0, -195, 1440, 80, '', o) + box(0, -55, 1440, 70, '', o)
      + box(0, 170, 1440, 210, '', o) + box(0, 395, 1440, 60, '', o)
      + box(-760, 0, 2, 1000, '', 'background:rgba(255,90,54,.35)') + box(760, 0, 2, 1000, '', 'background:rgba(255,90,54,.35)')
      + `<div style="position:absolute;left:1270px;top:592px;font:400 28px/1 'IBM Plex Mono';color:rgba(255,90,54,.8)">48</div>`;
  } else if (name === 'REQUEST') {
    d.innerHTML += `<div style="position:absolute;left:${800 + DOT[0] + 46}px;top:${500 + DOT[2] - 22}px;font:500 44px/1 'IBM Plex Mono';color:${HEX.fg}">POST /orders</div>
      <div style="position:absolute;left:${800 + DOT[0] + 46}px;top:${500 + DOT[2] + 40}px;font:400 30px/1 'IBM Plex Mono';color:${HEX.muted};letter-spacing:.08em">IDEMPOTENCY KEY · SIGNED</div>`;
  } else if (name === 'SERVICES') {
    d.innerHTML += wire(DOT[0], DOT[2], 450, DOT[2]) + wire(DOT[0], DOT[2], DOT[0], -250) + wire(450, DOT[2], 450, -250)
      + node(DOT[0], DOT[2], 'API', true) + node(450, DOT[2], 'ORDERS') + node(DOT[0], -250, 'PAYMENTS') + node(450, -250, 'INVENTORY');
  } else if (name === 'DATA') {
    const rec = (x, y) => box(x, y, 380, 200, Array.from({ length: 5 }, (_, k) => `<div style="height:16px;margin:14px 20px;background:rgba(255,255,255,${0.16 - k * 0.022});width:${88 - (k * 13) % 40}%"></div>`).join(''),
      'border:2px solid rgba(255,255,255,.12);border-radius:10px');
    d.innerHTML += rec(DOT[0], DOT[2]) + rec(450, DOT[2]) + rec(DOT[0], -250) + rec(450, -250);
  } else {
    let cells = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) cells += box(-620 + c * 155, -240 + r * 150, 110, 100, '', 'border:2px solid rgba(255,255,255,.1);border-radius:6px');
    d.style.background = 'linear-gradient(rgba(255,255,255,.045) 2px,transparent 2px) 0 0/80px 80px,linear-gradient(90deg,rgba(255,255,255,.045) 2px,transparent 2px) 0 0/80px 80px, rgba(14,14,14,.9)';
    d.innerHTML += cells;
  }
  return d;
}

function ceilingMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uAmt: { value: 1 } },
    vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uAmt; varying vec3 vW; varying float vD;
      float box(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
      void main(){
        vec2 p = vW.xz - vec2(0.,0.);
        float r = length(p);
        float glow = exp(-r/9000.)*0.32 + exp(-r/2600.)*0.34;
        float card = exp(-max(box(p, vec2(780.,480.), 30.),0.)/260.)*0.55;
        vec2 g = abs(fract(vW.xz/800.)-.5);
        float grid = (1.-smoothstep(0.0,0.012,min(g.x,g.y))) * 0.05;
        float fog = smoothstep(3000., 42000., vD);
        vec3 warm = vec3(1.0,0.93,0.84);
        vec3 col = warm*(glow+grid) + vec3(1.0,0.62,0.38)*card*0.5 + warm*card*0.5;
        gl_FragColor = vec4(col*(1.-fog)*uAmt, 1.);
      }` });
}

function buildField(scene) {
  const r = rng(7), nodes = [], wires = [];
  for (let gx = -11; gx <= 11; gx++) for (let gz = -12; gz <= 6; gz++) {
    if (r() < 0.38 && !(Math.abs(gx) < 2 && Math.abs(gz) < 2)) continue;
    const x = gx * 1500 + (r() - .5) * 500, z = gz * 1300 + (r() - .5) * 400;
    nodes.push([x, z, r() < .5 ? 520 : 400]);
  }
  const pos = [];
  for (const [x, z, w] of nodes) pos.push(...roundRect(x, FIELD_Y, z, w, 150, 16, 'xz'));
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const [x1, z1] = nodes[i], [x2, z2] = nodes[j];
    if (Math.abs(x1 - x2) < 1700 && Math.abs(z1 - z2) < 1500 && r() < 0.45) wires.push(x1, FIELD_Y, z1, x2, FIELD_Y, z1, x2, FIELD_Y, z1, x2, FIELD_Y, z2);
  }
  const mats = [];
  const add = (l, o) => { scene.add(l); mats.push([l.material, o]); return l; };
  add(segments(pos, lineMat(S, { width: 2.2, opacity: .34 })), .34);
  add(segments(wires, lineMat(S, { width: 1.6, opacity: .16 })), .16);
  // threads from the ceiling to the field, with ticks of traffic
  const th = [], ticks = [];
  const r2 = rng(11);
  for (let i = 0; i < 190; i++) {
    const n = nodes[Math.floor(r2() * nodes.length)];
    const x = n[0] + (r2() - .5) * 200, z = n[1] + (r2() - .5) * 60;
    th.push(x, CEIL_Y, z, x, FIELD_Y, z);
    const t = glowSprite(C.fg, 70, .55); scene.add(t);
    ticks.push({ s: t, x, z, phase: r2(), speed: 0.006 + r2() * 0.01 });
  }
  add(segments(th, lineMat(S, { width: 1.6, opacity: .13 })), .13);
  return { nodes, ticks, mats };
}

// Field route the request follows after it lands (x, z on the field plane).
const ROUTE = [[DOT[0], DOT[2]], [DOT[0], -1400], [2100, -1400], [2100, -3000]];
const ROUTE_LABELS = [['EDGE', 0], ['API', 1], ['ORDERS', 2], ['DATA', 3]];

function packetAt(f) {
  if (f < 70) return [...DOT];
  if (f < 104) return [DOT[0], key(f, [[70, 0], [104, CEIL_Y, E.in]]), DOT[2]];
  if (f < 160) return [DOT[0], key(f, [[104, CEIL_Y], [160, FIELD_Y + 4, E.out]]), DOT[2]];
  // move between route points with rests: 22 frames move, 8 rest
  const legs = ROUTE.length - 1, t = f - 160;
  const leg = Math.min(legs - 1, Math.floor(t / 30)), lt = clamp((t - leg * 30) / 22);
  const a = ROUTE[leg], b = ROUTE[leg + 1], k = E.inOut(lt);
  return [lerp(a[0], b[0], k), FIELD_Y + 4, lerp(a[1], b[1], k)];
}
function routeProgress(f) { // 0..legs as fractional
  if (f < 160) return 0;
  const t = f - 160, legs = ROUTE.length - 1, leg = Math.min(legs - 1, Math.floor(t / 30));
  return Math.min(legs, leg + E.inOut(clamp((t - leg * 30) / 22)));
}

function orbit(target, yawDeg, elDeg, dist) {
  const y = THREE.MathUtils.degToRad(yawDeg), e = THREE.MathUtils.degToRad(elDeg);
  return [target[0] + Math.sin(y) * Math.cos(e) * dist, target[1] + Math.sin(e) * dist, target[2] + Math.cos(y) * Math.cos(e) * dist];
}
function rigA(f) { const t = [4 + drift(f, 1, .03) * 6, 0, DOT[2] - 10];
  return { pos: orbit(t, key(f, [[0, 1.2], [48, -0.6, E.linear]]), key(f, [[0, 41], [48, 38, E.linear]]), key(f, [[0, 1300], [48, 1190, E.out]])), target: t, fov: 20 }; }
function rigB(f) { const t = [0, -860, 40]; return { pos: orbit(t, key(f, [[48, 28], [104, 38]]), 30, key(f, [[48, 4500], [104, 4150]])), target: t, fov: 27 }; }
function rigC(f) { const p = packetAt(f); const h = key(f, [[84, 1100], [104, 380, E.in]]);
  return { pos: [p[0] + 40, p[1] + h, p[2] + 260], target: [p[0], p[1] - 600, p[2] - 60], fov: 36 }; }
function rigD(f) {
  return { pos: key(f, [[110, [-250, CEIL_Y - 520, 520]], [124, [-200, -2600, 1300], E.out], [205, [2600, -3650, 9200], E.soft], [270, [-900, -4100, 7400], E.soft]]),
    target: key(f, [[110, [-250, FIELD_Y, -900]], [124, [-200, FIELD_Y, -1600], E.out], [205, [300, -4500, 0], E.soft], [270, [200, -5200, -900], E.soft]]),
    fov: key(f, [[110, 36], [205, 31], [270, 30]]) };
}
function blend(a, b, t) { return { pos: a.pos.map((x, i) => lerp(x, b.pos[i], t)), target: a.target.map((x, i) => lerp(x, b.target[i], t)), fov: lerp(a.fov, b.fov, t) }; }
function cameraA(f) {
  let r = rigA(f);
  if (f >= 46) r = blend(r, rigB(f), E.inOut(range(f, 46, 86)));
  if (f >= 84) r = blend(r, rigC(f), E.in(range(f, 84, 104)));
  if (f >= 102) r = blend(r, rigD(f), E.out(range(f, 102, 124)));
  return r;
}

// ---------- S05 pipeline ----------
const GATES = [-1100, 0, 1100], GATE_NAMES = ['VALIDATE', 'ENRICH', 'STORE'], PV = 61, OURS = 3;
const packX = (i, f) => -2198 + (OURS - i) * 600 + (f - 270) * PV;

// ---------- S06 mesh ----------
const MESH = { cols: 7, rows: 5, dx: 1000, dz: 760 };
const meshPos = (c, r) => [(c - 3) * MESH.dx, 0, (r - 2) * MESH.dz];
const ROUTE1 = [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2]];
const ROUTE2 = [[0, 2], [1, 2], [2, 2], [2, 1], [3, 1], [4, 1], [4, 2], [5, 2], [6, 2]];

seq.init = async (stage) => {
  S = stage; seq.layer = stage.layer();
  cam = new THREE.PerspectiveCamera(20, stage.W / stage.H, 10, 200000);
  // ----- set A: card stack + beneath -----
  bgA = new THREE.Scene(); fgA = new THREE.Scene(); cssA = new THREE.Scene();
  bgA.fog = new THREE.Fog(0x000000, 5000, 38000);
  const { plate, rows, btn } = cardDOM();
  A.plate = css3d(plate, { flat: true, x: 0, y: 0, z: 0 }); cssA.add(A.plate);
  A.rows = rows.map(([e, z]) => { const o = css3d(e, { flat: true, y: 2, z }); cssA.add(o); return o; });
  A.btn = css3d(btn, { flat: true, y: 2, z: DOT[2] }); cssA.add(A.btn);
  A.btnEl = { bg2: btn.querySelector('.bg2'), label: btn.querySelector('.label'), spin: btn.querySelector('.spin'), arc: btn.querySelector('.arc'),
    placed: btn.querySelector('.placed'), sheen: btn.querySelector('.sheen') };
  const dotWrap = el('div', { width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
  A.dotEl = el('div', { width: '30px', height: '30px', borderRadius: '50%', background: HEX.accent, boxShadow: `0 0 18px 4px rgba(255,90,54,.55)` });
  dotWrap.appendChild(A.dotEl);
  A.dot = css3d(dotWrap, { flat: true, x: DOT[0], y: 3, z: DOT[2] }); cssA.add(A.dot);
  // a grazing light that travels across the card surface
  const sheenWrap = el('div', { width: '1600px', height: '1000px', overflow: 'hidden', borderRadius: '12px' });
  A.sheenEl = el('div', { position: 'absolute', inset: '0', background: 'linear-gradient(97deg, transparent 38%, rgba(255,246,232,.10) 47%, rgba(255,246,232,.16) 50%, rgba(255,246,232,.10) 53%, transparent 62%)', backgroundSize: '260% 100%' });
  sheenWrap.appendChild(A.sheenEl);
  A.sheen = css3d(sheenWrap, { flat: true, y: 4, z: 0 }); cssA.add(A.sheen);
  A.layers = LAYERS.map((_, i) => { const o = css3d(layerDOM(i), { flat: true, y: -2 }); cssA.add(o); return o; });
  // vertical wire segments between layers, billboarded toward the camera
  A.wires = Array.from({ length: 5 }, () => { const o = css3d(el('div', { width: '4px', height: LAYER_GAP + 'px',
    background: `linear-gradient(${HEX.accent}, rgba(255,90,54,.55))`, boxShadow: '0 0 10px rgba(255,90,54,.6)' })); cssA.add(o); return o; });
  A.packet = glowSprite(C.accent, 260, 1); fgA.add(A.packet);
  A.packetCore = glowSprite(0xfff1e8, 70, 1); fgA.add(A.packetCore);
  A.ceiling = new THREE.Mesh(new THREE.PlaneGeometry(140000, 140000), ceilingMaterial());
  A.ceiling.rotation.x = Math.PI / 2; A.ceiling.position.y = CEIL_Y; bgA.add(A.ceiling);
  A.field = buildField(bgA);
  A.route = segments([0, 0, 0, 0, 0, 0], lineMat(stage, { color: C.accent, width: 4, opacity: 1 })); bgA.add(A.route);
  A.routeGlow = segments([0, 0, 0, 0, 0, 0], lineMat(stage, { color: C.accent, width: 16, opacity: .18 })); bgA.add(A.routeGlow);
  A.fieldLabels = ROUTE_LABELS.map(([t, i]) => {
    const e = el('div', { font: "500 110px/1 'IBM Plex Mono'", letterSpacing: '.08em', color: HEX.fg, whiteSpace: 'nowrap' }, t);
    const o = css3d(e, { flat: true, x: ROUTE[i][0] + 330, y: FIELD_Y + 4, z: ROUTE[i][1] - 120 }); o.userData.stack = false; cssA.add(o); return o;
  });
  A.fieldMarks = ROUTE.map(([x, z]) => { const s = segments(roundRect(x, FIELD_Y + 2, z, 560, 220, 22, 'xz'), lineMat(stage, { color: C.accent, width: 3, opacity: 0 })); bgA.add(s); return s; });

  // ----- set B: pipeline -----
  bgB = new THREE.Scene(); fgB = new THREE.Scene(); cssB = new THREE.Scene();
  bgB.fog = new THREE.Fog(0x000000, 2600, 9000);
  const rails = [];
  for (const z of [-110, 110]) rails.push(-6000, -60, z, 6000, -60, z);
  for (let x = -6000; x <= 6000; x += 300) rails.push(x, -60, -110, x, -60, 110);
  bgB.add(segments(rails, lineMat(stage, { width: 1.6, opacity: .16 })));
  B.gates = GATES.map((gx, i) => {
    const pts = []; const hw = 260, hh = 230;
    for (const [a, b] of [[[-hw, -hh], [hw, -hh]], [[hw, -hh], [hw, hh]], [[hw, hh], [-hw, hh]], [[-hw, hh], [-hw, -hh]]]) pts.push(gx, a[1] + 120, a[0], gx, b[1] + 120, b[0]);
    const g = segments(pts, lineMat(stage, { width: 3, opacity: .45 })); bgB.add(g);
    const glow = segments(pts, lineMat(stage, { color: C.accent, width: 14, opacity: 0 })); bgB.add(glow);
    const label = el('div', { font: "500 44px/1 'IBM Plex Mono'", letterSpacing: '.14em', color: HEX.fg, whiteSpace: 'nowrap' },
      `<span style="color:${HEX.accent}">0${i + 1}</span>&nbsp;&nbsp;${GATE_NAMES[i]}`);
    const lo = css3d(label, { x: gx + 40, y: 470, z: 0 }); cssB.add(lo);
    return { g, glow, x: gx };
  });
  B.points = []; const pr = rng(21);
  for (let i = 0; i < 9; i++) for (let k = 0; k < 6; k++) {
    const s = glowSprite(i === OURS ? C.accent : C.fg, i === OURS ? 120 : 80, 1); bgB.add(s);
    B.points.push({ s, i, k, jx: pr() - .5, jy: pr() - .5, jz: pr() - .5, ph: pr() * 6.28 });
  }
  B.records = segments([0, 0, 0, 0, 0, 0], lineMat(stage, { width: 2.5, opacity: .7 })); bgB.add(B.records);
  B.recordsOurs = segments([0, 0, 0, 0, 0, 0], lineMat(stage, { color: C.accent, width: 3.5, opacity: 1 })); bgB.add(B.recordsOurs);

  // ----- set C: mesh -----
  bgC = new THREE.Scene(); fgC = new THREE.Scene(); cssC = new THREE.Scene();
  const nodes = [], wires = [];
  for (let c = 0; c < MESH.cols; c++) for (let r = 0; r < MESH.rows; r++) {
    const [x, , z] = meshPos(c, r); if (c === 3 && r === 2) continue;
    nodes.push(...roundRect(x, 0, z, 380, 220, 18, 'xz'));
    if (c < MESH.cols - 1) wires.push(x + 190, 0, z, x + MESH.dx - 190, 0, z);
    if (r < MESH.rows - 1) wires.push(x, 0, z + 110, x, 0, z + MESH.dz - 110);
  }
  C3.nodes = segments(nodes, lineMat(stage, { width: 2.4, opacity: .38 })); bgC.add(C3.nodes);
  C3.wires = segments(wires, lineMat(stage, { width: 1.8, opacity: .2 })); bgC.add(C3.wires);
  const [fx, , fz] = meshPos(3, 2);
  C3.failed = segments(roundRect(fx, 0, fz, 380, 220, 18, 'xz'), lineMat(stage, { width: 2.4, opacity: .38 })); bgC.add(C3.failed);
  C3.failedDash = segments(roundRect(fx, 0, fz, 380, 220, 18, 'xz', 8), lineMat(stage, { width: 2.4, opacity: 0, dashed: true, dash: 16, gap: 14 })); bgC.add(C3.failedDash);
  C3.r1 = segments([0, 0, 0, 0, 0, 0], lineMat(stage, { color: C.accent, width: 4.5 })); bgC.add(C3.r1);
  C3.r2 = segments([0, 0, 0, 0, 0, 0], lineMat(stage, { color: C.accent, width: 4.5 })); bgC.add(C3.r2);
  C3.glow = segments([0, 0, 0, 0, 0, 0], lineMat(stage, { color: C.accent, width: 18, opacity: .16 })); bgC.add(C3.glow);
  C3.packet = glowSprite(C.accent, 240, 1); fgC.add(C3.packet);
  C3.offline = el('div', { font: "500 40px/1 'IBM Plex Mono'", letterSpacing: '.14em', color: HEX.muted, opacity: 0, whiteSpace: 'nowrap' }, 'OFFLINE');
  const off = css3d(C3.offline, { flat: true, x: fx, y: 2, z: fz + 2 }); cssC.add(off);
};
const B = {}, C3 = {};

function routePts(route) { return route.map(([c, r]) => meshPos(c, r)); }

seq.render = (f) => {
  if (f < 270) return renderA(f);
  if (f < 345) return renderB(f);
  return renderC(f);
};

function applyCam(r) {
  cam.fov = r.fov; cam.position.set(...r.pos); cam.up.set(0, 1, 0); cam.lookAt(...r.target); cam.updateProjectionMatrix();
}

function renderA(f) {
  const r = cameraA(f); applyCam(r);
  // --- button micro-interaction (S01) ---
  const press = f < 8 ? 1 : f < 12 ? lerp(1, .97, E.out(range(f, 8, 12))) : lerp(.97, 1, E.out(range(f, 12, 18)));
  A.btn.scale.set(press, press, press);
  const b = A.btnEl;
  b.label.style.opacity = 1 - range(f, 12, 16);
  b.spin.style.opacity = range(f, 14, 17) * (1 - range(f, 30, 34));
  b.arc.style.strokeDashoffset = -(f - 14) * 16;
  b.spin.style.transform = `translateX(${-E.inOut(range(f, 23, 32)) * 250}px) scale(${1 - E.inOut(range(f, 25, 33)) * .7})`;
  b.bg2.style.opacity = E.inOut(range(f, 18, 30));
  b.placed.style.opacity = E.out(range(f, 32, 42));
  b.placed.style.transform = `translateX(${(1 - E.out(range(f, 32, 44))) * 24}px)`;
  b.sheen.style.backgroundPosition = `${lerp(110, -20, range(f, 0, 48))}% 0`;
  const dotOn = E.out(range(f, 31, 37));
  A.dot.element.style.opacity = dotOn;
  A.dotEl.style.transform = `scale(${0.3 + dotOn * 0.7 + Math.max(0, Math.sin(range(f, 33, 45) * Math.PI)) * .25})`;
  // --- layers part (S02) ---
  A.layers.forEach((o, i) => {
    const t = E.inOut(range(f, 52 + i * 4, 82 + i * 4));
    o.position.y = -LAYER_GAP * (i + 1) * t - 2;
    o.element.style.opacity = t;
  });
  // wires reveal as the packet passes, from the dot downward
  const p = packetAt(f);
  A.wires.forEach((o, i) => {
    const top = -LAYER_GAP * i, bot = -LAYER_GAP * (i + 1);
    const shown = clamp((top - p[1]) / LAYER_GAP);
    o.position.set(DOT[0], top - (LAYER_GAP * shown) / 2, DOT[2]);
    o.scale.set(1, Math.max(1e-3, shown), 1);
    o.rotation.set(0, Math.atan2(cam.position.x - DOT[0], cam.position.z - DOT[2]), 0);
    o.element.style.opacity = f > 70 ? 1 : 0;
  });
  // stack disappears once we are beneath its floor; the ceiling of light takes over
  const below = range(cam.position.y, CEIL_Y + 120, CEIL_Y - 280);
  const stackVis = 1 - below;
  [A.plate, ...A.rows, A.btn, A.dot, ...A.layers, ...A.wires].forEach(o => { o.visible = stackVis > 0.01; });
  cssA.children.forEach(o => { if (o.userData.stack !== false) o.element.style.visibility = stackVis > .01 ? 'visible' : 'hidden'; });
  A.ceiling.material.uniforms.uAmt.value = below;
  // depth of field on the card (macro section)
  const focus = cam.position.distanceTo(v3(r.target));
  const dofAmt = 1 - range(f, 44, 60);
  [A.plate, ...A.rows, A.btn].forEach(o => dofBlur(S, cam, o, focus, 4.5 * dofAmt, 34));
  A.sheenEl.style.backgroundPosition = `${lerp(120, -30, E.inOut(range(f, 2, 70)))}% 0`;
  A.sheen.element.style.opacity = 1 - range(f, 60, 80);
  A.field.mats.forEach(([m, o]) => { m.opacity = o * below; });
  // packet
  A.packet.visible = A.packetCore.visible = f >= 68;
  A.packet.position.set(...p); A.packetCore.position.set(...p);
  const pulse = 1 + Math.sin(f * .5) * .06;
  A.packet.scale.setScalar((f < 160 ? 220 : 460) * pulse); A.packetCore.scale.setScalar(f < 160 ? 60 : 120);
  A.packet.material.opacity = range(f, 68, 74);
  // field: ticks, route, labels
  for (const t of A.field.ticks) {
    const u = (t.phase + f * t.speed) % 1;
    t.s.position.set(t.x, lerp(CEIL_Y, FIELD_Y, u * u), t.z);
    t.s.material.opacity = .5 * Math.sin(u * Math.PI) * below;
  }
  const rp = routeProgress(f), pts = ROUTE.map(([x, z]) => [x, FIELD_Y + 3, z]);
  const seg = polySegments(pts, rp / (ROUTE.length - 1));
  A.route.geometry.setPositions(seg); A.routeGlow.geometry.setPositions(seg);
  A.route.visible = A.routeGlow.visible = f >= 160;
  ROUTE_LABELS.forEach(([, i], k) => {
    const on = E.out(range(f, 160 + i * 30 - 4, 160 + i * 30 + 10));
    A.fieldLabels[k].element.style.opacity = on * below;
    A.fieldMarks[k].material.opacity = on * .9;
  });
  return { bg: bgA, css: cssA, fg: fgA, camera: cam, fade: 1 - E.out(range(f, 7, 24)) };
}

function renderB(f) {
  const ours = packX(OURS, f);
  const xc = key(f, [[270, -1500], [345, 900, E.linear]]);
  cam.fov = 21; cam.position.set(xc + 900, 380, 2500); cam.up.set(0, 1, 0); cam.lookAt(xc, 60, 0); cam.updateProjectionMatrix();
  const rec = [], recO = [];
  for (const pt of B.points) {
    const x = packX(pt.i, f);
    const tA = range(x, GATES[0] - 80, GATES[0] + 80), tB = range(x, GATES[1] - 80, GATES[1] + 80);
    const loose = 1 - E.inOut(tA);
    const wob = Math.sin(f * .35 + pt.ph);
    const lx = x + (pt.k - 2.5) * 34 * (1 - loose) + pt.jx * 150 * loose + wob * 10 * loose;
    const ly = 120 + pt.jy * 150 * loose;
    const lz = pt.jz * 150 * loose;
    pt.s.position.set(lx, ly, lz);
    pt.s.material.opacity = (1 - E.inOut(tB)) * (pt.i === OURS ? 1 : .55);
    if (tB > 0) { // records: an outlined card with field bars
      const t = E.out(tB), w = 230 * t, h = 120 * t, out = pt.i === OURS ? recO : rec;
      if (pt.k === 0) {
        const cx = x, cy = 120;
        out.push(cx - w / 2, cy - h / 2, 0, cx + w / 2, cy - h / 2, 0, cx + w / 2, cy - h / 2, 0, cx + w / 2, cy + h / 2, 0,
          cx + w / 2, cy + h / 2, 0, cx - w / 2, cy + h / 2, 0, cx - w / 2, cy + h / 2, 0, cx - w / 2, cy - h / 2, 0);
        for (let k = 0; k < 3; k++) { const yy = cy + h / 2 - (k + 1) * h / 4; out.push(cx - w / 2 + 24 * t, yy, 0, cx - w / 2 + (24 + (150 - k * 40)) * t, yy, 0); }
        const stored = E.out(range(x, GATES[2] - 60, GATES[2] + 80));
        if (stored > 0) out.push(cx - w / 2 - 20 * stored, cy - h / 2 - 26 * stored, 0, cx + w / 2 + 20 * stored, cy - h / 2 - 26 * stored, 0);
      }
    }
  }
  B.records.geometry.setPositions(rec.length ? rec : [0, 0, 0, 0, 0, 0]); B.records.visible = rec.length > 0;
  B.recordsOurs.geometry.setPositions(recO.length ? recO : [0, 0, 0, 0, 0, 0]); B.recordsOurs.visible = recO.length > 0;
  B.gates.forEach(g => {
    let flash = 0;
    for (let i = 0; i < 9; i++) { const d = Math.abs(packX(i, f) - g.x); if (d < 200) flash = Math.max(flash, (1 - d / 200) * (i === OURS ? 1 : .35)); }
    g.glow.material.opacity = flash * .5; g.g.material.opacity = .4 + flash * .5;
  });
  return { bg: bgB, css: cssB, fg: fgB, camera: cam };
}

function renderC(f) {
  // top-down; up = -z so +x reads left→right; slow rise
  const h = key(f, [[345, 5200], [400, 5600], [420, 7800, E.in]]);
  const lineScreenOffset = (1250 - 1080) * (2 * h * Math.tan(THREE.MathUtils.degToRad(15))) / STAGE_H;
  const [, , zLine] = meshPos(0, 2);
  const settle = E.inOut(range(f, 392, 420));
  const tz = lerp(drift(f, 3, .02) * 40 + 120, zLine - lineScreenOffset, settle);
  cam.fov = 30; cam.position.set(drift(f, 5, .02) * 60, h, tz + 0.001); cam.up.set(0, 0, -1); cam.lookAt(0, 0, tz); cam.updateProjectionMatrix();
  const meshFade = 1 - E.inOut(range(f, 390, 410));
  C3.nodes.material.opacity = .38 * meshFade; C3.wires.material.opacity = .2 * meshFade;
  const down = E.out(range(f, 360, 368));
  C3.failed.material.opacity = .38 * (1 - down) * meshFade * (1 + Math.sin(f * 2.2) * .5 * range(f, 358, 362) * (1 - down));
  C3.failedDash.material.opacity = .32 * down * meshFade;
  C3.offline.style.opacity = down * meshFade;
  const p1 = routePts(ROUTE1), p2 = routePts(ROUTE2);
  const t1 = E.inOut(range(f, 345, 360));
  const lost = E.inOut(range(f, 362, 370));
  const t2 = E.inOut(range(f, 368, 386));
  // first route: draws, then the part beyond the failed node greys out
  const seg1 = polySegments(p1.slice(0, 4), t1 * 1);
  C3.r1.geometry.setPositions(seg1); C3.r1.material.opacity = 1 - lost * .85;
  // second route (the detour) draws; then everything straightens into one line
  let pts2 = p2;
  if (settle > 0) {
    const n = p2.length, span = 26000;
    pts2 = p2.map((p, i) => [lerp(p[0], -span / 2 + span * i / (n - 1), settle), 0, lerp(p[2], zLine, settle)]);
  }
  const seg2 = polySegments(pts2, Math.max(t2, settle));
  C3.r2.geometry.setPositions(seg2); C3.r2.visible = f >= 368; C3.glow.geometry.setPositions(seg2); C3.glow.visible = f >= 368;
  // colour drifts from signal orange to the white hairline of the next shot's horizon
  const col = new THREE.Color(C.accent).lerp(new THREE.Color(0xf4f3ef), settle);
  C3.r2.material.color = col; C3.r2.material.opacity = lerp(1, .3, settle); C3.r2.material.linewidth = S.px(lerp(4.5, 2, settle));
  C3.glow.material.opacity = .16 * (1 - settle);
  // packet rides the active route
  const pk = f < 362 ? pointAlong(p1.slice(0, 4), t1 * .9) : pointAlong(p2, t2);
  C3.packet.position.set(...pk); C3.packet.material.opacity = 1 - settle;
  return { bg: bgC, css: cssC, fg: fgC, camera: cam };
}

export default seq;
