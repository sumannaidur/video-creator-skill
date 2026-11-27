"""Script-driven narration stage: script artifact → validated, timed, combined narration with a duration report.

  python scripts/narration/stage.py validate <project> [--script script/script.json]
  python scripts/narration/stage.py run <project> --runtime <provider>=<runtime.json> [--script script/script.json]
                                       [--tolerance 0.10] [--max-attempts 3] [--gap-ms 200] [--accept-deviation "<reason>"]

Reads locale, narration provider/voice and duration_seconds from the project's resolved configuration (project.json),
uses the packaged provider interface (narrate.py) and records everything in the project ledger (project.py).
It never changes voice speed to hit a duration: off-target narration fails the stage with revision hints so the agent can
revise the script. Unchanged segments are reused. Exit codes: 0 completed, 1 failed/refused, 2 usage.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
SCRIPTS = HERE.parent
PACKAGE = SCRIPTS.parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(SCRIPTS))
from narrate import NarrationError, registry, route  # noqa: E402
from timeline import validate as validate_timeline  # noqa: E402
from project import pid_alive  # noqa: E402

SCHEMA, VERSION = "video-creator.script", 1
ROLES = {"hook", "context", "mechanism", "contrast", "example", "transition", "resolution"}


class StageError(Exception):
    def __init__(self, code, message):
        super().__init__(f"[{code}] {message}"); self.code = code


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def py(*args):
    return subprocess.run([sys.executable, "-I", *map(str, args)], capture_output=True, text=True, encoding="utf-8")


def ledger(project, *args):
    done = py(SCRIPTS / "project.py", *args[:1], project, *args[1:])
    if done.returncode:
        raise StageError("ledger-refused", done.stderr.strip())
    return json.loads(done.stdout)


def load_project(project):
    data = json.loads((project / "project.json").read_text(encoding="utf-8"))
    cfg = data["config"]["effective"]
    return data, cfg


def claims_from_research(project, data):
    ids = set()
    for out in data["stages"]["research"]["outputs"]:
        try:
            doc = json.loads((project / out["path"]).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        for claim in doc.get("claims", []) if isinstance(doc, dict) else []:
            if isinstance(claim, dict) and claim.get("id"):
                ids.add(claim["id"])
    return ids


def validate_script(project, data, cfg, script_path):
    """Structural, locale, claim-reference and provider-limit validation. Returns (script, entry, locale_route)."""
    try:
        script = json.loads(script_path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as error:
        raise StageError("invalid-script", f"cannot read script JSON: {error}") from None
    if script.get("schema") != SCHEMA or script.get("version") != VERSION:
        raise StageError("invalid-script", f"expected schema {SCHEMA} v{VERSION}")
    locale, provider, voice = cfg.get("locale"), (cfg.get("narration") or {}).get("provider"), (cfg.get("narration") or {}).get("voice")
    if not locale:
        raise StageError("locale-unset", "the project configuration has no locale")
    if script.get("locale") != locale:
        raise StageError("locale-mismatch", f"script locale {script.get('locale')!r} differs from the project locale {locale!r}")
    if provider in (None, "auto") or voice in (None, "auto"):
        raise StageError("decision-required", "choose an explicit narration provider and voice (doctor/resolve --check lists them) and reconfigure the project")
    try:
        entry, loc = route(provider, locale, voice)
    except NarrationError as error:
        raise StageError(error.code, str(error).split("] ", 1)[-1]) from None
    segments = script.get("segments")
    if not isinstance(segments, list) or not segments:
        raise StageError("invalid-script", "segments must be a non-empty list")
    known_claims = claims_from_research(project, data)
    limit = (entry.get("segment_limits") or {}).get("max_chars")
    seen = set()
    for i, seg in enumerate(segments):
        where = f"segment {i} ({seg.get('id')})"
        if not isinstance(seg.get("id"), str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,31}", seg["id"]) or seg["id"] in seen:
            raise StageError("invalid-script", f"{where}: id must be unique, 1-32 letters/digits/'-'/'_'")
        seen.add(seg["id"])
        if seg.get("role") not in ROLES:
            raise StageError("invalid-script", f"{where}: role must be one of {sorted(ROLES)}")
        text = seg.get("text")
        if not isinstance(text, str) or not " ".join(text.split()):
            raise StageError("invalid-script", f"{where}: text is empty")
        if limit and len(" ".join(text.split())) > limit:
            raise StageError("segment-too-long", f"{where}: {len(text)} characters exceeds the {provider} limit of {limit} ({entry['segment_limits'].get('reason')}); split it")
        unknown = [c for c in seg.get("claims", []) if c not in known_claims]
        if unknown:
            raise StageError("unknown-claim", f"{where}: claims not in the research ledger: {unknown}")
    return script, entry, dict(provider=provider, voice=voice, locale=locale)


class RunnerLock:
    """One narration runner per project; records the active synthesis subprocess so a resume can confirm it has ended."""

    def __init__(self, project):
        self.file = project / "narration" / ".runner.lock"

    def __enter__(self):
        self.file.parent.mkdir(parents=True, exist_ok=True)
        if self.file.exists():
            info = json.loads(self.file.read_text(encoding="utf-8") or "{}")
            active = [p for p in (info.get("pid"), info.get("child")) if pid_alive(p)]
            if active:
                raise StageError("synthesis-active", f"a previous narration run is still active (process {active}); not resuming")
            self.file.unlink()
        self.info = {"pid": os.getpid(), "since": now()}
        self._write()
        return self

    def child(self, pid):
        self.info["child"] = pid; self._write()

    def _write(self):
        self.file.write_text(json.dumps(self.info), encoding="utf-8")

    def __exit__(self, *exc):
        self.file.unlink(missing_ok=True)


def segment_ok(project, name):
    """A previously produced segment is reused only if its timeline validates against its WAV (hash, timebase)."""
    tl = project / "narration" / "segments" / f"{name}.timeline.json"
    wav = project / "narration" / "segments" / f"{name}.wav"
    if not tl.exists() and not wav.exists():
        return None
    try:
        item = json.loads(tl.read_text(encoding="utf-8"))
        validate_timeline(item, project)
        return item
    except Exception:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        for f in (project / "narration" / "segments").glob(f"{name}.*"):  # preserve, never delete
            f.rename(f.with_name(f"{f.name}.corrupt-{stamp}"))
        return None


def run(a):
    project = Path(a.project).resolve()
    data, cfg = load_project(project)
    script_rel = a.script
    script_path = project / script_rel
    sstage = data["stages"]["script"]
    if sstage["state"] != "completed" or not any(o["path"] == Path(script_rel).as_posix() and o["sha256"] == sha(script_path) for o in sstage["outputs"] if script_path.exists()):
        raise StageError("script-not-verified", f"{script_rel} must be a verified output of the completed script stage")
    script, entry, r = validate_script(project, data, cfg, script_path)
    runtimes = dict(x.split("=", 1) for x in a.runtime)
    if r["provider"] not in runtimes:
        raise StageError("missing-runtime", f"pass --runtime {r['provider']}=<runtime.json>")
    nstage = data["stages"]["narration"]
    with RunnerLock(project) as lock:
        if nstage["state"] != "running":
            ledger(project, "start", "narration")
        segs_dir = project / "narration" / "segments"; segs_dir.mkdir(parents=True, exist_ok=True)
        report = dict(run_at=now(), provider=r["provider"], voice=r["voice"], locale=r["locale"], segments=[])
        for seg in script["segments"]:
            text = " ".join(seg["text"].split())
            key = hashlib.sha256(json.dumps([text, r["locale"], r["provider"], r["voice"]], ensure_ascii=False).encode()).hexdigest()[:10]
            name = f"{seg['id']}-{key}"
            item = segment_ok(project, name)
            reused = item is not None
            if not reused:
                text_file = segs_dir / f"{name}.txt"
                text_file.write_text(text + "\n", encoding="utf-8")
                proc = subprocess.Popen([sys.executable, "-I", str(HERE / "narrate.py"), "synth", "--project", str(project), "--provider", r["provider"],
                                         "--locale", r["locale"], "--voice", r["voice"], "--runtime", runtimes[r["provider"]],
                                         "--text-file", text_file.relative_to(project).as_posix(), "--id", name, "--out-dir", "narration/segments"],
                                        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8")
                lock.child(proc.pid)
                out, err = proc.communicate()
                if proc.returncode:
                    ledger(project, "fail", "narration", "--reason", f"synthesis failed for {seg['id']}: {err.strip()[-300:]}")
                    raise StageError("synthesis-failed", f"{seg['id']}: {err.strip()[-300:]}")
                item = json.loads((segs_dir / f"{name}.timeline.json").read_text(encoding="utf-8"))
            rate = item["audio"]["sample_rate"]
            words = [x for x in item["records"] if x["kind"] == "word"]
            report["segments"].append(dict(id=seg["id"], role=seg["role"], file=name, reused=reused, chars=len(text),
                                           seconds=round(item["audio"]["sample_count"] / rate, 3), words=len(words),
                                           words_mapped=sum(1 for w in words if w["source"]), sha256=item["audio"]["sha256"], run_id=item["run_id"]))
        # Combine (reused when the same segment set and gap were already combined and still validate).
        combo = hashlib.sha256(json.dumps([[s["file"], s["sha256"]] for s in report["segments"]] + [a.gap_ms]).encode()).hexdigest()[:10]
        out_wav, out_tl = f"narration/narration-{combo}.wav", f"narration/narration-{combo}.timeline.json"
        try:
            combined = json.loads((project / out_tl).read_text(encoding="utf-8")); validate_timeline(combined, project); report["combined_reused"] = True
        except Exception:
            done = py(HERE / "narrate.py", "combine", "--project", project, "--id", f"narration-{combo}", "--gap-ms", a.gap_ms, "--out-wav", out_wav,
                      "--out-timeline", out_tl, *[f"{s['id']}=narration/segments/{s['file']}.timeline.json" for s in report["segments"]])
            if done.returncode:
                ledger(project, "fail", "narration", "--reason", f"combining failed: {done.stderr.strip()[-300:]}")
                raise StageError("combine-failed", done.stderr.strip()[-300:])
            combined = json.loads((project / out_tl).read_text(encoding="utf-8")); validate_timeline(combined, project); report["combined_reused"] = False
        # Duration against the configured target; revision hints, never speed changes.
        measured = combined["audio"]["sample_count"] / combined["audio"]["sample_rate"]
        target = cfg.get("duration_seconds")
        deviation = (measured - target) / target if target else 0.0
        within = abs(deviation) <= a.tolerance
        hist_file = project / "narration" / "duration-history.json"
        history = json.loads(hist_file.read_text(encoding="utf-8")) if hist_file.exists() else []
        attempt = len([h for h in history if not h["within"]]) + (0 if within else 1)
        hints = []
        if not within:
            excess = measured - target
            ranked = sorted(report["segments"], key=lambda s: s["seconds"], reverse=excess > 0)
            budget = abs(excess)
            for s in ranked:
                if budget <= 0:
                    break
                hints.append(dict(id=s["id"], role=s["role"], seconds=s["seconds"], suggestion="shorten" if excess > 0 else "expand or add a segment"))
                budget -= s["seconds"] * (0.3 if excess > 0 else 0.5)
        history.append(dict(at=now(), measured_seconds=round(measured, 3), target_seconds=target, deviation=round(deviation, 4), within=within,
                            script_sha256=sha(script_path), combined=out_wav))
        hist_file.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        accepted = bool(a.accept_deviation) and not within
        integrity = all(s["words"] == s["words_mapped"] for s in report["segments"]) and combined["validation"] == "unreviewed" \
            and combined["audio"]["sha256"] == sha(project / out_wav)
        evidence = dict(stage="narration", passed=integrity and (within or accepted), integrity=integrity, timing_status=combined["validation"],
                        measured_seconds=round(measured, 3), target_seconds=target, tolerance=a.tolerance, deviation=round(deviation, 4), within_tolerance=within,
                        accepted_deviation=a.accept_deviation if accepted else None, attempt=attempt, max_attempts=a.max_attempts,
                        revision_hints=hints, combined=dict(wav=out_wav, timeline=out_tl, sha256=combined["audio"]["sha256"], run_id=combined["run_id"]), **report)
        ev_path = project / "narration" / "narration-evidence.json"
        ev_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if evidence["passed"]:
            ledger(project, "complete", "narration", "--output", project / out_wav, "--output", project / out_tl, "--evidence", ev_path)
            return evidence, 0
        if not integrity:
            reason = "narration integrity check failed (unmapped words or hash mismatch)"
        elif attempt >= a.max_attempts:
            reason = f"unresolved-duration-deviation: {measured:.1f}s vs {target}s target after {attempt} attempts; revise the script, change the target, or accept explicitly"
        else:
            reason = f"duration-off-target: {measured:.1f}s vs {target}s (±{a.tolerance:.0%}); revise segments {[h['id'] for h in hints]} and re-complete the script stage"
        ledger(project, "fail", "narration", "--reason", reason, "--evidence", ev_path)
        return evidence | {"failure": reason}, 1


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["validate", "run"])
    ap.add_argument("project")
    ap.add_argument("--script", default="script/script.json")
    ap.add_argument("--runtime", action="append", default=[])
    ap.add_argument("--tolerance", type=float, default=0.10)
    ap.add_argument("--max-attempts", type=int, default=3)
    ap.add_argument("--gap-ms", type=int, default=200)
    ap.add_argument("--accept-deviation")
    a = ap.parse_args(argv)
    project = Path(a.project).resolve()
    if project.is_relative_to(PACKAGE):
        raise StageError("invalid-project", "projects must live outside the Skill package")
    if a.command == "validate":
        data, cfg = load_project(project)
        script, entry, r = validate_script(project, data, cfg, project / a.script)
        return dict(valid=True, segments=len(script["segments"]), **r), 0
    return run(a)


if __name__ == "__main__":
    try:
        result, code = main(sys.argv[1:])
        print(json.dumps(result, ensure_ascii=True, indent=2))
        sys.exit(code)
    except StageError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
