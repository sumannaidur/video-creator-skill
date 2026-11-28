#!/usr/bin/env bash
# Install the current repo source as a separate development Skill "video-creator-dev" (P024.1B; parameterised in P025.2).
# The released v0.1.0-beta installation (~/.claude/skills/video-creator) and the repo SKILL.md are left unchanged.
#   VC_DEV_DST      destination (default ~/.claude/skills/video-creator-dev; Codex: ~/.agents/skills/video-creator-dev)
#   VC_DEV_VERSION  version written into the installed SKILL.md (default 0.2.1-beta-dev)
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)/skills/video-creator"
DST="${VC_DEV_DST:-$HOME/.claude/skills/video-creator-dev}"
DEVV="${VC_DEV_VERSION:-0.2.1-beta-dev}"
rm -rf "$DST"; mkdir -p "$DST"
( cd "$SRC" && tar --exclude='__pycache__' --exclude='test-*results.json' -cf - . ) | ( cd "$DST" && tar -xf - )
python - "$DST/SKILL.md" "$DEVV" <<'PY'
import re, sys
p, v = sys.argv[1], sys.argv[2]
s = open(p, encoding="utf-8").read()
s = s.replace("name: video-creator\n", "name: video-creator-dev\n", 1)
s = re.sub(r"description: ", f"description: DEVELOPMENT INSTALL ({v}, v0.2.1-beta release candidate; use only when the user asks for video-creator-dev). ", s, count=1)
s = re.sub(r"  version: [^\n]+\n", f"  version: {v}\n", s, count=1)
s = s.replace("# Video Creator\n", f"# Video Creator (development {v})\n", 1)
open(p, "w", encoding="utf-8").write(s)
PY
echo "installed $DST ($DEVV)"
