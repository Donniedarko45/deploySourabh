# CloudFire portfolio

A Next.js technology consultancy website for product engineering, practical AI, cloud platforms and digital product experience.

## Development

Use Node.js 22.18+ (Node 24 is supported).

- npm install
- npm run dev
- npm run lint
- npx tsc --noEmit
- node scripts/check-content.mjs
- node scripts/check-enquiries.mjs
- npm run build
- npm start

## Website configuration

Copy .env.example to an ignored .env.local file and set the required private values. The contact form uses Brevo's transactional API. The optional booking link and Umami analytics only appear when configured. See [website setup](docs/website-setup.md) for activation and verification.

The contact form has no budget field. The site makes no starting-price claim and has no founder block, as requested by the owner.

## Approved project evidence

lib/content.ts supplies projects, client perspectives, trust items and articles. Records require approval and provenance. Website roles were confirmed by the owner on 2026-10-06. The Headspace and Sephora records describe website delivery, not work on their broader products.

Four project studies live in lib/case-studies.ts, with detail pages under /work/. Their results describe observable delivered capabilities. Unknown timelines, performance metrics and client quotations are not invented. See [client proof](docs/client-proof.md) for the facts still needed and a testimonial request draft.

The old company's demo awards, fabricated outcomes, testimonials and low-cost pricing are not served. Company and earlier marketing URLs remain redirects. Unknown study, service and article routes return a 404.

## Design and motion

Instrument Sans, Inter and IBM Plex Mono are served through Next.js font optimization. Bespoke CloudFire artwork and optimized assets live in design/ and public/brand/.

Desktop projects use steady layered browser frames with crossfades. The phone hero hides the project deck and raises the cloud artwork behind the copy. A WebGL treatment starts after the poster loads and reuses that optimized image. Phones use a light vector globe in the AI section; the 3D component is deferred on suitable desktop devices.

The architecture diagram and AI paths explain connected systems. The footer signature has a slow continuous orange outline. Ember has gentle breathing, blinking, gaze and flame movement and no Hide control. The footer motion setting, reduced-motion preferences, page visibility and intersection checks control playback. Hover movement is restricted to precise pointers and touch scrolling remains native.

Aceternity adaptations are documented in [component attribution](components/ui/README.md).

## Verification

Enquiry tests mock providers and send no email. Business-page browser checks cover layouts, metadata, SEO files, form failure/retry/success and lightweight rendering. Set CLOUDFIRE_BASE_URL, CLOUDFIRE_PLAYWRIGHT_MODULE and optionally CLOUDFIRE_ENGINE=webkit for the test environment. Physical Android/iPhone checks and a real inbox delivery test require the actual deployed configuration.
