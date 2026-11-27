"""Writes audio/mix-spec.json: effect times come from the resolved plan (cue ids and shot boundaries), never typed by hand."""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
plan = json.loads((root / "plan/resolved-plan.json").read_text(encoding="utf-8"))
cue = {c["id"]: c["at"]["seconds"] for s in plan["shots"] for c in s.get("cues", [])}
start = {s["id"]: s["start"]["seconds"] for s in plan["shots"]}


# Mithi narration measures -26.6 LUFS, 7 dB below the Kokoro narration the E11 balance was set against; the whole bed is
# lowered by the same 7 dB so speech keeps its separation (one corrective attempt after speech_over_bed 6.9 LU < 12).
BED_OFFSET_DB = -7


def fx(f, t, g, why):
    return dict(file=f"assets/{f}.wav", at=round(max(0.0, t), 3), gain_db=g + BED_OFFSET_DB, why=why)


sfx = [fx("rumble", start["curve"] + .1, -24, "the train's rumble under the hook"),
       fx("pop", cue["no-steer"], -23, "a steering wheel pops up"),
       fx("pop", cue["steer-x"], -22, "red cross: no steering wheel"),
       fx("pop", cue["girl-q"], -22, "question mark above the girl"),
       fx("chime", cue["shape-trace"], -24, "the secret: the wheel shape"),
       fx("whoosh", start["axle"] - .35, -24, "sheet transition to the view along the track"),
       fx("pop", cue["clamped"], -24, "clamps snap on the axle"),
       fx("chime", cue["cone-in"], -24, "the ice-cream cone arrives"),
       fx("whoosh", start["centre"] - .35, -24, "blueprint sheet lifts away"),
       fx("chime", cue["settled"], -24, "wheelset settles at the centre"),
       fx("whoosh", cue["long-tape"], -27, "long tape unrolls"),
       fx("rumble", start["follow"], -25, "the train sweeps round the bend"),
       fx("whoosh", cue["gust"] - .2, -20, "crosswind gust"),
       fx("pop", cue["flange-catch"], -22, "the flange catches the rail"),
       fx("chime", cue["cone-up"], -22, "payoff: the girl raises the cone")]
video = sys.argv[1] if len(sys.argv) > 1 else None
spec = {"narration": "../narration/narration-1d6e722da7.wav", "manifest": "assets/assets-manifest.json",
        "music": {"file": "assets/music-pad.wav", "gain_db": BED_OFFSET_DB, "fade_in": 1.5, "fade_out": 2.5,
                  "duck": {"threshold": 0.03, "ratio": 8, "attack_ms": 30, "release_ms": 600}},
        "sfx": sfx, "loudness": {"integrated_lufs": -16, "true_peak_db": -1.5}, "intelligibility_min_lu": 12, "output": "mix.wav"}
if video:
    spec["video"] = {"input": video, "output": "final-1080x1920.mp4"}
(root / "audio/mix-spec.json").write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps([(s["file"], s["at"]) for s in sfx]))
