"""P014.6 focused creative-plan / cue-resolver tests with synthetic, provider-neutral timelines (no TTS needed).

python -I scripts/tests/test_plan.py [--work <folder outside the package>]
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import wave

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-plan-tests"))
work = Path(ap.parse_args().work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
S = pkg / "scripts"
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


def synthetic_timeline(project, locale, segments, name="narration"):
    """segments: [(id, [(word, start, end) | (word, None, None)], length_samples)] → silent WAV + combined-style timeline."""
    total = sum(n for _, _, n in segments)
    wav = Path(project) / f"narration/{name}.wav"
    wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(b"\0\0" * total)
    text, records, meta, offset = "", [], [], 0
    for sid, words, n in segments:
        if text:
            text += " "
        base = len(text)
        seg_words = []
        for wd, st, en in words:
            lo = len(text); text += wd + " "
            seg_words.append(dict(kind="word", label=wd, start=None if st is None else st + offset, end=None if en is None else en + offset,
                                  source=None if st is None else "forced_alignment", segment=sid, text_ref=dict(field="speech", start=lo, end=lo + len(wd))))
        text = text.rstrip()
        mapped = [w for w in seg_words if w["start"] is not None]
        records += seg_words
        records.append(dict(kind="phrase", label=text[base:], start=mapped[0]["start"], end=mapped[-1]["end"], source="forced_alignment", segment=sid,
                            text_ref=dict(field="speech", start=base, end=len(text))))
        meta.append(dict(id=sid, run_id=f"run-{sid}", validation="unreviewed", offset_samples=offset, sample_count=n, gap_after_samples=0))
        offset += n
    timeline = dict(version=1, unit="sample", locale=locale, validation="unreviewed", run_id="combined-test",
                    audio=dict(path=wav.relative_to(project).as_posix(), sha256=digest(wav), sample_rate=RATE, sample_count=total),
                    text=dict(display=text, speech=text), segments=meta,
                    records=sorted(records, key=lambda r: (r["kind"] != "word", r["start"] if r["start"] is not None else -1)))
    path = write(project, f"narration/{name}.timeline.json", timeline)
    return wav, path


def config(name, locale):
    out = work / f"{name}.json"
    py(S / "preferences.py", "resolve", f"locale={locale}", "--store", work / "prefs.json", "--json", out)
    return out


def complete(project, stage, outputs):
    py(S / "project.py", "start", project, stage)
    ev = write(project, f"qa/{stage}-{len(outputs)}-{digest(outputs[0])[:6]}.json", {"passed": True})
    done = py(S / "project.py", "complete", project, stage, *sum((["--output", o] for o in outputs), []), "--evidence", ev)
    assert done.returncode == 0, done.stderr


def new_project(locale, segments):
    P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "generic", "--config", config(locale, locale)).stdout)["created"]["project"])
    complete(P, "research", [write(P, "research/claims.json", {"claims": []})])
    complete(P, "script", [write(P, "script/script.json", {"generic": True})])
    wav, tl = synthetic_timeline(P, locale, segments)
    complete(P, "narration", [wav, tl])
    return P, tl


def plan(tl, shots, **extra):
    return dict(schema="video-creator.creative-plan", version=1, narration=dict(timeline="narration/narration.timeline.json", sha256=digest(tl)),
                style="paper-explainer", style_reason="agent's documented reason", guardrails=["must not imply a guarantee"],
                story=[dict(segment="s1", role="hook", idea="first idea"), dict(segment="s2", role="resolution", idea="pay-off")],
                motifs=[dict(id="m1", stands_for="the repeated word")], assets=[dict(id="a1", kind="original", description="original drawing")],
                shots=shots) | extra


def run_plan(P, doc, command="validate"):
    write(P, "plan/creative-plan.json", doc)
    done = py(S / "plan.py", command, P)
    try:
        out = json.loads(done.stdout) if done.stdout.strip() else {}
    except ValueError:
        out = {}
    return done.returncode, out, done.stderr.strip()


# Kannada fixture: the word ಮರ is repeated (once per segment); ಸದಾ has no measured timing.
KN = [("s1", [("ಮರ", 2400, 12000), ("ನೆರಳು", 12000, 24000), ("ಕೊಡುತ್ತದೆ।", 24000, 34800)], 36000),
      ("s2", [("ಮರ", 2400, 12000), ("ಸದಾ", None, None), ("ತಂಪು", 12000, 24000), ("ನೀಡುತ್ತದೆ।", 24000, 34800)], 36000)]
P, tl = new_project("kn-IN", KN)
obj = [dict(id="o1", asset="a1", motif="m1", description="tree")]

# Different shot counts.
code, out, err = run_plan(P, plan(tl, [dict(id="only", purpose="whole idea", objects=obj, cues=[dict(object="o1", action="appear", at={"word": "ನೆರಳು"})])]))
check("one-shot plan resolves", code == 0 and out.get("shots") == 1 and out.get("cues") == 1, err=err[-150:])
three = [dict(id="a", purpose="hook", objects=obj, cues=[dict(object="o1", action="appear", at={"word": "ಮರ", "segment": "s1"})]),
         dict(id="b", purpose="turn", start={"word": "ಕೊಡುತ್ತದೆ"}, objects=obj, cues=[dict(object="o1", action="emphasis", at={"shot": "b", "offset_ms": 300})]),
         dict(id="c", purpose="pay-off", start={"segment": "s2"}, objects=obj, camera=[dict(at={"phrase_index": 0, "segment": "s2", "edge": "end", "offset_ms": -100}, intent="settle")],
              cues=[dict(object="o1", action="reveal", at={"word": "ಮರ", "occurrence": 2}), dict(object="o1", action="glow", at={"word": "ತಂಪು", "edge": "end"})])]
code, out, err = run_plan(P, plan(tl, three))
check("three-shot plan resolves with word, segment, phrase, shot-relative and offset anchors", code == 0 and out.get("shots") == 3 and out.get("cues") == 4, err=err[-150:])

# Ledger integration and exact resolution values.
code, ev, err = run_plan(P, plan(tl, three), "resolve")
res = json.loads((P / "plan/resolved-plan.json").read_text(encoding="utf-8")) if code == 0 else {}
st = json.loads((P / "project.json").read_text(encoding="utf-8"))["stages"]["creative-plan"]
shots = {s["id"]: s for s in res.get("shots", [])}
ok = code == 0 and st["state"] == "completed" and len(st["outputs"]) == 2 and \
    shots["a"]["cues"][0]["at"]["sample"] == 2400 and shots["b"]["start"]["sample"] == 24000 and \
    shots["b"]["cues"][0]["at"]["sample"] == 24000 + 7200 and shots["c"]["start"]["sample"] == 36000 and \
    shots["c"]["cues"][0]["at"]["sample"] == 36000 + 2400 and shots["c"]["cues"][1]["at"]["sample"] == 36000 + 24000 and \
    shots["c"]["camera"][0]["at"]["sample"] == 36000 + 34800 - 2400 and shots["c"]["end"]["sample"] == 72000
check("resolve completes the ledger stage with exact sample times", ok, stage=st["state"], err=err[-150:])
check("resolved plan keeps timeline hash, timing sources and unreviewed status", res.get("resolution", {}).get("timeline_sha256") == digest(tl)
      and res["resolution"]["timing_status"] == "unreviewed" and res["resolution"]["record_sources"] == ["forced_alignment"]
      and shots["c"]["cues"][0]["at"]["timing_source"] == "forced_alignment")

# Missing, ambiguous, unmapped and out-of-range references; ordering and bounds; provenance; styles.
def single(cue_at, **shot_extra):
    return plan(tl, [dict(id="x", purpose="p", objects=obj, cues=[dict(object="o1", action="a", at=cue_at)], **shot_extra)])

cases = [("ambiguous repeated word", single({"word": "ಮರ"}), "ambiguous-reference"),
         ("missing word", single({"word": "ಹೂವು"}), "missing-reference"),
         ("occurrence beyond matches", single({"word": "ಮರ", "occurrence": 3}), "missing-reference"),
         ("unmapped word (no invented time)", single({"word": "ಸದಾ"}), "unmapped-reference"),
         ("offset out of range", single({"word": "ನೀಡುತ್ತದೆ", "edge": "end", "offset_ms": 900}), "out-of-range"),
         ("unknown segment", single({"word": "ಮರ", "segment": "s9"}), "unknown-segment"),
         ("cue outside its shot", plan(tl, [dict(id="x", purpose="p", objects=obj), dict(id="y", purpose="q", start={"segment": "s2"}, objects=obj,
                                                                                         cues=[dict(object="o1", action="a", at={"word": "ಮರ", "segment": "s1"})])]), "cue-outside-shot"),
         ("cues out of time order", single({"word": "ತಂಪು"}) | {"shots": [dict(id="x", purpose="p", objects=obj, cues=[dict(object="o1", action="a", at={"word": "ತಂಪು"}),
                                                                                                                   dict(object="o1", action="b", at={"word": "ನೆರಳು"})])]}, "cue-order"),
         ("shot starting before the previous one", plan(tl, [dict(id="x", purpose="p"), dict(id="y", purpose="q", start={"segment": "s2"}),
                                                             dict(id="z", purpose="r", start={"word": "ನೆರಳು"})]), "cue-order"),
         ("cue on an object outside the shot", single({"word": "ತಂಪು"}) | {"shots": [dict(id="x", purpose="p", objects=obj, cues=[dict(object="ghost", action="a", at={"word": "ತಂಪು"})])]}, "missing-reference"),
         ("licensed asset without licence", plan(tl, [dict(id="x", purpose="p")], assets=[dict(id="a1", kind="licensed", description="photo", source="somewhere")]), "asset-provenance"),
         ("unregistered style", plan(tl, [dict(id="x", purpose="p")]) | {"style": "watercolour"}, "unknown-style"),
         ("extension for an unregistered style", plan(tl, [dict(id="x", purpose="p")], extensions={"oil-paint": {}}), "unknown-style")]
for name, doc, code_expected in cases:
    code, out, err = run_plan(P, doc)
    check(f"rejects {name}", code == 1 and f"[{code_expected}]" in err, err=err[-110:])
code, out, err = run_plan(P, plan(tl, [dict(id="x", purpose="p")], extensions={"paper-explainer": {"plates": ["sky", "ground"], "grain": True},
                                                                               "3d-explainer": {"note": "considered, not chosen"}}))
check("style-specific extensions pass through the common contract unchanged", code == 0, err=err[-120:])

# Stale narration: a plan written against another narration, and narration changing after the plan completed.
stale = plan(tl, three) | {"narration": dict(timeline="narration/narration.timeline.json", sha256="0" * 64)}
code, out, err = run_plan(P, stale)
check("plan bound to a different narration hash is rejected", code == 1 and "[stale-narration]" in err)
py(S / "project.py", "verify", P)
wav2, tl2 = synthetic_timeline(P, "kn-IN", [KN[0], ("s2", KN[1][1], 40000)], name="narration-v2")
tl.write_text(tl2.read_text(encoding="utf-8").replace("narration-v2.wav", "narration.wav"), encoding="utf-8")
shutil.copy(wav2, P / "narration/narration.wav")
out = json.loads(py(S / "project.py", "verify", P).stdout)
code, o2, err = run_plan(P, plan(tl, three))
check("changed narration invalidates the completed plan stage and blocks the old plan", out["stages"]["narration"] == "invalidated"
      and out["stages"]["creative-plan"] == "invalidated" and code == 1 and ("[narration-not-verified]" in err or "[stale-narration]" in err), err=err[-120:])

# A failed resolve is recorded in the ledger with evidence.
Q, tlq = new_project("kn-IN", KN)
code, out, err = run_plan(Q, single({"word": "ಮರ"}) | {"narration": dict(timeline="narration/narration.timeline.json", sha256=digest(tlq))}, "resolve")
sq = json.loads((Q / "project.json").read_text(encoding="utf-8"))["stages"]["creative-plan"]
check("a failing resolve fails the ledger stage with its reason and evidence", code == 1 and sq["state"] == "failed"
      and "ambiguous-reference" in sq["failure"]["reason"] and sq["failure"]["evidence"] == "plan/plan-evidence.json")

# Locale independence: the same contract and resolver on an English timeline.
EN = [("s1", [("Trees", 0, 9600), ("give", 9600, 14400), ("shade.", 14400, 26400)], 30000),
      ("s2", [("Trees", 2400, 12000), ("cool", 12000, 20000), ("air.", 20000, 28000)], 30000)]
E, tle = new_project("en-IN", EN)
code, out, err = run_plan(E, plan(tle, [dict(id="a", purpose="p", objects=obj, cues=[dict(object="o1", action="a", at={"word": "shade"})]),
                                       dict(id="b", purpose="q", start={"segment": "s2"}, objects=obj, cues=[dict(object="o1", action="b", at={"word": "Trees", "occurrence": 2})])]), "resolve")
r = json.loads((E / "plan/resolved-plan.json").read_text(encoding="utf-8")) if code == 0 else {}
check("English timeline resolves with the same contract (punctuation-insensitive word match)", code == 0
      and r["shots"][0]["cues"][0]["at"]["sample"] == 14400 and r["shots"][1]["cues"][0]["at"]["sample"] == 32400, err=err[-120:])

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "plan-test-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - results: {work / 'plan-test-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
