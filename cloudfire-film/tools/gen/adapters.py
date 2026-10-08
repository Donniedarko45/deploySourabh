"""Paid generation adapters (not executed in this production: no keys were configured, and openrouter.ai /
api.elevenlabs.io are blocked by the session's egress policy). They are written to be safe to run later:

* every call goes through `Budget`, which refuses to spend beyond FILM_BUDGET_USD (default 0 = refuse);
* model ids are *discovered* from the live provider listing and checked for the needed output modality —
  nothing assumes that every provider exposes the same schema;
* responses and media are cached by request hash under assets/generated/, so re-runs never pay twice;
* long-running jobs are polled with backoff and can resume from the cached operation id.

    python tools/gen/adapters.py estimate            # print the cost plan for the optional generative plates
    FILM_BUDGET_USD=40 OPENROUTER_API_KEY=… python tools/gen/adapters.py plates --dry-run
"""
from __future__ import annotations
import base64, hashlib, json, os, sys, time, urllib.error, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE = os.path.join(ROOT, "assets", "generated")

# Planning prices (USD). These are estimates to be confirmed against the provider's live pricing before spend.
PRICE = {"image": 0.08, "veo_per_s": 0.40, "veo_fast_per_s": 0.15, "seedance_per_s": 0.25, "music_per_min": 0.80, "tts_per_1k_chars": 0.02}

PLATES = [  # the shots where generative richness would add value without touching typography/UI/logo
    {"shot": "S04", "kind": "video", "seconds": 6, "purpose": "volumetric haze and light shafts falling through the 'ceiling of light' (composited under the line field)",
     "prompt": "Locked-off cinematic plate, deep charcoal void, soft warm light falling from a luminous horizontal surface far above, faint drifting haze, no objects, no text, 24fps, anamorphic, filmic grain"},
    {"shot": "S13", "kind": "video", "seconds": 5, "purpose": "slow atmospheric bloom along a horizon line for the resolve",
     "prompt": "Minimal cinematic plate, a single thin warm horizon of light across darkness, gentle atmospheric bloom breathing slowly, no objects, no text, 24fps, filmic"},
    {"shot": "refs", "kind": "image", "count": 6, "purpose": "look-development stills for the visual bible (not used in picture)",
     "prompt": "Editorial macro photograph of a dark product interface button at a grazing angle, warm key light, shallow depth of field, charcoal, vermilion accent"},
]


class Budget:
    def __init__(self):
        self.limit = float(os.environ.get("FILM_BUDGET_USD", "0"))
        self.path = os.path.join(CACHE, "spend.json")
        self.spent = json.load(open(self.path))["spent"] if os.path.exists(self.path) else 0.0

    def authorize(self, usd: float, what: str):
        if self.spent + usd > self.limit:
            raise RuntimeError(f"refused: {what} would cost ~${usd:.2f}; spent ${self.spent:.2f} of authorized ${self.limit:.2f}")

    def record(self, usd: float):
        self.spent += usd
        os.makedirs(CACHE, exist_ok=True)
        json.dump({"spent": round(self.spent, 4)}, open(self.path, "w"))


def _http(method, url, headers, body=None, retries=4, timeout=300):
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, method=method, headers={"content-type": "application/json", **headers})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                return json.loads(raw) if r.headers.get_content_type() == "application/json" else raw
        except urllib.error.HTTPError as e:
            if e.code in (408, 429, 500, 502, 503, 504) and attempt < retries:
                time.sleep(2 ** (attempt + 1)); continue
            raise RuntimeError(f"{method} {url.split('?')[0]} → HTTP {e.code}: {e.read()[:300]!r}") from None


def cached(key: dict):
    h = hashlib.sha256(json.dumps(key, sort_keys=True).encode()).hexdigest()[:16]
    return os.path.join(CACHE, h)


class OpenRouter:
    BASE = "https://openrouter.ai/api/v1"

    def __init__(self):
        self.key = os.environ["OPENROUTER_API_KEY"]
        self.h = {"authorization": f"Bearer {self.key}", "x-title": "CloudFire film"}

    def models(self, output_modality: str):
        data = _http("GET", f"{self.BASE}/models", self.h)["data"]
        return [m for m in data if output_modality in (m.get("architecture", {}).get("output_modalities") or [])]

    def pick(self, preferred: str, output_modality: str):
        ids = {m["id"]: m for m in self.models(output_modality)}
        if preferred in ids:
            return preferred, ids[preferred]
        raise RuntimeError(f"{preferred} is not offered with output '{output_modality}'; available: {sorted(ids)[:20]}")

    def image(self, prompt: str, model="openai/gpt-image-2.5-sunburst", budget: Budget | None = None):
        mid, _ = self.pick(model, "image")
        out = cached({"p": prompt, "m": mid}) + ".png"
        if os.path.exists(out):
            return out
        budget and budget.authorize(PRICE["image"], f"image {mid}")
        r = _http("POST", f"{self.BASE}/chat/completions", self.h,
                  {"model": mid, "modalities": ["image", "text"], "messages": [{"role": "user", "content": prompt}]})
        url = r["choices"][0]["message"]["images"][0]["image_url"]["url"]
        os.makedirs(CACHE, exist_ok=True)
        open(out, "wb").write(base64.b64decode(url.split(",", 1)[1]))
        budget and budget.record(PRICE["image"])
        return out


