"""One local CPU Kokoro ONNX Hindi passage: dataset passage A/B or arbitrary UTF-8 text from a file."""

import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path


def reject_network(event, _args):
    if event in {"socket.connect", "socket.getaddrinfo", "socket.gethostbyname"}:
        raise RuntimeError("Network access requested during local synthesis")


sys.addaudithook(reject_network)

import kokoro_onnx
import onnxruntime as ort
import soundfile as sf


def bounded_session(model_path):
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_DISABLE_ALL
    options.add_session_config_entry("session.disable_prepacking", "1")
    return ort.InferenceSession(
        model_path, sess_options=options, providers=["CPUExecutionProvider"]
    )


def main():
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--passage", choices=["A", "B"])
    source.add_argument("--text-file", type=Path, help="UTF-8 Hindi text, used verbatim as speech text")
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--dataset", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--metadata", type=Path, required=True)
    args = parser.parse_args()
    if not args.model.is_file() or not args.voices.is_file():
        raise FileNotFoundError("Pinned local model or voice bundle missing")
    if args.passage:
        if not args.dataset:
            parser.error("--dataset is required with --passage")
        data = json.loads(args.dataset.read_text(encoding="utf-8"))
        assert data["locale"] == "hi-IN"
        passage = next(item for item in data["tests"] if item["id"] == args.passage)
        text = passage["speech_normalized_text"]
    else:
        raw = args.text_file.read_bytes()
        try:
            text = " ".join(raw.decode("utf-8-sig").split())
        except UnicodeDecodeError as error:
            raise ValueError("Text file is not valid UTF-8") from error
        if not text or len(text) > 2000:
            raise ValueError("Text must be 1–2000 characters")
        if not any("ऀ" <= ch <= "ॿ" for ch in text):
            raise ValueError("Text contains no Devanagari characters")
        passage = {"display_text": text}
    os.environ["ONNX_PROVIDER"] = "CPUExecutionProvider"
    kokoro_onnx.create_session = bounded_session
    start = time.perf_counter()
    engine = kokoro_onnx.Kokoro(str(args.model), str(args.voices))
    load_seconds = time.perf_counter() - start
    if engine.sess.get_providers() != ["CPUExecutionProvider"]:
        raise RuntimeError("Unexpected ONNX Runtime provider")
    if "hf_alpha" not in engine.get_voices():
        raise RuntimeError("Selected Hindi voice absent from bundle")
    start = time.perf_counter()
    audio, rate = engine.create(text, voice="hf_alpha", lang="hi", speed=1.0, trim=False)
    if not len(audio) or not rate:
        raise RuntimeError("Model returned empty audio")
    synthesis_seconds = time.perf_counter() - start
    args.output.parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.output, audio, rate)
    result = {
        "passage": args.passage,
        "text_file": str(args.text_file) if args.text_file else None,
        "text_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "display_text": passage["display_text"],
        "speech_normalized_text": text,
        "model": str(args.model),
        "voices": str(args.voices),
        "voice": "hf_alpha",
        "locale": "hi-IN",
        "runtime": "kokoro-onnx==0.6.1",
        "provider": engine.sess.get_providers(),
        "intra_op_threads": 4,
        "inter_op_threads": 1,
        "graph_optimization": "disabled",
        "prepacking": "disabled",
        "python_network_guard": True,
        "load_seconds": load_seconds,
        "synthesis_seconds": synthesis_seconds,
        "audio_duration_seconds": len(audio) / rate,
        "real_time_factor": synthesis_seconds / (len(audio) / rate),
        "sample_rate": rate,
        "output_bytes": args.output.stat().st_size,
    }
    args.metadata.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in result.items() if key not in ("display_text", "speech_normalized_text")}, indent=2))


if __name__ == "__main__":
    main()
