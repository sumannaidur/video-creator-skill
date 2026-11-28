"""Self-contained package integration smoke test (no repository or P013 fixtures).

Copies this Skill package to an isolated folder, creates a separate project folder, then runs:
narration (2 short segments) → timeline validation → segment combining → rendering (small preview) →
procedural assets → mix + stream-copy mux → final MP4 checks. It also checks package immutability, the
documented commands and paths, output protection and extension boundaries. Results go to <work>/smoke-results.json.

  python -I scripts/tests/smoke_integration.py --runtime <kokoro runtime.json> [--work <dir outside the package>]

Requires: Node 22+, Python 3, FFmpeg/FFprobe, a Chromium browser and the user's Kokoro runtime (environment and model).
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--runtime", required=True)
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-smoke"))
a = ap.parse_args()
work = Path(a.work).resolve()
if work.is_relative_to(SOURCE):
    raise SystemExit("--work must be outside the Skill package")
shutil.rmtree(work, ignore_errors=True)
pkg, project = work / "installed" / "video-creator", work / "project"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
results = []
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()


def check(name, ok, **detail):
    results.append(dict(name=name, ok=bool(ok), **detail))
    print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(detail, ensure_ascii=False)[:360])
    return ok


def snapshot():
    return {p.relative_to(pkg).as_posix(): sha(p) for p in sorted(pkg.rglob("*")) if p.is_file()}


def run(cmd, cwd=None):
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True, encoding="utf-8", cwd=cwd or project)


before = snapshot()
project.mkdir(parents=True)
py = [sys.executable, "-I"]
narrate, render = pkg / "scripts/narration/narrate.py", pkg / "scripts/render.mjs"
mixer, assets_tool = pkg / "scripts/audio/mix_audio.py", pkg / "scripts/audio/make_procedural_assets.py"

# 1. Runtime code has no dependency on the source repository's experiments/ folders.
def code_only(p):
    """Executable content only: drop comments, docstrings and the registry's human-readable notes (provenance text is not a dependency)."""
    text = p.read_text(encoding="utf-8")
    if p.suffix == ".py":
        import ast
        tree = ast.parse(text)
        docs = {id(n.body[0].value) for n in ast.walk(tree) if isinstance(n, (ast.Module, ast.FunctionDef, ast.ClassDef))
                and n.body and isinstance(n.body[0], ast.Expr) and isinstance(n.body[0].value, ast.Constant)}
        strings = [n.value for n in ast.walk(tree) if isinstance(n, ast.Constant) and isinstance(n.value, str) and id(n) not in docs]
        return "\n".join(strings + [ast.unparse(n) for n in ast.walk(tree) if isinstance(n, (ast.Import, ast.ImportFrom))])
    if p.suffix == ".json":
        data = json.loads(text)
        strip = lambda v: {k: strip(x) for k, x in v.items() if not k.startswith("_") and k != "note"} if isinstance(v, dict) else v
        return json.dumps(strip(data))
    return re.sub(r"/\*.*?\*/|//[^\n]*|<!--.*?-->", "", text, flags=re.S)


refs = [p.relative_to(pkg).as_posix() for p in pkg.joinpath("scripts").rglob("*") if p.suffix in {".py", ".mjs", ".js", ".html", ".css", ".json"}
        and "tests" not in p.parts and re.search(r"experiments[\\/]|\bE0\d\b|\bE10\b", code_only(p))]
check("no experiments/ dependencies in packaged runtime code", not refs, refs=refs[:5])

# 2. Documented commands, script paths and reference links.
docs = list(pkg.glob("*.md")) + list(pkg.joinpath("references").rglob("*.md"))
missing = sorted({m for d in docs for m in re.findall(r"`?(scripts/[\w./-]+\.(?:json|mjs|py|js))\b", d.read_text(encoding="utf-8")) if not (pkg / m).exists()})
broken = [f"{d.name}->{t}" for d in docs for t in re.findall(r"\]\(([^)#\s]+)", d.read_text(encoding="utf-8"))
          if not t.startswith("http") and not ((d.parent / t).resolve().exists() and (d.parent / t).resolve().is_relative_to(pkg))]
