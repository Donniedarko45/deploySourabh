"use client";
import { m, useReducedMotion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return <m.div className={className} initial={false} whileInView={reduce ? { opacity: 1 } : { opacity: [0.7, 1], transform: ["translateY(16px)", "translateY(0px)"] }}
    transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }} viewport={{ once: true, amount: 0.12 }}>{children}</m.div>;
}
export function ProjectLink({ children = "Start a Project", href = "/contact", secondary = false, magnetic = true }: { children?: React.ReactNode; href?: string; secondary?: boolean; magnetic?: boolean }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 100, damping: 20, mass: 0.5 });
  const transform = useMotionTemplate`translate(${springX}px, ${springY}px)`;
  const reduce = useReducedMotion();
  return <m.div className="magnetic-wrap" style={{ transform: reduce || !magnetic ? "none" : transform }}
    onPointerMove={event => { if (!magnetic || reduce || event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return; const rect = event.currentTarget.getBoundingClientRect(); x.set((event.clientX - rect.left - rect.width / 2) * 0.12); y.set((event.clientY - rect.top - rect.height / 2) * 0.12); }}
    onPointerLeave={() => { x.set(0); y.set(0); }}>
    <Link className={secondary ? "button button-secondary" : "button button-primary"} href={href}>{children}{secondary ? <ArrowRight size={17} /> : <ArrowUpRight size={18} />}</Link>
  </m.div>;
}
