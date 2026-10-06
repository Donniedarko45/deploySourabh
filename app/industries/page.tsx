import Link from "next/link";
import { ArrowUpRight, Blocks, BookOpen, ShoppingBag, Workflow } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import FinalCta from "@/components/cloudfire/FinalCta";
import { pageMetadata } from "@/lib/site";
import styles from "@/components/cloudfire/Editorial.module.css";
export const metadata = pageMetadata("Industries", "Product engineering and practical automation for commerce, learning, financial products and enterprise operations.", "/industries");
const contexts = [
  { title: "Financial products", body: "Make complex information understandable and the systems beneath it dependable.", items: ["Customer and operational interfaces", "Service integrations and data workflows", "Access controls and auditability"], service: "product-engineering", Icon: Blocks },
  { title: "Commerce & customer platforms", body: "Connect the customer journey with the systems that make the business work.", items: ["Storefronts and product experiences", "Order and customer system integration", "Customer operations automation"], service: "experience-growth", Icon: ShoppingBag },
  { title: "Learning & knowledge platforms", body: "Help people find the right information, understand it and put it to work.", items: ["Learning and publishing experiences", "Knowledge retrieval and content workflows", "Administration and reporting tools"], service: "ai-automation", Icon: BookOpen },
  { title: "Enterprise operations", body: "Turn fragmented processes into systems your teams can understand and own.", items: ["Internal tools and business platforms", "Document and process automation", "Platform modernization and integration"], service: "cloud-platform", Icon: Workflow },
];
export default function Page() { return <><PageIntro label="BUSINESS CONTEXT MATTERS" title={<>Built around your<br /><span className="muted">business reality.</span></>} description="Different contexts. Different constraints. The same attention to the people, processes and systems that matter." />
  <section className={"container " + styles.industryGrid} aria-label="Where our capabilities can help">{contexts.map((item, i) => <article key={item.title} className={styles.industryCard}>
    <header><span className="mono">0{i + 1} / BUSINESS CONTEXT</span><item.Icon size={26} strokeWidth={1.3} aria-hidden="true" /></header><h2>{item.title}</h2><p>{item.body}</p>
    <ul>{item.items.map(text => <li key={text}>{text}</li>)}</ul><Link href={"/services/" + item.service} className="text-link">Explore the relevant service<ArrowUpRight size={17} aria-hidden="true" /></Link>
  </article>)}</section><div className={"container " + styles.industryNote}><p>Your industry may be different. The starting point is still the problem, the constraints and what a useful result looks like.</p><Link href="/contact" className="text-link">Talk through your context<ArrowUpRight size={17} aria-hidden="true" /></Link></div><FinalCta /></>; }
