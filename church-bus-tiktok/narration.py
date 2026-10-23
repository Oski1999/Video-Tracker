"""Generate narrator lines with Kokoro TTS; writes work/vo_XX.wav + work/lines.json."""
import json, os, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

MODEL_DIR = sys.argv[1]
LINES = [
    ("hook",   "Every Sunday morning, this bus goes out hunting... for suspects."),
    ("intro",  "Pacific Baptist Church bus route. Let's ride!"),
    ("stop1",  "Suspect number one: Marcus. Age nine. Known for sprinting out the door with one shoe on."),
    ("stop2",  "Suspects two and three: the Rivera twins. Still arguing over the window seat."),
    ("stop3",  "Suspect number four: Lily. Still in her Halloween costume. Nobody's asking questions."),
    ("party",  "The bus is loud. The bus is full. The singing is way off key."),
    ("map",    "Twelve stops. Twenty-three kids. One mission."),
    ("church", "Every single one of them, in church. Case closed. See you next Sunday!"),
]
os.makedirs("work", exist_ok=True)
k = Kokoro(f"{MODEL_DIR}/kokoro-v1.0.onnx", f"{MODEL_DIR}/voices-v1.0.bin")
out = []
for i, (key, text) in enumerate(LINES):
    audio, sr = k.create(text, voice="af_heart", speed=1.18, lang="en-us")
    # trim leading/trailing silence
    nz = np.where(np.abs(audio) > 0.01)[0]
    audio = audio[max(nz[0] - 600, 0): nz[-1] + 1200]
    path = f"work/vo_{i:02d}.wav"
    sf.write(path, audio, sr)
    out.append(dict(key=key, text=text, path=path, dur=len(audio) / sr, sr=sr))
    print(key, round(len(audio) / sr, 2))
json.dump(out, open("work/lines.json", "w"), indent=1)
print("total", round(sum(o["dur"] for o in out), 2))
