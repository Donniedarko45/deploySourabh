"""Caption engine: ASR word timings from the final mix, aligned to the approved script → SRT + word JSON + report.

    python tools/captions/captions.py --audio audio/stems/mix.wav --srt renders/final/cloudfire-subtitles.srt
"""
from __future__ import annotations
import argparse, difflib, json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from asr.transcribe import transcribe_file, compare, normalize  # noqa: E402
from tts.emotional_tts import ALIASES, spoken  # noqa: E402

FPS = 24
MAX_LINE, MAX_LINES, MAX_CPS, MIN_DUR, MAX_DUR, GAP = 42, 2, 17.0, 20 / FPS, 6.0, 2 / FPS


def snap(t):
    return round(t * FPS) / FPS


def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def align(script_lines, words):
    """Give every script word a time from the ASR words (alias-aware); interpolate the ones ASR missed."""
    ref = []  # (line_id, display_word, norm)
    for line in script_lines:
        for w in spoken(line["text"]).split():
            n = normalize(w)
            ref.append([line["id"], w, n[0] if n else w.lower()])
    hyp = []
    for w in words:
        for n in normalize(w.text):
            hyp.append((n, w.start, w.end))
    # collapse aliases in hypothesis ("aegis store" → "aegisstore")
    i, coll = 0, []
    while i < len(hyp):
        merged = False
        for canon, forms in ALIASES.items():
            for form in forms:
                parts = normalize(form)
                if [h[0] for h in hyp[i:i + len(parts)]] == parts:
                    coll.append((canon, hyp[i][1], hyp[i + len(parts) - 1][2])); i += len(parts); merged = True; break
            if merged: break
        if not merged:
            coll.append(hyp[i]); i += 1
    sm = difflib.SequenceMatcher(a=[r[2] for r in ref], b=[h[0] for h in coll], autojunk=False)
    times = [None] * len(ref)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (coll[blk.b + k][1], coll[blk.b + k][2])
    missing = [i for i, t in enumerate(times) if t is None]
    for i in missing:  # interpolate from neighbours
        prev = next((times[j] for j in range(i - 1, -1, -1) if times[j]), None)
        nxt = next((times[j] for j in range(i + 1, len(times)) if times[j]), None)
        if prev and nxt: times[i] = (prev[1], max(prev[1] + .1, nxt[0]))
        elif prev: times[i] = (prev[1], prev[1] + .3)
        elif nxt: times[i] = (max(0, nxt[0] - .3), nxt[0])
    return [{"line": r[0], "word": r[1], "start": round(t[0], 3), "end": round(t[1], 3), "interpolated": i in missing} for i, (r, t) in enumerate(zip(ref, times))], missing


def wrap(text):
    if len(text) <= MAX_LINE:
        return [text]
    words = text.split(); best = None
    for k in range(1, len(words)):
        a, b = " ".join(words[:k]), " ".join(words[k:])
        if len(a) <= MAX_LINE and len(b) <= MAX_LINE:
            bad = words[k - 1].lower().rstrip(",.") in {"a", "an", "the", "of", "to", "in", "on", "and", "its", "that"}
            score = abs(len(a) - len(b)) + (40 if bad else 0) - (25 if a.endswith(",") else 0)
            best = min(best or (1e9, None), (score, [a, b]))
    return best[1] if best else [text[:MAX_LINE], text[MAX_LINE:]]


def build_captions(aligned):
    caps = []
    by_line = {}
    for w in aligned:
        by_line.setdefault(w["line"], []).append(w)
    for lid, ws in by_line.items():
        # split a line at clause punctuation if it is too long for two lines or too fast to read
        chunks, cur = [], []
        for w in ws:
            cur.append(w)
            text = " ".join(x["word"] for x in cur)
            if re.search(r"[,.;]$", w["word"]) and len(text) > 30 and w is not ws[-1]:
                chunks.append(cur); cur = []
        if cur: chunks.append(cur)
        for ch in chunks:
            text = " ".join(x["word"] for x in ch)
            caps.append({"line": lid, "text": text, "lines": wrap(text), "start": ch[0]["start"], "end": ch[-1]["end"]})
    for i, c in enumerate(caps):
        nxt = caps[i + 1]["start"] if i + 1 < len(caps) else c["end"] + 2
        need = max(MIN_DUR, len(c["text"]) / MAX_CPS)
        end = max(c["end"] + .25, c["start"] + need)
        c["start"], c["end"] = snap(c["start"]), snap(min(end, nxt - GAP, c["start"] + MAX_DUR))
        c["cps"] = round(len(c["text"]) / max(.01, c["end"] - c["start"]), 1)
    return caps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", default="audio/stems/mix.wav")
    ap.add_argument("--srt", default="renders/final/cloudfire-subtitles.srt")
    a = ap.parse_args()
    script = json.load(open(os.path.join(ROOT, "creative", "narration.json")))
    text, words = transcribe_file(os.path.join(ROOT, a.audio))
    ref = " ".join(spoken(l["text"]) for l in script["lines"])
    cmp = compare(ref, text, ALIASES)
    aligned, missing = align(script["lines"], words)
    caps = build_captions(aligned)
    os.makedirs(os.path.dirname(os.path.join(ROOT, a.srt)), exist_ok=True)
    with open(os.path.join(ROOT, a.srt), "w") as f:
        for i, c in enumerate(caps, 1):
            f.write(f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n" + "\n".join(c["lines"]) + "\n\n")
    json.dump(aligned, open(os.path.join(ROOT, "renders", "final", "captions.words.json"), "w"), indent=1)
    json.dump(caps, open(os.path.join(ROOT, "audio", "narration", "captions.json"), "w"), indent=1)
    report = {"audio": a.audio, "wer_vs_script": round(cmp["wer"], 4), "issues": cmp["issues"], "captions": len(caps),
              "interpolated_words": [aligned[i]["word"] for i in missing], "max_cps": max(c["cps"] for c in caps),
              "max_line_chars": max(len(l) for c in caps for l in c["lines"]), "heard": text}
    json.dump(report, open(os.path.join(ROOT, "qa", "captions-report.json"), "w"), indent=1)
    print(json.dumps({k: v for k, v in report.items() if k != "heard"}, indent=1))


if __name__ == "__main__":
    main()
