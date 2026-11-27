"""P014.5 focused script-to-narration stage tests (short generic script; uses the local Kokoro runtime).

python -I scripts/tests/test_narration_stage.py --runtime <kokoro runtime.json> [--work <folder outside the package>]
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--runtime", required=True)
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-narration-stage-tests"))
a = ap.parse_args()
work = Path(a.work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
S = pkg / "scripts"
results = []
digest = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
snapshot = lambda: {p.relative_to(pkg).as_posix(): digest(p) for p in sorted(pkg.rglob("*")) if p.is_file()}
before = snapshot()


def check(name, ok, **detail):
    results.append(dict(name=name, ok=bool(ok), **detail))
    print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(detail, ensure_ascii=False)[:300])


def py(*args):
    return subprocess.run([sys.executable, "-I", *map(str, args)], capture_output=True, text=True, encoding="utf-8")


def config(name, *items):
    out = work / f"{name}.json"
    py(S / "preferences.py", "resolve", *items, "--store", work / "prefs.json", "--json", out)
    return out


def stage(*args):
    done = py(S / "narration" / "stage.py", *args)
    try:
        out = json.loads(done.stdout) if done.stdout.strip() else {}
    except ValueError:
        out = {}
    return done.returncode, out, done.stderr.strip()


def write(project, rel, obj):
    path = Path(project) / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def complete(project, name, outputs):
    py(S / "project.py", "start", project, name)
    ev = write(project, f"qa/{name}-evidence.json", {"passed": True})
    done = py(S / "project.py", "complete", project, name, *sum((["--output", o] for o in outputs), []), "--evidence", ev)
    assert done.returncode == 0, done.stderr


def ledger_state(project):
    return json.loads((Path(project) / "project.json").read_text(encoding="utf-8"))["stages"]


SEGMENTS = [{"id": "s1", "role": "hook", "text": "यह एक छोटा परीक्षण है।", "claims": ["c1"]},
            {"id": "s2", "role": "mechanism", "text": "हम कथावाचन की जाँच कर रहे हैं।", "claims": []},
            {"id": "s3", "role": "resolution", "text": "परीक्षण यहीं समाप्त होता है।", "claims": []}]
SCRIPT = {"schema": "video-creator.script", "version": 1, "locale": "hi-IN", "segments": SEGMENTS}
runtime = f"kokoro-onnx={a.runtime}"
base = ["locale=hi-IN", "narration.provider=kokoro-onnx", "narration.voice=hf_alpha"]
P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "generic narration test",
                       "--config", config("cfg-30", *base, "duration_seconds=30")).stdout)["created"]["project"])
complete(P, "research", [write(P, "research/claims.json", {"claims": [{"id": "c1", "claim": "generic", "status": "verified"}]})])
complete(P, "script", [write(P, "script/script.json", SCRIPT)])

# Invalid scripts are rejected before any synthesis.
bad_cases = [("duplicate ids", {**SCRIPT, "segments": [SEGMENTS[0], SEGMENTS[0]]}, "invalid-script"),
             ("empty text", {**SCRIPT, "segments": [{**SEGMENTS[0], "text": "  "}]}, "invalid-script"),
             ("unknown role", {**SCRIPT, "segments": [{**SEGMENTS[0], "role": "dance"}]}, "invalid-script"),
             ("locale mismatch", {**SCRIPT, "locale": "kn-IN"}, "locale-mismatch"),
             ("unknown claim", {**SCRIPT, "segments": [{**SEGMENTS[0], "claims": ["c9"]}]}, "unknown-claim"),
             ("provider length limit", {**SCRIPT, "segments": [{**SEGMENTS[0], "text": "परीक्षण " * 60}]}, "segment-too-long"),
             ("wrong schema", {**SCRIPT, "version": 2}, "invalid-script")]
for name, script, code_expected in bad_cases:
    write(P, "script/bad.json", script)
    code, out, err = stage("validate", P, "--script", "script/bad.json")
    check(f"rejects script: {name}", code == 1 and f"[{code_expected}]" in err, err=err[-120:])
check("no audio was synthesized by validation", not (P / "narration" / "segments").exists())
code, out, err = stage("validate", P)
check("valid script passes validation", code == 0 and out.get("segments") == 3)

# Run 1: off target (30 s) → stage fails with measurement and revision hints; all segments synthesized.
code, ev1, err = stage("run", P, "--runtime", runtime, "--max-attempts", "2")
check("multi-segment run: synthesized, combined, measured, off-target reported", code == 1 and len(ev1.get("segments", [])) == 3
      and not any(s["reused"] for s in ev1["segments"]) and ev1["within_tolerance"] is False and ev1["revision_hints"]
      and ev1["timing_status"] == "unreviewed" and ledger_state(P)["narration"]["state"] == "failed"
      and "duration-off-target" in (ledger_state(P)["narration"]["failure"] or {}).get("reason", ""),
      measured=ev1.get("measured_seconds"), hints=[h["id"] for h in ev1.get("revision_hints", [])], err=err[-200:])
first_files = {p.name: digest(p) for p in (P / "narration" / "segments").glob("*.wav")}

# Partial revision: only s2 changes → s1 and s3 reused; the bound of 2 attempts is reached and reported.
revised = {**SCRIPT, "segments": [SEGMENTS[0], {**SEGMENTS[1], "text": "हम कथावाचन के चरण की जाँच कर रहे हैं।"}, SEGMENTS[2]]}
write(P, "script/script.json", revised)
py(S / "project.py", "verify", P)
complete(P, "script", [P / "script/script.json"])
code, ev2, err = stage("run", P, "--runtime", runtime, "--max-attempts", "2")
reuse = {s["id"]: s["reused"] for s in ev2.get("segments", [])}
check("partial revision reuses unchanged segments and resynthesizes only the changed one", reuse == {"s1": True, "s2": False, "s3": True},
      reuse=reuse)
check("bounded attempts: unresolved deviation reported after the limit", code == 1 and ev2.get("attempt") == 2
      and "unresolved-duration-deviation" in (ledger_state(P)["narration"]["failure"] or {}).get("reason", ""))
check("earlier segment artifacts are preserved", all((P / "narration" / "segments" / n).exists() for n in first_files))

# Interrupted run: a live runner lock refuses; a stale lock is recovered.
lock = P / "narration" / ".runner.lock"
lock.write_text(json.dumps({"pid": os.getpid(), "child": None}))
code, out, err = stage("run", P, "--runtime", runtime)
check("refuses to resume while a previous synthesis process is active", code == 1 and "[synthesis-active]" in err)
lock.write_text(json.dumps({"pid": 2147480000, "child": 2147480001}))

# Corrupt a reused segment: it is set aside (not deleted) and resynthesized.
victim = next(p for p in (P / "narration" / "segments").glob("s1-*.wav"))
victim.write_bytes(victim.read_bytes()[:-200] + b"\0" * 200)

# Target changed to the measured length → narration completes with all-but-one segments reused.
target = round(ev2["measured_seconds"])
out = json.loads(py(S / "project.py", "reconfigure", P, "--config", config("cfg-fit", *base, f"duration_seconds={target}")).stdout)
check("a new target duration invalidates the script stage (scripts are written to a duration)", out["stages"]["script"] == "invalidated"
      and out["stages"]["research"] == "completed")
complete(P, "script", [P / "script/script.json"])  # the agent re-confirms the unchanged script against the new target
code, ev3, err = stage("run", P, "--runtime", runtime)
st = ledger_state(P)["narration"]
check("in-tolerance run completes the ledger stage with verified evidence", code == 0 and ev3.get("passed") and st["state"] == "completed"
      and st["validation"]["evidence"] == "narration/narration-evidence.json" and len(st["outputs"]) == 2 and not lock.exists(),
      measured=ev3.get("measured_seconds"), target=target, deviation=ev3.get("deviation"), err=err[-200:])
reuse = {s["id"]: s["reused"] for s in ev3.get("segments", [])}
check("corrupted segment set aside and resynthesized; others reused", reuse == {"s1": False, "s2": True, "s3": True}
      and list((P / "narration" / "segments").glob("s1-*.wav.corrupt-*")), reuse=reuse)
combined = json.loads((P / ev3["combined"]["timeline"]).read_text(encoding="utf-8")) if ev3.get("combined") else {}
check("combined timeline keeps sample timing, hashes, segment provenance and unreviewed status",
      combined.get("validation") == "unreviewed" and [s["id"] for s in combined.get("segments", [])] == ["s1", "s2", "s3"]
      and combined["audio"]["sha256"] == digest(P / ev3["combined"]["wav"]) and all(isinstance(r["start"], int) for r in combined["records"] if r["start"] is not None))
code, out, err = stage("run", P, "--runtime", runtime)
check("a completed narration stage is not repeated", code == 1 and "[ledger-refused]" in err and "not repeated" in err)

# Unsupported configurations are explicit.
Q = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "unsupported", "--config",
                       config("cfg-mithi", "locale=kn-IN", "narration.provider=mithi", "narration.voice=x")).stdout)["created"]["project"])
complete(Q, "research", [write(Q, "research/claims.json", {"claims": []})])
complete(Q, "script", [write(Q, "script/script.json", {**SCRIPT, "locale": "kn-IN", "segments": [{**SEGMENTS[1], "claims": []}]})])
code, out, err = stage("validate", Q)
check("unsupported provider/locale rejected explicitly", code == 1 and "[unsupported-voice]" in err, err=err[-120:])
R = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "auto", "--config", config("cfg-auto", "locale=hi-IN")).stdout)["created"]["project"])
complete(R, "research", [write(R, "research/claims.json", {"claims": [{"id": "c1"}]})])
complete(R, "script", [write(R, "script/script.json", SCRIPT)])
code, out, err = stage("validate", R)
check("auto provider/voice requires an explicit agent decision", code == 1 and "[decision-required]" in err)

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "narration-stage-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - results: {work / 'narration-stage-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
