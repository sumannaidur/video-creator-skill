"""Monitor a single WSL CPU synthesis and retain its measured results."""
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
MITHI = HERE.parent / "mithi"
MODEL = Path("/mnt/d/video-creator-skill-experiments/E03/mithi/models")
GIB = 1024**3
PAGE = os.sysconf("SC_PAGE_SIZE")


def host_available():
    command = "(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory"
    value = subprocess.check_output(
        ["/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe",
         "-NoProfile", "-NonInteractive", "-Command", command], timeout=4
    )
    return int(value.strip()) * 1024


def guest_available():
    return int(next(line.split()[1] for line in Path("/proc/meminfo").read_text().splitlines()
                    if line.startswith("MemAvailable:"))) * 1024


def rss(group):
    total = 0
    for path in Path("/proc").glob("[0-9]*/stat"):
        try:
            fields = path.read_text().rsplit(")", 1)[1].split()
            if int(fields[2]) == group:
                total += int(fields[21]) * PAGE
        except (FileNotFoundError, ProcessLookupError, PermissionError):
            continue
    return total


def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def main(locale, passage):
    manifest = json.loads((MITHI / "model-manifest.json").read_text(encoding="utf-8"))
    for entry in manifest["files"]:
        path = MODEL / entry["path"]
        if path.stat().st_size != entry["bytes"] or sha(path) != entry["sha256"]:
            raise ValueError(f"Model integrity mismatch: {entry['path']}")
    output = HERE / "samples" / f"{locale}-{passage}.wav"
    if output.exists():
        raise FileExistsError(output)
    output.parent.mkdir(exist_ok=True)
    logs = HERE / "evidence"
    logs.mkdir(exist_ok=True)
    stem = output.stem
    host_start, guest_start = host_available(), guest_available()
    if host_start < 2*GIB or guest_start < GIB:
        raise RuntimeError("Insufficient host or guest RAM before launch")
    host_min, guest_min = host_start, guest_start
    peak = 0
    started = time.monotonic()
    stop = None
    with (logs / f"{stem}.stdout.txt").open("w") as stdout, (logs / f"{stem}.stderr.txt").open("w") as stderr:
        child = subprocess.Popen(
            [sys.executable, "-B", str(MITHI / "synthesize.py"), str(MODEL), locale, passage, str(output)],
            stdout=stdout, stderr=stderr, start_new_session=True)
        try:
            host_check = started
            while child.poll() is None:
                now = time.monotonic()
                if now >= host_check:
                    host_min = min(host_min, host_available())
                    host_check = now + 1
                guest_min = min(guest_min, guest_available())
                peak = max(peak, rss(child.pid))
                if time.monotonic() - started >= 180:
                    stop = "180-second timeout"
                elif peak > 2*GIB:
                    stop = "2 GiB process-tree memory ceiling"
                elif host_min < 2*GIB or guest_min < GIB:
                    stop = "host or guest available RAM floor"
                if stop:
                    break
                time.sleep(.2)
        except Exception as exc:
            stop = f"Monitor failure: {type(exc).__name__}"
        finally:
            if child.poll() is None:
                os.killpg(child.pid, signal.SIGKILL)
            child.wait()
    result = dict(revision=manifest["revision"], host_available_before_bytes=host_start,
                  guest_available_before_bytes=guest_start, host_available_min_sampled_bytes=host_min,
                  guest_available_min_sampled_bytes=guest_min, peak_sampled_process_tree_bytes=peak,
                  process_seconds=time.monotonic()-started, exit_code=child.returncode, stop_reason=stop)
    if not stop and child.returncode == 0:
        result.update(json.loads((logs / f"{stem}.stdout.txt").read_text(encoding="utf-8").splitlines()[-1]))
        result.update(wav=output.relative_to(HERE).as_posix(), sha256=sha(output))
    (logs / f"{stem}.json").write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    if stop or child.returncode:
        raise SystemExit(stop or f"Synthesis failed: {stem}")


if __name__ == "__main__":
    main(*sys.argv[1:])
