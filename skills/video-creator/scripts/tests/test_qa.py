"""P014.9 unified QA report tests on a short generated integration project (synthetic toned narration, plan, captions,
preflight, 540x960 render, narration-only mix). Needs Chromium and FFmpeg.

python -I scripts/tests/test_qa.py [--work <folder outside the package>]
"""
import argparse
import hashlib
import json
import math
import os
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
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-qa-tests"))
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
TOPIC = FIX / "plan-topic.js"
cfg = work / "cfg.json"
py(S / "preferences.py", "resolve", "locale=en-IN", "resolution=540", "fps=24", "--store", work / "prefs.json", "--json", cfg)
P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "generic qa", "--config", cfg).stdout)["created"]["project"])
complete(P, "research", [write(P, "research/claims.json", {"claims": [{"id": "c1", "claim": "generic", "status": "verified", "sources": ["S1"]}]}),
                         write(P, "research/sources.json", {"sources": [{"id": "S1", "title": "generic test source"}]})])
complete(P, "script", [write(P, "script/script.json", {"generic": True})])
wav, tl = narration(P, [SEG1, SEG2])
complete(P, "narration", [wav, tl])
resolve_plan(P, tl)
assert py(S / "captions.py", "build", P).returncode == 0


def node(script, *args):
    done = subprocess.run(["node", str(S / script), "--project", str(P), "--topic", str(TOPIC), "--timeline", "narration/narration.timeline.json",
                           "--plan", "plan/resolved-plan.json", "--captions", "captions/captions.json", "--fps", "24", *map(str, args)],
                          capture_output=True, text=True, encoding="utf-8")
    assert done.returncode == 0, done.stdout + done.stderr
    return done


node("preflight.mjs", "--out", P / "qa/preflight")
node("render.mjs", "--out", P / "render/final", "--scale", "0.5", "--name", "video.mp4", "--preflight", "qa/preflight/preflight.json")
VP = ["render/final/video.mp4", "render/final/video-evidence.json", "captions/captions.json", "captions/captions.srt", "captions/captions.vtt", "qa/preflight/preflight.json"]
py(S / "project.py", "start", P, "visual-production")
done = py(S / "project.py", "complete", P, "visual-production", *sum((["--output", P / f] for f in VP), []), "--evidence", P / "qa/preflight/preflight.json")
assert done.returncode == 0, done.stderr
ARGS = ["--video", "audio/final.mp4", "--render-evidence", "render/final/video-evidence.json", "--preflight", "qa/preflight/preflight.json",
        "--mix-evidence", "audio/mix.evidence.json"]


def qa(*extra, env=None):
    done = subprocess.run([sys.executable, "-I", str(S / "qa.py"), "report", str(P), *ARGS, *map(str, extra)], capture_output=True, text=True, encoding="utf-8", env=env)
    out_dir = next((extra[i + 1] for i, x in enumerate(extra) if x == "--out-dir"), "qa")
    rep = json.loads((P / out_dir / "qa-report.json").read_text(encoding="utf-8")) if (P / out_dir / "qa-report.json").exists() else {}
    return done.returncode, rep, (done.stdout + done.stderr).strip()


# Missing: sound has not run yet.
code, rep, out = qa("--out-dir", "qa/missing")
st = {k: v["status"] for k, v in rep.get("technical", {}).get("checks", {}).items()}
check("missing stage and evidence block technical completion", code == 1 and st.get("stage:sound") == "missing" and st.get("artifact:mix-evidence") == "missing"
      and st.get("audio-mix") == "missing" and rep["technical"]["status"] == "failed", blocking=rep.get("technical", {}).get("blocking"), out=out[-200:])

# Sound: narration-only mix muxed onto the rendered video (existing mixer).
write(P, "audio/mix-spec.json", {"narration": "../narration/narration.wav", "loudness": {"integrated_lufs": -16, "true_peak_db": -1.5}, "output": "mix.wav",
                                 "video": {"input": "../render/final/video.mp4", "output": "final.mp4"}})
done = py(S / "audio" / "mix_audio.py", P / "audio/mix-spec.json")
assert done.returncode == 0, done.stdout[-400:] + done.stderr[-400:]
py(S / "project.py", "start", P, "sound")
done = py(S / "project.py", "complete", P, "sound", "--output", P / "audio/mix.wav", "--output", P / "audio/final.mp4", "--evidence", P / "audio/mix.evidence.json")
assert done.returncode == 0, done.stderr

# Passed: all technical checks, ledger review-delivery completed; nothing approved.
code, rep, out = qa("--complete")
tech = rep.get("technical", {})
check("all technical checks pass against the current project and configuration", code == 0 and tech.get("status") == "passed" and not tech.get("blocking"),
      statuses={k: v["status"] for k, v in tech.get("checks", {}).items()}, out=out[-300:])
