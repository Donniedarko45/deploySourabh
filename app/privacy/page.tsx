import PageIntro from "@/components/cloudfire/PageIntro";
import { contactEmail } from "@/lib/content";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("Privacy", "How CloudFire handles website enquiries and optional website analytics.", "/privacy");
export default function Page() {
  const analytics = !!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const turnstile = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return <><PageIntro label="WEBSITE INFORMATION" title={<>Your information.<br /><span className="muted">Handled with intent.</span></>} /><article className="article-body">
    <h2>Project enquiries</h2><p>When you submit an enquiry, we use your name, email, company and project details to respond and discuss your project. The form sends those details to our server and, when delivery is available, forwards them to our inbox through Brevo. They are not added to a marketing list by this form.</p>
    <p>The website does not maintain an enquiry database. Correspondence may be retained in our email services to handle the enquiry and any resulting work. Please avoid including confidential information in the initial message.</p>
    <h2>Spam protection</h2><p>The form checks submissions and limits repeated attempts. {turnstile ? "It also uses Cloudflare Turnstile, which processes technical browser information to help distinguish genuine visitors from automated submissions." : "The hosting provider may also process request information to protect and operate the website."}</p>
    <h2>Website measurement</h2><p>{analytics ? "We use Umami for aggregate website visits and events such as enquiry submissions and project-link clicks. Our event tracking does not include form contents, names or email addresses. URL search parameters are excluded, and the tracker respects browser Do Not Track and Global Privacy Control signals." : "Website analytics are currently disabled. The enquiry form does not add advertising trackers or analytics cookies."}</p>
    <p>External links, including LinkedIn and any call-booking service, follow the practices of those services.</p><h2>Contact</h2><p>For questions about information you have shared with CloudFire, contact <a className="text-link" href={"mailto:" + contactEmail}>{contactEmail}</a>.</p>
  </article></>;
}
