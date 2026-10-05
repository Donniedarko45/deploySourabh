"use client";

// Adapted from https://ui.aceternity.com/components/google-gemini-effect.
// Reuses the site's Motion runtime and palette rather than adding a second one.
import { useEffect, useRef } from "react";
import { m, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { geminiPaths } from "./geminiPaths";
import { useAmbientPlayback } from "../cloudfire/useAmbientPlayback";
import styles from "./GoogleGeminiEffect.module.css";

export function GoogleGeminiEffect() {
  const host = useRef<HTMLDivElement>(null);
  const { running, reduced } = useAmbientPlayback(host);
  const { scrollYProgress } = useScroll({ target: host, offset: ["start end", "end center"] });
  const progress = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, "change", value => { if (running) progress.set(value); });
  useEffect(() => { if (running) progress.set(scrollYProgress.get()); }, [running, progress, scrollYProgress]);
  const paths = [
    useTransform(progress, [0, 0.85], [0.03, 1]),
    useTransform(progress, [0.05, 0.85], [0.03, 1]),
    useTransform(progress, [0.1, 0.9], [0.03, 1]),
    useTransform(progress, [0.15, 0.9], [0.03, 1]),
    useTransform(progress, [0.2, 0.95], [0.03, 1]),
  ];
  const colors = ["#ff5a36", "#ffb48e", "#eee8db", "#d67750", "#9c3f25"];
  return <div ref={host} className={styles.effect} data-gemini-effect data-playing={running} aria-hidden="true">
    <svg viewBox="0 310 1440 420" fill="none" preserveAspectRatio="xMidYMid slice">
      {geminiPaths.map((d, index) => <path key={"base-" + index} d={d} stroke={colors[index]} strokeWidth="1" opacity=".16" />)}
      {geminiPaths.map((d, index) => <m.path className={styles.signal} key={index} d={d} stroke={colors[index]} strokeWidth="2"
        initial={false} style={{ pathLength: reduced ? 1 : paths[index] }} />)}
    </svg>
  </div>;
}