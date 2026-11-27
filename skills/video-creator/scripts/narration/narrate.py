"""Provider-independent narration and timing front end (system Python, standard library only).

  python narrate.py providers
  python narrate.py synth --project <dir> --provider kokoro-onnx --locale hi-IN --voice hf_alpha \
      --runtime <runtime.json> --text-file <utf8.txt> --id <segment-id> --out-dir narration/segments
  python narrate.py combine --project <dir> ...        (same arguments as combine_segments.py)
  python narrate.py validate --project <dir> <timeline.json> [...]

The runtime JSON lives outside the Skill package: {"python": <provider environment interpreter>, "model": <path>, "voices": <path>}.
Unsupported provider, locale or voice combinations fail with an explicit code; nothing falls back silently.
"""
import json
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
PACKAGE = HERE.parents[1]
sys.dont_write_bytecode = True  # never write caches into the (immutable) Skill package
sys.path.insert(0, str(HERE))
from timeline import validate  # noqa: E402
import runtimes  # noqa: E402


class NarrationError(Exception):
    def __init__(self, code, message):
        super().__init__(f"[{code}] {message}")
        self.code = code


def registry():
    data = json.loads((HERE / "providers" / "registry.json").read_text(encoding="utf-8"))
    return {k: v for k, v in data.items() if not k.startswith("_")}


def route(provider, locale, voice):
    providers = registry()
    entry = providers.get(provider) or _fail("unsupported-provider", f"Unknown narration provider {provider!r}; known: {', '.join(providers)}")
    if not entry.get("implementation"):
        _fail("provider-not-packaged", f"{provider} is {entry['status']}: {entry.get('note', 'no packaged implementation')}")
    loc = entry["locales"].get(locale) or _fail("unsupported-locale",
        f"{provider} has no route for {locale}; supported: {', '.join(entry['locales']) or 'none'}. No other provider or language is substituted.")
    if voice not in loc["voices"]:
        _fail("unsupported-voice", f"{provider}/{locale} supports voices {loc['voices']}, not {voice!r}")
    return entry, loc


def _fail(code, message):
    raise NarrationError(code, message)


def read_text(path, loc):
    """Same normalization as the tested Kokoro text-file input: UTF-8 (BOM allowed), whitespace collapsed, no other changes."""
    try:
        text = " ".join(Path(path).read_bytes().decode("utf-8-sig").split())
    except UnicodeDecodeError:
        _fail("invalid-text", "Text file is not valid UTF-8")
    if not text or len(text) > 2000:
        _fail("invalid-text", "Text must be 1–2000 characters")
    ranges = [(int(a, 16), int(b, 16)) for a, b in loc.get("script_ranges", [])]
    if ranges and not any(lo <= ord(ch) <= hi for ch in text for lo, hi in ranges):
        _fail("script-mismatch", "Text contains no characters of the locale's script")
    return text


def synth(argv):
    import argparse
    p = argparse.ArgumentParser(prog="narrate.py synth")
    for name in ("project", "provider", "locale", "voice", "runtime", "text-file", "id", "out-dir"):
        p.add_argument("--" + name, required=True)
    a = p.parse_args(argv)
    entry, loc = route(a.provider, a.locale, a.voice)
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}", a.id):
        _fail("invalid-id", "Segment id must be 1–64 letters, digits, '-' or '_'")
    project = Path(a.project).resolve()
    text_file = Path(a.text_file) if Path(a.text_file).is_absolute() else project / a.text_file
    text = read_text(text_file, loc)  # input is validated before any runtime is touched
    runtime = json.loads(Path(a.runtime).read_text(encoding="utf-8"))
    try:
        argv, host = runtimes.command(entry, runtime, HERE / "providers" / entry["implementation"])
    except runtimes.RuntimeError_ as error:
        _fail(error.code, str(error).split("] ", 1)[1])
    paths = entry.get("runtime_paths", {"python": "file", "model": "file", "voices": "file"})
    for key, kind in paths.items():
        path = Path(runtime.get(key, "")).resolve()
        if not runtime.get(key) or not (path.is_dir() if kind == "dir" else path.is_file()):
            _fail("missing-runtime", f"Runtime {key} not found: {runtime.get(key)}")
    for key in ("python", "model", "voices"):
        if runtime.get(key) and Path(runtime[key]).resolve().is_relative_to(PACKAGE):
            _fail("invalid-runtime", "Models and environments must live outside the Skill package")
    request = dict(project=host(project), out_dir=a.out_dir, id=a.id, text=text, locale=a.locale, voice=a.voice,
                   model=host(runtime["model"]), voices=runtime.get("voices"), lang=loc.get("lang"),
                   kokoro_lang=loc.get("kokoro_lang"), espeak_lang=loc.get("espeak_lang"))
    env = {"ONNX_PROVIDER": "CPUExecutionProvider", "OMP_NUM_THREADS": "4", "HF_HUB_OFFLINE": "1", "PYTHONIOENCODING": "utf-8"}
    import os
    try:
        done = subprocess.run(argv, input=json.dumps(request), capture_output=True, text=True, encoding="utf-8",
                              env={**os.environ, **env}, timeout=900)
    except (OSError, subprocess.TimeoutExpired) as error:
        _fail("provider-failed", f"{type(error).__name__}: {error}")
    if done.returncode:
        _fail("provider-failed", done.stderr.strip().splitlines()[-1] if done.stderr.strip() else f"exit {done.returncode}")
    result = json.loads(done.stdout.strip().splitlines()[-1])
    timeline = json.loads((project / result["timeline"]).read_text(encoding="utf-8"))
    validate(timeline, project)  # independent re-validation outside the provider environment
    if timeline["validation"] != "unreviewed" or timeline["audio"]["sha256"] != result["sha256"] or timeline["run_id"] != result["run_id"]:
        _fail("provider-contract", "Timeline does not match the provider result (hash, run id or review status)")
    print(json.dumps(result, ensure_ascii=False))


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in {"providers", "synth", "combine", "validate"}:
        print(__doc__); sys.exit(2)
    command, rest = sys.argv[1], sys.argv[2:]
    try:
        if command == "providers":
            for name, entry in registry().items():
                print(json.dumps({"provider": name, "status": entry["status"], "timing": entry["timing_method"],
                                  "word_timing": entry.get("word_timing", True), "locales": list(entry["locales"])}))
        elif command == "synth":
            synth(rest)
        else:
            script = "combine_segments.py" if command == "combine" else "timeline.py"
            sys.exit(subprocess.run([sys.executable, "-I", str(HERE / script), *rest]).returncode)
    except NarrationError as error:
        print(error, file=sys.stderr); sys.exit(1)


if __name__ == "__main__":
    main()
