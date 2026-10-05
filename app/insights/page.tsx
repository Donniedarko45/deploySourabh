import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import FinalCta from "@/components/cloudfire/FinalCta";
import { insights } from "@/lib/content";
export const metadata:Metadata={title:"Insights"};
export default function Page(){return <><PageIntro label="PERSPECTIVES / STRATEGY & ENGINEERING" title={<>Better questions.<br/><span className="muted">Better decisions.</span></>} description="Practical thinking on building digital products, putting AI to work, and making systems easier to own."/><section className="container section" aria-label="Articles">{insights.map(item=><Link className="insight-row" key={item.slug} href={`/insights/${item.slug}`}><p className="eyebrow">{item.category}</p><div><h2>{item.title}</h2><p>{item.summary}</p></div><ArrowUpRight size={25}/></Link>)}</section><FinalCta/></>}
