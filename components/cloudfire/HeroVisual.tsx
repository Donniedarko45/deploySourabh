"use client";

import { useEffect, useRef, useState } from "react";
import { m, useMotionValue, useMotionTemplate, useReducedMotion, useSpring } from "framer-motion";

export default function HeroVisual({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 26, mass: 1 });
  const springY = useSpring(y, { stiffness: 100, damping: 26, mass: 1 });
  const transform = useMotionTemplate`translate3d(${springX}px, ${springY}px, 0)`;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const update = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }, { threshold: 0.15 });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div className="hero-visual-enter">
      <m.div
        ref={ref}
        className="hero-depth"
        data-active={active}
        style={{ transform: reduce ? "none" : transform }}
        onPointerMove={event => {
          if (reduce || event.pointerType !== "mouse" ||
              !window.matchMedia("(min-width: 1100px) and (hover: hover) and (pointer: fine)").matches) return;
          const rect = event.currentTarget.getBoundingClientRect();
          x.set(((event.clientX - rect.left) / rect.width - 0.5) * 8);
          y.set(((event.clientY - rect.top) / rect.height - 0.5) * 6);
        }}
        onPointerLeave={() => { x.set(0); y.set(0); }}
      >
        {children}
      </m.div>
    </div>
  );
}
