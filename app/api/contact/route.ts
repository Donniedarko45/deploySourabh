import { handleEnquiry } from "@/lib/contact-handler";
import { capabilities, contactEmail } from "@/lib/content";
import { timelines } from "@/lib/contact-options";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  return handleEnquiry(request, {
    config: {
      apiKey: process.env.BREVO_API_KEY, from: process.env.CONTACT_FROM_EMAIL,
      to: process.env.CONTACT_TO_EMAIL || contactEmail, siteUrl,
      turnstileSecret: process.env.TURNSTILE_SECRET_KEY,
      turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    },
    capabilities, timelines,
  });
}
