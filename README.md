# CloudFire

A Next.js technology consultancy website centered on product engineering, AI & automation, cloud platforms, and digital product experience.

## Development

Use Node.js 22.18+ (Node 24 is supported).

- `npm install`
- `npm run dev` — local development preview
- `npm run lint`
- `npx tsc --noEmit`
- `node scripts/check-content.mjs` — verify approval and completeness gates
- `npm run build`
- `npm start` — production preview

The previous site’s low-cost pricing, space theme, demo awards, fabricated outcomes, and testimonials are not served. Existing URLs redirect to the appropriate new pages. Unknown case-study and article URLs return a 404.

## Publishing real evidence

The content source is `lib/content.ts`. Customer stories and trust items start empty because no approved source material was supplied. Add only real, permissioned content. Set `verification.approved` to true and identify the source in `verification.source` only after review.

Work is a list of `projects`. Each one links to the real thing (a live site or a public repository) and states only what a visitor could verify there: a title, an industry line, a one-sentence summary, and what it is built with. A record requires a unique slug, title, industry, summary, an `https://` URL, at least one `built` entry, and approval provenance. `featured` projects (the first four lead the homepage) also need a screenshot under `public/work/`; the rest appear in the index on `/work`, so the list can grow to any length. `role` and `outcome` are optional and render when present: add them only when the team has confirmed what CloudFire actually did and can source any result. Never add a metric the source does not support.

Records for sites that belong to large companies (currently Headspace and Sephora) are present but unapproved. To publish one, add a `role` that states the real contribution and set `approved` to true. The tests in `scripts/check-content.mjs` keep them out until then.

A client story requires client name, title, narrative, attribution, and approval provenance. A quote is optional and must be attributable to the same approved source. Trust items require a real name and approval provenance. Empty sections do not show invented logos or claims in production.

The illustrative onboarding workflow (Capture, Review, Deliver) now sits at the bottom of `/work`, clearly labeled as an example that makes no client or performance claims. If the projects list is ever empty it becomes the work section's fallback again. Customer stories and trust sections stay hidden until approved records exist.

The company page has been removed (`/company` and the old `/about`, `/how-we-work` and `/why-choose-us` routes redirect to the homepage); the founder and team photographs remain in `public/team` for reuse. The insight articles are original editorial content, with no claimed customer results or fabricated publication dates.

## Project enquiries

The contact tool validates the input and prepares a reviewable project brief in the browser. The visitor then opens their email application, copies the text, or downloads a text file. Nothing is sent automatically and the form does not claim successful delivery. The existing business email and LinkedIn URL are centralized in `lib/content.ts`.

To enable direct website submissions later, connect a real server-side delivery service, add rate limiting and validation, and update the privacy information to describe that actual data flow. Do not replace the current behavior with a simulated success message.

## Design and motion

The visual system uses Instrument Sans, Inter and IBM Plex Mono, served locally by Next.js font optimization. The cloud-to-ember artwork is bespoke, generated for CloudFire; its editable source is in `design/`, and optimized WebP assets are in `public/brand/`. Next.js provides responsive image variants.

Framer Motion is loaded through LazyMotion for transitions. The desktop hero presents live projects in layered browser frames with steady placement and crossfades; it holds on hover or focus and provides numbered selectors. On phones the project deck is hidden and the cloud-and-fire artwork rises behind the copy. A lightweight WebGL treatment brings the artwork to life, with a static image fallback. The live-client proof rail sits in the work section.

The engineering diagram carries animated request signals through the system. The AI section combines a monochrome 3D globe with converging SVG paths, followed by selectable business workflows. Aceternity component adaptations and attribution are documented in components/ui/README.md. The footer signature has a continuous, slow orange contour animation. Ember, the cloud-and-fire companion, has subtle breathing, blinking, cursor-aware eyes and flame movement, and remains available throughout the site.

The footer's motion setting pauses ambient animations. Motion also honors reduced-motion preferences and pauses when off screen or when the tab is hidden, where applicable. Hover movement is restricted to precise pointer devices, and touch scrolling remains native. The capabilities page uses a sticky chapter navigation, and explanatory diagrams update immediately for keyboard selections. Native document scrolling and mobile disclosure navigation preserve straightforward navigation.

## Verification

The production build, ESLint, TypeScript, content-publishing tests, and browser checks cover desktop/mobile layout, keyboard capability selection, AI workflow switching, navigation, project-brief generation, and reduced motion. Local browser testing does not establish field Core Web Vitals or real-device touch behavior. Check the deployed site on physical iOS/Android devices before launch, and monitor real-user performance after deployment.
