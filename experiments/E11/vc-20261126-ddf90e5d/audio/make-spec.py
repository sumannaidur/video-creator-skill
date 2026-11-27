"""Writes audio/mix-spec.json: effect times come from the resolved plan (cue ids and shot boundaries), never typed by hand."""
import json, sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
plan = json.loads((root / "plan/resolved-plan.json").read_text(encoding="utf-8"))
cue = {c["id"]: c["at"]["seconds"] for s in plan["shots"] for c in s.get("cues", [])}
start = {s["id"]: s["start"]["seconds"] for s in plan["shots"]}
fx = lambda f, t, g, why: dict(file=f"assets/{f}.wav", at=round(t, 3), gain_db=g, why=why)
sfx = [fx("pop", cue["sky-question"], -22, "question pops into the sky"),
       fx("chime", cue["fan-out"], -22, "white light fans into colours"),
       fx("whoosh", start["air"] - .35, -24, "sheet transition up into the air"),
       fx("pop", cue["scatter-burst"], -23, "light scatters from a molecule"),
       fx("pop", cue["blue-splinters"], -24, "blue wave splinters"),
       fx("whoosh", start["whole-sky"] - .35, -24, "sheet transition back to the rooftop"),
       fx("chime", cue["sky-glow"], -24, "the whole sky glows blue"),
       fx("whoosh", start["sunset"] - .35, -24, "sheet transition into evening"),
       fx("chime", cue["dusk-glow"], -22, "payoff: orange sky over the rooftop")]
video = sys.argv[1] if len(sys.argv) > 1 else None
spec = {"narration": "../narration/narration-bc46667d38.wav", "manifest": "assets/assets-manifest.json",
        "music": {"file": "assets/music-pad.wav", "gain_db": 0, "fade_in": 1.5, "fade_out": 2.5,
                  "duck": {"threshold": 0.03, "ratio": 8, "attack_ms": 30, "release_ms": 600}},
        "sfx": sfx, "loudness": {"integrated_lufs": -16, "true_peak_db": -1.5}, "intelligibility_min_lu": 12, "output": "mix.wav"}
if video:
    spec["video"] = {"input": video, "output": "final-1080x1920.mp4"}
(root / "audio/mix-spec.json").write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps([(s["file"], s["at"]) for s in sfx]))
