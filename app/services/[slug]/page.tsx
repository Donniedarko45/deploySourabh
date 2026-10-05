import { notFound, redirect } from "next/navigation";
const destinations:Record<string,string>={"app-development":"product-engineering","web-development":"product-engineering","software-solutions":"product-engineering","social-media-mgmt":"experience-growth","digital-marketing":"experience-growth","ui-ux-design":"experience-growth"};
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const destination=destinations[slug];if(!destination)notFound();redirect("/capabilities#"+destination)}
