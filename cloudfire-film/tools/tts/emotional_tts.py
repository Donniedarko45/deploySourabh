"""Directed narration: audition voices, generate takes, choose by measurement, assemble and validate.

    python tools/tts/emotional_tts.py audition --voices bm_george,bm_fable,bf_emma
    python tools/tts/emotional_tts.py takes --voice bm_george [--lines L1,L7]
    python tools/tts/emotional_tts.py assemble --duration 65
    python tools/tts/emotional_tts.py validate

Takes are cached by content hash under audio/narration/takes/, so re-running only synthesizes what changed and a
single line can be rebuilt without touching the others (--lines). Selection never stitches different voices.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import resample_poly

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from asr.transcribe import transcribe_array, compare, normalize  # noqa: E402
from tts.backends import get_backend  # noqa: E402

SR = 48000
SCRIPT = os.path.join(ROOT, "creative", "narration.json")
NARR = os.path.join(ROOT, "audio", "narration")
TAKES = os.path.join(NARR, "takes")
LINE_LUFS = -20.0
METRIC_VERSION = 2
ALIASES = {"aegisstore": ["aegis store", "egis store", "eejis store", "ejis store", "aegis tor", "eg store", "eg's store", "eg stores"],
           "busywork": ["busy work"],
           "cloudfire": ["cloud fire", "cloudfire's"]}


def load_script():
    with open(SCRIPT) as f:
        return json.load(f)


def spoken(text: str) -> str:
    return re.sub(r"\s*\[pause [0-9.]+\]\s*", " ", text).strip()


def segments(text: str):
    """Split '... [pause 0.3] ...' into [(text, pause_after_s), ...]."""
    parts = re.split(r"\[pause ([0-9.]+)\]", text)
    out = []
    for i in range(0, len(parts), 2):
        t = parts[i].strip()
        pause = float(parts[i + 1]) if i + 1 < len(parts) else 0.0
        if t:
            out.append((t, pause))
        elif out:
            out[-1] = (out[-1][0], out[-1][1] + pause)
    return out


def respell(text: str, script: dict, backend: str) -> str:
    if backend != "kokoro":
        return text
    for word, p in script["pronunciations"].items():
        text = re.sub(rf"\b{re.escape(word)}\b", p["respell"], text)
    return text


def to48k(x: np.ndarray, sr: int) -> np.ndarray:
    if sr == SR:
        return x
    g = np.gcd(sr, SR)
    return resample_poly(x, SR // g, sr // g).astype(np.float32)


def trim(x: np.ndarray, thresh_db: float = -48.0, pad_s: float = 0.03) -> np.ndarray:
    win = int(0.01 * SR)
    env = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same") + 1e-12)
    idx = np.where(20 * np.log10(env) > thresh_db)[0]
    if not len(idx):
        return x
    a, b = max(0, idx[0] - int(pad_s * SR)), min(len(x), idx[-1] + int(pad_s * SR))
    y = x[a:b].copy()
    f = int(0.008 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def render_line(backend, line: dict, script: dict, voice: str, speed: float) -> np.ndarray:
    pron = "; ".join(f"{w}: {p['note']}" for w, p in script["pronunciations"].items() if w in line["text"])
    pieces = []
    if backend.name == "gemini":  # Gemini handles pauses and direction in one call
        x, sr = backend.synthesize(line["text"], voice=voice, direction=line["direction"],
                                   brief=script["voice_brief"], pronunciation=pron)
        return trim(to48k(x, sr))
    for text, pause in segments(line["text"]):
        x, sr = backend.synthesize(respell(text, script, backend.name), voice=voice, speed=speed)
        pieces.append(trim(to48k(x, sr)))
        if pause:
            pieces.append(np.zeros(int(pause * SR), np.float32))
    return np.concatenate(pieces)


# ---------- measurement ----------

def yin_f0(x: np.ndarray, sr: int = SR, fmin=65.0, fmax=380.0, hop_s=0.01, win_s=0.04, thresh=0.12):
    """Compact YIN pitch tracker. Returns f0 per hop (nan when unvoiced)."""
    x16 = resample_poly(x, 1, 3).astype(np.float64)  # 16 kHz is plenty for speech f0
    sr = 16000
    W, H = int(win_s * sr), int(hop_s * sr)
    tmin, tmax = int(sr / fmax), int(sr / fmin)
    f0 = []
    for start in range(0, len(x16) - W - tmax, H):
        frame = x16[start:start + W + tmax]
        if np.sqrt(np.mean(frame[:W] ** 2)) < 0.01:
            f0.append(np.nan)
            continue
        d = np.array([np.sum((frame[:W] - frame[t:t + W]) ** 2) for t in range(tmax + 1)])
        cmnd = d[1:] * np.arange(1, tmax + 1) / np.maximum(np.cumsum(d[1:]), 1e-12)
        cand = np.where(cmnd[tmin - 1:] < thresh)[0]
        if not len(cand):
            f0.append(np.nan)
            continue
        t = cand[0] + tmin
        while t < tmax and cmnd[t] < cmnd[t - 1]:
            t += 1
        f0.append(sr / t)
    f0 = np.array(f0)
    # Fold octave errors: compare each value with the utterance median and move it by octaves toward it.
    v = ~np.isnan(f0)
    if v.sum() > 10:
        med = np.median(f0[v])
        ratio = np.log2(f0[v] / med)
        f0[v] = med * 2 ** (ratio - np.round(ratio))
    return f0


def measure(x: np.ndarray, reference: str) -> dict:
    text, words = transcribe_array(resample_poly(x, 1, 3).astype(np.float32))
    cmp = compare(reference, text, ALIASES)
    f0 = yin_f0(x)
    voiced = f0[~np.isnan(f0)]
    semis = 12 * np.log2(voiced / np.median(voiced)) if len(voiced) > 10 else np.zeros(1)
    tail = f0[-40:]
    tail = tail[~np.isnan(tail)]
    end_drop = float(12 * np.log2(np.median(voiced) / np.median(tail))) if len(tail) > 3 and len(voiced) else 0.0
    meter = pyln.Meter(SR)
    return {"asr": text, "wer": round(cmp["wer"], 3), "issues": cmp["issues"],
            "duration_s": round(len(x) / SR, 3),
            "words_per_s": round(len(normalize(reference)) / (len(x) / SR), 2),
            "f0_median_hz": round(float(np.median(voiced)), 1) if len(voiced) else None,
            "pitch_range_st": round(float(np.percentile(semis, 95) - np.percentile(semis, 5)), 2),
            "end_drop_st": round(end_drop, 2),
            "peak_dbfs": round(float(20 * np.log10(np.max(np.abs(x)) + 1e-9)), 2),
            "lufs": round(float(meter.integrated_loudness(x)) if len(x) > SR * 0.5 else -99, 2)}


def score(m: dict, slot_s: float | None) -> float:
    """Lower is better. Accuracy dominates; then natural expressiveness, sentence ends that do not
    collapse, and fitting the slot."""
    s = 100 * m["wer"]
    s += max(0, 3.5 - m["pitch_range_st"]) * 2 + max(0, m["pitch_range_st"] - 10) * 1.5  # monotone / sing-song
    s += max(0, m["end_drop_st"] - 4.0) * 1.5  # the "AI voice drop" at sentence ends
    s += max(0, m["words_per_s"] - 2.9) * 6 + max(0, 1.9 - m["words_per_s"]) * 6  # rushed / dragged
    if slot_s:
        s += max(0, m["duration_s"] - slot_s) * 8
    return round(s, 3)


def take_path(line_id: str, backend: str, voice: str, speed: float, text: str) -> str:
    h = hashlib.sha1(f"{backend}|{voice}|{speed}|{text}".encode()).hexdigest()[:8]
    safe = voice.replace(":", "").replace("+", "_")
    return os.path.join(TAKES, line_id, f"{backend}_{safe}_{speed:.2f}_{h}.wav")


def make_take(backend, line, script, voice, speed, force=False):
    path = take_path(line["id"], backend.name, voice, speed, line["text"])
    meta = path[:-4] + ".json"
    if os.path.exists(path) and os.path.exists(meta) and not force:
        with open(meta) as f:
            m = json.load(f)
        if m.get("metric_version") == METRIC_VERSION:
            return path, m
        x, _ = sf.read(path, dtype="float32")
        m.update(measure(x, spoken(line["text"])), metric_version=METRIC_VERSION)
        with open(meta, "w") as f:
            json.dump(m, f, indent=1)
        return path, m
    x = render_line(backend, line, script, voice, speed)
    x *= 10 ** ((LINE_LUFS - pyln.Meter(SR).integrated_loudness(x)) / 20) if len(x) > SR * 0.5 else 1
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sf.write(path, x, SR, subtype="PCM_24")
    m = measure(x, spoken(line["text"]))
    m.update({"backend": backend.name, "voice": voice, "speed": speed, "line": line["id"], "metric_version": METRIC_VERSION})
    with open(meta, "w") as f:
        json.dump(m, f, indent=1)
    return path, m


def slots(script) -> dict:
    cues = [(l["id"], l["cue_s"]) for l in script["lines"]]
    out = {}
    for i, (lid, cue) in enumerate(cues):
        out[lid] = (cues[i + 1][1] - cue - 0.35) if i + 1 < len(cues) else 6.0
    return out


def cmd_audition(a):
    script, backend = load_script(), get_backend(a.backend)
    report = {}
    for voice in a.voices.split(","):
        ms = [make_take(backend, l, script, voice, l["speed"])[1] for l in script["lines"]]
        report[voice] = {"mean_wer": round(float(np.mean([m["wer"] for m in ms])), 3),
                         "mean_pitch_range_st": round(float(np.mean([m["pitch_range_st"] for m in ms])), 2),
                         "mean_end_drop_st": round(float(np.mean([m["end_drop_st"] for m in ms])), 2),
                         "mean_words_per_s": round(float(np.mean([m["words_per_s"] for m in ms])), 2),
                         "total_speech_s": round(float(sum(m["duration_s"] for m in ms)), 2),
                         "mean_score": round(float(np.mean([score(m, None) for m in ms])), 2)}
        print(voice, report[voice])
    os.makedirs(NARR, exist_ok=True)
    with open(os.path.join(NARR, f"audition-{a.backend}.json"), "w") as f:
        json.dump(report, f, indent=1)


def cmd_takes(a):
    script, backend = load_script(), get_backend(a.backend)
    sl, wanted = slots(script), set(a.lines.split(",")) if a.lines else None
    selection_path = os.path.join(NARR, "selection.json")
    selection = json.load(open(selection_path)) if os.path.exists(selection_path) else {}
    for line in script["lines"]:
        if wanted and line["id"] not in wanted:
            continue
        speeds = sorted({round(line["speed"] + d, 2) for d in (-0.04, 0.0, 0.04)})
        cands = []
        for sp in speeds:
            path, m = make_take(backend, line, script, a.voice, sp)
            cands.append((score(m, sl[line["id"]]), abs(sp - line["speed"]), path, m))
        cands.sort(key=lambda c: (c[0], c[1]))
        cands = [(c[0], c[2], c[3]) for c in cands]
        best = cands[0]
        selection[line["id"]] = {"path": os.path.relpath(best[1], ROOT), "score": best[0], **{k: best[2][k] for k in (
            "voice", "speed", "duration_s", "wer", "pitch_range_st", "end_drop_st", "words_per_s", "asr")},
            "alternatives": [{"path": os.path.relpath(c[1], ROOT), "score": c[0]} for c in cands[1:]]}
        print(line["id"], f"score={best[0]}", f"dur={best[2]['duration_s']}s", f"wer={best[2]['wer']}", best[2]["asr"])
    with open(selection_path, "w") as f:
        json.dump(selection, f, indent=1)


def cmd_assemble(a):
    script = load_script()
    selection = json.load(open(os.path.join(NARR, "selection.json")))
    voices = {s["voice"] for s in selection.values()}
    if len(voices) > 1:
        raise SystemExit(f"refusing to stitch different voices: {voices}")
    out = np.zeros(int(a.duration * SR), np.float32)
    timing = []
    for line in script["lines"]:
        x, _ = sf.read(os.path.join(ROOT, selection[line["id"]]["path"]), dtype="float32")
        start = int(line["cue_s"] * SR)
        end = min(len(out), start + len(x))
        out[start:end] += x[:end - start]
        timing.append({"id": line["id"], "start_s": line["cue_s"], "end_s": round(line["cue_s"] + len(x) / SR, 3),
                       "text": spoken(line["text"])})
    for a_, b_ in zip(timing, timing[1:]):
        if a_["end_s"] > b_["start_s"] - 0.2:
            print(f"WARNING overlap/tight gap: {a_['id']} ends {a_['end_s']} vs {b_['id']} at {b_['start_s']}")
    os.makedirs(os.path.join(ROOT, "audio", "stems"), exist_ok=True)
    sf.write(os.path.join(ROOT, "audio", "stems", "narration.wav"), np.stack([out, out], 1), SR, subtype="PCM_24")
    with open(os.path.join(NARR, "timing.json"), "w") as f:
        json.dump(timing, f, indent=1)
    print("narration stem written;", sum(len(t["text"].split()) for t in timing), "words")


def cmd_validate(a):
    """ASR the assembled stem and compare with the approved script, line by line and overall."""
    script = load_script()
    timing = json.load(open(os.path.join(NARR, "timing.json")))
    x, sr = sf.read(os.path.join(ROOT, "audio", "stems", "narration.wav"), dtype="float32")
    mono = x.mean(1) if x.ndim > 1 else x
    report, all_words, heard_all = {"lines": []}, [], []
    for t in timing:
        a0, a1 = int((t["start_s"] - 0.1) * sr), int((t["end_s"] + 0.15) * sr)
        seg = resample_poly(mono[a0:a1], 1, 3).astype(np.float32)
        text, words = transcribe_array(seg, offset=t["start_s"] - 0.1)
        cmp = compare(t["text"], text, ALIASES)
        report["lines"].append({"id": t["id"], "expected": t["text"], "heard": text, **cmp})
        heard_all.append(text)
        all_words += [{"text": w.text, "start": round(w.start, 3), "end": round(w.end, 3), "line": t["id"]} for w in words]
    full = compare(" ".join(t["text"] for t in timing), " ".join(heard_all), ALIASES)
    report.update({"overall_wer": round(full["wer"], 4), "issues": full["issues"],
                   "script_words": full["ref_words"], "passed": full["wer"] == 0.0})
    os.makedirs(os.path.join(ROOT, "qa"), exist_ok=True)
    with open(os.path.join(ROOT, "qa", "narration-validation.json"), "w") as f:
        json.dump(report, f, indent=1)
    with open(os.path.join(NARR, "words.json"), "w") as f:
        json.dump(all_words, f, indent=1)
    print("overall WER", report["overall_wer"], "issues:", full["issues"] or "none")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("audition"); p.add_argument("--voices", required=True); p.add_argument("--backend", default="kokoro")
    p = sub.add_parser("takes"); p.add_argument("--voice", required=True); p.add_argument("--lines"); p.add_argument("--backend", default="kokoro")
    p = sub.add_parser("assemble"); p.add_argument("--duration", type=float, default=65.0)
    sub.add_parser("validate")
    a = ap.parse_args()
    {"audition": cmd_audition, "takes": cmd_takes, "assemble": cmd_assemble, "validate": cmd_validate}[a.cmd](a)
