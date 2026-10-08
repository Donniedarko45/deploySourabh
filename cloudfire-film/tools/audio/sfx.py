"""Synchronized sound design: every event is placed on its picture frame (24 fps). Original synthesis only.

    python tools/audio/sfx.py [--out audio/stems/sfx.wav]
Writes audio/sfx/events.json (frame, time, sound) for QA sync checks.
"""
from __future__ import annotations
import argparse, json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
from dsp import SR, midi, nm, filt, pan, place, make_ir, reverb, soft_clip

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
rng = np.random.default_rng(77)
T = lambda n: np.arange(int(n * SR)) / SR


def click_mech(level=1.0):
    """The opening click: a precise high transient, a short body and a faint metallic ring."""
    t = T(.25)
    hi = filt(rng.standard_normal(len(t)), "bp", 6200, 1.4) * np.exp(-t * 900)
    body = np.sin(2 * np.pi * 1150 * t) * np.exp(-t * 260) * .55 + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 90) * .45
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(3170, 55, .05), (5420, 70, .035), (2280, 40, .03)])
    second = np.zeros_like(t); k = int(.016 * SR)  # the release half of the click, softer
    second[k:] = (filt(rng.standard_normal(len(t) - k), "bp", 4800, 1.6) * np.exp(-t[:len(t) - k] * 1200) * .35)
    return soft_clip((hi * .7 + body + ring + second) * level, 1.1)


def ui_click(level=.6):
    t = T(.12)
    y = filt(rng.standard_normal(len(t)), "bp", 3800, 1.8) * np.exp(-t * 700) * .6 + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 300) * .4
    return y * level


def sub_pulse(level=1.0, f=41.2):
    t = T(1.1)
    y = (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t)) * (1 - np.exp(-t * 60)) * np.exp(-t * 4.2)
    return y * level


def ignite(level=.5):
    """The dot: a tiny bloom with a rising partial (used twice, identical, as a callback)."""
    t = T(1.6)
    f = 880 * (1 + .5 * (1 - np.exp(-t * 18)))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2) * (1 - np.exp(-t * 80))
    halo = sum(np.sin(2 * np.pi * midi(nm(n)) * t) * np.exp(-t * 2.2) * .25 for n in ("A5", "D6", "E6"))
    breath = filt(rng.standard_normal(len(t)), "bp", 5200, .9) * np.exp(-t * 14) * (1 - np.exp(-t * 200)) * .12
    return (tone * .55 + halo * (1 - np.exp(-t * 6)) + breath) * level


def thock(note="D3", level=.45):
    t = T(.6)
    f0 = midi(nm(note))
    y = np.sin(2 * np.pi * f0 * t) * np.exp(-t * 14) + filt(rng.standard_normal(len(t)), "lp", 900) * np.exp(-t * 60) * .3
    return y * level


def tick(note="E5", level=.25, decay=60):
    t = T(.25)
    f0 = midi(nm(note))
    y = np.sin(2 * np.pi * f0 * t) * np.exp(-t * decay) + np.sin(2 * np.pi * f0 * 2.01 * t) * np.exp(-t * decay * 2) * .3
    return y * (1 - np.exp(-t * 3000)) * level


def chime(notes=("F5", "C6"), level=.3, gap=.07):
    out = np.zeros(int(2.2 * SR))
    for i, n in enumerate(notes):
        y = tick(n, 1.0, 4.5)
        t = T(2.0)
        y = np.sin(2 * np.pi * midi(nm(n)) * t) * np.exp(-t * 3.2) * (1 - np.exp(-t * 900)) + np.sin(2 * np.pi * midi(nm(n)) * 3 * t) * np.exp(-t * 9) * .12
        k = int(i * gap * SR); out[k:k + len(y)] += y[:len(out) - k]
    return out * level


