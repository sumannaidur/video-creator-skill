"""Run one pinned Mithi passage in a fresh CPU process."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import time

folder = Path(__file__).resolve().parent
model = Path(sys.argv[1])
locale, passage_id = sys.argv[2:4]
voices = {"hi-IN": "charvi", "kn-IN": "vaidehi", "te-IN": "ahana",
          "ta-IN": "malini", "en-IN": "anirban"}
voice = voices[locale]
lang = locale.split("-")[0]
dataset = json.loads((folder.parent / "evaluation-dataset" / f"{locale}.json").read_text(encoding="utf-8"))
passage = next(p for p in dataset["tests"] if p["id"] == passage_id)
os.environ.update(HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1", OMP_NUM_THREADS="4",
                  MKL_NUM_THREADS="4", OPENBLAS_NUM_THREADS="4")


def reject_network(event, _argument):
    if event in {"socket.connect", "socket.getaddrinfo", "socket.gethostbyname"}:
        raise RuntimeError("Network requested during local inference")


sys.addaudithook(reject_network)
import torch

if torch.version.cuda is not None:
    raise RuntimeError("Expected a CPU-only PyTorch wheel")
torch.set_num_threads(4)
torch.set_num_interop_threads(1)
spec = importlib.util.spec_from_file_location("mithi_release", model / "run.py")
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)
start = time.perf_counter()
engine = runtime.Mithi(str(model), device="cpu")
load_seconds = time.perf_counter() - start
text = passage["speech_normalized_text"]
start = time.perf_counter()
audio = engine.synthesize(text, lang=lang, voice=voice)
synthesis_seconds = time.perf_counter() - start
duration = len(audio) / runtime.SR
if duration <= 0:
    raise RuntimeError("No waveform returned")
output = Path(sys.argv[4]) if len(sys.argv) > 4 else folder / "samples" / f"{locale}-{passage_id}.wav"
output.parent.mkdir(exist_ok=True)
engine.save(audio, str(output))
print(json.dumps(dict(locale=locale, passage=passage_id, voice=voice, device="cpu",
                      threads=4, interop_threads=1, torch_version=torch.__version__,
                      seed=engine.settings["seed"], display_text=passage["display_text"],
                      speech_input=text, load_seconds=load_seconds,
                      synthesis_seconds=synthesis_seconds, duration_seconds=duration,
                      real_time_factor=synthesis_seconds / duration)))
