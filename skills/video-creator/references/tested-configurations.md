# Tested configurations (P026.3)

What has actually been exercised, kept apart from minimum requirements and unverified setups.
- **Values below:** read from runtime evidence recorded by the tools themselves (provider runtime records, render evidence, `doctor.py`) on the reference machine.
- **Last updated:** 2026-11-27.

## Verified (reference machine)

| Component | Version | Source of evidence |
|---|---|---|
| OS | Windows 11 (build 26300), x64 | Host |
| Node.js | 24.19.0 (minimum enforced: 22) | `node --version`; `doctor.py` |
| Python (tools) | 3.14.3 (documented minimum 3.10; older versions untested) | `python --version` |
| FFmpeg / FFprobe | 9.0.2 (gyan.dev full build) | `ffmpeg -version` |
| Browser | Google Chrome 157.0.8103.79 (headless) | Render evidence `browser` field |
| Blender (optional) | 5.2.2 LTS | `blender_layers.py detect` |
| Hosts | Claude Code desktop (Windows); Codex (Windows, native discovery) | `README.md` host table |

### Mithi v2 Flash narration runtime (WSL2)

| Component | Version | Source |
|---|---|---|
| WSL distribution | Ubuntu 24.04 (glibc 2.39, WSL2 kernel 6.18) | Provider runtime record |
| Python | 3.12.3 | Provider runtime record |
| PyTorch | 2.9.1+cpu (a CUDA build is refused) | Provider runtime record |
| soundfile | 0.14.0 | Provider runtime record |
| NumPy and the model's other `run.py` imports | **Not recorded.** Follow the model card | — |
| Model | `Oomni/mithi-v2-flash` @ `1fc0dd68496a2483508ec764d310146c41ff90be`, 208,472,482 bytes; every file SHA-256-pinned | `scripts/narration/providers/mithi-v2-flash.manifest.json` |

There is no hash-locked package set for Mithi; the versions above are the tested ones, not a lock.

### Kokoro ONNX narration runtime (Windows, Hindi)

- **Packages:** the exact tested wheel set, CPython 3.12 win_amd64, 16 packages with SHA-256 hashes, is in `scripts/narration/providers/kokoro-requirements.txt`:
  - kokoro-onnx 0.6.1, onnxruntime 1.32.0, numpy 2.5.5, soundfile 0.14.0;
  - phonemizer 3.6.0;
  - espeakng-loader 0.2.4, which supplies the eSpeak NG data;
  - and their dependencies.
- **Model files:** `kokoro-v1.0.onnx` and `voices-v1.0.bin`, pinned by `scripts/narration/providers/kokoro-onnx.manifest.json`.

## Unverified

- Linux and macOS hosts.
- Other Windows versions; Python 3.10–3.13 for the tools; Node 22–23.
- Other FFmpeg builds; Edge or Chromium instead of Chrome.
- WSL distributions other than Ubuntu 24.04.
- Other PyTorch, NumPy or onnxruntime versions.
- Antigravity and other Agent Skill hosts.
- Headless `claude -p` end to end.

They may work; `doctor.py` reports what it can detect, but no run has confirmed them.

## Vulnerability status (checked 2026-11-27 against the public OSV database)

| Package set | Result |
|---|---|
| Kokoro (16 packages in `kokoro-requirements.txt`) | **No known advisories** |
| Mithi: soundfile 0.14.0 | No known advisories |
| Mithi: PyTorch 2.9.1 | **5 advisories**: CVE-2026-24747 (untrusted checkpoint loading, two IDs; fixed in 2.10.0), CVE-2025-3001 (`lstm_cell`; fixed in 2.10.0), CVE-2025-3000 (`jit.script`; fixed in 2.13.0), CVE-2026-4538 (no fix listed) |

**PyTorch assessment:**
- Exposure is assessed as low for local narration. The model folder is hash-pinned rather than untrusted, and inputs are your own script text.
- A newer PyTorch has **not** been validated with Mithi; upgrading needs a fresh narration and timing check.

**Not covered:** Node.js, Chrome, FFmpeg, Blender and WSL. They aren't Python packages, and no scanner was installed. Keep them updated through their vendors.

## Runtime files

`doctor.py` and the narration stage look for one file per provider, in this order:

1. `--runtime <provider>=<file>` (explicit, always wins).
2. `$VC_RUNTIMES/<provider>.json`.
3. `<APPDATA | XDG_CONFIG_HOME | ~/.config>/video-creator/runtimes/<provider>.json`.

Nothing else is searched. On Windows the default folder is `%APPDATA%\video-creator\runtimes\`, with `mithi.json` and `kokoro-onnx.json`. When a file is missing, `doctor.py` prints the exact path it expected.
