"""Download one pinned GitHub release asset in bounded byte ranges; verify SHA-256."""

import argparse
import concurrent.futures
import hashlib
import pathlib
import shutil
import subprocess
import math


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("output", type=pathlib.Path)
    parser.add_argument("--size", type=int, required=True)
    parser.add_argument("--sha256", required=True)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--chunk-bytes", type=int, default=1048576)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    span = args.chunk_bytes
    parts = math.ceil(args.size / span)

    def get_part(index):
        start = index * span
        end = min(args.size - 1, start + span - 1)
        path = args.output.with_name(f"{args.output.name}.part{index}")
        if path.exists() and path.stat().st_size == end - start + 1:
            return path
        result = subprocess.run(
            ["curl.exe", "--fail", "--location", "--silent", "--show-error",
             "--retry", "3", "--retry-all-errors", "--retry-delay", "1",
             "--max-time", "600", "--range", f"{start}-{end}",
             "--output", str(path), "--write-out", "%{http_code}", args.url],
            capture_output=True, text=True, timeout=650,
        )
        if result.returncode or result.stdout != "206":
            raise RuntimeError(f"part {index}: curl failed (exit {result.returncode}, HTTP {result.stdout})")
        if path.stat().st_size != end - start + 1:
            raise RuntimeError(f"part {index}: incomplete")
        print(f"part {index} complete", flush=True)
        return path

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        paths = list(pool.map(get_part, range(parts)))
    digest = hashlib.sha256()
    candidate = args.output.with_suffix(args.output.suffix + ".joining")
    with candidate.open("wb") as target:
        for path in paths:
            with path.open("rb") as source:
                while block := source.read(1024 * 1024):
                    target.write(block)
                    digest.update(block)
    if candidate.stat().st_size != args.size or digest.hexdigest() != args.sha256:
        raise RuntimeError("asset size or SHA-256 mismatch")
    candidate.replace(args.output)
    for path in paths:
        path.unlink()
    print(f"verified {args.output.name}: {args.size} bytes, SHA-256 {args.sha256}")


if __name__ == "__main__":
    main()
