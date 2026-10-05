import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageIntro from "@/components/cloudfire/PageIntro";
import FinalCta from "@/components/cloudfire/FinalCta";
import { insights } from "@/lib/content";
export function generateStaticParams(){return insights.map(item=>({slug:item.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const article=insights.find(item=>item.slug===slug);return {title:article?.title??"Insight",description:article?.summary}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const article=insights.find(item=>item.slug===slug);if(!article)notFound();return <><PageIntro label={article.category} title={article.title} description={article.summary}/><article className="article-body">{article.paragraphs.map(text=><p key={text}>{text}</p>)}<Link className="text-link" href="/insights">← All perspectives</Link></article><FinalCta/></>}
