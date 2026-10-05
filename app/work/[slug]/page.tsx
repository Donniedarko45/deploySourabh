import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PageIntro from "@/components/cloudfire/PageIntro";
import FinalCta from "@/components/cloudfire/FinalCta";
import { caseStudies, publishableCaseStudies } from "@/lib/content";
const getStudy=(slug:string)=>publishableCaseStudies(caseStudies).find(study=>study.slug===slug);
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;return {title:getStudy(slug)?.title??"Work"}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const study=getStudy(slug);if(!study)notFound();return <><PageIntro label={study.industry} title={study.title} description={study.challenge}/><div className="container section"><Image src={study.image} alt={study.imageAlt} width={1400} height={900} sizes="(max-width:700px) 100vw, 90vw"/><div className="study-info"><div><p className="eyebrow">THE CHALLENGE</p><p>{study.challenge}</p><div className="study-tags">{study.services.map(service=><span key={service}>{service}</span>)}</div></div><div><p className="eyebrow">THE SOLUTION</p><p>{study.solution}</p><p className="eyebrow">VERIFIED OUTCOME</p><p>{study.outcome}</p></div></div><Link href="/work" className="text-link">← Back to work</Link></div><FinalCta/></>}
