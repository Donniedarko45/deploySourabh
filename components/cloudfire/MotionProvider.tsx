"use client";
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";
import { SiteMotionProvider } from "./SiteMotion";
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <SiteMotionProvider><LazyMotion features={domAnimation} strict><MotionConfig reducedMotion="user">{children}</MotionConfig></LazyMotion></SiteMotionProvider>;
}
