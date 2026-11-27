"""P018.2 premium full-bleed presentation tests (system Python + Node + Chromium + ffmpeg; no TTS).

python -I scripts/tests/test_presentation.py [--work <dir outside the package>] [--preview]

Paper Explainer and Tech Explainer, each with a short Telugu and English synthetic timeline (sample-exact word records),
render the same fixture artwork twice: the original framed presentation ("before", default phrase captions) and the
opt-in full-bleed presentation ("after": short word-group captions, active-word emphasis, an agent-written hook).
Checks: caption artifacts and SRT/VTT, keyframes with speech-cue checks, full-frame-cadence preflight (portrait; Tech
also landscape), active-word timing against the timeline, caption-box stability within cues, hook timing and
whole-word highlight, label/hook overlap detection, invalid specs refused, legacy framed mode unchanged in its DOM,
an optional compact motion preview (--preview), before/after contact sheets, and package immutability.
Times are synthetic; they test integration only. Language and readability review stay human gates.
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
ap.add_argument("--work", default=str(Path(__import__("tempfile").gettempdir()) / "vc-presentation-tests"))
ap.add_argument("--preview", action="store_true", help="also render the ~6 s 540x960 full-bleed motion preview (Tech, Telugu)")
a = ap.parse_args()
work = Path(a.work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
S, FIX = pkg / "scripts", pkg / "scripts/tests/fixtures"
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


def jload(p):
    p = Path(p)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


# ---------- fixtures: the same artwork, relabelled per locale; presentation added by a wrapper (the agent would author it) ----------
# segments: (id, sentence, speech start, speech end, segment start, segment end); words are spaced evenly inside the speech span.
FX = {
    "paper": dict(style="paper-explainer", topic="kit-topic.js", glob="paperTopic", total=5.2, locales={
        "en-IN": dict(segs=[("s1", "Sun rises, leaf grows.", .5, 2.9, 0, 3.2), ("s2", "Rain falls.", 3.5, 4.7, 3.2, 5.2)],
                      words=dict(sun="Sun", leaf="leaf", grows="grows.", falls="falls."), labels={},
                      hook=dict(text="How does a leaf grow?", highlight="leaf", until=1.6)),
        "te-IN": dict(segs=[("s1", "సూర్యుడు ఉదయిస్తాడు, ఆకు పెరుగుతుంది.", .5, 2.9, 0, 3.2), ("s2", "వాన కురుస్తుంది.", 3.5, 4.7, 3.2, 5.2)],
                      words=dict(sun="సూర్యుడు", leaf="ఆకు", grows="పెరుగుతుంది.", falls="కురుస్తుంది."),
                      labels={"leaf": "ఆకు", "Sun": "సూర్యుడు", "falls": "వాన"}, hook=dict(text="ఆకు ఎలా పెరుగుతుంది?", highlight="ఆకు", until=1.6)),
    }),
    "tech": dict(style="tech-explainer", topic="tech-topic.js", glob="techTopic", total=6.0, locales={
        "en-IN": dict(segs=[("s1", "Your message leaves the phone as tiny packets.", .1, 1.9, 0, 2.0), ("s2", "Routers pass each one along the fastest path.", 2.1, 4.0, 2.0, 4.2),
                            ("s3", "A server puts them back together.", 4.3, 5.8, 4.2, 6.0)],
                      words=dict(message="message", packets="leaves", phone="phone", routers="Routers", path="along", server="server", together="together"),
                      labels={}, hook=dict(text="Where does your message go?", highlight="message", until=1.4)),
        "te-IN": dict(segs=[("s1", "మీ సందేశం చిన్న ప్యాకెట్లుగా ఫోన్ నుంచి బయలుదేరుతుంది.", .1, 1.9, 0, 2.0),
                            ("s2", "రౌటర్లు ప్రతి ప్యాకెట్‌ను వేగమైన దారిలో పంపుతాయి.", 2.1, 4.0, 2.0, 4.2),
                            ("s3", "సర్వర్ వాటిని మళ్ళీ ఒకటిగా కలుపుతుంది.", 4.3, 5.8, 4.2, 6.0)],
                      words=dict(message="సందేశం", packets="ప్యాకెట్లుగా", phone="ఫోన్", routers="రౌటర్లు", path="దారిలో", server="సర్వర్", together="ఒకటిగా"),
                      labels={"packets": "ప్యాకెట్లు", "fastest path": "వేగమైన దారి", "3 hops": "3 హాప్‌లు", "together": "కలిసి"},
                      hook=dict(text="మీ సందేశం ఎక్కడికి వెళ్తుంది?", highlight="సందేశం", until=1.4)),
    }),
}
# Full-bleed composition notes for the fixtures (what an agent would decide per shot): keep captions off the hero/labels.
# The last Paper shot keeps its caption at the top (the drop and its label sit low); portrait labels move clear of the hook.
POSITIONS = {"paper": {"close": "upper"}, "tech": {}}
MOVES = {"paper": {"sun-tag": [58, 30]}, "tech": {"s-tag": [50, 22], "r-tag": [50, 70], "r-read": [50, 15], "a-tag": [50, 40]}}


def wrapper(fx, loc, full, hook=True, extra=""):
    spec = dict(labels=loc["labels"], moves=MOVES[fx_name(fx)] if full else {},
                presentation=dict(mode="full-bleed", captions=dict(position="lower", emphasis="word"), **({"hook": loc["hook"]} if hook else {})) if full else None,
                positions=POSITIONS[fx_name(fx)] if full else {})
    return f"""
