# CloudFire brand audit

Date: 2026-10-08. Prepared for the brand film "Beneath the Surface".

## How this audit was done

The live domain (`www.cloudfireitservices.com`) returns HTTP 403 from this session's network egress policy, so the public pages could not be visited directly. The audit uses the website's source repository (`Donniedarko45/deploySourabh`, branch `ccr-a65bde48-nlk3ow`, head `595f437`). The site was built (`next build`, Next.js 16.1.0) and served locally on port 3100. Then it was inspected with Playwright and Chromium at 1600 × 900. The pages inspected were `/`, `/work`, `/capabilities`, `/work/aegisstore` and `/work/modulx`.

`docs/verification.md` in the repository notes that "the public domain still served the former site at the time of this work". **The local build is therefore the current CloudFire design, but it may not be what the public domain serves today.** The film follows the repository, which is the approved, owner-maintained version.

## Positioning

| Element | Source copy |
| --- | --- |
| Primary line | "Products that ship. Systems that last." (hero H1, OG image alt) |
| Descriptor | "Product thinking. Engineering depth." (title, footer) |
| Offer | "We design and engineer websites, apps and platforms, and put AI to work where it pays off." |
| Engineering section | "Beautiful outside. Solid underneath." / "From interface to infrastructure." / "Every layer, considered." |
| AI section | "Put AI to work inside your business." / "Human oversight. Clear evaluation. Deliberate rollout." |
| Capabilities page | "A product is more than an interface. Bring strategy, design and engineering together with a partner who can see the whole system." |
| Footer | "Considered from the first question. Engineered for what comes next." |
| Closing CTA | "Have something ambitious to build?" / "Bring the challenge. We'll bring the thinking, the craft, and the code." |

The website already states the film's thesis. "Beautiful outside. Solid underneath." and "From interface to infrastructure" describe exactly the movement "Beneath the Surface" makes. The film dramatizes the brand's existing idea rather than inventing a new one.

## Capability pillars (`lib/content.ts`)

1. **Product Engineering**: "From idea to everyday essential". "Build the product. Move the business."
2. **AI & Automation**: "Intelligence with a purpose". "Less busywork. More possibility." Human-reviewed assistants, with "clear checks before AI takes action".
3. **Cloud & Platform**: "A foundation for what comes next". "Built to run. Ready to evolve." Repeatable releases, useful monitoring, a recovery plan.
4. **Experience & Growth**: "Clarity at every interaction". "Make complex feel intuitive."

Delivery workflow: Discover → Define → Design → Engineer → Scale.

## Calls to action

"Start a Project" (primary, solid vermilion), "Explore Our Work" (secondary text link), and "Tell us about your project". The contact email is `info@cloudfireitservices.com`. The film's end card uses the domain only, as specified in the brief.

## Tone of voice

The voice is calm, specific and evidence-minded. It uses short declarative pairs with restraint and no superlatives. The content model refuses unverified claims: case studies have "No business metrics, delivery duration or client quotation", and testimonials stay hidden until approved. The film must keep that integrity, because a brand film that overclaims would contradict the brand.

## Motion language (from components)

- Two easing curves: `--ease-out: cubic-bezier(.23,1,.32,1)` and `--ease-in-out: cubic-bezier(.77,0,.175,1)`.
- Headline lines reveal through masks (`.line-mask`, 850 ms ease-out, 60 ms stagger).
- Buttons press to `scale(.97)` over 160 ms.
- The architecture diagram sends single packets along orthogonal wires, then "rests before the next request". Motion is sequential, never everything at once.
- The footer wordmark has a slow continuous orange outline trace.
- The hero WebGL atmosphere is a smoke cloud resolving into a fine orange line-mesh flame.
- Reduced-motion and visibility checks are honoured everywhere. Motion is treated as a considered material, not decoration.

## Imagery

- `design/cloudfire-source.png` (1536 × 1024) is the hero sculpture: grey volumetric smoke on the left becomes translucent orange wire-mesh flame on the right. **It is the brand's own "surface → structure" metaphor.** Its resolution is too low for 4K, so the film recreates the motif procedurally at native resolution instead of upscaling it.
- Layered browser frames with crossfades (the hero project deck).
- Engineering diagrams use dark tiles, mono labels and orange connection dots.
- "Ember" is a friendly cloud mascot. It is deliberately excluded from the film because its playful tone conflicts with the cinematic register.

## Logo

`components/cloudfire/Brand.tsx` defines the genuine mark as SVG paths. A cloud is cut by a vermilion flame, with a seam masked around the flame and a dark inner flame core. The wordmark is lowercase `cloudfire` in Instrument Sans 600, tracking −0.065em, followed by a vermilion period. The descriptor is `IT SERVICES` in IBM Plex Mono with 0.22em tracking and a 13 px vermilion rule. The film uses these exact paths and the exact typographic treatment, rendered as vectors at native resolution. `public/cloudfirelogo.png` (377 × 196) is a legacy raster and is not used.

The brief's end-card text "CLOUDFIRE" is interpreted as the brand-name slot and rendered with the genuine lowercase wordmark. Changing the logo's case would misrepresent the identity.