def air_swell(dur, f_from, f_to, level=.2, shape=1.6, cut=False):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blk = 512
    zi_state = None
    from scipy import signal
    for i in range(0, n, blk):
        u = i / n
        fc = f_from * (f_to / f_from) ** u
        b, a = signal.iirfilter(2, [fc * .7, min(fc * 1.4, SR * .45)], btype="band", fs=SR)
        if zi_state is None:
            zi_state = signal.lfilter_zi(b, a) * 0
        out[i:i + blk], zi_state = signal.lfilter(b, a, x[i:i + blk], zi=zi_state)
    env = np.linspace(0, 1, n) ** shape
    if cut:
        env[-int(.03 * SR):] *= np.linspace(1, 0, int(.03 * SR))
    else:
        env *= np.minimum(1, np.linspace(4, 0, n))
    return out * env * level


def bloom(level=.5, notes=("D2", "A2", "D3")):
    t = T(3.5)
    y = sum(np.sin(2 * np.pi * midi(nm(n)) * t + i) for i, n in enumerate(notes)) / len(notes)
    return y * (1 - np.exp(-t * 7)) * np.exp(-t * 1.1) * level


def power_down(level=.35):
    t = T(1.0)
    f = 520 * np.exp(-t * 2.4) + 60
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5)
    crackle = (rng.random(len(t)) < .004) * rng.standard_normal(len(t)) * np.exp(-t * 6) * .6
    return filt(y + filt(crackle, "hp", 2000), "lp", 2400) * level


def signature(level=.6):
    """Sonic logo: a breath catching like a flame, then a bell cluster of the final chord (F add9)."""
    t = T(5.0)
    breath = air_swell(.55, 900, 3800, 1.0, 1.2)
    out = np.zeros(len(t))
    out[:len(breath)] += breath * .5
    for i, (n, a) in enumerate([("F4", .5), ("C5", .42), ("A5", .38), ("G6", .22), ("E6", .2)]):
        k = int((.32 + i * .028) * SR)
        f0 = midi(nm(n)); tt = t[:len(t) - k]
        bell = (np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * .9) + np.sin(2 * np.pi * f0 * 2.76 * tt) * np.exp(-tt * 3.5) * .25
                + np.sin(2 * np.pi * f0 * 5.4 * tt) * np.exp(-tt * 8) * .08) * (1 - np.exp(-tt * 600))
        out[k:] += bell * a
    return out * level


