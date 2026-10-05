"use client";
import { useRef } from "react";
import { useInView } from "framer-motion";

/** A div that reports whether it is on screen as data-play, so looping CSS can pause while nobody can see it. */
export default function InView({ children, ...props }: React.ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const playing = useInView(ref, { amount: 0.15 });
  return <div ref={ref} data-play={playing} {...props}>{children}</div>;
}
