"use client";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { workflow } from "@/lib/content";
import { Reveal } from "./Motion";
export default function Workflow() {
  const [step, setStep] = useState(0);
  return <section className="positioning-section"><div className="container positioning-grid">
    <div className="sticky-heading"><p className="eyebrow"><span className="section-index">03 /</span> THE WAY WE WORK</p><Reveal><h2>Not another<br />development<br /><span className="accent">vendor.</span></h2></Reveal></div>
    <div className="positioning-content"><p className="large-copy">Your ambition.<br />Our shared responsibility.</p><p>CloudFire works as an extension of your product team. We connect business decisions with technical decisions, challenge assumptions early, and build with the people who will use and own the product.</p><p>Clear communication. Thoughtful tradeoffs. Working software you can review. A partnership built around what happens after launch.</p>
      <div className="workflow" aria-label="Our delivery process">{workflow.map((item,index)=><button key={item.title} aria-pressed={step===index} onClick={()=>setStep(index)}><span className="mono">0{index+1}</span>{item.title}{index<workflow.length-1&&<ArrowRight size={13}/>}</button>)}</div>
      <div className="workflow-detail" aria-live="polite"><span className="eyebrow accent">0{step+1} / {workflow[step].title.toUpperCase()}</span><p>{workflow[step].body}</p><span className="mono">OUTPUT — {workflow[step].output}</span></div>
      <Link className="text-link" href="/company">Meet your technology partner <ArrowUpRight size={16}/></Link>
    </div>
  </div></section>;
}
