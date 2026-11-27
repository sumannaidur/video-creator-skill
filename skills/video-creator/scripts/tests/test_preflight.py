"""P014.7C visual preflight tests: full-timeline geometry checks on a generic fixture (synthetic narration, resolved plan).
Needs Chromium; preflight itself captures no images.

python -I scripts/tests/test_preflight.py [--work <folder outside the package>]
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import time
import wave

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-preflight-tests"))
work = Path(ap.parse_args().work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
S = pkg / "scripts"
FIX = S / "tests" / "fixtures"
results = []
digest = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
snapshot = lambda: {p.relative_to(pkg).as_posix(): digest(p) for p in sorted(pkg.rglob("*")) if p.is_file()}
before = snapshot()
RATE = 24000


def check(name, ok, **detail):
    results.append(dict(name=name, ok=bool(ok), **detail))
    print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(detail, ensure_ascii=True)[:260])


def py(*args):
    return subprocess.run([sys.executable, "-I", *map(str, args)], capture_output=True, text=True, encoding="utf-8")


def write(project, rel, obj):
    path = Path(project) / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def narration(project, segments):
    """segments: [(id, [(word, start_s, end_s)], length_s)] -> toned WAV (tone only while words are spoken) + combined-style timeline."""
    total = round(sum(n for _, _, n in segments) * RATE)
    pcm, text, records, meta, offset = [0] * total, "", [], [], 0
    for sid, words, n in segments:
        text += " " if text else ""
        base, seg = len(text), []
        for wd, st, en in words:
            a, b = offset + round(st * RATE), offset + round(en * RATE)
            for i in range(a, b):
                pcm[i] = int(8000 * math.sin(2 * math.pi * 220 * i / RATE))
            lo = len(text); text += wd + " "
            seg.append(dict(kind="word", label=wd, start=a, end=b, source="forced_alignment", segment=sid, text_ref=dict(field="speech", start=lo, end=lo + len(wd))))
        text = text.rstrip()
        records += seg + [dict(kind="phrase", label=text[base:], start=seg[0]["start"], end=seg[-1]["end"], source="forced_alignment", segment=sid,
                               text_ref=dict(field="speech", start=base, end=len(text)))]
        meta.append(dict(id=sid, run_id=f"run-{sid}", validation="unreviewed", offset_samples=offset, sample_count=round(n * RATE), gap_after_samples=0))
        offset += round(n * RATE)
    wav = Path(project) / "narration/narration.wav"
    wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(struct.pack(f"<{total}h", *pcm))
    tl = write(project, "narration/narration.timeline.json", dict(
        version=1, unit="sample", locale="und", validation="unreviewed", run_id="combined-test",
        audio=dict(path="narration/narration.wav", sha256=digest(wav), sample_rate=RATE, sample_count=total),
        text=dict(display=text, speech=text), segments=meta, records=sorted(records, key=lambda r: (r["kind"] != "word", r["start"]))))
    return wav, tl


def complete(project, stage, outputs):
    py(S / "project.py", "start", project, stage)
    ev = write(project, f"qa/{stage}-{digest(outputs[-1])[:8]}.json", {"passed": True})
    done = py(S / "project.py", "complete", project, stage, *sum((["--output", o] for o in outputs), []), "--evidence", ev)
    assert done.returncode == 0, done.stderr


def resolve_plan(project, timeline):
    doc = dict(schema="video-creator.creative-plan", version=1, narration=dict(timeline="narration/narration.timeline.json", sha256=digest(timeline)),
               style="paper-explainer", style_reason="generic test", guardrails=[],
               story=[dict(segment="s1", role="hook", idea="growth"), dict(segment="s2", role="resolution", idea="water")],
               motifs=[], assets=[dict(id="art", kind="original", description="test shapes")],
               shots=[dict(id="open", purpose="growth", objects=[dict(id="sun", asset="art"), dict(id="leaf", asset="art")],
                           cues=[dict(id="sun-in", object="sun", action="appear", at={"word": "Sun"}),
                                 dict(id="leaf-in", object="leaf", action="appear", at={"word": "leaf"})],
                           camera=[dict(at={"word": "Sun"}, intent="start close on the sun"), dict(at={"word": "grows."}, intent="pull back to show both")]),
                      dict(id="close", purpose="water", start={"segment": "s2"}, objects=[dict(id="drop", asset="art")],
                           cues=[dict(id="drop-in", object="drop", action="appear", at={"word": "falls"})],
                           camera=[dict(at={"word": "falls", "edge": "end"}, intent="settle")])])
    write(project, "plan/creative-plan.json", doc)
    done = py(S / "plan.py", "resolve", project)
    assert done.returncode == 0, done.stderr


def render(project, out, *extra, topic=FIX / "plan-topic.js", plan="plan/resolved-plan.json"):
    args = ["node", S / "render.mjs", "--project", project, "--topic", topic, "--timeline", "narration/narration.timeline.json", "--out", out, *extra]
    if plan:
        args += ["--plan", plan]
    done = subprocess.run(list(map(str, args)), capture_output=True, text=True, encoding="utf-8")
    return done.returncode, (done.stdout + done.stderr).strip()


def evidence(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


SEG1 = ("s1", [("Sun", .5, 1.0), ("rises,", 1.0, 1.6), ("leaf", 1.8, 2.3), ("grows.", 2.3, 2.9)], 3.2)
SEG2 = ("s2", [("Rain", .3, .8), ("falls.", .8, 1.5)], 2.0)
P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "generic preflight").stdout)["created"]["project"])
complete(P, "research", [write(P, "research/claims.json", {"claims": []})])
complete(P, "script", [write(P, "script/script.json", {"generic": True})])
wav, tl = narration(P, [SEG1, SEG2])
complete(P, "narration", [wav, tl])
resolve_plan(P, tl)
TOPIC = FIX / "preflight-topic.js"


def pre(out, options=None, *extra, topic=TOPIC, plan="plan/resolved-plan.json"):
    args = ["node", S / "preflight.mjs", "--project", P, "--topic", topic, "--timeline", "narration/narration.timeline.json", "--out", out, *extra]
    if plan:
        args += ["--plan", plan]
    if options is not None:
        args += ["--options", json.dumps(options)]
    t0 = time.perf_counter()
    done = subprocess.run(list(map(str, args)), capture_output=True, text=True, encoding="utf-8")
    res = json.loads((Path(out) / "preflight.json").read_text(encoding="utf-8")) if (Path(out) / "preflight.json").exists() else {}
    return done.returncode, res, (done.stdout + done.stderr).strip(), round(time.perf_counter() - t0, 1)


defect_opts, fixed_opts = {"zoom": 1.8}, {"zoom": 1.1}
code, out = render(P, P / "render/defect-keys", "--keys-only", "--options", json.dumps(defect_opts), topic=TOPIC)
check("keyframes alone pass for the defective fixture", code == 0, out=out[-160:])

code, r, out, secs = pre(P / "qa/pre-defect", defect_opts)
clip = [d for d in r.get("defects", []) if d["type"] == "text-clipping"]
check("preflight detects intermediate-frame label clipping during the camera push", code == 1 and r["status"] == "failed" and bool(clip)
      and clip[0]["object"] == "tag" and clip[0]["shot"] == "open" and clip[0]["firstFrame"] > 21 and clip[0]["lastFrame"] < 69
      and r["frames"]["inspected"] == 156 and "label outside the stage" in clip[0]["evidence"]["reason"],
      defect={k: clip[0][k] for k in ("object", "shot", "firstFrame", "lastFrame", "seconds", "frames")} if clip else None, wall=secs, out=out[-160:])
md_file = P / "qa/pre-defect/preflight.md"
md = md_file.read_text(encoding="utf-8") if md_file.exists() else ""
check("human-readable report lists the defect and states it is not an artistic review", "text-clipping" in md and "not an artistic review" in md)
code, out = render(P, P / "render/blocked", "--keys-only", "--options", json.dumps(defect_opts), "--preflight", "qa/pre-defect/preflight.json", topic=TOPIC)
check("renderer refuses a failed preflight", code == 1 and "[preflight-failed]" in out, out=out[-160:])

code, r, out, secs = pre(P / "qa/pre-fixed", fixed_opts)
c = r.get("checks", {})
check("corrected fixture passes every check", code == 0 and r["status"] == "passed" and r["defects"] == []
      and all(v["status"] in ("passed", "not-applicable") for v in c.values()), statuses={k: v["status"] for k, v in c.items()}, wall=secs, out=out[-200:])
check("intentional overflow, transitions and camera movement are inspected but not defects", r.get("exempt", {}).get("decorativeOffStage", 0) > 0
      and r["frames"]["transitionFrames"] > 0 and r["frames"]["cameraZoomRange"][1] > 1.05, exempt=r.get("exempt"), frames=r.get("frames"))
check("speech-cue and camera timing match the resolved plan", c.get("speech-cue-timing", {}).get("status") == "passed"
      and c.get("camera-timing", {}).get("status") == "passed" and c["camera-timing"]["moments"] == 3)
check("result is bound to topic, plan, timeline and configuration hashes", r["binding"]["topic"] == digest(TOPIC)
      and r["binding"]["plan"] == digest(P / "plan/resolved-plan.json") and r["binding"]["timeline"] == digest(P / "narration/narration.timeline.json")
      and len(r["binding"]["sha256"]) == 64)
code, out = render(P, P / "render/ok", "--keys-only", "--options", json.dumps(fixed_opts), "--preflight", "qa/pre-fixed/preflight.json", topic=TOPIC)
check("renderer accepts the current passed preflight", code == 0, out=out[-160:])
code, out = render(P, P / "render/stale", "--keys-only", "--options", json.dumps({"zoom": 1.12}), "--preflight", "qa/pre-fixed/preflight.json", topic=TOPIC)
check("renderer refuses a preflight bound to a different configuration (stale)", code == 1 and "[preflight-stale]" in out, out=out[-160:])
edited = write(work, "topics/edited.js", TOPIC.read_text(encoding="utf-8").replace("'#DAB357', under", "'#e0b860', under"))
code, out = render(P, P / "render/stale2", "--keys-only", "--options", json.dumps(fixed_opts), "--preflight", "qa/pre-fixed/preflight.json", topic=edited)
check("renderer refuses a preflight after the topic changed (stale)", code == 1 and "[preflight-stale]" in out, out=out[-160:])

for name, opts, kind, obj in [("required object leaving the stage", {"zoom": 1.1, "pushRequired": True}, "required-object-bounds", "sun"),
                              ("invalid camera transform", {"badZoom": True}, "invalid-transform", "camera")]:
    code, r, out, secs = pre(work / "pre" / kind, opts)
    hit = [d for d in r.get("defects", []) if d["type"] == kind and d["object"] == obj]
    check(f"detects {name}", code == 1 and bool(hit), first=hit[0]["firstFrame"] if hit else None,
          types=sorted({d["type"] for d in r.get("defects", [])}), out=out[-160:])

# A backend without geometry inspection: checks are reported unsupported and the result can never count as passed.
code, r, out, secs = pre(work / "pre/solid", fixed_opts, "--backend", FIX / "solid-backend.mjs")
unsupported = sorted(k for k, v in r.get("checks", {}).items() if v["status"] == "unsupported")
check("unsupported backend checks are explicit and the result is incomplete", code == 6 and r.get("status") == "incomplete" and r.get("passed") is False
      and {"safe-area", "text-clipping", "required-object-bounds", "invalid-transform", "visibility-requirement", "frame-cadence", "camera-timing"} <= set(unsupported),
      unsupported=unsupported, out=out[-160:])

# Ledger: failed or incomplete preflight evidence cannot complete the visual-production stage; a passed one can.
py(S / "project.py", "start", P, "visual-production")
outputs = ["--output", P / "render/ok/keys-evidence.json"]
bad = [py(S / "project.py", "complete", P, "visual-production", *outputs, "--evidence", ev) for ev in (P / "qa/pre-defect/preflight.json", work / "pre/solid/preflight.json")]
good = py(S / "project.py", "complete", P, "visual-production", *outputs, "--evidence", P / "qa/pre-fixed/preflight.json")
check("ledger rejects failed and incomplete preflight evidence and accepts a passed one", all(b.returncode == 1 for b in bad) and good.returncode == 0,
      err=bad[0].stderr[-120:], good=good.stderr[-120:])

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "preflight-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - results: {work / 'preflight-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
