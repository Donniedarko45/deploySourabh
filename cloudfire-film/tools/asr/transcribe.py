"""Local speech recognition with word timings (NVIDIA Parakeet TDT 0.6B v2, int8, via sherpa-onnx).

The model runs offline. Parakeet emits sub-word tokens with start times; this module groups them into
words and estimates each word's end from the next token's start (capped) so captions can be timed.

    python tools/asr/transcribe.py audio.wav [--json out.json]
"""
from __future__ import annotations
import argparse, json, os, re, sys
from dataclasses import dataclass, asdict
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

MODEL_DIR = os.environ.get("ASR_MODEL_DIR", "/home/user/film-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8")
_recognizer = None


@dataclass
class Word:
    text: str
    start: float
    end: float


def _get_recognizer():
    global _recognizer
    if _recognizer is None:
        import sherpa_onnx
        _recognizer = sherpa_onnx.OfflineRecognizer.from_transducer(
            encoder=f"{MODEL_DIR}/encoder.int8.onnx", decoder=f"{MODEL_DIR}/decoder.int8.onnx",
            joiner=f"{MODEL_DIR}/joiner.int8.onnx", tokens=f"{MODEL_DIR}/tokens.txt",
            model_type="nemo_transducer", num_threads=4, decoding_method="greedy_search")
    return _recognizer


def load_mono_16k(path: str) -> np.ndarray:
    audio, sr = sf.read(path, dtype="float32", always_2d=True)
    mono = audio.mean(axis=1)
    if sr != 16000:
        g = np.gcd(sr, 16000)
        mono = resample_poly(mono, 16000 // g, sr // g).astype(np.float32)
    return mono


def transcribe_array(samples16k: np.ndarray, offset: float = 0.0) -> tuple[str, list[Word]]:
    rec = _get_recognizer()
    stream = rec.create_stream()
    stream.accept_waveform(16000, samples16k)
    rec.decode_stream(stream)
    res = stream.result
    tokens, stamps = list(res.tokens), list(res.timestamps)
    words: list[Word] = []
    for i, (tok, t) in enumerate(zip(tokens, stamps)):
        nxt = stamps[i + 1] if i + 1 < len(stamps) else t + 0.35
        # SentencePiece marks a word start with a leading space or the ▁ character
        if tok.startswith((" ", "▁")) or not words:
            words.append(Word(tok.replace("▁", "").strip(), t + offset, min(nxt, t + 0.9) + offset))
        else:
            words[-1].text += tok
            words[-1].end = min(nxt, t + 0.9) + offset
    words = [w for w in words if w.text]
    return res.text.strip(), words


def transcribe_file(path: str, chunk_s: float = 20.0) -> tuple[str, list[Word]]:
    """Chunk long audio at silences so the encoder sees manageable windows."""
    x = load_mono_16k(path)
    if len(x) <= chunk_s * 16000:
        return transcribe_array(x)
    frame = 160
    energy = np.sqrt(np.convolve(x ** 2, np.ones(frame) / frame, mode="same"))
    texts, words, start = [], [], 0
    while start < len(x):
        end = min(len(x), start + int(chunk_s * 16000))
        if end < len(x):  # split inside the longest real pause (>= 250 ms) of the last 6 s, never mid-word
            lo = end - 6 * 16000
            win = energy[lo:end]
            quiet = win < max(np.percentile(win, 20) * 1.5, 1e-4)
            best, run, best_mid = 0, 0, None
            for i, q in enumerate(quiet):
                run = run + 1 if q else 0
                if run > best:
                    best, best_mid = run, i - run // 2
            end = lo + (best_mid if best_mid is not None and best >= 4000 else int(np.argmin(win)))
        t, w = transcribe_array(x[start:end], offset=start / 16000)
        if t:
            texts.append(t)
        words.extend(w)
        start = end
    return " ".join(texts), words


def normalize(text: str) -> list[str]:
    text = text.lower().replace("’", "'")
    text = re.sub(r"\[pause [0-9.]+\]", " ", text)
    return re.findall(r"[a-z0-9']+", text)


def compare(reference: str, hypothesis: str, aliases: dict[str, list[str]] | None = None) -> dict:
    """Word-level alignment: substitutions, omissions, insertions (repeats) and WER."""
    import difflib
    ref, hyp = normalize(reference), normalize(hypothesis)
    # Treat known spellings of brand names as equivalent (e.g. ASR "aegis store" for "aegisstore").
    for canonical, forms in (aliases or {}).items():
        for form in forms:
            parts = normalize(form)
            i = 0
            while i <= len(hyp) - len(parts):
                if hyp[i:i + len(parts)] == parts:
                    hyp[i:i + len(parts)] = [canonical.lower()]
                i += 1
    sm = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False)
    issues = []
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op == "equal":
            continue
        issues.append({"type": {"replace": "substitution", "delete": "omission", "insert": "insertion"}[op],
                       "expected": " ".join(ref[a0:a1]), "heard": " ".join(hyp[b0:b1])})
    errors = sum(max(len(i["expected"].split()), len(i["heard"].split())) for i in issues)
    return {"wer": errors / max(1, len(ref)), "issues": issues, "ref_words": len(ref), "hyp_words": len(hyp)}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--json")
    a = ap.parse_args()
    text, words = transcribe_file(a.audio)
    print(text)
    if a.json:
        with open(a.json, "w") as f:
            json.dump({"text": text, "words": [asdict(w) for w in words]}, f, indent=1)
