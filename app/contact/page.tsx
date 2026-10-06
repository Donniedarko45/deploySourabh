import { Suspense } from "react";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import PageIntro from "@/components/cloudfire/PageIntro";
import ContactForm from "@/components/cloudfire/ContactForm";
import Engagements from "@/components/cloudfire/Engagements";
import { contactEmail } from "@/lib/content";
import { bookingUrl, pageMetadata } from "@/lib/site";
import styles from "@/components/cloudfire/Editorial.module.css";
export const metadata = pageMetadata("Start a Project", "Tell CloudFire about the website, product, AI workflow or cloud platform you want to build.", "/contact");
export const dynamic = "force-dynamic";
export default function Page() {
  const available = !!process.env.BREVO_API_KEY && !!process.env.CONTACT_FROM_EMAIL &&
    Boolean(process.env.TURNSTILE_SECRET_KEY) === Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const booking = bookingUrl();
  return <><PageIntro label="LET’S BUILD WHAT’S NEXT" title={<>A good idea.<br /><span className="muted">A real conversation.</span></>} description="Tell us what needs to change. We’ll help you find a clear, useful next step." />
    <section className={"container " + styles.contact}>
      <aside className={styles.contactAside}><p className="eyebrow">START WITH THE CHALLENGE</p><h2>Bring the ambition.<br /><span className="muted">We’ll bring the thinking.</span></h2>
        <p>A new product, a better website or a workflow that needs to work harder. You don’t need a finished brief to get in touch.</p>
        <ol className={styles.contactSteps}><li><span>01</span>Tell us about the problem and the people it affects.</li><li><span>02</span>We’ll explore the scope and the right first release.</li><li><span>03</span>Agree a delivery plan before the build begins.</li></ol>
        <a className={styles.contactEmail} href={"mailto:" + contactEmail}>{contactEmail}<ArrowUpRight size={16} aria-hidden="true" /></a>
        <div className={styles.booking}>{booking ? <><p>Prefer to talk it through?</p><a href={booking} target="_blank" rel="noopener noreferrer" className="text-link" data-analytics-event="book_call"><CalendarDays size={17} aria-hidden="true" />Book a call<ArrowUpRight size={16} aria-hidden="true" /></a></> : <p>Prefer a call? Mention it in your enquiry and we can arrange a time together.</p>}</div>
      </aside><Suspense fallback={<p>Loading the enquiry form…</p>}><ContactForm available={available} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} /></Suspense>
    </section><Engagements compact /></>;
}
