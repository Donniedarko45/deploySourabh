"use client";
import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(update: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

// Hydrates with the server's answer (motion allowed), then re-renders with the reader's real preference, so attributes
// rendered from it never keep a stale server value. Live: it follows the setting if it changes while the page is open.
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
