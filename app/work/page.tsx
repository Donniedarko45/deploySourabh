import { pageMetadata } from "@/lib/site";
import PageIntro from "@/components/cloudfire/PageIntro";
import Work from "@/components/cloudfire/Work";
import FinalCta from "@/components/cloudfire/FinalCta";
export const metadata = pageMetadata("Work", "Explore shipped CloudFire websites, commerce experiences and distributed systems, with short project studies.", "/work");
export default function Page(){return <><PageIntro label="WORK / PRODUCT, EXPERIENCE & SYSTEMS" title={<>Ideas into systems.<br/><span className="muted">Intent into impact.</span></>} description="The business challenge comes first. The product, the experience, and the systems behind it follow."/><Work full/><FinalCta/></>}
