"""E43.1: isolated, opt-in artwork feasibility probe. No production integration.
Run inside the dedicated venv, with an external --work directory.
"""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

MODEL = "OpenVINO/LCM_Dreamshaper_v7-int8-ov"
REV = "340a03e5488f36f7f222e6efa29819850ad7e4be"
PROMPT = ("A beautifully crafted miniature layered cut-paper diorama of a traditional Indian roadside chai stall, "
          "cinematic three-quarter perspective, intricate handcrafted paper architecture, weathered wooden counter, "
          "brass tea kettle, small fluted tea glasses, biscuit jars, striped fabric awning, textured plaster walls, "
          "detailed surrounding street, lush foreground foliage, warm directional morning sunlight, coherent contact "
          "shadows, atmospheric depth, muted terracotta and teal palette, professional animation concept artwork, "
          "believable proportions, rich material detail, no text, no watermark, no captions.")
GIB = 1024 ** 3
ROOT = Path(__file__).resolve().parents[2]


def save(path, data):
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def prepare(work):
    from huggingface_hub import HfApi, hf_hub_download
    import psutil
    if psutil.virtual_memory().available < 6 * GIB:
        raise RuntimeError("Need at least 6 GiB available RAM before downloading or inference")
    if shutil.disk_usage(work).free < 5 * GIB:
        raise RuntimeError("Need at least 5 GiB free disk in experiment directory")
    info = HfApi().model_info(MODEL, revision=REV, files_metadata=True)
    if info.sha != REV:
        raise RuntimeError("Model revision mismatch")
    allowed = {".xml", ".bin", ".json", ".txt", ".md"}
    files = [s for s in info.siblings if Path(s.rfilename).suffix.lower() in allowed]
    if not files or any(s.size is None for s in files):
        raise RuntimeError("Incomplete model metadata")
    if sum(s.size for s in files) > 3 * GIB:
        raise RuntimeError("Model exceeds approved download budget")
    manifest = []
    for s in files:
        path = Path(hf_hub_download(MODEL, s.rfilename, revision=REV, local_dir=work / "model"))
        sha = digest(path)
        lfs = getattr(s, "lfs", None)
        expected = getattr(lfs, "sha256", None)
        if path.stat().st_size != s.size or (expected and sha != expected):
            raise RuntimeError("Model file verification failed: " + s.rfilename)
        manifest.append(dict(path=s.rfilename, bytes=s.size, sha256=sha,
                             publisher_sha256=expected, publisher_hash_verified=bool(expected)))
    save(work / "model-manifest.json", dict(model=MODEL, revision=REV, files=manifest,
         license_review="experimental use only; upstream OpenRAIL-M obligations retained; redistribution not approved"))
    print("Pinned model downloaded and hashed")


def infer(work, device):
    import openvino as ov
    import openvino_genai as genai
    from PIL import Image
    import numpy as np
    manifest = json.loads((work / "model-manifest.json").read_text(encoding="utf-8"))
    if manifest["model"] != MODEL or manifest["revision"] != REV:
        raise RuntimeError("Unexpected model manifest")
    for item in manifest["files"]:
        p = (work / "model" / item["path"]).resolve()
        if not p.is_relative_to((work / "model").resolve()) or digest(p) != item["sha256"]:
            raise RuntimeError("Model integrity failed")
    core = ov.Core()
    if device not in core.available_devices:
        raise RuntimeError(f"Requested {device} unavailable: {core.available_devices}")
    start = time.perf_counter()
    pipe = genai.Text2ImagePipeline(str(work / "model"), device)
    load_s = time.perf_counter() - start
    start = time.perf_counter()
    result = pipe.generate(PROMPT, width=512, height=512, num_inference_steps=4,
                           num_images_per_prompt=1, guidance_scale=1.0, rng_seed=42)
    seconds = time.perf_counter() - start
    image = np.asarray(result.data)
    if image.shape != (1, 512, 512, 3) or image.dtype != np.uint8:
        raise RuntimeError(f"Unexpected output {image.shape}, {image.dtype}")
    out = work / ("chai-" + device + ".png")
    Image.fromarray(image[0]).save(out)
    save(work / "inference.json", dict(device=device, device_name=core.get_property(device, "FULL_DEVICE_NAME"),
         available_devices=core.available_devices, load_seconds=load_s, generation_seconds=seconds,
         prompt=PROMPT, seed=42, steps=4, guidance_scale=1.0, width=512, height=512,
         model=MODEL, revision=REV, sha256=digest(out),
         versions={x:importlib.metadata.version(x) for x in ("openvino", "openvino-genai", "numpy", "Pillow")}))
    print(out, flush=True)


