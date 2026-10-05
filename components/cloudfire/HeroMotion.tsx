"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const HeroMotionContext = createContext<{ paused: boolean; togglePaused: () => void } | null>(null);

export function HeroMotionProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return <HeroMotionContext.Provider value={{ paused, togglePaused: () => setPaused(value => !value) }}>{children}</HeroMotionContext.Provider>;
}

export function useHeroMotion() {
  return useContext(HeroMotionContext);
}
