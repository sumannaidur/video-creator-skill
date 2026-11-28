"""P014.3B focused narration/timing tests (system Python). Uses the repository's P013 artifacts as fixtures.

python -I skills/video-creator/scripts/tests/test_narration.py --runtime <kokoro runtime.json> [--repo <root>] [--work <scratch>]
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

PKG = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--runtime", required=True)
ap.add_argument("--repo", default=str(PKG.parents[1]))
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-p014b-tests"))
args = ap.parse_args()
repo, work = Path(args.repo).resolve(), Path(args.work).resolve()
shutil.rmtree(work, ignore_errors=True); work.mkdir(parents=True)
results = []


def skip(name, reason):
    results.append(dict(name=name, status="skipped", reason=reason))
    print(f"SKIP {name} ({reason})")


def check(name, ok, **detail):
    results.append(dict(name=name, **detail, status="passed" if ok else "failed"))
    print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(detail, ensure_ascii=False)[:400])


# 1. No runtime references to experiments/ (provenance docstring lines excluded), then use an installed copy outside the repo.
refs = []
for f in (PKG / "scripts" / "narration").rglob("*"):
    if f.suffix in {".py", ".json"}:
        for n, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if ("experiments" in line or "E03" in line or "E04" in line) and "Packaged from" not in line and not line.lstrip().startswith(("experiments/E04", "experiments/E03", "mapping/", "\"note\"")):
                refs.append(f"{f.name}:{n}")
check("no experiments/ references in packaged narration code", not refs, refs=refs)
installed = work / "installed" / "video-creator"
shutil.copytree(PKG, installed)
narrate = installed / "scripts" / "narration" / "narrate.py"


def run(*a, cwd=None):
    return subprocess.run([sys.executable, "-I", str(narrate), *a], capture_output=True, text=True, encoding="utf-8", cwd=cwd)


# 2a. The packaged SYNTHETIC fixture (P027.2): original integer tone bursts, not speech and not provider evidence. Real
# Kokoro synthesis and timing are covered by test_narration_stage.py and smoke_integration.py with a local runtime.
fixtures = Path(__file__).resolve().parent / "fixtures"
gen = subprocess.run([sys.executable, "-I", str(fixtures / "narration" / "make_synthetic_fixture.py"), "--check"], capture_output=True, text=True)
check("synthetic narration fixture is reproduced byte for byte by its generator", gen.returncode == 0, out=gen.stdout[-200:])
r = run("validate", "--project", str(fixtures), "narration/synthetic-hi.timeline.json")
fx = json.loads((fixtures / "narration" / "synthetic-hi.timeline.json").read_text(encoding="utf-8"))
kinds = {x["kind"] for x in fx["records"]}
check("packaged synthetic timeline valid under packaged validator; labelled synthetic; all record kinds and an untimed word",
      r.returncode == 0 and r.stdout.count("Valid:") == 1 and fx["fixture"]["synthetic"] is True and fx["fixture"]["speech"] is False
      and kinds == {"sentence", "phrase", "word", "phoneme", "pause"} and any(x["kind"] == "word" and x["start"] is None for x in fx["records"]),
      err=r.stderr[-300:])
# Integrity: a changed audio byte and a wrong Unicode slice are both refused.
bad = work / "fixture-tamper"; shutil.rmtree(bad, ignore_errors=True); (bad / "narration").mkdir(parents=True)
wav = bytearray((fixtures / "narration" / "synthetic-hi.wav").read_bytes()); wav[-2] ^= 1
(bad / "narration" / "synthetic-hi.wav").write_bytes(bytes(wav))
(bad / "narration" / "a.timeline.json").write_text(json.dumps(fx, ensure_ascii=False), encoding="utf-8")
slice_bad = json.loads(json.dumps(fx)); slice_bad["audio"]["sha256"] = hashlib.sha256(bytes(wav)).hexdigest()
slice_bad["records"][next(i for i, x in enumerate(slice_bad["records"]) if x["kind"] == "word")]["text_ref"]["end"] += 1
(bad / "narration" / "b.timeline.json").write_text(json.dumps(slice_bad, ensure_ascii=False), encoding="utf-8")
ra, rb = run("validate", "--project", str(bad), "narration/a.timeline.json"), run("validate", "--project", str(bad), "narration/b.timeline.json")
check("tampered audio and a wrong text slice are refused", ra.returncode != 0 and "checksum" in ra.stderr and rb.returncode != 0 and "slice" in rb.stderr,
      a=ra.stderr[-120:], b=rb.stderr[-120:])

# 2b. Optional regression: every P013 timing artifact validates. Repository only; the WAVs are git-ignored media.
outputs = repo / "experiments/E04/native-timing/outputs"
files = [repo / "experiments/E10/p013-flights/narration-DK.timeline.json", outputs / "combined-ABC.timeline.json",
         *sorted(outputs.glob("sample-*-candidate.timeline.json")), *sorted(outputs.glob("sample-*-native.timeline.json"))]


def audio_missing(timelines):
    missing = []
    for f in timelines:
        if not f.is_file():
            missing.append(str(f))
            continue
        audio = json.loads(f.read_text(encoding="utf-8")).get("audio", {}).get("path")
        if not audio or not (repo / audio).is_file():
            missing.append(str(audio or f))
    return missing


missing = audio_missing(files) if outputs.is_dir() else [str(outputs)]
if missing:
    skip("P013 timelines valid under packaged validator", "fixtures unavailable: " + ", ".join(missing[:3]) + (f" (+{len(missing) - 3})" if len(missing) > 3 else ""))
else:
    r = run("validate", "--project", str(repo), *map(str, files))
    check("P013 timelines valid under packaged validator", r.returncode == 0 and r.stdout.count("Valid:") == len(files), files=len(files), err=r.stderr[-300:])

# 3. Segment combination regression: D–K with 200 ms gaps reproduces the P013 narration byte for byte. Optional, repository only.
segments = [outputs / f"sample-{x}-candidate.timeline.json" for x in "DEFGHIJK"] + [repo / "experiments/E10/p013-flights/narration-DK.timeline.json"]
missing = audio_missing(segments) if outputs.is_dir() else [str(outputs)]
if missing:
    skip("combine regression: identical WAV, run id and records", "fixtures unavailable: " + ", ".join(missing[:3]) + (f" (+{len(missing) - 3})" if len(missing) > 3 else ""))
else:
    tmp = repo / ".vc-test-tmp"
    shutil.rmtree(tmp, ignore_errors=True)
    try:
        segs = [f"{s}=experiments/E04/native-timing/outputs/sample-{s}-candidate.timeline.json" for s in "DEFGHIJK"]
        r = run("combine", "--project", str(repo), "--id", "flights-DK", "--gap-ms", "200", "--out-wav", ".vc-test-tmp/n.wav", "--out-timeline", ".vc-test-tmp/n.timeline.json", *segs)
        old = json.loads((repo / "experiments/E10/p013-flights/narration-DK.timeline.json").read_text(encoding="utf-8"))
        new = json.loads((tmp / "n.timeline.json").read_text(encoding="utf-8")) if r.returncode == 0 else {}
        same_wav = r.returncode == 0 and hashlib.sha256((tmp / "n.wav").read_bytes()).hexdigest() == old["audio"]["sha256"]
        same = r.returncode == 0 and new["run_id"] == old["run_id"] and new["records"] == old["records"] and new["checks"] == old["checks"]
        check("combine regression: identical WAV, run id and records", same_wav and same, wav=same_wav, records=same, err=r.stderr[-300:])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

# 4. Unsupported combinations fail explicitly (no fallback).
project = work / "project"; (project / "inputs").mkdir(parents=True)
(project / "inputs" / "smoke.txt").write_text("यह कथावाचन पैकेज का एक छोटा परीक्षण है।\n", encoding="utf-8")
(project / "inputs" / "english.txt").write_text("This is English text.\n", encoding="utf-8")
base = ["synth", "--project", str(project), "--runtime", args.runtime, "--text-file", "inputs/smoke.txt", "--out-dir", "narration/segments"]
cases = [("kn-IN on kokoro-onnx", ["--provider", "kokoro-onnx", "--locale", "kn-IN", "--voice", "hf_alpha", "--id", "x1"], "unsupported-locale"),
         ("bn-IN on mithi (no route)", ["--provider", "mithi", "--locale", "bn-IN", "--voice", "vaidehi", "--id", "x2"], "unsupported-locale"),
         ("mithi te-IN with an unlisted voice", ["--provider", "mithi", "--locale", "te-IN", "--voice", "charvi", "--id", "x6"], "unsupported-voice"),
         ("Hindi text for mithi te-IN", ["--provider", "mithi", "--locale", "te-IN", "--voice", "ahana", "--id", "x7"], "script-mismatch"),
         ("Hindi text for mithi kn-IN", ["--provider", "mithi", "--locale", "kn-IN", "--voice", "vaidehi", "--id", "x9"], "script-mismatch"),
         ("Kannada voice for mithi ta-IN", ["--provider", "mithi", "--locale", "ta-IN", "--voice", "vaidehi", "--id", "x10"], "unsupported-voice"),
         ("unknown provider", ["--provider", "nope", "--locale", "hi-IN", "--voice", "hf_alpha", "--id", "x3"], "unsupported-provider"),
         ("unsupported voice", ["--provider", "kokoro-onnx", "--locale", "hi-IN", "--voice", "af_heart", "--id", "x4"], "unsupported-voice")]
for name, extra, code in cases:
    r = run(*base, *extra)
    check(f"rejects {name}", r.returncode == 1 and f"[{code}]" in r.stderr, err=r.stderr.strip()[-200:])
r = run(*[x if x != "inputs/smoke.txt" else "inputs/english.txt" for x in base], "--provider", "kokoro-onnx", "--locale", "hi-IN", "--voice", "hf_alpha", "--id", "x5")
check("rejects text outside the locale script", r.returncode == 1 and "[script-mismatch]" in r.stderr, err=r.stderr.strip()[-200:])
(project / "inputs" / "telugu.txt").write_text("ఇది ఒక చిన్న పరీక్ష.\n", encoding="utf-8")
r = run(*[x if x != "inputs/smoke.txt" else "inputs/telugu.txt" for x in base], "--provider", "mithi", "--locale", "te-IN", "--voice", "ahana", "--id", "x8")
check("rejects a non-WSL runtime for mithi", r.returncode == 1 and "[invalid-runtime]" in r.stderr, err=r.stderr.strip()[-200:])

# 5. Short Hindi smoke test through the packaged interface (new WAV, same-inference timing, mapping, validation).
r = run(*base, "--provider", "kokoro-onnx", "--locale", "hi-IN", "--voice", "hf_alpha", "--id", "smoke")
res = json.loads(r.stdout.strip().splitlines()[-1]) if r.returncode == 0 else {}
seg = project / "narration" / "segments"
check("Hindi smoke: WAV + unreviewed timeline with full word coverage", r.returncode == 0 and res.get("words") == res.get("words_mapped") and res.get("phrases") == res.get("phrases_mapped")
      and all((seg / f"smoke{s}").exists() for s in (".wav", ".timeline.json", ".native.timeline.json", ".raw-duration.json", ".mapping.json")),
      result=res, err=r.stderr.strip()[-300:])
r2 = run(*base, "--provider", "kokoro-onnx", "--locale", "hi-IN", "--voice", "hf_alpha", "--id", "smoke")
check("refuses to overwrite an existing segment WAV", r2.returncode == 1 and "never overwritten" in r2.stderr, err=r2.stderr.strip()[-200:])

(work / "test-narration-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
count = lambda st: sum(x["status"] == st for x in results)
print(f"{count('passed')} passed, {count('failed')} failed, {count('skipped')} skipped")
sys.exit(1 if count("failed") else 0)
