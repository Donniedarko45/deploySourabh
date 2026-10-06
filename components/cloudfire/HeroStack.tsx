"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInView, useReducedMotion } from "framer-motion";
import { useSiteMotion } from "./SiteMotion";
import styles from "./HeroStack.module.css";

export type StackCard = { slug: string; title: string; host: string; src: string };
const DWELL = 6500;

// Three stationary browser frames. Project previews crossfade rather than orbit,
// and hold while someone is reading, choosing a project, or using the keyboard.
export default function HeroStack({ cards }: { cards: StackCard[] }) {
  const deck = useRef<HTMLDivElement>(null);
  const onScreen = useInView(deck, { amount: 0.3 });
  const reduce = useReducedMotion();
  const { paused } = useSiteMotion();
  const [front, setFront] = useState(0);
  const [pointerHeld, setPointerHeld] = useState(false);
  const [focusHeld, setFocusHeld] = useState(false);
  const [visible, setVisible] = useState(true);
  const [instant, setInstant] = useState(false);
  const running = !reduce && !paused && !pointerHeld && !focusHeld && visible && onScreen && cards.length > 1;

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => {
      setInstant(false);
      setFront(value => (value + 1) % cards.length);
    }, DWELL);
    return () => window.clearTimeout(id);
  }, [running, cards.length, front]);

  if (!cards.length) return null;
  const current = cards[front];
  return <div ref={deck} className={"hero-stack " + styles.showcase} data-instant={instant} data-running={running}
    onPointerEnter={event => { if (event.pointerType === "mouse") setPointerHeld(true); }}
    onPointerLeave={() => setPointerHeld(false)}
    onFocusCapture={() => setFocusHeld(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusHeld(false); }}>
    <Link href="/work" className="stack-deck" aria-label={[2, 1, 0].map(depth => cards[(front + depth) % cards.length].host).join(", ") + ". Explore " + current.title + " and our selected work"}>
      {[2, 1, 0].map(depth => {
        const projectIndex = (front + depth) % cards.length;
        return <span key={depth} className="stack-layer" data-depth={depth} aria-hidden="true">
          <span className="frame-bar"><i /><i /><i /><span className="frame-url">{cards[projectIndex].host}</span></span>
          <span className="stack-screen">
            {cards.map((card, index) => <span key={card.slug} className="stack-card" data-active={index === projectIndex}>
              <Image src={card.src} alt="" width={1440} height={900} loading="lazy"
                sizes="(max-width: 599px) 76vw, (max-width: 1099px) 32vw, 34vw" />
            </span>)}
          </span>
        </span>;
      })}
    </Link>
    <div className="stack-caption">
      <span className="stack-title" aria-hidden="true"><strong>{current.title}</strong><span>{current.host}</span></span>
      <div className="stack-selectors" role="group" aria-label="Featured projects">
        {cards.map((card, index) => <button key={card.slug} type="button" aria-label={String(index + 1).padStart(2, "0") + " Show " + card.title} aria-pressed={index === front}
          onClick={event => { setInstant(event.detail === 0); setFront(index); }}>
          {String(index + 1).padStart(2, "0")}
        </button>)}
      </div>
    </div>
  </div>;
}