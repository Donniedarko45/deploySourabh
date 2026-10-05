import Link from "next/link";

const items = [
  { number: "01", title: "Product engineering", id: "product-engineering" },
  { number: "02", title: "AI & automation", id: "ai-automation" },
  { number: "03", title: "Cloud & platform", id: "cloud-platform" },
  { number: "04", title: "Digital experience", id: "experience-growth" },
];

export default function CapabilityRail() {
  return (
    <nav className="discipline-strip container" aria-label="Explore capabilities">
      <span className="rail-label">BUILT AT THE INTERSECTION OF</span>
      {items.map(item => (
        <Link key={item.id} href={`/capabilities#${item.id}`}>
          <span className="rail-index mono">{item.number}</span>
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  );
}
