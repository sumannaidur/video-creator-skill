"""Build and validate sample-index timelines for the two retained E03 WAVs."""
import argparse
from array import array
from dataclasses import asdict
import hashlib
import io
import itertools
import json
from pathlib import Path
import sys
import wave

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
KOKORO = ROOT / "experiments/E03/kokoro-hindi"
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


def validate(item, root=ROOT):
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


def replay_engine():
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(KOKORO))
    from synthesize import bounded_session, kokoro_onnx
    manifest = json.loads((KOKORO / "model-manifest.json").read_text(encoding="utf-8"))
    metadata = json.loads((KOKORO / "sample-A.json").read_text(encoding="utf-8"))
    for key, path_key in (("model", "model"), ("voices", "voices")):
        with Path(metadata[path_key]).open("rb") as f:
            if hashlib.file_digest(f, "sha256").hexdigest() != manifest[key]["sha256"]:
                raise ValueError("Pinned model or voice hash mismatch")
    kokoro_onnx.create_session = bounded_session
    return kokoro_onnx.Kokoro(metadata["model"], metadata["voices"])


def analyze(engine):
    import soundfile as sf
    output = HERE / "outputs"
    output.mkdir(exist_ok=True)
    dataset = json.loads((KOKORO.parent / "evaluation-dataset/hi-IN.json").read_text(encoding="utf-8"))
    listening = json.loads((KOKORO / "listening-manifest.json").read_text(encoding="utf-8"))
    for sample in listening["samples"]:
        label = sample["passage"]
        path = KOKORO / sample["raw_audio"]
        meta = json.loads((KOKORO / f"sample-{label}.json").read_text(encoding="utf-8"))
        fixture = next(row for row in dataset["tests"] if row["id"] == label)
        for key in ("display_text", "speech_normalized_text"):
            if fixture[key] != meta[key]:
                raise ValueError("Dataset differs from the original synthesis input")
        rate, frames = pcm(path)
        samples = array("h", frames)
        if sys.byteorder != "little":
            samples.byteswap()
        records = []
        offset = 0
        for quiet, group in itertools.groupby(samples, key=lambda n: abs(n) <= 327):
            end = offset + sum(1 for _ in group)
            if quiet and (end - offset) * 1000 >= 120 * rate:
                records.append(dict(kind="pause", label="low energy", start=offset, end=end, source="audio_boundary"))
            offset = end
        speech = meta["speech_normalized_text"]
        audio, replay_rate, timings = engine.create_timed(speech, voice=meta["voice"], lang="hi", speed=1.0, trim=False)
        buffer = io.BytesIO()
        sf.write(buffer, audio, replay_rate, format="WAV", subtype="PCM_16")
        buffer.seek(0)
        matched = pcm(buffer) == (rate, frames)
        if matched:
            for timing in timings:
                start, end = round(timing.start * rate), round(timing.end * rate)
                if start < end:
                    records.append(dict(kind="phoneme", label=timing.phoneme, start=start, end=end, source="native_model"))
        evidence = dict(inputs=[x.name for x in engine.sess.get_inputs()],
                        outputs=[x.name for x in engine.sess.get_outputs()],
                        runtime=meta["runtime"], replay_matches_original_pcm=matched,
                        replay_sample_count=len(audio), replay_timings=[asdict(t) for t in timings],
                        replay_timing_unit="seconds", low_energy_peak_pcm=327, minimum_quiet_ms=120)
        item = dict(version=1, unit="sample", locale=meta["locale"], validation="unreviewed",
                    audio=dict(path=path.relative_to(ROOT).as_posix(), sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                               sample_rate=rate, sample_count=len(samples)),
                    text=dict(display=meta["display_text"], speech=speech), records=records)
        validate(item)
        for suffix, data in (("timeline", item), ("evidence", evidence)):
            (output / f"sample-{label}.{suffix}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("timeline", nargs="*", type=Path, help="Validate these files. Omit to analyze the Kokoro WAVs.")
    args = parser.parse_args()
    if args.timeline:
        for file in args.timeline:
            validate(json.loads(file.read_text(encoding="utf-8")))
            print(f"Valid: {file}")
    else:
        analyze(replay_engine())
