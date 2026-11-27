"""Video Creator capability detection and production preflight (read-only; standard library only).

  python scripts/doctor.py [--runtime kokoro-onnx=<runtime.json>] [--project <dir>] [--chrome <path>] [--verify-hashes]
                           [--locale <bcp47>] [--style <id>] [--provider <id>] [--voice <id>] [--json <report.json>]

Reports host, tools, styles/backends and narration routes, distinguishing planned, installed, available and
experimentally validated capabilities. A requested locale/style/provider/voice is checked explicitly; nothing is
substituted. It installs, downloads and changes nothing; the optional JSON report must be written outside the package.
Exit codes: 0 ready for the requested combination, 1 a required capability or the requested combination is unavailable, 2 usage.
Running this command directly does not demonstrate that an Agent Skill host can discover or invoke the package.
"""
import argparse
import ctypes
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
PACKAGE = HERE.parent
sys.path.insert(0, str(HERE / "narration"))
import runtimes as launchers  # noqa: E402
FFMPEG_FILTERS = ["loudnorm", "ebur128", "sidechaincompress", "alimiter", "amix", "adelay", "afade", "aevalsrc", "anoisesrc", "ssim"]


def run(cmd, **kw):
    try:
        done = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=kw.pop("timeout", 60), **kw)
        return done.returncode, done.stdout, done.stderr
    except (OSError, subprocess.TimeoutExpired) as error:
        return None, "", str(error)


def memory():
    try:
        if os.name == "nt":
            class Status(ctypes.Structure):
                _fields_ = [("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong), ("ullTotalPhys", ctypes.c_ulonglong),
                            ("ullAvailPhys", ctypes.c_ulonglong), ("a", ctypes.c_ulonglong), ("b", ctypes.c_ulonglong), ("c", ctypes.c_ulonglong),
                            ("d", ctypes.c_ulonglong), ("e", ctypes.c_ulonglong)]
            s = Status(); s.dwLength = ctypes.sizeof(Status)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(s))
            return s.ullTotalPhys, s.ullAvailPhys
        info = dict(line.split(":", 1) for line in Path("/proc/meminfo").read_text().splitlines())
        return int(info["MemTotal"].split()[0]) * 1024, int(info["MemAvailable"].split()[0]) * 1024
    except Exception:
        return None, None


def tool(name, args, parse):
    path = shutil.which(name)
    if not path:
        return dict(status="missing", path=None)
    code, out, err = run([path, *args])
    version = parse(out + err) if code == 0 else None
    return dict(status="available" if code == 0 else "incompatible", path=path, version=version)


