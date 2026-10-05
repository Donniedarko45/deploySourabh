"use client";
import { useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Copy, Download } from "lucide-react";
import { capabilities, contactEmail } from "@/lib/content";
export default function ContactForm() {
 const query=useSearchParams(); const selected=capabilities.some(item=>item.id===query.get("capability"))?query.get("capability")!:"not-sure";
 const [draft,setDraft]=useState("");const [status,setStatus]=useState("");const draftRef=useRef<HTMLTextAreaElement>(null);
 const prepare=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();const data=new FormData(event.currentTarget);
  const topic=capabilities.find(item=>item.id===data.get("capability"))?.title??"Let’s define it together";
  const body=`Project enquiry\n\nName: ${data.get("name")}\nWork email: ${data.get("email")}\nCompany: ${data.get("company")}\nCapability: ${topic}\nBudget: ${data.get("budget")}\nTimeline: ${data.get("timeline")}\n\nThe challenge:\n${data.get("message")}`;
  setDraft(body);setStatus("Your brief is ready. Open an email draft below, or copy the brief into your preferred email app.");
 };
 const mailto=`mailto:${contactEmail}?subject=${encodeURIComponent("A project to build together — CloudFire")}&body=${encodeURIComponent(draft)}`;
 const copy=async()=>{try{await navigator.clipboard.writeText(draft);setStatus("Project brief copied. Paste it into an email to "+contactEmail+".");}catch{draftRef.current?.focus();draftRef.current?.select();setStatus("Select and copy the brief below, then email it to "+contactEmail+".");}};
 const download=()=>{const url=URL.createObjectURL(new Blob([draft],{type:"text/plain;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download="cloudfire-project-brief.txt";link.click();URL.revokeObjectURL(url);};
 return <form className="project-form" onSubmit={prepare}>
  <div className="form-pair"><label htmlFor="name">Your name *<input id="name" name="name" required autoComplete="name" placeholder="Your name" maxLength={150}/></label><label htmlFor="email">Work email *<input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" maxLength={254}/></label></div>
  <label htmlFor="company">Company *<input id="company" name="company" required autoComplete="organization" placeholder="Your company" maxLength={200}/></label>
  <label htmlFor="capability">What are you looking to build?<select id="capability" name="capability" defaultValue={selected}><option value="not-sure">Let’s define it together</option>{capabilities.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
  <div className="form-pair"><label htmlFor="budget">Indicative budget<select id="budget" name="budget"><option>Let’s discuss</option><option>$20k–$50k</option><option>$50k–$100k</option><option>$100k+</option></select></label><label htmlFor="timeline">When would you like to start?<select id="timeline" name="timeline"><option>Exploring possibilities</option><option>Within a month</option><option>In 1–3 months</option><option>Later this year</option></select></label></div>
  <label htmlFor="message">Tell us about the challenge *<textarea id="message" name="message" required minLength={20} maxLength={4000} rows={5} placeholder="What needs to change? What would success look like?"/></label>
  <p className="form-note">Preparing your brief does not send it. You’ll review and send it through your email app. Please leave out confidential information.</p>
  <button type="submit" className="button button-primary">Prepare project brief<ArrowUpRight size={17}/></button>
  <p className="form-status" role="status">{status}</p>
  {draft&&<div className="draft-panel"><h3>Your project, in focus.</h3><p>Review your brief, then send it to {contactEmail}. The email remains unsent until you send it from your email app.</p><label htmlFor="draft">Project brief<textarea id="draft" ref={draftRef} value={draft} readOnly rows={9}/></label><div className="draft-actions"><a className="button button-primary" href={mailto}>Open email draft<ArrowUpRight size={16}/></a><button type="button" onClick={copy}><Copy size={14} style={{display:"inline",marginRight:7}}/>Copy brief</button><button type="button" onClick={download}><Download size={14} style={{display:"inline",marginRight:7}}/>Save brief</button></div></div>}
 </form>;
}
