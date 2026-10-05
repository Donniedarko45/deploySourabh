import Hero from "@/components/cloudfire/Hero";
import Work, { Trust, ClientStory } from "@/components/cloudfire/Work";
import Capabilities from "@/components/cloudfire/Capabilities";
import CapabilityRail from "@/components/cloudfire/CapabilityRail";
import Workflow from "@/components/cloudfire/Workflow";
import Engineering from "@/components/cloudfire/Engineering";
import Ai from "@/components/cloudfire/Ai";
import FinalCta from "@/components/cloudfire/FinalCta";

export default function Home() {
  return <><Hero /><Trust /><CapabilityRail /><Work /><Capabilities /><Workflow /><Engineering /><Ai /><ClientStory /><FinalCta /></>;
}
