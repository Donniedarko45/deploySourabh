"""Contact sheet: a labelled grid of frames (PNG/JPG files or frames extracted from a video).

    python tools/qa/contact.py out.png frame1.png frame2.png ... [--cols 4] [--width 640]
    python tools/qa/contact.py out.png --video film.mp4 --times 0,2,4.5 [--cols 6]
"""
import argparse, os, re, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


def label_for(path):
    m = re.search(r"f(\d+)", os.path.basename(path))
    if not m:
        return os.path.basename(path)
    f = int(m.group(1))
    return f"f{f}  {f / 24:6.2f}s"


def sheet(out, items, cols=4, width=640):
    imgs = [(Image.open(p).convert("RGB"), lab) for p, lab in items]
    h = int(width * imgs[0][0].height / imgs[0][0].width)
    rows = (len(imgs) + cols - 1) // cols
    pad, bar = 8, 26
    canvas = Image.new("RGB", (cols * (width + pad) + pad, rows * (h + bar + pad) + pad), (24, 24, 24))
    d = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype(FONT, 16)
    except OSError:
        font = ImageFont.load_default()
    for i, (im, lab) in enumerate(imgs):
        x, y = pad + (i % cols) * (width + pad), pad + (i // cols) * (h + bar + pad)
        canvas.paste(im.resize((width, h), Image.LANCZOS), (x, y + bar))
        d.text((x + 4, y + 4), lab, fill=(230, 230, 230), font=font)
    canvas.save(out)
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("frames", nargs="*")
    ap.add_argument("--video")
    ap.add_argument("--times")
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--width", type=int, default=640)
    a = ap.parse_args()
    if a.video:
        tmp = tempfile.mkdtemp()
        items = []
        for i, t in enumerate(float(x) for x in a.times.split(",")):
            p = os.path.join(tmp, f"t{i:04d}.png")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", a.video, "-frames:v", "1", p], check=True)
            items.append((p, f"{t:6.2f}s  f{round(t * 24)}"))
    else:
        items = [(p, label_for(p)) for p in a.frames]
    print(sheet(a.out, items, a.cols, a.width))
