import type { Metadata } from "next";
import PageIntro from "@/components/cloudfire/PageIntro";
import FinalCta from "@/components/cloudfire/FinalCta";
export const metadata:Metadata={title:"Industries"};
const contexts=[
 {title:"Financial products",body:"Clarity, careful data handling, and dependable operations for products people rely on.",items:["Customer & operational interfaces","Service integrations & data workflows","Access controls & auditability"]},
 {title:"Commerce & customer platforms",body:"Connect the customer journey with the systems that make the business work.",items:["Commerce experiences & product platforms","Order & customer system integration","Customer operations automation"]},
 {title:"Learning & knowledge platforms",body:"Make knowledge easier to access, navigate, and put to use.",items:["Learning management experiences","Knowledge retrieval & content workflows","Administration & reporting tools"]},
 {title:"Enterprise operations",body:"Bring fragmented workflows into systems your teams can understand and own.",items:["Internal tools & business platforms","Document & process automation","Platform modernization & integration"]}
];
export default function Page(){return <><PageIntro label="BUSINESS CONTEXT MATTERS" title={<>Built for your<br/><span className="muted">business reality.</span></>} description="Every industry has its own constraints. We begin with yours, then connect the right product, experience, and engineering decisions."/><section className="container section"><p className="eyebrow" style={{marginBottom:24}}>WHERE OUR CAPABILITIES CAN HELP</p>{contexts.map((item,index)=><div className="industry-row" key={item.title}><span className="mono">0{index+1}</span><div><h2>{item.title}</h2><p>{item.body}</p></div><ul>{item.items.map(text=><li key={text}>{text}</li>)}</ul></div>)}</section><FinalCta/></>}
