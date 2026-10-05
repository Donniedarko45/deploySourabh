# CloudFire

A Next.js technology consultancy website centered on product engineering, AI & automation, cloud platforms, and digital product experience.

## Development

Use Node.js 22.18+ (Node 24 is supported).

- `npm install`
- `npm run dev` — local development with clearly labeled editorial placeholders
- `npm run lint`
- `npx tsc --noEmit`
- `node scripts/check-content.mjs` — verify approval and completeness gates
- `npm run build`
- `npm start` — production, without development placeholders

The previous site’s low-cost pricing, space theme, demo awards, fabricated outcomes, and testimonials are not served. Existing URLs redirect to the appropriate new pages. Unknown case-study and article URLs return a 404.

## Publishing real evidence

The content source is `lib/content.ts`. Case studies, customer stories and trust items start empty because no approved source material was supplied. Add only real, permissioned content. Set `verification.approved` to true and identify the source in `verification.source` only after review.

A case study requires a unique URL slug, title, industry, challenge, product screenshot, image description, services, solution, and a documented outcome. Store approved screenshots and logos locally under `public/` and use root-relative paths. The outcome can be qualitative; never add a metric unless the source supports it. Case-study detail pages resolve automatically from this source.

A client story requires client name, title, narrative, attribution, and approval provenance. A quote is optional and must be attributable to the same approved source. Trust items require a real name and approval provenance. Empty sections do not show invented logos or claims in production.

Development work and customer-story layouts are explicitly labeled as placeholders and guarded by `NODE_ENV === "development"`. Production shows a neutral project-discussion prompt while case studies are unavailable. The customer-story and trust sections stay hidden until approved records exist.

The company page uses the names, roles and photographs already supplied in the repository. The insight articles are original editorial content, with no claimed customer results or fabricated publication dates.

## Project enquiries

The contact tool validates the input and prepares a reviewable project brief in the browser. The visitor then opens their email application, copies the text, or downloads a text file. Nothing is sent automatically and the form does not claim successful delivery. The existing business email and LinkedIn URL are centralized in `lib/content.ts`.

To enable direct website submissions later, connect a real server-side delivery service, add rate limiting and validation, and update the privacy information to describe that actual data flow. Do not replace the current behavior with a simulated success message.

## Design and motion

The visual system uses Instrument Sans, Inter and IBM Plex Mono, served locally by Next.js font optimization. The cloud-to-ember artwork is bespoke, generated for CloudFire; its editable source is in `design/`, and optimized WebP assets are in `public/brand/`. Next.js provides responsive image variants.

Framer Motion is loaded through LazyMotion for transitions and subtle pointer depth. The homepage hero has a 28-second ambient breathing cycle that pauses outside the viewport or when the tab is hidden. Hero CTAs stay steady and use a 220ms arrow interaction. Native document scrolling replaces the former mandatory section snapping. Mobile gets a separate hero composition and native disclosure navigation. Motion honors reduced-motion preferences; hover movement is restricted to precise pointer devices.

## Verification

The production build, ESLint, TypeScript, content-publishing tests, and browser checks cover desktop/mobile layout, keyboard capability selection, AI workflow switching, navigation, project-brief generation, and reduced motion. Local browser testing does not establish field Core Web Vitals or real-device touch behavior. Check the deployed site on physical iOS/Android devices before launch, and monitor real-user performance after deployment.
