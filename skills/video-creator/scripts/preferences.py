"""Persistent Video Creator preferences and configuration resolver (standard library only).

  python scripts/preferences.py show                       [--store <file>]
  python scripts/preferences.py init  [key=value ...]      create the store; refuses if one exists
  python scripts/preferences.py set   key=value ...        partial update (dotted keys, e.g. music.enabled=false)
  python scripts/preferences.py unset key ...              return keys to their documented defaults
  python scripts/preferences.py reset --confirm            back up the store, then restore defaults
  python scripts/preferences.py resolve [key=value ...] [--check] [--runtime provider=<runtime.json>] [--json <file>]

Precedence: request (key=value on resolve) > saved preferences > documented defaults. Request values are never saved.
`resolve --check` validates the effective configuration against installed capabilities through doctor.py and
rejects unsupported combinations explicitly. `auto` values are creative decisions left to the agent, not capabilities.
The store lives outside the Skill package: --store, else $VC_PREFERENCES, else the per-user config folder.
Exit codes: 0 ok, 1 invalid/unsupported, 2 usage.
"""
import copy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
PACKAGE = HERE.parent
SCHEMA, VERSION = "video-creator.preferences", 1

# Documented defaults. Deliberately no default language, provider, voice or style: those are user or agent decisions.
DEFAULTS = {
    "locale": None,
    "narration": {"provider": "auto", "voice": "auto", "accent": None, "tone": "conversational"},
    "style": "auto",
    "duration_seconds": 60,
    "orientation": "vertical",
    "resolution": 1080,
    "fps": 30,
    "captions": {"enabled": True, "burn_in": True, "subtitle_files": ["srt", "vtt"]},
    "music": {"enabled": True, "level": "subtle"},
    "sfx": {"enabled": True, "density": "sparse"},
    "review_mode": "guided",
    "output_dir": None,
    "cost_policy": "local-only",
    "presentation": "auto",
}


class PrefError(Exception):
    pass


def registries():
    providers = json.loads((HERE / "narration" / "providers" / "registry.json").read_text(encoding="utf-8"))
    styles = json.loads((HERE / "styles" / "registry.json").read_text(encoding="utf-8"))
    return providers.get("_target_locales", []), [k for k in providers if not k.startswith("_")], [k for k in styles if not k.startswith("_")]


def text(maxlen):
    def check(v):
        if v is not None and (not isinstance(v, str) or not v.strip() or len(v) > maxlen):
            raise PrefError(f"must be null or text up to {maxlen} characters")
    return check


def one_of(*allowed):
    def check(v):
        if v not in allowed:
            raise PrefError(f"must be one of {list(allowed)}")
    return check


def boolean(v):
    if not isinstance(v, bool):
        raise PrefError("must be true or false")


def path_outside_package(v):
    if v is not None and (not isinstance(v, str) or Path(v).expanduser().resolve().is_relative_to(PACKAGE)):
        raise PrefError("must be null or a path outside the Skill package")


def validators():
    locales, providers, styles = registries()
    return {
        "locale": lambda v: v is None or one_of(*locales)(v),
        "narration.provider": one_of("auto", *providers),
        "narration.voice": lambda v: v == "auto" or text(64)(v),
        "narration.accent": text(64),
        "narration.tone": text(64),
        "style": one_of("auto", *styles),
        "duration_seconds": lambda v: None if isinstance(v, (int, float)) and not isinstance(v, bool) and 10 <= v <= 600 else (_ for _ in ()).throw(PrefError("must be a number of seconds from 10 to 600")),
        "orientation": one_of("vertical", "horizontal"),
        "resolution": one_of(540, 720, 1080),
        "fps": one_of(24, 25, 30, 60),
        "captions.enabled": boolean,
        "captions.burn_in": boolean,
        "captions.subtitle_files": lambda v: None if isinstance(v, list) and set(v) <= {"srt", "vtt"} and len(set(v)) == len(v) else (_ for _ in ()).throw(PrefError("must be a list drawn from ['srt', 'vtt']")),
        "music.enabled": boolean,
        "music.level": one_of("subtle", "moderate"),
        "sfx.enabled": boolean,
        "sfx.density": one_of("sparse", "moderate"),
        "review_mode": one_of("guided", "checkpoint", "autonomous"),
        "output_dir": path_outside_package,
        "cost_policy": one_of("local-only", "local-plus-free-network"),
        "presentation": one_of("auto", "framed", "full-bleed"),
    }


