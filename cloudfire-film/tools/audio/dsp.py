"""Small DSP toolkit for the score, sound design and mix (numpy/scipy, 48 kHz float32)."""
from __future__ import annotations
import numpy as np
from scipy import signal

SR = 48000
BPM = 96.0
BEAT = 60.0 / BPM          # 0.625 s = 15 frames at 24 fps
BAR = 4 * BEAT             # 2.5 s = 60 frames
F = 1 / 24                 # one film frame in seconds


def midi(n: float) -> float:
    return 440.0 * 2 ** ((n - 69) / 12)


NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
NOTE.update({"Db": 1, "Eb": 3, "Gb": 6, "Ab": 8, "Bb": 10})


def nm(name: str) -> int:
    """'D4' → 62, 'Bb2' → 46."""
    pitch, octv = name[:-1], int(name[-1])
    return 12 * (octv + 1) + NOTE[pitch]


def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def polyblep_saw(freq: np.ndarray | float, n: int, phase0: float = 0.0) -> np.ndarray:
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    t = ph[m] / dt[m]
    y[m] -= t + t - t * t - 1
    m = ph > 1 - dt
    t = (ph[m] - 1) / dt[m]
    y[m] -= t * t + t + t + 1
    return y


def polyblep_pulse(freq, n, width=0.5, phase0=0.0):
    return 0.5 * (polyblep_saw(freq, n, phase0) - polyblep_saw(freq, n, (phase0 + width) % 1.0))


def env_adsr(n, a, d, s, r, sustain_len=None):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, (n - a_n - d_n - r_n) if sustain_len is None else int(sustain_len * SR))
    e = np.concatenate([np.linspace(0, 1, max(1, a_n), endpoint=False) ** 1.6,
                        1 - (1 - s) * (1 - np.exp(-5 * np.linspace(0, 1, max(1, d_n)))),
                        np.full(s_n, s), s * np.exp(-6 * np.linspace(0, 1, max(1, r_n)))])
    if len(e) < n:
        e = np.concatenate([e, np.zeros(n - len(e))])
    return e[:n]


def lowpass_sweep(x, cutoff, q=0.707, block=256):
    """Time-varying biquad low-pass; cutoff is an array (Hz) or scalar, updated per block with state carry-over."""
    cut = np.broadcast_to(np.asarray(cutoff, dtype=np.float64), (len(x),))
    y = np.zeros_like(x)
    zi = np.zeros(2)
    for i in range(0, len(x), block):
        fc = float(np.clip(cut[i], 30, SR * 0.45))
        b, a = signal.iirfilter(2, fc, btype="low", ftype="butter", fs=SR) if q == 0.707 else rbj("lp", fc, q)
        seg, zi = signal.lfilter(b, a, x[i:i + block], zi=zi * 1.0)
        y[i:i + block] = seg
    return y


def rbj(kind, fc, q=0.707, gain_db=0.0):
    w0 = 2 * np.pi * fc / SR
    alpha = np.sin(w0) / (2 * q)
    A = 10 ** (gain_db / 40)
    c = np.cos(w0)
    if kind == "lp":
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]; a = [1 + alpha, -2 * c, 1 - alpha]
    elif kind == "hp":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + alpha, -2 * c, 1 - alpha]
    elif kind == "bp":
        b = [alpha, 0, -alpha]; a = [1 + alpha, -2 * c, 1 - alpha]
    elif kind == "peak":
        b = [1 + alpha * A, -2 * c, 1 - alpha * A]; a = [1 + alpha / A, -2 * c, 1 - alpha / A]
    elif kind == "lowshelf":
        sq = 2 * np.sqrt(A) * alpha
        b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
        a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
    elif kind == "highshelf":
        sq = 2 * np.sqrt(A) * alpha
        b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
        a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    else:
        raise ValueError(kind)
    b, a = np.array(b) / a[0], np.array(a) / a[0]
    return b, a


def filt(x, kind, fc, q=0.707, gain_db=0.0):
    b, a = rbj(kind, fc, q, gain_db)
    return signal.lfilter(b, a, x, axis=0)


def pan(x, p):
    """Equal-power pan, p in [-1, 1] (scalar or array) → stereo (n, 2)."""
    p = np.asarray(p)
    th = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], axis=-1)


def place(buf, x, t0):
    """Add x (mono or stereo) into buf (n, 2) starting at time t0 (s)."""
    i = int(round(t0 * SR))
    if x.ndim == 1:
        x = np.stack([x, x], axis=-1)
    if i < 0:
        x, i = x[-i:], 0
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[:j - i]


def make_ir(seconds=3.2, t60=2.6, predelay=0.018, damp=4200, seed=3, early=True):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.91 * t / t60)
    ir = rng.standard_normal((n, 2)) * decay[:, None]
    # frequency-dependent decay: progressively darker tail
    lp_fast = filt(ir, "lp", damp * 0.35)
    mix = np.clip(t / seconds * 1.6, 0, 1)[:, None]
    ir = ir * (1 - mix) + lp_fast * mix
    ir = filt(ir, "hp", 120)
    if early:
        for d, g, p in [(0.011, .5, -.6), (0.017, .42, .5), (0.023, .35, -.2), (0.031, .3, .7), (0.041, .22, -.8)]:
            k = int(d * SR)
            ir[k] += np.array([g * (1 - p) / 2, g * (1 + p) / 2]) * 2.2
    pre = np.zeros((int(predelay * SR), 2))
    ir = np.concatenate([pre, ir])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, ir, wet=0.3):
    if x.ndim == 1:
        x = np.stack([x, x], -1)
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], -1)
    return x * (1 - wet * 0.35) + y * wet * 0.12


def pingpong(x, delay_s, fb=0.35, wet=0.25, lp=5000):
    """Stereo ping-pong delay with a darkening feedback path (block-free recursive implementation)."""
    if x.ndim == 1:
        x = np.stack([x, x], -1)
    d = int(delay_s * SR)
    out = np.zeros((len(x) + d * 8, 2))
    tap = x.mean(1)
    acc = np.zeros(len(out))
    acc[:len(tap)] = tap
    side = 0
    cur = filt(tap, "lp", lp)
    for k in range(1, 8):
        start = d * k
        seg = cur * (fb ** (k - 1))
        out[start:start + len(seg), side] += seg
        side ^= 1
        cur = filt(cur, "lp", lp)
    y = out[:len(x)]
    return x + y * wet


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def db(x):
    return 20 * np.log10(np.maximum(1e-12, x))


def true_peak_db(x, oversample=4):
    up = signal.resample_poly(x, oversample, 1, axis=0)
    return db(np.max(np.abs(up)))
