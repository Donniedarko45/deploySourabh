"""Speech synthesis backends for the emotional-TTS skill.

KokoroBackend   local, offline (Kokoro v1.0 ONNX, Apache-2.0). No delivery instructions: pacing is set by speed
                and explicit pauses, emotion by line-level speed and phrasing only.
GeminiBackend   Gemini API native TTS (generateContent with responseModalities=["AUDIO"]). Accepts natural-
                language delivery direction. The model id is discovered from the live ListModels endpoint so
                the newest available Flash TTS model is used (override with GEMINI_TTS_MODEL).

Both return (float32 mono samples, sample_rate). Secrets are read from the environment and never logged.
"""
from __future__ import annotations
import base64, json, os, re, time, urllib.error, urllib.request
import numpy as np

MODELS = os.environ.get("FILM_MODELS", "/home/user/film-models")


class KokoroBackend:
    name = "kokoro"

    def __init__(self, lang: str = "en-gb"):
        from kokoro_onnx import Kokoro
        self.k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
        self.lang = lang

    def voice(self, spec: str):
        """'bm_george' or a blend such as 'bm_george:0.7+bm_fable:0.3'."""
        if "+" not in spec and ":" not in spec:
            return spec
        mix = None
        for part in spec.split("+"):
            name, w = (part.split(":") + ["1"])[:2]
            style = self.k.get_voice_style(name) * float(w)
            mix = style if mix is None else mix + style
        return mix

    def synthesize(self, text: str, *, voice: str, speed: float = 1.0, **_):
        samples, sr = self.k.create(text, voice=self.voice(voice), speed=speed, lang=self.lang)
        return np.asarray(samples, dtype=np.float32), sr


class GeminiBackend:
    name = "gemini"
    BASE = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, model: str | None = None):
        self.key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not self.key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        self.model = model or os.environ.get("GEMINI_TTS_MODEL") or self.discover()

    def _request(self, method: str, path: str, body: dict | None = None, retries: int = 4):
        url = f"{self.BASE}/{path}"
        data = json.dumps(body).encode() if body is not None else None
        for attempt in range(retries + 1):
            req = urllib.request.Request(url, data=data, method=method,
                                         headers={"x-goog-api-key": self.key, "content-type": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=180) as r:
                    return json.loads(r.read())
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 502, 503, 504) and attempt < retries:
                    time.sleep(2 ** (attempt + 1))
                    continue
                raise RuntimeError(f"Gemini {method} {path.split('?')[0]} -> HTTP {e.code}: {e.read()[:300]!r}") from None

    def discover(self) -> str:
        """Pick the newest Flash TTS model the key can use, preferring an exact '3.8' match if present."""
        names, token = [], ""
        while True:
            page = self._request("GET", "models?pageSize=1000" + (f"&pageToken={token}" if token else ""))
            names += [m["name"].split("/")[-1] for m in page.get("models", [])
                      if "generateContent" in m.get("supportedGenerationMethods", [])]
            token = page.get("nextPageToken")
            if not token:
                break
        tts = [n for n in names if "tts" in n]
        if not tts:
            raise RuntimeError("no TTS-capable Gemini model is available to this key")

        def rank(n):
            ver = re.search(r"gemini-(\d+(?:\.\d+)?)", n)
            return ("3.8" in n, "flash" in n, float(ver.group(1)) if ver else 0, "preview" not in n)
        return sorted(tts, key=rank)[-1]

    def synthesize(self, text: str, *, voice: str = "Gacrux", direction: str = "", brief: str = "",
                   pronunciation: str = "", **_):
        prompt = "\n".join(p for p in [
            f"Voice: {brief}" if brief else "",
            f"Delivery for this line: {direction}" if direction else "",
            f"Pronunciation: {pronunciation}" if pronunciation else "",
            "Read exactly the words after 'Line:' and nothing else. Pauses marked [pause N] are N-second silences.",
            f"Line: {text}"] if p)
        body = {"contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseModalities": ["AUDIO"],
                                     "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
        res = self._request("POST", f"models/{self.model}:generateContent", body)
        part = res["candidates"][0]["content"]["parts"][0]["inlineData"]
        rate = int(re.search(r"rate=(\d+)", part.get("mimeType", "rate=24000")).group(1))
        pcm = np.frombuffer(base64.b64decode(part["data"]), dtype="<i2").astype(np.float32) / 32768.0
        return pcm, rate


def get_backend(name: str):
    return {"kokoro": KokoroBackend, "gemini": GeminiBackend}[name]()
