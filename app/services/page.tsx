import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import FinalCta from "@/components/cloudfire/FinalCta";
import { servicePages } from "@/lib/services";
import { pageMetadata } from "@/lib/site";
import styles from "@/components/cloudfire/Editorial.module.css";
export const metadata = pageMetadata("Services", "Custom software, AI automation, cloud engineering and UI/UX design connected around your business.", "/services");
export default function Page() { return <><PageIntro label="CLOUDFIRE / SERVICES" title={<>The right expertise.<br /><span className="muted">Around the whole product.</span></>} description="Start with the business problem. Bring together the design, engineering and systems it needs." />
  <section className={"container section " + styles.serviceIndex}>{servicePages.map((item, i) => <Link href={"/services/" + item.slug} key={item.slug}>
    <span className="mono">0{i + 1}</span><h2>{item.title}</h2><p>{item.description}</p><span className="text-link">Explore the service<ArrowUpRight size={17} aria-hidden="true" /></span>
  </Link>)}</section><FinalCta /></>; }
