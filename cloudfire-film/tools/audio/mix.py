"""Mix narration, music and effects stems to a distribution master: −14 LUFS integrated, ≤ −1 dBTP.

    python tools/audio/mix.py [--no-voice] [--out audio/stems/mix.wav]

Narration chain: HPF 80 Hz → presence +2 dB @ 3 kHz → 2:1 RMS compressor → de-ess band.
Music is side-chain ducked from the narration envelope (look-ahead 50 ms, attack 120 ms, release 450 ms, −7 dB);
effects are ducked −3 dB. A look-ahead limiter with 4× oversampled peak detection enforces the true-peak ceiling.
"""
from __future__ import annotations
import argparse, json, os, sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal

sys.path.insert(0, os.path.dirname(__file__))
from dsp import SR, filt, db, true_peak_db

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STEMS = os.path.join(ROOT, "audio", "stems")


def load(name, n=None):
    x, sr = sf.read(os.path.join(STEMS, name), dtype="float64", always_2d=True)
    assert sr == SR, (name, sr)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, 1)
    if n is not None:
        x = np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n]
    return x


def envelope(x, win=0.05):
    k = int(win * SR)
    e = np.sqrt(signal.fftconvolve(np.mean(x, 1) ** 2, np.ones(k) / k, mode="same").clip(0))
    return e


def smooth_gain(target, attack, release):
    """One-pole attack/release smoothing of a gain curve (linear), decimated for speed."""
    step = 48
    tg = target[::step]
    a_c, r_c = np.exp(-step / (attack * SR)), np.exp(-step / (release * SR))
    g = np.empty_like(tg); cur = 1.0
    for i, v in enumerate(tg):
        c = a_c if v < cur else r_c
        cur = c * cur + (1 - c) * v
        g[i] = cur
    return np.interp(np.arange(len(target)), np.arange(len(g)) * step, g)


def compress(x, thresh_db=-24, ratio=2.0, attack=.01, release=.15):
    e = envelope(x, .02)
    lvl = db(e)
    over = np.maximum(0, lvl - thresh_db)
    gain_db = -over * (1 - 1 / ratio)
    g = smooth_gain(10 ** (gain_db / 20), attack, release)
    return x * g[:, None]


def limiter(x, ceiling_dbtp=-1.0, lookahead=.005, release=.08):
    """Look-ahead peak limiter driven by 4x-oversampled peaks, so the output respects a true-peak ceiling."""
    up = 4
    peak = np.max(np.abs(signal.resample_poly(x, up, 1, axis=0)), axis=1)
    peak = peak[:len(x) * up].reshape(-1, up).max(1)
    peak = np.pad(peak, (0, max(0, len(x) - len(peak))))[:len(x)]
    ceil = 10 ** (ceiling_dbtp / 20) * .985
    need = np.minimum(1.0, ceil / np.maximum(peak, 1e-9))
    hold = _running_min(need, int(lookahead * SR))   # start reducing before the peak arrives
    g = np.minimum(smooth_gain(hold, .0005, release), hold)
    return x * g[:, None]


def _running_min(v, w):
    out = v.copy()
    for k in range(1, w + 1):
        out[:-k] = np.minimum(out[:-k], v[k:])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-voice", action="store_true")
    ap.add_argument("--out")
    ap.add_argument("--target", type=float, default=-14.0)
    ap.add_argument("--ceiling", type=float, default=-1.0, help="limiter ceiling in dBTP; leave headroom for lossy codecs")
    a = ap.parse_args()
    music = load("music.wav")
    n = len(music)
    sfx = load("sfx.wav", n)
    narr = load("narration.wav", n)
    # narration chain
    v = filt(narr, "hp", 80, .7)
    v = filt(v, "peak", 3000, .9, 2.0)
    v = filt(v, "lowshelf", 200, .7, -1.0)
    v = compress(v, -26, 2.0)
    de = filt(v, "bp", 7000, 2.0)
    de_amt = np.clip((envelope(de, .005) - .02) * 8, 0, .5)
    v = v - de * de_amt[:, None]
    # ducking from the narration envelope with look-ahead
    env = envelope(narr, .03)
    la = int(.05 * SR)
    env = np.concatenate([env[la:], np.zeros(la)])
    active = np.clip((db(env) + 50) / 12, 0, 1)
    duck_m = smooth_gain(10 ** (-7 * active / 20), .12, .45)
    duck_s = smooth_gain(10 ** (-3 * active / 20), .12, .45)
    stems = {"narration": v * 1.0, "music": music * .55 * duck_m[:, None], "sfx": sfx * .5 * duck_s[:, None]}
    if a.no_voice:
        stems["narration"] *= 0
        stems["music"] = music * .55
        stems["sfx"] = sfx * .5
    mix = sum(stems.values())
    meter = pyln.Meter(SR)
    # level the whole programme: gain to target, then limit; iterate once to settle
    for _ in range(3):
        L = meter.integrated_loudness(mix)
        mix = mix * 10 ** ((a.target - L) / 20)
        mix = limiter(mix, a.ceiling)
    L, tp = meter.integrated_loudness(mix), true_peak_db(mix)
    out = a.out or os.path.join(STEMS, "mix-novoice.wav" if a.no_voice else "mix.wav")
    sf.write(out, mix.astype(np.float32), SR, subtype="PCM_24")
    if not a.no_voice:  # mixed-level stems for delivery (same gains as the master, pre-limiter)
        scale = 10 ** ((a.target - meter.integrated_loudness(sum(stems.values()))) / 20)
        for k, x in stems.items():
            sf.write(os.path.join(STEMS, f"{k}-mixed.wav"), (x * scale).astype(np.float32), SR, subtype="PCM_24")
    # loudness range (EBU-style short-term distribution)
    st = [meter.integrated_loudness(mix[i:i + 3 * SR]) for i in range(0, len(mix) - 3 * SR, SR)]
    st = np.array([s for s in st if s > -70])
    lra = float(np.percentile(st, 95) - np.percentile(st, 10)) if len(st) else 0
    report = {"file": os.path.relpath(out, ROOT), "integrated_lufs": round(L, 2), "true_peak_dbtp": round(tp, 2), "lra_lu": round(lra, 1),
              "duration_s": round(len(mix) / SR, 3)}
    json.dump(report, open(os.path.join(ROOT, "qa", "mix-" + ("novoice" if a.no_voice else "main") + ".json"), "w"), indent=1)
    print(report)


if __name__ == "__main__":
    main()
