"""P017.7 Documentary style tests (system Python + Node + Chromium; no TTS).

python -I scripts/tests/test_documentary.py [--work <dir outside the package>] [--preview]

A compact Documentary fixture (fixtures/dc-topic.js) on a synthetic silent Telugu timeline. Its media are ORIGINAL
procedural assets generated here with FFmpeg (a coast image and a wave-footage frame sequence), listed in a verified
asset manifest (sha256, licence, source, attribution, authenticity) and passed through --options. Checks: Ken Burns,
lower thirds, map route and markers, footage playback, the `dip` transition, Telugu captions in portrait and landscape,
refusals (manifest changed, unknown licence, synthetic asset without a provenance label), preflight, an optional
preview, a contact sheet, and package immutability. Times are synthetic; they test integration only.
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
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-dc-tests"))
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
    "te-IN": dict(segs=[("s1", "సాయంత్రం ఈ తీరం నిశ్శబ్దంగా ఉంటుంది.", .1, 2.3), ("s2", "పడవలు ఈ దారిలో రేవుకు చేరుతాయి.", 2.8, 5.3)],
                  words=dict(coast="తీరం", boats="పడవలు", route="దారిలో", harbour="రేవుకు", cam1="నిశ్శబ్దంగా", cam2="రేవుకు"), labels=None),
}
# Original procedural assets (no third-party media) and their verified manifest.
ASSETS = work / "assets"; ASSETS.mkdir(parents=True, exist_ok=True)
SUN = "exp(-(pow(X-0.62*W,2)+pow(Y-0.5*H,2))/(2*pow(0.05*W,2)))"
HILL = "gt(Y,0.55*H-0.13*H*exp(-pow((X-0.16*W)/(0.2*W),2))-0.02*H*exp(-pow((X-0.36*W)/(0.08*W),2)))"
REF = "exp(-pow((X-0.62*W)/(0.05*W),2))*(0.5+0.5*sin(Y*0.35+2*sin(X*0.05)))"
CH = lambda sky, hill, sea: f"clip(if(lt(Y,0.55*H),if({HILL},{hill},{sky}),{sea})+random(0)*12,0,255)"
run("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
    "nullsrc=s=1600x1000,format=rgb24,geq=r='" + CH(f"60+190*Y/(0.55*H)+190*{SUN}", 26, f"20+160*{REF}") + "':g='" + CH(f"40+105*Y/(0.55*H)+150*{SUN}", 22, f"34+105*{REF}") +
    "':b='" + CH(f"92-20*Y/(0.55*H)+90*{SUN}", 32, f"64+45*{REF}") + "'", "-frames:v", "1", "-q:v", "3", ASSETS / "coast.jpg")
WAVE = "pow(0.5+0.5*sin(Y*0.12+N*0.8+2*sin(X*0.03+N*0.3)),6)"
run("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
    f"nullsrc=s=640x400:r=8,format=rgb24,geq=r='clip(30+120*{WAVE}+random(0)*10,0,255)':g='clip(48+130*{WAVE}+random(0)*10,0,255)':b='clip(80+140*{WAVE}+random(0)*10,0,255)'",
    "-frames:v", "8", "-q:v", "3", ASSETS / "waves-%02d.jpg")
COMMON = dict(kind="original", license="Original work created for this test (no third-party rights)", source="Generated with FFmpeg lavfi expressions in test_documentary.py",
              attribution="Video Creator test fixture", authenticity="procedural")
MANIFEST = dict(schema="video-creator.assets", version=1, assets=[
    dict(id="coast-photo", media="image", file="coast.jpg", sha256=digest(ASSETS / "coast.jpg"), width=1600, height=1000, title="Synthetic coast", **COMMON),
    dict(id="waves", media="frames", fps=8, frames=[dict(file=f"waves-{i:02d}.jpg", sha256=digest(ASSETS / f"waves-{i:02d}.jpg")) for i in range(1, 9)], title="Synthetic waves", **COMMON)])
manifest_file = write(ASSETS, "assets.json", MANIFEST)
ASSET_OPT = {"assets": {"manifest": str(manifest_file), "sha256": digest(manifest_file)}}
SEG_BOUNDS = {"s1": (0, 2.6), "s2": (2.6, 5.6)}


def project(locale, v):
    cfg = work / f"cfg-{locale}.json"
    py(S / "preferences.py", "resolve", f"locale={locale}", *([f"presentation={a.presentation}"] if a.presentation else []), "--store", work / "prefs.json", "--json", cfg)
    P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", f"dc {locale}", "--config", cfg)[1])["created"]["project"])

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
    tl = write(P, "narration/narration.timeline.json", dict(version=1, unit="sample", locale=locale, validation="unreviewed", run_id=f"synthetic-dc-{locale}",
               timing=dict(method="forced_alignment", provider="synthetic-test"), audio=dict(path="narration/narration.wav", sha256=digest(wav), sample_rate=RATE, sample_count=total),
               text=dict(display=text, speech=text), segments=meta, records=sorted(records, key=lambda r: (r["kind"] != "word", r["start"]))))
    complete("narration", [wav, tl])
    W = v["words"]
    O = lambda i: dict(id=i, asset="a1", description=i)
    C = lambda i, o, w: dict(id=i, object=o, action="draw", at={"word": w})
    plan = dict(schema="video-creator.creative-plan", version=1, narration=dict(timeline="narration/narration.timeline.json", sha256=digest(tl)),
                style="documentary", style_reason="fixture", guardrails=["synthetic procedural imagery, labelled as such; not a real place or event"],
                motifs=[dict(id="m1", stands_for="the coast")], story=[dict(segment="s1", role="hook", idea="x"), dict(segment="s2", role="example", idea="y")],
                assets=[dict(id="a1", kind="original", description="procedural coast image and wave footage (asset manifest)")],
                shots=[dict(id="coast", purpose="p", objects=[O("a-lower")], camera=[dict(at={"word": W["cam1"]}, intent="settle")],
                            cues=[C("coast", "a-lower", W["coast"])]),
                       dict(id="route", purpose="p", start={"segment": "s2"}, objects=[O("b-film"), O("b-route"), O("b-port")], camera=[dict(at={"word": W["cam2"]}, intent="ease")],
                            cues=[C("boats", "b-film", W["boats"]), C("route", "b-route", W["route"]), C("harbour", "b-port", W["harbour"])])])
    write(P, "plan/creative-plan.json", plan)
    c, o, e = py(S / "plan.py", "resolve", P)
    check(f"{locale}: plan resolves for the documentary style", c == 0, err=e[-200:])
    c, o, e = py(S / "captions.py", "build", P, *(["--mode", "words", "--max-words", "4", "--max-chars", "28"] if a.presentation == "full-bleed" else []))
    caps = json.loads((P / "captions/captions.json").read_text(encoding="utf-8")) if c == 0 else {}
    check(f"{locale}: caption artifact builds with the original text", c == 0 and " ".join(x["text"] for x in caps.get("cues", [])).split() == text.split(), err=e[-200:])
    shutil.copy(SOURCE / "scripts/tests/fixtures/dc-topic.js", P / "dc-topic.js")
    return P


keys = {}
for locale, v in VARIANTS.items():
    P = project(locale, v)
    common = ["--project", P, "--style", "documentary", "--topic", "dc-topic.js", "--timeline", "narration/narration.timeline.json",
              "--plan", "plan/resolved-plan.json", "--captions", "captions/captions.json", "--locale", locale, "--fps", "30"] + \
             ["--options", json.dumps(ASSET_OPT)]
    for orient, dims in ({"portrait": [], "landscape": ["--width", "1920", "--height", "1080"]} if locale in ("en-IN", "te-IN") else {"portrait": []}).items():
        tag = f"{locale}-{orient}"
        c, o, e = run("node", S / "render.mjs", *common, *dims, "--keys-only", "--out", f"render/keys-{orient}")
        keys[tag] = sorted((P / f"render/keys-{orient}/keyframes").glob("*.png"), key=lambda p: int(p.name.split("-")[1])) if c == 0 else []
        check(f"{tag}: keyframes render with speech-cue checks", c == 0 and len(keys[tag]) == 4 and "4 cue checks passed" in o, out=(o + e)[-240:])
        c, o, e = run("node", S / "preflight.mjs", *common, *dims, "--out", f"qa/preflight-{orient}")
        pf = json.loads((P / f"qa/preflight-{orient}/preflight.json").read_text(encoding="utf-8")) if (P / f"qa/preflight-{orient}/preflight.json").exists() else {}
        unsupported = [k for k, x in (pf.get("checks") or {}).items() if isinstance(x, dict) and x.get("status") == "unsupported"]
        check(f"{tag}: preflight passes every frame (caption layout and empty-caption checks included)", c == 0 and pf.get("passed") is True and not unsupported, out=(o + e)[-240:])
    if locale == "te-IN":
        enP, enCommon = P, common
# The erase transition is active around the cut, and camera moments are present.
c, o, e = run("node", "-e", f"""
import('{(S / 'styles/documentary/backend.mjs').as_uri()}').then(async ({{backend}}) => {{
  const fs = await import('node:fs');
  const {{loadRenderPlan}} = await import('{(S / 'lib/resolved-plan.mjs').as_uri()}');
  const tlf = {json.dumps(str(enP / 'narration/narration.timeline.json'))}, tl = JSON.parse(fs.readFileSync(tlf, 'utf8'));
  const plan = await loadRenderPlan({{planFile: {json.dumps(str(enP / 'plan/resolved-plan.json'))}, project: {json.dumps(str(enP))}, timelineFile: tlf, timeline: tl}});
  const s = await backend.open({{width: 1080, height: 1920, locale: 'te-IN'}});
  try {{
    const info = await s.install({{topicOptions: {json.dumps(ASSET_OPT)}, timeline: tl, topicSource: fs.readFileSync({json.dumps(str(enP / 'dc-topic.js'))}, 'utf8'), plan}});
    const at = info.shots[0].transition.at, mid = [(await s.seek(at - .1)).transition, (await s.seek(at + .1)).transition, (await s.seek(at + .5)).transition];
    console.log(JSON.stringify({{shots: info.shots.map(x => [x.id, x.cameraTimes.length, x.transition?.type ?? null]), mid}}));
  }} finally {{ await s.close(); }}
}});""")
try:
    facts = json.loads(o.strip().splitlines()[-1])
except Exception:
    facts = {"error": (o + e)[-300:]}
check("dip transition active around the cut; camera moments present", facts.get("shots") == [["coast", 2, "dip"], ["route", 2, None]] and facts.get("mid") == ["dip", "dip", None], facts=facts)
# Provenance and licensing refusals.
bad = json.loads(json.dumps(MANIFEST)); bad["assets"][0]["license"] = "unknown"
bad_file = write(ASSETS, "assets-bad.json", bad)
specs = {"changed": {"manifest": str(manifest_file), "sha256": "0" * 64}, "license": {"manifest": str(bad_file), "sha256": digest(bad_file)}, "ok": ASSET_OPT["assets"]}
c, o, e = run("node", "-e", f"""
import('{(S / 'styles/documentary/backend.mjs').as_uri()}').then(async ({{verifyAssets}}) => {{
  const out = {{}}, specs = {json.dumps(specs)};
  for (const [k, spec] of Object.entries(specs)) {{
    try {{ const r = await verifyAssets(spec); out[k] = 'verified:' + Object.keys(r).join(','); }} catch (err) {{ out[k] = err.code; }}
  }}
  console.log(JSON.stringify(out));
}});""")
try:
    prov = json.loads(o.strip().splitlines()[-1])
except Exception:
    prov = {"error": (o + e)[-300:]}
src = (enP / "dc-topic.js").read_text(encoding="utf-8")
(enP / "dc-noprov.js").write_text(src.replace("prov('a-prov')", "...[]").replace("      kit.label('a-prov', S('coast').start + .1);", ""), encoding="utf-8")
c, o, e = run("node", S / "render.mjs", *[x if x != "dc-topic.js" else "dc-noprov.js" for x in enCommon], "--keys-only", "--out", "render/keys-noprov")
check("refusals: changed manifest, unknown licence, synthetic asset without provenance label",
      prov.get("changed") == "asset-manifest-changed" and prov.get("license") == "asset-license" and prov.get("ok") == "verified:coast-photo,waves"
      and c != 0 and "missing-provenance-label" in (o + e), prov=prov, noprov=(o + e)[-160:])
if a.preview:
    c, o, e = run("node", S / "render.mjs", *enCommon, "--scale", "0.5", "--name", "dc-preview.mp4", "--out", "render/preview")
    ev = json.loads((enP / "render/preview/dc-preview-evidence.json").read_text(encoding="utf-8")) if c == 0 else {}
    check("motion preview renders, decodes and passes media checks", c == 0 and ev.get("failures") == [], out=(o + e)[-240:])
sheet = work / "dc-contact.png"
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
(work / "dc-test-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - work: {work}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
