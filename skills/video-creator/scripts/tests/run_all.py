"""Unified test runner (P026.4; standard library only).

python scripts/tests/run_all.py [--only core,browser,ffmpeg,runtime] [--runtime kokoro-onnx=<file>] [--strict] [--list]

Each suite runs in its own process. Requirements are checked first:
  core     Python only
  node     Node.js 22+
  browser  Node.js + a Chromium-family browser (VC_CHROME or a standard install path)
  ffmpeg   FFmpeg and FFprobe on PATH
  runtime  a narration runtime file, found the same way doctor.py finds it: --runtime, then $VC_RUNTIMES/<provider>.json,
           then <APPDATA | XDG_CONFIG_HOME | ~/.config>/video-creator/runtimes/<provider>.json

A suite whose requirement is missing is SKIPPED with the reason. Skipped is never counted as passed. Suite-internal
skips (for example repository-only regressions when run from an extracted package) are reported from the suite's own
"N passed, N failed, N skipped" line. Exit code: 1 if any suite failed (or, with --strict, if anything was skipped).
"""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

TESTS = Path(__file__).resolve().parent
sys.path.insert(0, str(TESTS.parent / "narration"))
import runtimes  # noqa: E402

PY, NODE = [sys.executable, "-I"], "node"
# (file, category, requirements, runtime provider argument)
SUITES = [
    ("test_asset_registry.py", "core", [], None),
    ("test_plan.py", "core", [], None), ("test_project.py", "core", [], None), ("test_mithi_timing.py", "core", [], None),
    ("test_runtime_discovery.py", "core", [], None),
    ("test-prerender.mjs", "node", ["node"], None),
    ("test-network.mjs", "browser", ["node", "browser"], None), ("test-composition.mjs", "browser", ["node", "browser"], None),
    ("test_render_plan.py", "browser", ["node", "browser", "ffmpeg"], None), ("test_captions.py", "browser", ["node", "browser", "ffmpeg"], None),
    ("test_preflight.py", "browser", ["node", "browser", "ffmpeg"], None), ("test_paper_kit.py", "browser", ["node", "browser", "ffmpeg"], None),
    ("test_presentation.py", "browser", ["node", "browser", "ffmpeg"], None), ("test_richness.py", "browser", ["node", "browser", "ffmpeg"], None),
    ("test_tech_explainer.py", "browser", ["node", "browser", "ffmpeg"], None), ("test_whiteboard.py", "browser", ["node", "browser", "ffmpeg"], None),
    ("test_flat_science.py", "browser", ["node", "browser", "ffmpeg"], None), ("test_data_storytelling.py", "browser", ["node", "browser", "ffmpeg"], None),
    ("test_kinetic_typography.py", "browser", ["node", "browser", "ffmpeg"], None), ("test_xray_explainer.py", "browser", ["node", "browser", "ffmpeg"], None),
    ("test_documentary.py", "browser", ["node", "browser", "ffmpeg"], None), ("test_3d_explainer.py", "browser", ["node", "browser", "ffmpeg"], None),
    ("test_qa.py", "browser", ["node", "browser", "ffmpeg"], None), ("test-package.mjs", "browser", ["node", "browser", "ffmpeg"], None),
    ("test_audio.py", "ffmpeg", ["ffmpeg"], None),
    ("test_doctor.py", "runtime", ["ffmpeg", "runtime:kokoro-onnx"], "kokoro-onnx"), ("test_preferences.py", "runtime", ["runtime:kokoro-onnx"], "kokoro-onnx"),
    ("test_narration_stage.py", "runtime", ["runtime:kokoro-onnx"], "kokoro-onnx"), ("test_narration.py", "runtime", ["runtime:kokoro-onnx"], "kokoro-onnx"),
    ("smoke_integration.py", "runtime", ["node", "browser", "ffmpeg", "runtime:kokoro-onnx"], "kokoro-onnx"),
]
HELPERS = {"test_sync.py": "called by test_audio.py with its fixtures", "README.md": "documentation", "run_all.py": "this runner"}
CHROME = [os.environ.get("VC_CHROME"), "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
          "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]   # the same list as scripts/lib/chrome.mjs


def requirements(explicit):
    node = shutil.which("node")
    major = None
    if node:
        out = subprocess.run([node, "--version"], capture_output=True, text=True).stdout.strip().lstrip("v")
        major = int(out.split(".")[0]) if out[:1].isdigit() else None
    found = runtimes.discover(["kokoro-onnx", "mithi"], explicit)
    have = {"node": (bool(major and major >= 22), f"Node.js 22+ not found (found {major})" if node else "node not on PATH"),
            "browser": (any(p and Path(p).exists() for p in CHROME), "no Chromium-family browser (set VC_CHROME)"),
            "ffmpeg": (bool(shutil.which("ffmpeg") and shutil.which("ffprobe")), "ffmpeg/ffprobe not on PATH")}
    for pid in ("kokoro-onnx", "mithi"):
        path = found.get(pid)
        have["runtime:" + pid] = (bool(path and Path(path).is_file()), f"no {pid} runtime file (pass --runtime {pid}=<file> or create {runtimes.runtime_dir() / (pid + '.json')})")
    return have, found


def run_suite(cmd, timeout):
    """Run one suite with output in a temporary file (not pipes: browser/Node grandchildren can hold pipes open past a
    timeout) in its own process group; on timeout, kill the whole process tree. Returns (output, exit code; -1 = timeout)."""
    import tempfile
    with tempfile.TemporaryFile(mode="w+b") as log:
        kwargs = dict(stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL)
        if os.name == "nt":
            kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
        else:
            kwargs["start_new_session"] = True
        proc = subprocess.Popen(cmd, **kwargs)
        try:
            code = proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            if os.name == "nt":
                subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)], capture_output=True)
            else:
                import signal
                try:
                    os.killpg(proc.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            proc.wait()
            code = -1
        log.seek(0)
        out = log.read().decode("utf-8", errors="replace")
    return (out + (f"\ntimed out after {timeout} s; process tree killed" if code == -1 else "")), code


def summary(text):
    m = re.findall(r"(\d+) passed, (\d+) failed, (\d+) skipped", text)
    if m:
        return tuple(int(x) for x in m[-1])
    m = re.findall(r"(\d+)/(\d+) passed", text)
    if m:
        p, t = (int(x) for x in m[-1])
        return p, t - p, 0
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--only", help="comma-separated categories: core,node,browser,ffmpeg,runtime")
    ap.add_argument("--runtime", action="append", default=[], help="provider=runtime.json (overrides discovery)")
    ap.add_argument("--strict", action="store_true", help="treat skipped suites or checks as failures")
    ap.add_argument("--timeout", type=int, default=1800, help="seconds per suite")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--json", help="write the results here")
    a = ap.parse_args()
    listed = {f for f, *_ in SUITES} | set(HELPERS)
    unknown = sorted(p.name for p in TESTS.iterdir() if p.is_file() and p.suffix in (".py", ".mjs") and p.name not in listed)
    if unknown:
        sys.exit(f"[unregistered-tests] add these to run_all.py: {unknown}")
    if a.list:
        for f, cat, req, _ in SUITES:
            print(f"{cat:8} {f:30} requires: {', '.join(req) or '-'}")
        return
    cats = set(a.only.split(",")) if a.only else None
    have, found = requirements(dict(x.split("=", 1) for x in a.runtime))
    rows = []
    for f, cat, req, provider in SUITES:
        if cats and cat not in cats:
            continue
        missing = [have[r][1] for r in req if not have[r][0]]
        if missing:
            rows.append(dict(suite=f, category=cat, status="skipped", reason="; ".join(missing)))
            print(f"SKIPPED {f}: {'; '.join(missing)}", flush=True)
            continue
        cmd = ([NODE] if f.endswith(".mjs") else PY) + [str(TESTS / f)] + (["--runtime", found[provider]] if provider else [])
        t0 = time.time()
        out, code = run_suite(cmd, a.timeout)
        counts = summary(out)
        status = "passed" if code == 0 and (not counts or counts[1] == 0) else "failed"
        row = dict(suite=f, category=cat, status=status, seconds=round(time.time() - t0, 1), checks=dict(zip(("passed", "failed", "skipped"), counts)) if counts else None)
        if status == "failed":
            row["tail"] = out.strip().splitlines()[-5:]
        rows.append(row)
        detail = f"{counts[0]} passed, {counts[1]} failed, {counts[2]} skipped" if counts else "no check summary"
        print(f"{status.upper():7} {f} ({detail}; {row['seconds']} s)", flush=True)
    n = lambda st: sum(r["status"] == st for r in rows)
    inner_skipped = sum((r.get("checks") or {}).get("skipped", 0) for r in rows)
    print(f"\nSuites: {n('passed')} passed, {n('failed')} failed, {n('skipped')} skipped (of {len(rows)}). Checks skipped inside passing suites: {inner_skipped}.")
    if n("skipped") or inner_skipped:
        print("Skipped coverage is NOT passed coverage.")
    if a.json:
        Path(a.json).write_text(json.dumps(dict(suites=rows), indent=2) + "\n", encoding="utf-8")
    sys.exit(1 if n("failed") or (a.strict and (n("skipped") or inner_skipped)) else 0)


if __name__ == "__main__":
    main()