;(() => {{ const T = globalThis.{fx['glob']}, o = {json.dumps(spec, ensure_ascii=False)};
  const build = T.build;
  T.build = ctx => {{ const r = build(ctx);
    for (const s of Object.values(r.scenes)) for (const ob of s.objects) {{
      if (ob.label && o.labels[ob.label]) ob.label = o.labels[ob.label];
      if (o.moves[ob.id] && !(ctx.aspect > 1)) {{ ob.position = {{...ob.position, x: o.moves[ob.id][0], y: o.moves[ob.id][1]}}; }}
    }}
    if (r.checks?.keyframes) r.checks.keyframes = [['opening', .6], ...r.checks.keyframes];   // shows the hook in before/after sheets
    return r; }};
  if (o.presentation) T.presentation = o.presentation;
  for (const s of T.shots) if (o.positions[s.id]) s.captionPosition = o.positions[s.id];
  {extra}
}})();"""


def fx_name(fx):
    return next(k for k, v in FX.items() if v is fx)


def complete(P, stage, outputs):
    py(S / "project.py", "start", P, stage)
    ev = write(P, f"qa/{stage}.json", {"passed": True})
    c, o, e = py(S / "project.py", "complete", P, stage, *sum((["--output", x] for x in outputs), []), "--evidence", ev)
    assert c == 0, e


def project(name, fx, locale, loc):
    code, out, err = py(S / "preferences.py", "resolve", f"locale={locale}", f"style={fx['style']}", "--store", work / "prefs.json", "--json", work / f"cfg-{name}.json")
    P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", name, "--config", work / f"cfg-{name}.json")[1])["created"]["project"])
    complete(P, "research", [write(P, "research/claims.json", {"claims": []})])
    complete(P, "script", [write(P, "script/script.json", {"generic": True})])
    total = round(fx["total"] * RATE)
    wav = P / "narration/narration.wav"; wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(b"\0\0" * total)
    text, records, meta = "", [], []
    for sid, seg, t0, t1, lo_s, hi_s in loc["segs"]:
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
    tl = write(P, "narration/narration.timeline.json", dict(version=1, unit="sample", locale=locale, validation="unreviewed", run_id=f"synthetic-{name}",
               timing=dict(method="forced_alignment", provider="synthetic-test"), audio=dict(path="narration/narration.wav", sha256=digest(wav), sample_rate=RATE, sample_count=total),
               text=dict(display=text, speech=text), segments=meta, records=sorted(records, key=lambda r: (r["kind"] != "word", r["start"]))))
    complete(P, "narration", [wav, tl])
    W = loc["words"]
    O = lambda i: dict(id=i, asset="a1", description=i)
    C = lambda i, o, w: dict(id=i, object=o, action="appear", at={"word": W[w]})
    if fx["style"] == "paper-explainer":
        shots = [dict(id="open", purpose="growth", objects=[O("sun"), O("leaf")], cues=[C("sun-in", "sun", "sun"), C("leaf-in", "leaf", "leaf")],
                      camera=[dict(at={"word": W["sun"]}, intent="close"), dict(at={"word": W["grows"]}, intent="pull back")]),
                 dict(id="close", purpose="water", start={"segment": "s2"}, objects=[O("drop")], cues=[C("drop-in", "drop", "falls")],
                      camera=[dict(at={"word": W["falls"], "edge": "end"}, intent="settle")])]
        story = [dict(segment="s1", role="hook", idea="growth"), dict(segment="s2", role="resolution", idea="water")]
    else:
        shots = [dict(id="send", purpose="p", objects=[O("s-pkt-0"), O("s-tag")], camera=[dict(at={"word": W["message"]}, intent="push in")],
                      cues=[C("packets", "s-pkt-0", "packets"), C("phone", "s-tag", "phone")]),
                 dict(id="route", purpose="p", start={"segment": "s2"}, objects=[O("r-routers"), O("r-route")], cues=[C("routers", "r-routers", "routers"), C("path", "r-route", "path")]),
                 dict(id="arrive", purpose="p", start={"segment": "s3"}, objects=[O("a-server"), O("a-msg")], camera=[dict(at={"word": W["server"]}, intent="settle")],
                      cues=[C("server", "a-server", "server"), C("together", "a-msg", "together")])]
        story = [dict(segment=s, role=r, idea="x") for s, r in (("s1", "hook"), ("s2", "mechanism"), ("s3", "resolution"))]
    write(P, "plan/creative-plan.json", dict(schema="video-creator.creative-plan", version=1, narration=dict(timeline="narration/narration.timeline.json", sha256=digest(tl)),
          style=fx["style"], style_reason="fixture", guardrails=["none"], motifs=[dict(id="m1", stands_for="x")], story=story,
          assets=[dict(id="a1", kind="original", description="fixture art")], shots=shots))
    c, o, e = py(S / "plan.py", "resolve", P)
    assert c == 0, e
    src = (FIX / fx["topic"]).read_text(encoding="utf-8")
    write(P, "topic-framed.js", src + wrapper(fx, loc, False))
    write(P, "topic-full.js", src + wrapper(fx, loc, True))
    return P, tl


def common(P, fx, locale, topic, caps):
    return ["--project", P, "--style", fx["style"], "--topic", topic, "--timeline", "narration/narration.timeline.json",
            "--plan", "plan/resolved-plan.json", "--captions", caps, "--locale", locale, "--fps", "30"]


sheets, timings, projects = {}, {}, {}
for fname, fx in FX.items():
    for locale, loc in fx["locales"].items():
        name = f"{fname}-{locale}"
        P, tl = project(name, fx, locale, loc)
        projects[name] = (P, tl)
        # "before": the original pipeline's phrase captions; "after": short word groups for the integrated captions.
        c1 = py(S / "captions.py", "build", P, "--out-dir", "captions-phrase")
        c2 = py(S / "captions.py", "build", P, "--mode", "words", "--max-words", "4", "--max-chars", "28")
        caps = jload(P / "captions/captions.json")
        srt = (P / "captions/captions.srt").read_text(encoding="utf-8") if (P / "captions/captions.srt").exists() else ""
        check(f"{name}: phrase and word-group caption artifacts build; SRT/VTT carry the cue text unchanged",
              c1[0] == 0 and c2[0] == 0 and (P / "captions/captions.vtt").exists() and caps.get("cues") and all(cu["text"] in srt for cu in caps["cues"])
              and all(len(cu["text"].split()) <= 4 for cu in caps["cues"]), err=(c1[2] + c2[2])[-200:], cues=[cu["text"] for cu in caps.get("cues", [])][:4])
        cap_hashes = {f: digest(P / f) for f in ("captions/captions.json", "captions/captions.srt", "captions/captions.vtt")}
        for mode, topic, capfile in (("framed", "topic-framed.js", "captions-phrase/captions.json"), ("full", "topic-full.js", "captions/captions.json")):
            t0 = time.time()
            c, o, e = run("node", S / "render.mjs", *common(P, fx, locale, topic, capfile), "--keys-only", "--out", f"render/keys-{mode}")
            ev = jload(P / f"render/keys-{mode}/keys-evidence.json")
            ncues = len(ev.get("cueChecks", []))
            keys = sorted((P / f"render/keys-{mode}/keyframes").glob("*.png")) if c == 0 else []
            sheets.setdefault(name, {})[mode] = keys
            pres = ev.get("presentation") or {}
            ok = c == 0 and keys and ncues and all(x["before"] <= .01 and x["after"] >= .5 for x in ev["cueChecks"])
            if mode == "full":
                ok = ok and pres.get("presentation") == "full-bleed"
            else:
                ok = ok and pres.get("presentation") == "framed"
            check(f"{name}: {mode} keyframes render with every speech-cue check", ok, cues=ncues, presentation=pres.get("presentation"), out=(o + e)[-260:])
        for mode, topic, capfile, dims in (("full", "topic-full.js", "captions/captions.json", []),) + (
                (("full-landscape", "topic-full.js", "captions/captions.json", ["--width", "1920", "--height", "1080"]),
                 ("framed", "topic-framed.js", "captions-phrase/captions.json", [])) if fname == "tech" and locale == "te-IN" else ()):
            c, o, e = run("node", S / "preflight.mjs", *common(P, fx, locale, topic, capfile), *dims, "--out", f"qa/preflight-{mode}")
            pf = jload(P / f"qa/preflight-{mode}/preflight.json")
            unsupported = [k for k, v in (pf.get("checks") or {}).items() if isinstance(v, dict) and v.get("status") == "unsupported"]
            timings[f"{name}/{mode}"] = pf.get("wallSeconds")
            check(f"{name}: {mode} preflight passes every frame with no unsupported checks", c == 0 and pf.get("passed") is True and not unsupported,
                  defects=[(d.get("type"), d.get("object"), (d.get("evidence") or {}).get("reason")) for d in (pf.get("defects") or [])][:4], out=(o + e)[-200:])
        check(f"{name}: rendering leaves the caption artifacts and SRT/VTT untouched", all(digest(P / f) == h for f, h in cap_hashes.items()))

# ---------- direct session checks (one browser per style, Telugu): render state, preflight inspection, refusals ----------
probe = r"""
const [backendFile, tlFile, capFile, projectDir, fullFile, framedFile, badDir, overlapFile, times] = process.argv.slice(2);
const fs = await import('node:fs');
const {backend} = await import(backendFile);
const {loadCaptions} = await import(new URL('../../lib/captions.mjs', backendFile).href);
const {loadRenderPlan} = await import(new URL('../../lib/resolved-plan.mjs', backendFile).href);
const tl = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
const captions = await loadCaptions({file: capFile, project: projectDir, timelineFile: tlFile, timeline: tl});
const plan = await loadRenderPlan({planFile: projectDir + '/plan/resolved-plan.json', project: projectDir, timelineFile: tlFile, timeline: tl});
const out = {contractWords: captions.cues.map(c => (c.words ?? []).length), cueCount: captions.cues.length};
const session = async (file, fn) => { const s = await backend.open({width: 1080, height: 1920, locale: 'te-IN'});
  try { const info = await s.install({timeline: tl, topicSource: fs.readFileSync(file, 'utf8'), plan, captions}); return await fn(s, info); }
  catch (e) { return {error: e.message.slice(0, 300)}; } finally { await s.close(); } };
