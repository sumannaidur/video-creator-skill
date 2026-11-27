"""Mithi native word and phrase timing from the same inference's token durations (standard library only).

Packaged in P015.2B. It uses only data that the Mithi inference itself produced and that mithi_provider.py records
in <id>.raw-duration.json:
  encoder_ids          phoneme token ids the prosody writer reads (BOS ... EOS)
  token_word           the model's own word index per encoder token (frontend.token_words; -1 = BOS/EOS/space;
                       punctuation and breath tokens carry the word before them)
  model_words          the model's own word split (frontend.words_of); the n-th token group is the n-th word
  decoded_ids          tokens the decoder voiced (the encoder tokens in order, plus any inserted breath tokens)
  decoded_to_encoder   encoder index of every decoded token
  durations            model-decided duration units per decoded token (the hard alignment the decoder used)
  samples_per_duration_unit, sample_count, special_ids {space, breath, punctuation[], edge}

Token policy (explicit, language-independent):
  phoneme token        belongs to its model word; a word spans its first to last phoneme token, which must be contiguous
  space token          a gap between words; never part of a word
  punctuation token    a pause after the word it follows; never part of a word
  breath token         an inserted breath; never part of a word
  BOS/EOS edge tokens  leading and trailing silence; never part of a word
Text words are whitespace-separated runs of the original text, kept with their Unicode offsets. Each text word must
equal one or more consecutive model words after removing punctuation, symbols and separators from both (the model
splits hyphenated words; a hyphenated text word then spans its parts). Anything else is rejected, never estimated.
"""
import re
import unicodedata

PHRASE_END = "।॥.?!,;:"


class MappingError(ValueError):
    def __init__(self, code, message):
        super().__init__(f"[{code}] {message}")
        self.code = code


def core(text):
    """Letters, marks and digits only (Unicode categories L*, M*, N*), NFC-normalised."""
    return "".join(c for c in unicodedata.normalize("NFC", text) if unicodedata.category(c)[0] in "LMN")


def edges_of(raw):
    per_unit, durations = raw["samples_per_duration_unit"], raw["durations"]
    if type(per_unit) is not int or per_unit <= 0 or any(type(d) is not int or d < 0 for d in durations):
        raise MappingError("invalid-durations", "durations and samples per unit must be non-negative integers")
    edges = [0]
    for d in durations:
        edges.append(edges[-1] + d * per_unit)
    if edges[-1] != raw["sample_count"]:
        raise MappingError("duration-sample-mismatch", f"durations account for {edges[-1]} samples, audio has {raw['sample_count']}")
    return edges


def token_classes(raw):
    """Class and owning model word of every decoded token."""
    dec, enc_of, tok_word, special = raw["decoded_ids"], raw["decoded_to_encoder"], raw["token_word"], raw["special_ids"]
    enc = raw["encoder_ids"]
    if not (len(dec) == len(enc_of) == len(raw["durations"])) or len(tok_word) != len(enc):
        raise MappingError("token-count-mismatch", "decoded tokens, durations and token ownership lengths differ")
    punctuation = set(special["punctuation"])
    out, last = [], len(dec) - 1
    for k, token in enumerate(dec):
        e = enc_of[k]
        if not 0 <= e < len(enc) or (token != special["breath"] and token != enc[e]):
            raise MappingError("token-correspondence", f"decoded token {k} does not correspond to encoder token {e}")
        if k in (0, last):
            out.append(("edge", None))
        elif token == special["breath"]:
            out.append(("breath", None))
        elif token in punctuation:
            out.append(("punctuation", None))
        elif token == special["space"]:
            out.append(("space", None))
        elif tok_word[e] < 0:
            raise MappingError("orphan-phoneme", f"phoneme token {k} has no owning word")
        else:
            out.append(("phoneme", tok_word[e]))
    return out


def assign(text, model_words):
    """Text words (with offsets) -> the consecutive model words each one is made of."""
    words = [(m.group(), m.start(), m.end()) for m in re.finditer(r"\S+", text)]
    plan, j = [], 0
    for label, lo, hi in words:
        target, got, parts = core(label), "", []
        if not target:
            raise MappingError("untimed-word", f"text word {label!r} has no letters or digits to time")
        while j < len(model_words) and len(got) < len(target):
            got += core(model_words[j]); parts.append(j); j += 1
            if not target.startswith(got):
                raise MappingError("word-mismatch", f"text word {label!r} does not match the model words {[model_words[p] for p in parts]}")
        if got != target:
            raise MappingError("word-mismatch", f"text word {label!r} is not covered by the model's word split")
        plan.append((label, lo, hi, parts))
    if j != len(model_words):
        raise MappingError("word-mismatch", f"{len(model_words) - j} model words are left over after the text words")
    return plan


