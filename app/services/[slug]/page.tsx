import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import FinalCta from "@/components/cloudfire/FinalCta";
import { capabilities } from "@/lib/content";
import { servicePages } from "@/lib/services";
import { pageMetadata } from "@/lib/site";
import styles from "@/components/cloudfire/Editorial.module.css";
const legacy: Record<string, string> = { "app-development": "product-engineering", "web-development": "product-engineering", "software-solutions": "product-engineering", "social-media-mgmt": "experience-growth", "digital-marketing": "experience-growth", "ui-ux-design": "experience-growth" };
export function generateStaticParams() { return servicePages.map(item => ({ slug: item.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const item = servicePages.find(item => item.slug === slug);
  return pageMetadata(item?.title || "Services", item?.description || "Explore CloudFire’s services.", "/services/" + slug);
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (legacy[slug]) redirect("/capabilities#" + legacy[slug]);
  const item = servicePages.find(item => item.slug === slug);
  const capability = capabilities.find(value => value.id === item?.capability);
  if (!item || !capability) notFound();
  return <><PageIntro label={item.title.toUpperCase()} title={item.headline} description={item.description} />
    <section className={"container " + styles.serviceBody}>
      <div className={styles.serviceIntro}><div><p className="eyebrow">WHEN THIS IS THE RIGHT FIT</p><h2>Begin with<br /><span className="muted">what needs to change.</span></h2></div><ul>{item.needs.map(text => <li key={text}><span className="orange-dot" />{text}</li>)}</ul></div>
      <div className={styles.serviceGrid}><div><p className="eyebrow">WHAT WE DO</p><h2>{capability.title}</h2><p>{capability.description}</p><ul>{capability.items.map(text => <li key={text}>{text}</li>)}</ul>
        <Link href={"/contact?capability=" + capability.id} className="button button-primary">Discuss your project<ArrowUpRight size={17} aria-hidden="true" /></Link></div>
        <ol>{item.process.map((text, i) => <li key={text}><span className="mono">0{i + 1}</span><p>{text}</p></li>)}</ol></div>
      <div className={styles.serviceOutcome}><p className="eyebrow">WHAT YOU LEAVE WITH</p><p>{capability.deliverable}</p></div>
      <Link href="/services" className="text-link">Explore all services<ArrowUpRight size={17} aria-hidden="true" /></Link>
    </section><FinalCta /></>;
}
