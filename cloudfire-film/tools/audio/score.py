"""Original score for "Beneath the Surface" — composed and synthesized in code (no samples, no licensing exposure).

96 BPM, 4/4, bar = 2.5 s = 60 film frames, so every act change lands on a bar line and every cut on a beat.
D minor (Dorian colour) → a crescendo on C → resolution to F major (add 9) as the wordmark appears.

    python tools/audio/score.py [--out audio/stems/music.wav] [--duration 65]
"""
from __future__ import annotations
import argparse, json, os, sys
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
from dsp import (SR, BEAT, BAR, midi, nm, polyblep_saw, polyblep_pulse, env_adsr, lowpass_sweep, filt, pan, place,
                 make_ir, reverb, pingpong, soft_clip)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
rng = np.random.default_rng(1956)

# ---------------- harmony (bar → pad voicing, bass) ----------------
CH = {
    2: ("D3 A3 E4 F4", "D2"), 3: ("D3 A3 E4 F4", "D2"), 4: ("Bb2 F3 A3 D4", "Bb1"), 5: ("G2 D3 F3 A3 Bb3", "G1"),
    6: ("A2 E3 A3 D4", "A1"),
    7: ("D3 A3 C4 E4 F4", "D2"), 8: ("Bb2 F3 A3 C4 D4", "Bb1"), 9: ("A2 F3 A3 C4 F4", "A1"), 10: ("G2 D3 F3 Bb3", "G1"),
    11: ("D3 A3 C4 E4 F4", "D2"), 12: ("Bb2 F3 A3 C4 D4", "Bb1"), 13: ("C3 F3 A3 E4", "C2"), 14: ("C3 G3 D4 E4", "C2"),
    15: ("Bb2 F3 A3 D4 F4", "Bb1"), 16: ("A2 F3 C4 F4 A4", "A1"), 17: ("G2 D3 F3 A3 Bb3 D4", "G1"), 18: ("F2 D3 A3 E4 F4", "F1"),
    19: ("A2 E3 A3 D4 E4", "A1"),
    20: ("Bb2 F3 A3 D4", "Bb1"), 21: ("G2 D3 F3 A3 Bb3", "G1"), 22: ("C3 F3 G3 C4 D4", "C2"),
    23: ("F2 C3 A3 E4 G4", "F1"), 24: ("F2 C3 A3 E4 G4", "F1"), 25: ("F2 C3 A3 E4 G4", "F1"),
}
# chord tones that change mid-bar (suspension resolutions): bar → (beat, voicing)
RESOLVE = {6: (2, "A2 E3 A3 C#4 E4"), 14: (2, "C3 G3 C4 E4"), 19: (2, "A2 E3 A3 C#4 E4"), 22: (2.5, "C3 E3 G3 C4 E4")}

# motif fragments for the felt keys: (bar, beat, note, beats, velocity)
MOTIF = [
    (1, 2.0, "A3", 1, .55), (1, 3.0, "D4", 2, .62),                                   # the first phrase, at the transformation (3.75 s)
    (3, 0.0, "A4", 1, .42), (3, 1.0, "D5", 3, .45),
    (5, 0.0, "A4", 1, .42), (5, 1.0, "D5", 1, .45), (5, 2.0, "E5", 2, .48),
    (9, 0.0, "A4", .5, .44), (9, 0.5, "D5", .5, .46), (9, 1.0, "E5", 1, .48), (9, 2.0, "F5", 2, .5),
    (11, 0.0, "A4", .5, .44), (11, 0.5, "D5", .5, .46), (11, 1.0, "E5", 1, .48), (11, 2.0, "F5", 1, .5), (11, 3.0, "E5", 1, .45),
    (13, 0.0, "C5", 1, .46), (13, 1.0, "E5", 1, .48), (13, 2.0, "A5", 2, .5),
    # the full statement (Act IV)
    (15, 0.0, "F5", 1.5, .62), (15, 1.5, "E5", .5, .55), (15, 2.0, "D5", 1, .55), (15, 3.0, "C5", 1, .5),
    (16, 0.0, "A4", 1, .55), (16, 1.0, "C5", 1, .57), (16, 2.0, "F5", 2, .62),
    (17, 0.0, "D5", 1, .58), (17, 1.0, "F5", 1, .6), (17, 2.0, "A5", 1, .66), (17, 3.0, "G5", 1, .6),
    (18, 0.0, "F5", 1.5, .6), (18, 1.5, "E5", .5, .52), (18, 2.0, "D5", 2, .55),
    (19, 0.0, "E5", 2, .55), (19, 2.0, "C#5", 2, .5),
    (21, 2.0, "A4", 1, .4), (21, 3.0, "D5", 1, .44),
    (22, 0.0, "E5", 1, .5), (22, 1.0, "F5", 1, .55), (22, 2.0, "G5", 2, .6),
    # resolution under the wordmark
    (23, 0.0, "A5", 1, .62), (23, 1.0, "C6", 1, .55), (23, 2.0, "F5", 2, .58), (24, 0.0, "G5", 6, .5),
]

