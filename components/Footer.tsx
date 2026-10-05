import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import FooterWordmark from "@/components/cloudfire/FooterWordmark";
import Brand from "@/components/cloudfire/Brand";
import { MotionSetting } from "@/components/cloudfire/SiteMotion";
import { contactEmail, linkedIn } from "@/lib/content";
export default function Footer() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-top"><div><Brand /><p>Product thinking.<br />Engineering depth.</p></div>
      <div className="footer-links"><Link href="/capabilities">Capabilities</Link><Link href="/work">Work</Link><Link href="/contact">Contact</Link></div>
      <div className="footer-contact"><span className="eyebrow">LET’S MAKE WHAT’S NEXT.</span><a href={`mailto:${contactEmail}`}>{contactEmail}<ArrowUpRight size={16} /></a><a href={linkedIn} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={14} /></a></div>
    </div><div className="footer-signature"><FooterWordmark /><p>Considered from the first question.<br />Engineered for what comes next.</p></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} CloudFire IT Services</span><span>Product engineering · AI · Cloud</span><Link href="/privacy">Privacy</Link><MotionSetting /></div>
  </div></footer>;
}
