"use client";
import { useEffect, useRef, useState } from "react";

type Item = { id: string; number: string; title: string };

/** Sticky chapter navigation for a long page: it follows the reader, and the chapter they are in is marked. */
export default function CapabilityNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0].id);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = items.map(item => document.getElementById(item.id)).filter((el): el is HTMLElement => !!el);
    // A chapter counts as current once it crosses the upper-middle of the screen.
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach(section => io.observe(section));
    return () => io.disconnect();
  }, [items]);

  // On a phone the row scrolls sideways; keep the current chapter in view.
  useEffect(() => {
    const row = track.current;
    const link = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!row || !link || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: link.offsetLeft - (row.clientWidth - link.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  return <nav className="chapter-nav" aria-label="Capabilities on this page">
    <div className="container chapter-nav-inner" ref={track}>
      {items.map(item => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "true" : undefined}><span className="mono">{item.number}</span>{item.title}</a>)}
    </div>
  </nav>;
}
