import { pageMetadata } from "@/lib/site";
import Engagements from "@/components/cloudfire/Engagements";
import Hero from "@/components/cloudfire/Hero";
import Work, { ClientStory } from "@/components/cloudfire/Work";
import Capabilities from "@/components/cloudfire/Capabilities";
import Workflow from "@/components/cloudfire/Workflow";
import Engineering from "@/components/cloudfire/Engineering";
import Ai from "@/components/cloudfire/Ai";
import FinalCta from "@/components/cloudfire/FinalCta";
import AsciiWorld from "@/components/cloudfire/AsciiWorld";

export const metadata = pageMetadata("Product Engineering, AI & Cloud", "CloudFire designs and builds websites, applications, business AI workflows and dependable cloud platforms.", "/");
export default function Home() {
  return <><AsciiWorld /><Hero /><Work /><Capabilities /><Workflow /><Engineering /><Ai /><ClientStory /><Engagements /><FinalCta /></>;
}
