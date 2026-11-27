"""Map Hindi fixture spans using full-context eSpeak word separators, without inference."""
from collections import Counter
from difflib import SequenceMatcher
import importlib.metadata
import json
from pathlib import Path
import re
import sys
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "alignment-prototype"))
from timeline import validate
from kokoro_onnx.tokenizer import Tokenizer
from phonemizer import phonemize
from phonemizer.separator import Separator

OUTPUT = ROOT / "outputs"
# Editorial clauses from the existing scripts, expressed as half-open word ranges.
PHRASES = {"A": [(0, 12), (12, 20)], "B": [(0, 4), (4, 11), (11, 23)]}


def punctuation_phrases(words):
    """Other passages: a phrase ends at a word carrying clause or sentence punctuation."""
    spans, first = [], 0
    for i, word in enumerate(words):
        if word["label"][-1] in "।॥.?!,;:" or i == len(words) - 1:
            spans.append((first, i + 1))
            first = i + 1
    return spans


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def align(passage, tokenizer):
    stem = f"sample-{passage}-native"
    raw = read(OUTPUT / f"{stem}.raw-duration.json")
    timeline = read(OUTPUT / f"{stem}.timeline.json")
    validate(timeline)
    speech = timeline["text"]["speech"]
    if (raw["run_id"], raw["audio_sha256"], raw["speech_text"], raw["display_text"]) != (
        timeline["run_id"], timeline["audio"]["sha256"], speech, timeline["text"]["display"]
    ):
        raise ValueError("Capture identity mismatch")
    words = [record for record in timeline["records"] if record["kind"] == "word"]
    captured = raw["phonemizer_output"]
    symbols = " ".join(captured.split())
    tokens = raw["input_tensors"]["input_ids"]["values"][0]
    runtime = tokenizer.phonemize(speech, "hi")
    if runtime != captured or [0, *tokenizer.tokenize(symbols), 0] != tokens:
        raise ValueError("Captured symbol or token identity mismatch")
    duration = raw["duration"]["values"]
    if len(duration) != len(tokens) or any(type(d) is not int or d < 0 for d in duration):
        raise ValueError("Invalid captured duration vector")
    edges = [0]
    for d in duration:
        edges.append(edges[-1] + 600 * d)
    if edges[-1] != timeline["audio"]["sample_count"]:
        raise ValueError("Duration does not match WAV")

    marked = phonemize(speech.strip(), "hi", separator=Separator(word="|", phone=""),
                       preserve_punctuation=True, with_stress=True)
    groups = [tokenizer.known(s) for s in marked.removesuffix("|").split("|")]
    exact = " ".join(groups) == symbols and tokenizer.tokenize(" ".join(groups)) == tokens[1:-1]
    positional = exact and len(groups) == len(words) and all(groups)
    isolated = [tokenizer.phonemize(w["label"], "hi") for w in words]
    isolated_join = " ".join(isolated)
    edits = [dict(operation=op, isolated=[a, b], captured=[c, d],
                  from_symbols=isolated_join[a:b], to_symbols=symbols[c:d])
             for op, a, b, c, d in SequenceMatcher(None, isolated_join, symbols, autojunk=False).get_opcodes()
             if op != "equal"]
    counts = Counter(groups)
    evidence = []
    offset = 0
    for i, word in enumerate(words):
        ref = word["text_ref"]
        prefix = tokenizer.phonemize(speech[:ref["end"]], "hi")
        group = groups[i] if positional else ""
        same_ignoring_stress = re.sub("[ˈˌ]", "", group) == re.sub("[ˈˌ]", "", isolated[i])
        expected = " ".join(groups[:i+1]) if positional else None
        prefix_exact = prefix == expected
        prefix_stress_only = expected is not None and re.sub("[ˈˌ]", "", prefix) == re.sub("[ˈˌ]", "", expected)
        # Only strip literal attached source punctuation. Dots within Hindi phonetic
        # output are not assumed to be punctuation.
        suffix = word["label"][-1]
        length = len(group) - int(suffix in "?!,;:" and group.endswith(suffix))
        supported = positional and same_ignoring_stress and prefix_stress_only and length > 0
        first, last = offset, offset + length - 1
        method = "full_context_espeak_separator" if supported else None
        row = dict(index=i, text_ref=ref, spoken=word["label"], backend_group=group,
                   isolated=isolated[i], prefix=prefix, prefix_exact=prefix_exact,
                   prefix_agrees_ignoring_stress=prefix_stress_only,
                   isolated_agrees_ignoring_stress=same_ignoring_stress,
                   repeated_backend_group=bool(group and counts[group] > 1),
                   method=method, first_symbol=first if supported else None,
                   last_symbol=last if supported else None)
        if supported:
            # Symbol zero maps to graph input one after the leading pad.
            start, end = edges[first+1], edges[last+2]
            if start < end:
                word.update(start=start, end=end, source="native_model", mapping=row.copy())
        if timeline["text"]["display"] == speech:
            word["display_ref"] = {**ref, "field": "display"}
        row["mapped"] = word["source"] == "native_model"
        evidence.append(row)
        offset += len(group) + 1

    phrase_evidence = []
    spans = PHRASES.get(passage) or punctuation_phrases(words)
    for first, stop in spans:
        subset = words[first:stop]
        lo, hi = subset[0]["text_ref"]["start"], subset[-1]["text_ref"]["end"]
        phrase = speech[lo:hi]
        standalone = tokenizer.phonemize(phrase, "hi")
        contextual = " ".join(groups[first:stop]) if positional else ""
        mapped = all(w["source"] == "native_model" for w in subset)
        record = dict(kind="phrase", label=phrase, source="native_model" if mapped else None,
                      start=subset[0]["start"] if mapped else None,
                      end=subset[-1]["end"] if mapped else None,
                      text_ref=dict(field="speech", start=lo, end=hi))
        if mapped:
            record["mapping"] = dict(method="contextual_word_union", first_word=first, stop_word=stop,
                                     first_symbol=subset[0]["mapping"]["first_symbol"],
                                     last_symbol=subset[-1]["mapping"]["last_symbol"])
        if timeline["text"]["display"] == speech:
            record["display_ref"] = dict(field="display", start=lo, end=hi)
        timeline["records"].append(record)
        phrase_evidence.append(dict(words=[first, stop], standalone=standalone, contextual=contextual,
                                    exact=standalone == contextual, mapped=mapped))
    validate(timeline)
    write(OUTPUT / f"sample-{passage}-candidate.timeline.json", timeline)
    return dict(passage=passage, run_id=raw["run_id"], sha256=raw["audio_sha256"],
                marked=marked, groups=len(groups), separator_roundtrip_exact=exact,
                positional_gate=positional, source_is_nfc=unicodedata.is_normalized("NFC", speech),
                isolated_exact=isolated_join == symbols, isolated_diff=edits,
                words=evidence, phrases=phrase_evidence)


