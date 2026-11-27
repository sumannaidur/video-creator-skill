"""P015.2B Mithi native word/phrase timing tests (system Python; no WSL, model or synthesis needed).

python -I scripts/tests/test_mithi_timing.py [--sample <dir with a Mithi WAV + timeline>] [--work <folder outside the package>]

Unit part: re-maps the recorded raw evidence of a real Mithi te-IN inference (fixtures/mithi-te-phrases.raw-duration.json)
and checks every rejection path. Integration part (with --sample): the real Mithi audio and timeline go through the
segment combiner, the ledger, the creative-plan resolver (repeated words) and the caption builder.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

SOURCE = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument("--sample", help="folder containing te-IN-ahana-phrases.wav and .timeline.json from a real Mithi run")
ap.add_argument("--work", default=str(Path(tempfile.gettempdir()) / "vc-mithi-timing-tests"))
a = ap.parse_args()
work = Path(a.work).resolve()
shutil.rmtree(work, ignore_errors=True)
pkg = work / "installed" / "video-creator"
shutil.copytree(SOURCE, pkg, ignore=shutil.ignore_patterns("test-*results.json", "__pycache__"))
S = pkg / "scripts"
sys.dont_write_bytecode = True
sys.path.insert(0, str(S / "narration" / "providers"))
from mithi_mapping import MappingError, map_timeline  # noqa: E402

digest = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
snapshot = lambda: {p.relative_to(pkg).as_posix(): digest(p) for p in sorted(pkg.rglob("*")) if p.is_file() and "__pycache__" not in p.parts}
before = snapshot()
results = []


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


raw = json.loads((SOURCE / "scripts/tests/fixtures/mithi-te-phrases.raw-duration.json").read_text(encoding="utf-8"))
text = raw["speech_text"]

# 1. Complete mapping from the real inference evidence.
records, evidence = map_timeline(text, raw)
words = [r for r in records if r["kind"] == "word"]
phrases = [r for r in records if r["kind"] == "phrase"]
check("all text words and phrases mapped with native_model timing", len(words) == len(text.split()) == 17 and len(phrases) == 7
      and all(r["source"] == "native_model" for r in words + phrases), words=len(words), phrases=len(phrases))
check("durations account for every audio sample", sum(raw["durations"]) * raw["samples_per_duration_unit"] == raw["sample_count"])
check("labels and offsets are slices of the original Unicode text", all(text[w["text_ref"]["start"]:w["text_ref"]["end"]] == w["label"] for w in words + phrases))
check("words are ordered, non-overlapping and inside the audio", all(0 <= x["start"] < x["end"] <= y["start"] for x, y in zip(words, words[1:]))
      and words[-1]["end"] <= raw["sample_count"])
check("phrases span exactly their first to last word", all(p["start"] == words[p["mapping"]["first_word"]]["start"]
      and p["end"] == words[p["mapping"]["stop_word"] - 1]["end"] for p in phrases))
rain = [w for w in words if w["label"] == "వాన"]
check("repeated word has two distinct native spans", len(rain) == 2 and rain[0]["end"] <= rain[1]["start"], spans=[(w["start"], w["end"]) for w in rain])
pauses = [r for r in records if r["kind"] == "pause"]
check("spaces, punctuation and edges become pauses, never word time", pauses and all(
      not (p["start"] < w["end"] and w["start"] < p["end"]) for p in pauses for w in words), pauses=len(pauses))
check("mapping is deterministic from the recorded evidence", map_timeline(text, raw)[0] == records)

# 2. A hyphenated text word spanning two model words (model splits hyphens) maps to their union.
joined = text.replace("అమ్మా, ఈ", "అమ్మా,-ఈ", 1)
hy = [r for r in map_timeline(joined, raw)[0] if r["kind"] == "word"]
check("hyphenated text word spans its model words", len(hy) == 16 and hy[0]["label"] == "అమ్మా,-ఈ" and hy[0]["start"] == words[0]["start"]
      and hy[0]["end"] == words[1]["end"])


# 3. Invalid or inconsistent evidence is rejected with an explicit code (never estimated).
def mutate(fn):
    r = copy.deepcopy(raw); fn(r); return r


first_phoneme_of_word2 = next(k for k, e in enumerate(raw["decoded_to_encoder"]) if raw["token_word"][e] == 2)
phoneme_k = next(k for k, t in enumerate(raw["decoded_ids"]) if 0 < k and t not in raw["special_ids"]["punctuation"]
                 and t != raw["special_ids"]["space"])
cases = [("duration total differs from audio", text, mutate(lambda r: r.update(sample_count=r["sample_count"] + 600)), "duration-sample-mismatch"),
         ("token groups differ from model words", text, mutate(lambda r: r.update(model_word_groups=r["model_word_groups"] - 1)), "word-group-mismatch"),
         ("text word differs from the model's word", text.replace("వాన", "వర్షం", 1), raw, "word-mismatch"),
         ("text word missing (model words left over)", text.rsplit(" ", 1)[0], raw, "word-mismatch"),
         ("standalone punctuation word", text.replace("ఆకాశం", "— ఆకాశం", 1), raw, "untimed-word"),
         ("interrupted word ownership", text, mutate(lambda r: r["token_word"].__setitem__(r["decoded_to_encoder"][first_phoneme_of_word2], 0)), "non-contiguous-word"),
         ("phoneme without an owner", text, mutate(lambda r: r["token_word"].__setitem__(r["decoded_to_encoder"][phoneme_k], -1)), "orphan-phoneme"),
         ("decoded token not from the encoder", text, mutate(lambda r: r["decoded_ids"].__setitem__(phoneme_k, -5)), "token-correspondence"),
         ("duration list shorter than tokens", text, mutate(lambda r: (r["durations"].pop(), r.update(sample_count=sum(r["durations"]) * 600))), "token-count-mismatch")]
for name, t, r, code in cases:
    try:
        map_timeline(t, r); got = None
    except MappingError as error:
        got = error.code
    check(f"rejects {name}", got == code, got=got)

# 3b. P016: English apostrophe contractions (model word split "it's" -> "it", "s"; one phoneme group per contraction).
en = json.loads((SOURCE / "scripts/tests/fixtures/mithi-en-contractions.raw-duration.json").read_text(encoding="utf-8"))
er, _ = map_timeline(en["speech_text"], en)
ew = [r for r in er if r["kind"] == "word"]
check("en-IN contractions reconcile to one word per phoneme group", len(ew) == len(en["speech_text"].split()) == en["model_word_groups"] == 18
      and [w["label"] for w in ew if "'" in w["label"]] == ["it's", "doesn't", "Let's"] and all(w["mapping"]["method"] == "mithi_group_ownership_apostrophe_reconciled" for w in ew))
try:
    map_timeline(en["speech_text"].replace("it's", "its", 1), en); got = None
except MappingError as error:
    got = error.code
check("a model/group split mismatch without an apostrophe is still rejected", got == "word-group-mismatch", got=got)

# 4. Integration with the real Mithi audio: combiner, ledger, repeated-word cue resolution, Telugu captions.
if a.sample:
    sample = Path(a.sample)
    cfg = work / "te.json"
    py(S / "preferences.py", "resolve", "locale=te-IN", "--store", work / "prefs.json", "--json", cfg)
    P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", "mithi", "--config", cfg).stdout)["created"]["project"])

    def complete(stage, outputs):
        py(S / "project.py", "start", P, stage)
        ev = write(P, f"qa/{stage}-{digest(outputs[0])[:6]}.json", {"passed": True})
        done = py(S / "project.py", "complete", P, stage, *sum((["--output", o] for o in outputs), []), "--evidence", ev)
        assert done.returncode == 0, done.stderr

    complete("research", [write(P, "research/claims.json", {"claims": []})])
    complete("script", [write(P, "script/script.json", {"generic": True})])
    seg = P / "narration/segments"; seg.mkdir(parents=True)
    tl = json.loads((sample / "te-IN-ahana-phrases.timeline.json").read_text(encoding="utf-8"))
    shutil.copy(sample / "te-IN-ahana-phrases.wav", seg / "te-IN-ahana-phrases.wav")
    tl["audio"]["path"] = "narration/segments/te-IN-ahana-phrases.wav"
    write(P, "narration/segments/te-IN-ahana-phrases.timeline.json", tl)
    done = py(S / "narration/narrate.py", "validate", "--project", P, "narration/segments/te-IN-ahana-phrases.timeline.json")
    check("real Mithi timeline passes the provider-independent validator", done.returncode == 0, err=done.stderr[-200:])
    gap = 7200
    done = py(S / "narration/narrate.py", "combine", "--project", P, "--id", "te-two", "--gap-ms", "300", "--out-wav", "narration/narration.wav",
              "--out-timeline", "narration/narration.timeline.json", "s1=narration/segments/te-IN-ahana-phrases.timeline.json",
              "s2=narration/segments/te-IN-ahana-phrases.timeline.json")
    combined = json.loads((P / "narration/narration.timeline.json").read_text(encoding="utf-8")) if done.returncode == 0 else {"records": []}
    cw = [r for r in combined["records"] if r["kind"] == "word"]
    n = tl["audio"]["sample_count"]
    check("two Mithi segments combine sample-exactly with all words mapped", done.returncode == 0 and len(cw) == 34 and all(r["source"] == "native_model" for r in cw)
          and cw[17]["start"] == cw[0]["start"] + n + gap and combined["audio"]["sample_count"] == 2 * n + gap, err=done.stderr[-200:])
    complete("narration", [P / "narration/narration.wav", P / "narration/narration.timeline.json"])
    obj = [dict(id="o1", asset="a1", motif="m1", description="cloud")]
    plan = dict(schema="video-creator.creative-plan", version=1, narration=dict(timeline="narration/narration.timeline.json",
                sha256=digest(P / "narration/narration.timeline.json")), style="paper-explainer", style_reason="test", guardrails=["none"],
                story=[dict(segment="s1", role="hook", idea="a"), dict(segment="s2", role="resolution", idea="b")],
                motifs=[dict(id="m1", stands_for="rain")], assets=[dict(id="a1", kind="original", description="drawing")],
                shots=[dict(id="x", purpose="p", objects=obj, cues=[dict(id="sky", object="o1", action="b", at={"phrase_index": 2, "segment": "s2"}),
                                                                     dict(id="rain-2", object="o1", action="a", at={"word": "వాన", "segment": "s2", "occurrence": 2})])])
    write(P, "plan/creative-plan.json", plan)
    done = py(S / "plan.py", "resolve", P)
    res = json.loads((P / "plan/resolved-plan.json").read_text(encoding="utf-8")) if done.returncode == 0 else {}
    rain2 = [r for r in cw if r["label"] == "వాన"][3]
    cues = {c["id"]: c for c in (res.get("shots") or [{}])[0].get("cues", [])}
    check("repeated-word cue resolves to the second occurrence in segment s2", done.returncode == 0 and cues["rain-2"]["at"]["sample"] == rain2["start"]
          and cues["rain-2"]["at"]["timing_source"] == "native_model", err=done.stderr[-200:])
    plan["shots"][0]["cues"] = [dict(object="o1", action="a", at={"word": "వాన"})]
    write(P, "plan/creative-plan.json", plan)
    done = py(S / "plan.py", "validate", P)
    check("an unqualified repeated word is rejected as ambiguous", done.returncode == 1 and "[ambiguous-reference]" in done.stderr, err=done.stderr[-160:])
    done = py(S / "captions.py", "build", P)
    caps = json.loads((P / "captions/captions.json").read_text(encoding="utf-8")) if done.returncode == 0 else {}
    srt = (P / "captions/captions.srt").read_text(encoding="utf-8") if done.returncode == 0 else ""
    vtt = (P / "captions/captions.vtt").read_text(encoding="utf-8") if done.returncode == 0 else ""
    texts = " ".join(c["text"] for c in caps.get("cues", []))
    check("Telugu captions build with SRT and WebVTT, text preserved", done.returncode == 0 and texts.split() == combined["text"]["display"].split()
          and "వస్తుందా?" in srt and vtt.startswith("WEBVTT"), cues=len(caps.get("cues", [])), err=done.stderr[-200:])
    done = py(S / "captions.py", "check", P)
    check("caption artifact passes captions.py check", done.returncode == 0, err=(done.stderr or done.stdout)[-200:])

after = snapshot()
check("installed package unchanged", before == after, changed=sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))[:5])
(work / "mithi-timing-test-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{sum(x['ok'] for x in results)}/{len(results)} passed")
sys.exit(0 if all(x["ok"] for x in results) else 1)
