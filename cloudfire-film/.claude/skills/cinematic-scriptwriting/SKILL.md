---
name: cinematic-scriptwriting
description: Write narration for cinematic brand films (30–90 s) that sounds like a thoughtful documentary narrator, not advertising copy. Use when drafting, revising or timing a brand-film script, treatment or voice-over, or when asked for narrative concepts for a launch film.
---

# Cinematic scriptwriting

You are writing words that will be *heard once*, over pictures that already carry most of the meaning. The job is to say what the picture cannot: stakes, thesis, method, evidence, philosophy.

## Process

1. **Read the evidence first.** Build a claims register before writing a word (see `research/verified-claims.md` for the format). Every factual phrase in the script must trace to it. If a claim is attested only by the client, say so and keep it modest.
2. **Develop three genuinely different approaches.** Each must differ in *engine* (what drives the film forward), not just tone. For each write a one-paragraph treatment with its narrative engine, voice, risks and the image it ends on.
3. **Score them** 1–5 on originality, pacing potential, brand fit, visual potential with the available production tools, room for authentic proof, and whether the ending earns the logo. Pick the highest and borrow the best single idea from a runner-up if it strengthens the winner.
4. **Write the emotional arc first, then the lines.** A table of act → feeling → picture → sound. Lines serve the arc.
5. **Draft long, cut hard.** Write about 1.5× the target, then cut anything the picture already says.
6. **Time it with the real voice.** Generate narration (see the `emotional-tts` skill), measure each line, and lay the lines against the shot list. Target 45–60 % speech density across the film and ≤ 70 % within any 10-second window. If you are over, cut a line rather than speeding the voice up.
7. **Align to shots.** Each line gets a cue time, a shot id and a direction note (emotion + one concrete performance instruction). Lines may pre-lap a cut by up to 1 s (J-cut). They should not straddle an act break.

## Word budget

The default is 85–105 spoken words per 60–65 s. That suits a measured narrator at about 2.2 words/s with 40 % silence. Adjust after timing the real voice, and record the reason (`narration.json → alternates`).

## Voice of the writing

The register is an articulate professor explaining something profound to one person, with a documentary narrator's restraint. Warmth comes from specificity and the occasional dry understatement ("nobody holds their breath"), not from adjectives.

### Never

- Series of two-word sentences ("Fast. Secure. Scalable.").
- "We don't just X. We Y." or any "not just… but…" pivot.
- "In today's fast-paced digital world", "revolutionize", "the future of", "unlock", "empower", "seamless", "cutting-edge", "game-changer".
- Numbers and metrics as persuasion. One number at most, only if verified and essential.
- Rhetorical questions to open.
- The same syntactic frame three times in a row (vary subject-first, clause-first and imperative).
- Describing the picture ("Here you can see…").
- Ending every sentence on a falling, dramatic phrase. Vary sentence length and landing.

### Prefer

- One concrete, human image per act ("an ordinary afternoon").
- Verbs that carry weight (holds, carries, approves, keeps).
- A thesis line that can stand alone and is said once.
- Letting the brand name be spoken once, late, simply.

## Self-check before handing off

- [ ] Every claim is in the claims register, at an evidence level the client accepts.
- [ ] Word count and speech density are within budget after timing.
- [ ] Read it aloud at 0.9× speed: no tongue-twisters, no unintended rhymes, no two stressed syllables colliding at a line end.
- [ ] Pronunciations for brand and product names are recorded with IPA and a respelling.
- [ ] Each line has a direction note that a voice actor or TTS model can act on.
- [ ] Remove the narration: does the film still make sense? It should. Remove the picture: do the words alone have an arc? They should.

## Output files

- `creative/treatment.md`: the three approaches, scoring, selection, arc.
- `creative/narration.json`: the machine-readable script (id, act, shot, cue_s, text with `[pause N]`, emotion, direction, speed). The TTS, mix and caption tools read this file.
- `creative/script.md`: the human-readable shooting script table.
