---
name: film-critic
description: Mandatory quality-control and creative review of a rendered film or animatic. Extracts frames and contact sheets, runs automated picture and sound checks (black frames, flicker, frozen frames, clipping, loudness, gaps, sync, transcript accuracy), scores the film on ten creative categories, and turns every critical issue into an actionable revision. Use before delivering any video, and after every revision round.
---

# Film critic

Tool: `tools/qa/critic.py <video> [--out qa/<name>]`. It always evaluates the rendered file, never the plan.

## 1. Evidence gathering (automated)

- **Frames:** one every 2 s, plus the frames immediately before and after every edit point (from `timeline/master.otio`), assembled into contact sheets (`contact-*.png`, 6 × N grid with timecodes).
- **Picture checks:**
  - Black or blank frames: ffmpeg `blackdetect` (d ≥ 0.1 s, pix_th 0.08). Intended blacks are whitelisted from the shot list.
  - Frozen frames: `freezedetect` (n = −60 dB, d ≥ 0.5 s), outside intended holds.
  - Flicker: frame-to-frame luma delta spikes greater than 3σ that are not on an edit point.
  - Compression: the bitrate per second and the `signalstats` block artifacts on the final encode.
  - Colour consistency: mean/median chroma and black level per shot. Flag a shot more than 2σ from the film's median.
  - Cropping and safe area: the bounding box of non-background pixels near the frame edge on text shots.
- **Sound checks:**
  - Loudness (EBU R128 integrated, LRA, true peak via `ebur128=peak=true`): −14 ±1 LUFS and ≤ −1 dBTP.
  - Clipping: runs of samples at or above −0.1 dBFS.
  - Unintended gaps: silence over 1.2 s that is not in the music plan.
  - Narration accuracy: ASR on the final mix compared with the script (see `caption-engine`).
  - Masking: the narration ASR WER on the mix must equal the WER on the dry stem.
  - A/V sync: sound events in `shotlist.json` compared with onset detection on the SFX stem (±1 frame).
- **Technical:** ffprobe of codec, profile, resolution, frame rate, duration, audio stream layout, and a full decode pass (`-f null -`) with zero errors.

## 2. Look at it

Open every contact sheet image and inspect it. Automated checks cannot see a distorted logo, illegible type, broken geometry, a dead composition or an unearned transition. Write down what you see per shot.

## 3. Creative scoring (1–10, internal heuristics, not objective proof)

Opening hook · Visual originality · Cinematography · Narrative coherence · Motion-design execution · Music composition · Sound design · Voice performance · Brand consistency · Final reveal.

The target is a mean ≥ 9 with no category < 8. Score honestly. A category limited by a missing capability (for example, local TTS instead of a directed voice model) is scored as what it is, and the limitation is named.

## 4. Revision list

Every issue rated *critical* or *major* must produce an entry with the shot, the frame range, the problem, the fix (concrete: parameter, file, line) and the expected result. Repair only the affected shots, then re-render those shots and the conform. Do not re-render the whole film for a local fix.

Cap regeneration at **3 attempts per expensive shot** (generative or long render). After that, record the issue as unresolved, with the reason. Never loop indefinitely.

## 5. Report

Write `qa/<name>/critic-report.md` with the scores, the evidence links, the issues (fixed, open) and a one-paragraph verdict. A visually impressive frame does not compensate for a film that feels disconnected. Judge the whole.
