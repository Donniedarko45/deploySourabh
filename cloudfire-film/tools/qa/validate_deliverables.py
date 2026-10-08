"""Validate every deliverable: existence, ffprobe specs, full decode, loudness/true peak, SRT syntax, poster size.

    python tools/qa/validate_deliverables.py  → qa/deliverables.json + qa/deliverables.md
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
F = os.path.join(ROOT, "renders", "final")

EXPECT = {  # file: (width, height, duration_s, audio expected, video codec)
    "cloudfire-master-16x9.mp4": (3840, 2160, 65.0, True, "h264"),
    "cloudfire-master-high-quality.mov": (3840, 2160, 65.0, True, "prores"),
    "cloudfire-vertical-9x16.mp4": (1080, 1920, 65.0, True, "h264"),
    "cloudfire-vertical-9x16-captioned.mp4": (1080, 1920, 65.0, True, "h264"),
    "cloudfire-teaser-15s.mp4": (3840, 2160, 15.0, True, "h264"),
    "cloudfire-bumper-6s.mp4": (3840, 2160, 6.0, True, "h264"),
    "cloudfire-no-voice.mp4": (3840, 2160, 65.0, True, "h264"),
    "cloudfire-captioned-1080p.mp4": (1920, 1080, 65.0, True, "h264"),
    "cloudfire-animatic.mp4": (1920, 1080, 65.0, True, "h264"),
}


def probe(p):
    return json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", p], capture_output=True, text=True).stdout)


def main():
    import pyloudnorm as pyln
    from audio.dsp import true_peak_db
    rows, ok_all = [], True
    for name, (w, h, dur, aud, vc) in EXPECT.items():
        p = os.path.join(F, name)
        r = {"file": name, "exists": os.path.exists(p)}
        if not r["exists"]:
            r["pass"] = False; rows.append(r); ok_all = False; continue
        pr = probe(p)
        v = next(s for s in pr["streams"] if s["codec_type"] == "video")
        a = [s for s in pr["streams"] if s["codec_type"] == "audio"]
        d = float(pr["format"]["duration"])
        dec = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-f", "null", "-"], capture_output=True, text=True).stderr.strip()
        r.update({"size_mb": round(int(pr["format"]["size"]) / 1e6, 1), "codec": v["codec_name"], "profile": v.get("profile"), "pix_fmt": v["pix_fmt"],
                  "width": v["width"], "height": v["height"], "fps": v["r_frame_rate"], "duration_s": round(d, 3),
                  "frames": int(v.get("nb_frames") or 0), "video_mbps": round(int(v.get("bit_rate") or pr["format"]["bit_rate"]) / 1e6, 2),
                  "audio": [f"{s['codec_name']} {s['sample_rate']} Hz {s['channels']}ch" for s in a], "decode_errors": dec[:300]})
        if a:
            wav = os.path.join(tempfile.mkdtemp(), "a.wav")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-vn", "-ac", "2", "-ar", "48000", "-c:a", "pcm_f32le", wav], check=True)
            x, sr = sf.read(wav)
            r["lufs"] = round(pyln.Meter(sr).integrated_loudness(x), 2)
            r["true_peak_dbtp"] = round(float(true_peak_db(x)), 2)
        checks = [r["width"] == w, r["height"] == h, abs(d - dur) < 0.05, r["fps"] == "24/1", bool(a) == aud, vc in r["codec"], not dec]
        if a:
            checks += [abs(r["lufs"] + 14) <= 1.0, r["true_peak_dbtp"] <= -0.9]
        r["pass"] = all(checks); ok_all &= r["pass"]
        rows.append(r)
    srt = os.path.join(F, "cloudfire-subtitles.srt")
    txt = open(srt).read() if os.path.exists(srt) else ""
    blocks = [b for b in txt.strip().split("\n\n") if b]
    srt_ok = bool(blocks) and all(re.match(r"\d+\n\d\d:\d\d:\d\d,\d{3} --> \d\d:\d\d:\d\d,\d{3}\n.+", b, re.S) for b in blocks)
    rows.append({"file": "cloudfire-subtitles.srt", "exists": bool(txt), "captions": len(blocks), "pass": srt_ok}); ok_all &= srt_ok
    from PIL import Image
    pp = os.path.join(F, "cloudfire-poster.png")
    poster_ok = os.path.exists(pp) and Image.open(pp).size == (3840, 2160)
    rows.append({"file": "cloudfire-poster.png", "exists": os.path.exists(pp), "size": list(Image.open(pp).size) if os.path.exists(pp) else None, "pass": poster_ok}); ok_all &= poster_ok
    json.dump({"all_pass": ok_all, "files": rows}, open(os.path.join(ROOT, "qa", "deliverables.json"), "w"), indent=1)
    md = ["| File | Spec | Duration | Size | Loudness / TP | Decode | Pass |", "| --- | --- | --- | --- | --- | --- | --- |"]
    for r in rows:
        if "codec" in r:
            md.append(f"| `{r['file']}` | {r['codec']} {r.get('profile') or ''} {r['pix_fmt']} {r['width']}×{r['height']} @ {r['fps']}; {', '.join(r['audio'])} | {r['duration_s']} s | {r['size_mb']} MB | "
                      f"{r.get('lufs', '–')} LUFS / {r.get('true_peak_dbtp', '–')} dBTP | {'clean' if not r['decode_errors'] else 'ERRORS'} | {'✅' if r['pass'] else '❌'} |")
        else:
            md.append(f"| `{r['file']}` | {('%d captions' % r['captions']) if 'captions' in r else '%s PNG' % r.get('size')} | – | – | – | – | {'✅' if r['pass'] else '❌'} |")
    open(os.path.join(ROOT, "qa", "deliverables.md"), "w").write("\n".join(md) + "\n")
    print("\n".join(md)); print("ALL PASS" if ok_all else "FAILURES PRESENT")


if __name__ == "__main__":
    main()
