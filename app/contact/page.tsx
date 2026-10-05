import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import ContactForm from "@/components/cloudfire/ContactForm";
import { contactEmail } from "@/lib/content";
export const metadata:Metadata={title:"Start a project"};
export default function Page(){return <><PageIntro label="LET’S BUILD WHAT’S NEXT" title={<>Bring us your<br/><span className="muted">ambitious idea.</span></>} description="A new product. A system that needs to evolve. A workflow ready for a better way. Tell us where you want to go."/><section className="container contact-grid"><aside className="contact-aside"><h2>A conversation<br/>is a good place<br/><span className="accent">to start.</span></h2><p>Share the business challenge, the people it affects, and what a useful result would look like. We’ll have the context to explore the right next step together.</p><a href={`mailto:${contactEmail}`}>{contactEmail}<ArrowUpRight size={14}/></a><p className="mono">PREFER EMAIL? WRITE TO US DIRECTLY.</p></aside><Suspense fallback={<p>Loading the project brief…</p>}><ContactForm/></Suspense></section></>}
