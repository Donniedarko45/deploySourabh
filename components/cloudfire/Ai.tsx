"use client";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, FileText, GitBranch, UserRound } from "lucide-react";
import Link from "next/link";
const uses = [
  { title:"Customer Operations", subtitle:"Give your team the right context.", body:"Bring together customer history, help content, and incoming requests. Prepare answers with source context and route exceptions to the people who can resolve them.", steps:["Incoming request","Relevant knowledge","Reviewed response"], aim:"Help teams spend more time resolving problems and less time finding context." },
  { title:"Revenue Operations", subtitle:"Make the handoffs work harder.", body:"Connect inbound requests, qualification rules, and your CRM. Prepare structured records, highlight missing information, and keep your team in control of consequential decisions.", steps:["Inbound request","Structured qualification","Human-owned handoff"], aim:"Give your team a clearer picture of each opportunity and what should happen next." },
  { title:"Internal Operations", subtitle:"Turn documents into decisions.", body:"Extract information from business documents, validate it against your rules, and flag uncertain results for review before updating the systems your team relies on.", steps:["Business document","Extraction & validation","Approved system update"], aim:"Reduce repetitive re-entry while keeping a review trail and clear ownership." },
];
export default function Ai() {
 const [active,setActive]=useState(0);const current=uses[active];
 return <section id="ai" className="ai-section"><div className="container"><div className="section-heading"><div><p className="eyebrow"><span className="section-index">05 /</span> PRACTICAL INTELLIGENCE</p><h2>Put AI to work<br /><span className="muted">inside your business.</span></h2></div><p>Start with the work.<br />Build intelligence around it.</p></div>
 <div className="ai-grid"><div className="ai-use-list">{uses.map((use,index)=><button key={use.title} aria-pressed={index===active} onClick={()=>setActive(index)}><span className="mono">0{index+1}</span><span>{use.title}</span><ArrowUpRight size={19}/></button>)}<p>Illustrative workflows. Shaped to your systems, data, and operating requirements.</p></div>
 <div className="ai-detail" aria-live="polite"><h3>{current.subtitle}</h3><p>{current.body}</p><div className="ai-flow">{current.steps.map((step,index)=><div key={step}>{index===0?<FileText size={21}/>:index===1?<GitBranch size={21}/>:<UserRound size={21}/>}<span>{step}</span>{index<2&&<ArrowRight className="flow-arrow" size={16}/>}</div>)}</div><div className="ai-review"><Check size={15}/><span>Human oversight. Clear evaluation. Deliberate rollout.</span></div><p className="ai-aim">{current.aim}</p><Link href="/capabilities#ai-automation" className="text-link">Explore AI & automation <ArrowUpRight size={16}/></Link></div></div></div></section>;
}
