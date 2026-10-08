"""Build the canonical OpenTimelineIO timeline (timeline/master.otio) from the shot list, narration timing and stems.

    python tools/edit/timeline.py [--frames renders/frames/master]

V1  picture   one clip per shot (S01–S15), each a frame range of the compositor's image sequence
A1  narration one clip per line at its cue (selected take)
A2  music     the score stem
A3  effects   the sound-design stem
Markers: act starts (V1), narration cues (A1), sound events (A3).
"""
from __future__ import annotations
import argparse, json, os
import opentimelineio as otio

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FPS = 24
RT = lambda f: otio.opentime.RationalTime(f, FPS)
TR = lambda s, d: otio.opentime.TimeRange(RT(s), RT(d))


def build(frames_dir: str):
    shots = json.load(open(os.path.join(ROOT, "creative", "shotlist.json")))
    narration = json.load(open(os.path.join(ROOT, "creative", "narration.json")))
    selection = json.load(open(os.path.join(ROOT, "audio", "narration", "selection.json")))
    timing = {t["id"]: t for t in json.load(open(os.path.join(ROOT, "audio", "narration", "timing.json")))}
    total = shots["duration_frames"]
    tl = otio.schema.Timeline(name="Beneath the Surface — CloudFire", global_start_time=RT(0))
    tl.metadata["cloudfire"] = {"fps": FPS, "resolution": shots["resolution"], "tempo_bpm": shots["tempo_bpm"],
                                "frames_dir": os.path.relpath(frames_dir, ROOT)}
    v1 = otio.schema.Track(name="V1 Picture", kind=otio.schema.TrackKind.Video)
    seq_ref = lambda: otio.schema.ImageSequenceReference(
        target_url_base=os.path.relpath(frames_dir, ROOT) + "/", name_prefix="f", name_suffix=".png", start_frame=0, frame_step=1,
        rate=FPS, frame_zero_padding=5, available_range=TR(0, total))
    cursor = 0
    for s in shots["shots"]:
        assert s["start"] == cursor, f"gap/overlap before {s['id']}"
        clip = otio.schema.Clip(name=f"{s['id']} {s['name']}", media_reference=seq_ref(), source_range=TR(s["start"], s["end"] - s["start"]))
        clip.metadata["cloudfire"] = {k: s.get(k) for k in ("purpose", "technique", "generative", "camera", "eyebrow", "label")}
        v1.append(clip)
        cursor = s["end"]
    assert cursor == total
    for act in shots["acts"]:
        v1.markers.append(otio.schema.Marker(name=f"Act {act['id']} — {act['name']}", marked_range=TR(act["start"], 0), color=otio.schema.MarkerColor.ORANGE))

    a1 = otio.schema.Track(name="A1 Narration", kind=otio.schema.TrackKind.Audio)
    pos = 0
    for line in narration["lines"]:
        t = timing[line["id"]]
        start = round(t["start_s"] * FPS)
        dur = round((t["end_s"] - t["start_s"]) * FPS)
        if start > pos:
            a1.append(otio.schema.Gap(source_range=TR(0, start - pos)))
        sel = selection[line["id"]]
        c = otio.schema.Clip(name=f"{line['id']} {t['text'][:40]}", media_reference=otio.schema.ExternalReference(target_url=sel["path"]),
                             source_range=TR(0, dur))
        c.metadata["cloudfire"] = {"text": t["text"], "voice": sel["voice"], "speed": sel["speed"], "wer": sel["wer"], "direction": line["direction"]}
        a1.append(c)
        pos = start + dur
    a1.append(otio.schema.Gap(source_range=TR(0, total - pos)))
    a2 = otio.schema.Track(name="A2 Music", kind=otio.schema.TrackKind.Audio)
    a2.append(otio.schema.Clip(name="Score — Beneath the Surface", media_reference=otio.schema.ExternalReference(target_url="audio/stems/music.wav"), source_range=TR(0, total)))
    a3 = otio.schema.Track(name="A3 Effects", kind=otio.schema.TrackKind.Audio)
    sfx = otio.schema.Clip(name="Sound design", media_reference=otio.schema.ExternalReference(target_url="audio/stems/sfx.wav"), source_range=TR(0, total))
    events_path = os.path.join(ROOT, "audio", "sfx", "events.json")
    if os.path.exists(events_path):
        for e in json.load(open(events_path)):
            sfx.markers.append(otio.schema.Marker(name=e["sound"], marked_range=TR(e["frame"], 0)))
    a3.append(sfx)
    tl.tracks.extend([v1, a1, a2, a3])
    return tl


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default="renders/frames/master")
    ap.add_argument("--out", default="timeline/master.otio")
    a = ap.parse_args()
    tl = build(os.path.join(ROOT, a.frames))
    os.makedirs(os.path.join(ROOT, "timeline"), exist_ok=True)
    otio.adapters.write_to_file(tl, os.path.join(ROOT, a.out))
    print("wrote", a.out, "duration", tl.duration().to_seconds(), "s;", len(tl.tracks[0]), "shots")
