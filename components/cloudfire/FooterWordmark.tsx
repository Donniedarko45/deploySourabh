"use client";

import { useEffect, useRef } from "react";
import { useSiteMotion } from "./SiteMotion";
import { wordmarkLetters, wordmarkWidth } from "./footerWordmarkPaths";
import styles from "./FooterWordmark.module.css";

export default function FooterWordmark() {
  const host = useRef<HTMLDivElement>(null);
  const { paused } = useSiteMotion();

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (visible) element.dataset.entered = "true";
      element.dataset.playing = String(visible && !paused && !motion.matches && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0.35 });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, [paused]);

  return <div ref={host} className={styles.wordmark} data-footer-wordmark data-entered="false" data-playing="false" aria-hidden="true">
    <svg viewBox={"0 0 " + wordmarkWidth + " 820"} fill="none" focusable="false">
      <g transform="translate(0 800) scale(1 -1)">
        {wordmarkLetters.map((letter, index) => <g key={index} transform={"translate(" + letter.x + " 0)"}>
          <path d={letter.d} className={letter.dot ? styles.dot : styles.base} />
          {!letter.dot && <>
            <path d={letter.d} className={styles.outline} />
            <path d={letter.d} pathLength="1" className={styles.trace} style={{ animationDelay: (-index * 1400) + "ms" }} />
          </>}
        </g>)}
      </g>
    </svg>
  </div>;
}