"""Film critic, automated half: evidence and checks on a *rendered* file. The creative half (scores, verdict) is
written by a reviewer who has looked at the contact sheets this produces.

    python tools/qa/critic.py renders/final/cloudfire-master-16x9.mp4 --name master [--stems]
"""
from __future__ import annotations
import argparse, json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from qa.contact import sheet  # noqa: E402

FPS = 24


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", path])
    return json.loads(r.stdout)


def edit_points(otio_path):
    import opentimelineio as otio
    tl = otio.adapters.read_from_file(otio_path)
    pts, t = [], 0
    for c in tl.tracks[0]:
        t += int(c.source_range.duration.value); pts.append(t)
    return pts[:-1]


def extract(path, frames, outdir, width=640):
    os.makedirs(outdir, exist_ok=True)
    out = []
    for f in frames:
        p = os.path.join(outdir, f"f{f:05d}.png")
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{f / FPS + 0.001:.4f}", "-i", path, "-frames:v", "1", "-vf", f"scale={width}:-2", p])
        if os.path.exists(p):
            out.append(p)
    return out


def detect(path, flt, pattern):
    r = run(["ffmpeg", "-v", "info", "-i", path, "-vf" if "detect" in flt and "silence" not in flt else "-af", flt, "-f", "null", "-"])
    return re.findall(pattern, r.stderr)