const probeAt = async (s, t) => { const st = await s.seek(t); const dom = await s.inspect(t);
  return {t, cid: st.captionId == null ? null : String(st.captionId), word: st.captionWord ?? null, hook: st.hook ?? null, outside: st.outside,
    findings: dom.findings.map(f => [f.type, f.object, f.evidence?.reason ?? null])}; };
out.full = await session(fullFile, async (s, info) => { const rows = []; for (const t of JSON.parse(times)) rows.push(await probeAt(s, t));
  return {presentation: info.presentation, describe: await s.describe(), rows}; });
out.framed = await session(framedFile, async (s, info) => ({presentation: info.presentation ?? null, describe: await s.describe(), ...(await probeAt(s, 1.0))}));
out.overlap = await session(overlapFile, async (s) => { const f = []; for (const t of [1.7, 1.9, 2.2]) f.push(...(await probeAt(s, t)).findings); return f; });
out.bad = {};
for (const f of fs.readdirSync(badDir)) out.bad[f] = await session(badDir + '/' + f, async () => 'accepted');
fs.writeFileSync(process.env.PROBE_OUT, JSON.stringify(out));
"""
probe_file = write(work, "probe.mjs", probe)
for fname, fx in FX.items():
    name = f"{fname}-te-IN"
    P, tl = projects[name]
    loc = fx["locales"]["te-IN"]
    src = (FIX / fx["topic"]).read_text(encoding="utf-8")
    bad = work / f"bad-{fname}"
    hl = loc["hook"]["highlight"]
    write(bad, "partial-highlight.js", src + wrapper(fx, loc, True, extra="T.presentation.hook = {...T.presentation.hook, highlight: " + json.dumps(hl[:-1], ensure_ascii=False) + "};"))
    write(bad, "unknown-mode.js", src + wrapper(fx, loc, True, extra="T.presentation.mode = 'cinema';"))
    write(bad, "bad-position.js", src + wrapper(fx, loc, True, extra="T.shots[0].captionPosition = 'left';"))
    write(bad, "missing-highlight.js", src + wrapper(fx, loc, True, extra="T.presentation.hook = {...T.presentation.hook, highlight: 'zzz'};"))
    overlap = write(work, f"overlap-{fname}.js", src + wrapper(fx, loc, True, extra="T.presentation.hook = {...T.presentation.hook, until: 3.0}; o.moves[" + json.dumps({"paper": "sun-tag", "tech": "s-tag"}[fname]) + "] = [50, 11];"))
    caps, timeline = jload(P / "captions/captions.json"), jload(tl)
    words = [r for r in timeline["records"] if r["kind"] == "word"]
    times = sorted({round(w["start"] / RATE + .05, 3) for w in words} | {round(w["start"] / RATE + .02, 3) for w in words} | {0.0, .5, 1.2, 2.5})
    env = dict(__import__("os").environ, PROBE_OUT=str(work / f"probe-{fname}.json"))
    d = subprocess.run(["node", probe_file, (S / "styles" / fx["style"] / "backend.mjs").as_uri(), str(tl), str(P / "captions/captions.json"), str(P),
                        str(P / "topic-full.js"), str(P / "topic-framed.js"), str(bad), str(overlap), json.dumps(times)], capture_output=True, text=True, encoding="utf-8", env=env)
    pr = jload(work / f"probe-{fname}.json")
    if not pr or "error" in (pr.get("full") or {}):
        check(f"{name}: direct session probe ran", False, err=(d.stdout + d.stderr)[-400:], full=(pr.get("full") or {}).get("error"))
        continue
    full, rows = pr["full"], pr["full"]["rows"]
    check(f"{name}: caption contract carries measured word times for every word-group cue", pr["cueCount"] and all(n > 0 for n in pr["contractWords"]), words=pr["contractWords"])
    by_id = {str(i + 1): c for i, c in enumerate(caps["cues"])}
    text, wrong = timeline["text"]["speech"], []
    for r in rows:  # expected: the latest timeline word inside the active cue whose measured start <= t
        cue = by_id.get(r["cid"] or "")
        if not cue:
            continue
        ref = cue["text_ref"]
        started = [w for w in words if ref["start"] <= w["text_ref"]["start"] and w["text_ref"]["end"] <= ref["end"] and w["start"] / RATE <= r["t"] + 1e-9]
        want = text[started[-1]["text_ref"]["start"]:started[-1]["text_ref"]["end"]] if started else None
        if r["word"] != want:
            wrong.append((r["t"], r["word"], want))
    check(f"{name}: the emphasised word is the latest measured word that has started (never ahead of speech)", rows and not wrong, mismatches=wrong[:4], probed=len(rows))
    check(f"{name}: no findings at any probed frame (safe area, labels, caption layout, caption box stable within each cue)",
          not any(r["findings"] or r["outside"] for r in rows), findings=[(r["t"], r["findings"], r["outside"]) for r in rows if r["findings"] or r["outside"]][:3])
    h0 = next(r for r in rows if r["t"] == 0.0)["hook"] or {}
    h1 = next(r for r in rows if r["t"] == 2.5)["hook"] or {}
    summ = full.get("presentation") or {}
    check(f"{name}: hook fully visible from the first frame, whole key word highlighted, gone after hook.until",
          h0.get("opacity") == 1 and h0.get("visible") and h1.get("visible") is False and (summ.get("hook") or {}).get("key") == hl, first=h0, late=h1, summary=summ.get("hook"))
    check(f"{name}: install summary reports full-bleed with emphasis on every cue", summ.get("mode") == "full-bleed" and summ.get("emphasisCues") == summ.get("captionCues") == pr["cueCount"]
          and full["describe"].get("presentation") == "full-bleed", summary={k: summ.get(k) for k in ("mode", "emphasisCues", "captionCues", "shotPositions")})
    fr = pr.get("framed") or {}
    check(f"{name}: legacy framed topic installs without presentation (original layout, no hook, no emphasis state)",
          fr.get("presentation") is None and (fr.get("describe") or {}).get("presentation") == "framed" and fr.get("hook") is None and fr.get("word") is None and not fr.get("findings"),
          framed={k: fr.get(k) for k in ("presentation", "describe", "error", "findings")})
    ov = pr.get("overlap")
    check(f"{name}: a hook left on screen over a label is reported by preflight", isinstance(ov, list) and any(f[0] == "caption-layout" and f[1] == "hook" for f in ov), findings=ov)
    badr = pr.get("bad", {})
    check(f"{name}: invalid presentation specs are refused (partial-word highlight, missing highlight, unknown mode, bad caption position)",
          len(badr) == 4 and all(isinstance(v, dict) and "Presentation:" in v.get("error", "") for v in badr.values()),
          bad={k: (v if isinstance(v, str) else v.get("error", "")[:90]) for k, v in badr.items()})

# ---------- compact motion preview (Tech, Telugu, full-bleed) ----------
if a.preview:
    P, tl = projects["tech-te-IN"]
    fx = FX["tech"]
    c, o, e = run("node", S / "render.mjs", *common(P, fx, "te-IN", "topic-full.js", "captions/captions.json"), "--scale", "0.5", "--name", "full-bleed-preview.mp4", "--out", "render/preview")
    ev = jload(P / "render/preview/full-bleed-preview-evidence.json")
    timings["preview"] = {k: ev.get(k) for k in ("wallSeconds", "frames", "checkpoint") if k in ev}
    check("full-bleed motion preview renders, decodes and passes media checks", c == 0 and ev.get("failures") == [], out=(o + e)[-260:])
    mp4 = P / "render/preview/full-bleed-preview.mp4"
    if mp4.exists():
        c, _, e = run("ffmpeg", "-v", "error", "-y", "-i", mp4, "-vf", "fps=2,scale=270:-1,tile=6x2:padding=6:color=0x222222", "-frames:v", "1", work / "motion-sheet.png")
        check("motion sheet written", c == 0, err=e[-200:])

# ---------- before/after contact sheets (framed row over full-bleed row) ----------
for name, modes in sheets.items():
    fr, fu = modes.get("framed", []), modes.get("full", [])
    if not fr or len(fr) != len(fu):
        check(f"{name}: before/after sheet", False, framed=len(fr), full=len(fu)); continue
    n = len(fr)
    args = ["ffmpeg", "-v", "error", "-y"] + sum((["-i", str(k)] for k in fr + fu), [])
    fc = "".join(f"[{i}:v]scale=-1:640[v{i}];" for i in range(2 * n)) + "".join(f"[v{i}]" for i in range(n)) + f"hstack={n}[top];" + \
        "".join(f"[v{i}]" for i in range(n, 2 * n)) + f"hstack={n}[bot];[top][bot]vstack=2"
    c, _, e = run(*args, "-filter_complex", fc, str(work / f"before-after-{name}.png"))
    check(f"{name}: before/after contact sheet written", c == 0, err=e[-200:])

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "presentation-timings.json").write_text(json.dumps(timings, indent=2) + "\n", encoding="utf-8")
(work / "presentation-test-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - work: {work}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
