# Visual bible: "Beneath the Surface"

One world, two strata. **The surface** is where people live: warm off-white typography, calm panels and light. **Beneath** is precise, architectural and hushed: hairline structure, a single vermilion signal, and deep charcoal space. The film is a journey between them, and every shot belongs to one of the two strata or to the threshold between them.

## Composition

- 16:9 master on a 3840 × 2160 stage. Title-safe is 90 % (192 px / 108 px margins), and type never crosses it. Captions sit in the lower 18 %, inside safe.
- Use thirds and one strong horizontal. The "surface line" (horizon) is a recurring compositional device at 42–58 % of frame height.
- Negative space is the default. Structure fills at most 40 % of the frame, except in the S03 dive, which earns its density.
- One subject in focus per shot. Secondary elements sit at least 1.5 stops darker or are defocused.
- The vertical 9:16 edit is recomposed per shot (see `timeline/vertical.json`), not center-cropped.

## Colour

| Role | Value |
| --- | --- |
| Base | `#0a0a0a`; void `#050505` at the frame edges through vignette |
| Panels | `#111` / `#141414`, hairline `rgba(255,255,255,.10)` |
| Type | `#f4f3ef` primary, `#979797` secondary, `#6b6b6b` tertiary mono |
| Signal | `#ff5a36` (the request, the dot, the flame); `#ff9d42` only as glow falloff |
| Light | warm white `#fff4e6` at low opacity for the "ceiling of light" |

Rules: orange covers ≤ 5 % of any frame and always means *the thing we are following*. There are no other hues. UI captures keep their native colours (AegisStore's green "Healthy" chips stay green, because changing a real product's UI would misrepresent it). The grade only warms and lifts their blacks to sit in the world.

## Lighting

- **Key:** a soft warm top light from the surface (above frame) falls through layers. Gradient falloff only, with no hard shadows.
- **Rim/grazing:** a thin specular sweep travels across panel edges in S01, S11 and S15 at about 1 % of frame width per frame.
- **Practicals:** the packet and the dot are the brightest things in their shots. Their halo is a 2-layer glow (core + 6× radius at 8 % opacity).
- **Atmosphere:** depth haze toward `#0a0a0a`, with exponential fog starting at 2× the subject distance.

## Lens and camera

| Use | FOV (vertical) | Equivalent |
| --- | --- | --- |
| Macro (S01, S14) | 18–22° | ~65 mm |
| Standard (S04–S10) | 26–32° | ~45 mm |
| Wide establishing (S04 start, S13) | 38° | ~32 mm |

- Movement is always motivated: following the request, revealing what is beneath, or settling. Ease-in-out `cubic-bezier(.77,0,.175,1)` for transitions and ease-out `(.23,1,.32,1)` for arrivals. There are no linear camera moves, no whip pans and no handheld shake.
- Depth of field is simulated per element from its distance to the focal plane (blur ∝ |1/d − 1/f|). The rack-focus target is always the narrative subject.
- Minimum shot length is 30 frames. Cuts land on beats (15-frame grid) unless the move is continuous.

## Materials

- **Panels:** matte graphite with a 1 px hairline border and an inner top highlight `rgba(255,255,255,.06)`.
- **Hairline structure:** 2 px at 4K (1 px at 1080p) in white at 18–35 % opacity. Active paths use 3 px vermilion plus a 10 px glow at 12 %.
- **Nodes:** rounded rectangles (7 px radius at the site's scale) with a mono uppercase label, from the site's architecture diagram.
- **Packets:** a 10 px core with a soft halo, travelling only on orthogonal wires (90° turns) and resting between moves.
- **Grid:** 48 px squares at 3 % white on floors and planes.

## Typography

Instrument Sans 500/600 (display) with tight tracking of −0.045em, Inter (UI copy), and IBM Plex Mono (eyebrows and labels, uppercase, +0.08em tracking). Eyebrows follow the pattern `— 01 · PRODUCT ENGINEERING`. Type is never smaller than 28 px on the 4K stage (14 px at 1080p), and on-screen text is limited to 6 words at a time outside the end card.

## Graphic motifs

1. **The dot**: S01, then S14, then the wordmark period in S15.
2. **Layers of a product**: the site's stack (web/mobile → edge → API → services/data → cloud).
3. **The single request**: one vermilion packet we follow from S02 to S06.
4. **Surface line**: the horizon of S07 becomes the resolving line of S13 and the baseline of the end card.

## Transition rules

- Transitions are spatial or match cuts, where an element changes meaning while staying in place: line → horizon, progress bar → context line, approval ring → delivery loop, latency trace → journey path, final screen → browser frame.
- Dissolves are reserved for time compression inside real UI captures (max 8 frames).
- Banned: glitch, whip-zoom, light-leak packs, and whoosh-on-every-cut.

## Reference frames

Rendered stills for every shot are in `assets/keyframes/` (first, key and last frame) and the contact sheet `assets/keyframes/storyboard-contact.png`. They are produced by the same deterministic renderer as the film, so the storyboard *is* the look.