usage = run(["node", render]); prov = run([*py, narrate, "providers"]); gen = run([*py, assets_tool, "-h"]); val = run([*py, pkg / "scripts/narration/timeline.py", "-h"])
check("documented scripts exist, links resolve, commands respond", not missing and not broken and usage.returncode == 2 and "Usage error" in usage.stderr
      and prov.returncode == 0 and "kokoro-onnx" in prov.stdout and '"status": "experimentally-validated"' in prov.stdout and gen.returncode == 0 and val.returncode == 0,
      missing=missing, broken=broken, render_usage=usage.returncode, providers=prov.stdout.count("provider"))

# 3. Narration: two generic segments → validated, combined timeline (project-relative paths only).
(project / "inputs").mkdir()
(project / "inputs/A.txt").write_text("यह एक छोटा परीक्षण है, जो पैकेज की जाँच करता है।\n", encoding="utf-8")
(project / "inputs/B.txt").write_text("सब कुछ ठीक चल रहा है।\n", encoding="utf-8")
seg = []
for sid in "AB":
    r = run([*py, narrate, "synth", "--project", project, "--provider", "kokoro-onnx", "--locale", "hi-IN", "--voice", "hf_alpha", "--runtime", a.runtime,
             "--text-file", f"inputs/{sid}.txt", "--id", sid, "--out-dir", "narration/segments"])
    seg.append(json.loads(r.stdout.strip().splitlines()[-1]) if r.returncode == 0 else {"error": r.stderr.strip()[-200:]})
r = run([*py, narrate, "combine", "--project", project, "--id", "smoke", "--gap-ms", "200", "--out-wav", "narration/narration.wav",
         "--out-timeline", "narration/narration.timeline.json", "A=narration/segments/A.timeline.json", "B=narration/segments/B.timeline.json"])
v = run([*py, narrate, "validate", "--project", project, "narration/narration.timeline.json"])
timeline = json.loads((project / "narration/narration.timeline.json").read_text(encoding="utf-8")) if r.returncode == 0 else {}
phrases = [x for x in timeline.get("records", []) if x["kind"] == "phrase"]
words = [x for x in timeline.get("records", []) if x["kind"] == "word"]
check("narration: segments synthesized, timed, combined and validated", all("run_id" in s for s in seg) and r.returncode == 0 and v.returncode == 0
      and len(phrases) == 3 and all(x["source"] for x in words) and timeline.get("validation") == "unreviewed",
      segments=[{k: s.get(k) for k in ("id", "seconds", "words_mapped", "words", "error")} for s in seg], phrases=len(phrases), err=r.stderr[-200:])

# 4. Rendering through the visual backend boundary (Paper Explainer, small preview) with the generic card fixture.
r = run(["node", render, "--project", project, "--topic", pkg / "scripts/tests/fixtures/cards-topic.js", "--timeline", "narration/narration.timeline.json",
         "--out", "renders/preview", "--name", "video.mp4", "--scale", ".25", "--fps", "10", "--quality", "80", "--crf", "28"])
rev = json.loads((project / "renders/preview/video-evidence.json").read_text(encoding="utf-8")) if r.returncode == 0 else {}
check("render: validated preview MP4 with narration", r.returncode == 0 and rev.get("failures") == [] and rev.get("settings", {}).get("style") == "paper-explainer",
      frames=rev.get("frames"), shots=len(rev.get("shots", [])), cues=len(rev.get("cueChecks", [])), err=r.stderr[-200:])

# 5. Audio: procedural assets with provenance, then mix (music, ducking, effects) and stream-copy mux onto the render.
total = timeline["audio"]["sample_count"] / timeline["audio"]["sample_rate"] if timeline else 10
r = run([*py, assets_tool, project / "audio/assets", "--music-seconds", str(round(total + 3))])
cut = rev["shots"][1]["start"] if rev.get("shots") else 2.0
spec = {"narration": "../narration/narration.wav", "manifest": "assets/assets-manifest.json",
        "music": {"file": "assets/music-pad.wav", "gain_db": 2, "fade_in": 1.0, "fade_out": 1.5, "duck": {"threshold": 0.03, "ratio": 8, "attack_ms": 30, "release_ms": 600}},
        "sfx": [{"file": "assets/whoosh.wav", "at": round(max(0, cut - .35), 3), "gain_db": -16, "why": "shot change"},
                {"file": "assets/pop.wav", "at": round(phrases[0]["start"] / timeline["audio"]["sample_rate"], 3) if phrases else 1.0, "gain_db": -22, "why": "first cue"}],
        "loudness": {"integrated_lufs": -16, "true_peak_db": -1.5}, "intelligibility_min_lu": 12, "output": "mix.wav",
        "video": {"input": "../renders/preview/video.mp4", "output": "../renders/preview/video-mixed.mp4"}}
