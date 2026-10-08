"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { ArrowUpRight, Check, FileText, GitBranch, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { GlobePoster } from "../ui/GlobePoster";
import { GoogleGeminiEffect } from "../ui/GoogleGeminiEffect";
import styles from "./Ai.module.css";
import { useAmbientPlayback } from "./useAmbientPlayback";

const Globe3D = dynamic(() => import("../ui/Globe3D").then(module => module.Globe3D), { ssr: false, loading: () => <div className={styles.globePlaceholder} /> });
const uses = [
  { title: "Customer Operations", subtitle: "Give your team the right context.", body: "Bring together customer history, help content, and incoming requests. Prepare answers with source context and route exceptions to the people who can resolve them.", steps: ["Incoming request", "Relevant knowledge", "Reviewed response"], aim: "More time resolving problems. Less time finding context." },
  { title: "Revenue Operations", subtitle: "Make the handoffs work harder.", body: "Connect inbound requests, qualification rules, and your CRM. Prepare structured records, highlight missing information, and keep your team in control of consequential decisions.", steps: ["Inbound request", "Structured qualification", "Human-owned handoff"], aim: "A clearer picture of each opportunity and what happens next." },
  { title: "Internal Operations", subtitle: "Turn documents into decisions.", body: "Extract information from business documents, validate it against your rules, and flag uncertain results for review before updating the systems your team relies on.", steps: ["Business document", "Extraction & validation", "Approved system update"], aim: "Less repetitive re-entry. Clear ownership and a review trail." },
];

// Who owns each step: the pitch is that AI prepares and people stay in control.
const roles = ["CONTEXT IN", "AI PREPARES", "PEOPLE IN CONTROL"];
const icons = [FileText, GitBranch, UserRound];

export default function Ai({ numbered = true }: { numbered?: boolean }) {
  const [active, setActive] = useState(0);
  const [instant, setInstant] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const { seen, enhanced } = useAmbientPlayback(stage);
  const flow = useRef<HTMLDivElement>(null);
  const { running } = useAmbientPlayback(flow);
  const panelId = useId();
  const current = uses[active];
  return <section id="ai" className={"ai-section " + styles.section}>
    <div className="container">
      <header className={styles.heading}>
        <p className="eyebrow">{numbered && <span className="section-index">05 /</span>} PRACTICAL INTELLIGENCE</p>
        <h2>Put AI to work<br /><span className="muted">inside your business.</span></h2>
        <p className={styles.intro}>Connect your data, tools, and people.<br />Build intelligence around the work that matters.</p>
      </header>
      <div ref={stage} className={styles.stage}>
        <GoogleGeminiEffect />
        <div className={styles.source}><span>CONTEXT IN</span><strong>{current.steps[0]}</strong></div>
        <div className={styles.planet}>{seen && enhanced ? <Globe3D /> : <GlobePoster />}</div>
        <div className={styles.destination}><span>PEOPLE IN CONTROL</span><strong>{current.steps[2]}</strong></div>
      </div>
      <div className={styles.tabs} role="group" aria-label="AI use cases" data-instant={instant}>
        {uses.map((use, index) => <button key={use.title} ref={element => { buttons.current[index] = element; }}
          type="button" aria-pressed={index === active} aria-controls={panelId}
          onClick={event => { setInstant(event.detail === 0); setActive(index); }}
          onKeyDown={event => {
            let next: number | null = null;
            if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % uses.length;
            if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + uses.length - 1) % uses.length;
            if (event.key === "Home") next = 0;
            if (event.key === "End") next = uses.length - 1;
            if (next === null) return;
            event.preventDefault();
            setInstant(true);
            setActive(next);
            buttons.current[next]?.focus();
          }}>
          <span>{String(index + 1).padStart(2, "0")}</span><span>{use.title}</span><ArrowUpRight size={17} />
        </button>)}
      </div>
      <div id={panelId} className={styles.detail} aria-live="polite" aria-atomic="true">
        <div className={styles.copy}>
          <h3>{current.subtitle}</h3>
          <p>{current.body}</p>
          <div className={styles.outcome}><span>OUTCOME</span><p>{current.aim}</p></div>
        </div>
        <div ref={flow} className={styles.flow} data-running={running} data-instant={instant}>
          <ol key={active} className={styles.workflow} aria-label={current.title + " workflow"}>
            {current.steps.map((step, index) => {
              const Icon = icons[index];
              return <li key={step} style={{ "--i": index } as CSSProperties}>
                <span className={styles.node} aria-hidden="true"><Icon size={18} />{index === 2 && <span className={styles.badge}><Check size={10} strokeWidth={3} /></span>}</span>
                <span className={styles.stepText}><span className={styles.role}>{roles[index]}</span><span className={styles.stepName}>{step}</span></span>
                <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              </li>;
            })}
          </ol>
          <p className={styles.guard}><ShieldCheck size={16} aria-hidden="true" />Human oversight. Clear evaluation. Deliberate rollout.</p>
        </div>
      </div>
      <div className={styles.footer}>
        <Link href="/capabilities#ai-automation" className={styles.explore}>Explore AI & automation <ArrowUpRight size={17} /></Link>
        <p className={styles.note}>Illustrative workflows, shaped to your systems and operating requirements.</p>
      </div>
    </div>
  </section>;
}