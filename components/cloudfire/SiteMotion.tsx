"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import styles from "./SiteMotion.module.css";

const SiteMotionContext = createContext({ paused: false, toggle: () => {} });

export function SiteMotionProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.siteMotion = paused ? "paused" : "running";
    return () => { delete document.documentElement.dataset.siteMotion; };
  }, [paused]);
  return <SiteMotionContext.Provider value={{ paused, toggle: () => setPaused(value => !value) }}>{children}</SiteMotionContext.Provider>;
}

export function useSiteMotion() {
  return useContext(SiteMotionContext);
}

export function MotionSetting() {
  const { paused, toggle } = useSiteMotion();
  return <button type="button" className={styles.setting} onClick={toggle} aria-pressed={paused} aria-label={paused ? "Enable website motion" : "Reduce website motion"}>Motion <span>{paused ? "off" : "on"}</span></button>;
}
