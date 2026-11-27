"""Launch a narration provider in its own runtime (standard library only; shared by narrate.py and doctor.py).

Runtime JSON (outside the Skill package) selects the kind:
  {"kind": "python", "python": <interpreter>, ...}                       provider runs on this host (default kind)
  {"kind": "wsl", "distro": <name>, "python": <Linux interpreter>, ...}   provider runs inside a WSL2 distribution
The registry entry's "runtime" must match the kind; nothing is substituted.
"""
import os
from pathlib import Path, PureWindowsPath
import re

KINDS = {"python-environment": "python", "wsl-python-environment": "wsl"}


class RuntimeError_(Exception):
    def __init__(self, code, message):
        super().__init__(f"[{code}] {message}")
        self.code = code


def kind(entry, runtime):
    expected = KINDS.get(entry.get("runtime"), "python")
    actual = runtime.get("kind", "python")
    if actual != expected:
        raise RuntimeError_("invalid-runtime", f"provider needs a {expected!r} runtime, configuration declares {actual!r}")
    if actual == "wsl" and not re.fullmatch(r"[A-Za-z0-9._-]{1,64}", str(runtime.get("distro", ""))):
        raise RuntimeError_("invalid-runtime", "WSL runtime needs a valid 'distro' name")
    return actual


def wsl_path(path):
    """D:\\a\\b -> /mnt/d/a/b. UNC and relative paths are rejected."""
    p = PureWindowsPath(str(Path(path).resolve()))
    if not re.fullmatch(r"[A-Za-z]:", p.drive) or not p.root:
        raise RuntimeError_("invalid-runtime", f"cannot map {path} into WSL (drive-letter paths only)")
    return "/mnt/" + p.drive[0].lower() + "/" + "/".join(p.parts[1:])


def command(entry, runtime, script):
    """(argv, translate) for running `script` with the runtime's interpreter; translate maps host paths for the provider."""
    if kind(entry, runtime) == "python":
        return [runtime["python"], "-B", str(script)], str
    if os.name != "nt":  # already inside Linux: run the interpreter directly
        return [runtime["python"], "-B", str(script)], str
    return ["wsl.exe", "-d", runtime["distro"], "--exec", runtime["python"], "-B", wsl_path(script)], wsl_path
