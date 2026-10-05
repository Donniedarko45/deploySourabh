import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Brand from "@/components/cloudfire/Brand";
import { contactEmail, linkedIn } from "@/lib/content";
export default function Footer() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-top"><div><Brand /><p>Product thinking.<br />Engineering depth.</p></div>
      <div className="footer-links"><Link href="/capabilities">Capabilities</Link><Link href="/work">Work</Link><Link href="/company">Company</Link><Link href="/contact">Contact</Link></div>
      <div className="footer-contact"><span className="eyebrow">LET’S MAKE WHAT’S NEXT.</span><a href={`mailto:${contactEmail}`}>{contactEmail}<ArrowUpRight size={16} /></a><a href={linkedIn} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={14} /></a></div>
    </div><div className="footer-wordmark" aria-hidden="true">cloudfire<span>.</span></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} CloudFire IT Services</span><span>Infrastructure + energy. Precision + progress.</span><Link href="/privacy">Privacy</Link></div>
  </div></footer>;
}
