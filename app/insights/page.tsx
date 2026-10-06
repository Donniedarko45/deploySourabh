import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import FinalCta from "@/components/cloudfire/FinalCta";
import { insights } from "@/lib/content";
import { pageMetadata } from "@/lib/site";
import styles from "@/components/cloudfire/Editorial.module.css";
export const metadata = pageMetadata("Insights", "Practical perspectives on custom software, business AI workflows and cloud systems from CloudFire.", "/insights");
export default function Page() { return <><PageIntro label="PERSPECTIVES / STRATEGY & ENGINEERING" title={<>Better questions.<br /><span className="muted">Better decisions.</span></>} description="Practical thinking for the moments that shape a product. What to build, where AI helps and how to make systems easier to own." />
  <section className={"container " + styles.insightsGrid} aria-label="Articles">{insights.map((item, i) => <Link key={item.slug} href={"/insights/" + item.slug} className={styles.insightCard + (i === 0 ? " " + styles.featured : "")}>
    {i === 0 && <div className={styles.insightArt} aria-hidden="true"><svg viewBox="0 0 400 240" fill="none"><path d="M20 50H95Q135 50 135 90V150Q135 190 180 190H380M20 120H380M20 190H95Q135 190 135 150V90Q135 50 180 50H380" stroke="#ff5a36" strokeWidth="1.5" /><circle cx="200" cy="120" r="44" fill="#171513" stroke="#8f6e50" /><circle cx="200" cy="120" r="28" stroke="#ff5a36" strokeDasharray="3 8" /><circle cx="200" cy="120" r="7" fill="#ff5a36" />{[50,120,190].map(y => <circle key={y} cx="25" cy={y} r="4" fill="#c7c3b8" />)}</svg></div>}
    <div><div className={styles.meta}><span className="eyebrow">{item.category}</span><span className="mono">{Math.max(1, Math.ceil(item.paragraphs.join(" ").split(/\s+/).length / 200))} MIN READ</span></div><h2>{item.title}</h2><p>{item.summary}</p><span className={styles.read}>Read the perspective<ArrowUpRight size={17} aria-hidden="true" /></span></div>
  </Link>)}</section><FinalCta /></>; }
