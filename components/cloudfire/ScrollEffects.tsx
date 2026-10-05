"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Kind = "head" | "text" | "row" | "panel";

// What eases in as the reader reaches it. Containers and plain text only: anything with its own hover or
// press transform (buttons, links) is deliberately absent, so entrance and interaction never fight.
const targets: Record<Kind, string> = {
  head: ".section-heading, .final-cta h2, .chapter-head",
  text: [
    ".sticky-heading > .eyebrow", ".engineering-copy > .eyebrow", ".engineering-copy > p", ".engineering-footnote",
    ".positioning-content > *", ".example-caption", ".example-intro", ".capability-tabs", ".ai-use-list",
    ".final-cta > .eyebrow", ".final-cta-side", ".footer-top > div", ".footer-bottom",
    ".chapter-body > *", ".contact-aside > *",
  ].join(","),
  row: [
    ".engineering-principles > div", ".architecture-top", ".architecture-step", ".architecture-bottom",
    ".industry-row", ".insight-row", ".project-more-head", ".project-index li",
  ].join(","),
  panel: ".chapter-visual, .project, .capability-panel, .example-explorer, .ai-detail, .project-form",
};

const STAGGER = 70; // ms between items that arrive together
const SETTLE = 1700; // longest entrance (900ms) + longest stagger + margin

export default function ScrollEffects() {
  const pathname = usePathname();
  useEffect(() => {
    // Reduced motion: nothing is hidden, nothing moves. The page simply is.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fold = window.innerHeight * 0.92;
    const waiting: HTMLElement[] = [];
    const timers: number[] = [];
    for (const [kind, selector] of Object.entries(targets)) {
      for (const el of document.querySelectorAll<HTMLElement>(selector)) {
        if (el.dataset.in !== undefined) continue;
        const { top, bottom } = el.getBoundingClientRect();
        // Already on screen at load (the hero has its own entrance): leave it exactly as rendered.
        if (top < fold && bottom > 0) { el.dataset.in = ""; continue; }
        el.dataset.reveal = kind;
        waiting.push(el);
      }
    }
    const reveal = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry, i) => {
          const el = entry.target as HTMLElement;
          observer.unobserve(el);
          el.style.setProperty("--rv-delay", `${Math.min(i, 6) * STAGGER}ms`);
          el.dataset.in = "";
          // Once settled, hand the element back to its ordinary styles so hover and press transitions are untouched.
          timers.push(window.setTimeout(() => { delete el.dataset.reveal; el.style.removeProperty("--rv-delay"); }, SETTLE));
        });
    };
    // Entrances start a little inside the viewport edge. Blocks at the very end of the page can never get that far
    // (the page stops scrolling first), so they use the plain edge instead of staying hidden.
    const inset = new IntersectionObserver(reveal, { rootMargin: "0px 0px -8% 0px" });
    const edge = new IntersectionObserver(reveal);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    for (const el of waiting) {
      const topAtEnd = el.getBoundingClientRect().top + window.scrollY - maxScroll;
      (topAtEnd >= fold ? edge : inset).observe(el);
    }
    return () => { inset.disconnect(); edge.disconnect(); timers.forEach(clearTimeout); };
  }, [pathname]);
  return null;
}
