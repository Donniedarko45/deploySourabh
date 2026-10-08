# Critic report: final master (renders/final/cloudfire-master-16x9.mp4)

Evidence: `report.json`, `contact-1..3.png`, `contact-edits.png` (frames around all 14 edit points), `qa/deliverables.json`.

## Automated

Technical, picture and sound checks all pass (see `report.json` and the QA table in `production-report.md` §7). Narration WER is 0.0 on the final mix, on the dry stem and on a phone-speaker fold-down. Loudness is −14.01 LUFS and true peak −1.08 dBTP, with no clipping, no unintended gaps and no flicker off edit points. The flagged near-black and near-static spans are intended beats (the opening silence, dark product UI, the line collapse, the hold before the reveal).

## Fixes made during master QA

| Issue | Fix | Verified |
| --- | --- | --- |
| S14 had about 3 s of near-stillness before the reveal | A slow 8 % push on the dot (frames 1300–1386), blended into the pull-back | freezedetect spans shortened; picture alive |
| S10 tangle illegible at a glance | Camera 6300 → 6000 (was 7600), path width 5 px at 4K | contact sheet: loops and backtracks read clearly |
| ASR "omission" of "good engineering" | A QA-tool fault: the chunker split mid-sentence. It now splits only inside pauses of at least 250 ms. | full-mix WER 0.0 |
| No-voice edition at −0.67 dBTP after AAC | Limiter ceiling −1.6 dBTP for that mix before encoding | −1.5 dBTP, passes |
| Frame extraction one frame late | Seek to (f − 0.5)/24 | edit sheets now show the true before/after frames |

## Scores

The final category scores, the mean (7.85) and the honest gap to the 9.0 target are in `production-report.md` §7. Expensive-shot regeneration was not applicable: no generative shots were attempted.

## Verdict

A coherent, original, on-brand film with a strong hook and an earned ending. Its proof is real: a deliberately crashed node, with files coming back verified. The weakest element is the temporary voice. That is a capability limit of this environment, not of the script. The next weakest are the dark native UI in the product shots and a score that no human has auditioned. The picture is final. Directed narration can be dropped in without touching a frame.