def events():
    """(frame, generator, pan, label). Frames come from creative/shotlist.json and the capture metadata."""
    caps = json.load(open(os.path.join(ROOT, "assets/ui-captures/raw/captures.json")))
    up = 420 + caps["upload"]["events"][0]["frame"] - 2
    lab = 950 + caps["lab"]["events"][0]["frame"]
    rep = 1038 + caps["object"]["events"][0]["frame"] - 20
    ev = [
        (8, lambda: click_mech(1.0), 0, "click"), (12, lambda: sub_pulse(.9), 0, "sub_pulse"), (32, lambda: ignite(.5), -.05, "dot_ignite"),
        *[(82 + 4 * i, (lambda i=i: thock(["D3", "C3", "Bb2", "A2", "G2"][i], .32)), [-.3, .2, -.15, .25, 0][i], "layer_settle") for i in range(5)],
        (86, lambda: air_swell(1.45, 3200, 380, .22, 2.2, cut=True), 0, "dive_air"), (118, lambda: bloom(.5), 0, "arrival_bloom"),
        (160, lambda: thock("D3", .3), 0, "packet_lands"), (182, lambda: tick("A5", .14), -.2, "route"), (212, lambda: tick("D6", .14), .1, "route"),
        (242, lambda: tick("E6", .14), .3, "route"),
        (288, lambda: tick("E5", .22), -.3, "gate"), (306, lambda: tick("F5", .22), 0, "gate"), (324, lambda: tick("A5", .24), .3, "gate"),
        (362, lambda: power_down(.3), .1, "node_down"), (372, lambda: tick("D5", .16), -.2, "reroute"), (378, lambda: tick("E5", .16), 0, "reroute"),
        (384, lambda: tick("A5", .18), .2, "reroute"), (392, lambda: air_swell(1.2, 400, 2400, .12, 2.0), 0, "resolve_swell"),
        (420, lambda: air_swell(1.1, 300, 1400, .1, 1.0), 0, "surface_rise"), (up, lambda: ui_click(.5), .35, "ui_click_upload"),
        (492, lambda: tick("A5", .18), -.4, "replica"), (495, lambda: tick("D6", .18), .4, "replica"),
        (531, lambda: air_swell(1.1, 5000, 9000, .035, 1.0), -.3, "scan"),
        (566, lambda: tick("D6", .09), -.3, "extract"), (569, lambda: tick("E6", .09), -.3, "extract"), (572, lambda: tick("F6", .09), -.3, "extract"),
        (586, lambda: thock("A3", .16), 0, "retrieve"), (592, lambda: thock("D4", .14), 0, "retrieve"),
        (622, lambda: ui_click(.55), .25, "approve_click"), (626, lambda: chime(("D5", "A5"), .2), .25, "approved"), (640, lambda: tick("F6", .1), .4, "result"),
        (642, lambda: air_swell(.75, 500, 2600, .08, 1.5), 0, "ring_grow"),
        *[(int(664 + i * 12.8), (lambda i=i: tick(["D5", "E5", "F5", "G5", "A5"][i], .17)), [0, .4, .3, -.3, -.4][i], "stage") for i in range(5)],
        *[(int(743 + k * 2.2), (lambda k=k: tick("A6" if k % 2 else "E6", .045, 90)), (-.5 + (k % 6) / 5), "container") for k in range(18)],
        (772, lambda: chime(("F5", "C6"), .22), -.3, "deployed"),
        (826, lambda: air_swell(1.25, 600, 3000, .07, 1.6), 0, "untangle"), (872, lambda: thock("F3", .2), 0, "settle"), (880, lambda: chime(("A5", "F6"), .14), 0, "settle_chime"),
        (lab, lambda: ui_click(.6), .3, "toggle_click"), (lab + 12, lambda: power_down(.32), .45, "node_down"),
        (rep, lambda: ui_click(.45), .35, "replicas_click"), (rep + 4, lambda: chime(("D5", "A5"), .2), .35, "verified"),
        (1086, lambda: air_swell(.9, 400, 1600, .06, 1.2), 0, "modulx_settle"),
        (1200, lambda: air_swell(4.4, 2400, 220, .1, .6), 0, "converge"),
        (1330, lambda: ignite(.5), 0, "dot_return"),
        (1392, lambda: signature(.62), 0, "signature"),
    ]
    return ev


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "audio", "stems", "sfx.wav"))
    ap.add_argument("--duration", type=float, default=65.0)
    a = ap.parse_args()
    N = int(a.duration * SR)
    dry, verb = np.zeros((N, 2)), np.zeros((N, 2))
    log = []
    for frame, gen, p, label in events():
        y = gen()
        t0 = frame / 24
        place(dry, pan(y, p), t0)
        if label not in ("click", "sub_pulse", "ui_click_upload", "toggle_click", "approve_click", "replicas_click", "container"):
            place(verb, pan(y, p), t0)
        log.append({"frame": frame, "time_s": round(t0, 4), "sound": label})
    from scipy.signal import fftconvolve
    ir = make_ir(3.0, 2.4, damp=5000, seed=12)
    tail = np.stack([fftconvolve(verb[:, c], ir[:, c])[:N] for c in range(2)], -1) * .05
    out = dry + tail
    out[: int(8 / 24 * SR)] = 0  # true silence before the first click
    out = out / (np.max(np.abs(out)) + 1e-9) * .8
    sf.write(a.out, out.astype(np.float32), SR, subtype="FLOAT")
    os.makedirs(os.path.join(ROOT, "audio", "sfx"), exist_ok=True)
    json.dump(log, open(os.path.join(ROOT, "audio", "sfx", "events.json"), "w"), indent=1)
    print(f"sfx: {len(log)} events → {a.out}")


if __name__ == "__main__":
    main()
