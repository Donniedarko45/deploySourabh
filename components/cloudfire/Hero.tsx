import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { ProjectLink } from "./Motion";
import HeroVisual from "./HeroVisual";

export default function Hero() {
  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero-grid">
        <div className="hero-content">
          <p className="eyebrow hero-kicker">
            <span className="orange-line" />
            PRODUCT ENGINEERING · AI · CLOUD
          </p>
          <h1 id="hero-title">
            <span className="line-mask"><span>We engineer</span></span>
            <span className="line-mask"><span>digital products</span></span>
            <span className="line-mask muted"><span>that move businesses</span></span>
            <span className="line-mask hero-forward"><span>forward<span className="accent">.</span></span></span>
          </h1>
          <p className="hero-copy">
            We combine product strategy, design, AI and engineering to build
            software that performs in the real world—and keeps performing as
            your business grows.
          </p>
          <div className="hero-actions">
            <ProjectLink magnetic={false} />
            <ProjectLink href="/work" secondary magnetic={false}>Explore Our Work</ProjectLink>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <HeroVisual>
            <Image
              src="/brand/cloudfire-hero.webp"
              alt=""
              width={1200}
              height={800}
              priority
              sizes="(max-width: 599px) 420px, (max-width: 1099px) 40vw, (max-width: 1500px) 45vw, 576px"
              className="hero-sculpture"
            />
          </HeroVisual>
          <div className="art-caption">
            <span className="orange-dot" />
            CLOUD + FIRE
            <span>FIG. 001 — TRANSFORMATION</span>
          </div>
        </div>
      </div>
      <div className="hero-bottom">
        <a href="#work" className="scroll-cue"><ArrowDown size={15} />SCROLL TO EXPLORE</a>
        <span>STRATEGY → DESIGN → ENGINEERING</span>
        <span className="hero-bottom-note">From the first question.<br />To what comes next.</span>
      </div>
    </section>
  );
}
