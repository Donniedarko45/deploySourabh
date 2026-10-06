# Website activation and verification

## Inbox delivery with Brevo

The form submits to /api/contact. The server validates the enquiry, rejects a filled honeypot, checks the request origin, and applies a bounded limit of six attempts per ten minutes per IP in each running server instance. The visitor's email is the reply-to address; the recipient and sender are controlled by server configuration. There is no budget field.

1. Verify the sending address/domain in Brevo.
2. Put a transactional API key in BREVO_API_KEY and the plain verified address in CONTACT_FROM_EMAIL. An SMTP key is a different credential.
3. Set CONTACT_TO_EMAIL if the recipient should differ from info@cloudfireitservices.com.
4. Set these privately in the hosting environment, or in an ignored .env.local file for local development. Never commit credentials.
5. Restart the local server or deploy with the settings. Send one genuine test through the form and verify it appears in the destination inbox and Brevo's transactional log.

An unconfigured form clearly states that online enquiries are unavailable. It cannot display a success message. Provider or network failure preserves the visitor's details and offers a retry. Success is displayed after Brevo accepts the message; this is not proof that a destination mail server has delivered it. Brevo's delivery logs provide that confirmation.

The same request ID and payload produce the same Brevo idempotency key on a retry. The provider's duplicate protection lasts 15 minutes; it does not replace monitoring.

For stronger spam filtering, optionally configure both Turnstile keys. Tokens are verified on the server, including action and hostname. An expired token is refreshed for a retry. Partial Turnstile configuration prevents delivery. The per-process limit is a secondary guard; for a multi-instance/serverless deployment also apply rate limits through the hosting platform.

Sources: [Brevo email API](https://developers.brevo.com/reference/send-transac-email), [Brevo idempotency](https://developers.brevo.com/changelog/2021/11/10), [Cloudflare server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Call booking

Set BOOKING_URL to the actual HTTPS Cal.com or Calendly event link. The contact page shows “Book a call” only when this is present and valid. No invented calendar or appointment availability is displayed.

## Website measurement

Create a website in Umami, then set NEXT_PUBLIC_UMAMI_WEBSITE_ID and, for a self-hosted installation, NEXT_PUBLIC_UMAMI_SCRIPT_URL. Rebuild after changing public settings.

Events cover contact and work links, study opens, booking clicks, enquiry start, attempt, success and failure. No name, company, email or message is included in event data. URL query and hash tracking are disabled. The tracker respects Do Not Track and Global Privacy Control. Analytics remain disabled without an ID, and privacy copy reflects whether analytics were included in the build.

Sources: [Umami configuration](https://docs.umami.is/docs/tracker-configuration), [event tracking](https://docs.umami.is/docs/track-events).

## Search and social previews

SITE_URL controls canonical links, the sitemap, robots and social URLs. Its default is the existing public www domain. Change it before deploying to a different permanent domain. Redirect-only legacy URLs and unpublished records are omitted from the sitemap.

The social image is rendered locally by Next.js as a 1200 × 630 PNG. Each content page has its own title, description and canonical URL. Searchable service pages and the four project studies appear in the sitemap.

## Performance and device checks

The 3D globe loads only after it is visible, on a wide screen with a precise pointer and an adequate device budget. Phones, reduced-motion and data-saving environments get a native SVG globe. The hero renderer starts after the poster loads and the browser has idle time, reusing the optimized poster texture. Low-capacity devices retain the static image.

Use the production build for speed measurements, rather than the development server. Lighthouse and WebKit checks are useful lab evidence, not actual Android or iPhone results. Run PageSpeed Insights against the newly deployed URL once it serves this version. On a real mid-range Android and iPhone, verify initial load, scroll, keyboard entry, validation, submission, retry, menu bounds and the footer controls.

## Useful checks

- node scripts/check-content.mjs
- node scripts/check-enquiries.mjs (uses mocked providers; sends no email)
- npx tsc --noEmit
- npm run lint
- npm run build
- node scripts/check-business-pages.mjs with Playwright installed or CLOUDFIRE_PLAYWRIGHT_MODULE pointing to its module. Set CLOUDFIRE_BASE_URL to a production preview and CLOUDFIRE_ENGINE=webkit for engine checks.

For the configured form UI test, use a private local production preview with a fake API key and sender. The test intercepts /api/contact to simulate failure and success; never use these fake settings on a live deployment. A real end-to-end inbox test still requires the owner's credentials.