def detect(a):
    gib = lambda n: round(n / 2 ** 30, 1) if n else None
    total, avail = memory()
    disk_root = Path(a.project).resolve() if a.project else Path.cwd()
    disk = shutil.disk_usage(disk_root if disk_root.exists() else Path.cwd())
    report = dict(
        host_invocation="not demonstrated: this report comes from direct command execution, not from an Agent Skill host",
        system=dict(os=platform.system(), release=platform.release(), version=platform.version(), arch=platform.machine(),
                    cpu_logical=os.cpu_count(), ram_total_gib=gib(total), ram_available_gib=gib(avail),
                    disk_path=str(disk_root), disk_free_gib=gib(disk.free)))
    # Tools: required for every production run.
    tools = {"python": dict(status="available" if sys.version_info >= (3, 10) else "incompatible", path=sys.executable,
                            version=platform.python_version(), required=True, needed_for="narration front end, timeline, mixer, doctor")}
    node = tool("node", ["-v"], lambda t: t.strip().lstrip("v"))
    if node["status"] == "available" and int(node["version"].split(".")[0]) < 22:
        node.update(status="incompatible", reason="Node 22+ required (built-in WebSocket)")
    tools["node"] = node | dict(required=True, needed_for="renderer")
    ff = tool("ffmpeg", ["-hide_banner", "-version"], lambda t: (re.search(r"ffmpeg version (\S+)", t) or [None, None])[1])
    if ff["status"] == "available":
        code, out, _ = run([ff["path"], "-hide_banner", "-filters"])
        missing = [f for f in FFMPEG_FILTERS if not re.search(rf"\s{f}\s", out or "")]
        ff["missing_filters"] = missing
        if missing:
            ff.update(status="incompatible", reason="required filters missing")
    tools["ffmpeg"] = ff | dict(required=True, needed_for="encoding, mixing, validation")
    tools["ffprobe"] = tool("ffprobe", ["-hide_banner", "-version"], lambda t: (re.search(r"ffprobe version (\S+)", t) or [None, None])[1]) | dict(
        required=True, needed_for="media validation")
    report["tools"] = tools
    # Visual styles: planned registry + installed backends probed through their own interface.
    planned = {k: v for k, v in json.loads((HERE / "styles" / "registry.json").read_text(encoding="utf-8")).items() if not k.startswith("_")}
    probes = {}
    if tools["node"]["status"] == "available":
        code, out, err = run([tools["node"]["path"], str(HERE / "lib" / "probe-backends.mjs"), a.chrome or ""])
        probes = json.loads(out) if code == 0 and out.strip() else {}
    styles = {}
    for sid in sorted(set(planned) | set(probes)):
        p, ref = probes.get(sid), (PACKAGE / "references" / "styles" / f"{sid}.md").exists()
        if not p:
            status = "planned"
        elif p.get("contract") and p.get("sourcesPresent") and ref and (p.get("probe") or {}).get("ok", True) and tools["node"]["status"] == "available":
            status = "available"
        else:
            status = "installed"
        styles[sid] = dict(name=planned.get(sid, {}).get("name", sid), status=status, reference=ref, backend=p,
                           validation=("experimentally validated (P013 regression)" if sid == "paper-explainer" else planned.get(sid, {}).get("validation")) if status != "planned" else None)
    report["styles"] = styles
    # Narration: provider registry + read-only provider probes with the user's runtime configuration.
    reg = json.loads((HERE / "narration" / "providers" / "registry.json").read_text(encoding="utf-8"))
    targets = reg.get("_target_locales", [])
    runtimes = dict(item.split("=", 1) for item in a.runtime)
    providers = {}
    for pid, entry in ((k, v) for k, v in reg.items() if not k.startswith("_")):
        info = dict(registry_status=entry["status"], timing_method=entry["timing_method"], word_timing=entry.get("word_timing", True),
                    timing_review=entry.get("timing_review", "unreviewed"), packaged=bool(entry.get("implementation")), locales=entry["locales"], note=entry.get("note"))
        if not entry.get("implementation"):
            info["status"] = "candidate (not packaged)"
        elif pid not in runtimes:
            info["status"] = "installed (runtime not configured)"
        else:
            try:
                rt = json.loads(Path(runtimes[pid]).read_text(encoding="utf-8"))
            except (OSError, ValueError) as error:
                rt, info["runtime_error"] = {}, str(error)
            inside = [k for k in ("python", "model", "voices") if rt.get(k) and Path(rt[k]).resolve().is_relative_to(PACKAGE)]
            interp = rt.get("python")
            try:
                argv, host = launchers.command(entry, rt, HERE / "narration" / "providers" / entry["implementation"])
                launch_error = None
            except launchers.RuntimeError_ as error:
                argv, host, launch_error = None, str, str(error)
            if inside:
                info.update(status="incompatible", reason=f"runtime paths inside the Skill package: {inside}")
            elif launch_error:
                info.update(status="incompatible", reason=launch_error)
            elif not interp or (argv[0] == interp and not Path(interp).is_file()):
                info.update(status="installed (runtime missing)", reason=f"runtime interpreter not found: {interp}")
            else:
                model = rt.get("model")
                req = dict(model=host(model) if model else model, voices=rt.get("voices"), verify_hashes=a.verify_hashes)
                code, out, err = run([*argv, "--probe"], input=json.dumps(req), timeout=300)
                probe = json.loads(out.strip().splitlines()[-1]) if code == 0 and out.strip() else None
                info["probe"] = probe or dict(error=(err.strip().splitlines() or ["probe failed"])[-1])
                if probe and "ok" in probe:  # providers that judge their own runtime (Mithi)
                    ok = probe["ok"]
                else:
                    ok = bool(probe and probe["model"]["exists"] and probe["voices"]["exists"] and probe["model"]["size_matches"] and probe["voices"]["size_matches"]
                              and probe["cpu_provider"] and probe["model"]["pinned_hash"] is not False and probe["voices"]["pinned_hash"] is not False)
                info["status"] = "available" if ok else "installed (runtime incomplete)"
        providers[pid] = info
    report["narration_providers"] = providers
    locales = {}
    for loc in sorted(set(targets) | {l for p in providers.values() for l in p["locales"]}):
        routes = []
        for pid, p in providers.items():
            if loc in p["locales"]:
                voices = p["locales"][loc]["voices"]
                probe = p.get("probe") or {}
                present = probe.get("voices_in_bundle", probe.get("voices"))
                routes.append(dict(provider=pid, status=p["status"], timing=p["timing_method"], word_timing=p["word_timing"], timing_review=p["timing_review"],
                                   synthesis=p["status"] == "available", validation=p["locales"][loc].get("status"),
                                   voices=[dict(id=v, in_bundle=(v in present) if present is not None else None) for v in voices]))
        best = "available" if any(r["status"] == "available" for r in routes) else "installed" if routes else "planned"
        locales[loc] = dict(status=best, target=loc in targets, routes=routes,
                            candidates=[k for k, p in providers.items() if not p["packaged"]] if not routes else [])
    report["locales"] = locales
    return report


