"""Check the Linux CPU and phonemization path without loading Mithi weights."""
import os
import sys

os.environ.update(OMP_NUM_THREADS="4", MKL_NUM_THREADS="4", OPENBLAS_NUM_THREADS="4",
                  HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1")


def reject_network(event, _args):
    if event in {"socket.connect", "socket.getaddrinfo"}:
        raise RuntimeError("Smoke test requested a network connection")


sys.addaudithook(reject_network)
import torch
import spacy
from spacy.pipeline._parser_internals import transition_system
from misaki import en, espeak

torch.set_num_threads(4)
torch.set_num_interop_threads(1)
if torch.__version__ != "2.9.1+cpu" or torch.version.cuda is not None:
    raise RuntimeError(f"Unexpected Torch build: {torch.__version__}")
if torch.tensor([1, 2], device="cpu").sum().item() != 3:
    raise RuntimeError("CPU tensor operation failed")
if not spacy.load("en_core_web_sm")("CPU speech test."):
    raise RuntimeError("spaCy pipeline produced no tokens")
en.G2P(trf=False, british=False, fallback=espeak.EspeakFallback(british=False))
phonemes, _ = espeak.EspeakG2P(language="hi")("नमस्ते दुनिया")
if not phonemes.strip():
    raise RuntimeError("Hindi phonemizer output is empty")
print(f"CPU Torch {torch.__version__}; spaCy {spacy.__version__}; Hindi phonemes: {phonemes}")
