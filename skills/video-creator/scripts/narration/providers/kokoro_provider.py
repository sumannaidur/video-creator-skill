"""Kokoro ONNX narration provider: synthesis + same-inference native timing + contextual word/phrase mapping.

Runs inside the user's Kokoro runtime (a Python environment with kokoro-onnx, onnxruntime, soundfile, phonemizer).
It is invoked by narrate.py with a JSON request; it never downloads anything and never reuses an older WAV.
Packaged from experiments/E03/kokoro-hindi/synthesize.py, experiments/E04/native-timing/capture_native_timing.py and
experiments/E04/native-timing/mapping/map_text_to_phonemes.py (P014.3B). Behaviour is unchanged except that locale,
voice, model paths and output locations are parameters.

Request JSON: {project, out_dir, id, text, locale, voice, model, voices, kokoro_lang, espeak_lang}
"""
from collections import Counter
from dataclasses import asdict
import hashlib
import importlib.metadata
import itertools
import json
from pathlib import Path
import re
import sys
import uuid


def reject_network(event, _args):
    if event in {"socket.connect", "socket.getaddrinfo", "socket.gethostbyname"}:
        raise RuntimeError("Network access requested during local synthesis")


sys.addaudithook(reject_network)
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from timeline import pcm, validate  # noqa: E402

import kokoro_onnx  # noqa: E402
import numpy as np  # noqa: E402
import onnxruntime as ort  # noqa: E402
import soundfile as sf  # noqa: E402
from kokoro_onnx.tokenizer import Tokenizer  # noqa: E402
from phonemizer import phonemize  # noqa: E402
from phonemizer.separator import Separator  # noqa: E402

HOP = 600
PHRASE_END = "।॥.?!,;:"


def bounded_session(model_path):
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_DISABLE_ALL
    options.add_session_config_entry("session.disable_prepacking", "1")
    return ort.InferenceSession(model_path, sess_options=options, providers=["CPUExecutionProvider"])


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def offsets(durations, samples):
    if not durations or any(type(d) is not int or d < 0 for d in durations):
        raise ValueError("Expected nonnegative integral frame counts")
    edges = list(itertools.accumulate((d * HOP for d in durations), initial=0))
    if edges[-1] != samples:
        raise ValueError(f"Frame total predicts {edges[-1]} samples, observed {samples}")
    return edges


def engine_for(req):
    manifest = json.loads((HERE / "kokoro-onnx.manifest.json").read_text(encoding="utf-8"))
    for key in ("model", "voices"):
        if sha256(req[key]) != manifest[key]["sha256"]:
            raise ValueError(f"Pinned {key} hash mismatch: {req[key]}")
    kokoro_onnx.create_session = bounded_session
    engine = kokoro_onnx.Kokoro(req["model"], req["voices"])
    if engine.sess.get_providers() != ["CPUExecutionProvider"]:
        raise ValueError("CPU provider required")
    if req["voice"] not in engine.get_voices():
        raise ValueError(f"Voice {req['voice']} absent from the pinned voice bundle")
    return engine, manifest


