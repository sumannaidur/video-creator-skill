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

# Mithi narration is quieter than the Kokoro reference the bed was set against (E13 evidence); keep the E13 offset.
BED_OFFSET_DB = -7


def fx(f, t, g, why):
    return dict(file=f"assets/{f}.wav", at=round(max(0.0, t), 3), gain_db=g + BED_OFFSET_DB, why=why)


sfx = [fx("chime", cue["rate"], -25, "the 60–100 tag lands"),
       fx("whoosh", start["heart"] - .4, -24, "push through the chest window into the heart"),
       fx("pop", cue["open"], -24, "the heart opens into its cross-section"),
       fx("whoosh", cue["blue-in"] - .1, -28, "blue cells rush in"),
       fx("whoosh", start["lungs"] - .35, -25, "dissolve to the lungs"),
       fx("chime", cue["o2"], -24, "oxygen at the air sacs"),
       fx("rumble", cue["squeeze"], -24, "the left ventricle squeezes"),
       fx("whoosh", cue["head"] - .1, -27, "arteries race to the head"),
       fx("whoosh", cue["toes"] - .1, -27, "arteries race to the toes"),
       fx("pop", cue["stop"], -23, "the valve doors snap shut"),
       fx("pop", cue["lub"], -20, "LUB"),
       fx("pop", cue["dub"], -21, "DUB"),
       fx("chime", cue["spark"], -22, "the SA node sparks")]
video = sys.argv[1] if len(sys.argv) > 1 else None
spec = {"narration": "../" + Path(narration).relative_to(root).as_posix(), "manifest": "assets/assets-manifest.json",
        "music": {"file": "assets/music-pad.wav", "gain_db": BED_OFFSET_DB, "fade_in": 1.5, "fade_out": 2.5,
                  "duck": {"threshold": 0.03, "ratio": 8, "attack_ms": 30, "release_ms": 600}},
        "sfx": sfx, "loudness": {"integrated_lufs": -16, "true_peak_db": -1.5}, "intelligibility_min_lu": 12, "output": "mix.wav"}
if video:
    spec["video"] = {"input": video, "output": "final-1080x1920.mp4"}
(root / "audio/mix-spec.json").write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps([(s["file"], s["at"]) for s in sfx]))
