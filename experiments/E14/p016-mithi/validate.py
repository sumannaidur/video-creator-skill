"""P016 per-locale validation of Mithi samples (system Python; no synthesis).

For each sample, independently checks:
- the sample-exact duration total against the WAV;
- full word and phrase coverage and Unicode text slices;
- the provider-independent validator;
- a two-segment combine;
- ledger completion;
- repeated-word cue resolution with the plan resolver;
- SRT/WebVTT caption build and check.

Writes validation-results.json next to this script.
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import wave

HERE = Path(__file__).resolve().parent
S = HERE.parents[2] / "skills/video-creator/scripts"
SAMPLES = {"kn-IN": ("kn-IN-vaidehi-sample", "ಮಳೆ"), "ta-IN": ("ta-IN-malini-sample", "மழை"),
           "en-IN": ("en-IN-anirban-sample-v2", "the"), "hi-IN": ("hi-IN-charvi-sample", "बारिश")}
digest = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
work = HERE / "integration"
shutil.rmtree(work, ignore_errors=True); work.mkdir()


def py(*args):
    return subprocess.run([sys.executable, "-I", *map(str, args)], capture_output=True, text=True, encoding="utf-8")


def write(root, rel, obj):
    p = Path(root) / rel; p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8"); return p


results = {}
for locale, (stem, repeated) in SAMPLES.items():
    r, checks = {}, {}
    nar = HERE / "project/narration"
    raw = json.loads((nar / f"{stem}.raw-duration.json").read_text(encoding="utf-8"))
    tl = json.loads((nar / f"{stem}.timeline.json").read_text(encoding="utf-8"))
    mapping = json.loads((nar / f"{stem}.mapping.json").read_text(encoding="utf-8"))
    with wave.open(str(nar / f"{stem}.wav")) as w:
        frames, rate, ch = w.getnframes(), w.getframerate(), w.getnchannels()
    words = [x for x in tl["records"] if x["kind"] == "word"]
    phrases = [x for x in tl["records"] if x["kind"] == "phrase"]
    text = tl["text"]["speech"]
    checks["durations_equal_samples"] = sum(raw["durations"]) * raw["samples_per_duration_unit"] == frames == tl["audio"]["sample_count"]
    checks["audio_pcm16_mono_24k"] = rate == 24000 and ch == 1
    checks["audio_hash_matches"] = digest(nar / f"{stem}.wav") == tl["audio"]["sha256"] == raw["audio_sha256"]
    checks["all_words_mapped"] = bool(words) and all(x["source"] == "native_model" for x in words) and len(words) == len(text.split())
    checks["all_phrases_mapped"] = bool(phrases) and all(x["source"] == "native_model" for x in phrases)
    checks["unicode_slices"] = all(text[x["text_ref"]["start"]:x["text_ref"]["end"]] == x["label"] for x in words + phrases)
    checks["ordered_words"] = all(a["end"] <= b["start"] for a, b in zip(words, words[1:]))
    checks["unreviewed_model_predicted"] = tl["validation"] == "unreviewed" and tl["timing"]["method"] == "native_durations"
    checks["provenance"] = bool(raw["model"]["revision"]) and len(raw["model"]["files"]) == 10 and raw["voice"] and raw["runtime"]["device"] == "cpu"
    r["mapping_method"] = sorted({x["mapping"]["method"] for x in words})
    # Integration: two segments, ledger, plan cue on a repeated word, captions.
    cfg = work / f"{locale}.json"
    py(S / "preferences.py", "resolve", f"locale={locale}", "--store", work / "prefs.json", "--json", cfg)
    P = Path(json.loads(py(S / "project.py", "init", "--root", work / "projects", "--topic", f"p016 {locale}", "--config", cfg).stdout)["created"]["project"])

    def complete(stage, outputs):
        py(S / "project.py", "start", P, stage)
        ev = write(P, f"qa/{stage}.json", {"passed": True})
        d = py(S / "project.py", "complete", P, stage, *sum((["--output", o] for o in outputs), []), "--evidence", ev)
        assert d.returncode == 0, d.stderr

    complete("research", [write(P, "research/claims.json", {"claims": []})])
    complete("script", [write(P, "script/script.json", {"generic": True})])
    shutil.copy(nar / f"{stem}.wav", P / "seg.wav") if False else None
    (P / "narration/segments").mkdir(parents=True)
    shutil.copy(nar / f"{stem}.wav", P / "narration/segments/seg.wav")
    tl["audio"]["path"] = "narration/segments/seg.wav"
    write(P, "narration/segments/seg.timeline.json", tl)
    d = py(S / "narration/narrate.py", "validate", "--project", P, "narration/segments/seg.timeline.json")
    checks["validator"] = d.returncode == 0
    d = py(S / "narration/narrate.py", "combine", "--project", P, "--id", "two", "--gap-ms", "300", "--out-wav", "narration/narration.wav",
           "--out-timeline", "narration/narration.timeline.json", "s1=narration/segments/seg.timeline.json", "s2=narration/segments/seg.timeline.json")
    checks["combine_two_segments"] = d.returncode == 0
    if d.returncode:
        r["combine_error"] = d.stderr[-300:]
    else:
        combined = json.loads((P / "narration/narration.timeline.json").read_text(encoding="utf-8"))
        complete("narration", [P / "narration/narration.wav", P / "narration/narration.timeline.json"])
        cw = [x for x in combined["records"] if x["kind"] == "word"]
        target = [x for x in cw if x["segment"] == "s2" and x["label"].strip(",.!?") == repeated]
        plan = dict(schema="video-creator.creative-plan", version=1, narration=dict(timeline="narration/narration.timeline.json", sha256=digest(P / "narration/narration.timeline.json")),
                    style="paper-explainer", style_reason="validation", guardrails=["none"], story=[dict(segment="s1", role="hook", idea="a"), dict(segment="s2", role="resolution", idea="b")],
                    motifs=[dict(id="m1", stands_for="x")], assets=[dict(id="a1", kind="original", description="x")],
                    shots=[dict(id="x", purpose="p", objects=[dict(id="o1", asset="a1", description="x")],
                                cues=[dict(id="rep", object="o1", action="a", at={"word": repeated, "segment": "s2", "occurrence": len(target)})])])
        write(P, "plan/creative-plan.json", plan)
        d = py(S / "plan.py", "resolve", P)
        res = json.loads((P / "plan/resolved-plan.json").read_text(encoding="utf-8")) if d.returncode == 0 else {}
        cue = res.get("shots", [{}])[0].get("cues", [{}])[0] if res else {}
        checks["repeated_word_cue"] = d.returncode == 0 and len(target) >= 1 and cue.get("at", {}).get("sample") == target[-1]["start"] \
            and cue["at"].get("timing_source") == "native_model"
        r["repeated_word"] = dict(word=repeated, occurrences_in_s2=len(target), err=d.stderr[-200:])
        d = py(S / "captions.py", "build", P)
        caps = json.loads((P / "captions/captions.json").read_text(encoding="utf-8")) if d.returncode == 0 else {}
        texts = " ".join(c["text"] for c in caps.get("cues", []))
        checks["captions_build"] = d.returncode == 0 and texts.split() == combined["text"]["display"].split() \
            and (P / "captions/captions.srt").exists() and (P / "captions/captions.vtt").read_text(encoding="utf-8").startswith("WEBVTT")
        checks["captions_check"] = py(S / "captions.py", "check", P).returncode == 0
        r["caption_cues"] = len(caps.get("cues", []))
    r["checks"] = checks
    r["ready"] = all(checks.values())
    r["seconds"] = frames / rate
    r["synthesis_seconds"] = round(raw["synthesis_seconds"], 3)
    r["peak_rss_mib"] = round(raw["peak_rss_bytes"] / 2 ** 20, 1)
    r["peak_dbfs"] = round(20 * __import__("math").log10(max(raw["peak_abs_sample"], 1) / 32768), 1)
    r["full_scale_samples"] = raw["full_scale_samples"]
    results[locale] = r
    print(locale, "READY" if r["ready"] else "FAILED", {k: v for k, v in checks.items() if not v})
(HERE / "validation-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
