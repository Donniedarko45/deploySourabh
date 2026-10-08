# CloudFire visual language (extracted design system)

These are source values from `app/globals.css`, `app/layout.tsx` and `components/cloudfire/*`. Film adaptations are marked **Film**.

## Color tokens

| Token | Value | Use on site | Film use |
| --- | --- | --- | --- |
| `--background` | `#0a0a0a` | page | base black; never pure `#000` except the first and last frames |
| `--surface` | `#111111` | panels, footer | panel faces, layer planes |
| `--foreground` | `#f4f3ef` | primary text (warm off-white) | type, key light |
| `--secondary` | `#979797` | body copy, second headline line | muted type, second tagline line |
| `--accent` | `#ff5a36` | CTA, dots, indices, rules | signal: the request, the dot, the flame; ≤ 5 % of frame area |
| `--warm` | `#ff9d42` | hero flame highlights | highlight falloff on orange elements only |
| `--border` | `rgba(255,255,255,.10)` | hairlines | structure lines, at 2 px on 4K |
| grid | `#ffffff03` on 24 px | architecture panel | **Film:** floor and plane grids, 48 px at 4K |

**Film grade:** charcoal blacks (lifted to about 2 % so grain lives in them), warm neutral midtones and restrained highlights. Orange is the only saturated hue. No teal-orange LUT: shadows stay neutral.

## Typography

| Role | Family | Site treatment | Film |
| --- | --- | --- | --- |
| Display | Instrument Sans 500/600 | tracking −0.045 to −0.058em, line-height ≈ 1.06 | headlines, wordmark, product UI labels |
| Body | Inter 400/500 | 13–16 px, line-height 1.65–1.85 | UI copy, captions |
| Mono | IBM Plex Mono 400/500 | 7–10 px uppercase, tracking 0.055–0.22em | eyebrows, technical labels, timestamps |

Pattern: a mono eyebrow with a 23 px vermilion rule (`— LABEL`), above a two-line display headline whose second line is grey (`--secondary`), ending in a vermilion period.

Fonts are bundled from `@fontsource` (SIL Open Font License 1.1). The site loads the same families through `next/font/google`.

## Shape and structure

- Square-cornered buttons and rectangular sections. Diagram nodes use a 7 px radius.
- 1 px borders at 10 % white. Orange 4–5 px status dots. Orthogonal wires (90° turns only).
- Generous negative space: a 1280 px container with 112 px gutters, and large section padding.

## Motion

- `ease-out (.23,1,.32,1)` for arrivals and `ease-in-out (.77,0,.175,1)` for camera and transformations.
- Staggers of 60 ms between lines, and sequential packet travel with rests.
- Only transform and opacity animate in UI (also the AegisStore rule).
- **Film:** camera moves use critically damped springs or ease-in-out over at least 1.5 s, with no whip pans. One primary motion per shot, and secondary motion delayed by at least 6 frames.

## Motifs to carry through the film

1. **The dot**: the vermilion status dot and period ("Systems that last**.**", "cloudfire**.**"). It opens and closes the film.
2. **Surface → mesh**: the soft cloud becoming precise orange line-mesh.
3. **The packet on an orthogonal wire**: one request, travelling deliberately.
4. **Layers of an interface**: web/mobile → edge → API → services/data → cloud infrastructure, as on the site's diagram.

## Do not use

The Ember mascot, the earth texture (the globe reads as generic "global tech"), the legacy PNG logo, neon cyan, holograms, or particle storms.
