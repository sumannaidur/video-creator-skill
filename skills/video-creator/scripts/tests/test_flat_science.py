"""P017.3 Flat Science style tests (system Python + Node + Chromium; no TTS).

python -I scripts/tests/test_flat_science.py [--work <dir outside the package>] [--preview]

A compact scientific fixture (fixtures/fs-topic.js, photosynthesis) on a synthetic silent Telugu timeline: mechanism
reveals from resolved-plan cues, camera moments, the `magnify` transition, Telugu captions and labels in portrait and
landscape, visual preflight (including the empty-caption check), an optional ~5.6 s preview, a contact sheet, and
package immutability. Times are synthetic; they test integration only, never narration quality.
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
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-fs-tests"))
ap.add_argument("--preview", action="store_true")
ap.add_argument("--presentation", choices=["framed", "full-bleed"], default=None, help="P018.6: resolve the fixture projects with this presentation preference")
a = ap.parse_args()
work = Path(a.work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
S = pkg / "scripts"
digest = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
snapshot = lambda: {p.relative_to(pkg).as_posix(): digest(p) for p in sorted(pkg.rglob("*")) if p.is_file()}
before = snapshot()
RATE, results = 24000, []


def check(name, ok, **detail):
    results.append(dict(name=name, ok=bool(ok), **detail))
    print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(detail, ensure_ascii=True)[:300])


def run(*args):
    d = subprocess.run([*map(str, args)], capture_output=True, text=True, encoding="utf-8")
    return d.returncode, d.stdout, d.stderr


def py(*args):
    return run(sys.executable, "-I", *args)


def write(root, rel, obj):
    p = Path(root) / rel; p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8"); return p


VARIANTS = {
    "te-IN": dict(segs=[("s1", "ఆకు సూర్యకాంతిని పట్టుకుంటుంది.", .1, 2.3), ("s2", "లోపల నీరు గాలితో కలిసి చక్కెర, ఆక్సిజన్ అవుతాయి.", 2.8, 5.3)],
                  words=dict(leaf="ఆకు", sun="సూర్యకాంతిని", water="నీరు", sugar="చక్కెర", oxygen="ఆక్సిజన్", cam1="సూర్యకాంతిని", cam2="కలిసి"), labels=None),
}
SEG_BOUNDS = {"s1": (0, 2.6), "s2": (2.6, 5.6)}


def project(locale, v):
    cfg = work / f"cfg-{locale}.json"
    py(S / "preferences.py", "resolve", f"locale={locale}", *([f"presentation={a.presentation}"] if a.presentation else []), "--store", work / "prefs.json", "--json", cfg)
    P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", f"fs {locale}", "--config", cfg)[1])["created"]["project"])

    def complete(stage, outputs):
        py(S / "project.py", "start", P, stage)
        ev = write(P, f"qa/{stage}.json", {"passed": True})
        c, o, e = py(S / "project.py", "complete", P, stage, *sum((["--output", x] for x in outputs), []), "--evidence", ev)
        assert c == 0, e

    complete("research", [write(P, "research/claims.json", {"claims": []})])
    complete("script", [write(P, "script/script.json", {"generic": True})])
    total = int(5.6 * RATE)
    wav = P / "narration/narration.wav"; wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(b"\0\0" * total)
    text, records, meta = "", [], []
    for sid, seg, t0, t1 in v["segs"]:
        text += " " if text else ""
        base, toks = len(text), seg.split(" ")
        span = (t1 - t0) / len(toks)
        for i, tok in enumerate(toks):
            lo = len(text); text += tok + (" " if i + 1 < len(toks) else "")
            records.append(dict(kind="word", label=tok, start=round((t0 + i * span) * RATE), end=round((t0 + (i + .9) * span) * RATE), source="forced_alignment",
                                segment=sid, text_ref=dict(field="speech", start=lo, end=lo + len(tok))))
        records.append(dict(kind="phrase", label=seg, start=round(t0 * RATE), end=round((t0 + (len(toks) - .1) * span) * RATE), source="forced_alignment", segment=sid,
                            text_ref=dict(field="speech", start=base, end=len(text))))
        lo_s, hi_s = SEG_BOUNDS[sid]
        meta.append(dict(id=sid, run_id="synthetic", validation="unreviewed", offset_samples=round(lo_s * RATE), sample_count=round((hi_s - lo_s) * RATE), gap_after_samples=0))
    tl = write(P, "narration/narration.timeline.json", dict(version=1, unit="sample", locale=locale, validation="unreviewed", run_id=f"synthetic-fs-{locale}",
               timing=dict(method="forced_alignment", provider="synthetic-test"), audio=dict(path="narration/narration.wav", sha256=digest(wav), sample_rate=RATE, sample_count=total),
               text=dict(display=text, speech=text), segments=meta, records=sorted(records, key=lambda r: (r["kind"] != "word", r["start"]))))
    complete("narration", [wav, tl])
    W = v["words"]
    O = lambda i: dict(id=i, asset="a1", description=i)
    C = lambda i, o, w: dict(id=i, object=o, action="draw", at={"word": w})
    plan = dict(schema="video-creator.creative-plan", version=1, narration=dict(timeline="narration/narration.timeline.json", sha256=digest(tl)),
                style="flat-science", style_reason="fixture", guardrails=["symbolic molecules, not to scale"], motifs=[dict(id="m1", stands_for="colour-coded substances")],
                story=[dict(segment="s1", role="hook", idea="x"), dict(segment="s2", role="mechanism", idea="y")],
                assets=[dict(id="a1", kind="original", description="fixture art")],
                shots=[dict(id="leaf", purpose="p", objects=[O("l-leaf"), O("l-sun")], camera=[dict(at={"word": W["cam1"]}, intent="push in")],
                            cues=[C("leaf", "l-leaf", W["leaf"]), C("sun", "l-sun", W["sun"])]),
                       dict(id="cell", purpose="p", start={"segment": "s2"}, objects=[O("c-water"), O("c-sugar"), O("c-o2")], camera=[dict(at={"word": W["cam2"]}, intent="ease out")],
                            cues=[C("water", "c-water", W["water"]), C("sugar", "c-sugar", W["sugar"]), C("oxygen", "c-o2", W["oxygen"])])])
    write(P, "plan/creative-plan.json", plan)
    c, o, e = py(S / "plan.py", "resolve", P)
    check(f"{locale}: plan resolves for the flat-science style", c == 0, err=e[-200:])
    c, o, e = py(S / "captions.py", "build", P, *(["--mode", "words", "--max-words", "4", "--max-chars", "28"] if a.presentation == "full-bleed" else []))
    caps = json.loads((P / "captions/captions.json").read_text(encoding="utf-8")) if c == 0 else {}
    check(f"{locale}: caption artifact builds with the original text", c == 0 and " ".join(x["text"] for x in caps.get("cues", [])).split() == text.split(), err=e[-200:])
    shutil.copy(SOURCE / "scripts/tests/fixtures/fs-topic.js", P / "fs-topic.js")
    return P


keys = {}
for locale, v in VARIANTS.items():
    P = project(locale, v)
    common = ["--project", P, "--style", "flat-science", "--topic", "fs-topic.js", "--timeline", "narration/narration.timeline.json",
              "--plan", "plan/resolved-plan.json", "--captions", "captions/captions.json", "--locale", locale, "--fps", "30"] + \
             (["--options", json.dumps({"labels": v["labels"]}, ensure_ascii=False)] if v["labels"] else [])
    for orient, dims in ({"portrait": [], "landscape": ["--width", "1920", "--height", "1080"]} if locale in ("en-IN", "te-IN") else {"portrait": []}).items():
        tag = f"{locale}-{orient}"
        c, o, e = run("node", S / "render.mjs", *common, *dims, "--keys-only", "--out", f"render/keys-{orient}")
        keys[tag] = sorted((P / f"render/keys-{orient}/keyframes").glob("*.png"), key=lambda p: int(p.name.split("-")[1])) if c == 0 else []
        check(f"{tag}: keyframes render with speech-cue checks", c == 0 and len(keys[tag]) == 4 and "5 cue checks passed" in o, out=(o + e)[-240:])
        c, o, e = run("node", S / "preflight.mjs", *common, *dims, "--out", f"qa/preflight-{orient}")
        pf = json.loads((P / f"qa/preflight-{orient}/preflight.json").read_text(encoding="utf-8")) if (P / f"qa/preflight-{orient}/preflight.json").exists() else {}
        unsupported = [k for k, x in (pf.get("checks") or {}).items() if isinstance(x, dict) and x.get("status") == "unsupported"]
        check(f"{tag}: preflight passes every frame (caption layout and empty-caption checks included)", c == 0 and pf.get("passed") is True and not unsupported, out=(o + e)[-240:])
    if locale == "te-IN":
        enP, enCommon = P, common
# The erase transition is active around the cut, and camera moments are present.
c, o, e = run("node", "-e", f"""
import('{(S / 'styles/flat-science/backend.mjs').as_uri()}').then(async ({{backend}}) => {{
  const fs = await import('node:fs');
  const {{loadRenderPlan}} = await import('{(S / 'lib/resolved-plan.mjs').as_uri()}');
  const tlf = {json.dumps(str(enP / 'narration/narration.timeline.json'))}, tl = JSON.parse(fs.readFileSync(tlf, 'utf8'));
  const plan = await loadRenderPlan({{planFile: {json.dumps(str(enP / 'plan/resolved-plan.json'))}, project: {json.dumps(str(enP))}, timelineFile: tlf, timeline: tl}});
  const s = await backend.open({{width: 1080, height: 1920, locale: 'te-IN'}});
  try {{
    const info = await s.install({{timeline: tl, topicSource: fs.readFileSync({json.dumps(str(enP / 'fs-topic.js'))}, 'utf8'), plan}});
    const at = info.shots[0].transition.at, mid = [(await s.seek(at - .1)).transition, (await s.seek(at + .1)).transition, (await s.seek(at + .5)).transition];
    console.log(JSON.stringify({{shots: info.shots.map(x => [x.id, x.cameraTimes.length, x.transition?.type ?? null]), mid}}));
  }} finally {{ await s.close(); }}
}});""")
try:
    facts = json.loads(o.strip().splitlines()[-1])
except Exception:
    facts = {"error": (o + e)[-300:]}
check("magnify transition active around the cut; camera moments present", facts.get("shots") == [["leaf", 2, "magnify"], ["cell", 2, None]] and facts.get("mid") == ["magnify", "magnify", None], facts=facts)
if a.preview:
    c, o, e = run("node", S / "render.mjs", *enCommon, "--scale", "0.5", "--name", "fs-preview.mp4", "--out", "render/preview")
    ev = json.loads((enP / "render/preview/fs-preview-evidence.json").read_text(encoding="utf-8")) if c == 0 else {}
    check("motion preview renders, decodes and passes media checks", c == 0 and ev.get("failures") == [], out=(o + e)[-240:])
sheet = work / "fs-contact.png"
if all(keys.values()):
    rows, inputs = [], []
    for r, tag in enumerate(keys):
        h = 360 if "landscape" in tag else 640
        start = len(inputs); inputs += keys[tag]
        rows.append("".join(f"[{start + i}:v]scale=-1:{h}[{tag[:2]}{r}{i}];" for i in range(4)) + "".join(f"[{tag[:2]}{r}{i}]" for i in range(4)) + f"hstack=4,scale=1600:-1[row{r}];")
    fc = "".join(rows) + "".join(f"[row{r}]" for r in range(len(keys))) + f"vstack={len(keys)}"
    c, _, e = run("ffmpeg", "-v", "error", "-y", *sum((["-i", str(k)] for k in inputs), []), "-filter_complex", fc, str(sheet))
    check("contact sheet written", c == 0 and sheet.exists(), err=e[-200:])
after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "fs-test-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - work: {work}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
