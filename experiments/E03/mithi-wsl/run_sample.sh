#!/usr/bin/env bash
set -euo pipefail
exec "$HOME/.local/share/video-creator-skill/mithi-wsl/venv/bin/python" -B "$(dirname -- "$0")/run_sample.py" "$@"
