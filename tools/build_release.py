#!/usr/bin/env python3
"""Deterministic release build for the Video Creator Skill package (P026.3; standard library only).

    python tools/build_release.py --source skills/video-creator --date 2026-11-27 --out release
    python tools/build_release.py --source <staging>/video-creator --date 2026-11-27 --check release/video-creator-v0.2.0-beta.zip

The archive is a function of file *content* only:
  - entries are rooted at "video-creator/" and sorted by the canonical key str(PureWindowsPath(relative path)).lower()
    (case-insensitive, backslash-separated; the order of the published v0.1.0/v0.2.0 archives, reproducible on any OS);
  - every timestamp is the given --date (00:00:00); permissions are fixed (0644); DEFLATE level 9;
  - text files (UTF-8 with no NUL byte) have CRLF normalised to LF, so Windows and POSIX checkouts build identically;
    binary files are copied byte for byte;
  - caches, compiled Python and local test results are excluded.
The version comes from SKILL.md metadata unless --version is given. Existing archives are never overwritten.
"""
import argparse
import hashlib
import io
import re
import sys
import zipfile
from pathlib import Path, PureWindowsPath

EXCLUDED_DIRS = {"__pycache__", ".git", "node_modules", ".pytest_cache"}
EXCLUDED_NAMES = {".DS_Store", "Thumbs.db", "desktop.ini"}


def excluded(rel):
    name = rel.name
    return (bool(set(rel.parts[:-1]) & EXCLUDED_DIRS) or name in EXCLUDED_NAMES or name.endswith((".pyc", ".pyo"))
            or (name.startswith("test-") and name.endswith("results.json")))


def normalised(data):
    if b"\0" in data[:8192]:
        return data
    try:
        data.decode("utf-8")
    except UnicodeDecodeError:
        return data
    return data.replace(b"\r\n", b"\n")


def build(source, date):
    files = sorted((p for p in source.rglob("*") if p.is_file() and not excluded(p.relative_to(source))), key=lambda p: str(PureWindowsPath(p.relative_to(source).as_posix())).lower())
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in files:
            info = zipfile.ZipInfo("video-creator/" + p.relative_to(source).as_posix(), date_time=(*date, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, normalised(p.read_bytes()))
    return buffer.getvalue(), len(files)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--source", required=True, help="the Skill package folder (contains SKILL.md)")
    ap.add_argument("--date", required=True, help="archive timestamp, YYYY-MM-DD (use the release date)")
    ap.add_argument("--version", help="defaults to metadata.version in SKILL.md")
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--out", help="folder for video-creator-v<version>.zip and .sha256")
    group.add_argument("--check", help="existing archive to compare against (nothing is written)")
    a = ap.parse_args()
    source = Path(a.source).resolve()
    skill = source / "SKILL.md"
    if not skill.is_file():
        sys.exit(f"[invalid-source] {skill} not found")
    m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", a.date)
    if not m:
        sys.exit("[invalid-date] --date must be YYYY-MM-DD")
    version = a.version or (re.search(r"^\s+version:\s*(\S+)\s*$", skill.read_text(encoding="utf-8"), re.M) or [None, None])[1]
    if not version:
        sys.exit("[invalid-version] no metadata.version in SKILL.md; pass --version")
    data, count = build(source, tuple(int(x) for x in m.groups()))
    digest = hashlib.sha256(data).hexdigest()
    if a.check:
        expected = hashlib.sha256(Path(a.check).read_bytes()).hexdigest()
        print(f"{count} files; built {digest}; archive {expected}; {'IDENTICAL' if digest == expected else 'DIFFERENT'}")
        sys.exit(0 if digest == expected else 1)
    out = Path(a.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    archive = out / f"video-creator-v{version}.zip"
    if archive.exists():
        sys.exit(f"[exists] {archive} already exists; release archives are never overwritten")
    archive.write_bytes(data)
    (out / (archive.name + ".sha256")).write_bytes(f"{digest}  {archive.name}\n".encode("ascii"))
    print(f"{archive} {len(data)} bytes, {count} files, sha256 {digest}")


if __name__ == "__main__":
    main()
