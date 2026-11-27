#!/usr/bin/env bash
set -euo pipefail

here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
root="$HOME/.local/share/video-creator-skill/mithi-wsl"
python=python3.12
[[ $(uname -m) == x86_64 && $(uname -r) == *WSL2* ]] || { echo "Expected x64 WSL 2" >&2; exit 1; }
"$python" -m ensurepip --version >/dev/null || { echo "Install Ubuntu python3.12-venv first" >&2; exit 1; }

awk '/^MemAvailable:/ {exit ($2 < 4*1024*1024)}' /proc/meminfo ||
  { echo "Need at least 4 GiB available guest RAM for the experiment" >&2; exit 1; }
mkdir -p -- "$root"
[[ $(df -Pk "$root" | awk 'END {print $4}') -ge 8388608 ]] ||
  { echo "Need at least 8 GiB free on the Linux filesystem" >&2; exit 1; }

# Reuse exact upstream versions where the existing Windows resolution overlaps.
# Constraints alone do not install Windows-only packages.
awk '/^[A-Za-z0-9_.-]+==/ {print}' "$here/dependency-lock.txt" > "$root/shared-constraints.txt"
if [[ ! -e "$root/venv" ]]; then
  "$python" -m venv "$root/venv"
else
  echo "Resuming existing virtual environment"
  "$root/venv/bin/python" -m pip --version >/dev/null
fi
venv_python="$root/venv/bin/python"
export PIP_CONFIG_FILE=/dev/null
unset PIP_INDEX_URL PIP_EXTRA_INDEX_URL PIP_FIND_LINKS PIP_TRUSTED_HOST PIP_NO_INDEX
"$venv_python" -m pip --isolated --disable-pip-version-check install \
  --index-url https://pypi.org/simple --only-binary=:all: \
  --timeout 120 --retries 5 --report "$root/install-report.json" \
  -c "$root/shared-constraints.txt" \
  'torch @ https://download-r2.pytorch.org/whl/cpu/torch-2.9.1%2Bcpu-cp312-cp312-manylinux_2_28_x86_64.whl#sha256=7417d8c565f219d3455654cb431c6d892a3eb40246055e14d645422de13b9ea1' \
  'en-core-web-sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl' \
  'transformers==5.24.1' 'safetensors==0.8.0' 'sentencepiece==0.2.3' \
  'numpy==2.5.5' 'soundfile==0.14.0' 'misaki[en]==0.9.4' \
  'espeakng-loader==0.2.4' 'phonemizer-fork==3.3.2' 'spacy==3.8.18' 'num2words==0.5.6'
"$venv_python" -m pip check
"$venv_python" -m pip freeze --all > "$root/dependency-lock-linux.txt"
echo "Saved Linux lock and install report in $root"
