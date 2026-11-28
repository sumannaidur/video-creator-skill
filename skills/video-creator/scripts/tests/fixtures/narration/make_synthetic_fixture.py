"""Deterministic SYNTHETIC narration fixture (P027.2): an original tone-burst WAV and a matching timeline.

This is NOT speech and NOT provider evidence. The audio is generated here with integer arithmetic only (no model, voice or
recording), so it is byte-identical on every platform. The text is one project-authored Hindi passage, used so the timeline
exercises Devanagari Unicode slicing. Timing is exact by construction (source "manual"); one word is deliberately left
untimed (null endpoints) to cover that contract path.

    python make_synthetic_fixture.py [--out <dir>]      # writes synthetic-hi.wav and synthetic-hi.timeline.json
    python make_synthetic_fixture.py --check            # verifies the packaged files are reproduced byte for byte
"""
import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

RATE = 24000
TEXT = ("पेड़ धूप रोकते हैं। "
        "पत्तियों से पानी भाप "
        "बनकर निकलता है, तो आसपास "
        "की हवा ठंडी होने में भी "
        "मदद मिल सकती है।")
LEAD, WORD_GAP, PHRASE_GAP, TAIL = 4800, 1200, 7200, 4800   # samples
UNTIMED_WORD = 9                                              # index of the word left with null endpoints
STEM = "synthetic-hi"


def tokens(text):
    """Words (letters and marks only) with Unicode offsets, plus phrase boundaries after ',' and '।'."""
    out, i = [], 0
    for raw in text.split(" "):
        word = raw.rstrip(",।")
        out.append((word, i, i + len(word), raw[len(word):]))
        i += len(raw) + 1
    return out


def burst(n, period, amp):
    """Integer triangle wave with 240-sample linear attack and release."""
    ramp, half, out = 240, period // 2, []
    for k in range(n):
        p = k % period
        tri = (4 * amp * p) // period - amp if p < half else 3 * amp - (4 * amp * p) // period
        env = min(k, n - 1 - k, ramp)
        out.append(tri * env // ramp)
    return out


def build():
    samples, records, cursor = [0] * LEAD, [], LEAD
    words = tokens(TEXT)
    phrase_lo, sent_lo, phrase_start = 0, 0, cursor
    sentence_start = cursor
    for n, (word, lo, hi, punct) in enumerate(words):
        length = 1800 + 600 * len(word)
        a, b = cursor, cursor + length
        samples += burst(length, 60 + 7 * (n % 9), 9000 + 400 * (n % 5))
        timed = n != UNTIMED_WORD
        records.append(dict(kind="word", label=word, start=a if timed else None, end=b if timed else None,
                            source="manual" if timed else None, text_ref=dict(field="display", start=lo, end=hi)))
        mid = a + length // 2
        records += [dict(kind="phoneme", label=f"tone-{n}a", start=a, end=mid, source="manual"),
                    dict(kind="phoneme", label=f"tone-{n}b", start=mid, end=b, source="manual")]
        cursor = b
        if punct or n == len(words) - 1:
            records.append(dict(kind="phrase", label=TEXT[phrase_lo:hi], start=phrase_start, end=b, source="manual",
                                text_ref=dict(field="display", start=phrase_lo, end=hi)))
            if "।" in punct:
                records.append(dict(kind="sentence", label=TEXT[sent_lo:hi + 1], start=sentence_start, end=b, source="manual",
                                    text_ref=dict(field="display", start=sent_lo, end=hi + 1)))
                sent_lo = hi + 2
            if n < len(words) - 1:
                records.append(dict(kind="pause", label="phrase-gap", start=b, end=b + PHRASE_GAP, source="manual"))
                samples += [0] * PHRASE_GAP
                cursor += PHRASE_GAP
                if "।" in punct:
                    sentence_start = cursor
            phrase_lo, phrase_start = hi + len(punct) + 1, cursor
        elif n < len(words) - 1:
            samples += [0] * WORD_GAP
            cursor += WORD_GAP
    samples += [0] * TAIL
    pcm = struct.pack(f"<{len(samples)}h", *samples)
    header = (b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, RATE, RATE * 2, 2, 16)
              + b"data" + struct.pack("<I", len(pcm)))
    wav = header + pcm
    order = {"sentence": 0, "phrase": 1, "word": 2, "phoneme": 3, "pause": 4}
    records.sort(key=lambda r: (order[r["kind"]], r["start"] if r["start"] is not None else -1))
    timeline = {
        "version": 1, "unit": "sample", "locale": "hi-IN", "validation": "unreviewed",
        "run_id": hashlib.sha256(wav).hexdigest()[:32],
        "fixture": {"synthetic": True, "speech": False, "generator": "scripts/tests/fixtures/narration/make_synthetic_fixture.py",
                    "note": "Original integer tone bursts, not speech or provider evidence. Timing is exact by construction."},
        "timing": {"method": "synthetic_fixture", "provider": "none"},
        "audio": {"path": f"narration/{STEM}.wav", "sha256": hashlib.sha256(wav).hexdigest(), "sample_rate": RATE,
                  "sample_count": len(samples)},
        "text": {"display": TEXT, "speech": TEXT},
        "records": records,
    }
    return wav, (json.dumps(timeline, ensure_ascii=False, indent=1) + "\n").encode("utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", type=Path, default=Path(__file__).resolve().parent)
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    wav, tl = build()
    targets = {a.out / f"{STEM}.wav": wav, a.out / f"{STEM}.timeline.json": tl}
    if a.check:
        bad = [str(p) for p, data in targets.items() if not p.is_file() or p.read_bytes() != data]
        print("reproduced byte for byte" if not bad else f"MISMATCH: {bad}")
        sys.exit(1 if bad else 0)
    for p, data in targets.items():
        p.write_bytes(data)
    print(f"wrote {STEM}.wav ({len(wav)} bytes, sha256 {hashlib.sha256(wav).hexdigest()}) and {STEM}.timeline.json")


if __name__ == "__main__":
    main()
