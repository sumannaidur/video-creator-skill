"""Mithi v2 Flash narration provider: CPU synthesis + same-inference native token durations mapped to words and phrases.

Runs inside the user's Mithi runtime (the WSL2 Ubuntu environment with CPU PyTorch, soundfile and the pinned model
folder). Invoked by narrate.py with a JSON request on stdin; it never downloads anything and never reuses an older WAV.
Packaged from experiments/E03/mithi/synthesize.py and experiments/E03/mithi-wsl/run_sample.py (P015.2A). Locale, voice,
model folder and output locations are parameters; the language code comes from the registry route, not from this file.

Timing: the pinned implementation decides a duration (in decoder frames) for every phoneme token it decodes, and builds
a hard monotonic alignment from them. This provider records those durations from the same inference and maps them to
the original text words through the model's own token-to-word ownership (mithi_mapping.py, P015.2B). A mapping that is
ambiguous or inconsistent is rejected: words and phrases then stay null and the reason is written to <id>.mapping.json.
No timing is estimated or distributed. All timings are model-predicted and unreviewed.

Request JSON: {project, out_dir, id, text, locale, voice, model, lang}
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import platform
import re
import resource
import sys
import time
import uuid

os.environ.update(HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1", OMP_NUM_THREADS="4", MKL_NUM_THREADS="4", OPENBLAS_NUM_THREADS="4")


def reject_network(event, _args):
    if event in {"socket.connect", "socket.getaddrinfo", "socket.gethostbyname"}:
        raise RuntimeError("Network access requested during local synthesis")


sys.addaudithook(reject_network)
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE))
from timeline import pcm, validate  # noqa: E402
from mithi_mapping import MappingError, map_timeline, unmapped  # noqa: E402

MANIFEST = json.loads((HERE / "mithi-v2-flash.manifest.json").read_text(encoding="utf-8"))
MIN_AVAILABLE = 1 << 30  # refuse to load the model with less than 1 GiB available (the guest memory floor used when Mithi was first exercised)


def sha256(path):
    with open(path, "rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def available():
    for line in Path("/proc/meminfo").read_text().splitlines():
        if line.startswith("MemAvailable:"):
            return int(line.split()[1]) * 1024
    return None


def model_files(model, verify):
    """Size-check every pinned file; hash them when verify is true. Returns per-file evidence."""
    rows = []
    for entry in MANIFEST["files"]:
        path = Path(model) / entry["path"]
        row = dict(path=entry["path"], exists=path.is_file(), size_matches=path.is_file() and path.stat().st_size == entry["bytes"])
        row["sha256"] = sha256(path) if verify and row["size_matches"] else None
        row["pinned_hash"] = (row["sha256"] == entry["sha256"]) if row["sha256"] else None
        rows.append(row)
    return rows


def load(model):
    """The pinned run.py, imported unchanged (its embedded modules register on import)."""
    import torch
    if torch.version.cuda is not None:
        raise ValueError("CPU-only PyTorch wheel required")
    torch.set_num_threads(4)
    torch.set_num_interop_threads(1)
    spec = importlib.util.spec_from_file_location("mithi_release", str(Path(model) / "run.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return torch, module, sys.modules["mithi_tts.tts"]


def synthesize(req, wav, out, stem):
    project = Path(req["project"]).resolve()
    files = model_files(req["model"], verify=True)
    bad = [f["path"] for f in files if not f["pinned_hash"]]
    if bad:
        raise ValueError(f"Pinned model integrity mismatch: {bad}")
    before = available()
    if before is not None and before < MIN_AVAILABLE:
        raise MemoryError("Less than 1 GiB RAM available; synthesis refused")
    started = time.perf_counter()
    torch, runtime, tts = load(req["model"])
    engine = runtime.Mithi(str(req["model"]), device="cpu")
    load_seconds = time.perf_counter() - started
    lang, voice, text = req["lang"], req["voice"], req["text"]
    if lang not in runtime.Mithi.LANGS:
        raise ValueError(f"Language {lang!r} is not in the pinned model ({', '.join(runtime.Mithi.LANGS)})")
    if voice not in engine.voices:
        raise ValueError(f"Voice {voice!r} is not in the pinned model ({', '.join(engine.voices)})")
    pieces = engine.split(text, lang)
    if len(pieces) != 1:
        raise ValueError(f"Text splits into {len(pieces)} model pieces; this provider requires one piece per segment (shorten the segment)")
    fe = tts.fe
    captured, original_decode, original_sample = [], tts.decode, engine.writer.sample

    def decode_hook(codes):
        result = original_decode(codes)
        captured.append(dict(dur=result[0].tolist()))
        return result

    def sample_hook(*args, **kwargs):
        dec_ids, codes = original_sample(*args, **kwargs)
        captured.append(dict(dec_ids=dec_ids.tolist()))
        return dec_ids, codes

    tts.decode, engine.writer.sample = decode_hook, sample_hook
    started = time.perf_counter()
    try:
        audio = engine.synthesize(text, lang=lang, voice=voice)
    finally:
        tts.decode, engine.writer.sample = original_decode, original_sample
    synthesis_seconds = time.perf_counter() - started
    import numpy as np
    if len(captured) != 2 or not np.isfinite(audio).all() or len(audio) == 0:
        raise ValueError("Expected exactly one decoded piece with a finite waveform")
    dec_ids, dur = captured[0]["dec_ids"], captured[1]["dur"]
    norm, ps = fe.phonemes(text, lang)
    ids = [0, *[i for i in map(engine.vocab.get, ps) if i is not None], 0]
    words = fe.words_of(text, norm)
    tok_word, n_groups = fe.token_words(ids)
    # Encoder tokens map onto decoded tokens in order; the writer only inserts breath tokens.
    enc_of, j = [], 0
    for token in dec_ids:
        if j < len(ids) and token == ids[j]:
            enc_of.append(j); j += 1
        elif token == fe.BREATH_ID and j > 0:
            enc_of.append(j - 1)
        else:
            raise ValueError("Decoded tokens do not follow the encoder tokens")
    if j != len(ids) or len(dur) != len(dec_ids):
        raise ValueError("Duration-to-token correspondence failed")
    units = sum(dur)
    if units <= 0 or len(audio) % units:
        raise ValueError(f"{len(audio)} samples is not a whole multiple of {units} duration units")
    per_unit = len(audio) // units
    run = uuid.uuid4().hex
    engine.save(audio, str(wav))
    rate, frames = pcm(wav)
    if rate != runtime.SR or len(frames) != 2 * len(audio):
        raise ValueError("Saved waveform timebase changed")
    pcm16 = np.frombuffer(frames, dtype="<i2")
    checksum = sha256(wav)
    peak_rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024
    symbol = {v: k for k, v in engine.vocab.items()}
    matches = list(re.finditer(r"\S+", text))
    import soundfile
    raw = dict(run_id=run, audio_sha256=checksum, provider="mithi", model=dict(repo=MANIFEST["repo"], revision=MANIFEST["revision"],
               files=[dict(path=f["path"], sha256=f["sha256"]) for f in files]), voice=voice, locale=req["locale"], lang=lang,
               runtime=dict(python=platform.python_version(), torch=torch.__version__, soundfile=soundfile.__version__,
                            platform=platform.platform(), device="cpu", threads=4, interop_threads=1),
               settings=engine.settings, seed=engine.settings["seed"], display_text=text, speech_text=text, normalized_text=norm,
               phonemes=ps, encoder_ids=ids, decoded_ids=dec_ids, decoded_to_encoder=enc_of, durations=dur,
               samples_per_duration_unit=per_unit, token_word=tok_word, model_words=words, model_word_groups=n_groups,
               model_words_match_groups=n_groups == len(words), text_words=[m.group() for m in matches],
               special_ids=dict(space=fe.SPACE, breath=fe.BREATH_ID, punctuation=sorted(fe.PUNCT_IDS), edge=0),
               symbols={str(t): symbol.get(t) for t in sorted(set(dec_ids))},
               sample_rate=rate, sample_count=len(audio), duration_seconds=len(audio) / rate,
               load_seconds=load_seconds, synthesis_seconds=synthesis_seconds, real_time_factor=synthesis_seconds / (len(audio) / rate),
               peak_rss_bytes=peak_rss, available_before_bytes=before, available_after_bytes=available(),
               peak_abs_sample=int(np.abs(pcm16.astype(np.int32)).max()), full_scale_samples=int(np.count_nonzero((pcm16 >= 32767) | (pcm16 <= -32768))),
               pcm_conversion="SoundFile PCM_16 after the model's clip to [-1, 1]")
    write_json(out / f"{stem}.raw-duration.json", raw)
    try:
        records, evidence = map_timeline(text, raw)
        mapping = dict(result="mapped", words=evidence)
    except MappingError as error:  # never estimated: words and phrases stay null and the stage refuses the segment
        records, mapping = unmapped(text), dict(result="rejected", code=error.code, reason=str(error))
    write_json(out / f"{stem}.mapping.json", mapping)
    mapped = mapping["result"] == "mapped"
    item = dict(version=1, unit="sample", locale=req["locale"], validation="unreviewed", run_id=run,
                timing=dict(method="native_durations", provider="mithi", word_timing=mapped,
                            note="model-predicted token durations from the same inference, mapped to words by the model's own token-word ownership"
                            if mapped else f"word mapping rejected: {mapping['reason']}"),
                audio=dict(path=wav.relative_to(project).as_posix(), sha256=checksum, sample_rate=rate, sample_count=len(audio)),
                text=dict(display=text, speech=text), records=records)
    validate(item, project)
    write_json(out / f"{stem}.timeline.json", item)
    return raw, item, mapping


def probe(req):
    """Read-only capability probe used by doctor.py: no synthesis, no writes."""
    import importlib.metadata
    result = dict(provider="mithi", platform=platform.platform(), python=platform.python_version(), available_bytes=available())
    try:
        result["versions"] = {p: importlib.metadata.version(p) for p in ("torch", "soundfile", "numpy", "safetensors", "transformers")}
    except importlib.metadata.PackageNotFoundError as error:
        result["versions_error"] = str(error)
    files = model_files(req.get("model") or "", verify=bool(req.get("verify_hashes")))
    result["model"] = dict(path=req.get("model"), revision=MANIFEST["revision"], files=files,
                           complete=all(f["size_matches"] for f in files), pinned_hash=None if not req.get("verify_hashes") else all(f["pinned_hash"] for f in files))
    try:
        import torch
        result["cpu_only_torch"] = torch.version.cuda is None
        from safetensors import safe_open
        with safe_open(str(Path(req["model"]) / "writer.safetensors"), "pt") as f:
            result["voices"] = json.loads(f.metadata()["voices"])
    except Exception as error:  # reported, never hidden
        result["error"] = f"{type(error).__name__}: {error}"
    result["ok"] = bool(result["model"]["complete"] and result.get("cpu_only_torch") and result.get("voices")
                        and result["model"]["pinned_hash"] is not False and "versions" in result)
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
    raw, timeline, mapping = synthesize(req, wav, out, req["id"])
    words = [r for r in timeline["records"] if r["kind"] == "word"]
    phrases = [r for r in timeline["records"] if r["kind"] == "phrase"]
    print(json.dumps(dict(id=req["id"], wav=wav.relative_to(project).as_posix(), timeline=(out / f"{req['id']}.timeline.json").relative_to(project).as_posix(),
                          run_id=raw["run_id"], sha256=raw["audio_sha256"], seconds=raw["duration_seconds"], words=len(words), words_mapped=sum(1 for w in words if w["source"]),
                          phrases=len(phrases), phrases_mapped=sum(1 for r in phrases if r["source"]), word_timing=timeline["timing"]["word_timing"],
                          mapping=mapping["result"], mapping_error=mapping.get("code"),
                          synthesis_seconds=round(raw["synthesis_seconds"], 3), real_time_factor=round(raw["real_time_factor"], 3),
                          peak_rss_mib=round(raw["peak_rss_bytes"] / 2 ** 20, 1)), ensure_ascii=False))


if __name__ == "__main__":
    main()
