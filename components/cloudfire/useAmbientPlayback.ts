"use client";
import { useEffect, useState, type RefObject } from "react";
import { useSiteMotion } from "./SiteMotion";

// One playback policy for below-the-fold decoration; no React updates per frame.
export function useAmbientPlayback(ref: RefObject<HTMLElement | null>) {
  const { paused } = useSiteMotion();
  const [state, setState] = useState({ visible: false, seen: false, running: false, reduced: false, finePointer: false, enhanced: false });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(hover: hover) and (pointer: fine)");
    const wide = matchMedia("(min-width: 800px)");
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; addEventListener?: (type: string, listener: () => void) => void; removeEventListener?: (type: string, listener: () => void) => void } };
    let visible = false;
    const sync = () => setState(previous => ({
      visible, seen: previous.seen || visible, reduced: motion.matches, finePointer: pointer.matches,
      running: visible && !paused && !motion.matches && !document.hidden && !device.connection?.saveData,
      enhanced: wide.matches && pointer.matches && !motion.matches && !device.connection?.saveData && (device.deviceMemory ?? 8) >= 4 && (navigator.hardwareConcurrency || 4) >= 4,
    }));
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.08 });
    observer.observe(element);
    motion.addEventListener("change", sync);
    pointer.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    device.connection?.addEventListener?.("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", sync);
      pointer.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
      device.connection?.removeEventListener?.("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [paused, ref]);
  return state;
}