fv = tech.get("checks", {}).get("final-video", {}).get("detail", {})
check("final MP4 matches the configured 540x960 at 24 fps with all rendered frames", fv.get("size") == "540x960" and fv.get("fps") == "24/1" and fv.get("frames") == "125", detail=fv)
ledger = json.loads((P / "project.json").read_text(encoding="utf-8"))
check("ledger review-delivery stage completed from the QA report", ledger["stages"]["review-delivery"]["state"] == "completed"
      and ledger["stages"]["review-delivery"]["validation"]["evidence"] == "qa/qa-report.json")
check("technical success grants no human or publication approval", rep["human_review"]["status"] == "pending" and rep["publication"]["ready"] is False
      and len(rep["human_review"]["checklist"]) == 12 and all(i["status"] == "pending" for i in rep["human_review"]["checklist"])
      and ledger["approvals"]["human_review"]["status"] == "pending")
items = (P / "qa/human-review-checklist.md").read_text(encoding="utf-8")
check("checklist covers facts, story, composition, illustration, motion, pronunciation, accent, naturalness, captions, audio and licensing",
      all(k in items for k in ("factual-accuracy", "storytelling", "visual-composition", "illustration-quality", "motion", "pronunciation", "accent",
                               "narration-naturalness", "caption-readability", "audio-balance", "licensing")))
prov = rep["provenance"]
check("provenance recorded where available and explicitly missing otherwise", prov["voice"] == "MISSING" and prov["model"].startswith("MISSING")
      and prov["timing_method"] == "MISSING" and prov["timing_status"] == "unreviewed" and prov["fonts"]["caption"] != "MISSING" and "narration-only" in prov["audio_assets"], provenance=prov)
d = rep["deliverables"]
check("deliverables name the final video, subtitles, sources and supporting artifacts", d["video"] == "audio/final.mp4"
      and d["subtitles"] == ["captions/captions.srt", "captions/captions.vtt"] and "research/sources.json" in d["sources"] and "qa/preflight/preflight.json" in d["supporting"])
report_md = (P / "qa/delivery-report.md").read_text(encoding="utf-8")
check("readable delivery report states technical pass and open human gates", "technical PASSED" in report_md and "Human review: **pending**" in report_md)

# Failed: a video that is a project artifact but not the mixed delivery file.
code, rep, out = qa("--out-dir", "qa/failed", "--video", "render/final/video.mp4")
fv = rep.get("technical", {}).get("checks", {}).get("final-video", {})
check("a wrong final video fails its checks", code == 1 and fv.get("status") == "failed" and any("mix evidence" in p for p in fv.get("detail", [])), detail=fv.get("detail"))
code, rep, out = qa("--out-dir", "qa/foreign", "--preflight", "qa/missing/qa-report.json")
check("evidence that is not a recorded artifact of the stage is rejected", code == 1 and rep["technical"]["checks"]["artifact:preflight"]["status"] == "failed")

# Unsupported: without FFmpeg the media checks cannot run; they are reported unsupported, never passed.
env = dict(os.environ, PATH=os.environ.get("SystemRoot", r"C:\Windows") + r"\System32")
code, rep, out = qa("--out-dir", "qa/unsupported", env=env)
st = {k: v["status"] for k, v in rep.get("technical", {}).get("checks", {}).items()}
check("unavailable media tools make checks unsupported and block technical completion", code == 1 and st.get("final-video") == "unsupported"
      and st.get("narration-sync") == "unsupported" and rep["technical"]["status"] == "failed", statuses=st, out=out[-200:])

# Approvals are explicit and staged.
py(S / "project.py", "approve", P, "human-review", "--by", "test reviewer")
code, rep, out = qa("--out-dir", "qa/after-review")
check("an approved human review still does not make the video publication-ready", rep["human_review"]["status"] == "approved" and rep["publication"]["ready"] is False)
py(S / "project.py", "approve", P, "publication", "--by", "test owner")
code, rep, out = qa("--out-dir", "qa/after-publication")
check("publication readiness needs technical pass plus both explicit approvals", rep["publication"]["ready"] is True)

# Stale: a delivered subtitle file changes -> ledger invalidates visual production, QA blocks, approvals revoked.
(P / "captions/captions.srt").write_text((P / "captions/captions.srt").read_text(encoding="utf-8") + "\n", encoding="utf-8")
code, rep, out = qa("--out-dir", "qa/stale")
st = {k: v["status"] for k, v in rep.get("technical", {}).get("checks", {}).items()}
check("changed artifacts make stages and captions stale and revoke approvals", code == 1 and st.get("stage:visual-production") == "stale"
      and st.get("captions") == "stale" and rep["human_review"]["status"] != "approved" and rep["publication"]["ready"] is False, statuses=st)

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "qa-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - results: {work / 'qa-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
