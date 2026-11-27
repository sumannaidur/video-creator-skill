"""Capture the one graph call behind each new native timing WAV."""
from array import array
from dataclasses import asdict
import hashlib
import itertools
import json
from pathlib import Path
import re
import sys
import uuid

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "alignment-prototype"))
from timeline import KOKORO, ROOT, pcm, replay_engine, validate

HOP = 600


def offsets(durations, samples):
    if not durations or any(type(d) is not int or d < 0 for d in durations):
        raise ValueError("Expected nonnegative integral frame counts")
    edges = list(itertools.accumulate((d * HOP for d in durations), initial=0))
    if edges[-1] != samples:
        raise ValueError(f"Frame total predicts {edges[-1]} samples, observed {samples}")
    return edges


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_text_file(path):
    """Same normalization as E03 synthesize.py --text-file."""
    text = " ".join(Path(path).read_bytes().decode("utf-8-sig").split())
    if not text or len(text) > 2000 or not any("ऀ" <= ch <= "ॿ" for ch in text):
        raise ValueError("Text must be 1-2000 characters of UTF-8 Hindi")
    return text


def capture(passage, text_file=None):
    stem = f"sample-{passage}-native"
    wav = HERE / "samples" / f"{stem}.wav"
    output = HERE / "outputs"
    if wav.exists():
        raise FileExistsError(wav)
    output.mkdir(exist_ok=True)
    wav.parent.mkdir(exist_ok=True)
    manifest = json.loads((KOKORO / "model-manifest.json").read_text(encoding="utf-8"))
    if text_file:
        # Arbitrary text: a fresh WAV is synthesized here; no earlier WAV is reused.
        speech = read_text_file(text_file)
        meta = dict(json.loads((KOKORO / "sample-A.json").read_text(encoding="utf-8")), display_text=speech)
    else:
        meta = json.loads((KOKORO / f"sample-{passage}.json").read_text(encoding="utf-8"))
        dataset = json.loads((KOKORO.parent / "evaluation-dataset/hi-IN.json").read_text(encoding="utf-8"))
        source = next(row for row in dataset["tests"] if row["id"] == passage)
        speech = meta["speech_normalized_text"]
        if speech != source["speech_normalized_text"] or meta["display_text"] != source["display_text"]:
            raise ValueError("Original passage mismatch")
    engine = replay_engine()
    session = engine.sess
    if session.get_providers() != ["CPUExecutionProvider"]:
        raise ValueError("CPU provider required")
    calls = []
    phonemes = []
    original = engine.tokenizer.phonemize

    def phonemize(*args, **kwargs):
        result = original(*args, **kwargs)
        phonemes.append(result)
        return result

    class CaptureSession:
        def run(self, outputs, inputs):
            result = session.run(outputs, inputs)
            calls.append((inputs, result))
            return result

    engine.tokenizer.phonemize = phonemize
    engine.sess = CaptureSession()
    audio, rate, timings = engine.create_timed(speech, voice="hf_alpha", lang="hi",
                                                speed=1.0, trim=False,
                                                sentence_pause=0, clause_pause=0)
    if len(calls) != 1 or len(phonemes) != 1 or rate != 24000:
        raise ValueError("This experiment requires exactly one 24 kHz batch")
    inputs, (waveform, duration) = calls[0]
    tokens = inputs["input_ids"].ravel().tolist()
    durations = duration.ravel().tolist()
    symbols = engine.tokenizer.known(" ".join(phonemes[0].split()))
    if tokens != [0, *engine.tokenizer.tokenize(symbols), 0] or len(durations) != len(tokens):
        raise ValueError("Duration-to-token correspondence failed")
    if not np.array_equal(waveform.ravel(), audio) or not np.isfinite(audio).all():
        raise ValueError("Unexpected or invalid waveform processing")
    run = uuid.uuid4().hex
    np.save(output / f"{stem}.waveform.npy", waveform, allow_pickle=False)
    sf.write(wav, audio, rate, subtype="PCM_16")
    actual_rate, frames = pcm(wav)
    if actual_rate != rate or len(frames) != 2 * len(audio):
        raise ValueError("Saved waveform timebase changed")
    checksum = hashlib.sha256(wav.read_bytes()).hexdigest()
    raw = dict(run_id=run, audio_sha256=checksum, model=manifest["model"], voice_bundle=manifest["voices"],
               voice="hf_alpha", locale="hi-IN", runtime=meta["runtime"], onnxruntime=__import__("onnxruntime").__version__,
               provider=session.get_providers(), threads=[4, 1], graph_optimization="disabled", prepacking="disabled",
               display_text=meta["display_text"], speech_text=speech,
               text_file=Path(text_file).resolve().relative_to(ROOT).as_posix() if text_file else None, phonemizer_output=phonemes[0],
               input_tensors={key: dict(shape=list(value.shape), dtype=str(value.dtype), values=value.tolist())
                              for key, value in inputs.items()},
               waveform=dict(shape=list(waveform.shape), dtype=str(waveform.dtype), file=f"{stem}.waveform.npy"),
               duration=dict(shape=list(duration.shape), dtype=str(duration.dtype), values=duration.tolist()),
               sample_rate=rate, sample_count=len(audio), hop_samples=HOP,
               predicted_samples=sum(durations) * HOP, trim=False, batch_offset=0,
               sentence_pause=0, clause_pause=0, pcm_conversion="SoundFile PCM_16 without normalization",
               runtime_timings_seconds=[asdict(t) for t in timings])
    write_json(output / f"{stem}.raw-duration.json", raw)
    edges = offsets(durations, len(audio))
    if [(t.phoneme, round(t.start * rate), round(t.end * rate)) for t in timings] != [
        (symbol, edges[i], edges[i + 1]) for i, symbol in enumerate(symbols, 1)
    ]:
        raise ValueError("Fixed-hop edges disagree with runtime timing")
    records = [dict(kind="phoneme", label=symbol, start=edges[i], end=edges[i+1], source="native_model")
               for i, symbol in enumerate(symbols, 1) if edges[i] < edges[i+1]]
    samples = array("h", frames)
    if sys.byteorder != "little":
        samples.byteswap()
    start = 0
    for quiet, group in itertools.groupby(samples, key=lambda n: abs(n) <= 327):
        end = start + sum(1 for _ in group)
        if quiet and (end-start)*1000 >= 120*rate:
            records.append(dict(kind="pause", label="low energy", start=start, end=end, source="audio_boundary"))
        start = end
    for match in re.finditer(r"\S+", speech):
        records.append(dict(kind="word", label=match.group(), start=None, end=None, source=None,
                            text_ref=dict(field="speech", start=match.start(), end=match.end())))
    item = dict(version=1, unit="sample", locale="hi-IN", validation="unreviewed", run_id=run,
                audio=dict(path=wav.relative_to(ROOT).as_posix(), sha256=checksum, sample_rate=rate, sample_count=len(audio)),
                text=dict(display=meta["display_text"], speech=speech), records=records)
    validate(item)
    write_json(output / f"{stem}.timeline.json", item)


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] in {"A", "B"}:
        capture(sys.argv[1])
    elif len(sys.argv) == 4 and sys.argv[1] == "--text-file" and re.fullmatch(r"[C-Z]", sys.argv[3]):
        capture(sys.argv[3], sys.argv[2])
    else:
        raise SystemExit("Usage: capture_native_timing.py A|B  |  capture_native_timing.py --text-file <utf8.txt> <ID C-Z>")
