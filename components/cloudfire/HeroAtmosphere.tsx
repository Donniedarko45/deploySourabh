"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useSiteMotion } from "./SiteMotion";
import { createAtmosphereRenderer, type AtmosphereRenderer } from "./atmosphereRenderer";
import styles from "./HeroAtmosphere.module.css";

export default function HeroAtmosphere() {
  const backdrop = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const poster = useRef<HTMLImageElement>(null);
  const { paused } = useSiteMotion();
  const pausedRef = useRef(paused);
  const updatePlayback = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    updatePlayback.current?.();
  }, [paused]);

  useEffect(() => {
    const host = backdrop.current;
    const surface = canvas.current;
    if (!host || !surface) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const capable = memory >= 4 && (navigator.hardwareConcurrency || 4) >= 4;
    let pending: number | null = null;
    let idle = false;
    let renderer: AtmosphereRenderer | null = null;
    let ready = false;
    let visible = false;
    let failed = false;
    let disposed = false;
    let frame: number | null = null;
    let elapsed = 0;
    let lastClock = 0;
    let lastDraw = 0;
    const canPlay = () => ready && visible && !document.hidden && !motion.matches && !pausedRef.current && !connection?.saveData && capable;
    const tick = (now: number) => {
      frame = null;
      if (!canPlay()) {
        host.dataset.playing = "false";
        lastClock = 0;
        return;
      }
      if (lastClock) elapsed += Math.min((now - lastClock) / 1000, 0.05);
      lastClock = now;
      const interval = window.innerWidth < 600 ? 1000 / 24 : 1000 / 30;
      if (now - lastDraw >= interval) {
        renderer?.draw(elapsed);
        lastDraw = now - ((now - lastDraw) % interval);
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (disposed) return;
      if (!renderer && pending === null && !failed && visible && !pausedRef.current && !motion.matches && !connection?.saveData && capable && poster.current?.complete && poster.current.naturalWidth) {
        const initialize = () => {
          pending = null;
          if (disposed || !visible || pausedRef.current || motion.matches || connection?.saveData) return;
          renderer = createAtmosphereRenderer(surface, () => {
            if (disposed) return;
            ready = true;
            host.dataset.ready = "true";
            sync();
          }, () => {
            failed = true; ready = false;
            host.dataset.ready = "false";
            sync();
          }, poster.current?.currentSrc || "/brand/cloudfire-hero.webp");
          if (!renderer) failed = true;
        };
        idle = typeof window.requestIdleCallback === "function";
        pending = idle ? window.requestIdleCallback(initialize, { timeout: 1800 }) : window.setTimeout(initialize, 400);
      }
      const playing = canPlay();
      host.dataset.playing = String(playing);
      if (playing && frame === null) {
        lastClock = 0;
        frame = requestAnimationFrame(tick);
      } else if (!playing && frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
        lastClock = 0;
      }
    };
    updatePlayback.current = sync;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(host);
    const resize = new ResizeObserver(() => {
      if (!ready) return;
      renderer?.resize();
      renderer?.draw(elapsed);
    });
    resize.observe(host);
    const onLost = (event: Event) => {
      event.preventDefault();
      ready = false;
      failed = true;
      host.dataset.ready = "false";
      sync();
    };
    const onRestored = () => {
      renderer?.dispose();
      renderer = null;
      failed = false;
      sync();
    };
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    surface.addEventListener("webglcontextlost", onLost);
    surface.addEventListener("webglcontextrestored", onRestored);
    return () => {
      disposed = true;
      updatePlayback.current = null;
      if (frame !== null) cancelAnimationFrame(frame);
      if (pending !== null) { if (idle) window.cancelIdleCallback(pending); else window.clearTimeout(pending); }
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      surface.removeEventListener("webglcontextlost", onLost);
      surface.removeEventListener("webglcontextrestored", onRestored);
      renderer?.dispose();
    };
  }, []);

  return (
    <div ref={backdrop} className={`hero-backdrop ${styles.backdrop}`} aria-hidden="true" data-ready="false" data-playing="false">
      <Image ref={poster} onLoad={() => updatePlayback.current?.()} src="/brand/cloudfire-hero.webp" alt="" width={1200} height={800} priority sizes="(max-width: 599px) 150vw, 92vw" className={`hero-backdrop-img ${styles.poster}`} />
      <canvas ref={canvas} width={1200} height={800} className={`hero-backdrop-img ${styles.canvas}`} />
    </div>
  );
}
