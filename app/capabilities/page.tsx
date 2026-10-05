import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import { CapabilityDrawing } from "@/components/cloudfire/Capabilities";
import { capabilities } from "@/lib/content";
import Engineering from "@/components/cloudfire/Engineering";
import Ai from "@/components/cloudfire/Ai";
import FinalCta from "@/components/cloudfire/FinalCta";
export const metadata:Metadata={title:"Capabilities",description:"Connected product engineering, AI automation, cloud platforms and digital product experience."};
export default function Page(){return <><PageIntro label="OUR CAPABILITIES" title={<>Strategy meets<br/><span className="muted">shipping.</span></>} description="A product is more than an interface. Bring strategy, design and engineering together with a partner who can see the whole system."/><div className="container">{capabilities.map((item,index)=><section className="capability-detail" id={item.id} key={item.id}><div><p className="eyebrow accent">{item.number} / {item.label}</p><h2>{item.title}</h2><p>{item.description}</p><Link href={`/contact?capability=${item.id}`} className="text-link">Discuss your project<ArrowUpRight size={16}/></Link></div><div><CapabilityDrawing index={index}/><div className="deliverables"><h3>What we work on</h3><ul>{item.items.map(text=><li key={text}>{text}</li>)}</ul><p className="capability-deliverable">{item.deliverable}</p></div></div></section>)}</div><Engineering/><Ai/><FinalCta/></>}
