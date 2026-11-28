"""P014.4A focused doctor tests: available and missing dependencies, unsupported combinations, read-only behaviour.

python -I scripts/tests/test_doctor.py --runtime <kokoro runtime.json> [--work <folder outside the package>]
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
ap.add_argument("--mithi-runtime", help="optional Mithi WSL runtime.json (adds the P015.2A doctor checks)")
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-doctor-tests"))
a = ap.parse_args()
work = Path(a.work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
doctor = pkg / "scripts" / "doctor.py"
results = []
snapshot = lambda: {p.relative_to(pkg).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(pkg.rglob("*")) if p.is_file()}
before = snapshot()
project = work / "project"; project.mkdir()

# Isolate from runtime files the maintainer has configured (P026.3 discovery): only runtimes passed explicitly count.
(work / "no-runtimes").mkdir(parents=True, exist_ok=True); os.environ["VC_RUNTIMES"] = str(work / "no-runtimes")


def check(name, ok, **detail):
    results.append(dict(name=name, ok=bool(ok), **detail))
    print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(detail, ensure_ascii=False)[:300])


def doc(*args, env=None, runtime=a.runtime):
    out = work / f"report-{len(results)}.json"
    cmd = [sys.executable, "-I", str(doctor), "--project", str(project), "--json", str(out), *args] + (["--runtime", f"kokoro-onnx={runtime}"] if runtime else [])
    done = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", env=env)
    report = json.loads(out.read_text(encoding="utf-8")) if out.exists() else {}
    return done, report


codes = lambda rep: [p["code"] for p in rep.get("compatibility", {}).get("problems", [])]

# Available: the tested Hindi / Paper Explainer route.
r, rep = doc("--locale", "hi-IN", "--style", "paper-explainer", "--provider", "kokoro-onnx", "--voice", "hf_alpha")
check("available combination is READY with all required tools", r.returncode == 0 and rep["compatibility"]["ready"]
      and all(t["status"] == "available" for t in rep["tools"].values()) and rep["styles"]["paper-explainer"]["status"] == "available"
      and rep["locales"]["hi-IN"]["status"] == "available" and rep["host_invocation"].startswith("not demonstrated"),
      tools={k: t["status"] for k, t in rep.get("tools", {}).items()})
check("planned, candidate and validated statuses are distinguished",
      all(s["status"] == "available" for s in rep["styles"].values()) and rep["narration_providers"]["mithi"]["status"] == "installed (runtime not configured)"
      and rep["narration_providers"]["mithi"]["word_timing"] is True and rep["locales"]["kn-IN"]["status"] == "installed" and rep["locales"]["en-IN"]["routes"][0]["provider"] == "mithi"
      and "experimentally validated" in (rep["locales"]["hi-IN"]["routes"][0]["validation"] or "") and len(rep["styles"]) == 9,
      locales={k: v["status"] for k, v in rep["locales"].items()})

# Unsupported combinations: explicit codes, never a substitute.
cases = [("unsupported locale", ["--locale", "bn-IN"], "unsupported-locale"), ("style without a backend", ["--style", "claymation"], "unknown-style"),
         ("unknown style", ["--style", "watercolour"], "unknown-style"), ("unsupported voice", ["--locale", "hi-IN", "--voice", "af_heart"], "unsupported-voice"),
         ("provider without route", ["--locale", "te-IN", "--provider", "kokoro-onnx"], "unsupported-provider")]
for name, args, code in cases:
    r, rep = doc(*args)
    check(f"rejects {name}", r.returncode == 1 and code in codes(rep), codes=codes(rep))

# Missing dependencies: FFmpeg removed from PATH; narration runtime missing; runtime placed inside the package.
keep = {str(Path(shutil.which("node")).parent), str(Path(sys.executable).parent), os.environ.get("SystemRoot", "") + "\\System32"}
r, rep = doc("--locale", "hi-IN", env={**os.environ, "PATH": os.pathsep.join(keep)})
check("missing FFmpeg/FFprobe reported as missing-dependency", r.returncode == 1 and rep["tools"]["ffmpeg"]["status"] == "missing"
      and rep["tools"]["ffprobe"]["status"] == "missing" and "missing-dependency" in codes(rep), codes=codes(rep))
bad = work / "missing-runtime.json"; bad.write_text(json.dumps({"python": str(work / "no-python.exe"), "model": "x", "voices": "y"}), encoding="utf-8")
r, rep = doc("--locale", "hi-IN", runtime=bad)
check("missing narration runtime makes hi-IN unavailable", r.returncode == 1 and "narration-unavailable" in codes(rep)
      and rep["narration_providers"]["kokoro-onnx"]["status"] == "installed (runtime missing)", status=rep["narration_providers"]["kokoro-onnx"].get("status"))
r, rep = doc("--locale", "hi-IN", runtime=None)
check("no runtime configured is reported, not assumed", r.returncode == 1 and rep["narration_providers"]["kokoro-onnx"]["status"] == "installed (runtime not configured)")
inside = work / "inside-runtime.json"
inside.write_text(json.dumps({"python": sys.executable, "model": str(pkg / "model.onnx"), "voices": str(pkg / "voices.bin")}), encoding="utf-8")
r, rep = doc("--locale", "hi-IN", runtime=inside)
check("runtime paths inside the package are refused", rep["narration_providers"]["kokoro-onnx"]["status"] == "incompatible")

# Mithi (P015.2A/B): synthesis through WSL plus native word timing; timing is technically available but not human-validated.
if a.mithi_runtime:
    out = work / "report-mithi.json"
    done = subprocess.run([sys.executable, "-I", str(doctor), "--project", str(project), "--json", str(out), "--runtime", f"mithi={a.mithi_runtime}",
                           "--locale", "te-IN", "--provider", "mithi", "--voice", "ahana"], capture_output=True, text=True, encoding="utf-8")
    rep = json.loads(out.read_text(encoding="utf-8")) if out.exists() else {}
    route = (rep.get("locales", {}).get("te-IN", {}).get("routes") or [{}])[0]
    notes = rep.get("compatibility", {}).get("notes", [])
    check("Mithi te-IN: READY with word timing, flagged as not human-validated", done.returncode == 0 and route.get("synthesis") is True
          and route.get("word_timing") is True and codes(rep) == [] and any("not human-validated" in n for n in notes)
          and any(v["id"] == "ahana" and v["in_bundle"] for v in route.get("voices", [])), codes=codes(rep), status=route.get("status"))
    for loc, voice in (("kn-IN", "vaidehi"), ("ta-IN", "malini"), ("en-IN", "anirban"), ("hi-IN", "charvi")):
        done = subprocess.run([sys.executable, "-I", str(doctor), "--project", str(project), "--json", str(out), "--runtime", f"mithi={a.mithi_runtime}",
                               "--locale", loc, "--provider", "mithi", "--voice", voice], capture_output=True, text=True, encoding="utf-8")
        rep = json.loads(out.read_text(encoding="utf-8")) if out.exists() else {}
        check(f"Mithi {loc}/{voice} READY, timing flagged as not human-validated", done.returncode == 0 and codes(rep) == []
              and any("not human-validated" in n for n in rep.get("compatibility", {}).get("notes", [])), codes=codes(rep))
    bad = work / "mithi-kind.json"; bad.write_text(json.dumps({"python": sys.executable, "model": str(work)}), encoding="utf-8")
    done = subprocess.run([sys.executable, "-I", str(doctor), "--project", str(project), "--json", str(out), "--runtime", f"mithi={bad}",
                           "--locale", "te-IN", "--provider", "mithi"], capture_output=True, text=True, encoding="utf-8")
    rep = json.loads(out.read_text(encoding="utf-8"))
    check("Mithi with a non-WSL runtime is incompatible", rep["narration_providers"]["mithi"]["status"] == "incompatible"
          and "narration-unavailable" in codes(rep), codes=codes(rep))

# Read-only behaviour and package immutability.
r = subprocess.run([sys.executable, "-I", str(doctor), "--json", str(pkg / "report.json")], capture_output=True, text=True)
check("report inside the package is refused", r.returncode == 2 and "outside the Skill package" in r.stderr)
check("doctor writes nothing to the project folder", not any(project.iterdir()))
after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])

(work / "doctor-test-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed — results: {work / 'doctor-test-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
