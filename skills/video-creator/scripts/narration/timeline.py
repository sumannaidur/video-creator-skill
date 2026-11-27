"""Provider-independent narration timeline: sample-unit records with provenance and review status.

Packaged from experiments/E04/alignment-prototype/timeline.py (P014.3B). Paths in a timeline are relative to the project root.
Validate files:  python timeline.py --project <dir> <timeline.json> [...]
"""
import argparse
import hashlib
import json
from pathlib import Path
import wave

SOURCES = {"native_model", "forced_alignment", "audio_boundary", "manual", "estimated"}
KINDS = {"sentence", "phrase", "word", "phoneme", "pause"}


def pcm(path):
    with wave.open(str(path) if isinstance(path, Path) else path, "rb") as wav:
        if wav.getnchannels() != 1 or wav.getsampwidth() != 2:
            raise ValueError("Expected mono PCM16")
        frames = wav.readframes(wav.getnframes())
        if len(frames) != 2 * wav.getnframes():
            raise ValueError("Truncated WAV")
        return wav.getframerate(), frames


def validate(item, root):
    def require(condition, message):
        if not condition:
            raise ValueError(message)

    require(item["version"] == 1 and item["unit"] == "sample", "Unsupported timeline timebase")
    require(isinstance(item["locale"], str) and bool(item["locale"]), "Missing locale")
    require(item["validation"] in {"unreviewed", "reviewed"}, "Unknown review status")
    path = (root / item["audio"]["path"]).resolve()
    require(path.is_relative_to(root.resolve()), "Audio path outside workspace")
    rate, frames = pcm(path)
    count = len(frames) // 2
    require(count > 0 and rate > 0, "Audio is empty")
    require(type(item["audio"]["sample_rate"]) is int and item["audio"]["sample_rate"] == rate
            and type(item["audio"]["sample_count"]) is int and item["audio"]["sample_count"] == count, "Audio timebase mismatch")
    require(hashlib.sha256(path.read_bytes()).hexdigest() == item["audio"]["sha256"], "Audio checksum mismatch")
    for key in ("display", "speech"):
        require(isinstance(item["text"][key], str) and bool(item["text"][key]), "Missing source text")
        item["text"][key].encode("utf-8", errors="strict")
    require(isinstance(item["records"], list), "Records must be a list")
    previous = {}
    for record in item["records"]:
        kind, source = record["kind"], record["source"]
        require(kind in KINDS and isinstance(record["label"], str) and bool(record["label"]), "Invalid record")
        record["label"].encode("utf-8", errors="strict")
        start, end = record["start"], record["end"]
        if source is None:
            require(start is None and end is None, "Unknown timing must have null endpoints")
        else:
            require(source in SOURCES and type(start) is int and type(end) is int, "Invalid timing provenance or units")
            require(previous.get(kind, 0) <= start < end <= count, "Unordered or out-of-bounds interval")
            previous[kind] = end
        ref = record.get("text_ref")
        if kind in {"sentence", "phrase", "word"}:
            require(isinstance(ref, dict), "Missing text reference")
        if ref is not None:
            require(ref["field"] in {"display", "speech"}, "Invalid text field")
            text = item["text"][ref["field"]]
            lo, hi = ref["start"], ref["end"]
            require(type(lo) is int and type(hi) is int and 0 <= lo < hi <= len(text)
                    and text[lo:hi] == record["label"], "Invalid Unicode text slice")
        confidence = record.get("confidence")
        require(confidence is None or (source == "forced_alignment" and type(confidence) in {int, float}
                                      and 0 <= confidence <= 1), "Invalid alignment confidence")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, default=Path("."))
    parser.add_argument("timeline", nargs="+", type=Path)
    args = parser.parse_args()
    for file in args.timeline:
        path = file if file.is_absolute() else args.project / file
        validate(json.loads(path.read_text(encoding="utf-8")), args.project)
        print(f"Valid: {file}")
