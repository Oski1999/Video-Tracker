"""Temp voice with Kokoro-82M (neural, Apache-2.0). Called by scripts/make-voice.mjs.

One clip per line; a different voice per speaker. A clip that would run past its line is
regenerated faster (never slower than the line, never stretching a cut).
Usage: .venv/bin/python -I scripts/voice_kokoro.py <project dir> <slug> [slug ...]
"""
import json
import os
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

VOICES = {"P1": "am_michael", "P2": "af_heart", "EXTRA": "bm_george"}

root = sys.argv[1]
slugs = sys.argv[2:]
k = Kokoro(os.path.join(root, "models/kokoro-v1.0.onnx"), os.path.join(root, "models/voices-v1.0.bin"))
videos = json.load(open(os.path.join(root, "handoff/videos.json")))["videos"]
manifest_path = os.path.join(root, "src/voice-manifest.json")
manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}

for v in videos:
    if slugs and v["slug"] not in slugs:
        continue
    shots = json.load(open(os.path.join(root, "handoff", v["shot_list"])))["shots"]
    out_dir = os.path.join(root, "public/voice", v["slug"])
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        os.remove(os.path.join(out_dir, f))
    clips = []
    for shot in shots:
        for i, line in enumerate(shot["lines"]):
            voice = VOICES.get(line["speaker"], VOICES["P1"])
            speed = 1.0
            for _ in range(5):
                samples, sr = k.create(line["text"], voice=voice, speed=speed, lang="en-us")
                dur = len(samples) / sr
                if dur <= line["duration"] - 0.05:
                    break
                speed = min(2.0, speed * dur / (line["duration"] - 0.15))
            rel = f"voice/{v['slug']}/{shot['id']}-{i}.wav"
            sf.write(os.path.join(root, "public", rel), samples, sr)
            clips.append({"cut": shot["id"], "line": i, "file": rel, "voice": voice, "speed": round(speed, 3), "seconds": round(dur, 2)})
    manifest[v["slug"]] = clips
    fast = [c for c in clips if c["speed"] > 1.0]
    print(f"{v['slug']}: {len(clips)} clips, {len(fast)} sped up (max x{max([c['speed'] for c in clips])})", flush=True)

json.dump(manifest, open(manifest_path, "w"), indent=1)
