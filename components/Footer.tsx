import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import FooterWordmark from "@/components/cloudfire/FooterWordmark";
import Brand from "@/components/cloudfire/Brand";
import { MotionSetting } from "@/components/cloudfire/SiteMotion";
import { contactEmail, linkedIn } from "@/lib/content";

const explore = [{ title: "Capabilities", href: "/capabilities" }, { title: "Work", href: "/work" }, { title: "Services", href: "/services" }, { title: "Industries", href: "/industries" }, { title: "Insights", href: "/insights" }];
const disciplines = ["Product engineering", "AI & automation", "Cloud & DevOps", "UI/UX design", "Web & mobile apps", "Design systems"];

export default function Footer() {
  return <footer className="site-footer">
    {/* Decorative. Two identical runs, so the band loops seamlessly at -50%. */}
    <div className="footer-ticker" aria-hidden="true"><div className="footer-ticker-track">
      {[0, 1].map(run => <span key={run}>{disciplines.map(item => <span key={item}>{item}<i>✦</i></span>)}</span>)}
    </div></div>
    <div className="container">
      <div className="footer-grid">
        <div className="footer-intro">
          <Brand />
          <p className="footer-tagline">Product thinking.<br /><span>Engineering depth.</span></p>
          <p className="footer-reach"><span className="orange-dot" />Working across India · UK · US</p>
        </div>
        <nav className="footer-col" aria-label="Footer">
          <p className="eyebrow">EXPLORE</p>
          <ul>{explore.map((link, index) => <li key={link.href}><Link href={link.href}><span className="mono">0{index + 1}</span>{link.title}</Link></li>)}</ul>
        </nav>
        <div className="footer-col">
          <p className="eyebrow">CONNECT</p>
          <ul>
            <li><Link href="/contact">Start a project<ArrowUpRight size={16} aria-hidden="true" /></Link></li>
            <li><a href={linkedIn} target="_blank" rel="noopener noreferrer">LinkedIn<ArrowUpRight size={16} aria-hidden="true" /></a></li>
            <li><Link href="/privacy">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <a className="footer-mail" href={`mailto:${contactEmail}`}>
        <span className="eyebrow"><span className="orange-line" />LET’S MAKE WHAT’S NEXT</span>
        <span className="footer-mail-address">{contactEmail}<ArrowUpRight aria-hidden="true" /></span>
      </a>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} CloudFire IT Services</span>
        <span className="footer-actions"><MotionSetting /><a href="#main-content" className="footer-up">Back to top<ArrowUp size={15} aria-hidden="true" /></a></span>
      </div>
    </div>
    <div className="footer-signature"><FooterWordmark /></div>
  </footer>;
}