if __name__ == "__main__":
    tokenizer = Tokenizer()
    passages = sys.argv[1:] or ["A", "B"]
    if not all(re.fullmatch(r"[A-Z]", p) for p in passages):
        raise SystemExit("Usage: map_text_to_phonemes.py [PASSAGE ...]")
    # The original A/B evidence files are only rewritten by the default A/B run.
    suffix = "" if passages == ["A", "B"] else "-" + "".join(passages)
    captures = [align(p, tokenizer) for p in passages]
    write(Path(__file__).with_name(f"mapping-evidence{suffix}.json"),
          dict(versions={p: importlib.metadata.version(p) for p in
                         ("kokoro-onnx", "phonemizer", "espeakng-loader")}, captures=captures))
    results = [dict(passage=c["passage"], word_total=len(c["words"]),
                    word_mapped=sum(x["mapped"] for x in c["words"]),
                    phrase_total=len(c["phrases"]), phrase_mapped=sum(x["mapped"] for x in c["phrases"]),
                    repeated_group_spans=sum(x["repeated_backend_group"] for x in c["words"]),
                    prefix_exact=sum(x["prefix_exact"] for x in c["words"]),
                    accuracy="pending human annotations") for c in captures]
    write(Path(__file__).with_name(f"mapping-results{suffix}.json"), results)
    print(json.dumps(results, indent=2))
