"""P017.1 Tech Explainer style tests (system Python + Node + Chromium; no TTS).

python -I scripts/tests/test_tech_explainer.py [--work <dir outside the package>] [--preview]

A compact generic fixture (fixtures/tech-topic.js) on a synthetic silent timeline: resolved-plan cues and camera moments,
the caption artifact, portrait and landscape keyframes, visual preflight in both orientations, transitions, a short
motion preview (--preview), a contact sheet, and package immutability. Times are synthetic; they test integration only.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import wave

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--work", default=str(Path(__import__("tempfile").gettempdir()) / "vc-tech-tests"))
ap.add_argument("--preview", action="store_true", help="also render the ~6 s 540x960 motion preview")
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


# Synthetic silent narration: three segments with sample-exact word records (source forced_alignment; synthetic).
SEGS = [("s1", "Your message leaves the phone as tiny packets.", 0.1, 1.9), ("s2", "Routers pass each one along the fastest path.", 2.1, 4.0),
        ("s3", "A server puts them back together.", 4.3, 5.8)]
total = int(6.0 * RATE)
code, out, _ = py(S / "preferences.py", "resolve", "locale=en-IN", "style=tech-explainer", "--store", work / "prefs.json", "--json", work / "cfg.json")
P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "tech fixture", "--config", work / "cfg.json")[1])["created"]["project"])


def complete(stage, outputs):
    py(S / "project.py", "start", P, stage)
    ev = write(P, f"qa/{stage}.json", {"passed": True})
    c, o, e = py(S / "project.py", "complete", P, stage, *sum((["--output", x] for x in outputs), []), "--evidence", ev)
    assert c == 0, e


complete("research", [write(P, "research/claims.json", {"claims": []})])
complete("script", [write(P, "script/script.json", {"generic": True})])
wav = P / "narration/narration.wav"; wav.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(wav), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(b"\0\0" * total)
text, records, meta = "", [], []
for sid, seg, t0, t1 in SEGS:
    text += " " if text else ""
    base, toks = len(text), seg.split(" ")
    span = (t1 - t0) / len(toks)
    for i, tok in enumerate(toks):
        lo = len(text); text += tok + (" " if i + 1 < len(toks) else "")
        records.append(dict(kind="word", label=tok, start=round((t0 + i * span) * RATE), end=round((t0 + (i + .9) * span) * RATE), source="forced_alignment",
                            segment=sid, text_ref=dict(field="speech", start=lo, end=lo + len(tok))))
    records.append(dict(kind="phrase", label=seg, start=round(t0 * RATE), end=round((t0 + (len(toks) - .1) * span) * RATE), source="forced_alignment", segment=sid,
                        text_ref=dict(field="speech", start=base, end=len(text))))
    lo_s, hi_s = {"s1": (0, 2.0), "s2": (2.0, 4.2), "s3": (4.2, 6.0)}[sid]
    meta.append(dict(id=sid, run_id="synthetic", validation="unreviewed", offset_samples=round(lo_s * RATE), sample_count=round((hi_s - lo_s) * RATE), gap_after_samples=0))
tl = write(P, "narration/narration.timeline.json", dict(version=1, unit="sample", locale="en-IN", validation="unreviewed", run_id="synthetic-tech",
           timing=dict(method="forced_alignment", provider="synthetic-test"), audio=dict(path="narration/narration.wav", sha256=digest(wav), sample_rate=RATE, sample_count=total),
           text=dict(display=text, speech=text), segments=meta, records=sorted(records, key=lambda r: (r["kind"] != "word", r["start"]))))
complete("narration", [wav, tl])
O = lambda i: dict(id=i, asset="a1", description=i)
C = lambda i, o, w: dict(id=i, object=o, action="appear", at={"word": w})
plan = dict(schema="video-creator.creative-plan", version=1, narration=dict(timeline="narration/narration.timeline.json", sha256=digest(tl)),
            style="tech-explainer", style_reason="fixture", guardrails=["none"], motifs=[dict(id="m1", stands_for="packets")],
            story=[dict(segment=s, role=r, idea="x") for s, r in (("s1", "hook"), ("s2", "mechanism"), ("s3", "resolution"))],
            assets=[dict(id="a1", kind="original", description="fixture art")],
            shots=[dict(id="send", purpose="p", objects=[O("s-pkt-0"), O("s-tag")], camera=[dict(at={"word": "message"}, intent="push in")],
                        cues=[C("packets", "s-pkt-0", "leaves"), C("phone", "s-tag", "phone")]),
                   dict(id="route", purpose="p", start={"segment": "s2"}, objects=[O("r-routers"), O("r-route")],
                        cues=[C("routers", "r-routers", "Routers"), C("path", "r-route", "along")]),
                   dict(id="arrive", purpose="p", start={"segment": "s3"}, objects=[O("a-server"), O("a-msg")], camera=[dict(at={"word": "server"}, intent="settle")],
                        cues=[C("server", "a-server", "server"), C("together", "a-msg", "together")])])
write(P, "plan/creative-plan.json", plan)
c, o, e = py(S / "plan.py", "resolve", P)
check("plan resolves for the tech-explainer style", c == 0, err=e[-200:])
c, o, e = py(S / "captions.py", "build", P)
check("caption artifact builds", c == 0, err=e[-200:])
shutil.copy(SOURCE / "scripts/tests/fixtures/tech-topic.js", P / "tech-topic.js")
common = ["--project", P, "--style", "tech-explainer", "--topic", "tech-topic.js", "--timeline", "narration/narration.timeline.json",
          "--plan", "plan/resolved-plan.json", "--captions", "captions/captions.json", "--locale", "en-IN", "--fps", "30"]
orients = {"portrait": [], "landscape": ["--width", "1920", "--height", "1080"]}
keys = {}
for name, dims in orients.items():
    c, o, e = run("node", S / "render.mjs", *common, *dims, "--keys-only", "--out", f"render/keys-{name}")
    ev = json.loads((P / f"render/keys-{name}/keys-evidence.json").read_text(encoding="utf-8")) if (P / f"render/keys-{name}/keys-evidence.json").exists() else {}
    keys[name] = sorted((P / f"render/keys-{name}/keyframes").glob("*.png")) if c == 0 else []
    check(f"{name} keyframes render with all speech-cue checks", c == 0 and len(keys[name]) == 3 and "4 cue checks passed" in o, out=(o + e)[-260:])
    c, o, e = run("node", S / "preflight.mjs", *common, *dims, "--out", f"qa/preflight-{name}")
    pf = json.loads((P / f"qa/preflight-{name}/preflight.json").read_text(encoding="utf-8")) if (P / f"qa/preflight-{name}/preflight.json").exists() else {}
    unsupported = [k for k, v in (pf.get("checks") or {}).items() if isinstance(v, dict) and v.get("status") == "unsupported"]
    check(f"{name} preflight passes every frame with no unsupported checks", c == 0 and pf.get("passed") is True and not unsupported, out=(o + e)[-260:], unsupported=unsupported)
# Render-plan facts: camera moments and transitions as the engine reports them.
c, o, e = run("node", "-e", f"""
import('{(S / 'styles/tech-explainer/backend.mjs').as_uri()}').then(async ({{backend}}) => {{
  const s = await backend.open({{width: 1080, height: 1920, locale: 'en-IN'}});
  const fs = await import('node:fs');
  const tl = JSON.parse(fs.readFileSync({json.dumps(str(tl))}, 'utf8'));
  const {{loadRenderPlan}} = await import('{(S / 'lib/resolved-plan.mjs').as_uri()}');
  try {{
    const plan = await loadRenderPlan({{planFile: {json.dumps(str(P / 'plan/resolved-plan.json'))}, project: {json.dumps(str(P))}, timelineFile: {json.dumps(str(tl))}, timeline: tl}});
    const info = await s.install({{timeline: tl, topicSource: fs.readFileSync({json.dumps(str(P / 'tech-topic.js'))}, 'utf8'), plan}});
    const mid = [];
    for (const sh of info.shots) if (sh.transition) {{ const st = await s.seek(sh.transition.at - .05); mid.push(st.transition); }}
    console.log(JSON.stringify({{shots: info.shots.map(x => [x.id, x.cameraTimes.length, x.transition?.type ?? null]), mid}}));
  }} finally {{ await s.close(); }}
}});""")
try:
    facts = json.loads(o.strip().splitlines()[-1])
except Exception:
    facts = {"error": (o + e)[-300:]}
check("camera moments and tech transitions (focus, iris) are active", facts.get("shots") == [["send", 3, "focus"], ["route", 2, "iris"], ["arrive", 2, None]]
      and facts.get("mid") == ["focus", "iris"], facts=facts)
if a.preview:
    c, o, e = run("node", S / "render.mjs", *common, "--scale", "0.5", "--name", "tech-preview.mp4", "--out", "render/preview")
    ev = json.loads((P / "render/preview/tech-preview-evidence.json").read_text(encoding="utf-8")) if c == 0 else {}
    check("motion preview renders, decodes and passes media checks", c == 0 and ev.get("failures") == [], out=(o + e)[-260:])
# Contact sheet: portrait keyframes on the top row, landscape below.
sheet = work / "tech-contact.png"
if all(keys.values()):
    args = ["ffmpeg", "-v", "error", "-y"] + sum((["-i", str(k)] for k in keys["portrait"] + keys["landscape"]), [])
    fc = "".join(f"[{i}:v]scale=-1:640[p{i}];" for i in range(3)) + "".join(f"[{i + 3}:v]scale=-1:360[l{i}];" for i in range(3)) + \
        "[p0][p1][p2]hstack=3[top];[l0][l1]hstack=2[mid];[mid][l2]hstack=2[bot0];[bot0]pad=iw:ih:0:0[bot];[top]scale=1680:-1[t2];[bot]scale=1680:-1[b2];[t2][b2]vstack=2"
    c, _, e = run(*args, "-filter_complex", fc, str(sheet))
    check("contact sheet written", c == 0 and sheet.exists(), err=e[-200:])
after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "tech-test-results.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - work: {work}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
