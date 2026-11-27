"""P018.3 visual richness tests for Paper Explainer and Tech Explainer (system Python + Node + Chromium + ffmpeg; no TTS).

python -I scripts/tests/test_richness.py [--work <dir outside the package>] [--preview] [--frames 90]

Two unseen-topic fixtures (fixtures/rich-paper-topic.js: a volcano in Telugu; fixtures/rich-tech-topic.js: wireless
charging in English) on synthetic timelines, full-bleed. Each renders twice from the same composition: options
{"rich": false} (pre-P018.3 means only) and the default rich version. Checks: keyframes with every speech-cue check,
full-cadence preflight of the rich version, full-resolution frame-render cost (plain vs rich, --stop-after), baked
textures are deterministic across sessions, optional compact previews, before/after sheets and package immutability.
Times are synthetic; they test integration only. Artistic acceptance stays an owner gate.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time
import wave

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--work", default=str(Path(__import__("tempfile").gettempdir()) / "vc-richness-tests"))
ap.add_argument("--preview", action="store_true", help="also render a compact 540x960 preview of each rich composition")
ap.add_argument("--frames", type=int, default=90, help="full-resolution frames rendered per variant for the cost measurement")
ap.add_argument("--only", default="", help="comma-separated fixture names (paper, tech, detail); default all")
a = ap.parse_args()
work = Path(a.work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
S, FIX = pkg / "scripts", pkg / "scripts/tests/fixtures"
digest = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
snapshot = lambda: {p.relative_to(pkg).as_posix(): digest(p) for p in sorted(pkg.rglob("*")) if p.is_file()}
before = snapshot()
RATE, results, perf = 24000, [], {}


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


def jload(p):
    p = Path(p)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


FX = {
    "paper": dict(style="paper-explainer", topic="rich-paper-topic.js", locale="te-IN", total=9.2,
                  segs=[("s1", "భూమి లోపల లోతుగా రాయి కరుగుతుంది.", .2, 2.2, 0, 2.6), ("s2", "ఆ వేడి ద్రవమే శిలాద్రవం.", 2.8, 4.4, 2.6, 5.2),
                        ("s3", "ఒత్తిడి పెరిగితే అది పైకి దూసుకొచ్చి బయటకు చిమ్ముతుంది.", 5.5, 8.3, 5.2, 9.2)],
                  shots=[("land", None, [("deep", "l-arrow", "లోతుగా")]), ("section", "s2", [("hot", "s-glow", "వేడి"), ("magma", "s-tag", "శిలాద్రవం.")]),
                         ("erupt", "s3", [("pressure", "e-tag", "ఒత్తిడి"), ("shoot", "e-p0", "దూసుకొచ్చి"), ("burst", "e-lava", "చిమ్ముతుంది.")])]),
    "tech": dict(style="tech-explainer", topic="rich-tech-topic.js", locale="en-IN", total=11.0,
                 segs=[("s1", "A coil inside the pad drives a changing magnetic field.", .2, 2.6, 0, 3.6),
                       ("s2", "A second coil in the phone catches it and turns it back into current.", 3.9, 7.0, 3.6, 8.1),
                       ("s3", "That current refills the battery.", 8.4, 9.8, 8.1, 11.0)],
                 shots=[("pad", None, [("coil", "p-coil", "coil"), ("field", "p-field", "magnetic")]), ("phone", "s2", [("second", "ph-tag-rc", "second"), ("current", "ph-current", "current.")]),
                        ("battery", "s3", [("refills", "b-fill", "refills")])]),
    # P018.4 construction fixture: one rich composition (no plain variant); its cost is compared with P018.3 "paper".
    "detail": dict(style="paper-explainer", topic="detail-paper-topic.js", locale="en-IN", total=11.0, plain=False,
                   segs=[("s1", "A canal boat cannot climb a hill.", .2, 2.4, 0, 2.8), ("s2", "So it slips into a lock, and the gates close behind it.", 3.0, 6.0, 2.8, 6.4),
                         ("s3", "Water pours in, the boat rises, and the top gate swings open.", 6.6, 10.0, 6.4, 11.0)],
                   shots=[("valley", None, [("climb", "v-route", "climb")]),
                          ("lock", "s2", [("lock", "l-tag", "lock,"), ("close", "l-gate-low", "close"), ("pours", "l-gush", "pours", "s3"), ("rises", "l-rise", "rises,", "s3"),
                                          ("swings", "l-gate-up-open", "swings", "s3")])]),
}
if a.only:
    FX = {k: v for k, v in FX.items() if k in a.only.split(",")}
VARIANTS = lambda fx: (("plain", False), ("rich", True)) if fx.get("plain", True) else (("rich", True),)


def complete(P, stage, outputs):
    py(S / "project.py", "start", P, stage)
    ev = write(P, f"qa/{stage}.json", {"passed": True})
    c, o, e = py(S / "project.py", "complete", P, stage, *sum((["--output", x] for x in outputs), []), "--evidence", ev)
    assert c == 0, e


def project(name, fx):
    py(S / "preferences.py", "resolve", f"locale={fx['locale']}", f"style={fx['style']}", "--store", work / "prefs.json", "--json", work / f"cfg-{name}.json")
    P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", name, "--config", work / f"cfg-{name}.json")[1])["created"]["project"])
    complete(P, "research", [write(P, "research/claims.json", {"claims": []})])
    complete(P, "script", [write(P, "script/script.json", {"generic": True})])
    total = round(fx["total"] * RATE)
    wav = P / "narration/narration.wav"; wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(b"\0\0" * total)
    text, records, meta = "", [], []
    for sid, seg, t0, t1, lo_s, hi_s in fx["segs"]:
        text += " " if text else ""
        base, toks = len(text), seg.split(" ")
        span = (t1 - t0) / len(toks)
        for i, tok in enumerate(toks):
            lo = len(text); text += tok + (" " if i + 1 < len(toks) else "")
            records.append(dict(kind="word", label=tok, start=round((t0 + i * span) * RATE), end=round((t0 + (i + .9) * span) * RATE), source="forced_alignment",
                                segment=sid, text_ref=dict(field="speech", start=lo, end=lo + len(tok))))
        records.append(dict(kind="phrase", label=seg, start=round(t0 * RATE), end=round((t0 + (len(toks) - .1) * span) * RATE), source="forced_alignment", segment=sid,
                            text_ref=dict(field="speech", start=base, end=len(text))))
        meta.append(dict(id=sid, run_id="synthetic", validation="unreviewed", offset_samples=round(lo_s * RATE), sample_count=round((hi_s - lo_s) * RATE), gap_after_samples=0))
    tl = write(P, "narration/narration.timeline.json", dict(version=1, unit="sample", locale=fx["locale"], validation="unreviewed", run_id=f"synthetic-{name}",
               timing=dict(method="forced_alignment", provider="synthetic-test"), audio=dict(path="narration/narration.wav", sha256=digest(wav), sample_rate=RATE, sample_count=total),
               text=dict(display=text, speech=text), segments=meta, records=sorted(records, key=lambda r: (r["kind"] != "word", r["start"]))))
    complete(P, "narration", [wav, tl])
    shots = [dict(id=sid, purpose="p", **({"start": {"segment": seg}} if seg else {}), objects=[dict(id=cc[1], asset="a1", description=cc[1]) for cc in cues],
                  cues=[dict(id=cc[0], object=cc[1], action="appear", at={"word": cc[2], "segment": cc[3] if len(cc) > 3 else seg or "s1"}) for cc in cues]) for sid, seg, cues in fx["shots"]]
    write(P, "plan/creative-plan.json", dict(schema="video-creator.creative-plan", version=1, narration=dict(timeline="narration/narration.timeline.json", sha256=digest(tl)),
          style=fx["style"], style_reason="fixture", guardrails=["simplified, not to scale"], motifs=[dict(id="m1", stands_for="x")],
          story=[dict(segment=s[0], role=r, idea="x") for s, r in zip(fx["segs"], ("hook", "mechanism", "resolution"))],
          assets=[dict(id="a1", kind="procedural", description="procedural fixture art")], shots=shots))
    c, o, e = py(S / "plan.py", "resolve", P)
    check(f"{name}: plan resolves", c == 0, err=e[-300:])
    c, o, e = py(S / "captions.py", "build", P, "--mode", "words", "--max-words", "4", "--max-chars", "28")
    check(f"{name}: word-group captions build", c == 0, err=e[-200:])
    shutil.copy(FIX / fx["topic"], P / "topic.js")
    return P


def common(P, fx, rich, *extra):
    return ["--project", P, "--style", fx["style"], "--topic", "topic.js", "--timeline", "narration/narration.timeline.json", "--plan", "plan/resolved-plan.json",
            "--captions", "captions/captions.json", "--locale", fx["locale"], "--fps", "30", *([] if rich else ["--options", json.dumps({"rich": False})]), *extra]


sheets = {}
for name, fx in FX.items():
    P = project(name, fx)
    for variant, rich in VARIANTS(fx):
        c, o, e = run("node", S / "render.mjs", *common(P, fx, rich), "--keys-only", "--out", f"render/keys-{variant}")
        ev = jload(P / f"render/keys-{variant}/keys-evidence.json")
        keys = sorted((P / f"render/keys-{variant}/keyframes").glob("*.png")) if c == 0 else []
        sheets.setdefault(name, {})[variant] = keys
        cc = ev.get("cueChecks", [])
        check(f"{name}: {variant} keyframes render with every speech-cue check", c == 0 and len(keys) == 4 and cc and all(x["before"] <= .01 and x["after"] >= .5 for x in cc),
              cues=len(cc), out=(o + e)[-300:])
    t0 = time.time()
    c, o, e = run("node", S / "preflight.mjs", *common(P, fx, True), "--out", "qa/preflight-rich")
    pf = jload(P / "qa/preflight-rich/preflight.json")
    unsupported = [k for k, v in (pf.get("checks") or {}).items() if isinstance(v, dict) and v.get("status") == "unsupported"]
    check(f"{name}: rich preflight passes every frame with no unsupported checks", c == 0 and pf.get("passed") is True and not unsupported,
          defects=[(d.get("type"), d.get("object"), (d.get("evidence") or {}).get("reason")) for d in (pf.get("defects") or [])][:4], out=(o + e)[-200:])
    perf[f"{name}/preflight-rich-seconds"] = pf.get("wallSeconds")
    # Full-resolution frame cost: the same first N frames, plain vs rich (checkpointed frames, interrupted on purpose).
    # Alternate plain and rich twice and keep the faster run of each (fresh checkpoint each time), to damp host noise.
    walls, codes = {v: [] for v, _ in VARIANTS(fx)}, []
    for rep in range(2):
        for variant, rich in VARIANTS(fx):
            t0 = time.time()
            c, o, e = run("node", S / "render.mjs", *common(P, fx, rich), "--stop-after", str(a.frames), "--out", f"render/cost-{variant}-{rep}")
            walls[variant].append(round(time.time() - t0, 1)); codes.append((variant, c, (o + e)[-120:]))
    for variant in walls:
        perf[f"{name}/{variant}-{a.frames}-frames-1080x1920-seconds"] = min(walls[variant])
        perf[f"{name}/{variant}-runs"] = walls[variant]
    check(f"{name}: {' and '.join(walls)} each render {a.frames} full-resolution frames twice (interrupted on purpose)", all(c == 75 for _, c, _ in codes), runs=walls,
          errors=[x for x in codes if x[1] != 75][:2])
    if "plain" in walls:
        pl, ri = perf[f"{name}/plain-{a.frames}-frames-1080x1920-seconds"], perf[f"{name}/rich-{a.frames}-frames-1080x1920-seconds"]
        perf[f"{name}/rich-overhead"] = f"{(ri / pl - 1) * 100:+.0f}%" if pl else None
    if a.preview:
        c, o, e = run("node", S / "render.mjs", *common(P, fx, True), "--scale", "0.5", "--name", f"{name}-rich-preview.mp4", "--out", "render/preview")
        ev = jload(P / f"render/preview/{name}-rich-preview-evidence.json")
        perf[f"{name}/preview-540x960-seconds"] = ev.get("renderWallSeconds")
        check(f"{name}: rich motion preview renders, decodes and passes media checks", c == 0 and ev.get("failures") == [], out=(o + e)[-260:])
        mp4 = P / f"render/preview/{name}-rich-preview.mp4"
        if mp4.exists():
            shutil.copy(mp4, work / mp4.name)
            c, _, e = run("ffmpeg", "-v", "error", "-y", "-i", mp4, "-vf", "fps=1.5,scale=240:-1,tile=8x2:padding=6:color=0x222222", "-frames:v", "1", work / f"motion-{name}.png")
            check(f"{name}: motion sheet written", c == 0, err=e[-200:])

# Baked textures are deterministic: two fresh browser sessions bake identical PNG data (FNV-1a hash computed in the page,
# returned through the topic's keyframe name).
TEX_TOPIC = ("globalThis.paperTopic = {shots: [{id: 'a', scene: 's'}], symbols: () => '', build: () => { const T = globalThis.vcTexture;"
             " const s = [T.bake({kind: 'paper', seed: 3, fibres: 80}), T.bake({kind: 'gouache', seed: 4}), T.bake({kind: 'brushed', seed: 2}), T.bake({kind: 'speckle', seed: 5})].join('|');"
             " let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }"
             " return {scenes: {s: {objects: []}}, checks: {keyframes: [['tex-' + h.toString(16) + '-' + s.length, 0]]}}; }};")
TEX_PROBE = r"""
const [backendFile, topic] = process.argv.slice(1);
const {backend} = await import(backendFile);
const s = await backend.open({width: 540, height: 960, locale: 'und'});
try {
  const info = await s.install({timeline: {audio: {sample_rate: 1000, sample_count: 2000, sha256: 'x'}, records: [{kind: 'phrase', start: 0, end: 1500, label: 'x'}]}, topicSource: topic});
  console.log(JSON.stringify({ok: true, digest: info.checks.keyframes[0][0]}));
} catch (err) { console.log(JSON.stringify({ok: false, err: err.message.slice(0, 200)})); } finally { await s.close(); }
"""
hashes = []
for i in range(2):
    c, o, e = run("node", "--input-type=module", "-e", TEX_PROBE, (S / "styles/paper-explainer/backend.mjs").as_uri(), TEX_TOPIC)
    try:
        hashes.append(json.loads(o.strip().splitlines()[-1]))
    except Exception:
        hashes.append({"ok": False, "err": (o + e)[-200:]})
check("baked textures (paper, gouache, brushed, speckle) are identical across fresh sessions", all(h.get("ok") for h in hashes) and len({h.get("digest") for h in hashes}) == 1, runs=hashes)

# P018.4: the construction composition against the P018.3 rich Paper composition (top row P018.3, bottom row P018.4).
if "detail" in sheets and "paper" in sheets:
    sheets["detail-vs-p018.3"] = {"plain": sheets["paper"].get("rich", []), "rich": sheets["detail"].get("rich", [])}
    ref = perf.get(f"paper/rich-{a.frames}-frames-1080x1920-seconds"); det = perf.get(f"detail/rich-{a.frames}-frames-1080x1920-seconds")
    if ref and det:
        perf["detail/vs-p018.3-paper-rich"] = f"{(det / ref - 1) * 100:+.0f}%"
for name, modes in sheets.items():
    if "plain" not in modes:
        continue
    pl, ri = modes.get("plain", []), modes.get("rich", [])
    if not pl or len(pl) != len(ri):
        check(f"{name}: before/after sheet", False, plain=len(pl), rich=len(ri)); continue
    n = len(pl)
    args = ["ffmpeg", "-v", "error", "-y"] + sum((["-i", str(k)] for k in pl + ri), [])
    fc = "".join(f"[{i}:v]scale=-1:640[v{i}];" for i in range(2 * n)) + "".join(f"[v{i}]" for i in range(n)) + f"hstack={n}[top];" + \
        "".join(f"[v{i}]" for i in range(n, 2 * n)) + f"hstack={n}[bot];[top][bot]vstack=2"
    c, _, e = run(*args, "-filter_complex", fc, str(work / f"before-after-{name}.png"))
    check(f"{name}: before/after sheet written", c == 0, err=e[-200:])

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "richness-perf.json").write_text(json.dumps(perf, indent=2) + "\n", encoding="utf-8")
(work / "richness-test-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(perf, indent=1))
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - work: {work}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
