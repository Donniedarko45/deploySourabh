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

## Diagnosing a contact 503 on Vercel

A response saying the enquiry could not be sent means Brevo rejected the request or returned no valid message ID. It is distinct from the missing-settings response and the connection/timeout response. The browser headers and HTTP 503 alone do not identify the cause.

After the diagnostic update is deployed, failure responses contain a controlled code and request reference. In the Vercel project runtime logs, find /api/contact and the matching [contact] delivery_failed entry. Logs contain only the reference, category, provider HTTP status and a recognized provider error code. They exclude keys, email addresses, enquiry text and raw provider/error messages.

| Code | Check |
| --- | --- |
| EMAIL_NOT_CONFIGURED | Set BREVO_API_KEY and CONTACT_FROM_EMAIL for the Production environment, then redeploy. |
| EMAIL_CONFIGURATION_INVALID | Use plain sender/recipient addresses. Check the key for internal line breaks. |
| EMAIL_AUTHENTICATION_FAILED | Use an active Brevo transactional API key in Production. |
| EMAIL_IP_BLOCKED | Review the blocked request in Brevo API security. Authorize only the trusted server address; do not use the browser remote address from DevTools as the sending-server address. |
| EMAIL_SENDER_REJECTED | Verify the exact CONTACT_FROM_EMAIL in Brevo and its sending domain. |
| EMAIL_ACCOUNT_INACTIVE | Review transactional-email activation or account restrictions in Brevo. |
| EMAIL_QUOTA_EXCEEDED | Review Brevo sending credits/quota. |
| EMAIL_PERMISSION_DENIED | Review key/account permissions and API security settings. |
| EMAIL_CONTENT_REJECTED or EMAIL_REQUEST_REJECTED | Check the provider status/code in the matching log. The request includes both escaped HTML and plain text. |
| EMAIL_RATE_LIMITED or EMAIL_PROVIDER_UNAVAILABLE | Retry later and review Brevo service status. |
| EMAIL_TIMEOUT or EMAIL_CONNECTION_FAILED | Check Vercel-to-Brevo connectivity and retry; success has not been confirmed. |
| EMAIL_RESPONSE_INVALID | Brevo returned no valid message ID, so delivery cannot be confirmed. |
| SPAM_CHECK_NOT_CONFIGURED | Configure both Turnstile keys together, or remove both. |
| SPAM_CHECK_UNAVAILABLE, SPAM_CHECK_TIMEOUT or SPAM_CHECK_CONNECTION_FAILED | Review Turnstile availability/configuration and retry. |

Environment values are trimmed before use. Invalid sender/recipient formats fail before calling Brevo. Provider errors are categorized, not exposed verbatim. A failure never produces a visitor success message.

Sources: [Brevo sending request](https://developers.brevo.com/reference/send-transac-email), [sender and domain verification](https://developers.brevo.com/docs/getting-started-with-senders-and-domains), [API security](https://help.brevo.com/hc/en-us/articles/5740111683858-Authorize-and-block-IP-addresses-for-API-and-SMTP-security).
