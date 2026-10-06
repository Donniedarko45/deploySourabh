import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { clientStories, trustItems, liveProjectCount, projects, publishableProjects, publishableStories, publishableTrust, type Project } from "@/lib/content";
import EngineeringExample from "./EngineeringExample";
import proofStyles from "./WorkProof.module.css";
export function Trust() {
 const records=publishableTrust(trustItems);if(!records.length)return null;
 return <section className="trust container" aria-label="Selected clients"><span className="eyebrow">IN GOOD COMPANY</span>{records.map(record=><span key={record.name}>{record.logo?<Image src={record.logo} alt={record.name} width={130} height={40}/>:record.name}</span>)}</section>;
}
const external = { target: "_blank", rel: "noopener noreferrer" } as const;
const isRepo = (url: string) => new URL(url).hostname === "github.com";
const hostOf = (url: string) => { const u = new URL(url); return u.hostname.replace(/^www\./, "") + (isRepo(url) ? u.pathname.replace(/\/$/, "") : ""); };
const actionFor = (url: string) => (isRepo(url) ? "View the repository" : "Visit the live site");
const labelFor = (project: Project) => `${actionFor(project.url)}: ${project.title} (opens in a new tab)`;
type Featured = Project & { image: NonNullable<Project["image"]> };

// A browser window onto the real page. On hover the page scrolls through itself, slowly in and quickly back;
// --pan is how far the screenshot travels and --pan-ms how long the trip takes (both derived from its height).
function ProjectCard({ project, number, lead }: { project: Featured; number: string; lead: boolean }) {
  const { image } = project;
  const pan = Math.max(0, 1 - (image.width * 0.625) / image.height); // the window is 16:10
  return <article className={`project ${lead ? "project-lead" : ""}`}>
    <a className="project-frame" href={project.url} {...external} tabIndex={-1} aria-hidden="true"
      style={{ "--pan": `${(-pan * 100).toFixed(2)}%`, "--pan-ms": `${Math.round(2600 + pan * 5200)}ms` } as React.CSSProperties}>
      <span className="frame-bar"><i /><i /><i /><span className="frame-url">{hostOf(project.url)}</span></span>
      <span className="frame-view"><Image src={image.src} alt="" width={image.width} height={image.height} sizes={lead ? "(max-width: 900px) 100vw, 58vw" : "(max-width: 900px) 100vw, 32vw"} /></span>
      <span className="frame-cta">{actionFor(project.url)}<ArrowUpRight size={15} /></span>
    </a>
    <div className="project-meta">
      <p className="eyebrow"><span className="section-index">{number}</span>{project.industry}</p>
      <h3>{project.title}</h3>
      <p className="project-summary">{project.summary}</p>
      {project.role && <p className="project-fact"><span className="eyebrow">OUR ROLE</span>{project.role}</p>}
      {project.outcome && <p className="project-fact"><span className="eyebrow">OUTCOME</span>{project.outcome}</p>}
      <ul className="built-with" aria-label="Built with">{project.built.map(item => <li key={item}>{item}</li>)}</ul>
      <a className="text-link" href={project.url} {...external} aria-label={labelFor(project)}>{actionFor(project.url)}<ArrowUpRight size={16} /></a>
    </div>
  </article>;
}
function ProjectIndex({ items, start }: { items: Project[]; start: number }) {
  return <div className="project-more">
    <div className="project-more-head"><p className="eyebrow">MORE SHIPPED WORK</p><span className="mono">{items.length} PROJECTS</span></div>
    <ul className="project-index">{items.map((project, i) => <li key={project.slug}>
      <a href={project.url} {...external} aria-label={labelFor(project)}>
        <span className="mono pi-number">{String(start + i + 1).padStart(2, "0")}</span>
        <span className="pi-title"><strong>{project.title}</strong><span>{project.summary}</span></span>
        <span className="pi-industry">{project.industry}</span>
        <span className="pi-built">{project.built.join(" · ")}</span>
        <span className="pi-host mono">{hostOf(project.url)}<ArrowUpRight size={15} /></span>
      </a>
    </li>)}</ul>
  </div>;
}
export default function Work({ full = false }: { full?: boolean }) {
  const records = publishableProjects(projects);
  const clients = records.filter(project => !isRepo(project.url)).slice(0, 5);
  const featured = records.filter((project): project is Featured => !!project.featured && !!project.image);
  const more = records.filter(project => !featured.includes(project as Featured));
  return <section id="work" className={`section container work-section ${full ? "work-full" : ""}`}>
    <div className="section-heading"><div><p className="eyebrow"><span className="section-index">01 /</span> {records.length ? "SELECTED WORK" : "ENGINEERING IN PRACTICE"}</p><h2>{records.length ? <>Work you can open.<br /><span className="muted">Not just screenshots.</span></> : <>From scattered tasks.<br /><span className="muted">To a connected product.</span></>}</h2></div>{records.length > 0 && !full && <Link href="/work" className="text-link">See all {records.length} projects<ArrowUpRight size={16}/></Link>}</div>
    {clients.length > 0 && <div className={`work-proof ${proofStyles.proof}`}>
      <div className={proofStyles.clients}>
        <p className="eyebrow">SELECTED CLIENTS</p>
        <ul className={`work-proof-names ${proofStyles.names}`} aria-label="Selected clients">
          {clients.map(client => <li key={client.slug}>{client.title}</li>)}
        </ul>
      </div>
      <p className={proofStyles.count}><strong>{liveProjectCount}</strong><span>products in <br />production</span></p>
    </div>}
    {records.length ? <>
      {featured.length > 0 && <div className="project-grid">{featured.map((project, index) => <ProjectCard key={project.slug} project={project} number={String(index + 1).padStart(2, "0")} lead={index === 0} />)}</div>}
      {full && more.length > 0 && <ProjectIndex items={more} start={featured.length} />}
      {full && <div className="work-example"><EngineeringExample/></div>}
    </> : <EngineeringExample/>}
  </section>;
}
export function ClientStory() {
 const story=publishableStories(clientStories)[0];if(story)return <section className="client-story container section"><p className="eyebrow">06 / CLIENT PERSPECTIVE</p><h2>{story.title}</h2>{story.image&&<Image src={story.image} alt={story.client} width={1200} height={700}/>}<p className="large-copy">{story.story}</p>{story.quote&&<blockquote>“{story.quote}”</blockquote>}<p>{story.attribution} · {story.client}</p></section>;
 return null;
}
