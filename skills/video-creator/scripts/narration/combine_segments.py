"""Combine synchronized WAV + candidate timeline pairs into one narration WAV and timeline.

Audio is concatenated sample-exactly (no resampling); every timing record is offset by an integer
sample count. Source segment IDs, run IDs, hashes and review status are preserved.

Packaged from experiments/E04/native-timing/combine_segments.py (P014.3B). All paths are relative to --project.

Usage:
  python combine_segments.py --project <dir> --id ABC --gap-ms 400 --out-wav narration/narration.wav
      --out-timeline narration/narration.timeline.json A=narration/segments/A.timeline.json B=... C=...
  --gap-ms / --gap-samples accept one value or a comma-separated value per boundary.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
import sys
import wave

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True  # never write caches into the (immutable) Skill package
sys.path.insert(0, str(HERE))
from timeline import pcm, validate  # noqa: E402

ROOT = Path(".").resolve()  # replaced by --project in main()


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_segment(spec):
    if "=" not in spec:
        raise ValueError(f"Segment must be ID=timeline.json: {spec}")
    seg_id, path = spec.split("=", 1)
    if not re.fullmatch(r"[A-Za-z0-9_-]+", seg_id):
        raise ValueError(f"Invalid segment id {seg_id!r}")
    path = (ROOT / path).resolve()
    item = json.loads(path.read_text(encoding="utf-8"))
    validate(item, ROOT)  # verifies WAV SHA-256, mono PCM16, sample rate and count, record order and bounds
    rate, frames = pcm(ROOT / item["audio"]["path"])
    return dict(id=seg_id, path=path, item=item, rate=rate, frames=frames)


def gaps_for(args, count, rate):
    raw = args.gap_samples if args.gap_samples is not None else args.gap_ms
    values = [float(v) for v in str(raw).split(",")] if raw is not None else [0.0]
    if len(values) == 1:
        values *= count - 1
    if len(values) != count - 1:
        raise ValueError(f"Expected 1 or {count - 1} gap values")
    out = []
    for v in values:
        samples = v if args.gap_samples is not None else v * rate / 1000
        if samples < 0 or samples != int(samples):
            raise ValueError(f"Gap {v} is not a nonnegative whole number of samples at {rate} Hz")
        out.append(int(samples))
    return out


def combine(segments, gaps, out_wav, out_timeline, combined_id):
    if len(segments) < 2:
        raise ValueError("Need at least two segments")
    if len({s["id"] for s in segments}) != len(segments):
        raise ValueError("Segment ids must be unique")
    first = segments[0]["item"]
    for s in segments:
        item = s["item"]
        if s["rate"] != segments[0]["rate"] or item["locale"] != first["locale"]:
            raise ValueError(f"Segment {s['id']} has an incompatible sample rate or locale")
    rate = segments[0]["rate"]
    out_wav, out_timeline = (ROOT / out_wav).resolve(), (ROOT / out_timeline).resolve()
    for path in (out_wav, out_timeline):
        if not path.is_relative_to(ROOT):
            raise ValueError(f"Output outside workspace: {path}")
        if path.exists():
            raise FileExistsError(path)

    pcm_out, records, meta, speech, display = bytearray(), [], [], "", ""
    offset = 0
    for k, s in enumerate(segments):
        item = s["item"]
        if k:
            speech += " "
            display += " "
            silence = gaps[k - 1]
            if silence:
                records.append(dict(kind="pause", label="inserted silence", start=offset, end=offset + silence,
                                    source="manual", segment=None))
            pcm_out += bytes(2 * silence)
            offset += silence
        text_base = {"speech": len(speech), "display": len(display)}
        for record in item["records"]:
            r = copy.deepcopy(record)
            if r["start"] is not None:
                r["start"] += offset
                r["end"] += offset
            for key in ("text_ref", "display_ref"):
                if key in r:
                    r[key]["start"] += text_base[r[key]["field"]]
                    r[key]["end"] += text_base[r[key]["field"]]
            if "mapping" in r:
                r["mapping_scope"] = "segment"  # mapping internals stay relative to the source segment
            r["segment"] = s["id"]
            records.append(r)
        speech += item["text"]["speech"]
        display += item["text"]["display"]
        count = len(s["frames"]) // 2
        meta.append(dict(id=s["id"], run_id=item["run_id"], validation=item["validation"],
                         source_timeline=s["path"].relative_to(ROOT).as_posix(),
                         source_timeline_sha256=sha256(s["path"]), audio=dict(item["audio"]),
                         offset_samples=offset, sample_count=count,
                         text_offset=text_base, gap_after_samples=gaps[k] if k < len(gaps) else 0))
        pcm_out += s["frames"]
        offset += count
    # Records are grouped per kind in time order across segments (validator requires per-kind order).
    kinds = ["phoneme", "pause", "word", "phrase", "sentence"]
    records.sort(key=lambda r: (kinds.index(r["kind"]), r["start"] if r["start"] is not None else -1))

    out_wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(bytes(pcm_out))
    status = "unreviewed" if any(m["validation"] != "reviewed" for m in meta) else "reviewed"
    run_id = "combined-" + hashlib.sha256(json.dumps([[m["id"], m["run_id"], m["audio"]["sha256"]] for m in meta] + [gaps]).encode()).hexdigest()[:24]
    timeline = dict(version=1, unit="sample", locale=first["locale"], validation=status, run_id=run_id,
                    combined_id=combined_id,
                    audio=dict(path=out_wav.relative_to(ROOT).as_posix(), sha256=sha256(out_wav), sample_rate=rate,
                               sample_count=offset),
                    text=dict(display=display, speech=speech), segments=meta, records=records)
    validate(timeline, ROOT)
    verify(timeline, segments)
    out_timeline.parent.mkdir(parents=True, exist_ok=True)
    out_timeline.write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return timeline


def verify(timeline, segments):
    """Independent post-write checks: byte-exact segment audio, silence, offsets and provenance."""
    rate, frames = pcm(ROOT / timeline["audio"]["path"])
    checks = {}
    total = sum(m["sample_count"] for m in timeline["segments"]) + sum(m["gap_after_samples"] for m in timeline["segments"])
    checks["total_samples"] = total == len(frames) // 2 == timeline["audio"]["sample_count"]
    checks["audio_hash"] = sha256(ROOT / timeline["audio"]["path"]) == timeline["audio"]["sha256"]
    exact, silent, mapped, ordered = True, True, True, True
    for m, s in zip(timeline["segments"], segments):
        lo = 2 * m["offset_samples"]
        exact &= frames[lo:lo + len(s["frames"])] == s["frames"]
        gap_end = lo + len(s["frames"]) + 2 * m["gap_after_samples"]
        silent &= not any(frames[lo + len(s["frames"]):gap_end])
        mine = [r for r in timeline["records"] if r["segment"] == m["id"]]
        source = s["item"]["records"]
        mapped &= len(mine) == len(source) and sorted(
            (r["kind"], r["label"], None if r["start"] is None else r["start"] - m["offset_samples"],
             None if r["end"] is None else r["end"] - m["offset_samples"]) for r in mine) == sorted(
            (r["kind"], r["label"], r["start"], r["end"]) for r in source)
        timed = [r for r in mine if r["start"] is not None]
        ordered &= all(m["offset_samples"] <= r["start"] < r["end"] <= m["offset_samples"] + m["sample_count"] for r in timed)
    checks.update(segment_audio_byte_exact=exact, gaps_silent=silent, records_offset_exactly=mapped,
                  records_within_own_segment=ordered,
                  text_slices_valid=True,  # enforced by validate()
                  status_preserved=timeline["validation"] == ("unreviewed" if any(m["validation"] != "reviewed" for m in timeline["segments"]) else "reviewed"))
    if not all(checks.values()):
        raise ValueError(f"Combined output failed checks: {checks}")
    timeline["checks"] = checks


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("segments", nargs="+", help="ID=path/to/candidate.timeline.json, in narration order")
    gap = parser.add_mutually_exclusive_group()
    gap.add_argument("--gap-ms", help="silence between segments in milliseconds (one value or one per boundary)")
    gap.add_argument("--gap-samples", help="silence between segments in samples (one value or one per boundary)")
    parser.add_argument("--out-wav", required=True)
    parser.add_argument("--out-timeline", required=True)
    parser.add_argument("--id", required=True, help="identifier for the combined narration")
    parser.add_argument("--project", default=".", help="project root; all paths are relative to it")
    args = parser.parse_args()
    global ROOT
    ROOT = Path(args.project).resolve()
    segments = [load_segment(spec) for spec in args.segments]
    gaps = gaps_for(args, len(segments), segments[0]["rate"])
    t = combine(segments, gaps, args.out_wav, args.out_timeline, args.id)
    print(json.dumps(dict(audio=t["audio"], run_id=t["run_id"], validation=t["validation"], checks=t["checks"],
                          segments=[{k: m[k] for k in ("id", "run_id", "offset_samples", "sample_count", "gap_after_samples")}
                                    for m in t["segments"]],
                          phrases=[[r["segment"], round(r["start"] / t["audio"]["sample_rate"], 3), round(r["end"] / t["audio"]["sample_rate"], 3)]
                                   for r in t["records"] if r["kind"] == "phrase"]), indent=1))


if __name__ == "__main__":
    main()