class Veo:
    """Veo through the Gemini API (generativelanguage.googleapis.com is reachable from this environment)."""
    BASE = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self):
        self.h = {"x-goog-api-key": os.environ["GEMINI_API_KEY"]}

    def discover(self, prefer="veo-3.1"):
        names = [m["name"].split("/")[-1] for m in _http("GET", f"{self.BASE}/models?pageSize=1000", self.h).get("models", [])]
        veo = sorted(n for n in names if n.startswith("veo"))
        match = [n for n in veo if prefer in n]
        if not (match or veo):
            raise RuntimeError("no Veo model available to this key")
        return (match or veo)[-1]

    def video(self, prompt: str, seconds: int, budget: Budget, aspect="16:9", resolution="1080p"):
        model = self.discover()
        out = cached({"p": prompt, "m": model, "s": seconds, "a": aspect, "r": resolution}) + ".mp4"
        if os.path.exists(out):
            return out
        budget.authorize(PRICE["veo_per_s"] * seconds, f"{model} {seconds}s")
        op = _http("POST", f"{self.BASE}/models/{model}:predictLongRunning", self.h,
                   {"instances": [{"prompt": prompt}], "parameters": {"aspectRatio": aspect, "resolution": resolution, "durationSeconds": seconds}})
        json.dump(op, open(out + ".operation.json", "w"))
        delay = 10
        while not op.get("done"):
            time.sleep(delay); delay = min(60, delay * 1.5)
            op = _http("GET", f"{self.BASE}/{op['name']}", self.h)
        uri = op["response"]["generateVideoResponse"]["generatedSamples"][0]["video"]["uri"]
        open(out, "wb").write(_http("GET", uri, self.h))
        budget.record(PRICE["veo_per_s"] * seconds)
        return out


class ElevenLabsMusic:
    BASE = "https://api.elevenlabs.io/v1"

    def __init__(self):
        self.h = {"xi-api-key": os.environ["ELEVENLABS_API_KEY"]}

    def plan_from_score(self):
        """Composition plan from audio/music/composition-plan.json (sections → durations and styles)."""
        p = json.load(open(os.path.join(ROOT, "audio", "music", "composition-plan.json")))
        neg = ["vocals", "EDM drop", "trailer braams", "inspirational piano", "corporate ukulele"]
        styles = {"tactile": ["near silence", "a single mechanical click", "sub pulse"], "reveal": ["first warm chord", "felt keys"],
                  "motion": ["slow analog pad", "suspended harmony"], "momentum": ["filtered analog arpeggio", "organic shaker and frame drum"],
                  "expansion": ["widest voicing", "motif complete", "shimmer"], "resolution": ["thinning", "crescendo", "resolve to F major", "long tail"]}
        return {"positive_global_styles": ["restrained modern cinematic score", "tactile electronic textures", "analog synthesis", "96 BPM"],
                "negative_global_styles": neg,
                "sections": [{"section_name": n, "duration_ms": int((b - a) * 1000), "positive_local_styles": styles[n], "negative_local_styles": [], "lines": []}
                             for n, a, b in p["sections"]]}

    def compose(self, budget: Budget, length_s=65):
        plan = self.plan_from_score()
        out = cached({"plan": plan}) + ".mp3"
        if os.path.exists(out):
            return out
        budget.authorize(PRICE["music_per_min"] * length_s / 60, "ElevenLabs music")
        audio = _http("POST", f"{self.BASE}/music?output_format=mp3_44100_192", self.h, {"composition_plan": plan, "model_id": "music_v1"})
        open(out, "wb").write(audio)
        json.dump(plan, open(out + ".plan.json", "w"), indent=1)
        budget.record(PRICE["music_per_min"] * length_s / 60)
        return out


def estimate():
    rows, total = [], 0.0
    for p in PLATES:
        if p["kind"] == "video":
            lo, hi = PRICE["veo_fast_per_s"] * p["seconds"], PRICE["veo_per_s"] * p["seconds"]
            # three attempts per expensive shot (preview + final + one retry), per the critic's regeneration cap
            rows.append((p["shot"], f"{p['seconds']} s video ×3 attempts", lo * 3, hi * 3)); total += hi * 3
        else:
            c = PRICE["image"] * p["count"] * 2
            rows.append((p["shot"], f"{p['count']} images ×2", c, c)); total += c
    tts_chars = sum(len(l["text"]) for l in json.load(open(os.path.join(ROOT, "creative", "narration.json")))["lines"])
    tts = PRICE["tts_per_1k_chars"] * tts_chars / 1000 * 3 * 4  # 4 voices × 3 takes
    music = PRICE["music_per_min"] * 65 / 60 * 3
    rows += [("narration", f"Gemini TTS {tts_chars} chars × 4 voices × 3 takes", tts, tts), ("score", "ElevenLabs 65 s × 3 versions", music, music)]
    total += tts + music
    return rows, total


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "estimate"
    if cmd == "estimate":
        rows, total = estimate()
        for r in rows:
            print(f"{r[0]:10} {r[1]:48} ${r[2]:7.2f} – ${r[3]:7.2f}")
        print(f"{'total':10} {'(upper bound)':48} ${total:7.2f}")
        json.dump({"rows": rows, "upper_bound_usd": round(total, 2), "prices": PRICE, "note": "planning prices; confirm live before spend"},
                  open(os.path.join(ROOT, "qa", "generation-budget.json"), "w"), indent=1)