def map_timeline(text, raw):
    """Records (phoneme, pause, word, phrase) with sample-exact native_model times, plus per-word evidence."""
    groups, method = raw["model_word_groups"], "mithi_token_word_ownership"
    plan = assign(text, raw["model_words"])  # letters of every text word verified against the model's own word split
    if groups != len(raw["model_words"]):
        # The model splits apostrophe contractions (it's -> it, s) in its word list but keeps one phoneme group per
        # contraction. Accept group i as text word i only when that is the sole difference; anything else is rejected.
        if len(plan) != groups or any(len(p[3]) > 1 and not re.search("['’]", p[0]) for p in plan):
            raise MappingError("word-group-mismatch", f"{groups} token groups but {len(raw['model_words'])} model words")
        plan, method = [(label, lo, hi, [i]) for i, (label, lo, hi, _) in enumerate(plan)], "mithi_group_ownership_apostrophe_reconciled"
    edges, classes = edges_of(raw), token_classes(raw)
    span = {}
    for k, (kind, w) in enumerate(classes):
        if kind == "phoneme":
            span.setdefault(w, []).append(k)
    for w in range(groups):
        tokens = span.get(w)
        if not tokens:
            raise MappingError("empty-word", f"word group {w} has no phoneme tokens")
        if tokens != list(range(tokens[0], tokens[-1] + 1)):
            raise MappingError("non-contiguous-word", f"model word {w} is interrupted by other tokens")
    records, evidence, previous_end = [], [], 0
    symbol = raw.get("symbols") or {}
    for k, (kind, w) in enumerate(classes):
        if edges[k] < edges[k + 1] and kind == "phoneme":
            records.append(dict(kind="phoneme", label=symbol.get(str(raw["decoded_ids"][k]), f"<{raw['decoded_ids'][k]}>"),
                                start=edges[k], end=edges[k + 1], source="native_model"))
    k = 0
    while k < len(classes):  # pauses: maximal runs of non-phoneme tokens with duration
        if classes[k][0] == "phoneme":
            k += 1; continue
        stop = k
        while stop < len(classes) and classes[stop][0] != "phoneme":
            stop += 1
        if edges[k] < edges[stop]:
            kinds = {c for c, _ in classes[k:stop]}
            label = "breath" if "breath" in kinds else "punctuation pause" if "punctuation" in kinds else \
                "edge silence" if kinds == {"edge"} else "word gap"
            records.append(dict(kind="pause", label=label, start=edges[k], end=edges[stop], source="native_model"))
        k = stop
    words = []
    for label, lo, hi, parts in plan:
        first, last = span[parts[0]][0], span[parts[-1]][-1]
        start, end = edges[first], edges[last + 1]
        if not previous_end <= start < end:
            raise MappingError("unordered-word", f"text word {label!r} would start before the previous word ends or has no duration")
        previous_end = end
        mapping = dict(method=method, model_words=parts, first_token=first, last_token=last)
        words.append(dict(kind="word", label=label, start=start, end=end, source="native_model", mapping=mapping,
                          text_ref=dict(field="speech", start=lo, end=hi), display_ref=dict(field="display", start=lo, end=hi)))
        evidence.append(dict(label=label, text_start=lo, text_end=hi, method=method,
                             model_words=[raw["model_words"][p] for p in parts] if method == "mithi_token_word_ownership" else None, group=parts if method != "mithi_token_word_ownership" else None,
                             tokens=[first, last], samples=[start, end]))
    phrases, first = [], 0
    for i, word in enumerate(words):
        if word["label"][-1] in PHRASE_END or i == len(words) - 1:
            group = words[first:i + 1]
            lo, hi = group[0]["text_ref"]["start"], group[-1]["text_ref"]["end"]
            phrases.append(dict(kind="phrase", label=text[lo:hi], start=group[0]["start"], end=group[-1]["end"], source="native_model",
                                mapping=dict(method="contextual_word_union", first_word=first, stop_word=i + 1),
                                text_ref=dict(field="speech", start=lo, end=hi), display_ref=dict(field="display", start=lo, end=hi)))
            first = i + 1
    return records + words + phrases, evidence


def unmapped(text):
    """Word and phrase records with null timing, used when a mapping is rejected."""
    out, first, matches = [], 0, list(re.finditer(r"\S+", text))
    for i, m in enumerate(matches):
        out.append(dict(kind="word", label=m.group(), start=None, end=None, source=None,
                        text_ref=dict(field="speech", start=m.start(), end=m.end()), display_ref=dict(field="display", start=m.start(), end=m.end())))
        if m.group()[-1] in PHRASE_END or i == len(matches) - 1:
            lo, hi = matches[first].start(), m.end()
            out.append(dict(kind="phrase", label=text[lo:hi], start=None, end=None, source=None,
                            text_ref=dict(field="speech", start=lo, end=hi), display_ref=dict(field="display", start=lo, end=hi)))
            first = i + 1
    return out