def capture(req, engine, manifest, wav, out, stem):
    """One graph call produces both the waveform and the duration vector (from capture_native_timing.py)."""
    project = Path(req["project"]).resolve()
    speech = req["text"]
    session = engine.sess
    calls, phonemes = [], []
    original = engine.tokenizer.phonemize

    def phonemize_hook(*args, **kwargs):
        result = original(*args, **kwargs)
        phonemes.append(result)
        return result

    class CaptureSession:
        def run(self, outputs, inputs):
            result = session.run(outputs, inputs)
            calls.append((inputs, result))
            return result

    engine.tokenizer.phonemize = phonemize_hook
    engine.sess = CaptureSession()
    audio, rate, timings = engine.create_timed(speech, voice=req["voice"], lang=req["kokoro_lang"], speed=1.0, trim=False,
                                               sentence_pause=0, clause_pause=0)
    engine.sess, engine.tokenizer.phonemize = session, original
    if len(calls) != 1 or len(phonemes) != 1 or rate != 24000:
        raise ValueError("This provider requires exactly one 24 kHz batch (shorten the segment)")
    inputs, (waveform, duration) = calls[0]
    tokens = inputs["input_ids"].ravel().tolist()
    durations = duration.ravel().tolist()
    symbols = engine.tokenizer.known(" ".join(phonemes[0].split()))
    if tokens != [0, *engine.tokenizer.tokenize(symbols), 0] or len(durations) != len(tokens):
        raise ValueError("Duration-to-token correspondence failed")
    if not np.array_equal(waveform.ravel(), audio) or not np.isfinite(audio).all():
        raise ValueError("Unexpected or invalid waveform processing")
    run = uuid.uuid4().hex
    sf.write(wav, audio, rate, subtype="PCM_16")
    actual_rate, frames = pcm(wav)
    if actual_rate != rate or len(frames) != 2 * len(audio):
        raise ValueError("Saved waveform timebase changed")
    checksum = sha256(wav)
    raw = dict(run_id=run, audio_sha256=checksum, provider="kokoro-onnx", model=manifest["model"], voice_bundle=manifest["voices"],
               voice=req["voice"], locale=req["locale"], runtime="kokoro-onnx==" + importlib.metadata.version("kokoro-onnx"),
               onnxruntime=ort.__version__, provider_execution=session.get_providers(), threads=[4, 1], graph_optimization="disabled",
               prepacking="disabled", display_text=speech, speech_text=speech, phonemizer_output=phonemes[0],
               input_tensors={k: dict(shape=list(v.shape), dtype=str(v.dtype), values=v.tolist()) for k, v in inputs.items()},
               duration=dict(shape=list(duration.shape), dtype=str(duration.dtype), values=duration.tolist()),
               sample_rate=rate, sample_count=len(audio), hop_samples=HOP, predicted_samples=sum(durations) * HOP,
               trim=False, sentence_pause=0, clause_pause=0, pcm_conversion="SoundFile PCM_16 without normalization",
               runtime_timings_seconds=[asdict(t) for t in timings])
    write_json(out / f"{stem}.raw-duration.json", raw)
    edges = offsets(durations, len(audio))
    if [(t.phoneme, round(t.start * rate), round(t.end * rate)) for t in timings] != [
            (symbol, edges[i], edges[i + 1]) for i, symbol in enumerate(symbols, 1)]:
        raise ValueError("Fixed-hop edges disagree with runtime timing")
    records = [dict(kind="phoneme", label=symbol, start=edges[i], end=edges[i + 1], source="native_model")
               for i, symbol in enumerate(symbols, 1) if edges[i] < edges[i + 1]]
    samples = np.frombuffer(frames, dtype="<i2")
    start = 0
    for quiet, group in itertools.groupby(samples, key=lambda n: abs(int(n)) <= 327):
        end = start + sum(1 for _ in group)
        if quiet and (end - start) * 1000 >= 120 * rate:
            records.append(dict(kind="pause", label="low energy", start=start, end=end, source="audio_boundary"))
        start = end
    for match in re.finditer(r"\S+", speech):
        records.append(dict(kind="word", label=match.group(), start=None, end=None, source=None,
                            text_ref=dict(field="speech", start=match.start(), end=match.end())))
    item = dict(version=1, unit="sample", locale=req["locale"], validation="unreviewed", run_id=run,
                timing=dict(method="native_durations", provider="kokoro-onnx", note="model-predicted phoneme durations from the same inference"),
                audio=dict(path=wav.relative_to(project).as_posix(), sha256=checksum, sample_rate=rate, sample_count=len(audio)),
                text=dict(display=speech, speech=speech), records=records)
    validate(item, project)
    write_json(out / f"{stem}.native.timeline.json", item)
    return raw, item


