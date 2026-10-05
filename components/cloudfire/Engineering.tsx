import { Reveal } from "./Motion";
import ArchitectureDiagram from "./ArchitectureDiagram";
import styles from "./Engineering.module.css";

const principles = [
  { title: "Architecture with intent", detail: "Clear boundaries. Room to evolve." },
  { title: "Security by design", detail: "Protection built into every layer." },
  { title: "Observable systems", detail: "Understand what is happening." },
  { title: "Repeatable delivery", detail: "Ship confidently. Own what you build." },
];

export default function Engineering({ numbered = true }: { numbered?: boolean }) {
  return (
    <section id="engineering" className={`engineering-section section container ${styles.section}`} aria-labelledby="engineering-heading">
      <div className={`engineering-copy ${styles.copy}`}>
        <p className="eyebrow">
          {numbered && <span className="section-index">04 /</span>}
          ENGINEERING AT THE CORE
        </p>
        <Reveal>
          <h2 id="engineering-heading">Beautiful outside.<br /><span className="muted">Solid underneath.</span></h2>
        </Reveal>
        <p>Thoughtful architecture. Secure foundations.<br className={styles.desktopBreak} /> Systems built to grow with your product.</p>
        <ul className={styles.principles}>
          {principles.map(({ title, detail }, index) => (
            <li key={title}>
              <span className="mono">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </li>
          ))}
        </ul>
      </div>
      <ArchitectureDiagram />
      <p className={`eyebrow engineering-footnote ${styles.footnote}`}>DESIGNED FOR CHANGE. BUILT FOR OWNERSHIP.</p>
    </section>
  );
}
