"""Writes audio/mix-spec.json: effect times come from the resolved plan (cue ids and shot boundaries), never typed by hand."""
import glob
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
plan = json.loads((root / "plan/resolved-plan.json").read_text(encoding="utf-8"))
cue = {c["id"]: c["at"]["seconds"] for s in plan["shots"] for c in s.get("cues", [])}
start = {s["id"]: s["start"]["seconds"] for s in plan["shots"]}
narration = sorted(glob.glob(str(root / "narration/narration-*.wav")))[0]

# Mithi narration sits ~7 dB below the Kokoro reference the bed levels were set against (E13/E17 evidence).
BED_OFFSET_DB = -7


def fx(f, t, g, why):
    return dict(file=f"assets/{f}.wav", at=round(max(0.0, t), 3), gain_db=g + BED_OFFSET_DB, why=why)


sfx = [fx("whoosh", cue["send"] - .05, -24, "send: the bubble jumps up"),
       fx("pop", cue["lock"] + .2, -22, "the padlock snaps shut"),
       fx("chime", cue["key"], -25, "two keys appear"),
       fx("whoosh", cue["net"] + .1, -23, "the capsule races across the city"),
       fx("chime", cue["tick1"], -24, "one grey tick"),
       fx("rumble", start["server"] + .1, -27, "server hall hum"),
       fx("pop", cue["cant"], -22, "scanner refused"),
       fx("whoosh", cue["right"], -27, "routed to the right phone"),
       fx("chime", cue["days"], -26, "30 days read-out"),
       fx("whoosh", cue["reach"], -24, "arrival beam"),
       fx("chime", cue["tick2"], -24, "two grey ticks"),
       fx("pop", cue["open"], -22, "the lock pops open"),
       fx("chime", cue["blue"], -22, "ticks turn blue"),
       fx("whoosh", cue["every"], -26, "many capsules across the city"),
       fx("chime", cue["auto"], -23, "payoff: blue ticks")]
video = sys.argv[1] if len(sys.argv) > 1 else None
spec = {"narration": "../" + Path(narration).relative_to(root).as_posix(), "manifest": "assets/assets-manifest.json",
        "music": {"file": "assets/music-pad.wav", "gain_db": BED_OFFSET_DB, "fade_in": 1.5, "fade_out": 2.5,
                  "duck": {"threshold": 0.03, "ratio": 8, "attack_ms": 30, "release_ms": 600}},
        "sfx": sfx, "loudness": {"integrated_lufs": -16, "true_peak_db": -1.5}, "intelligibility_min_lu": 12, "output": "mix.wav"}
if video:
    spec["video"] = {"input": video, "output": "final-1080x1920.mp4"}
(root / "audio/mix-spec.json").write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps([(s["file"], s["at"]) for s in sfx]))
