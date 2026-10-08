"""Storyboard document from rendered frames: three stills per shot (first / key / last) + creative/storyboard.md.

    python tools/edit/storyboard.py --frames renders/frames/master --version v2
"""
import argparse, json, os, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from qa.contact import sheet  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default="renders/frames/master")
    ap.add_argument("--version", default="v2")
    a = ap.parse_args()
    shots = json.load(open(os.path.join(ROOT, "creative", "shotlist.json")))
    narr = {l["shot"]: l for l in json.load(open(os.path.join(ROOT, "creative", "narration.json")))["lines"]}
    out_dir = os.path.join(ROOT, "assets", "keyframes", a.version)
    os.makedirs(out_dir, exist_ok=True)
    md = ["# Storyboard: \"Beneath the Surface\"", "",
          f"Stills are rendered by the production compositor itself (`{a.frames}`), so the storyboard is the film's actual look. "
          "Three frames per shot: first, key, last. The v1 (animatic) boards are in `assets/keyframes/v1/`, and the critique that changed them is in `qa/animatic/critic-report.md`.", "",
          f"![contact sheet](../assets/keyframes/{a.version}/storyboard-contact.png)", ""]
    items = []
    for s in shots["shots"]:
        st, en = s["start"], s["end"] - 1
        refs = []
        for tag, f in (("first", st), ("key", (st + en) // 2), ("last", en)):
            src = os.path.join(ROOT, a.frames, f"f{f:05d}.png")
            dst = os.path.join(out_dir, f"{s['id']}_{tag}_f{f:05d}.jpg")
            Image.open(src).convert("RGB").resize((960, 540), Image.LANCZOS).save(dst, quality=88)
            refs.append(f"![{s['id']} {tag}](../assets/keyframes/{a.version}/{os.path.basename(dst)})")
            items.append((dst, f"{s['id']} {tag} f{f}"))
        line = narr.get(s["id"])
        md += [f"## {s['id']} · {s['name']}  ({st / 24:.2f}–{s['end'] / 24:.2f} s, frames {st}–{s['end']})", "",
               " ".join(refs), "",
               f"- **Purpose:** {s['purpose']}", f"- **Picture:** {s['picture']}", f"- **Camera:** {s['camera']}",
               f"- **Technique:** {s['technique']}" + (f" · generative: {s['generative']}" if isinstance(s.get('generative'), str) else ""),
               *( [f"- **Narration:** “{line['text'].replace('[pause 0.3] ', '').replace('[pause 0.2] ', '').replace('[pause 0.45] ', '')}”"] if line else [] ),
               *( [f"- **Sound:** {', '.join(s['sound'])}"] if s.get('sound') else [] ), ""]
    sheet(os.path.join(out_dir, "storyboard-contact.png"), items, cols=6, width=420)
    open(os.path.join(ROOT, "creative", "storyboard.md"), "w").write("\n".join(md))
    print("storyboard:", len(items), "stills")


if __name__ == "__main__":
    main()