def align(req, raw, timeline, tokenizer, out, stem):
    """Contextual eSpeak word separators map words onto captured symbols (from map_text_to_phonemes.py)."""
    project = Path(req["project"]).resolve()
    speech = timeline["text"]["speech"]
    words = [r for r in timeline["records"] if r["kind"] == "word"]
    captured = raw["phonemizer_output"]
    symbols = " ".join(captured.split())
    tokens = raw["input_tensors"]["input_ids"]["values"][0]
    if tokenizer.phonemize(speech, req["kokoro_lang"]) != captured or [0, *tokenizer.tokenize(symbols), 0] != tokens:
        raise ValueError("Captured symbol or token identity mismatch")
    edges = [0]
    for d in raw["duration"]["values"]:
        edges.append(edges[-1] + HOP * d)
    marked = phonemize(speech.strip(), req["espeak_lang"], separator=Separator(word="|", phone=""), preserve_punctuation=True, with_stress=True)
    groups = [tokenizer.known(s) for s in marked.removesuffix("|").split("|")]
    exact = " ".join(groups) == symbols and tokenizer.tokenize(" ".join(groups)) == tokens[1:-1]
    positional = exact and len(groups) == len(words) and all(groups)
    isolated = [tokenizer.phonemize(w["label"], req["kokoro_lang"]) for w in words]
    counts = Counter(groups)
    evidence, offset = [], 0
    for i, word in enumerate(words):
        ref = word["text_ref"]
        prefix = tokenizer.phonemize(speech[:ref["end"]], req["kokoro_lang"])
        group = groups[i] if positional else ""
        same = re.sub("[ˈˌ]", "", group) == re.sub("[ˈˌ]", "", isolated[i])
        expected = " ".join(groups[:i + 1]) if positional else None
        stress_only = expected is not None and re.sub("[ˈˌ]", "", prefix) == re.sub("[ˈˌ]", "", expected)
        suffix = word["label"][-1]
        length = len(group) - int(suffix in "?!,;:" and group.endswith(suffix))
        supported = positional and same and stress_only and length > 0
        first, last = offset, offset + length - 1
        row = dict(index=i, text_ref=ref, spoken=word["label"], backend_group=group, isolated=isolated[i], prefix=prefix,
                   prefix_exact=prefix == expected, prefix_agrees_ignoring_stress=stress_only, isolated_agrees_ignoring_stress=same,
                   repeated_backend_group=bool(group and counts[group] > 1), method="full_context_espeak_separator" if supported else None,
                   first_symbol=first if supported else None, last_symbol=last if supported else None)
        if supported and edges[first + 1] < edges[last + 2]:
            word.update(start=edges[first + 1], end=edges[last + 2], source="native_model", mapping=row.copy())
        word["display_ref"] = {**ref, "field": "display"}
        row["mapped"] = word["source"] == "native_model"
        evidence.append(row)
        offset += len(group) + 1
    spans, first = [], 0
    for i, word in enumerate(words):
        if word["label"][-1] in PHRASE_END or i == len(words) - 1:
            spans.append((first, i + 1)); first = i + 1
    for first, stop in spans:
        subset = words[first:stop]
        lo, hi = subset[0]["text_ref"]["start"], subset[-1]["text_ref"]["end"]
        mapped = all(w["source"] == "native_model" for w in subset)
        record = dict(kind="phrase", label=speech[lo:hi], source="native_model" if mapped else None,
                      start=subset[0]["start"] if mapped else None, end=subset[-1]["end"] if mapped else None,
                      text_ref=dict(field="speech", start=lo, end=hi), display_ref=dict(field="display", start=lo, end=hi))
        if mapped:
            record["mapping"] = dict(method="contextual_word_union", first_word=first, stop_word=stop,
                                     first_symbol=subset[0]["mapping"]["first_symbol"], last_symbol=subset[-1]["mapping"]["last_symbol"])
        timeline["records"].append(record)
    validate(timeline, project)
    write_json(out / f"{stem}.timeline.json", timeline)
    result = dict(words=len(words), words_mapped=sum(r["mapped"] for r in evidence), phrases=len(spans),
                  phrases_mapped=sum(1 for r in timeline["records"] if r["kind"] == "phrase" and r["source"]),
                  prefix_exact=sum(r["prefix_exact"] for r in evidence), separator_roundtrip_exact=exact,
                  versions={p: importlib.metadata.version(p) for p in ("kokoro-onnx", "phonemizer", "espeakng-loader")})
    write_json(out / f"{stem}.mapping.json", dict(result=result, marked=marked, words=evidence))
    return result


def probe(req):
    """Read-only capability probe used by doctor.py: no synthesis, no writes."""
    manifest = json.loads((HERE / "kokoro-onnx.manifest.json").read_text(encoding="utf-8"))
    result = dict(versions={p: importlib.metadata.version(p) for p in ("kokoro-onnx", "onnxruntime", "phonemizer", "espeakng-loader", "soundfile", "numpy")},
                  cpu_provider="CPUExecutionProvider" in ort.get_available_providers())
    for key in ("model", "voices"):
        path = Path(req.get(key) or "")
        verify = bool(req.get("verify_hashes") and path.is_file())
        result[key] = dict(path=str(path), exists=path.is_file(), size_matches=path.is_file() and path.stat().st_size == manifest[key]["bytes"],
                           hash_verified=verify, pinned_hash=(sha256(path) == manifest[key]["sha256"]) if verify else None)
    if result["voices"]["exists"]:
        with np.load(req["voices"]) as bundle:
            result["voices_in_bundle"] = sorted(bundle.files)
    print(json.dumps(result))


def main():
    if "--probe" in sys.argv:
        return probe(json.loads(sys.stdin.read()))
    req = json.loads(sys.stdin.read())
    project, out = Path(req["project"]).resolve(), (Path(req["project"]) / req["out_dir"]).resolve()
    if not out.is_relative_to(project):
        raise ValueError("Output folder must be inside the project")
    out.mkdir(parents=True, exist_ok=True)
    wav = out / f"{req['id']}.wav"
    if wav.exists():
        raise FileExistsError(f"{wav} exists; narration is never overwritten or re-timed against an older WAV")
    engine, manifest = engine_for(req)
    raw, timeline = capture(req, engine, manifest, wav, out, req["id"])
    result = align(req, raw, timeline, Tokenizer(), out, req["id"])
    print(json.dumps(dict(id=req["id"], wav=wav.relative_to(project).as_posix(), timeline=(out / f"{req['id']}.timeline.json").relative_to(project).as_posix(),
                          run_id=raw["run_id"], sha256=raw["audio_sha256"], seconds=raw["sample_count"] / raw["sample_rate"], **result), ensure_ascii=False))


if __name__ == "__main__":
    main()
