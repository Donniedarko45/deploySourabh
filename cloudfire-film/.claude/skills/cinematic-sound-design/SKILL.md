---
name: cinematic-sound-design
description: Compose an original film score and synchronized sound design, then mix narration, music and effects stems to broadcast-quality loudness. Use when a film or video needs music, sound effects, a sonic logo, ducking or a final audio mix (LUFS/true-peak targets).
---

# Cinematic sound design

Tools: `tools/audio/score.py` (procedural composition and synthesis), `tools/audio/sfx.py` (event-synced effects), `tools/audio/mix.py` (stems → master) and `tools/audio/elevenlabs_music.py` (API adapter for when a key exists). Inputs: `creative/shotlist.json` (sound cues per shot) and `audio/narration/timing.json`.

## Music direction (default for brand films)

A restrained, modern score: tactile electronic textures, analog-style synthesis, evolving harmony and controlled organic percussion. No vocals, no EDM drop, no trailer braams, no inspirational piano cliché.

### Architecture template (65 s, 96 BPM, bar = 2.5 s = 60 frames)

| Section | Time | Musical function |
| --- | --- | --- |
| Tactile | 0–3.75 s | silence, a mechanical click, a sub pulse. Room, not music. |
| Reveal | 3.75–5 s | pickup into the first chord on the visual transformation |
| Motion | 5–17.5 s | slow pulse, suspended harmony, felt-like motif fragments |
| Momentum | 17.5–37.5 s | arpeggiated sequence opens (filter), organic percussion enters by layers |
| Expansion | 37.5–50 s | widest voicing; the motif complete; the strongest identity |
| Resolution | 50–65 s | thinning, then a crescendo that *resolves* to a held major chord under the logo, with a natural tail |

Cut points land on beats. Each act change lands on a bar line.

## Composition rules

- Write harmony as a progression table with the bars stated, and keep a pedal tone through transitions so cuts feel continuous.
- One motif (3–5 notes), stated in fragments early and completely only at the proof section.
- Introduce at most one new layer per two bars. Remove layers before the final crescendo so it has room to grow.
- Leave a 2–4 kHz pocket while narration plays (the arpeggio filter closes, and pads are EQ-scooped). This is the composition doing the ducking before the mixer has to.

## Synthesis quality bar (procedural backend)

Anti-aliased oscillators (PolyBLEP), detuned unison with stereo spread, a resonant low-pass with envelope, analog-like drift (slow random pitch and cutoff wander), tanh saturation, and an algorithmic stereo reverb with pre-delay. Percussion is synthesized from noise and resonators, never from samples of unknown origin. Render at 48 kHz, 32-bit float.

## Sound effects

Every meaningful visual event gets a designed sound, placed to the frame from `shotlist.json → sound`:

- UI actions: a two-layer click (a high transient plus a soft body).
- Data connections: short tuned ticks in the score's key.
- Structural reveals: a low tonal bloom.
- Camera movement: air (band-passed noise swell), only where the move is large. **Not every cut gets a whoosh.**
- Logo: a sonic signature built from the final chord (a soft ignition breath, then a bell-like partial cluster).

Silence is a sound. The first 0.3 s of the film is silent on purpose.

## Mix

- Stems: `audio/stems/narration.wav`, `music.wav` and `sfx.wav` (48 kHz, 24-bit, stereo).
- Narration: high-pass at 80 Hz, a gentle presence lift at 3 kHz, 2:1 compression, and a de-esser band at 6–8 kHz.
- Ducking: music sidechained to narration (−7 dB, 120 ms attack, 450 ms release, look-ahead 50 ms). Effects are ducked −3 dB under narration.
- Master: integrated loudness −14 LUFS (±0.5) and true peak ≤ −1.0 dBTP, measured with 4× oversampling. Report LRA. Keep about 6–10 LU of dynamic range for cinema feel.
- Check intelligibility: render a mono, 300 Hz–4 kHz band-limited "phone speaker" fold-down and confirm narration ASR WER stays 0.

## ElevenLabs Music (when a key and network are available)

`tools/audio/elevenlabs_music.py` builds a composition plan from the architecture table (sections with durations, positive and negative styles) and requests instrumental music. Store the request, the plan and the response metadata in `audio/music/elevenlabs/`. Confirm that the account's plan licenses commercial use before shipping. Even then, keep the procedural SFX and do the mix locally, so the timing stays frame-accurate.
