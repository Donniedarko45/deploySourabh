# Critic report: animatic (renders/animatic/cloudfire-animatic.mp4)

Reviewed: the rendered 1080p animatic, its contact sheets (`contact-1..3.png`, `contact-edits.png`) and `report.json`.
Scores are internal heuristics for directing revisions, not objective measures.

## Automated findings

| Check | Result | Verdict |
| --- | --- | --- |
| Duration / fps / size | 65.000 s, 24 fps, 1920×1080, H.264 + AAC | pass |
| Decode | 0 errors | pass |
| Loudness | −14.02 LUFS integrated, −1.11 dBTP, 0 clipped samples | pass |
| Narration ASR (final mix) | WER 0.0; dry stem 0.0; phone-speaker fold-down 0.0. No masking. | pass |
| Unintended silences > 1.2 s | none | pass |
| Effects sync | max 2 frames from event to detected onset (detector resolution) | pass |
| Blank frames | Frame 1080 was blank on the first conform. The validator refused to encode; fixed (S12 now cuts on the bar line instead of fading from black). | fixed |
| "Black" segments (pixels < 8 % luma on 98 % of the frame) | 12.9–36.7 s flagged | **major**: Acts II–III are underexposed and sparse; see R1, R5 |
| Freeze | 16.9–17.5 s (S06 line settling before the cut) | minor; acceptable as a held beat |

## Creative scores (animatic)

| Category | Score | Note |
| --- | --- | --- |
| Opening hook | 8 | Black, a click, then the macro "● Order placed" with real depth falloff reads as a premium product shot. The layers part cleanly. The dive works. |
| Visual originality | 7 | The dot loop and the plane-collapse ending are original. The middle drifts toward diagram language. |
| Cinematography | 6.5 | S06, S08 and S10 are flat and frontal. The S04 hall is underlit, and the 5–6 s arrival is murky. |
| Narrative coherence | 8 | One request followed down, then out into the work, then proof, then home. Understandable without reading. |
| Motion-design execution | 7 | Match cuts land (approval ring → delivery loop; S10 screen → S11 frame). The S10 tangle is too small to read. |
| Music composition | 7 | Arc measured and correct (Act II −30 dB → Act IV −19 dB → dip → crescendo → resolution). Not auditioned by ear in this environment. |
| Sound design | 7.5 | Every beat has a designed sound, and the dot callback is identical. Restraint is good. |
| Voice performance | 6 | Clear and accurate (WER 0), but local TTS cannot take emotional direction. This is limited by the missing Gemini key, not by the script. |
| Brand consistency | 9 | Palette, type, motifs and the genuine mark throughout. |
| Final reveal | 8.5 | The dot becomes the period, the mark draws, the tagline arrives, a 4 s hold, and a slow close. |
| **Mean** | **7.45** | Below the 9 target. Revisions R1–R9 follow. |

## Revisions (implemented before the master render)

| # | Shot / frames | Problem | Fix | Expected result |
| --- | --- | --- | --- | --- |
| R1 | S04 120–270 | Hall underlit; field reads as a flat dark plain | Brighter ceiling with visible grid and a glowing stack silhouette; threads with a gradient (bright near the ceiling); thicker, nearer threads for depth; brighter route and labels; slight upward pitch | A vast, luminous "surface above, structure below" image |
| R2 | S03→S04 104–150 | Arrival is murky (looking straight down at a sparse grid) | Arrive pitched toward the horizon, with the ceiling visible earlier; reveal pull-back starts at 120 | A legible arrival into a new world at 5.0 s |
| R3 | S06 345–420 | Top-down grid reads as a slide | 55° perspective camera with fog; glow on the route; flicker then dashed outline on the failing node; keep the straight-line match to S07's horizon | A cinematic failure-and-reroute beat |
| R4 | S10 795–900 | Tangle too small and too thin to read | Larger screen cards; a curved, looping path (Catmull–Rom) with backtracks; a clearer untangle into three steps, then one screen | "Difficult → obvious" readable at a glance |
| R5 | S05, S06, S08, S09, S10 | Frames sit on pure black with no light | Soft warm "practical" light pools behind the subject in each shot | Lifted mid-tones and a clear focal point, still charcoal |
| R6 | S05 270–345 | Rails invisible; gate label clipped at frame edge | Visible channel rails and floor grid; labels stay inside title-safe | A readable pipeline |
| R7 | S07 420–525 | Browser frame top touches the frame edge | Camera distance +6 % | Breathing room above the product |
| R8 | S08 525–660 | Cards small; diagram feel | Camera closer (D 3900 → 3300) | Legible, cinematic flow |
| R9 | Captions | Caption 3 lingers 1.6 s after speech | Clamp out-points to the line end + 0.6 s | Tighter subtitle timing |

Unresolvable in this environment, and recorded as such: the voice performance ceiling (needs the Gemini TTS key) and an audition of the score by ear.
