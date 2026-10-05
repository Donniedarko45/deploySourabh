import { Code2, Layers3, ShieldCheck, Activity, ArrowDown, ArrowUpRight } from "lucide-react";
import { Reveal } from "./Motion";
const layers = [{title:"Client",detail:"WEB · MOBILE",icon:Code2},{title:"Edge",detail:"DELIVERY · ROUTING",icon:Layers3},{title:"API",detail:"CONTRACTS · AUTHENTICATION",icon:Code2},{title:"Services",detail:"LOGIC · INTEGRATIONS",icon:Layers3},{title:"Data",detail:"STORAGE · INTEGRITY",icon:ShieldCheck},{title:"Cloud",detail:"INFRASTRUCTURE · OPERATIONS",icon:Activity}];
export default function Engineering() {
  return <section id="engineering" className="engineering-section section container"><div className="engineering-copy"><p className="eyebrow"><span className="section-index">04 /</span> ENGINEERING AT THE CORE</p><Reveal><h2>Built beyond<br /><span className="muted">the interface.</span></h2></Reveal><p>What people see is only the beginning. We give the systems underneath the same attention: the architecture, the data, the deployment, and the decisions that keep your product moving.</p><div className="engineering-principles">
    {["Architecture with intent","Security by design","Observable systems","Repeatable delivery"].map((text,index)=><div key={text}><span className="mono">0{index+1}</span><span>{text}</span><ArrowUpRight size={14}/></div>)}
  </div><span className="eyebrow engineering-footnote">DESIGNED FOR CHANGE. BUILT FOR OWNERSHIP.</span></div>
  <div className="architecture" aria-label="Reference architecture: Client to Edge to API to Services to Data to Cloud"><div className="architecture-top"><span className="orange-dot"/>SYSTEM ARCHITECTURE<span>REFERENCE MODEL</span></div>
    {layers.map((layer,index)=><div className="architecture-step" key={layer.title}><div className="architecture-node"><layer.icon size={18}/><span>{layer.title}</span><small>{layer.detail}</small><span className="node-status"/></div>{index<layers.length-1&&<div className="architecture-connector"><ArrowDown size={13}/><i style={{animationDelay:`${index*0.4}s`}}/></div>}</div>)}
    <div className="architecture-bottom"><span className="mono">INTENTIONAL AT EVERY LAYER</span><span>CF / SYSTEMS</span></div>
  </div></section>;
}
