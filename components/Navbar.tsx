"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Brand from "@/components/cloudfire/Brand";
const links = [{ title: "Capabilities", href: "/capabilities" }, { title: "Work", href: "/work" }, { title: "Industries", href: "/industries" }, { title: "Insights", href: "/insights" }];
export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 32);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const close = () => { if (menu.current) menu.current.open = false; };
  return <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
    <div className="nav-inner"><Brand /><nav className="desktop-nav" aria-label="Main navigation">
      {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.title}</Link>)}
    </nav><Link href="/contact" className="nav-cta" aria-label="Start a Project"><span className="nav-cta-label">Start a Project</span> <ArrowUpRight size={16} /></Link>
    <details className="mobile-nav" ref={menu} onKeyDown={event => { if (event.key === "Escape") { close(); menu.current?.querySelector("summary")?.focus(); } }}>
      <summary aria-label="Navigation menu"><Menu className="menu-open" size={23} /><X className="menu-close" size={23} /></summary>
      <nav aria-label="Mobile navigation">{links.map(link => <Link key={link.href} href={link.href} onClick={close} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.title}<ArrowUpRight size={18} /></Link>)}
        <Link href="/contact" onClick={close}>Start a Project <ArrowUpRight size={18} /></Link>
      </nav>
    </details></div>
  </header>;
}
