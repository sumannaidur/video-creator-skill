"""Captions and subtitle export from the verified narration timeline (standard library only; any locale, any provider).

  python scripts/captions.py build <project> [--mode phrase|words] [--max-chars 42] [--max-words 6]
                                   [--max-lines 2] [--hold-ms 700] [--out-dir captions]
  python scripts/captions.py check <project> [--captions captions/captions.json]

`build` reads the timeline that the completed narration stage verified, groups phrase or word records into cues, and
writes captions.json (`video-creator.captions` v1) plus the SRT/WebVTT files the project configuration asks for
(`captions.subtitle_files`). Times stay integer samples. Text is the timeline's own text, sliced, never rewritten or cut.
`check` re-validates an artifact against the current narration (stale hashes are rejected).
Exit codes: 0 ok, 1 invalid, 2 usage. Technical validity only: language and readability review stay human gates.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import unicodedata

sys.dont_write_bytecode = True
SCRIPTS = Path(__file__).resolve().parent
PACKAGE = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS / "narration"))
from timeline import validate as validate_timeline  # noqa: E402

SCHEMA, VERSION = "video-creator.captions", 1
BREAK_AFTER = set(".,;:!?।॥。，")  # sentence/clause punctuation incl. Devanagari danda (used by many Indic scripts)


class CaptionError(Exception):
    def __init__(self, code, message):
        super().__init__(f"[{code}] {message}"); self.code = code


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def visible_len(text):
    """Length hint without combining marks (vowel signs, viramas, nuktas); real wrapping is measured at render time."""
    return sum(1 for ch in text if not unicodedata.category(ch).startswith("M") and not ch.isspace())


def verified_timeline(project):
    pj = json.loads((project / "project.json").read_text(encoding="utf-8"))
    nar = pj["stages"]["narration"]
    tl_out = next((o for o in nar["outputs"] if o["path"].endswith(".timeline.json")), None)
    if nar["state"] != "completed" or not tl_out:
        raise CaptionError("narration-not-verified", "captions need the timeline output of the completed narration stage")
    path = project / tl_out["path"]
    if sha(path) != tl_out["sha256"]:
        raise CaptionError("stale-narration", "the narration timeline changed since the narration stage completed")
    timeline = json.loads(path.read_text(encoding="utf-8"))
    validate_timeline(timeline, project)
    return pj, tl_out, timeline


def group_phrase(phrase, words, text, a):
    """Split one phrase into cues at mapped word boundaries; never invents a time and never drops text."""
    ref = phrase["text_ref"]
    inside = sorted((w for w in words if ref["start"] <= w["text_ref"]["start"] and w["text_ref"]["end"] <= ref["end"]), key=lambda w: w["text_ref"]["start"])
    groups, cur = [], []
    for w in inside:
        if cur:
            span = text[cur[0]["text_ref"]["start"]:w["text_ref"]["end"]]
            too_long = visible_len(span) > a.max_chars or (a.mode == "words" and len(cur) >= a.max_words)
            clause = a.mode == "words" and text[cur[-1]["text_ref"]["start"]:cur[-1]["text_ref"]["end"]].rstrip()[-1:] in BREAK_AFTER
            # A cut needs measured times on both sides: the previous word's end and this word's start.
            if (too_long or clause) and cur[-1]["end"] is not None and w["start"] is not None:
                groups.append(cur); cur = []
        cur.append(w)
    if cur:
        groups.append(cur)
    if not groups:
        groups = [[]]
    cues = []
    for i, g in enumerate(groups):
        t0 = ref["start"] if i == 0 else g[0]["text_ref"]["start"]
        t1 = ref["end"] if i == len(groups) - 1 else groups[i + 1][0]["text_ref"]["start"]
        while t1 > t0 and text[t1 - 1].isspace():
            t1 -= 1
        s0 = phrase["start"] if i == 0 else g[0]["start"]
        s1 = phrase["end"] if i == len(groups) - 1 else g[-1]["end"]
        sources = sorted({phrase["source"], *(w["source"] for w in g if w["source"])})
        cues.append(dict(start_sample=s0, speech_end_sample=s1, text=text[t0:t1], text_ref=dict(field=ref.get("field", "speech"), start=t0, end=t1),
                         segment=phrase.get("segment"), timing_sources=sources, long=visible_len(text[t0:t1]) > a.max_chars))
    return cues


def build_cues(timeline, a):
    phrases = [r for r in timeline["records"] if r["kind"] == "phrase"]
    words = [r for r in timeline["records"] if r["kind"] == "word"]
    if not phrases:
        raise CaptionError("missing-reference", "the timeline has no phrase records to caption")
    for p in phrases:
        if p["start"] is None or p["end"] is None:
            raise CaptionError("unmapped-reference", f"phrase {p['label']!r} has no measured timing; captions never invent one")
        if (p.get("text_ref") or {}).get("field", "speech") not in timeline["text"]:
            raise CaptionError("invalid-timing", f"phrase {p['label']!r} refers to an unknown text field")
    cues = []
    for p in sorted(phrases, key=lambda r: r["start"]):
        cues += group_phrase(p, words, timeline["text"][(p.get("text_ref") or {}).get("field", "speech")], a)
    rate, count = timeline["audio"]["sample_rate"], timeline["audio"]["sample_count"]
    hold = round(a.hold_ms * rate / 1000)
    for i, c in enumerate(cues):
        nxt = cues[i + 1]["start_sample"] if i + 1 < len(cues) else count
        c["end_sample"] = min(nxt, c["speech_end_sample"] + hold, count)  # hold through short pauses, never overlap the next cue
        c["id"] = f"c{i + 1}"
    validate_cues(cues, rate, count)
    for c in cues:
        c["start"], c["end"] = c["start_sample"] / rate, c["end_sample"] / rate
    return cues


def validate_cues(cues, rate, count):
    prev = 0
    for c in cues:
        s, e = c.get("start_sample"), c.get("end_sample")
        if type(s) is not int or type(e) is not int or not 0 <= s < e <= count:
            raise CaptionError("invalid-timing", f"cue {c.get('id')}: invalid sample range {s}-{e} (audio has {count} samples)")
        if s < prev:
            raise CaptionError("overlapping-cues", f"cue {c.get('id')} starts at sample {s}, before the previous cue ends ({prev})")
        if not isinstance(c.get("text"), str) or not c["text"].strip():
            raise CaptionError("invalid-text", f"cue {c.get('id')}: empty text")
        prev = e
    ms = [(round(c["start_sample"] * 1000 / rate), round(c["end_sample"] * 1000 / rate)) for c in cues]
    for i, (s, e) in enumerate(ms):
        if not s < e or (i and s < ms[i - 1][1]):
            raise CaptionError("overlapping-cues", f"cue {cues[i].get('id')}: millisecond interval {s}-{e} is empty or overlaps the previous cue")


def stamp(ms, sep):
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def subtitles(cues, rate, kind):
    ms = lambda x: round(x * 1000 / rate)
    if kind == "srt":
        return "".join(f"{i}\n{stamp(ms(c['start_sample']), ',')} --> {stamp(ms(c['end_sample']), ',')}\n{c['text']}\n\n" for i, c in enumerate(cues, 1))
    return "WEBVTT\n\n" + "".join(f"{c['id']}\n{stamp(ms(c['start_sample']), '.')} --> {stamp(ms(c['end_sample']), '.')}\n{c['text']}\n\n" for c in cues)


def check(project, rel):
    doc = json.loads((project / rel).read_text(encoding="utf-8"))
    if doc.get("schema") != SCHEMA or doc.get("version") != VERSION:
        raise CaptionError("invalid-captions", "unsupported caption schema or version")
    _, tl_out, timeline = verified_timeline(project)
    n = doc["narration"]
    if n["timeline_sha256"] != tl_out["sha256"] or n["audio_sha256"] != timeline["audio"]["sha256"]:
        raise CaptionError("stale-captions", "captions were built from a different narration; build them again")
    validate_cues(doc["cues"], n["sample_rate"], n["sample_count"])
    for kind, f in doc["files"].items():
        if sha(project / f["path"]) != f["sha256"]:
            raise CaptionError("stale-captions", f"{f['path']} changed after it was generated")
    return dict(valid=True, cues=len(doc["cues"]), files=sorted(doc["files"]))


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["build", "check"])
    ap.add_argument("project")
    ap.add_argument("--mode", choices=["phrase", "words"], default="phrase")
    ap.add_argument("--max-chars", type=int, default=42)
    ap.add_argument("--max-words", type=int, default=6)
    ap.add_argument("--max-lines", type=int, default=2)
    ap.add_argument("--hold-ms", type=int, default=700)
    ap.add_argument("--out-dir", default="captions")
    ap.add_argument("--captions", default="captions/captions.json")
    a = ap.parse_args(argv)
    project = Path(a.project).resolve()
    if project.is_relative_to(PACKAGE):
        raise CaptionError("invalid-project", "projects must live outside the Skill package")
    if a.command == "check":
        return check(project, a.captions)
    if not (8 <= a.max_chars <= 200 and 1 <= a.max_words <= 40 and 1 <= a.max_lines <= 4 and 0 <= a.hold_ms <= 3000):
        raise CaptionError("invalid-config", "max-chars 8-200, max-words 1-40, max-lines 1-4, hold-ms 0-3000")
    pj, tl_out, timeline = verified_timeline(project)
    cfg = pj["config"]["effective"].get("captions") or {}
    enabled, burn_in = cfg.get("enabled", True), cfg.get("burn_in", True)
    files_wanted = cfg.get("subtitle_files", ["srt", "vtt"]) if enabled else []
    cues = build_cues(timeline, a)
    rate = timeline["audio"]["sample_rate"]
    out = project / a.out_dir
    out.mkdir(parents=True, exist_ok=True)
    files = {}
    for kind in files_wanted:
        path = out / f"captions.{kind}"
        path.write_text(subtitles(cues, rate, kind), encoding="utf-8", newline="\n")
        files[kind] = dict(path=path.relative_to(project).as_posix(), sha256=sha(path))
    doc = dict(schema=SCHEMA, version=VERSION, locale=timeline.get("locale") or pj["config"]["effective"].get("locale"),
               narration=dict(timeline=tl_out["path"], timeline_sha256=tl_out["sha256"], audio_sha256=timeline["audio"]["sha256"],
                              sample_rate=rate, sample_count=timeline["audio"]["sample_count"], timing_status=timeline["validation"],
                              timing_method=(timeline.get("timing") or {}).get("method"), run_id=timeline.get("run_id")),
               config=dict(enabled=enabled, burn_in=enabled and burn_in, subtitle_files=files_wanted, mode=a.mode, max_chars=a.max_chars,
                           max_words=a.max_words, max_lines=a.max_lines, hold_ms=a.hold_ms),
               cues=cues if enabled else [], files=files,
               review=dict(technical="passed", language="pending native-reader review", readability="pending human review"))
    if not enabled:
        doc["note"] = "captions.enabled is false: no cues are shown or exported"
    target = out / "captions.json"
    target.with_suffix(".tmp").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    target.with_suffix(".tmp").replace(target)
    return dict(cues=len(doc["cues"]), long=[c["id"] for c in doc["cues"] if c["long"]], files=sorted(files), burn_in=doc["config"]["burn_in"],
                captions=target.relative_to(project).as_posix())


if __name__ == "__main__":
    try:
        result = main(sys.argv[1:])
        print(json.dumps(result, ensure_ascii=True, indent=2))
    except CaptionError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    except ValueError as error:  # timeline contract violations from timeline.validate
        print(f"[invalid-timing] {error}", file=sys.stderr)
        sys.exit(1)