def flat(d, prefix=""):
    out = {}
    for k, v in d.items():
        if isinstance(v, dict):
            out.update(flat(v, f"{prefix}{k}."))
        else:
            out[f"{prefix}{k}"] = v
    return out


def nest(flat_items):
    out = {}
    for key, value in flat_items.items():
        node = out
        *parents, leaf = key.split(".")
        for p in parents:
            node = node.setdefault(p, {})
        node[leaf] = value
    return out


def parse_pairs(pairs):
    rules, items = validators(), {}
    for pair in pairs:
        if "=" not in pair:
            raise PrefError(f"expected key=value, got {pair!r}")
        key, raw = pair.split("=", 1)
        if key not in rules:
            raise PrefError(f"unknown preference {key!r}; known: {', '.join(rules)}")
        try:
            value = json.loads(raw)
        except ValueError:
            value = raw
        try:
            rules[key](value)
        except PrefError as error:
            raise PrefError(f"{key}: {error}") from None
        items[key] = value
    return items


def validate_saved(prefs):
    rules = validators()
    for key, value in flat(prefs).items():
        if key not in rules:
            raise PrefError(f"saved preferences contain unknown key {key!r}")
        try:
            rules[key](value)
        except PrefError as error:
            raise PrefError(f"saved {key}: {error}") from None


def store_path(arg):
    if arg:
        path = Path(arg)
    elif os.environ.get("VC_PREFERENCES"):
        path = Path(os.environ["VC_PREFERENCES"])
    else:
        base = Path(os.environ.get("APPDATA") or os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config")
        path = base / "video-creator" / "preferences.json"
    path = path.expanduser().resolve()
    if path.is_relative_to(PACKAGE):
        raise PrefError("the preference store must live outside the Skill package")
    return path


def load(path):
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except ValueError as error:
        raise PrefError(f"preference store is not valid JSON ({error}); it was left untouched") from None
    if data.get("schema") != SCHEMA:
        raise PrefError("not a Video Creator preference store; it was left untouched")
    if data.get("version") != VERSION:
        raise PrefError(f"preference schema version {data.get('version')} is not supported by this Skill (expects {VERSION}); it was left untouched")
    validate_saved(data.get("preferences", {}))
    return data


def save(path, prefs):
    """Atomic write: temporary file in the same folder, then replace."""
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {"schema": SCHEMA, "version": VERSION, "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"), "preferences": prefs}
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".preferences-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2); f.write("\n")
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def resolve(saved, request):
    effective, source = {}, {}
    for key, default in flat(DEFAULTS).items():
        effective[key], source[key] = default, "default"
    for key, value in flat(saved).items():
        effective[key], source[key] = value, "saved"
    for key, value in request.items():
        effective[key], source[key] = value, "request"
    return effective, source


