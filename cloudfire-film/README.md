# CloudFire — "Beneath the Surface"

A 65-second launch film for CloudFire IT Services, produced as code. The whole picture is a deterministic composition (`motion/`) rendered frame by frame at native 3840×2160. Real product footage comes from controlled local builds. Narration, the score and the sound design are generated and mixed by the tools in `tools/`. The canonical edit is an OpenTimelineIO timeline (`timeline/master.otio`).

Start with `production-report.md`, which covers specifications, files, tools, provenance, QA and limitations.

## Layout

```
research/        brand audit, verified-claims register, project inventory, visual language
creative/        treatment (3 concepts), script, narration.json, shotlist.json, visual bible, storyboard
.claude/skills/  cinematic-scriptwriting, emotional-tts, cinematic-sound-design, caption-engine, film-critic
motion/          the compositor (three.js + CSS3D): src/seq/{opening,capabilities,proof,reveal}.js
tools/render/    frame renderer (Playwright/Chromium, resumable, multi-worker)
tools/capture/   AegisStore capture with a virtual clock (vclock.js)
tools/tts/       emotional TTS: Kokoro (local) and Gemini (API) backends, take selection, assembly, validation
tools/asr/       Parakeet ASR with word timings (QA and captions)
tools/audio/     score.py, sfx.py, mix.py (−14 LUFS / −1 dBTP), dsp.py
tools/edit/      timeline.py (OTIO), conform.py (FFmpeg), cutdowns.py, poster, storyboard, deliver.sh
tools/captions/  caption engine (SRT + word JSON) and burn-in overlays
tools/qa/        critic.py (automated checks + contact sheets), contact.py
tools/gen/       OpenRouter / Veo / ElevenLabs adapters with a hard budget gate (not executed)
timeline/        master.otio, animatic.otio, teaser.otio, bumper.otio, vertical.otio
qa/              critic reports, narration validation, mix reports, failover evidence
renders/final/   deliverables
```

## Reproduce

Requirements: Node 22, Python 3.13 venv (`numpy scipy soundfile pyloudnorm opentimelineio pillow kokoro-onnx sherpa-onnx`), FFmpeg, Chromium (Playwright). The models go in `$FILM_MODELS`: Kokoro v1.0 ONNX + voices, and Parakeet TDT 0.6B v2 int8.

```bash
npm install
PY=/path/to/venv/bin/python
$PY tools/tts/emotional_tts.py takes --voice bm_george && $PY tools/tts/emotional_tts.py assemble && $PY tools/tts/emotional_tts.py validate
$PY tools/audio/score.py && $PY tools/audio/sfx.py && $PY tools/audio/mix.py && $PY tools/audio/mix.py --no-voice --ceiling -1.6
node tools/render/render.mjs --scale 1 --workers 3 --out renders/frames/master          # ~25 min, resumable
node tools/render/render.mjs --aspect 9x16 --scale 0.5 --workers 3 --out renders/frames/vertical
tools/edit/deliver.sh
$PY tools/qa/critic.py renders/final/cloudfire-master-16x9.mp4 --name master
```

AegisStore footage (already captured in `assets/ui-captures/raw/`; re-capture needs the AegisStore stack running locally, seeded with its `scripts/seed-demo.mjs`): `node tools/capture/aegis.mjs --dpr 2`.

## Upgrading the temporary parts

| Part | Now | With credentials |
| --- | --- | --- |
| Narration | Kokoro `bm_george` (no emotional direction) | `GEMINI_API_KEY=… $PY tools/tts/emotional_tts.py audition --backend gemini --voices Gacrux,Sadaltager,Charon` then `takes --backend gemini --voice <best>`; `assemble`, `validate`, re-mix, re-run `deliver.sh` (picture does not change) |
| Score | procedural, original | `ELEVENLABS_API_KEY=… FILM_BUDGET_USD=… tools/gen/adapters.py`: composition plan from `audio/music/composition-plan.json`. Confirm the licence first. |
| Atmosphere plates (S04, S13) | none (fully deterministic) | `OPENROUTER_API_KEY` / `GEMINI_API_KEY` with `FILM_BUDGET_USD`; estimate with `tools/gen/adapters.py estimate` (~$17 upper bound) |

Network note: this production's environment blocked `openrouter.ai`, `api.elevenlabs.io`, `huggingface.co` and `www.cloudfireitservices.com`. `generativelanguage.googleapis.com` was reachable.
