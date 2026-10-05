"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import styles from "./CloudCompanion.module.css";
import { useSiteMotion } from "./SiteMotion";

function subscribeVisibility(update: () => void) {
  document.addEventListener("visibilitychange", update);
  return () => document.removeEventListener("visibilitychange", update);
}

export default function CloudCompanion() {
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  const face = useRef<SVGGElement>(null);
  const visible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
  const { paused } = useSiteMotion();
  const [editing, setEditing] = useState(false);
  const playing = visible && !paused;

  useEffect(() => {
    if (paused || editing) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame: number | null = null;
    let x = 0;
    let y = 0;
    const updateGaze = () => {
      frame = null;
      const eyes = face.current;
      const element = details.current;
      if (!eyes || !element || document.hidden || motion.matches || !pointer.matches) return;
      const bounds = element.getBoundingClientRect();
      const dx = Math.max(-3, Math.min(3, (x - bounds.left - bounds.width / 2) / 100));
      const dy = Math.max(-2, Math.min(2, (y - bounds.top - bounds.height / 2) / 100));
      eyes.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const look = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || motion.matches || !pointer.matches || document.hidden) return;
      x = event.clientX;
      y = event.clientY;
      if (frame === null) frame = requestAnimationFrame(updateGaze);
    };
    const reset = () => { if (face.current) face.current.style.transform = ""; };
    window.addEventListener("pointermove", look, { passive: true });
    document.addEventListener("pointerleave", reset);
    motion.addEventListener("change", reset);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", look);
      document.removeEventListener("pointerleave", reset);
      motion.removeEventListener("change", reset);
      reset();
    };
  }, [paused, editing]);

  useEffect(() => {
    const update = () => setEditing(document.activeElement instanceof Element && document.activeElement.matches("input,textarea,select,[contenteditable=true]"));
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);

  return (
    <aside className={styles.companion} aria-label="CloudFire companion" data-playing={playing && !editing} data-editing={editing}>
      <details ref={details} className={styles.details} onKeyDown={event => {
        if (event.key === "Escape" && details.current?.open) {
          event.preventDefault();
          details.current.open = false;
          details.current.querySelector("summary")?.focus();
        }
      }}>
        <summary className={styles.mascot} aria-label="Meet Ember, the CloudFire companion" aria-controls={`${id}-panel`}>
          <span className={styles.hint} aria-hidden="true">Need a spark?</span>
          <svg viewBox="0 0 120 120" className={styles.character} aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id={id + "-cloud"} x1=".2" y1="0" x2=".7" y2="1">
                <stop stopColor="#fffdf7" /><stop offset=".42" stopColor="#e7e6df" /><stop offset=".76" stopColor="#b4b3ad" /><stop offset="1" stopColor="#777873" />
              </linearGradient>
              <radialGradient id={id + "-volume"} cx=".38" cy=".28" r=".7">
                <stop stopColor="#fffefa" stopOpacity=".95" /><stop offset=".56" stopColor="#f4f3ee" stopOpacity=".3" /><stop offset="1" stopColor="#8a8b85" stopOpacity=".12" />
              </radialGradient>
              <radialGradient id={id + "-warmth"} cx=".5" cy="1" r=".75">
                <stop stopColor="#ff9c57" stopOpacity=".52" /><stop offset="1" stopColor="#ff793c" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id + "-glow"}>
                <stop stopColor="#ff9b51" stopOpacity=".38" /><stop offset="1" stopColor="#ff5a36" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={id + "-fire"} x1=".4" y1="1" x2=".6" y2="0">
                <stop stopColor="#ff5a36" /><stop offset=".5" stopColor="#ff8e43" /><stop offset="1" stopColor="#ffe7a0" />
              </linearGradient>
              <radialGradient id={id + "-eye"} cx=".3" cy=".25" r=".8">
                <stop stopColor="#514943" /><stop offset=".55" stopColor="#262424" /><stop offset="1" stopColor="#121415" />
              </radialGradient>
              <clipPath id={id + "-silhouette"}>
                <path d="M32 83C17 83 12 74 14 63C15 53 23 47 32 46C31 34 41 26 51 30C58 17 76 19 83 32C96 29 107 39 106 53C118 60 115 79 101 83Z" />
              </clipPath>
            </defs>
            <ellipse className={styles.shadow} cx="61" cy="109" rx="25" ry="4" fill={"url(#" + id + "-glow)"} />
            <g className={styles.body}>
              <ellipse className={styles.firelight} cx="61" cy="89" rx="30" ry="22" fill={"url(#" + id + "-glow)"} />
              <g className={styles.flame}>
                <path d="M51 78C50 89 44 89 48 98C52 109 68 109 73 99C77 91 69 88 70 80C65 84 65 90 61 92C60 86 56 84 57 76Z" fill={"url(#" + id + "-fire)"} />
                <path className={styles.fireCore} d="M57 94C55 99 55 103 61 105C66 101 65 98 62 94C61 97 59 98 57 94Z" fill="#fff1c5" />
              </g>
              <path d="M28 65C19 68 17 75 22 79" fill="none" stroke="#a5a69f" strokeWidth="6" strokeLinecap="round" />
              <path className={styles.arm} d="M94 65C102 65 106 58 105 51" fill="none" stroke="#d5d4cb" strokeWidth="6" strokeLinecap="round" />
              <path d="M32 83C17 83 12 74 14 63C15 53 23 47 32 46C31 34 41 26 51 30C58 17 76 19 83 32C96 29 107 39 106 53C118 60 115 79 101 83Z" fill={"url(#" + id + "-cloud)"} stroke="#fff8e84d" strokeWidth=".8" />
              <g clipPath={"url(#" + id + "-silhouette)"}>
                <ellipse cx="67" cy="43" rx="22" ry="22" fill={"url(#" + id + "-volume)"} />
                <ellipse cx="45" cy="45" rx="15" ry="16" fill={"url(#" + id + "-volume)"} />
                <ellipse cx="90" cy="48" rx="17" ry="16" fill={"url(#" + id + "-volume)"} />
                <ellipse cx="29" cy="66" rx="18" ry="19" fill={"url(#" + id + "-volume)"} />
                <ellipse cx="97" cy="68" rx="18" ry="18" fill={"url(#" + id + "-volume)"} />
                <ellipse className={styles.warmth} cx="61" cy="82" rx="36" ry="20" fill={"url(#" + id + "-warmth)"} />
              </g>
              <path d="M36 43C38 35 44 32 49 34M58 30C64 25 73 27 77 32" fill="none" stroke="#fff" strokeOpacity=".62" strokeWidth="1.6" strokeLinecap="round" />
              <ellipse cx="42" cy="68" rx="6" ry="3" fill="#e98d6a" opacity=".26" />
              <ellipse cx="84" cy="68" rx="6" ry="3" fill="#e98d6a" opacity=".26" />
              <g className={styles.eyes}>
                <g ref={face} className={styles.gaze}>
                  <ellipse cx="49" cy="57" rx="4.4" ry="6.2" fill={"url(#" + id + "-eye)"} />
                  <ellipse cx="76" cy="57" rx="4.4" ry="6.2" fill={"url(#" + id + "-eye)"} />
                  <ellipse cx="47.7" cy="54.8" rx="1.4" ry="1.8" fill="#fffdf3" opacity=".92" />
                  <ellipse cx="74.7" cy="54.8" rx="1.4" ry="1.8" fill="#fffdf3" opacity=".92" />
                  <circle cx="50.3" cy="59.7" r=".7" fill="#b2aca3" opacity=".7" />
                  <circle cx="77.3" cy="59.7" r=".7" fill="#b2aca3" opacity=".7" />
                </g>
              </g>
              <path className={styles.smile} d="M57 68Q62 72 67 68" fill="none" stroke="#514a43" strokeWidth="1.8" strokeLinecap="round" />
              <path className={styles.happy} d="M56 68Q62 76 68 68Q62 70 56 68Z" fill="#514a43" />
            </g>
          </svg>
        </summary>
        <div id={`${id}-panel`} className={styles.panel}>
          <p className={styles.name}><span className="orange-dot" />MEET EMBER</p>
          <p className={styles.message}>A little cloud. A little fire.<br />Let’s make something good.</p>
          <div className={styles.links}>
            <Link href="/work" onClick={() => { if (details.current) details.current.open = false; }}>Explore our work<ArrowUpRight size={15} aria-hidden="true" /></Link>
            <Link href="/contact" onClick={() => { if (details.current) details.current.open = false; }}>Start a project<ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      </details>
    </aside>
  );
}
