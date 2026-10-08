# Treatment: "Beneath the Surface"

CloudFire launch film · 65 s · 16:9 · 24 fps · 96 BPM score (one bar = 2.5 s = 60 frames)

## The idea in one sentence

We follow a single press of a button from the polished surface where people experience it, down through the systems that keep its promise, and back up again. Then we show that CloudFire has built such systems for real.

## Three narrative approaches

### A. "The Half Second" (selected)

A button is pressed. The camera refuses to stay on the screen. The interface separates into its working layers, and we dive after the request into the structure beneath: routes, checks, services, data. The film then rises through four kinds of work, each appearing as part of the same journey. It proves itself with real software that survives a deliberate failure on camera. It returns to the orange status dot from the first shot, which becomes the period in the CloudFire wordmark.

- **Narrative engine:** one continuous action makes the structure inevitable, and every shot is a stop on the request's path.
- **Voice:** an observant guide, curious at first, then confident and quietly proud.
- **Risk:** literalism ("look, a network diagram"). Mitigation: the geometry is architectural and tactile, never diagrammatic, until the moment real software appears.

### B. "Load-Bearing"

An architectural meditation. The camera studies hidden structure in made things: the steel inside a facade, the ribs under a vaulted ceiling. It then finds the same logic inside software. The narration reads like an engineer's notebook on what makes things hold.

- **Strength:** gravitas, timelessness, beautiful negative space.
- **Weakness:** the building metaphor is well worn in tech advertising, and it delays the product. CloudFire's real work would arrive late and feel like an appendix. It also pushes toward physical architecture plates that need generative video this production cannot currently afford.

### C. "The Quiet Shift"

A night in the life of a system. At 02:14 traffic surges, a disk fills, a node fails, a person reviews an automated decision, and by morning nobody noticed anything. It has documentary tension.

- **Strength:** drama, and an honest showcase of reliability.
- **Weakness:** it frames CloudFire through failure and vigilance (a thriller tone), and it under-serves design and experience, which are half the brand ("Beautiful outside."). Clock timestamps also invite the metric fetish the brief rejects.

## Evaluation

| Criterion (1–5) | A. Half Second | B. Load-Bearing | C. Quiet Shift |
| --- | --- | --- | --- |
| Originality | 4 | 3 | 4 |
| Pacing potential | 5 (dive, rise, proof, resolve) | 3 (contemplative throughout) | 4 |
| Brand fit ("Beautiful outside. Solid underneath.") | 5 | 4 | 3 |
| Visual potential with deterministic tools | 5 | 2 | 4 |
| Room for authentic product proof | 5 | 2 | 4 |
| Ending earns the logo | 5 (dot → period loop) | 3 | 3 |
| **Total** | **29** | 17 | 22 |

A is selected. C's best idea, the system's "worst day", is folded into A as the Act IV payoff: AegisStore loses a node on camera and keeps serving verified files.

## Emotional arc

| Act | Time | Feeling | Picture | Sound |
| --- | --- | --- | --- | --- |
| I Hook | 0–5 s | intrigue | macro of a real-feeling component; a click; layers part; we fall through | near-silence, a click, a sub pulse, then the first chord |
| II Invisible work | 5–17.5 s | curiosity, intimacy | beneath the interface: a ceiling of light above, a structure below; a request finds its way | slow pulse and suspended harmony; the first narration |
| III What we build | 17.5–37.5 s | fascination, confidence | four kinds of work as one journey, joined by match cuts | arpeggio motion, percussion enters, harmony moves |
| IV Proof | 37.5–50 s | pride, clarity | real AegisStore failover, real MODULX site | widest harmony; the motif stated fully |
| V Reveal | 50–65 s | quiet conviction | everything resolves to one line, then to the dot, then to the wordmark | crescendo resolves to a held major chord and a sonic signature |

## What the audience should leave with

CloudFire understands both halves: what a person touches, and what has to be true underneath for that to keep working.

## Production approach (given current constraints)

- Visuals are rendered deterministically in a browser-native 3D/2D compositor (three.js + DOM typography) at native 3840 × 2160. Real product UI is captured from local builds at device scale 2.
- Generative image and video (OpenRouter: gpt-image / Veo / Seedance) is **not used in this cut**. No API key is configured, and `openrouter.ai` is blocked by the session's egress policy. The shot list marks where generative plates would add value (S04 and S13 atmosphere), with a cost estimate in the production report.
- Narration for this cut uses a local neural TTS (Kokoro v1.0, Apache-2.0) because `GEMINI_API_KEY` is absent. The Gemini TTS adapter is implemented and ready to regenerate the narration with directed delivery.
- The score and sound design are composed and synthesized in code, because ElevenLabs (`api.elevenlabs.io`) is blocked and there is no key. The score is original, with no licensing exposure.
