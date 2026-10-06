import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import FinalCta from "@/components/cloudfire/FinalCta";
import { projects, publishableProjects } from "@/lib/content";
import { caseStudies, publishableCaseStudies } from "@/lib/case-studies";
import { pageMetadata } from "@/lib/site";
import styles from "@/components/cloudfire/Editorial.module.css";
const live = publishableProjects(projects);
const studies = publishableCaseStudies(caseStudies, live.map(item => item.slug));
export function generateStaticParams() { return studies.map(item => ({ slug: item.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const study = studies.find(item => item.slug === slug);
  return pageMetadata(study?.headline || "Project", study?.result || "Explore CloudFire’s shipped work.", "/work/" + slug);
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const study = studies.find(item => item.slug === slug);
  const project = live.find(item => item.slug === study?.projectSlug);
  if (!study || !project) notFound();
  return <>
    <PageIntro label={project.title + " / PROJECT STUDY"} title={study.headline} description={project.industry} />
    <section className={"container " + styles.caseBody}>
      <nav aria-label="Project navigation"><Link href="/work" className="text-link">All work<ArrowUpRight size={16} aria-hidden="true" /></Link>
        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-link">{new URL(project.url).hostname === "github.com" ? "Explore the source" : "Open the live project"}<ArrowUpRight size={16} aria-hidden="true" /></a></nav>
      {project.image && <div className={styles.caseImage}><Image src={project.image.src} alt={project.title + " project interface"} width={project.image.width} height={project.image.height} sizes="(max-width: 768px) 100vw, 88vw" /></div>}
      <div className={styles.caseGrid}>
        <aside className={styles.caseFacts}><p className="eyebrow">OUR ROLE</p><p>{study.role}</p><p className="eyebrow">BUILT WITH</p><ul>{project.built.map(item => <li key={item}>{item}</li>)}</ul>{study.timeline && <><p className="eyebrow">TIMELINE</p><p>{study.timeline}</p></>}</aside>
        <div>
          <div className={styles.caseChapter}><span className="eyebrow">01 / THE PROBLEM</span><h2>Start with the job<br /><span className="muted">the product needs to do.</span></h2><p>{study.problem}</p></div>
          <div className={styles.caseChapter}><span className="eyebrow">02 / WHAT WE BUILT</span><h2>The decisions<br /><span className="muted">behind the delivery.</span></h2>{study.approach.map(text => <p key={text}>{text}</p>)}<ul className={styles.delivered}>{study.delivered.map(text => <li key={text}><span className="orange-dot" />{text}</li>)}</ul></div>
          <div className={styles.caseChapter}><span className="eyebrow">03 / THE RESULT</span><h2>Something real.<br /><span className="muted">Ready to explore.</span></h2><p>{study.result}</p><a className="text-link" href={project.url} target="_blank" rel="noopener noreferrer">Explore {project.title}<ArrowUpRight size={17} aria-hidden="true" /></a></div>
        </div>
      </div>
    </section><FinalCta />
  </>;
}
