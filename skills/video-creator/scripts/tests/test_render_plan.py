"""P014.7A focused tests: rendering from a verified resolved creative plan (synthetic toned narration, no TTS; needs Chromium and FFmpeg).

python -I scripts/tests/test_render_plan.py [--work <folder outside the package>]
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
import wave

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-render-plan-tests"))
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
                                 dict(id="leaf-in", object="leaf", action="appear", at={"word": "leaf"})]),
                      dict(id="close", purpose="water", start={"segment": "s2"}, objects=[dict(id="drop", asset="art")],
                           cues=[dict(id="drop-in", object="drop", action="appear", at={"word": "falls"})])])
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
P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "generic render plan").stdout)["created"]["project"])
complete(P, "research", [write(P, "research/claims.json", {"claims": []})])
complete(P, "script", [write(P, "script/script.json", {"generic": True})])
wav, tl = narration(P, [SEG1, SEG2])
complete(P, "narration", [wav, tl])
resolve_plan(P, tl)

topic_src = (FIX / "plan-topic.js").read_text(encoding="utf-8")
check("fixture topic contains no speech-cue timestamps", len(re.findall(r"speechCue\('[a-z-]+'\)", topic_src)) == 3
      and not re.search(r"\bcue\(|phrases\s*:|start\s*:", topic_src.split("build(ctx)")[0].split("shots:")[1].split("symbols")[0]))

# Keyframes: shot bounds and cue times come from the plan, sample-exact.
code, out = render(P, P / "render/keys", "--keys-only")
ev = evidence(P / "render/keys/keys-evidence.json") if code == 0 else {}
cue_at = {c.get("cue"): c["at"] for c in ev.get("cueChecks", [])}
shots = {s["id"]: (s["start"], s["end"]) for s in ev.get("shots", [])}
check("keyframes render from the resolved plan with sample-exact cue times and shot bounds", code == 0
      and cue_at == {"sun-in": 12000 / RATE, "leaf-in": 43200 / RATE, "drop-in": (76800 + 19200) / RATE}
      and shots == {"open": (0, 76800 / RATE), "close": (76800 / RATE, 124800 / RATE)}
      and ev["plan"]["sha256"] == digest(P / "plan/resolved-plan.json") and all(c["before"] <= .01 and c["after"] >= .5 for c in ev["cueChecks"]),
      cues=cue_at, shots=shots, out=out[-200:])

# Low-resolution full render (no Full HD); then an identical rerun reuses the checkpoint.
full = ["--scale", "0.25", "--fps", "10", "--name", "plan.mp4"]
code, out = render(P, P / "render/full", *full)
ev1 = evidence(P / "render/full/plan-evidence.json") if code == 0 else {}
check("low-resolution render from the plan passes media, sync and coverage checks", code == 0 and ev1.get("failures") == []
      and ev1["frames"] == 52 and ev1["inputs"]["plan"]["sha256"] == digest(P / "plan/resolved-plan.json"), out=out[-200:])
code, out = render(P, P / "render/full", *full)
ev2 = evidence(P / "render/full/plan-evidence.json") if code == 0 else {}
check("an unchanged plan reuses every checkpoint frame", code == 0 and ev2["checkpoint"]["reused"] == 52 and ev2["checkpoint"]["rendered"] == 0)

# Topic and backend errors are explicit.
def variant(name, old, new):
    path = write(work, f"topics/{name}.js", topic_src.replace(old, new, 1))
    assert path.read_text(encoding="utf-8") != topic_src
    return path

cases = [("missing cue", variant("missing", "show('drop', speechCue('drop-in')", "show('drop', 0.1"), "[missing-cue]"),
         ("unknown cue reference", variant("unknown", "speechCue('drop-in')", "speechCue('drop-out')"), "[unknown-cue]"),
         ("topic shot with its own start", variant("own-start", "{id: 'close', scene: 'pond'}", "{id: 'close', scene: 'pond', start: 2}"), "[conflicting-shot-boundaries]"),
         ("topic shots differing from the plan", variant("other-shots", "{id: 'close', scene: 'pond'}", "{id: 'end', scene: 'pond'}"), "[conflicting-shot-boundaries]")]
for name, topic, expected in cases:
    code, out = render(P, work / "bad" / name.replace(" ", "-"), "--keys-only", topic=topic)
    check(f"rejects {name}", code == 1 and expected in out, out=out[-160:])
shutil.copy(P / "plan/resolved-plan.json", P / "plan/unverified.json")
code, out = render(P, work / "bad/unverified", "--keys-only", plan="plan/unverified.json")
check("rejects a resolved plan that is not a ledger output", code == 1 and "[plan-not-verified]" in out, out=out[-160:])
nobackend = write(work, "backends/no-plan-backend.mjs", (FIX / "solid-backend.mjs").read_text(encoding="utf-8").replace("  plans: ['video-creator.render-plan/1'],\n", ""))
code, out = render(P, work / "bad/no-plan-backend", "--keys-only", "--backend", nobackend)
check("rejects a backend that does not declare the plan contract", code == 1 and "[plan-unsupported]" in out, out=out[-160:])
code, out = render(P, work / "solid", "--keys-only", "--backend", FIX / "solid-backend.mjs")
evs = evidence(work / "solid/keys-evidence.json") if code == 0 else {}
check("a different backend consumes the same resolved plan", code == 0 and [s["id"] for s in evs.get("shots", [])] == ["open", "close"], out=out[-160:])

# Narration timing changes: the old plan is refused; after re-resolving, the cue moves with the word, others stay.
SEG1b = ("s1", [("Sun", .5, 1.0), ("rises,", 1.0, 1.6), ("leaf", 2.0, 2.5), ("grows.", 2.5, 2.9)], 3.2)
wav, tl = narration(P, [SEG1b, SEG2])
code, out = render(P, P / "render/keys", "--keys-only")
check("rejects a stale plan when the narration timing changed", code == 1 and "[stale-plan]" in out, out=out[-160:])
py(S / "project.py", "verify", P)
code, out = render(P, P / "render/keys", "--keys-only")
check("rejects the plan once the ledger invalidated it", code == 1 and "[plan-not-verified]" in out, out=out[-160:])
complete(P, "narration", [wav, tl])
resolve_plan(P, tl)
code, out = render(P, P / "render/keys", "--keys-only")
ev = evidence(P / "render/keys/keys-evidence.json") if code == 0 else {}
moved = {c.get("cue"): c["at"] for c in ev.get("cueChecks", [])}
check("changed word timing moves its animation cue automatically", code == 0 and moved.get("leaf-in") == 48000 / RATE
      and moved.get("sun-in") == cue_at["sun-in"] and moved.get("drop-in") == cue_at["drop-in"], moved=moved, out=out[-160:])
code, out = render(P, P / "render/full", *full)
ev3 = evidence(P / "render/full/plan-evidence.json") if code == 0 else {}
check("a re-resolved plan invalidates the frame checkpoint", code == 0 and ev3["checkpoint"]["invalidated"] == 52
      and ev3["checkpoint"]["reused"] == 0 and ev3["checkpoint"]["configHash"] != ev2["checkpoint"]["configHash"] and ev3["failures"] == [], out=out[-160:])

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "render-plan-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - results: {work / 'render-plan-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
