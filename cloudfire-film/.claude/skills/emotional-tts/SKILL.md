---
name: emotional-tts
description: Produce directed, emotionally shaped narration with text-to-speech (Gemini native TTS, or local Kokoro as a fallback), including voice auditions, multiple takes, pronunciation control, per-line re-takes, assembly to a timed stem and ASR validation against the approved script. Use for any voice-over, narration or spoken audio for a film or video.
---

# Emotional TTS

The tool is `tools/tts/emotional_tts.py` (backends in `tools/tts/backends.py`). The script source of truth is `creative/narration.json`.

## Backends

| Backend | When | Direction support |
| --- | --- | --- |
| `gemini` | `GEMINI_API_KEY` is set and `generativelanguage.googleapis.com` is reachable | Natural-language direction per line, plus the global voice brief and pronunciation notes, all sent in the prompt. The model is discovered live from `GET /v1beta/models`: it prefers a `3.8` Flash TTS model if listed, otherwise the newest Flash TTS. Override with `GEMINI_TTS_MODEL`. Output is 24 kHz PCM, resampled to 48 kHz. |
| `kokoro` | offline fallback (`kokoro-v1.0.onnx` + `voices-v1.0.bin` in `$FILM_MODELS`) | No direction. Emotion is shaped through per-line `speed`, explicit `[pause N]` silences and punctuation. Pronunciation comes from `pronunciations[*].respell`. |

Never log or write the API key. Calls retry with backoff on 429/5xx.

Gemini voice shortlist for a mature, restrained narrator: try `Gacrux` (mature), `Sadaltager` (knowledgeable), `Charon` (informative), `Iapetus` (clear) and `Algieba` (smooth). Audition them, because names are not performances.

## Workflow

```bash
PY=/home/user/film-venv/bin/python
$PY tools/tts/emotional_tts.py audition --voices bm_george,bm_fable,bf_isabella        # all lines, every voice
$PY tools/tts/emotional_tts.py takes --voice bm_george                                # speed variants, auto-select
$PY tools/tts/emotional_tts.py takes --voice bm_george --lines L7                      # redo one line only
$PY tools/tts/emotional_tts.py assemble --duration 65                                 # place at cue_s → audio/stems/narration.wav
$PY tools/tts/emotional_tts.py validate                                               # ASR vs script → qa/narration-validation.json
```

Add `--backend gemini` to `audition`/`takes` for the API voice. Takes are cached by a content hash, so changing one line's text or direction regenerates only that line.

## How takes are judged

Each take is measured, not guessed:

- **ASR word error rate** (Parakeet TDT 0.6B, local) against the script, with brand-name aliases. Anything above 0 must be explained, for example by compound spellings.
- **Pitch range** (YIN f0, octave-folded, 5th–95th percentile in semitones). Below 3.5 st is monotone; above 10 st is sing-song.
- **End drop**: the median f0 of the last 400 ms relative to the utterance median. Above 4 st is the cheap "AI announcer drop".
- **Pace** in words/s. 1.9–2.9 is acceptable, and about 2.2 is documentary.
- **Fit**: the duration against the gap to the next cue.

The lowest score wins. Ties go to the take closest to the directed speed. Alternatives are kept in `audio/narration/selection.json` so a human can swap one in.

## Delivery arc (write this into each line's `direction`)

| Section | Feeling | Performance note |
| --- | --- | --- |
| Opening | curiosity, intimacy | as if telling one person something you just noticed |
| Middle | fascination, technical confidence | settled, precise, warmth on human details |
| Product proof | pride, clarity | factual; let one word land ("verified") |
| Brand reveal | quiet conviction | slower; no announcement; falling but warm |

## Consistency rules

- One voice for the whole film. `assemble` refuses to stitch takes from different voices.
- All takes are normalised to −20 LUFS before placement. The mix sets the final level.
- When regenerating a single line with Gemini, include the same voice brief and the neighbouring line's text as context in the direction, so the timbre and energy match.
- Re-validate after any change. A line is only "approved" when its WER is 0 (aliases allowed) and a human has listened, if one is available.

## Pronunciation

Record each difficult name in `narration.json → pronunciations` with `respell` (for Kokoro) and `note` (for Gemini). Verify by ASR. If ASR hears the respelling consistently, for example "EG store" for /ˈiːdʒɪs stɔː/, add it to the `ALIASES` map rather than distorting the respelling.
