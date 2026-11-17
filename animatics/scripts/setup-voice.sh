#!/usr/bin/env bash
# Installs the Kokoro temp-voice engine into .venv and downloads its model (~350 MB, git-ignored).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m venv .venv
.venv/bin/pip install -q kokoro-onnx==0.6.1 soundfile==0.14.0
mkdir -p models
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "models/$f" ] || curl -fsSL -o "models/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"
done
echo "Kokoro ready. Run: npm run voice"
