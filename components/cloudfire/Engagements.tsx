import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import styles from "./Editorial.module.css";
const offers = [
  { title: "Discovery & direction", for: "An idea that needs a clear first step.", body: "Define the business problem, map the critical journeys and choose a technical direction.", output: "A focused scope and acceptance criteria." },
  { title: "A focused product release", for: "A website, application or workflow to ship.", body: "Bring design and engineering together around a defined release, with review points throughout the build.", output: "Working software and an agreed handover." },
  { title: "Evolution & support", for: "A live product ready for its next chapter.", body: "Improve an existing experience, connect another system or strengthen the platform beneath it.", output: "A practical plan for the next improvement." },
];
export const faqs = [
  { question: "What kinds of projects do you take on?", answer: "Websites, web and mobile products, AI-assisted business workflows, systems integration and cloud platforms. We begin with the business problem and agree a focused scope together." },
  { question: "Can you improve a product that already exists?", answer: "Yes. We can start with the current product, understand its constraints and plan the next release around the parts that need to change." },
  { question: "How is the timeline decided?", answer: "We agree a delivery plan after understanding the scope, integrations and review requirements. The plan identifies milestones, dependencies and what is included in the first release." },
  { question: "What do you need to get started?", answer: "A description of the problem, who the product is for, the systems it needs to connect with and what a useful result would look like. If the scope is still unclear, we can define it together." },
  { question: "What happens after launch?", answer: "Handover, operational responsibilities and any continuing support are agreed as part of the project. We can also plan the next release around feedback from real usage." },
  { question: "Do we need AI for our project?", answer: "Only when it helps the work. We consider ordinary automation alongside AI and use human review where a decision needs oversight." },
];
export default function Engagements({ compact = false }: { compact?: boolean }) {
  return <section className={"container section " + styles.engagements} id="engagements" aria-labelledby="engagements-heading">
    <div className={"section-heading " + styles.engagementHeading}><div><p className="eyebrow">HOW WE CAN WORK TOGETHER</p><h2 id="engagements-heading">A clear starting point.<br /><span className="muted">Room to build from there.</span></h2></div>
      {!compact && <Link href="/contact" className="text-link">Talk through your idea<ArrowUpRight size={17} aria-hidden="true" /></Link>}</div>
    {!compact && <div className={styles.offerGrid}>{offers.map((offer, index) => <article key={offer.title} className={styles.offer}>
      <span className="mono">0{index + 1}</span><h3>{offer.title}</h3><p className={styles.offerFor}>{offer.for}</p><p className={styles.offerBody}>{offer.body}</p><div className={styles.offerOutput}><span className="eyebrow">WHAT YOU LEAVE WITH</span><p>{offer.output}</p></div>
    </article>)}</div>}
    <div className={styles.faq}><header><p className="eyebrow">A FEW GOOD QUESTIONS</p><h3>Before we<br /><span className="muted">begin.</span></h3></header>
      <div className={styles.faqList}>{faqs.map(item => <details key={item.question}><summary>{item.question}<Plus size={17} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div>
    </div>
  </section>;
}
