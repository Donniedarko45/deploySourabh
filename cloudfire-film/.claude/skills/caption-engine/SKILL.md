---
name: caption-engine
description: Generate accurate, professionally typeset subtitles from a final audio mix, with word-level timing, script comparison (omissions, repeats, mispronunciations), SRT and word-timestamp JSON output, and an optional caption-burned edition. Use after narration is final, or whenever a video needs subtitles or captions.
---

# Caption engine

Tool: `tools/captions/captions.py`. ASR: `tools/asr/transcribe.py` (Parakeet TDT 0.6B v2 int8, offline, word timings).

## Pipeline

1. **Transcribe the final mix, not the narration stem.** This catches masking: if music hides a word, ASR will miss it there too.
2. **Compare with the approved script** (`creative/narration.json`) using word alignment. Report substitutions (possible mispronunciations), omissions, insertions and repeats. Brand-name aliases are allowed.
3. **Use the script's spelling and the ASR's timing.** Captions show the approved text, timed by the recognised words. Where ASR missed a word, interpolate its time from its neighbours and flag it.
4. **Segment into captions:**
   - ≤ 42 characters per line, ≤ 2 lines, ≤ 17 characters/s reading speed.
   - Minimum 0.83 s (20 frames) on screen and maximum 6 s.
   - Break at clause boundaries (punctuation) first, never between an article or preposition and its noun.
   - Extend each caption's out-point by up to 0.25 s for reading, without overlapping the next one. Leave a 2-frame gap between captions.
   - Snap in/out points to frame boundaries (24 fps).
5. **Write** `cloudfire-subtitles.srt` and `captions.words.json` (every word with start/end and line id).
6. **Optional burn-in.** Captions are typeset in Inter 500 on the stage at 46 px per 1080 lines, in `#f4f3ef` with a soft shadow (no box), centered, with the baseline at 88 % of frame height. They must avoid the product UI: shots listed in `timeline/caption-safe.json` move captions to 9 % from the top.

## Style rules

Understated and readable, with no word-by-word karaoke, no bouncing, no emoji, no all-caps and no coloured keywords. Sentence case with the script's punctuation. Brand names use the brand's own spelling (CloudFire, AegisStore).

## QA

- The `qa/captions-report.json` WER must be 0 against the script (aliases allowed).
- Check that every caption is inside title-safe and does not overlap the end-card lockup (no captions after the lockup appears, except a spoken brand name).
- Spot-check five frames of the burned edition by eye.
