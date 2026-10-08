"""Conform the OTIO timeline to deliverables with FFmpeg.

    python tools/edit/conform.py --otio timeline/master.otio --profile master-mp4 --audio audio/stems/mix.wav --out renders/final/x.mp4

Validates every referenced frame before encoding (exists, correct size, not unintentionally blank) and refuses to
encode on failure, so missing renders can never be silently replaced by black. Profiles define codec, scaling,
the film grade and the grain.
"""
from __future__ import annotations
import argparse, json, os, subprocess, sys, tempfile
import numpy as np
import opentimelineio as otio
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
INTENDED_BLACK = set(range(0, 8)) | set(range(1556, 1560))  # opening silence; final frames of the fade

# The look: lifted charcoal blacks, a whisper of warmth in the highlights, restrained saturation, fine grain, soft vignette.
GRADE = ("curves=all='0/0.012 0.25/0.235 0.5/0.5 0.75/0.765 1/0.985':r='0/0 0.6/0.605 1/1':b='0/0.004 0.6/0.595 1/0.99',"
         "eq=saturation=0.96,vignette=angle=0.32:mode=forward")
GRAIN = "noise=c0s={s}:c0f=t+u:c1s={c}:c1f=t+u:c2s={c}:c2f=t+u"

PROFILES = {
    "animatic":   {"size": (1920, 1080), "vcodec": ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high"], "acodec": ["-c:a", "aac", "-b:a", "256k"], "grade": True, "grain": (3, 1)},
    "master-mp4": {"size": (3840, 2160), "vcodec": ["-c:v", "libx264", "-preset", "slow", "-crf", "17", "-maxrate", "40M", "-bufsize", "80M", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "5.1", "-tune", "film"], "acodec": ["-c:a", "aac", "-b:a", "320k"], "grade": True, "grain": (3, 1)},
    "master-mov": {"size": (3840, 2160), "vcodec": ["-c:v", "prores_ks", "-profile:v", "3", "-vendor", "apl0", "-pix_fmt", "yuv422p10le"], "acodec": ["-c:a", "pcm_s24le"], "grade": True, "grain": (3, 1)},
    "web-1080":   {"size": (1920, 1080), "vcodec": ["-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high", "-tune", "film"], "acodec": ["-c:a", "aac", "-b:a", "320k"], "grade": True, "grain": (3, 1)},
}


def frames_from_otio(path):
    tl = otio.adapters.read_from_file(path)
    v1 = tl.tracks[0]
    files = []
    for clip in v1:
        ref = clip.media_reference
        sr = clip.source_range
        for f in range(int(sr.start_time.value), int(sr.start_time.value + sr.duration.value)):
            files.append((f, os.path.join(ROOT, ref.target_url_base, f"{ref.name_prefix}{f:0{ref.frame_zero_padding}d}{ref.name_suffix}"), clip.name))
    return tl, files


def validate(files, size):
    problems = []
    for f, p, shot in files:
        if not os.path.exists(p):
            problems.append(f"missing frame {f} ({shot})"); continue
        im = Image.open(p)
        if im.size != size:
            problems.append(f"frame {f} is {im.size}, expected {size}"); continue
        if f % 12 == 0 and f not in INTENDED_BLACK:
            a = np.asarray(im.convert("L").resize((96, 54)))
            if a.max() < 12:
                problems.append(f"frame {f} ({shot}) is blank")
    return problems


def encode(files, audio, profile, out, fps=24, start=None, end=None, extra_vf=None):
    pr = PROFILES[profile]
    sel = [(f, p) for f, p, _ in files if (start is None or f >= start) and (end is None or f < end)]
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as lst:
        for _, p in sel:
            lst.write(f"file '{p}'\nduration {1 / fps:.10f}\n")
        lst.write(f"file '{sel[-1][1]}'\n")
    vf = []
    if extra_vf:
        vf.append(extra_vf)
    if pr["grade"]:
        vf.append(GRADE)
    if pr["grain"]:
        vf.append(GRAIN.format(s=pr["grain"][0], c=pr["grain"][1]))
    vf.append(f"scale={pr['size'][0]}:{pr['size'][1]}:flags=lanczos,setsar=1,format={'yuv422p10le' if 'prores' in pr['vcodec'][1] else 'yuv420p'}")
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst.name]
    if audio:
        a0 = (start or 0) / fps
        cmd += ["-ss", f"{a0:.6f}", "-t", f"{len(sel) / fps:.6f}", "-i", audio]
    cmd += ["-vf", ",".join(vf), "-r", str(fps), "-fps_mode", "cfr", *pr["vcodec"]]
    if audio:
        cmd += [*pr["acodec"], "-ar", "48000", "-ac", "2", "-map", "0:v", "-map", "1:a", "-shortest"]
    cmd += ["-movflags", "+faststart", "-metadata", "title=Beneath the Surface — CloudFire", "-metadata", "comment=cloudfireitservices.com", out]
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(cmd, check=True)
    os.unlink(lst.name)
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--otio", default="timeline/master.otio")
    ap.add_argument("--profile", required=True, choices=PROFILES)
    ap.add_argument("--audio")
    ap.add_argument("--out", required=True)
    ap.add_argument("--start", type=int)
    ap.add_argument("--end", type=int)
    ap.add_argument("--src-size", help="WxH of the frames referenced by the timeline (default: profile size)")
    a = ap.parse_args()
    tl, files = frames_from_otio(os.path.join(ROOT, a.otio))
    size = tuple(map(int, a.src_size.split("x"))) if a.src_size else PROFILES[a.profile]["size"]
    probs = validate(files, size)
    if probs:
        print("VALIDATION FAILED:\n  " + "\n  ".join(probs[:30]), file=sys.stderr)
        sys.exit(2)
    out = encode(files, a.audio and os.path.join(ROOT, a.audio), a.profile, os.path.join(ROOT, a.out), start=a.start, end=a.end)
    print("encoded", os.path.relpath(out, ROOT))
