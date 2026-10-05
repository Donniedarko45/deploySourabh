"use client";
import { useId, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { capabilities } from "@/lib/content";
const drawingSteps = [
  ["User journey", "Product logic", "Connected systems"],
  ["Your context", "AI assistance", "Human review"],
  ["Versioned code", "Repeatable delivery", "Visible operations"],
  ["Research", "Prototype", "Validate"],
];
// Milliseconds at which each caption is reached. The drawing and the caption share these beats,
// so the picture and the words always tell the same story in the same order.
const beats = [[0, 600, 1150], [0, 640, 1260], [0, 400, 800], [0, 560, 1120]];

// Per-element timing for the choreography in globals.css (see "Capability drawings").
type Vars = Record<string, string | number>;
const css = (t: number, d?: number, vars: Vars = {}) => ({ "--t": `${t}ms`, ...(d ? { "--d": `${d}ms` } : {}), ...vars }) as React.CSSProperties;
const draw = (t: number, d = 600) => ({ "data-a": "draw", pathLength: 1, style: css(t, d) });
const fade = (t: number, d = 400) => ({ "data-a": "fade", style: css(t, d) });
const rise = (t: number, d = 560) => ({ "data-a": "rise", style: css(t, d) });
const ring = (t: number) => ({ "data-a": "ring", style: css(t, 700) });
const dot = (t: number, d: number, [x0, y0]: number[], [x1, y1]: number[]) =>
  ({ "data-a": "dot", style: css(t, d, { "--x0": `${x0}px`, "--y0": `${y0}px`, "--x1": `${x1}px`, "--y1": `${y1}px` }) });

// Each scene draws its final artwork in three beats. A moving dot always rides the head of the line that is drawing.
function Product() {
  const [a, b, c] = beats[0];
  return <g>
    <circle {...draw(a, 320)} cx="65" cy="116" r="5" stroke="#FF5A36" />
    <path {...draw(a + 120, 360)} d="M70 116H133" stroke="#FF5A36" />
    <circle {...dot(a + 120, 360, [70, 116], [133, 116])} r="3.5" fill="#FF5A36" />
    <rect {...draw(a + 300, 720)} x="133" y="27" width="254" height="176" rx="5" stroke="#555" />
    <path {...draw(a + 520, 480)} d="M133 56H387M195 56V203" stroke="#555" />
    <circle {...fade(a + 760)} cx="148" cy="42" r="2" fill="#FF5A36" />
    <circle {...fade(a + 820)} cx="158" cy="42" r="2" fill="#555" />
    <path {...draw(b, 420)} d="M210 80H364" stroke="#888" />
    <path {...draw(b + 70, 420)} d="M210 102H305" stroke="#888" />
    <path {...draw(b + 140, 420)} d="M210 124H337" stroke="#888" />
    <rect {...fade(b + 300, 420)} x="210" y="147" width="67" height="32" rx="3" fill="#FF5A36" fillOpacity=".13" />
    <rect {...draw(b + 280, 480)} x="210" y="147" width="67" height="32" rx="3" stroke="#FF5A36" />
    <path {...draw(b + 440, 560)} d="m306 151-10 11 10 11m25-22 10 11-10 11m-15 9 8-39" stroke="#FF9D42" strokeWidth="2" />
    <path {...draw(c, 360)} d="M387 116H450" stroke="#FF5A36" />
    <circle {...dot(c, 360, [387, 116], [450, 116])} r="3.5" fill="#FF5A36" />
    <circle {...draw(c + 300, 320)} cx="455" cy="116" r="5" stroke="#FF5A36" />
    <circle {...ring(c + 560)} cx="455" cy="116" r="5" stroke="#FF5A36" />
  </g>;
}
function Intelligence() {
  const [a, b, c] = beats[1];
  return <g>
    <rect {...draw(a, 450)} x="60" y="95" width="40" height="40" rx="5" stroke="#666" />
    <rect {...draw(a + 90, 450)} x="240" y="12" width="40" height="40" rx="5" stroke="#666" />
    <rect {...draw(a + 180, 450)} x="240" y="178" width="40" height="40" rx="5" stroke="#666" />
    <path {...draw(a + 250, 500)} d="M100 115H220" stroke="#FF5A36" />
    <circle {...dot(a + 250, 500, [100, 115], [220, 115])} r="3.5" fill="#FF5A36" />
    <path {...draw(a + 330, 360)} d="M260 52V75" stroke="#FF5A36" />
    <circle {...dot(a + 330, 360, [260, 52], [260, 75])} r="3.5" fill="#FF5A36" />
    <path {...draw(a + 410, 360)} d="M260 178V155" stroke="#FF5A36" />
    <circle {...dot(a + 410, 360, [260, 178], [260, 155])} r="3.5" fill="#FF5A36" />
    <circle {...fade(a + 520)} cx="165" cy="115" r="3" fill="#FF9D42" />
    <rect {...fade(b + 220, 520)} x="220" y="75" width="80" height="80" rx="14" fill="#FF5A36" fillOpacity=".07" />
    <rect {...draw(b, 560)} x="220" y="75" width="80" height="80" rx="14" stroke="#FF5A36" />
    <path {...draw(b + 320, 480)} d="m243 115 12-16 21 16-21 16-12-16Z" stroke="#FF9D42" />
    <rect {...ring(b + 640)} x="220" y="75" width="80" height="80" rx="14" stroke="#FF5A36" />
    <path {...draw(c, 500)} d="M300 115H420" stroke="#FF5A36" />
    <circle {...dot(c, 500, [300, 115], [420, 115])} r="3.5" fill="#FF5A36" />
    <circle {...fade(c + 250)} cx="350" cy="115" r="3" fill="#FF9D42" />
    <rect {...draw(c + 380, 450)} x="420" y="95" width="40" height="40" rx="5" stroke="#666" />
    <path {...draw(c + 700, 380)} d="m431 115 6 6 11-12" stroke="#FF9D42" strokeWidth="2" />
    <rect {...ring(c + 760)} x="420" y="95" width="40" height="40" rx="5" stroke="#FF9D42" />
  </g>;
}
function Platform() {
  const [a, b, c] = beats[2];
  const layers = [0, 1, 2].map(i => ({ y: 50 + i * 40, hot: i === 1, start: [a, b, c][i] }));
  return <g>
    {layers.map(({ y, hot, start }) => <g key={y} {...rise(start, 520)}>
      <path d={`M145 ${y} 260 ${y - 35} 375 ${y} 260 ${y + 35}Z`} stroke={hot ? "#FF5A36" : "#666"} fill={hot ? "#FF5A360D" : "#111111"} />
      <path d={`M145 ${y}V${y + 17}L260 ${y + 52} 375 ${y + 17}V${y}`} stroke={hot ? "#FF5A36" : "#444"} />
    </g>)}
    <circle {...dot(c + 300, 480, [260, 24], [260, 205])} r="3.5" fill="#FF5A36" />
    <path {...draw(c + 560, 200)} d="M260 182V213" stroke="#FF5A36" />
    <path {...draw(c + 640, 360)} d="M260 205H180" stroke="#FF5A36" />
    <path {...draw(c + 640, 360)} d="M260 205H340" stroke="#FF5A36" />
    <circle {...ring(c + 780)} cx="260" cy="205" r="5" stroke="#FF5A36" />
  </g>;
}
function Experience() {
  const [a, b, c] = beats[3];
  return <g>
    <rect {...draw(a, 640)} x="139" y="35" width="120" height="160" rx="6" stroke="#777" />
    <rect {...fade(a + 300)} x="153" y="49" width="92" height="75" rx="3" fill="#ffffff" fillOpacity=".03" />
    <circle {...draw(a + 340, 500)} cx="199" cy="85" r="20" stroke="#FF5A36" />
    <path {...draw(a + 520, 380)} d="M153 145H240" stroke="#777" />
    <path {...draw(a + 590, 380)} d="M153 158H222" stroke="#777" />
    <path {...draw(a + 660, 380)} d="M153 171H204" stroke="#777" />
    <rect {...draw(b, 640)} x="269" y="66" width="110" height="129" rx="6" stroke="#FF5A36" />
    <path {...draw(b + 420, 380)} d="M284 141H365" stroke="#777" />
    <path {...draw(b + 490, 380)} d="M284 156H345" stroke="#777" />
    <path {...draw(c, 640)} d="m297 113 16-16 12 10 25-26" stroke="#FF9D42" strokeWidth="2" />
    <circle {...fade(c + 560, 240)} cx="350" cy="81" r="3.5" fill="#FF9D42" />
    <circle {...ring(c + 600)} cx="350" cy="81" r="3.5" stroke="#FF9D42" />
  </g>;
}
const scenes = [Product, Intelligence, Platform, Experience];

export function CapabilityDrawing({ index, instant = false }: { index: number; instant?: boolean }) {
  const gridId = useId();
  const figure = useRef<HTMLElement>(null);
  // Plays once, when most of the drawing is on screen. A new figure mounts on every tab change, so it replays then.
  const playing = useInView(figure, { once: true, amount: 0.6 });
  const Scene = scenes[index];
  return <figure ref={figure} className="capability-figure" data-play={playing} data-instant={instant || undefined}>
    <svg viewBox="0 0 520 230" className={`capability-drawing drawing-${index}`} fill="none" aria-hidden="true">
      <defs><pattern id={gridId} width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" stroke="#ffffff" strokeOpacity=".04" /></pattern></defs>
      <rect width="520" height="230" fill={`url(#${gridId})`} />
      <Scene />
    </svg>
    <figcaption className="drawing-steps">{drawingSteps[index].map((step, i) => <span key={step} style={css(beats[index][i])}><span className="mono">0{i + 1}</span>{step}</span>)}</figcaption>
  </figure>;
}
export default function Capabilities() {
  const [active, setActive] = useState(0);
  // "pointer" earns the full entrance. "keyboard" is instant: arrowing through tabs shouldn't make anyone wait.
  const [mode, setMode] = useState<"idle" | "pointer" | "keyboard">("idle");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = capabilities[active];
  return <section id="capabilities" className="section container"><div className="section-heading"><div><p className="eyebrow"><span className="section-index">02 /</span> CAPABILITIES</p><h2>One partner.<br /><span className="muted">The whole picture.</span></h2></div><p>Strategy, experience and engineering.<br />Connected from day one.</p></div>
    <div className="capabilities-grid"><div><div className="capability-tabs" role="tablist" aria-label="Our capabilities" aria-orientation="vertical">
      {capabilities.map((item,index) => <button key={item.id} id={`tab-${item.id}`} ref={element => { refs.current[index] = element; }} role="tab" aria-selected={active===index} aria-controls="capability-panel" tabIndex={active===index?0:-1} onClick={event => { setMode(event.detail === 0 ? "keyboard" : "pointer"); setActive(index); }}
        onKeyDown={event => { const offsets: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, ArrowRight: 1, ArrowLeft: -1 }; let next: number | undefined; if (event.key in offsets) next=(index+offsets[event.key]+capabilities.length)%capabilities.length; if(event.key==="Home")next=0;if(event.key==="End")next=capabilities.length-1; if(next!==undefined){event.preventDefault();setMode("keyboard");setActive(next);refs.current[next]?.focus();} }}>
        <span className="mono">{item.number}</span><span>{item.title}</span><span className="tab-icon" aria-hidden="true"><Plus className="icon-plus" size={18}/><ArrowUpRight className="icon-arrow" size={21}/></span>
      </button>)}
      </div><Link href={`/capabilities#${current.id}`} className="text-link all-capabilities">Explore {current.title} <ArrowUpRight size={16}/></Link>
    </div>
    <div className="capability-panel" id="capability-panel" role="tabpanel" aria-labelledby={`tab-${current.id}`} tabIndex={0}>
      <div key={active} className="capability-body" data-enter={mode === "pointer" || undefined}>
        <CapabilityDrawing index={active} instant={mode === "keyboard"}/><p className="eyebrow accent">{current.label}</p><h3>{current.headline}</h3><p>{current.description}</p><ul className="capability-services">{current.items.map(item=><li key={item}>{item}</li>)}</ul><div className="capability-outcome"><span className="eyebrow">WHAT YOU LEAVE WITH</span><p>{current.deliverable}</p></div>
      </div>
    </div>
  </div></section>;
}