def check_capabilities(effective, runtimes):
    """Validate the effective configuration with doctor.py. `auto` stays an agent decision and is not checked as a capability."""
    problems = []
    if effective["locale"] is None:
        problems.append(dict(code="locale-unset", detail="no language chosen: set locale or pass locale=<bcp47> in the request"))
    args = [sys.executable, "-I", str(HERE / "doctor.py")]
    for r in runtimes:
        args += ["--runtime", r]
    if effective["locale"]:
        args += ["--locale", effective["locale"]]
    for key, flag in (("style", "--style"), ("narration.provider", "--provider"), ("narration.voice", "--voice")):
        if effective[key] != "auto":
            args += [flag, effective[key]]
    if effective["output_dir"]:
        args += ["--project", effective["output_dir"]]
    with tempfile.TemporaryDirectory() as tmp:
        report_file = Path(tmp) / "doctor.json"
        done = subprocess.run(args + ["--json", str(report_file)], capture_output=True, text=True, encoding="utf-8", errors="replace")
        if not report_file.exists():
            raise PrefError(f"capability check failed to run: {done.stderr.strip()[-300:]}")
        report = json.loads(report_file.read_text(encoding="utf-8"))
    problems += report["compatibility"]["problems"]
    choices = dict(styles=[k for k, v in report["styles"].items() if v["status"] == "available"],
                   routes=[dict(provider=r["provider"], voices=[v["id"] for v in r["voices"]])
                           for r in report["locales"].get(effective["locale"] or "", {}).get("routes", []) if r["status"] == "available"])
    styles_reg = json.loads((HERE / "styles" / "registry.json").read_text(encoding="utf-8"))
    mode = effective.get("presentation", "auto")
    if mode != "auto" and effective["style"] != "auto" and mode not in styles_reg.get(effective["style"], {}).get("presentations", ["framed"]):
        problems.append(dict(code="presentation-unsupported", detail=f"style {effective['style']} does not support the {mode} presentation"))
    choices["styles"] = [s for s in choices["styles"] if mode == "auto" or mode in styles_reg.get(s, {}).get("presentations", ["framed"])]
    if effective["style"] == "auto" and not choices["styles"]:
        problems.append(dict(code="no-style-available", detail="style is auto but no style backend is available on this host"))
    if effective["locale"] and effective["narration.provider"] == "auto" and not choices["routes"]:
        problems.append(dict(code="narration-unavailable", detail=f"no available narration route for {effective['locale']}"))
    return dict(ready=not problems, problems=problems, available_for_auto=choices, host_invocation=report["host_invocation"])


def main(argv):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["show", "init", "set", "unset", "reset", "resolve"])
    ap.add_argument("items", nargs="*")
    ap.add_argument("--store"); ap.add_argument("--json"); ap.add_argument("--check", action="store_true")
    ap.add_argument("--confirm", action="store_true"); ap.add_argument("--runtime", action="append", default=[])
    a = ap.parse_args(argv)
    path = store_path(a.store)
    if a.json and Path(a.json).resolve().is_relative_to(PACKAGE):
        raise PrefError("--json output must be written outside the Skill package")
    data = load(path)
    saved = data["preferences"] if data else {}
    if a.command == "show":
        result = dict(store=str(path), exists=bool(data), preferences=saved, updated=(data or {}).get("updated"))
    elif a.command == "init":
        if data or path.exists():
            raise PrefError(f"a preference store already exists at {path}; use set/unset, or reset --confirm")
        save(path, nest(parse_pairs(a.items)))
        result = dict(store=str(path), created=True, preferences=load(path)["preferences"])
    elif a.command == "set":
        if not a.items:
            raise PrefError("set needs at least one key=value")
        if not data:
            raise PrefError(f"no preference store at {path}; run init first")
        merged = {**flat(saved), **parse_pairs(a.items)}
        save(path, nest(merged))
        result = dict(store=str(path), preferences=load(path)["preferences"])
    elif a.command == "unset":
        if not data:
            raise PrefError(f"no preference store at {path}")
        rules = validators()
        unknown = [k for k in a.items if k not in rules]
        if unknown or not a.items:
            raise PrefError(f"unset needs known keys; unknown: {unknown}")
        save(path, nest({k: v for k, v in flat(saved).items() if k not in a.items}))
        result = dict(store=str(path), preferences=load(path)["preferences"])
    elif a.command == "reset":
        if not a.confirm:
            raise PrefError("reset replaces saved preferences with defaults; pass --confirm")
        backup = None
        if path.exists():
            backup = path.with_name(f"{path.stem}.backup-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json")
            backup.write_bytes(path.read_bytes())
        save(path, {})
        result = dict(store=str(path), reset=True, backup=str(backup) if backup else None)
    else:  # resolve
        request = parse_pairs(a.items)
        effective, source = resolve(saved, request)
        result = dict(store=str(path), saved_exists=bool(data), effective=nest(effective), source=nest(source),
                      creative_decisions_left_to_agent=[k for k, v in effective.items() if v == "auto"])
        if a.check:
            result["capabilities"] = check_capabilities(effective, a.runtime)
    print(json.dumps(result, ensure_ascii=True, indent=2))  # ASCII-safe on any console code page; files stay UTF-8
    if a.json:
        Path(a.json).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 1 if a.command == "resolve" and a.check and not result["capabilities"]["ready"] else 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except PrefError as error:
        print(f"[preferences] {error}", file=sys.stderr)
        sys.exit(1)
