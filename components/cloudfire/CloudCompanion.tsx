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

  // On phones Ember sits over the reading column, so it steps aside while the reader scrolls down and returns on the way back up.
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 12) return;
      setTucked(y > last && y > 240 && !details.current?.open);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <aside className={styles.companion} aria-label="CloudFire companion" data-playing={playing && !editing} data-editing={editing} data-tucked={tucked}>
      <details ref={details} className={styles.details} onKeyDown={event => {
        if (event.key === "Escape" && details.current?.open) {
          event.preventDefault();
          details.current.open = false;
          details.current.querySelector("summary")?.focus();
        }
      }}>
        <summary className={styles.mascot} aria-label="Meet Ember, the CloudFire companion" aria-controls={`${id}-panel`}>
          <span className={styles.hint} aria-hidden="true">Need a spark?</span>
          {/* Ember: a real, sunlit cumulus (pre-rendered from lit vapour, public/brand/ember-cloud.webp) with live fire beneath it.
              The flame is three layered tongues that flicker out of step; its light pulses on the cloud's underside and embers drift off it. */}
          <svg viewBox="0 0 120 120" className={styles.character} aria-hidden="true" focusable="false">
            <defs>
              <radialGradient id={id + "-glow"}>
                <stop stopColor="#ffb066" stopOpacity=".55" /><stop offset=".45" stopColor="#ff6a2b" stopOpacity=".22" /><stop offset="1" stopColor="#ff5a36" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={id + "-outer"} x1="0" y1="1" x2="0" y2="0">
                <stop stopColor="#ff7a2e" /><stop offset=".55" stopColor="#ff4a1c" /><stop offset="1" stopColor="#ff3d1a" stopOpacity=".15" />
              </linearGradient>
              <linearGradient id={id + "-mid"} x1="0" y1="1" x2="0" y2="0">
                <stop stopColor="#ffc457" /><stop offset=".6" stopColor="#ff8f2e" /><stop offset="1" stopColor="#ff6a24" stopOpacity=".3" />
              </linearGradient>
              <linearGradient id={id + "-core"} x1="0" y1="1" x2="0" y2="0">
                <stop stopColor="#fffbea" /><stop offset=".6" stopColor="#ffe9a6" /><stop offset="1" stopColor="#ffd27a" stopOpacity=".55" />
              </linearGradient>
              <radialGradient id={id + "-spark"}>
                <stop stopColor="#fff2c4" /><stop offset=".5" stopColor="#ffb054" /><stop offset="1" stopColor="#ff7a2e" stopOpacity="0" />
              </radialGradient>
              <filter id={id + "-soft"} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".7" /></filter>
              <filter id={id + "-bloom"} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" /></filter>
              <radialGradient id={id + "-eye"} cx=".3" cy=".25" r=".8">
                <stop stopColor="#4d4540" /><stop offset=".55" stopColor="#24211f" /><stop offset="1" stopColor="#111213" />
              </radialGradient>
            </defs>
            <ellipse className={styles.shadow} cx="61" cy="113" rx="24" ry="3.5" fill={"url(#" + id + "-glow)"} />
            <g className={styles.body}>
              <ellipse className={styles.firelight} cx="61" cy="96" rx="34" ry="20" fill={"url(#" + id + "-glow)"} />
              <g className={styles.flare}>
                <g className={styles.flame}>
                  <path className={styles.bloom} d="M61 109C50 109 45 101 46.5 93C48 86 54 83 61.5 74C69 83 75.5 87 76 95C76.5 103 71 109 61 109Z" fill="#ff6a2b" filter={"url(#" + id + "-bloom)"} />
                  <path className={styles.tongueOuter} filter={"url(#" + id + "-soft)"} d="M61 107C53 107 48.5 101.5 49.5 95C50.3 90 53.5 88 54.5 84.5C56.5 87.5 56.8 90 57.2 91.5C57.5 85.5 59.5 81 61.5 77.5C63.5 82.5 66.5 85.5 66.8 90C67.8 88.5 68.7 86.5 69.2 84.5C72.2 88 73.6 92 73.4 96C73 102.5 68.5 107 61 107Z" fill={"url(#" + id + "-outer)"} />
                  <g transform="translate(61 107) scale(.72 .8) translate(-61 -107)"><path className={styles.tongueMid} filter={"url(#" + id + "-soft)"} d="M61 107C53 107 48.5 101.5 49.5 95C50.3 90 53.5 88 54.5 84.5C56.5 87.5 56.8 90 57.2 91.5C57.5 85.5 59.5 81 61.5 77.5C63.5 82.5 66.5 85.5 66.8 90C67.8 88.5 68.7 86.5 69.2 84.5C72.2 88 73.6 92 73.4 96C73 102.5 68.5 107 61 107Z" fill={"url(#" + id + "-mid)"} /></g>
                  <g transform="translate(61 107) scale(.42 .52) translate(-61 -107)"><path className={styles.fireCore} d="M61 107C53 107 48.5 101.5 49.5 95C50.3 90 53.5 88 54.5 84.5C56.5 87.5 56.8 90 57.2 91.5C57.5 85.5 59.5 81 61.5 77.5C63.5 82.5 66.5 85.5 66.8 90C67.8 88.5 68.7 86.5 69.2 84.5C72.2 88 73.6 92 73.4 96C73 102.5 68.5 107 61 107Z" fill={"url(#" + id + "-core)"} /></g>
                </g>
              </g>
              <image href="/brand/ember-cloud.webp" x="0" y="0" width="120" height="120" preserveAspectRatio="xMidYMid meet" />
              <ellipse className={styles.warmth} cx="61" cy="81" rx="27" ry="8" fill={"url(#" + id + "-glow)"} />
              <circle className={styles.spark} cx="57" cy="94" r="1.15" fill={"url(#" + id + "-spark)"} />
              <circle className={styles.spark} cx="65" cy="92" r=".95" fill={"url(#" + id + "-spark)"} />
              <circle className={styles.spark} cx="61" cy="97" r="1.3" fill={"url(#" + id + "-spark)"} />
              <ellipse cx="46" cy="65" rx="5" ry="2.6" fill="#f09a76" opacity=".28" />
              <ellipse cx="79" cy="65" rx="5" ry="2.6" fill="#f09a76" opacity=".28" />
              <g className={styles.eyes}>
                <g ref={face} className={styles.gaze}>
                  <ellipse cx="53" cy="58" rx="3.7" ry="5.1" fill={"url(#" + id + "-eye)"} />
                  <ellipse cx="72" cy="58" rx="3.7" ry="5.1" fill={"url(#" + id + "-eye)"} />
                  <ellipse cx="51.9" cy="56.1" rx="1.25" ry="1.6" fill="#fffdf6" opacity=".95" />
                  <ellipse cx="70.9" cy="56.1" rx="1.25" ry="1.6" fill="#fffdf6" opacity=".95" />
                  <circle cx="54.1" cy="60.3" r=".6" fill="#c9c2b8" opacity=".7" />
                  <circle cx="73.1" cy="60.3" r=".6" fill="#c9c2b8" opacity=".7" />
                </g>
              </g>
              <path className={styles.smile} d="M58.5 66Q62.5 69.6 66.5 66" fill="none" stroke="#4a433d" strokeWidth="1.6" strokeLinecap="round" />
              <path className={styles.happy} d="M57.5 65.6Q62.5 73 67.5 65.6Q62.5 67.4 57.5 65.6Z" fill="#4a433d" />
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
