"""P014.4B focused preference tests: persistence, partial updates, request overrides, invalid values, unsupported
combinations, schema versions, protection of saved preferences and package immutability.

python -I scripts/tests/test_preferences.py --runtime <kokoro runtime.json> [--work <folder outside the package>]
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--runtime", required=True)
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-prefs-tests"))
a = ap.parse_args()
work = Path(a.work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
tool = pkg / "scripts" / "preferences.py"
store = work / "config" / "preferences.json"
results = []
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
snapshot = lambda: {p.relative_to(pkg).as_posix(): digest(p) for p in sorted(pkg.rglob("*")) if p.is_file()}
before = snapshot()


def check(name, ok, **detail):
    results.append(dict(name=name, ok=bool(ok), **detail))
    print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(detail)[:280])


def prefs(*args, store_path=store):
    done = subprocess.run([sys.executable, "-I", str(tool), *args, "--store", str(store_path)], capture_output=True, text=True, encoding="utf-8")
    try:
        out = json.loads(done.stdout) if done.stdout.strip() else {}
    except ValueError:
        out = {}
    return done.returncode, out, done.stderr.strip()


# Defaults: no hardcoded language, provider, voice or style.
code, out, err = prefs("resolve")
eff = out.get("effective", {})
check("defaults leave language, provider, voice and style undecided", code == 0 and eff.get("locale") is None and eff["narration"]["provider"] == "auto"
      and eff["narration"]["voice"] == "auto" and eff["style"] == "auto" and out["source"]["fps"] == "default" and not store.exists(),
      left_to_agent=out.get("creative_decisions_left_to_agent"))

# Persistence and refusal to overwrite.
code, out, err = prefs("init", "locale=hi-IN", "duration_seconds=75", "music.enabled=false")
saved = json.loads(store.read_text(encoding="utf-8")) if store.exists() else {}
check("init persists a versioned store", code == 0 and saved.get("version") == 1 and saved["preferences"]["locale"] == "hi-IN"
      and saved["preferences"]["music"] == {"enabled": False})
first = digest(store)
code, out, err = prefs("init", "locale=en-IN")
check("init refuses to overwrite existing preferences", code == 1 and "already exists" in err and digest(store) == first)

# Partial updates keep other keys; no temporary files remain.
code, out, err = prefs("set", "fps=25", "narration.tone=calm")
p = out.get("preferences", {})
check("partial update keeps unrelated keys; atomic write leaves no temp files", code == 0 and p.get("fps") == 25 and p["locale"] == "hi-IN"
      and p["duration_seconds"] == 75 and p["narration"] == {"tone": "calm"} and not list(store.parent.glob(".preferences-*")))

# Precedence: request > saved > default, and request values are not saved.
mid = digest(store)
code, out, err = prefs("resolve", "fps=60", "orientation=horizontal")
eff, src = out.get("effective", {}), out.get("source", {})
check("request overrides saved, saved overrides defaults; store unchanged", code == 0 and eff["fps"] == 60 and src["fps"] == "request"
      and eff["duration_seconds"] == 75 and src["duration_seconds"] == "saved" and eff["resolution"] == 1080 and src["resolution"] == "default"
      and digest(store) == mid)

# Invalid values are rejected and leave the store untouched.
bad = ["fps=17", "orientation=diagonal", "locale=fr-FR", "style=watercolour", "duration_seconds=-5", "review_mode=sometimes",
       "cost_policy=paid-apis", "captions.subtitle_files=[\"ass\"]", "nonsense.key=1", "narration.provider=elevenlabs", f"output_dir={pkg / 'out'}"]
rejected = [b for b in bad if prefs("set", b)[0] == 1]
check("invalid values rejected without changing the store", rejected == bad and digest(store) == mid, rejected=len(rejected), of=len(bad))

# Capability validation through doctor.py: planned locales/styles are valid preferences but not available capabilities.
code, out, err = prefs("resolve", "--check", "--runtime", f"kokoro-onnx={a.runtime}", "style=paper-explainer", "narration.provider=kokoro-onnx", "narration.voice=hf_alpha")
check("supported combination passes the capability check", code == 0 and out["capabilities"]["ready"], problems=out.get("capabilities", {}).get("problems"))
code, out, err = prefs("resolve", "--check", "--runtime", f"kokoro-onnx={a.runtime}")
check("auto style/provider/voice stay agent decisions with available choices listed", code == 0 and out["capabilities"]["available_for_auto"]["styles"] == ["3d-explainer", "data-storytelling", "documentary", "flat-science", "kinetic-typography", "paper-explainer", "tech-explainer", "whiteboard", "x-ray-explainer"]
      and out["capabilities"]["available_for_auto"]["routes"][0]["provider"] == "kokoro-onnx", auto=out.get("capabilities", {}).get("available_for_auto"))
cases = [("locale without a route on the chosen provider", ["locale=kn-IN", "narration.provider=kokoro-onnx"], "unsupported-provider"), ("unsupported voice", ["narration.voice=af_heart"], "unsupported-voice"), ("provider whose runtime is not configured", ["narration.provider=mithi"], "narration-unavailable")]
for name, items, expected in cases:
    code, out, err = prefs("resolve", "--check", "--runtime", f"kokoro-onnx={a.runtime}", *items)
    codes = [p["code"] for p in out.get("capabilities", {}).get("problems", [])]
    check(f"rejects {name} explicitly", code == 1 and expected in codes, codes=codes)
code, out, err = prefs("resolve", "--check", "--runtime", f"kokoro-onnx={a.runtime}", "style=claymation")
check("rejects a style that is not in the registry explicitly", code != 0 and "style: must be one of" in (err + json.dumps(out)), err=err[-160:])
code, out, err = prefs("resolve", "--check", "--runtime", f"kokoro-onnx={a.runtime}", "locale=null")
check("unset language is reported, not guessed", code == 1 and "locale-unset" in [p["code"] for p in out["capabilities"]["problems"]])

# Schema version handling and corrupt stores.
newer = work / "newer.json"; newer.write_text(json.dumps({"schema": "video-creator.preferences", "version": 2, "preferences": {}}), encoding="utf-8")
corrupt = work / "corrupt.json"; corrupt.write_text("{not json", encoding="utf-8")
n1, c1 = digest(newer), digest(corrupt)
r1 = prefs("set", "fps=30", store_path=newer); r2 = prefs("show", store_path=corrupt)
check("unsupported schema version and corrupt stores are refused untouched", r1[0] == 1 and "version 2" in r1[2] and r2[0] == 1
      and digest(newer) == n1 and digest(corrupt) == c1)

# Reset requires confirmation and keeps a backup.
code, out, err = prefs("reset")
check("reset without --confirm is refused", code == 1 and digest(store) == mid)
code, out, err = prefs("reset", "--confirm")
backup = Path(out.get("backup") or "")
check("reset --confirm backs up then restores defaults", code == 0 and backup.exists() and digest(backup) == mid
      and json.loads(store.read_text(encoding="utf-8"))["preferences"] == {})

# Package protection.
code, out, err = prefs("show", store_path=pkg / "preferences.json")
check("store inside the package is refused", code == 1 and "outside the Skill package" in err)
after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])

(work / "preferences-test-results.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - results: {work / 'preferences-test-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
