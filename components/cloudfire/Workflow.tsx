"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { ArrowUpRight, Check, Pause, Play, Plus } from "lucide-react";
import Link from "next/link";
import { workflow } from "@/lib/content";
import { useSiteMotion } from "./SiteMotion";
import WorkflowScene from "./WorkflowScene";
import styles from "./Workflow.module.css";

const DURATION = 8000;
const phases = [
  { headline: "Ask better questions.", artifact: "Problem map", tags: ["User insight", "Business context", "Opportunity map"] },
  { headline: "Give ambition a blueprint.", artifact: "Product blueprint", tags: ["Product scope", "Architecture", "Delivery roadmap"] },
  { headline: "Make complexity feel effortless.", artifact: "Interface system", tags: ["Interaction design", "Prototyping", "Design system"] },
  { headline: "Build with intent. Ship with confidence.", artifact: "Reviewed software", tags: ["Application build", "Automated checks", "Release pipeline"] },
  { headline: "Keep getting better.", artifact: "Evolving product", tags: ["Observability", "Performance", "Continuous improvement"] },
];

export default function Workflow() {
  const [selection, setSelection] = useState({ index: 0, cycle: 0 });
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [keyboard, setKeyboard] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const { paused: sitePaused } = useSiteMotion();
  const rail = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const cycle = useRef({ remaining: DURATION });
  const motionOff = !!reducedMotion || sitePaused;
  const playing = !motionOff && inView && visible && !userPaused && !holding;

  useEffect(() => {
    const target = rail.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(target);
    const visibility = () => setVisible(!document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  // Loop while visible, preserving elapsed time when the section or browser tab is hidden.
  useEffect(() => {
    if (!playing) return;
    const currentCycle = cycle.current;
    const started = performance.now();
    const timer = window.setTimeout(() => {
      cycle.current = { remaining: DURATION };
      setKeyboard(false);
      setSelection(value => ({ index: (value.index + 1) % workflow.length, cycle: value.cycle + 1 }));
    }, currentCycle.remaining);
    return () => {
      window.clearTimeout(timer);
      currentCycle.remaining = Math.max(0, currentCycle.remaining - (performance.now() - started));
    };
  }, [playing, selection.cycle]);

  useEffect(() => {
    const target = rail.current;
    const button = buttons.current[selection.index];
    if (!target || !button) return;
    // On narrow screens the stages are a carousel: the selected stage always settles at the snap edge.
    const reveal = () => {
      const max = target.scrollWidth - target.clientWidth;
      if (max <= 0) return;
      const inset = parseFloat(getComputedStyle(target).scrollPaddingLeft) || 0;
      const left = Math.min(max, Math.max(0, button.offsetLeft - inset));
      if (Math.abs(left - target.scrollLeft) > 2) target.scrollTo({ left, behavior: motionOff || keyboard ? "auto" : "smooth" });
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(target);
    return () => observer.disconnect();
  }, [selection.index, motionOff, keyboard]);

  // A swipe selects the stage it settles on. Programmatic scrolls settle on the stage already selected, so they are no-ops.
  useEffect(() => {
    const target = rail.current;
    if (!target) return;
    let settle = 0;
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        if (target.scrollWidth <= target.clientWidth) return;
        const max = target.scrollWidth - target.clientWidth;
        const inset = parseFloat(getComputedStyle(target).scrollPaddingLeft) || 0;
        let nearest = 0;
        buttons.current.forEach((button, index) => {
          const current = buttons.current[nearest];
          if (!button || !current) return;
          const distance = (element: HTMLElement) => Math.abs(Math.min(max, element.offsetLeft - inset) - target.scrollLeft);
          if (distance(button) < distance(current)) nearest = index;
        });
        setSelection(value => value.index === nearest ? value : { index: nearest, cycle: value.cycle + 1 });
        cycle.current = { remaining: DURATION };
      }, 120);
    };
    const hold = () => setHolding(true);
    const release = () => setHolding(false);
    target.addEventListener("scroll", onScroll, { passive: true });
    target.addEventListener("touchstart", hold, { passive: true });
    target.addEventListener("touchend", release);
    target.addEventListener("touchcancel", release);
    return () => {
      window.clearTimeout(settle);
      target.removeEventListener("scroll", onScroll);
      target.removeEventListener("touchstart", hold);
      target.removeEventListener("touchend", release);
      target.removeEventListener("touchcancel", release);
    };
  }, []);

  function select(index: number, fromKeyboard = false) {
    cycle.current = { remaining: DURATION };
    setSelection(value => ({ index, cycle: value.cycle + 1 }));
    setKeyboard(fromKeyboard);
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = (index + 1) % workflow.length; break;
      case "ArrowLeft": next = (index + workflow.length - 1) % workflow.length; break;
      case "Home": next = 0; break;
      case "End": next = workflow.length - 1; break;
      default: return;
    }
    event.preventDefault();
    select(next, true);
    buttons.current[next]?.focus({ preventScroll: true });
  }

  return <section id="how-we-work" className={"positioning-section " + styles.section} aria-labelledby="workflow-heading"
    data-motion-paused={motionOff || !inView || !visible} data-cycle-paused={!playing} data-keyboard={keyboard} data-autoplay={!motionOff}>
    <div className="container">
      <header className={styles.header}>
        <div><p className="eyebrow"><span className="section-index">03 /</span> THE WAY WE WORK</p><h2 id="workflow-heading">Not another<br />development <span className="accent">vendor.</span></h2></div>
        <div className={styles.intro}><p className={styles.lead}>Your ambition.<br />Our shared responsibility.</p><p>CloudFire works as an extension of your product team. We connect business decisions with technical decisions, challenge assumptions early, and build with the people who will use and own the product.</p></div>
      </header>
      <div className={styles.system}>
        <div className={styles.toolbar}>
          <p className={styles.systemLabel}><span className={styles.liveDot} aria-hidden="true" /><span>THE BUILD SYSTEM</span><span className={styles.slash}>/</span><span className={styles.systemDescriptor}>IDEA TO EVOLUTION</span></p>
          <div className={styles.controls}>
            <span className={styles.counter} aria-hidden="true"><b>0{selection.index + 1}</b> / 0{workflow.length}</span>
            <button type="button" className={styles.playback} onClick={() => setUserPaused(value => !value)}
              aria-label={userPaused ? "Play the delivery process walkthrough" : "Pause the delivery process walkthrough"}>
              {userPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}<span aria-hidden="true">{userPaused ? "PLAY" : "PAUSE"}</span>
            </button>
          </div>
        </div>
        <div ref={rail} className={styles.stages} role="tablist" aria-label="Our delivery process">
          <div className={styles.track} aria-hidden="true"><span /></div>
          {workflow.map((item, index) => <button key={item.title} ref={element => { buttons.current[index] = element; }} type="button"
            className={styles.stage} role="tab" id={`workflow-tab-${index}`} aria-label={`0${index + 1} ${item.title}`}
            aria-selected={selection.index === index} aria-controls={`workflow-panel-${index}`} tabIndex={selection.index === index ? 0 : -1}
            onClick={event => select(index, event.detail === 0)} onKeyDown={event => navigate(event, index)}>
            <span className={styles.scene}><WorkflowScene phase={index} active={selection.index === index} /></span>
            <span className={styles.connector} aria-hidden="true"><span /></span>
            <span className={styles.stageHeading}><span className={styles.number}>0{index + 1}</span><span className={styles.stageName}>{item.title}</span></span>
            <span className={styles.caption}>{phases[index].artifact}</span><span key={selection.cycle} className={styles.progress} aria-hidden="true" />
          </button>)}
        </div>
        <div className={"workflow-detail " + styles.details}>
          {workflow.map((item, index) => <div key={item.title} role="tabpanel" id={`workflow-panel-${index}`} aria-labelledby={`workflow-tab-${index}`}
            className={styles.detail} data-active={selection.index === index} aria-hidden={selection.index !== index} inert={selection.index !== index} tabIndex={selection.index === index ? 0 : -1}>
            <div className={styles.detailHeading}><span className={styles.detailIndex} aria-hidden="true">0{index + 1}</span><div>
              <p className={styles.phaseLabel}>0{index + 1} / {item.title.toUpperCase()}</p><h3>{phases[index].headline}</h3>
              <ul className={styles.tags} aria-label="Stage disciplines">{phases[index].tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
            </div></div>
            <div className={styles.detailBody}><p>{item.body}</p><div className={styles.output}><span>OUTPUT</span><p>{item.output}</p><Check size={15} aria-hidden="true" /></div></div>
          </div>)}
        </div>
        <div className={styles.footer}><p><Plus size={20} aria-hidden="true" /><span>Clear communication. Thoughtful tradeoffs. Working software you can review. A partnership built around what happens after launch.</span></p><Link className="text-link" href="/contact">Start a conversation <ArrowUpRight size={16} /></Link></div>
      </div>
    </div>
  </section>;
}
