# Website verification, 6 October 2026

The production build passed TypeScript, lint and publishing checks. The enquiry checks use mocked Brevo and Turnstile responses and send no email.

## Browser behavior

- Chromium: 1440, 768, 390 and 320 pixel layout widths, navigation, capability tabs, workflow keyboard controls, reduced motion, legacy redirects and missing-content responses.
- Chromium business-page checks: desktop and phone widths, descriptions, canonical URLs, social metadata, service and project-study routes, enquiry failure, retained input and retry confirmation.
- WebKit: 390 and 320 pixel phone widths, the same business-page checks and enquiry failure/retry flow using touch taps.
- No runtime errors or horizontal page overflow in those checks.
- Phones use an SVG globe without loading the 3D scene. The previous hero project deck and cloud placement were restored at the request of the owner after the audit. The contact form is available immediately without a scroll entrance.
- The social PNG was inspected visually at 1200 × 630.

WebKit on Windows is engine-level evidence. These checks do not confirm behavior on a physical iPhone or Android device.

## Mobile loading

Lighthouse 13.5.0, mobile defaults, simulated throttling, local production server. The measurement began at 2026-10-06T16:40:46Z. These figures describe the compact mobile hero variant before the previous layout was requested back; they are not a speed measurement of the restored hero.

| Category | Score |
| --- | ---: |
| Performance | 84 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

| Metric | Result |
| --- | ---: |
| First contentful paint | 1.4 s |
| Largest contentful paint | 4.0 s |
| Total blocking time | 150 ms |
| Cumulative layout shift | 0 |
| Speed index | 3.7 s |

The earlier measurement had a 4.4 s speed index and accessibility score of 96. The final pass improved that visual loading measure and fixed the measured contrast and accessible-name issues. The performance score stayed at 84; the largest paint still needs improvement.

Further performance work should prioritize the hero-image loading priority, image sizing and the initial style/script work. Confirm results against the deployed version and real devices before making a speed claim. The public domain still served the former site at the time of this work, so a public PageSpeed run would not measure this implementation.

## Activation still needed

- A Brevo transactional API key and verified sender, configured privately, followed by a real test and inbox/delivery-log confirmation.
- A real Cal.com or Calendly booking URL to enable the booking link.
- An Umami website ID to enable analytics.
- Approved client quotes, named attributions and any actual delivery timelines or measured outcomes.

No founder block, budget field, starting-price claim or invented testimonial has been added. See website-setup.md and client-proof.md for the activation and content steps.
