"""P014.8 caption tests: synthetic typography timelines (kn, hi, te, ta, en-IN; silent audio, no TTS). They test caption
timing, text and layout only; they say nothing about narration quality in those languages. Needs Chromium for keyframes/preflight.

python -I scripts/tests/test_captions.py [--work <folder outside the package>]
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
import wave

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-caption-tests"))
work = Path(ap.parse_args().work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
S = pkg / "scripts"
CARDS = S / "tests" / "fixtures" / "cards-topic.js"
results = []
digest = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
snapshot = lambda: {p.relative_to(pkg).as_posix(): digest(p) for p in sorted(pkg.rglob("*")) if p.is_file()}
before = snapshot()
RATE = 24000


def check(name, ok, **detail):
    results.append(dict(name=name, ok=bool(ok), **detail))
    print(("PASS " if ok else "FAIL ") + name.encode("ascii", "backslashreplace").decode() + " " + json.dumps(detail, ensure_ascii=True)[:300])


def run(*args):
    done = subprocess.run(list(map(str, args)), capture_output=True, text=True, encoding="utf-8")
    return done.returncode, (done.stdout + done.stderr).strip(), done.stdout


def py(*args):
    return run(sys.executable, "-I", *args)


def write(project, rel, obj):
    path = Path(project) / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def timeline(project, locale, segments, shift=0.0):
    """segments: [(id, text, length_s, unmapped_word_indexes)] -> silent WAV + timeline. Words are spread evenly over
    each segment (0.2 s lead), so times are synthetic but sample-exact; listed words get no timing (source null)."""
    total = round(sum(n for _, _, n, _ in segments) * RATE)
    wav = Path(project) / "narration/narration.wav"
    wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(b"\0\0" * total)
    text, records, offset = "", [], 0
    for sid, seg_text, n, unmapped in segments:
        text += " " if text else ""
        base, tokens = len(text), seg_text.split(" ")
        span = (n - .5) / len(tokens)
        words = []
        for i, tok in enumerate(tokens):
            lo = len(text); text += tok + (" " if i + 1 < len(tokens) else "")
            st, en = offset + round((.2 + shift + i * span) * RATE), offset + round((.2 + shift + (i + 1) * span) * RATE)
            mapped = i not in unmapped
            words.append(dict(kind="word", label=tok, start=st if mapped else None, end=en if mapped else None, source="forced_alignment" if mapped else None,
                              segment=sid, text_ref=dict(field="speech", start=lo, end=lo + len(tok))))
        records += words + [dict(kind="phrase", label=seg_text, start=offset + round((.2 + shift) * RATE), end=offset + round((.2 + shift + len(tokens) * span) * RATE),
                                 source="forced_alignment", segment=sid, text_ref=dict(field="speech", start=base, end=len(text)))]
        offset += round(n * RATE)
    return wav, write(project, "narration/narration.timeline.json", dict(
        version=1, unit="sample", locale=locale, validation="unreviewed", run_id="synthetic", timing=dict(method="forced_alignment", provider="synthetic-test"),
        audio=dict(path="narration/narration.wav", sha256=digest(wav), sample_rate=RATE, sample_count=total), text=dict(display=text, speech=text),
        records=sorted(records, key=lambda r: (r["kind"] != "word", r["text_ref"]["start"]))))


def complete(project, stage, outputs):
    py(S / "project.py", "start", project, stage)
    ev = write(project, f"qa/{stage}-{digest(outputs[-1])[:8]}.json", {"passed": True})
    code, out, _ = py(S / "project.py", "complete", project, stage, *sum((["--output", o] for o in outputs), []), "--evidence", ev)
    assert code == 0, out


def project(name, locale, segments, *prefs):
    cfg = work / f"cfg-{name}.json"
    py(S / "preferences.py", "resolve", f"locale={locale}", *prefs, "--store", work / "prefs.json", "--json", cfg)
    code, out, stdout = py(S / "project.py", "init", "--root", work / "projects", "--topic", name, "--config", cfg)
    P = Path(json.loads(stdout)["created"]["project"])
    complete(P, "research", [write(P, "research/claims.json", {"claims": []})])
    complete(P, "script", [write(P, "script/script.json", {"generic": True})])
    wav, tl = timeline(P, locale, segments)
    complete(P, "narration", [wav, tl])
    return P, tl


def build(P, *args):
    code, out, stdout = py(S / "captions.py", "build", P, *args)
    doc = json.loads((P / "captions/captions.json").read_text(encoding="utf-8")) if code == 0 else {}
    return code, out, doc


def ms(sample):
    return round(sample * 1000 / RATE)


def parse_subs(path, kind):
    blocks = [b for b in path.read_text(encoding="utf-8").split("\n\n") if b.strip()]
    if kind == "vtt":
        assert blocks[0] == "WEBVTT"; blocks = blocks[1:]
    out = []
    for b in blocks:
        lines = b.split("\n")
        m = re.fullmatch(r"(\d\d):(\d\d):(\d\d)[,.](\d{3}) --> (\d\d):(\d\d):(\d\d)[,.](\d{3})", lines[1])
        t = [int(x) for x in m.groups()]
        out.append((lines[0], (t[0] * 3600 + t[1] * 60 + t[2]) * 1000 + t[3], (t[4] * 3600 + t[5] * 60 + t[6]) * 1000 + t[7], "\n".join(lines[2:])))
    return out


def render(P, out, *extra, topic=CARDS):
    return run("node", S / "render.mjs", "--project", P, "--topic", topic, "--timeline", "narration/narration.timeline.json", "--out", out, "--keys-only", *extra)


def preflight(P, out, *extra, topic=CARDS):
    code, text, _ = run("node", S / "preflight.mjs", "--project", P, "--topic", topic, "--timeline", "narration/narration.timeline.json", "--out", out, *extra)
    res = json.loads((Path(out) / "preflight.json").read_text(encoding="utf-8")) if (Path(out) / "preflight.json").exists() else {}
    return code, text, res


# Three segments each (the cards fixture shows one card per phrase). Repeated words, compounds, conjuncts and vowel signs.
LOCALES = {
    "hi-IN": [("s1", "एयरलाइंस अलग-अलग कीमतों पर सीटें बेचती हैं।", 3.4, ()), ("s2", "कीमत बदलती है, कीमत फिर बदलती है।", 3.0, ()),
              ("s3", "स्थिति और क्षमता के अनुसार दाम तय होते हैं।", 3.2, ())],
    "kn-IN": [("s1", "ಮರ ನೆರಳು ಕೊಡುತ್ತದೆ।", 2.4, ()), ("s2", "ಮರ ಮತ್ತೆ ಮರ ಕ್ಷೇತ್ರದಲ್ಲಿ ಬೆಳೆಯುತ್ತದೆ।", 3.0, ()), ("s3", "ಸ್ವಲ್ಪ ನೀರು ಸಾಕು।", 2.2, ())],
    "te-IN": [("s1", "చెట్లు నీడను ఇస్తాయి.", 2.4, ()), ("s2", "శ్రద్ధగా చూస్తే చెట్లు చెట్లు కావు.", 3.0, ()), ("s3", "ప్రకృతి సమతుల్యం.", 2.0, ())],
    "ta-IN": [("s1", "மரங்கள் நிழல் தருகின்றன.", 2.6, ()), ("s2", "க்ஷேத்திரத்தில் மரம் மரம் வளர்கிறது.", 3.0, ()), ("s3", "ஸ்ரீ நகரம் பசுமை.", 2.2, ())],
    "en-IN": [("s1", "Trees give shade; well-known trees give more shade.", 3.4, ()), ("s2", "Shade, shade and shade again.", 2.4, ()),
              ("s3", "A long sentence that keeps going across many words so it must be split into several captions at measured word boundaries.", 6.0, ())],
}
projects = {}
for loc, segs in LOCALES.items():
    P, tl = project(loc, loc, segs)
    projects[loc] = (P, tl)
    code, out, doc = build(P)
    speech = json.loads(tl.read_text(encoding="utf-8"))["text"]["speech"]
    cues = doc.get("cues", [])
    exact = all(c["text"] == speech[c["text_ref"]["start"]:c["text_ref"]["end"]] for c in cues)
    rebuilt = " ".join(c["text"] for c in cues) == " ".join(speech.split())
    whole = all(unicodedata.category(c["text"][0])[0] != "M" for c in cues)  # no cue starts inside a grapheme cluster
    check(f"{loc}: captions keep the exact Unicode text, complete and in order", code == 0 and exact and rebuilt and whole and doc["locale"] == loc
          and doc["narration"]["timeline_sha256"] == digest(tl) and doc["narration"]["timing_status"] == "unreviewed"
          and doc["review"]["language"].startswith("pending"), cues=len(cues), out=out[-160:])
    subs_ok = True
    for kind in ("srt", "vtt"):
        parsed = parse_subs(P / f"captions/captions.{kind}", kind)
        subs_ok &= [p[3] for p in parsed] == [c["text"] for c in cues]
        subs_ok &= all(p[1] == ms(c["start_sample"]) and p[2] == ms(c["end_sample"]) and p[1] < p[2] for p, c in zip(parsed, cues))
        subs_ok &= all(parsed[i][1] >= parsed[i - 1][2] for i in range(1, len(parsed)))
        subs_ok &= [p[0] for p in parsed] == ([str(i) for i in range(1, len(cues) + 1)] if kind == "srt" else [c["id"] for c in cues])
    check(f"{loc}: SRT and WebVTT carry the same text with sample-derived, ordered, non-overlapping times", subs_ok)

P, tl = projects["hi-IN"]
doc = json.loads((P / "captions/captions.json").read_text(encoding="utf-8"))
check("compound word अलग-अलग stays whole inside one cue", any("अलग-अलग" in c["text"] for c in doc["cues"]) and not any(c["text"].endswith("अलग-") for c in doc["cues"]))

# Word grouping: repeated words get their own measured times (no shared or invented times).
code, out, wd = build(P, "--mode", "words", "--max-words", "2")
s2 = [c for c in wd.get("cues", []) if c["segment"] == "s2"]
check("word grouping splits repeated words at their own measured times (and after clause punctuation)", code == 0
      and [c["text"] for c in s2] == ["कीमत बदलती", "है,", "कीमत फिर", "बदलती है।"] and len({c["start_sample"] for c in s2}) == 4, texts=[c["text"] for c in s2], out=out[-120:])
build(P)  # back to phrase captions for the rendering checks below

# Long captions: split at measured word boundaries; when the words are unmapped no split is possible and nothing is cut.
E, _ = projects["en-IN"]
code, out, ed = build(E, "--max-chars", "30")
s3 = [c for c in ed["cues"] if c["segment"] == "s3"]
check("long phrase split into several cues, text intact", len(s3) >= 3 and " ".join(c["text"] for c in s3) == LOCALES["en-IN"][2][1], parts=len(s3))
U, utl = project("unmapped", "en-IN", [("s1", LOCALES["en-IN"][2][1], 6.0, set(range(1, 21)))])
code, out, ud = build(U, "--max-chars", "30")
check("long phrase with unmapped inner words stays one flagged cue, never truncated or timed by guess", code == 0 and len(ud["cues"]) == 1
      and ud["cues"][0]["long"] is True and ud["cues"][0]["text"] == LOCALES["en-IN"][2][1], out=out[-120:])

# Configurations: disabled, subtitle-only, single subtitle format.
D, _ = project("disabled", "hi-IN", LOCALES["hi-IN"], "captions.enabled=false")
code, out, dd = build(D)
check("captions disabled: no cues and no subtitle files", code == 0 and dd["cues"] == [] and dd["files"] == {} and not (D / "captions/captions.srt").exists(), out=out[-120:])
O, _ = project("subs-only", "hi-IN", LOCALES["hi-IN"], "captions.burn_in=false", 'captions.subtitle_files=["vtt"]')
code, out, od = build(O)
check("subtitle-only: VTT exported, SRT not requested, burn-in off", code == 0 and od["config"]["burn_in"] is False and sorted(od["files"]) == ["vtt"]
      and not (O / "captions/captions.srt").exists() and od["cues"], out=out[-160:])
code, out, _ = render(O, O / "render/keys", "--captions", "captions/captions.json")
ev = json.loads((O / "render/keys/keys-evidence.json").read_text(encoding="utf-8")) if code == 0 else {}
check("subtitle-only render burns in no captions", code == 0 and ev.get("captions") == [], out=out[-160:])

# Rendering with the artifact: portrait (hi) and landscape (ta) keyframes; preflight caption layout passes on both.
code, out, _ = render(P, P / "render/portrait", "--captions", "captions/captions.json")
ev = json.loads((P / "render/portrait/keys-evidence.json").read_text(encoding="utf-8")) if code == 0 else {}
check("portrait keyframes render artifact captions", code == 0 and [c["text"] for c in ev.get("captions", [])] == [c["text"] for c in doc["cues"]]
      and ev["inputs"]["captions"]["sha256"] == digest(P / "captions/captions.json") and ev["settings"]["captions"] == "artifact", out=out[-160:])
T, _ = projects["ta-IN"]
code, out, _ = render(T, T / "render/landscape", "--captions", "captions/captions.json", "--width", "1920", "--height", "1080")
check("landscape keyframes render artifact captions", code == 0, out=out[-160:])
layout = {}
for loc in LOCALES:
    Q, _ = projects[loc]
    for name, size in (("portrait", []), ("landscape", ["--width", "1920", "--height", "1080"])):
        code, text, res = preflight(Q, Q / f"qa/pre-{name}", "--captions", "captions/captions.json", *size)
        layout[f"{loc}/{name}"] = (res.get("checks", {}).get("caption-layout", {}).get("status"), res.get("status"), [d["type"] + ":" + d["object"] for d in res.get("defects", [])][:3])
check("caption layout passes for all five locales in portrait and landscape", all(v[0] == "passed" and v[1] == "passed" for v in layout.values()), layout=layout)
code, text, res = preflight(P, P / "qa/pre-narrow", "--captions", "captions/captions.json", "--width", "540", "--height", "960")
check("narrow canvas: compound words and graphemes stay whole when wrapping", res.get("checks", {}).get("caption-layout", {}).get("status") == "passed"
      or not any("broken" in json.dumps(d) or "grapheme" in json.dumps(d) for d in res.get("defects", [])), defects=[d["evidence"].get("reason") for d in res.get("defects", [])][:4])

# Overflow: a one-line limit with long cues is detected, with frame, time and evidence.
code, out, _ = build(E, "--max-chars", "120", "--max-lines", "1")
code, text, res = preflight(E, E / "qa/pre-overflow", "--captions", "captions/captions.json")
over = [d for d in res.get("defects", []) if d["type"] == "caption-layout"]
check("preflight detects captions exceeding the line limit", code == 1 and over and over[0]["evidence"]["reason"] == "more lines than allowed"
      and over[0]["evidence"]["lines"] > 1, first=({k: over[0][k] for k in ("object", "firstFrame", "seconds")} | {"lines": over[0]["evidence"]["lines"]}) if over else None, out=text[-160:])
code, out, _ = render(E, E / "render/bad", "--captions", "captions/captions.json", "--preflight", "qa/pre-overflow/preflight.json")
check("renderer refuses that failed preflight", code == 1 and "[preflight-failed]" in out, out=out[-120:])

# Stale and invalid artifacts.
K, ktl = projects["kn-IN"]
code, out, kd = build(K)
wav2, tl2 = timeline(K, "kn-IN", LOCALES["kn-IN"], shift=.1)
py(S / "project.py", "verify", K)
complete(K, "narration", [wav2, tl2])
code, out, _ = py(S / "captions.py", "check", K)
check("captions.py check rejects captions built from an older narration", code == 1 and "[stale-captions]" in out, out=out[-120:])
code, out, _ = render(K, K / "render/stale", "--captions", "captions/captions.json")
check("renderer rejects stale captions", code == 1 and "[stale-captions]" in out, out=out[-120:])
code, out, kd2 = build(K)
check("rebuilt captions follow the new narration timing", code == 0 and kd2["cues"][0]["start_sample"] == kd["cues"][0]["start_sample"] + round(.1 * RATE))
bad = dict(kd2, cues=[kd2["cues"][1] | {"id": "x"}, kd2["cues"][0]] + kd2["cues"][2:])
write(K, "captions/overlap.json", bad)
code, out, _ = render(K, K / "render/overlap", "--captions", "captions/overlap.json")
check("renderer rejects overlapping or out-of-order cues", code == 1 and "[invalid-captions]" in out, out=out[-120:])
N, ntl = project("unmapped-phrase", "hi-IN", LOCALES["hi-IN"])
t = json.loads(ntl.read_text(encoding="utf-8"))
for r in t["records"]:
    if r["kind"] == "phrase" and r["segment"] == "s2":
        r.update(start=None, end=None, source=None)
write(N, "narration/narration.timeline.json", t)
py(S / "project.py", "verify", N)
complete(N, "narration", [N / "narration/narration.wav", N / "narration/narration.timeline.json"])
code, out, _ = build(N)
check("unmapped phrase timing is rejected, never invented", code == 1 and "[unmapped-reference]" in out, out=out[-120:])
code, out, _ = render(P, P / "render/nocap", "--no-captions")
ev = json.loads((P / "render/nocap/keys-evidence.json").read_text(encoding="utf-8")) if code == 0 else {}
check("--no-captions hides captions and is part of the configuration", code == 0 and ev.get("captions") == [] and ev["settings"]["captions"] == "off", out=out[-120:])

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "caption-test-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed - results: {work / 'caption-test-results.json'}")
sys.exit(0 if all(x["ok"] for x in results) else 1)