(project / "audio/mix-spec.json").write_text(json.dumps(spec, indent=2), encoding="utf-8")
m = run([*py, mixer, project / "audio/mix-spec.json"])
mev = json.loads((project / "audio/mix.evidence.json").read_text(encoding="utf-8")) if m.returncode == 0 else {}
check("audio: assets generated and mixed; all mix checks pass", r.returncode == 0 and m.returncode == 0 and mev.get("passed"),
      checks=mev.get("checks"), lufs=mev.get("output", {}).get("integrated"), peak=mev.get("output", {}).get("true_peak"), sync=mev.get("sync", {}).get("lag_ms"), err=(r.stderr + m.stderr)[-200:])

# 6. The same narration flows through every stage, and the final MP4 is valid.
final = project / "renders/preview/video-mixed.mp4"
nar = sha(project / "narration/narration.wav") if timeline else None
probe = json.loads(run(["ffprobe", "-v", "error", "-count_frames", "-show_entries", "stream=codec_type,codec_name,width,height,pix_fmt,nb_read_frames,duration",
                        "-of", "json", final]).stdout or "{}") if final.exists() else {}
streams = {s["codec_type"]: s for s in probe.get("streams", [])}
decode = run(["ffmpeg", "-hide_banner", "-v", "error", "-i", final, "-f", "null", "-"]) if final.exists() else None
check("one narration hash through timeline, render and mix; final MP4 valid",
      nar and nar == timeline["audio"]["sha256"] == rev.get("inputs", {}).get("audio", {}).get("sha256") == mev.get("narration", {}).get("sha256")
      and streams.get("video", {}).get("codec_name") == "h264" and streams.get("audio", {}).get("codec_name") == "aac" and streams["video"]["pix_fmt"] == "yuv420p"
      and int(streams["video"]["nb_read_frames"]) == rev.get("frames") and decode and decode.returncode == 0 and not decode.stderr.strip(),
      narration_sha=(nar or "")[:12], video=[streams.get("video", {}).get(k) for k in ("width", "height", "nb_read_frames")], audio=streams.get("audio", {}).get("duration"))

# 7. Output protection and provenance.
again_seg = run([*py, narrate, "synth", "--project", project, "--provider", "kokoro-onnx", "--locale", "hi-IN", "--voice", "hf_alpha", "--runtime", a.runtime,
                 "--text-file", "inputs/A.txt", "--id", "A", "--out-dir", "narration/segments"])
again_mix = run([*py, mixer, project / "audio/mix-spec.json"])
again_assets = run([*py, assets_tool, project / "audio/assets"])
manifest = json.loads((project / "audio/assets/assets-manifest.json").read_text(encoding="utf-8"))
check("existing narration, mix and assets are not overwritten; provenance recorded",
      again_seg.returncode == 1 and "never overwritten" in again_seg.stderr and again_mix.returncode != 0 and "--overwrite" in again_mix.stderr
      and again_assets.returncode != 0 and all(x["license"] and x["sha256"] for x in manifest["assets"].values()) and set(mev.get("provenance", {})) >= {"assets/music-pad.wav"},
      provenance=sorted(mev.get("provenance", {})))

# 8. Extension boundaries: unsupported style and locale fail explicitly (no fallback).
s = run(["node", render, "--project", project, "--topic", pkg / "scripts/tests/fixtures/cards-topic.js", "--timeline", "narration/narration.timeline.json",
         "--out", "renders/x", "--style", "claymation", "--keys-only"])
l = run([*py, narrate, "synth", "--project", project, "--provider", "kokoro-onnx", "--locale", "ta-IN", "--voice", "hf_alpha", "--runtime", a.runtime,
         "--text-file", "inputs/B.txt", "--id", "T", "--out-dir", "narration/segments"])
check("unsupported style and locale fail explicitly", s.returncode == 1 and "unsupported-style" in s.stderr and l.returncode == 1 and "unsupported-locale" in l.stderr)

# 9. Package immutability: nothing in the installed package changed or was added.
after = snapshot()
changed = sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))
check("installed package unchanged by the whole run", not changed, changed=changed[:5])

(work / "smoke-results.json").write_text(json.dumps(dict(package=str(pkg), project=str(project), results=results), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed — results: {work / 'smoke-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
