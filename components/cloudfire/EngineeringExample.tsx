"use client";
import { useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, FileText, GitBranch, Send } from "lucide-react";
import Link from "next/link";

const stages = [
  { title: "Capture", label: "A clear starting point", heading: "One request. All the context.", body: "Bring requirements, documents and ownership into one place. Validate what is missing before work moves forward.", decision: "Start with a shared data model and explicit validation rules.", icon: FileText,
    rows: [["Request", "A new customer onboarding"], ["Context", "Requirements and supporting files"], ["Owner", "A named operations reviewer"]] },
  { title: "Review", label: "Automation with a boundary", heading: "Assist the work. Keep people in control.", body: "Extract useful information, flag gaps and prepare a recommendation. A person reviews exceptions and approves the next action.", decision: "Use AI where interpretation helps; keep approval explicit.", icon: GitBranch,
    rows: [["Extract", "Structure information from documents"], ["Check", "Surface missing or conflicting details"], ["Approve", "A person confirms the next action"]] },
  { title: "Deliver", label: "A traceable handoff", heading: "Connect the action to the outcome.", body: "Send the approved data to the right system. Record the result, handle failed requests and make the history visible to the team.", decision: "Design retries, monitoring and ownership before launch.", icon: Send,
    rows: [["Connect", "Pass approved data to the business system"], ["Recover", "Retry safely or flag for attention"], ["Record", "Keep a history of changes and decisions"]] },
];

export default function EngineeringExample() {
  const [active, setActive] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const stage = stages[active];
  const Icon = stage.icon;
  return <div className="engineering-example">
    <div className="example-caption"><span className="eyebrow accent">ILLUSTRATIVE WORKFLOW</span><span>Customer onboarding · An example, not a client case study</span></div>
    <div className="example-layout">
      <div className="example-intro"><p className="eyebrow">THE BUSINESS PROBLEM</p><h3>Too many handoffs.<br /><span className="muted">Too little visibility.</span></h3><p>A request arrives by email. Documents live elsewhere. Progress depends on someone chasing the next person.</p><p>Here is how product engineering, AI and cloud infrastructure can turn that into one connected workflow.</p><Link href="/contact" className="text-link">Map your workflow with us<ArrowUpRight size={17}/></Link></div>
      <div className="example-explorer">
        <div className="example-controls" role="group" aria-label="Explore the example workflow">
          {stages.map((item, index) => <button key={item.title} ref={element => { buttons.current[index] = element; }} aria-pressed={active === index} aria-controls="example-detail" onClick={event => { setKeyboard(event.detail === 0); setActive(index); }} onKeyDown={event => {
            let next: number | undefined;
            if(event.key === "ArrowRight") next = (index + 1) % stages.length;
            if(event.key === "ArrowLeft") next = (index + stages.length - 1) % stages.length;
            if(event.key === "Home") next = 0;
            if(event.key === "End") next = stages.length - 1;
            if(next !== undefined) { event.preventDefault(); setKeyboard(true); setActive(next); buttons.current[next]?.focus(); }
          }}><span className="mono">0{index + 1}</span>{item.title}<ArrowRight size={15}/></button>)}
        </div>
        <div id="example-detail" className="example-detail" role="region" aria-label="Workflow explanation" aria-live="polite" aria-atomic="true">
          <m.div key={active} initial={{opacity: active === 0 || reduce || keyboard ? 1 : .35}} animate={{opacity: 1}} transition={{duration: reduce || keyboard ? 0 : .2}}>
            <div className="example-stage-heading"><Icon size={24} strokeWidth={1.25}/><span className="eyebrow">{stage.label}</span></div>
            <h4>{stage.heading}</h4>
            <div className="example-rows">{stage.rows.map(([label, value], index) => <m.div key={label} className="example-row" initial={{opacity: active === 0 || reduce || keyboard ? 1 : .25}} animate={{opacity:1}} transition={{duration: reduce || keyboard ? 0 : .2, delay: reduce || keyboard ? 0 : index * .05}}><Check size={14}/><span>{label}</span><p>{value}</p></m.div>)}</div>
            <p className="example-body">{stage.body}</p>
            <p className="example-decision"><span className="eyebrow">ENGINEERING DECISION</span>{stage.decision}</p>
          </m.div>
        </div>
        <span className="example-hint mono">SELECT A STEP TO EXPLORE THE HANDOFF</span>
      </div>
    </div>
  </div>;
}
