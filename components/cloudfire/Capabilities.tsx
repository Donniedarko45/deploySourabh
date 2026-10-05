"use client";
import { useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { capabilities } from "@/lib/content";
export function CapabilityDrawing({ index }: { index: number }) {
  return <svg viewBox="0 0 520 230" className={`capability-drawing drawing-${index}`} fill="none" aria-hidden="true">
    <defs><pattern id={`grid-${index}`} width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" stroke="#ffffff" strokeOpacity=".04" /></pattern></defs>
    <rect width="520" height="230" fill={`url(#grid-${index})`} />
    {index === 0 && <g><rect x="133" y="27" width="254" height="176" rx="5" stroke="#555" /><path d="M133 56H387M195 56V203" stroke="#555"/><circle cx="148" cy="42" r="2" fill="#FF5A36" /><circle cx="158" cy="42" r="2" fill="#555"/><path d="M210 80H364M210 102H305M210 124H337" stroke="#888" /><rect x="210" y="147" width="67" height="32" rx="3" fill="#FF5A36" fillOpacity=".13" stroke="#FF5A36"/><path d="m306 151-10 11 10 11m25-22 10 11-10 11m-15 9 8-39" stroke="#FF9D42" strokeWidth="2" /><path d="M70 116H133M387 116H450" stroke="#FF5A36"/><circle cx="65" cy="116" r="5" stroke="#FF5A36"/><circle cx="455" cy="116" r="5" stroke="#FF5A36"/></g>}
    {index === 1 && <g><path d="M100 115H220M300 115H420M260 35V75M260 155V195" stroke="#FF5A36"/><rect x="220" y="75" width="80" height="80" rx="14" stroke="#FF5A36"/><path d="m243 115 12-16 21 16-21 16-12-16Z" stroke="#FF9D42"/>{[[60,95],[420,95],[240,15],[240,195]].map(([x,y],i)=><rect key={i} x={x} y={y} width="40" height="40" rx="5" stroke="#666"/>)}<circle cx="165" cy="115" r="3" fill="#FF9D42"/><circle cx="350" cy="115" r="3" fill="#FF9D42"/></g>}
    {index === 2 && <g>{[0,1,2].map(i=><g key={i}><path d={`M145 ${50+i*40} 260 ${15+i*40} 375 ${50+i*40} 260 ${85+i*40}Z`} stroke={i===1?"#FF5A36":"#666"} fill={i===1?"#FF5A360D":"#111111"}/><path d={`M145 ${50+i*40}V${67+i*40}L260 ${102+i*40} 375 ${67+i*40}V${50+i*40}`} stroke={i===1?"#FF5A36":"#444"}/></g>)}<path d="M260 182V213M180 205H340" stroke="#FF5A36"/></g>}
    {index === 3 && <g><rect x="139" y="35" width="120" height="160" rx="6" stroke="#777"/><rect x="269" y="66" width="110" height="129" rx="6" stroke="#FF5A36"/><rect x="153" y="49" width="92" height="75" rx="3" fill="#ffffff" fillOpacity=".03"/><circle cx="199" cy="85" r="20" stroke="#FF5A36"/><path d="M153 145H240M153 158H222M153 171H204M284 141H365M284 156H345" stroke="#777"/><path d="m297 113 16-16 12 10 25-26" stroke="#FF9D42" strokeWidth="2"/></g>}
  </svg>;
}
export default function Capabilities() {
  const [active, setActive] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const current = capabilities[active];
  return <section id="capabilities" className="section container"><div className="section-heading"><div><p className="eyebrow"><span className="section-index">02 /</span> CAPABILITIES</p><h2>One partner.<br /><span className="muted">The whole picture.</span></h2></div><p>Strategy, experience and engineering.<br />Connected from day one.</p></div>
    <div className="capabilities-grid"><div className="capability-tabs" role="tablist" aria-label="Our capabilities" aria-orientation="vertical">
      {capabilities.map((item,index) => <button key={item.id} id={`tab-${item.id}`} ref={element => { refs.current[index] = element; }} role="tab" aria-selected={active===index} aria-controls="capability-panel" tabIndex={active===index?0:-1} onClick={() => { setKeyboard(false); setActive(index); }}
        onKeyDown={event => { const offsets: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, ArrowRight: 1, ArrowLeft: -1 }; let next: number | undefined; if (event.key in offsets) next=(index+offsets[event.key]+capabilities.length)%capabilities.length; if(event.key==="Home")next=0;if(event.key==="End")next=capabilities.length-1; if(next!==undefined){event.preventDefault();setKeyboard(true);setActive(next);refs.current[next]?.focus();} }}>
        <span className="mono">{item.number}</span><span>{item.title}</span>{active===index?<ArrowUpRight size={21}/>:<Plus size={18}/>}
      </button>)}
      <Link href="/capabilities" className="text-link all-capabilities">Explore our capabilities <ArrowUpRight size={16}/></Link>
    </div>
    <div className="capability-panel" id="capability-panel" role="tabpanel" aria-labelledby={`tab-${current.id}`} tabIndex={0}>
      <AnimatePresence mode="wait" initial={false}><m.div key={active} initial={{opacity:reduce||keyboard?1:0}} animate={{opacity:1}} exit={{opacity:reduce||keyboard?1:0}} transition={{duration:reduce||keyboard?0:0.16}}>
        <CapabilityDrawing index={active}/><p className="eyebrow accent">{current.label}</p><h3>{current.headline}</h3><p>{current.description}</p><div className="capability-tags">{current.items.map(item=><span key={item}>{item}</span>)}</div>
      </m.div></AnimatePresence>
    </div></div>
  </section>;
}
