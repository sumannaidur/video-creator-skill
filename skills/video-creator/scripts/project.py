"""Video Creator project manifest and production stage ledger (standard library only).

  python scripts/project.py init    --root <projects folder> (--topic "<text>" | --topic-file <file>) [--config <resolve.json>] [--capabilities <doctor.json>] [--id <id>]
  python scripts/project.py show    <project>
  python scripts/project.py next    <project>                                   next resumable stage (or none)
  python scripts/project.py start   <project> <stage> [--input <file> ...]
  python scripts/project.py complete <project> <stage> --output <file> [...] --evidence <json>
  python scripts/project.py fail    <project> <stage> --reason "<text>" [--evidence <file>]
  python scripts/project.py block   <project> <stage> --reason "<text>"
  python scripts/project.py reconfigure <project> --config <resolve.json> [--capabilities <doctor.json>]
  python scripts/project.py verify  <project>                                   re-hash artifacts, invalidate what changed
  python scripts/project.py approve <project> human-review|publication --by "<name>" [--notes "<text>"] [--reject]

Stages follow SKILL.md. The ledger is independent of language, provider, style and backend: it records fingerprints,
artifacts, evidence and states, never creative content. Exit codes: 0 ok, 1 refused/invalid, 2 usage.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import secrets
import sys
import tempfile

sys.dont_write_bytecode = True
PACKAGE = Path(__file__).resolve().parents[1]
SCHEMA, VERSION = "video-creator.project", 1
# Stages, dependencies and the configuration keys (prefixes) each stage depends on. Mirrors the SKILL.md stage table.
STAGES = {
    "research": dict(depends_on=[], config=["locale", "cost_policy"]),
    "script": dict(depends_on=["research"], config=["locale", "duration_seconds", "narration.tone", "narration.accent"]),
    "narration": dict(depends_on=["script"], config=["locale", "narration.", "duration_seconds"]),
    "creative-plan": dict(depends_on=["script", "narration"], config=["style", "orientation", "duration_seconds"]),
    "visual-production": dict(depends_on=["creative-plan", "narration"], config=["style", "orientation", "resolution", "fps", "captions."]),
    "sound": dict(depends_on=["narration", "visual-production"], config=["music.", "sfx."]),
    "review-delivery": dict(depends_on=["visual-production", "sound"], config=["review_mode", "captions.", "output_dir"]),
}
STATES = {"pending", "running", "completed", "failed", "blocked", "invalidated"}


class LedgerError(Exception):
    pass


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def digest(obj):
    return hashlib.sha256(json.dumps(obj, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


def flat(d, prefix=""):
    out = {}
    for k, v in (d or {}).items():
        out.update(flat(v, f"{prefix}{k}.") if isinstance(v, dict) else {f"{prefix}{k}": v})
    return out


def inside(path, root):
    path, root = Path(path).resolve(), Path(root).resolve()
    if not path.is_relative_to(root):
        raise LedgerError(f"{path} is outside the project folder")
    return path.relative_to(root).as_posix()


def atomic_write(path, data):
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".project-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2); f.write("\n")
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


class Project:
    """Single-writer access: an exclusive lock file holding the owner's PID; stale locks from dead processes are recovered."""

    def __init__(self, root):
        self.root = Path(root).resolve()
        self.file = self.root / "project.json"
        self.lock = self.root / "project.lock"
        if not self.file.exists():
            raise LedgerError(f"no project manifest at {self.file}")

    def __enter__(self):
        for _ in range(2):
            try:
                fd = os.open(self.lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.write(fd, json.dumps({"pid": os.getpid(), "since": now()}).encode()); os.close(fd)
                break
            except FileExistsError:
                pid = json.loads(self.lock.read_text() or "{}").get("pid")
                if pid_alive(pid):
                    raise LedgerError(f"project is locked by running process {pid}") from None
                self.lock.unlink(missing_ok=True)
        else:
            raise LedgerError("could not lock the project")
        self.data = load(self.file)
        return self

    def __exit__(self, *exc):
        self.lock.unlink(missing_ok=True)

    def save(self, event):
        self.data["history"].append(dict(at=now(), **event))
        reconcile(self.data, self.root)
        atomic_write(self.file, self.data)


def pid_alive(pid):
    if not isinstance(pid, int):
        return False
    if os.name == "nt":
        import ctypes
        handle = ctypes.windll.kernel32.OpenProcess(0x1000, False, pid)  # PROCESS_QUERY_LIMITED_INFORMATION
        if not handle:
            return False
        code = ctypes.c_ulong()
        ctypes.windll.kernel32.GetExitCodeProcess(handle, ctypes.byref(code)); ctypes.windll.kernel32.CloseHandle(handle)
        return code.value == 259  # STILL_ACTIVE
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def load(file):
    try:
        data = json.loads(Path(file).read_text(encoding="utf-8"))
    except ValueError as error:
        raise LedgerError(f"project manifest is not valid JSON: {error}") from None
    if data.get("schema") != SCHEMA or data.get("version") != VERSION:
        raise LedgerError(f"unsupported project manifest ({data.get('schema')} v{data.get('version')}); left untouched")
    if set(data.get("stages", {})) != set(STAGES) or any(s["state"] not in STATES for s in data["stages"].values()):
        raise LedgerError("project manifest stages do not match this Skill's stage contract")
    return data


def expected_fingerprint(data, name, extra_inputs=None):
    """Inputs of a stage: topic, its configuration subset and the verified outputs of its dependencies."""
    effective = flat(data["config"].get("effective"))
    subset = {k: v for k, v in effective.items() if any(k == p or (p.endswith(".") and k.startswith(p)) for p in STAGES[name]["config"])}
    deps = {d: sorted((o["path"], o["sha256"]) for o in data["stages"][d]["outputs"]) for d in STAGES[name]["depends_on"]}
    return digest(dict(topic=data["topic"]["sha256"], config=subset, deps=deps, inputs=extra_inputs or []))


def reconcile(data, root):
    """Invalidate completed stages whose artifacts changed or whose inputs no longer match; cascade downstream."""
    for name in STAGES:  # declaration order is topological
        stage = data["stages"][name]
        if stage["state"] != "completed":
            continue
        reason = None
        for out in stage["outputs"]:
            path = root / out["path"]
            if not path.is_file():
                reason = f"artifact missing: {out['path']}"; break
            if sha(path) != out["sha256"]:
                reason = f"artifact changed: {out['path']}"; break
        if not reason and any(data["stages"][d]["state"] != "completed" for d in STAGES[name]["depends_on"]):
            reason = "upstream stage no longer completed"
        if not reason and stage["inputs_fingerprint"] != expected_fingerprint(data, name, stage.get("declared_inputs")):
            reason = "inputs or configuration changed"
        if reason:
            stage.update(state="invalidated", invalidated=dict(at=now(), reason=reason))
            for approval in data["approvals"].values():
                if approval["status"] == "approved":
                    approval.update(status="revoked", revoked_reason=f"{name}: {reason}")


def config_from(path):
    if not path:
        return dict(effective={}, source={}, file=None, sha256=None)
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return dict(effective=data.get("effective", {}), source=data.get("source", {}), file=str(Path(path).resolve()), sha256=sha(path))


def cmd_init(a):
    root = Path(a.root).resolve()
    if root.is_relative_to(PACKAGE):
        raise LedgerError("projects must live outside the Skill package")
    if bool(a.topic) == bool(a.topic_file):
        raise LedgerError("give exactly one of --topic or --topic-file")
    pid = a.id or f"vc-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{secrets.token_hex(4)}"
    if not pid.replace("-", "").isalnum():
        raise LedgerError("project id may contain letters, digits and '-' only")
    folder = root / pid
    if folder.exists():
        raise LedgerError(f"{folder} already exists; projects are never overwritten")
    topic = a.topic if a.topic else Path(a.topic_file).read_text(encoding="utf-8")
    folder.mkdir(parents=True)
    (folder / "inputs").mkdir()
    (folder / "inputs" / "topic.txt").write_text(topic, encoding="utf-8")
    caps = json.loads(Path(a.capabilities).read_text(encoding="utf-8")) if a.capabilities else None
    data = dict(schema=SCHEMA, version=VERSION, id=pid, created=now(),
                topic=dict(path="inputs/topic.txt", sha256=sha(folder / "inputs" / "topic.txt"), source=a.topic_file and str(Path(a.topic_file).resolve())),
                config=config_from(a.config), capabilities=caps and dict(ready=caps.get("compatibility", caps.get("capabilities", {})).get("ready"), report=caps),
                stages={n: dict(state="pending", depends_on=s["depends_on"], inputs_fingerprint=None, outputs=[], validation=None,
                                attempts=0, started=None, finished=None, failure=None, invalidated=None, declared_inputs=[]) for n, s in STAGES.items()},
                approvals=dict(human_review=dict(status="pending"), publication=dict(status="not-approved")),
                history=[dict(at=now(), event="init")])
    atomic_write(folder / "project.json", data)
    return dict(id=pid, project=str(folder))


def require_stage(name):
    if name not in STAGES:
        raise LedgerError(f"unknown stage {name!r}; stages: {', '.join(STAGES)}")


def next_stage(data, root):
    for name in STAGES:
        s = data["stages"][name]
        if s["state"] == "completed":
            continue
        ready = all(data["stages"][d]["state"] == "completed" for d in STAGES[name]["depends_on"])
        # A running stage may be in progress or interrupted; the ledger cannot tell, so it is reported as resumable.
        return dict(stage=name, state=s["state"], resumable=s["state"] in ("running", "failed", "invalidated", "pending") and ready, ready=ready,
                    last_failure=s["failure"], invalidated=s["invalidated"],
                    waiting_for=[d for d in STAGES[name]["depends_on"] if data["stages"][d]["state"] != "completed"],
                    reuse=[d for d in STAGES if data["stages"][d]["state"] == "completed"])
    return dict(stage=None, technical_completion=True, approvals=data["approvals"])


def evidence_passed(path):
    try:
        ev = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    return ev.get("passed") is True or ev.get("failures") == [] or ev.get("ready") is True or \
        (isinstance(ev.get("compatibility"), dict) and ev["compatibility"].get("ready") is True)


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["init", "show", "next", "start", "complete", "fail", "block", "reconfigure", "verify", "approve"])
    ap.add_argument("args", nargs="*")
    for opt in ("root", "topic", "topic-file", "config", "capabilities", "id", "evidence", "reason", "by", "notes"):
        ap.add_argument("--" + opt)
    ap.add_argument("--output", action="append", default=[]); ap.add_argument("--input", action="append", default=[])
    ap.add_argument("--reject", action="store_true")
    a = ap.parse_args(argv)
    if a.command == "init":
        if not a.root:
            raise LedgerError("--root is required")
        return dict(created=cmd_init(a))
    if not a.args:
        raise LedgerError("project folder required")
    root = Path(a.args[0]).resolve()
    if a.command in ("show", "next"):
        data = load(root / "project.json")
        reconcile(data, root)  # report effective states without writing
        return data if a.command == "show" else next_stage(data, root)
    with Project(root) as p:
        d, stages = p.data, p.data["stages"]
        reconcile(d, root)
        if a.command in ("start", "complete", "fail", "block"):
            if len(a.args) < 2:
                raise LedgerError("stage name required")
            name = a.args[1]; require_stage(name); s = stages[name]
        if a.command == "start":
            if s["state"] == "completed":
                raise LedgerError(f"{name} is already completed with verified artifacts; it is not repeated (verify or reconfigure to invalidate it)")
            missing = [x for x in STAGES[name]["depends_on"] if stages[x]["state"] != "completed"]
            if missing:
                raise LedgerError(f"{name} is blocked: dependencies not completed: {', '.join(missing)}")
            declared = sorted((inside(f, root), sha(f)) for f in a.input)
            s.update(state="running", attempts=s["attempts"] + 1, started=now(), finished=None, failure=None, declared_inputs=declared,
                     inputs_fingerprint=expected_fingerprint(d, name, declared))
            p.save(dict(event="start", stage=name, attempt=s["attempts"]))
        elif a.command == "complete":
            if s["state"] != "running":
                raise LedgerError(f"{name} is {s['state']}; start it before completing")
            if not a.output:
                raise LedgerError("completion needs at least one --output artifact")
            if not a.evidence or not evidence_passed(a.evidence):
                raise LedgerError("completion needs --evidence JSON that records a pass (passed: true, failures: [], or ready: true)")
            outputs = []
            for f in a.output:
                rel = inside(f, root)
                if not (root / rel).is_file():
                    raise LedgerError(f"output artifact missing: {rel}")
                outputs.append(dict(path=rel, sha256=sha(root / rel), bytes=(root / rel).stat().st_size))
            if s["inputs_fingerprint"] != expected_fingerprint(d, name, s["declared_inputs"]):
                raise LedgerError(f"{name}'s inputs changed while it was running; start it again")
            s.update(state="completed", outputs=outputs, finished=now(), invalidated=None,
                     validation=dict(passed=True, evidence=inside(a.evidence, root), evidence_sha256=sha(a.evidence)))
            p.save(dict(event="complete", stage=name, outputs=[o["path"] for o in outputs]))
        elif a.command in ("fail", "block"):
            if not a.reason:
                raise LedgerError("--reason is required")
            s.update(state="failed" if a.command == "fail" else "blocked", finished=now(),
                     failure=dict(reason=a.reason, evidence=a.evidence and inside(a.evidence, root)))
            p.save(dict(event=a.command, stage=name, reason=a.reason))
        elif a.command == "reconfigure":
            if not a.config:
                raise LedgerError("--config is required")
            old = d["config"]["sha256"]
            d["config"] = config_from(a.config)
            if a.capabilities:
                caps = json.loads(Path(a.capabilities).read_text(encoding="utf-8"))
                d["capabilities"] = dict(ready=caps.get("compatibility", caps.get("capabilities", {})).get("ready"), report=caps)
            p.save(dict(event="reconfigure", previous_config_sha256=old))
        elif a.command == "verify":
            p.save(dict(event="verify"))
        elif a.command == "approve":
            kind = a.args[1] if len(a.args) > 1 else None
            if kind not in ("human-review", "publication") or not a.by:
                raise LedgerError("approve needs human-review|publication and --by")
            key = kind.replace("-", "_")
            if any(st["state"] != "completed" for st in stages.values()):
                raise LedgerError("human gates need every production stage technically completed first")
            if kind == "publication" and d["approvals"]["human_review"]["status"] != "approved":
                raise LedgerError("publication approval needs an approved human review first")
            d["approvals"][key] = dict(status="rejected" if a.reject else "approved", by=a.by, at=now(), notes=a.notes)
            p.save(dict(event="approve", gate=kind, status=d["approvals"][key]["status"]))
        return dict(project=str(root), stages={n: st["state"] for n, st in stages.items()}, approvals=d["approvals"])


if __name__ == "__main__":
    try:
        print(json.dumps(main(sys.argv[1:]), ensure_ascii=True, indent=2))
    except LedgerError as error:
        print(f"[project] {error}", file=sys.stderr)
        sys.exit(1)
