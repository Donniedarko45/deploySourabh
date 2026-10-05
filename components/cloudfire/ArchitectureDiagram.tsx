"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Cloud, Code2, Database, Layers3, Monitor, Smartphone, type LucideIcon } from "lucide-react";
import styles from "./Engineering.module.css";
import { useSiteMotion } from "./SiteMotion";

// Each packet follows the same orthogonal route as its wire, then rests before the next request.
const connections = [
  { name: "web", path: "M140 90V120H300V156", delay: 0 },
  { name: "mobile", path: "M460 90V120H300V156", delay: 0.25 },
  { name: "edge", path: "M300 220V284", delay: 1.65 },
  { name: "services", path: "M180 320H140V420", delay: 2.75 },
  { name: "data", path: "M420 320H460V420", delay: 2.75 },
  { name: "servicesCloud", path: "M140 490V550", delay: 4.15 },
  { name: "dataCloud", path: "M460 490V550", delay: 4.15 },
] as const;

function Node({ x, y, width = 220, height = 70, label, icon: Icon, delay, primary = false }: {
  x: number; y: number; width?: number; height?: number; label: string; icon: LucideIcon; delay: number; primary?: boolean;
}) {
  return (
    <g className={primary ? `${styles.node} ${styles.primary}` : styles.node}>
      <rect className={styles.nodeSurface} x={x} y={y} width={width} height={height} rx="7" />
      <rect className={styles.nodeHighlight} x={x} y={y} width={width} height={height} rx="7" style={{ animationDelay: `${delay}s` }} />
      <Icon x={x + 25} y={y + (height - 26) / 2} size={26} strokeWidth={1.5} className={styles.nodeIcon} aria-hidden="true" />
      <text className={styles.nodeLabel} x={x + 70} y={y + height / 2} dominantBaseline="middle">{label}</text>
      {primary && <circle cx={x + width - 24} cy={y + height / 2} r="4" className={styles.apiIndicator} />}
    </g>
  );
}

export default function ArchitectureDiagram() {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const { paused } = useSiteMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.15 });
    const updateVisibility = () => setTabVisible(!document.hidden);
    observer.observe(element);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  return (
    <figure ref={ref} className={styles.diagram} data-playing={onScreen && tabVisible && !paused}>
      <div className={styles.diagramHeading}><span className="orange-dot" />FROM INTERFACE TO INFRASTRUCTURE</div>
      <svg className={styles.svg} viewBox="0 0 600 610" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <title id={`${id}-title`}>Every layer, considered</title>
        <desc id={`${id}-description`}>Web and mobile requests pass through the edge to the API, which connects services and data. Cloud infrastructure supports the whole system. This is an illustrative architecture, not live traffic.</desc>
        <g className={styles.wires} fill="none" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
          <path className={styles.foundation} d="M300 356V550" />
          {connections.map(({ name, path }) => <path key={name} d={path} />)}
        </g>
        <g aria-hidden="true">
          {connections.map(({ name, delay }) => (
            <g key={name} className={`${styles.packet} ${styles[name]}`} style={{ animationDelay: `${delay}s` } as CSSProperties}>
              <circle r="7" className={styles.packetHalo} />
              <circle r="3" />
            </g>
          ))}
        </g>
        <Node x={30} y={20} label="WEB" icon={Monitor} delay={0} />
        <Node x={350} y={20} label="MOBILE" icon={Smartphone} delay={0.25} />
        <Node x={190} y={156} height={64} label="EDGE" icon={Layers3} delay={1.55} />
        <Node x={180} y={284} width={240} height={72} label="API" icon={Code2} delay={2.65} primary />
        <Node x={30} y={420} label="SERVICES" icon={Layers3} delay={4.05} />
        <Node x={350} y={420} label="DATA" icon={Database} delay={4.05} />
        <g className={styles.cloud}>
          <rect className={styles.nodeSurface} x="30" y="550" width="540" height="60" rx="7" />
          <rect className={styles.nodeHighlight} x="30" y="550" width="540" height="60" rx="7" style={{ animationDelay: "5.2s" }} />
          <Cloud x="134" y="567" size={26} strokeWidth={1.5} className={styles.nodeIcon} aria-hidden="true" />
          <text className={styles.cloudLabel} x="180" y="580" dominantBaseline="middle">CLOUD INFRASTRUCTURE</text>
        </g>
        <g className={styles.junctions} aria-hidden="true">
          <circle cx="140" cy="90" r="3" /><circle cx="460" cy="90" r="3" />
          <circle cx="300" cy="156" r="3" /><circle cx="300" cy="220" r="3" />
          <circle cx="140" cy="420" r="3" /><circle cx="460" cy="420" r="3" />
          <circle cx="140" cy="550" r="3" /><circle cx="460" cy="550" r="3" />
        </g>
      </svg>
      <figcaption className={styles.diagramFooter}>
        <span>Every layer, considered.</span>
      </figcaption>
    </figure>
  );
}