def luma_series(path):
    r = run(["ffmpeg", "-v", "error", "-i", path, "-vf", "scale=320:-2,signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"])
    return np.array([float(v) for v in re.findall(r"YAVG=([0-9.]+)", r.stderr)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--name", required=True)
    ap.add_argument("--otio", default="timeline/master.otio")
    ap.add_argument("--script", default="creative/narration.json")
    ap.add_argument("--expect-voice", action="store_true", default=True)
    ap.add_argument("--no-voice", action="store_true")
    a = ap.parse_args()
    path = os.path.join(ROOT, a.video)
    out = os.path.join(ROOT, "qa", a.name); os.makedirs(out, exist_ok=True)
    rep = {"file": a.video}

    # ---- technical ----
    pr = probe(path)
    v = next(s for s in pr["streams"] if s["codec_type"] == "video")
    au = [s for s in pr["streams"] if s["codec_type"] == "audio"]
    rep["technical"] = {"container": pr["format"]["format_name"], "duration_s": float(pr["format"]["duration"]), "size_mb": round(int(pr["format"]["size"]) / 1e6, 1),
                        "video": {"codec": v["codec_name"], "profile": v.get("profile"), "pix_fmt": v["pix_fmt"], "width": v["width"], "height": v["height"],
                                  "fps": v["r_frame_rate"], "frames": int(v.get("nb_frames", 0) or 0), "bitrate_mbps": round(int(v.get("bit_rate", 0) or 0) / 1e6, 2)},
                        "audio": [{"codec": s["codec_name"], "sample_rate": s["sample_rate"], "channels": s["channels"]} for s in au]}
    dec = run(["ffmpeg", "-v", "error", "-i", path, "-f", "null", "-"])
    rep["technical"]["decode_errors"] = dec.stderr.strip().splitlines()[:10]

    # ---- frames & contact sheets ----
    dur = rep["technical"]["duration_s"]
    regular = list(range(0, int(dur * FPS), 2 * FPS)) + [int(dur * FPS) - 1]
    edits = edit_points(os.path.join(ROOT, a.otio)) if os.path.exists(os.path.join(ROOT, a.otio)) else []
    around = sorted({f for e in edits for f in (e - 1, e)})
    regs = extract(path, regular, os.path.join(out, "frames"))
    eds = extract(path, around, os.path.join(out, "edits"))
    from qa.contact import label_for
    for i in range(0, len(regs), 12):
        sheet(os.path.join(out, f"contact-{i // 12 + 1}.png"), [(p, label_for(p)) for p in regs[i:i + 12]], cols=4, width=640)
    if eds:
        sheet(os.path.join(out, "contact-edits.png"), [(p, label_for(p)) for p in eds], cols=6, width=480)

    # ---- picture checks ----
    blacks = detect(path, "blackdetect=d=0.1:pix_th=0.08", r"black_start:([0-9.]+) black_end:([0-9.]+)")
    freezes = re.findall(r"freeze_start: ([0-9.]+)|freeze_end: ([0-9.]+)", run(["ffmpeg", "-v", "info", "-i", path, "-vf", "freezedetect=n=-60dB:d=0.5", "-map", "0:v", "-f", "null", "-"]).stderr)
    y = luma_series(path)
    d = np.abs(np.diff(y))
    thr = d.mean() + 3 * d.std()
    near_edit = lambda f: any(abs(f - e) <= 2 for e in edits)
    spikes = [int(i + 1) for i in np.where(d > max(thr, 6))[0] if not near_edit(i + 1)]
    rep["picture"] = {"black_segments_s": [[float(s), float(e)] for s, e in blacks], "freeze_events": [f for pair in freezes for f in pair if f][:20],
                      "luma_mean": round(float(y.mean()), 2), "flicker_frames_not_on_edits": spikes[:40]}

    # ---- sound checks ----
    if au:
        wav = os.path.join(tempfile.mkdtemp(), "a.wav")
        run(["ffmpeg", "-v", "error", "-y", "-i", path, "-vn", "-ac", "2", "-ar", "48000", "-c:a", "pcm_f32le", wav])
        x, sr = sf.read(wav)
        import pyloudnorm as pyln
        from audio.dsp import true_peak_db
        meter = pyln.Meter(sr)
        clip = int(np.sum(np.abs(x) >= 10 ** (-0.1 / 20)))
        sil = re.findall(r"silence_start: ([0-9.]+)|silence_end: ([0-9.]+)", run(["ffmpeg", "-v", "info", "-i", wav, "-af", "silencedetect=n=-55dB:d=1.2", "-f", "null", "-"]).stderr)
        rep["sound"] = {"integrated_lufs": round(meter.integrated_loudness(x), 2), "true_peak_dbtp": round(float(true_peak_db(x)), 2),
                        "clipped_samples": clip, "silences_over_1_2s": [s for pair in sil for s in pair if s]}
        if not a.no_voice:
            from asr.transcribe import transcribe_file, compare
            from tts.emotional_tts import ALIASES, spoken
            script = json.load(open(os.path.join(ROOT, a.script)))
            ref = " ".join(spoken(l["text"]) for l in script["lines"])
            text, words = transcribe_file(wav)
            cmp = compare(ref, text, ALIASES)
            rep["sound"]["asr_mix"] = {"wer": round(cmp["wer"], 4), "issues": cmp["issues"], "heard": text}
            dry = os.path.join(ROOT, "audio", "stems", "narration.wav")
            if os.path.exists(dry):
                t2, _ = transcribe_file(dry)
                rep["sound"]["asr_dry_wer"] = round(compare(ref, t2, ALIASES)["wer"], 4)
                rep["sound"]["masking"] = rep["sound"]["asr_mix"]["wer"] > rep["sound"]["asr_dry_wer"]
            # phone-speaker check: mono, band-limited 300 Hz–4 kHz
            from audio.dsp import filt
            phone = filt(filt(x.mean(1), "hp", 300), "lp", 4000)
            pw = os.path.join(tempfile.mkdtemp(), "phone.wav"); sf.write(pw, phone, sr)
            t3, _ = transcribe_file(pw)
            rep["sound"]["asr_phone_speaker_wer"] = round(compare(ref, t3, ALIASES)["wer"], 4)
        # A/V sync: onset near each sound event (from the effects stem placement)
        ev_path = os.path.join(ROOT, "audio", "sfx", "events.json")
        sfx_stem = os.path.join(ROOT, "audio", "stems", "sfx.wav")
        if os.path.exists(ev_path) and os.path.exists(sfx_stem):
            s, _ = sf.read(sfx_stem)
            env = np.abs(s.mean(1))
            off = []
            for e in json.load(open(ev_path)):
                i = int(e["time_s"] * sr); w = env[max(0, i - sr // 12): i + sr // 12]
                if w.max() > 1e-4:
                    onset = np.argmax(w > w.max() * .3) + max(0, i - sr // 12)
                    off.append(abs(onset - i) / sr * FPS)
            rep["sound"]["sfx_sync_max_offset_frames"] = round(float(max(off)), 2) if off else None
    json.dump(rep, open(os.path.join(out, "report.json"), "w"), indent=1, default=str)
    print(json.dumps({k: rep[k] for k in rep if k != "file"}, indent=1, default=str)[:4000])


if __name__ == "__main__":
    main()
