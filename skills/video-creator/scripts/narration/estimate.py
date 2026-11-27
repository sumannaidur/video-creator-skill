#!/usr/bin/env python3
"""Estimate narration duration before synthesis from measured per-voice speaking rates (read-only; synthesizes nothing).

    python estimate.py --script <project>/script/script.json --voice mithi/anirban [--target 30] [--gap-ms 200]

Estimate = sum over segments of speech characters / the voice's measured characters per second, plus the joiner's
gap between segments (stage.py --gap-ms, default 200). Speech characters are Unicode letters and combining marks, so
the count works for Indic scripts without word-count assumptions. Rates and their held-out error come from
duration-rates.json (retained narration evidence). An unmeasured voice is refused with `insufficient-data`.
The measured duration after synthesis always decides; this only helps write a script of about the right length.
"""
import argparse
import json
import sys
import unicodedata
from pathlib import Path

RATES = Path(__file__).with_name("duration-rates.json")


def speech_chars(text):
    return sum(1 for ch in text if unicodedata.category(ch)[0] in "LM")


def estimate(segments, voice, gap_ms=200, rates=None):
    rates = rates or json.loads(RATES.read_text(encoding="utf-8"))
    v = rates["voices"].get(voice)
    if not v:
        raise LookupError(f"[insufficient-data] no measured rate for {voice}; measured voices: {', '.join(sorted(rates['voices']))}")
    per = [{"id": s["id"], "chars": speech_chars(s["text"]), "seconds": round(speech_chars(s["text"]) / v["chars_per_second"], 2)} for s in segments]
    total = sum(p["seconds"] for p in per) + gap_ms / 1000 * max(0, len(per) - 1)
    return {"voice": voice, "rate": v, "segments": per, "estimated_seconds": round(total, 2)}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--script", required=True)
    ap.add_argument("--voice", required=True, help="provider/voice, e.g. mithi/anirban")
    ap.add_argument("--target", type=float)
    ap.add_argument("--gap-ms", type=int, default=200)
    a = ap.parse_args()
    script = json.loads(Path(a.script).read_text(encoding="utf-8"))
    try:
        r = estimate(script["segments"], a.voice, a.gap_ms)
    except LookupError as e:
        print(e, file=sys.stderr)
        return 2
    target = a.target or script.get("target_seconds")
    if target:
        r["target_seconds"] = target
        r["deviation"] = round(r["estimated_seconds"] / target - 1, 3)
    r["note"] = (f"{r['rate']['confidence']} confidence: held-out segment error {r['rate']['heldout_segment_error']:.1%} "
                 f"({r['rate']['heldout']}, {r['rate']['segments']} segments); measured duration after synthesis decides")
    print(json.dumps(r, indent=1, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
