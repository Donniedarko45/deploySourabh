// Virtual clock injected before any page script (page.addInitScript). While unfrozen the page runs in real time;
// after __vfreeze() time only advances through __vstep(ms), so UI animation can be captured frame by frame at any
// resolution. Covers performance.now, Date, setTimeout/setInterval, requestAnimationFrame, CSS transitions/animations
// and element.animate (Web Animations). Network and server events still arrive in real time: they are real.
(() => {
  const rPerf = performance.now.bind(performance), rSetTimeout = window.setTimeout.bind(window), rRAF = window.requestAnimationFrame.bind(window);
  const RealDate = Date, date0 = RealDate.now(), perf0 = rPerf();
  let frozen = false, vt = 0, realMark = rPerf(), vtMark = 0;
  const now = () => (frozen ? vt : vtMark + (rPerf() - realMark));
  performance.now = () => perf0 + now();
  class VDate extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(date0 + now()); }
    static now() { return date0 + now(); }
  }
  window.Date = VDate;

  let tid = 1, pump = null; const timers = new Map();
  const schedule = () => { if (!frozen && !pump) pump = rSetTimeout(() => { pump = null; runTimers(now()); if (timers.size) schedule(); }, 4); };
  window.setTimeout = (cb, ms = 0, ...args) => { const id = tid++; timers.set(id, { at: now() + Math.max(0, +ms || 0), cb, args, every: 0 }); schedule(); return id; };
  window.setInterval = (cb, ms = 0, ...args) => { const e = Math.max(1, +ms || 0); const id = tid++; timers.set(id, { at: now() + e, cb, args, every: e }); schedule(); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  function runTimers(t) {
    for (let guard = 0; guard < 20000; guard++) {
      let next = null;
      for (const [id, tm] of timers) if (tm.at <= t && (!next || tm.at < next[1].at)) next = [id, tm];
      if (!next) return;
      const [id, tm] = next;
      if (frozen) vt = Math.max(vt, tm.at);
      if (tm.every) tm.at += tm.every; else timers.delete(id);
      try { typeof tm.cb === 'function' ? tm.cb(...tm.args) : (0, eval)(String(tm.cb)); } catch (e) { console.error(e); }
    }
  }

  let rid = 1, rafQ = new Map(), rafPending = false;
  const flushRaf = () => { rafPending = false; const q = rafQ; rafQ = new Map(); const ts = performance.now(); for (const cb of q.values()) { try { cb(ts); } catch (e) { console.error(e); } } };
  window.requestAnimationFrame = (cb) => { const id = rid++; rafQ.set(id, cb); if (!frozen && !rafPending) { rafPending = true; rRAF(flushRaf); } return id; };
  window.cancelAnimationFrame = (id) => { rafQ.delete(id); };

  const births = new WeakMap(), tracked = new Set();
  const track = (a) => { if (!frozen || births.has(a)) return; births.set(a, vt); tracked.add(a); try { a.pause(); a.currentTime = 0; } catch {} };
  document.addEventListener('transitionrun', (e) => e.target.getAnimations?.().forEach(track), true);
  document.addEventListener('animationstart', (e) => e.target.getAnimations?.().forEach(track), true);
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (...args) { const an = animate.apply(this, args); track(an); return an; };

  window.__vfreeze = () => { vt = now(); frozen = true; for (const a of document.getAnimations()) track(a); };
  window.__vunfreeze = () => { vtMark = vt; realMark = rPerf(); frozen = false; for (const a of tracked) { try { if (a.playState === 'paused') a.play(); } catch {} } tracked.clear(); schedule(); if (rafQ.size && !rafPending) { rafPending = true; rRAF(flushRaf); } };
  window.__vstep = (ms) => {
    const target = vt + ms;
    runTimers(target); vt = target;
    flushRaf();
    for (const a of document.getAnimations()) {
      if (!births.has(a)) track(a);
      const t = (vt - births.get(a)) * (a.playbackRate || 1);
      const end = a.effect?.getComputedTiming?.().endTime;
      try {
        if (Number.isFinite(end) && t >= end) { a.currentTime = end; a.finish(); tracked.delete(a); }
        else a.currentTime = t;
      } catch {}
    }
    return vt;
  };
  window.__vnow = () => now();
})();
