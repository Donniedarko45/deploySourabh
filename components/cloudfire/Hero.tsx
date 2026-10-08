import { ProjectLink } from "./Motion";
import styles from "./Hero.module.css";
import HeroVisual from "./HeroVisual";
import HeroStack, { type StackCard } from "./HeroStack";
import { liveProjectCount, projects, publishableProjects } from "@/lib/content";

// The deck shows real, published projects only. Each has a 16:10 crop in public/work/hero.
const deckSlugs = ["modulx", "death-wish-coffee", "101-blockchains", "kleenly"];
const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export default function Hero() {
  const live = publishableProjects(projects);
  const cards: StackCard[] = deckSlugs.flatMap(slug => {
    const project = live.find(p => p.slug === slug);
    return project ? [{ slug, title: project.title, host: hostOf(project.url), src: `/work/hero/${slug}.jpg` }] : [];
  });
  return (
    <section className={"hero container " + styles.hero} aria-labelledby="hero-title">
      <div className="hero-grid">
        <div className="hero-content">
          {/* Phones only: a line of proof above the headline (on larger screens the deck carries it). */}
          <p className={"eyebrow " + styles.status}><span className="orange-dot" />{liveProjectCount} PRODUCTS LIVE · INDIA · UK · US</p>
          <h1 id="hero-title">
            <span className="line-mask"><span>Products that ship.</span></span>
            <span className="line-mask muted"><span>Systems that last<span className="accent">.</span></span></span>
          </h1>
          <p className="hero-copy">
            We design and engineer websites, apps and platforms, and put AI to work where it pays off.
            Shipped for brands across India, the UK and the US.
          </p>
          <div className="hero-actions">
            <ProjectLink magnetic={false} />
            <ProjectLink href="/work" secondary magnetic={false}>Explore Our Work</ProjectLink>
          </div>
        </div>
        <div className="hero-art">
          <HeroVisual>
            {cards.length > 0 && <HeroStack cards={cards} />}
          </HeroVisual>
        </div>
      </div>
    </section>
  );
}