def monitor(work, device):
    import psutil
    if psutil.virtual_memory().available < 6 * GIB:
        raise RuntimeError("Close other heavy workloads: need 6 GiB available RAM")
    for name in ("inference.json", "chai-" + device + ".png", "benchmark.json"):
        if (work / name).exists():
            raise RuntimeError("Existing output; preserve evidence and use a fresh run directory or explicitly archive outputs")
    before = psutil.virtual_memory().available
    start = time.monotonic()
    peak_rss, minimum_available = 0, before
    reason = None
    log_path = work / "inference.log"
    with log_path.open("w", encoding="utf-8") as log:
        proc = subprocess.Popen([sys.executable, "-I", str(Path(__file__).resolve()), "worker",
                                 "--work", str(work), "--device", device], stdout=log, stderr=subprocess.STDOUT,
                                env=dict(os.environ, HF_HUB_OFFLINE="1"))
        try:
            while proc.poll() is None:
                available = psutil.virtual_memory().available
                minimum_available = min(minimum_available, available)
                try:
                    root = psutil.Process(proc.pid)
                    peak_rss = max(peak_rss, sum(p.memory_info().rss for p in [root, *root.children(recursive=True)]))
                except psutil.Error:
                    pass
                if available < 2 * GIB:
                    reason = "memory floor reached"
                elif time.monotonic() - start > 300:
                    reason = "300 second inference process limit"
                if reason:
                    break
                time.sleep(.25)
        finally:
            if proc.poll() is None:
                try:
                    children = psutil.Process(proc.pid).children(recursive=True)
                except psutil.Error:
                    children = []
                for child in reversed(children):
                    try:
                        child.kill()
                    except psutil.Error:
                        pass
                proc.kill()
            proc.wait()
    report = dict(passed=proc.returncode == 0 and reason is None and (work / "inference.json").exists(),
                  reason=reason, exit_code=proc.returncode, wall_seconds=time.monotonic()-start,
                  peak_sampled_process_tree_rss_bytes=peak_rss, minimum_sampled_available_ram_bytes=minimum_available,
                  initial_available_ram_bytes=before, final_available_ram_bytes=psutil.virtual_memory().available,
                  gpu_memory="not measured", artistic_review="pending")
    if (work / "inference.json").exists():
        report["inference"] = json.loads((work / "inference.json").read_text(encoding="utf-8"))
    save(work / "benchmark.json", report)
    print(json.dumps(report, indent=2))
    return 0 if report["passed"] else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["prepare", "run", "worker"])
    parser.add_argument("--work", required=True, type=Path)
    parser.add_argument("--device", choices=["GPU", "CPU"], default="GPU")
    parser.add_argument("--license-reviewed", action="store_true", help="confirm upstream terms reviewed for this experiment")
    a = parser.parse_args()
    work = a.work.resolve()
    if work.is_relative_to(ROOT) or sys.prefix == sys.base_prefix:
        parser.error("Use an external work directory and isolated virtual environment")
    work.mkdir(parents=True, exist_ok=True)
    if a.command == "prepare":
        if not a.license_reviewed:
            parser.error("Review upstream licence and provenance before download")
        prepare(work)
    elif a.command == "worker":
        infer(work, a.device)
    else:
        return monitor(work, a.device)
    return 0


if __name__ == "__main__":
    sys.exit(main())