def compatibility(a, report):
    """Explicit check of the requested combination. Never substitutes another language, voice, provider or style."""
    problems, notes = [], []
    if a.style:
        s = report["styles"].get(a.style)
        if not s:
            problems.append(dict(code="unknown-style", detail=f"{a.style} is not a planned or installed style"))
        elif s["status"] != "available":
            problems.append(dict(code="unsupported-style", detail=f"{a.style} is {s['status']}"))
    if a.locale:
        loc = report["locales"].get(a.locale)
        routes = [r for r in (loc or {}).get("routes", []) if not a.provider or r["provider"] == a.provider]
        if not loc or not loc["routes"]:
            problems.append(dict(code="unsupported-locale", detail=f"no packaged narration route for {a.locale}"))
        elif not routes:
            problems.append(dict(code="unsupported-provider", detail=f"{a.provider} has no route for {a.locale}"))
        elif not any(r["status"] == "available" for r in routes):
            problems.append(dict(code="narration-unavailable", detail=f"route exists but is {routes[0]['status']}"))
        elif not any(r["status"] == "available" and r["word_timing"] for r in routes):
            problems.append(dict(code="word-timing-unavailable", detail=f"{a.locale} synthesis is available, but no validated word-timing route exists; "
                                 "cues and captions cannot be resolved, so complete video production is not ready"))
        elif a.voice and not any(v["id"] == a.voice and v["in_bundle"] is not False for r in routes for v in r["voices"]):
            problems.append(dict(code="unsupported-voice", detail=f"{a.voice} is not a supported voice for {a.locale}"))
        else:
            notes.append(f"{a.locale} word timing is technically available ({routes[0]['timing']}) but {routes[0]['timing_review']}: "
                         "acoustic accuracy needs human review")
    elif a.provider and a.provider not in report["narration_providers"]:
        problems.append(dict(code="unsupported-provider", detail=f"unknown provider {a.provider}"))
    for name, t in report["tools"].items():
        if t["required"] and t["status"] != "available":
            problems.append(dict(code="missing-dependency", detail=f"{name} is {t['status']}"))
    if report["system"]["disk_free_gib"] is not None and report["system"]["disk_free_gib"] < 2:
        notes.append("less than 2 GiB free disk: Full HD frame checkpoints need about 1 GB per minute")
    return dict(requested={k: getattr(a, k) for k in ("locale", "style", "provider", "voice")}, ready=not problems, problems=problems, notes=notes)


def human(report):
    lines = ["Video Creator capability report", f"Host invocation: {report['host_invocation']}"]
    s = report["system"]
    lines.append(f"System: {s['os']} {s['release']} {s['arch']}, {s['cpu_logical']} logical CPUs, RAM {s['ram_available_gib']}/{s['ram_total_gib']} GiB free, disk {s['disk_free_gib']} GiB free")
    lines.append("Tools (all required):")
    for k, t in report["tools"].items():
        lines.append(f"  {k:8} {t['status']:12} {t.get('version') or ''} {t.get('reason', '')}".rstrip())
    lines.append("Visual styles:")
    for k, v in report["styles"].items():
        probe = (v.get("backend") or {}).get("probe") or {}
        lines.append(f"  {k:20} {v['status']:10} {('browser: ' + probe['browser']) if probe.get('ok') else probe.get('reason', '')}"
                     f"{'  - ' + v['validation'] if v.get('validation') else ''}".rstrip())
    lines.append("Narration providers:")
    for k, p in report["narration_providers"].items():
        lines.append(f"  {k:12} {p['status']}  timing={p['timing_method']}{'' if p['word_timing'] else ' (no word timing)'}  locales={','.join(p['locales']) or '-'}")
    lines.append("Locales (narration + timing):")
    for k, l in report["locales"].items():
        route = "; ".join(f"{r['provider']} [{r['status']}] voices={','.join(v['id'] for v in r['voices'])} - {r['validation']}" for r in l["routes"]) or "no packaged route" + (
            f" (candidate: {', '.join(l['candidates'])})" if l["candidates"] else "")
        lines.append(f"  {k:6} {l['status']:10} {route}")
    c = report["compatibility"]
    lines.append(f"Requested {json.dumps({k: v for k, v in c['requested'].items() if v})}: {'READY' if c['ready'] else 'NOT READY'}")
    lines += [f"  [{p['code']}] {p['detail']}" for p in c["problems"]] + [f"  note: {n}" for n in c["notes"]]
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--runtime", action="append", default=[], help="provider=path/to/runtime.json (outside the package)")
    ap.add_argument("--project"); ap.add_argument("--chrome"); ap.add_argument("--json")
    ap.add_argument("--verify-hashes", action="store_true", help="hash model files against the pinned manifest (slower)")
    for k in ("locale", "style", "provider", "voice"):
        ap.add_argument("--" + k)
    a = ap.parse_args()
    if any("=" not in r for r in a.runtime):
        ap.error("--runtime must be provider=path")
    if a.json and Path(a.json).resolve().is_relative_to(PACKAGE):
        ap.error("--json report must be written outside the Skill package")
    report = detect(a)
    report["compatibility"] = compatibility(a, report)
    print(human(report))
    if a.json:
        Path(a.json).parent.mkdir(parents=True, exist_ok=True)
        Path(a.json).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sys.exit(0 if report["compatibility"]["ready"] else 1)


if __name__ == "__main__":
    main()
