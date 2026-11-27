"""P014.7B Paper Explainer kit tests: a compact generic fixture using every kit helper, driven by a resolved plan
(cue ids and camera moments) over synthetic toned narration. Keyframes only; needs Chromium.

python -I scripts/tests/test_paper_kit.py [--work <folder outside the package>]
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
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-paper-kit-tests"))
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
P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "generic paper kit").stdout)["created"]["project"])
complete(P, "research", [write(P, "research/claims.json", {"claims": []})])
complete(P, "script", [write(P, "script/script.json", {"generic": True})])
wav, tl = narration(P, [SEG1, SEG2])
complete(P, "narration", [wav, tl])
resolve_plan(P, tl)
KIT = FIX / "kit-topic.js"
src = KIT.read_text(encoding="utf-8")
used = sorted(set(re.findall(r"\b(?:art|kit)\.([a-zA-Z]+)\(", src)))
check("fixture uses every kit helper and writes no speech timestamps", used == sorted(["castShadow", "connector", "draw", "fibres", "label", "layered",
      "parts", "planCamera", "pulse", "ring", "settle", "sheet", "tileTexture"]) and "cue(" not in src.replace("speechCue(", ""), used=used)

code, out = render(P, P / "render/keys", "--keys-only", topic=KIT)
ev = json.loads((P / "render/keys/keys-evidence.json").read_text(encoding="utf-8")) if code == 0 else {}
names = [k["name"] for k in ev.get("keyframes", [])]
check("kit fixture renders representative keyframes with cue, layout and repeatability checks", code == 0 and names == ["kit-sun", "kit-leaf", "kit-water"]
      and len(ev["cueChecks"]) == 4 and all(c["before"] <= .01 and c["after"] >= .5 for c in ev["cueChecks"]) and ev["repeatability"]["sameLabels"],
      keys=names, cues=[(c.get("cue"), c["id"], c["at"]) for c in ev.get("cueChecks", [])], out=out[-300:])
shots = {s["id"]: s for s in ev.get("shots", [])}
check("dissolve transition built from the kit texture", shots.get("open", {}).get("transition", {}).get("type") == "dissolve")

# Camera keys land exactly on the plan's resolved camera moments (the plan carries timing; the values are the topic's).
rp = json.loads((P / "plan/resolved-plan.json").read_text(encoding="utf-8"))
moments = {s["id"]: [k["at"]["sample"] / RATE for k in s["camera"]] for s in rp["shots"]}
check("resolved plan exposes camera moments to the render-plan contract", moments == {"open": [.5, 2.3], "close": [(76800 + 36000) / RATE]}, moments=moments)

# planCamera refuses a view count that differs from the plan, and labelStyle is validated.
bad = write(work, "topics/bad-camera.js", src.replace("[[.04, .06, 1.25], [0, 0, 1, 'out']]", "[[0, 0, 1]]"))
code, out = render(P, work / "bad/camera", "--keys-only", topic=bad)
check("planCamera requires one view per planned camera moment", code == 1 and "planCamera: shot open has 2 planned camera keys" in out, out=out[-160:])
bad = write(work, "topics/bad-label.js", src.replace("labelStyle: 'chip'", "labelStyle: 'neon'"))
code, out = render(P, work / "bad/label", "--keys-only", topic=bad)
check("unknown label treatment is rejected", code == 1 and "labelStyle must be one of" in out, out=out[-160:])

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "paper-kit-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - results: {work / 'paper-kit-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