NARR = []


def t_of(bar, beat=0.0):
    return bar * BAR + beat * BEAT


def in_narration(t):
    return any(a - .15 <= t <= b + .2 for a, b in NARR)


# ---------------- instruments ----------------
def pad_chord(notes, t0, dur, cutoff_fn, level=1.0, attack=0.9, release=1.8):
    n = int((dur + release) * SR)
    t = t0 + np.arange(n) / SR
    out = np.zeros((n, 2))
    env = env_adsr(n, attack, .6, .85, release, sustain_len=max(0, dur - attack - .6))
    for k, name in enumerate(notes.split()):
        f0 = midi(nm(name))
        for j, det in enumerate((-8, 0, 7)):
            drift = 1 + (np.sin(t * (0.21 + .07 * j) + k) * 2.5 + det) / 1200 * np.log(2) * 1.0
            v = polyblep_saw(f0 * drift, n, rng.random())
            out += pan(v * .11, (-.45, 0, .45)[j] * (1 if k % 2 else -1) * .8)
    cut = np.array([cutoff_fn(x) for x in t[::256]]).repeat(256)[:n]
    for c in range(2):
        out[:, c] = lowpass_sweep(out[:, c], cut, block=256)
    return out * env[:, None] * level


def keys_note(name, vel, dur):
    """Felt keys: stiff-string partials with faster high decay, a soft hammer, and a damper at note-off."""
    f0 = midi(nm(name))
    n = int((dur + 2.6) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    B = 0.00035
    for p, amp in enumerate([1, .42, .22, .13, .07, .04], start=1):
        fp = f0 * p * np.sqrt(1 + B * p * p)
        if fp > SR * .45:
            break
        y += amp * np.sin(2 * np.pi * fp * t + rng.random() * 6.28) * np.exp(-t * (0.9 + p * 0.9 * (1 + vel)))
    hammer = filt(rng.standard_normal(n) * np.exp(-t * 180), "lp", 1800) * .25
    y = (y + hammer) * (1 - np.exp(-t * 400))
    off = int(dur * SR)
    damp = np.ones(n); damp[off:] = np.exp(-np.arange(n - off) / SR * 5)
    y = filt(y * damp, "lp", 2600 + vel * 2500)
    return y * vel


def arp_note(f, dur, cutoff, vel):
    n = int((dur + .25) * SR)
    t = np.arange(n) / SR
    v = polyblep_pulse(f, n, .32, rng.random()) * .6 + polyblep_saw(f * 1.003, n, rng.random()) * .4
    env = np.exp(-t * 9) * (1 - np.exp(-t * 600))
    fenv = cutoff * (0.5 + 1.5 * np.exp(-t * 18))
    y = lowpass_sweep(v, fenv, block=128)
    return y * env * vel


def bass_note(name, dur, vel=1.0):
    f0 = midi(nm(name))
    n = int((dur + .4) * SR)
    t = np.arange(n) / SR
    tri = 2 * np.abs(2 * ((f0 * t) % 1) - 1) - 1
    y = np.sin(2 * np.pi * f0 * t) + .18 * tri + .1 * np.sin(4 * np.pi * f0 * t)
    env = env_adsr(n, .02, .2, .8, .35, sustain_len=max(0, dur - .22))
    return soft_clip(y * env * vel, 1.4) * .9


def shaker(vel, length=.06):
    n = int(length * SR * 2.5)
    t = np.arange(n) / SR
    y = filt(rng.standard_normal(n), "bp", 7200 + rng.random() * 1500, 1.2) * np.exp(-t / length * 2.2) * (1 - np.exp(-t * 900))
    return y * vel


def frame_drum(vel, pitch=92):
    n = int(.7 * SR)
    t = np.arange(n) / SR
    f = pitch * (1 + .7 * np.exp(-t * 35))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    skin = filt(rng.standard_normal(n), "lp", 700) * np.exp(-t * 40) * .5
    return soft_clip((body + skin) * vel, 1.2)


def rim(vel):
    n = int(.15 * SR)
    t = np.arange(n) / SR
    y = filt(rng.standard_normal(n), "bp", 2600, 6) * np.exp(-t * 90) + np.sin(2 * np.pi * 1730 * t) * np.exp(-t * 60) * .3
    return y * vel


def air(dur, lp=5000):
    n = int(dur * SR)
    x = np.cumsum(rng.standard_normal(n)) ; x -= filt(x, "lp", 30)  # brown-ish
    x = filt(x, "lp", lp) ; x /= np.max(np.abs(x)) + 1e-9
    return x


# ---------------- arrangement ----------------
def compose(duration=65.0):
    N = int(duration * SR)
    bus = {k: np.zeros((N, 2)) for k in ("pad", "keys", "arp", "bass", "perc", "tex")}

    def pad_cut(t):  # filter arc of the pad
        pts = [(0, 800), (3.75, 1100), (5, 1400), (17.5, 2000), (37.5, 3400), (50, 1700), (52.5, 2100), (57.5, 4800), (65, 2200)]
        xs, ys = zip(*pts)
        c = float(np.interp(t, xs, ys))
        return c * (.8 if in_narration(t) else 1.0)

    # Act I: a breath of air under the layers parting, then the first chord at the transformation.
    place(bus["tex"], pan(air(2.4, 2400) * np.linspace(0, 1, int(2.4 * SR)) ** 2 * .05, 0), 1.6)
    place(bus["pad"], pad_chord("D3 A3 E4 F4", t_of(1, 2), 1.25 + BAR * .0, pad_cut, level=.55, attack=.35, release=1.2), t_of(1, 2))
    # Pads, bar by bar
    for b in range(2, 26):
        if b not in CH:
            continue
        notes, _ = CH[b]
        lvl = {2: .62, 3: .66, 4: .68, 5: .7, 6: .72}.get(b, .78 if b < 15 else .9 if b < 20 else .55 if b == 20 else .7 if b == 21 else .95 if b == 22 else .9)
        if b in RESOLVE:
            beat, alt = RESOLVE[b]
            place(bus["pad"], pad_chord(notes, t_of(b), beat * BEAT, pad_cut, lvl, attack=.5, release=.5), t_of(b))
            place(bus["pad"], pad_chord(alt, t_of(b, beat), BAR - beat * BEAT, pad_cut, lvl, attack=.25), t_of(b, beat))
        elif b >= 23:
            if b == 23:
                place(bus["pad"], pad_chord(notes, t_of(23), 6.3, pad_cut, .95, attack=.35, release=2.4), t_of(23))
        else:
            place(bus["pad"], pad_chord(notes, t_of(b), BAR, pad_cut, lvl, attack=1.1 if b < 7 else .7), t_of(b))
    # Bass
    for b in range(2, 26):
        if b not in CH or b >= 24:
            continue
        root = CH[b][1]
        if b < 7 or b in (20, 21):
            place(bus["bass"], pan(bass_note(root, BAR * .96, .55), 0), t_of(b))
        elif b == 22:
            for k in range(8):
                place(bus["bass"], pan(bass_note(root, BEAT * .45, .45 + k * .05), 0), t_of(22, k * .5))
        elif b == 23:
            place(bus["bass"], pan(bass_note(root, 6.5, .75), 0), t_of(23))
        else:
            fifth = root[:-1] + root[-1]
            for beat, d, v in [(0, 1.4, .7), (1.5, .45, .5), (2.5, 1.2, .6)]:
                place(bus["bass"], pan(bass_note(fifth, BEAT * d, v), 0), t_of(b, beat))
    # Felt keys motif, with a dotted-eighth echo
    for bar, beat, name, beats, vel in MOTIF:
        t0 = t_of(bar, beat)
        y = keys_note(name, vel, beats * BEAT)
        place(bus["keys"], pan(y, .12 if nm(name) > 72 else -.1), t0)
    # Arpeggio: 16ths over chord tones, the filter opening across Act III
    arp_bars = list(range(7, 20)) + [21, 22]
    for b in arp_bars:
        notes = CH[b][0].split()
        tones = sorted({nm(n) + 12 for n in notes if nm(n) + 12 >= 57})[:4] or [nm(notes[-1]) + 12]
        seq = tones + tones[-2:0:-1]
        for k in range(16):
            t0 = t_of(b, k * .25)
            if b in RESOLVE and k / 4 >= RESOLVE[b][0]:
                alt = sorted({nm(n) + 12 for n in RESOLVE[b][1].split() if nm(n) + 12 >= 57})[:4]
                seq = alt + alt[-2:0:-1]
            note = seq[k % len(seq)]
            base = float(np.interp(t0, [17.5, 35, 37.5, 50, 52.5, 57.5], [650, 1900, 2600, 2900, 1300, 4200]))
            narr = in_narration(t0)
            vel = (.5 + .25 * (k % 4 == 0) + .1 * (k % 2 == 0)) * (.7 if narr else 1) * (np.interp(t0, [17.5, 20, 52.5, 57.5], [.45, 1, .6, 1.25]))
            place(bus["arp"], pan(arp_note(midi(note), BEAT * .22, base * (.75 if narr else 1), vel), np.sin(k * .9) * .35), t0)
    # Percussion: shaker from bar 9, frame drum from bar 11, rim from bar 15, a build in 21–22, one soft hit at the resolution
    for b in range(9, 20):
        for k in range(8):
            v = (.22 if k % 2 else .13) * (1.15 if b >= 15 else 1)
            place(bus["perc"], pan(shaker(v * (0.85 + .3 * rng.random())), .35), t_of(b, k * .5 + (.04 if k % 2 else 0)))
    for b in range(11, 20):
        for beat, v in [(0, .55), (2.5, .35)] + ([(3.5, .25)] if b % 2 == 0 else []):
            place(bus["perc"], pan(frame_drum(v * (1.1 if b >= 15 else .9)), -.1), t_of(b, beat))
    for b in range(15, 20):
        for beat in (1, 3):
            place(bus["perc"], pan(rim(.18), .2), t_of(b, beat))
    for b in (21, 22):
        for k in range(16 if b == 22 else 8):
            step = .25 if b == 22 else .5
            v = np.interp(t_of(b, k * step), [t_of(21), t_of(23)], [.08, .32])
            place(bus["perc"], pan(shaker(v), .3), t_of(b, k * step))
        for k in range(4 if b == 21 else 8):
            step = 1 if b == 21 else .5
            v = np.interp(t_of(b, k * step), [t_of(21), t_of(23)], [.25, .7])
            place(bus["perc"], pan(frame_drum(v, 88 + k), -.1), t_of(b, k * step))
    place(bus["perc"], pan(frame_drum(.75, 72), 0), t_of(23))
    # Texture: faint data ticks in the world beneath (Act II–III), tuned to the key
    for i in range(70):
        t0 = 5.2 + rng.random() * 30
        f = midi(nm(rng.choice(["D6", "A6", "F6", "E6", "C7"])))
        n = int(.05 * SR); tt = np.arange(n) / SR
        tick = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 140) * (.035 + rng.random() * .03)
        place(bus["tex"], pan(tick, rng.uniform(-.8, .8)), t0)
    place(bus["tex"], pan(air(14, 3200) * .04, -.2), 50.0)
    # shimmer: the chord an octave or two up, softly, for the proof and the resolution
    bus["shim"] = np.zeros((N, 2))
    for b in list(range(15, 20)) + [23]:
        up = " ".join(n[:-1] + str(int(n[-1]) + 2) for n in CH[b][0].split()[1:4])
        place(bus["shim"], pad_chord(up, t_of(b), BAR if b < 23 else 6.0, lambda t: 6500, .35, attack=.8, release=2.2), t_of(b))

    ir_big, ir_small = make_ir(4.2, 3.4, damp=3800, seed=5), make_ir(1.6, 1.1, damp=6000, seed=9)
    wet = {"shim": (ir_big, .8), "pad": (ir_big, .55), "keys": (ir_big, .7), "arp": (ir_small, .45), "bass": (ir_small, .05), "perc": (ir_small, .32), "tex": (ir_big, .6)}
    gain = {"pad": .55, "keys": 1.05, "arp": .42, "bass": .26, "perc": .6, "tex": .8, "shim": .5}
    bus["bass"] = filt(bus["bass"], "hp", 36)
    mix = np.zeros((N, 2))
    for k, x in bus.items():
        if k in ("keys", "arp"):
            x = pingpong(x, BEAT * .75, fb=.32, wet=.22 if k == "keys" else .3, lp=3800)
        ir, w = wet[k]
        mix += reverb(x, ir, w) * gain[k]
    mix = filt(mix, "hp", 28)
    mix = filt(mix, "lowshelf", 110, .7, -2.5)
    mix = filt(mix, "peak", 320, .8, -1.5)  # clear some low-mid mud
    mix = filt(mix, "highshelf", 5000, .7, 3.0)
    # the act-level dynamic arc: Act II breathes, Act IV is fullest, a dip before the final crescendo
    arc_t = [0, 3.6, 5, 17, 17.5, 30, 37.5, 50, 50.6, 52.5, 57.4, 57.6, 62, 65]
    arc_g = [1.0, 1.0, .5, .55, .66, .8, .95, 1.0, .58, .6, 1.12, 1.08, .92, .85]
    mix *= np.interp(np.arange(N) / SR, arc_t, arc_g)[:, None]
    fade = np.ones(N); tail = int(3.2 * SR); fade[-tail:] = np.linspace(1, 0, tail) ** 1.5
    mix *= fade[:, None]
    mix[: int(1.55 * SR)] *= 0  # Act I opening silence belongs to the sound design
    return mix / (np.max(np.abs(mix)) + 1e-9) * .7


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "audio", "stems", "music.wav"))
    ap.add_argument("--duration", type=float, default=65.0)
    a = ap.parse_args()
    timing = os.path.join(ROOT, "audio", "narration", "timing.json")
    if os.path.exists(timing):
        NARR.extend((t["start_s"], t["end_s"]) for t in json.load(open(timing)))
    y = compose(a.duration)
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    sf.write(a.out, y.astype(np.float32), SR, subtype="FLOAT")
    plan = {"tempo_bpm": 96, "bar_s": BAR, "key": "D minor → F major", "chords": {b: CH[b][0] for b in sorted(CH)},
            "sections": [["tactile", 0, 3.75], ["reveal", 3.75, 5], ["motion", 5, 17.5], ["momentum", 17.5, 37.5], ["expansion", 37.5, 50],
                         ["resolution", 50, 65]], "motif": "A–D–E–F | E–C–D (felt keys)"}
    json.dump(plan, open(os.path.join(ROOT, "audio", "music", "composition-plan.json"), "w"), indent=1)
    print("music written", a.out, f"{len(y) / SR:.1f}s")


if __name__ == "__main__":
    main()
