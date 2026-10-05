import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import { CapabilityDrawing } from "@/components/cloudfire/Capabilities";
import CapabilityNav from "@/components/cloudfire/CapabilityNav";
import { capabilities } from "@/lib/content";
import Engineering from "@/components/cloudfire/Engineering";
import Ai from "@/components/cloudfire/Ai";
import FinalCta from "@/components/cloudfire/FinalCta";
export const metadata: Metadata = { title: "Capabilities", description: "Connected product engineering, AI automation, cloud platforms and digital product experience." };
export default function Page() {
  return <>
    <PageIntro label="OUR CAPABILITIES" title={<>Strategy meets<br /><span className="muted">shipping.</span></>} description="A product is more than an interface. Bring strategy, design and engineering together with a partner who can see the whole system." />
    <div className="chapters">
      <CapabilityNav items={capabilities.map(({ id, number, title }) => ({ id, number, title }))} />
      <div className="container">
        {capabilities.map((item, index) => {
          const [first, second] = item.headline.split("\n");
          return <section className="chapter" id={item.id} key={item.id} data-flip={index % 2 === 1 || undefined} aria-labelledby={`${item.id}-title`}>
            <header className="chapter-head">
              <span className="chapter-number" aria-hidden="true">{item.number}</span>
              <p className="eyebrow accent">{item.title.toUpperCase()}</p>
              <h2 id={`${item.id}-title`}>{first}<br /><span className="muted">{second}</span></h2>
            </header>
            <div className="chapter-visual"><CapabilityDrawing index={index} /></div>
            <div className="chapter-body">
              <p className="chapter-lede">{item.description}</p>
              <ul className="chapter-services" aria-label={`What we do in ${item.title}`}>{item.items.map((text, i) => <li key={text}><span className="mono">0{i + 1}</span>{text}</li>)}</ul>
              <div className="chapter-outcome"><span className="eyebrow">WHAT YOU LEAVE WITH</span><p>{item.deliverable}</p></div>
              <Link href={`/contact?capability=${item.id}`} className="text-link">Discuss your project<ArrowUpRight size={16} /></Link>
            </div>
          </section>;
        })}
      </div>
    </div>
    <Engineering numbered={false} /><Ai numbered={false} /><FinalCta />
  </>;
}
