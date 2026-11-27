"""Focused tests for mix_audio.sync_check (positive, delayed-audio negative, limiter-latency diagnostics).

python -I experiments/E10/audio-mix/test_sync.py <narration.wav> <music.wav>
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mix_audio import sync_check  # noqa: E402

narration, music = sys.argv[1], sys.argv[2]
tmp = Path(tempfile.mkdtemp(prefix="sync-test-"))


def make(name, graph, inputs):
    out = tmp / f"{name}.wav"
    args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for path in inputs:
        args += ["-i", path]
    subprocess.run(args + ["-filter_complex", graph, "-ar", "48000", "-c:a", "pcm_s16le", str(out)], check=True)
    return str(out)


nar = "[0:a]aresample=48000,aformat=channel_layouts=stereo"
bed = "[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:68.8,volume=6dB"
cases = []


def case(name, expect_pass, mix, bed_stem=None):
    result = sync_check(narration, mix, bed_stem)
    cases.append(dict(case=name, expected_pass=expect_pass, ok=result["passed"] == expect_pass, **result))


# Positive: amplitude-only changes must not move the narration.
case("gain -6 dB", True, make("gain", f"{nar},volume=-6dB", [narration]))
case("loudnorm linear", True, make("loudnorm", f"{nar},loudnorm=I=-16:TP=-1.5:linear=true", [narration]))
# Positive: narration plus a loud music bed, with the bed stem subtracted.
case("mix + bed stem", True, make("mix", f"{nar}[n];{bed}[m];[n][m]amix=inputs=2:normalize=0", [narration, music]),
     make("bed", f"{bed}", [narration, music]))
# Negative: deliberately delayed narration must fail, both alone and inside a mix.
case("delayed 40 ms", False, make("d40", f"{nar},adelay=40|40", [narration]))
case("delayed 5 ms", False, make("d5", f"{nar},adelay=5|5", [narration]))
case("mix with narration delayed 40 ms", False,
     make("mixd40", f"{nar},adelay=40|40[n];{bed}[m];[n][m]amix=inputs=2:normalize=0", [narration, music]),
     make("bed2", f"{bed}", [narration, music]))
# Diagnostics: the limiter's look-ahead delays the signal unless latency compensation is enabled.
case("alimiter default (diagnostic)", False, make("lim", f"{nar},alimiter=limit=0.84:level=disabled", [narration]))
case("alimiter latency=1 (diagnostic)", True, make("limc", f"{nar},alimiter=limit=0.84:level=disabled:latency=1", [narration]))

for c in cases:
    print(f"{'PASS' if c['ok'] else 'FAIL'} {c['case']}: lag {c['lag_ms']} ms, corr {c['correlation']}, sync_passed={c['passed']}")
out = Path(__file__).with_name("test-sync-results.json")
out.write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8")
sys.exit(0 if all(c["ok"] for c in cases) else 1)
