"""Cut-downs from the master: 15 s teaser and 6 s bumper, each as its own OTIO timeline plus a re-cut mix.

Picture segments come from the master frame sequence. Effects and narration stay married to their picture (taken
from the same film time); the music is re-cut on bar lines (2.5 s) from a chosen bar so harmony still progresses
(crescendo on C → resolution on F at the reveal). Joins get 15 ms equal-power crossfades.

    python tools/edit/cutdowns.py --frames renders/frames/master
"""
from __future__ import annotations
import argparse, json, os, sys
import numpy as np
import soundfile as sf
import opentimelineio as otio

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
sys.path.insert(0, os.path.join(ROOT, "tools", "audio"))
from dsp import SR  # noqa: E402
import mix as mixmod  # noqa: E402

FPS = 24
# (picture start frame, picture end frame, music source start seconds)
EDITS = {
    "teaser": {"duration": 15.0, "fade_in": 0, "fade_out": 18, "segments": [
        (0, 120, 0.0),        # hook: click, macro, layers part, the dive (music: the first phrase)
        (180, 240, 30.0),     # beneath: the ceiling of light (music: bar 12, momentum)
        (958, 1018, 55.0),    # proof: storage-node-2 is crashed in AegisStore (music: bar 22, the crescendo on C)
        (1380, 1500, 57.5)]}, # reveal: dot → wordmark → tagline, "CloudFire." (music: bar 23, resolution on F)
    "bumper": {"duration": 6.0, "fade_in": 8, "fade_out": 14, "segments": [
        (1384, 1528, 57.6)]},
}


def load(name):
    x, sr = sf.read(os.path.join(ROOT, "audio", "stems", name), dtype="float64", always_2d=True)
    return x


def seg(x, t0, n):
    i = int(round(t0 * SR)); y = x[i:i + n]
    return np.pad(y, ((0, n - len(y)), (0, 0)))


def join(parts):
    """Concatenate with 15 ms fade-out/fade-in at each join (length preserving, no clicks)."""
    k = int(.015 * SR)
    out = []
    for i, p in enumerate(parts):
        p = p.copy()
        if i > 0:
            p[:k] *= np.linspace(0, 1, k)[:, None]
        if i < len(parts) - 1:
            p[-k:] *= np.linspace(1, 0, k)[:, None]
        out.append(p)
    return np.concatenate(out)


def build(name, spec, frames_dir):
    music, sfx, narr = load("music.wav"), load("sfx.wav"), load("narration.wav")
    m, s, v = [], [], []
    tl = otio.schema.Timeline(name=f"Beneath the Surface — {name}")
    v1 = otio.schema.Track(name="V1 Picture", kind=otio.schema.TrackKind.Video)
    for a, b, mus in spec["segments"]:
        n = int(round((b - a) / FPS * SR))
        m.append(seg(music, mus, n)); s.append(seg(sfx, a / FPS, n)); v.append(seg(narr, a / FPS, n))
        ref = otio.schema.ImageSequenceReference(target_url_base=os.path.relpath(frames_dir, ROOT) + "/", name_prefix="f", name_suffix=".png",
                                                 start_frame=0, frame_step=1, rate=FPS, frame_zero_padding=5,
                                                 available_range=otio.opentime.TimeRange(otio.opentime.RationalTime(0, FPS), otio.opentime.RationalTime(1560, FPS)))
        c = otio.schema.Clip(name=f"master {a}–{b}", media_reference=ref,
                             source_range=otio.opentime.TimeRange(otio.opentime.RationalTime(a, FPS), otio.opentime.RationalTime(b - a, FPS)))
        c.metadata["cloudfire"] = {"music_source_s": mus}
        v1.append(c)
    tl.tracks.append(v1)
    total = sum(b - a for a, b, _ in spec["segments"])
    assert abs(total / FPS - spec["duration"]) < 1e-6, (name, total)
    music_c, sfx_c, narr_c = join(m), join(s), join(v)
    N = len(music_c)
    env = np.ones(N)
    if spec["fade_in"]:
        k = int(spec["fade_in"] / FPS * SR); env[:k] = np.linspace(0, 1, k) ** 2
    k = int(spec["fade_out"] / FPS * SR); env[-k:] = np.linspace(1, 0, k) ** 1.5
    # same chain as the master mix (narration processing, ducking, loudness, true-peak limiting)
    vproc = mixmod.compress(mixmod.filt(mixmod.filt(narr_c, "hp", 80, .7), "peak", 3000, .9, 2.0), -26, 2.0)
    act = np.clip((mixmod.db(mixmod.envelope(narr_c, .03)) + 50) / 12, 0, 1)
    duck = mixmod.smooth_gain(10 ** (-7 * act / 20), .12, .45)
    out = (vproc + music_c * .55 * duck[:, None] + sfx_c * .5) * env[:, None]
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    for _ in range(3):
        out = out * 10 ** ((-14 - meter.integrated_loudness(out)) / 20)
        out = mixmod.limiter(out, -1.0)
    path = os.path.join(ROOT, "audio", "stems", f"mix-{name}.wav")
    sf.write(path, out.astype(np.float32), SR, subtype="PCM_24")
    otio.adapters.write_to_file(tl, os.path.join(ROOT, "timeline", f"{name}.otio"))
    print(name, f"{N / SR:.2f}s", "LUFS", round(meter.integrated_loudness(out), 2))
    return path


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default="renders/frames/master")
    a = ap.parse_args()
    for name, spec in EDITS.items():
        build(name, spec, os.path.join(ROOT, a.frames))
