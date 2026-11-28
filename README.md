# Video Creator Skill

**Turn a topic into a sourced, narrated, animated explainer video, using free local tools on your own computer.**

> **Status: v0.2.1-beta maintenance release candidate (not yet published). The latest published prerelease is [v0.2.0-beta](https://github.com/sumannaidur/video-creator-skill/releases/tag/v0.2.0-beta).** The pipeline works end to end, but the output is **not** artistically validated and **not** production-ready. Every video it makes still needs human review: artistic, factual, native-language, licensing and publication. See [Known limitations](#known-limitations).

Video Creator is an [Agent Skill](https://agentskills.io): a folder of instructions (`SKILL.md`), reference guides and scripts that an AI coding agent such as Claude Code or Codex loads when you ask for an explainer video.
- **The agent decides** what to say and show: research, script, art direction, shots, motion, captions and sound.
- **Packaged scripts** do the deterministic work: speech synthesis and timing, rendering, mixing and measurement.
- **You** review and approve.

---

## Contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Visual styles](#visual-styles)
- [Languages and voices](#languages-and-voices)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Narration runtime setup](#narration-runtime-setup)
- [Check your setup](#check-your-setup)
- [First-use preferences](#first-use-preferences)
- [Quick start](#quick-start)
- [What you get](#what-you-get)
- [Costs and resources](#costs-and-resources)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Licensing](#licensing)
- [Repository layout](#repository-layout)
- [For AI agents](#for-ai-agents)

---

## What it does

- **Researches** the topic and keeps a claim ledger with sources and uncertainty. It never invents facts or citations.
- **Writes a native script** in the chosen language, with a hook, progression and payoff, then **narrates** it with a local text-to-speech model and word-level timing.
- **Estimates narration length before synthesis**, and revises the script if the measured audio misses the target (±10 %). Voice speed is never changed.
- **Designs original artwork and motion** in one of nine visual styles, cued to the spoken words.
- **Checks before and during rendering:**
  - pre-render validation of IDs, timing and paths;
  - keyframe composition checks, where protected subjects must not be cropped or covered by labels;
  - a full visual preflight of every frame.
- **Renders** a checkpointed, resumable MP4 (or an exact short preview window), with burned-in captions plus SRT/VTT files.
- **Mixes** narration with optional original procedural music and effects. Narration stays dominant; loudness and sync are measured.
- **Writes a QA report**, a delivery report and a human-review checklist. It never declares a video publish-ready.

Everything runs locally and CPU-first. No paid service, API key or cloud account is needed to produce a video.

## How it works

Each video is a **project folder** outside the Skill, with a ledger (`project.json`). The agent moves through seven stages and records verified evidence for each, so interrupted work resumes instead of restarting.

| # | Stage | What happens |
|---|---|---|
| 1 | Research | Sources and a claim ledger |
| 2 | Script | Native-language narration script |
| 3 | Narration | Local TTS, word timing, duration check |
| 4 | Creative plan | Visual hook, transformation, payoff; shots and cue words tied to the narration |
| 5 | Visual production | Original artwork as a topic module. Keyframes are reviewed first, then preflight, an optional preview window, and the final render |
| 6 | Sound | Optional procedural music and effects, mixed under the narration |
| 7 | Review and delivery | Unified QA; human review and publication remain separate approvals |

**Review modes:**
- `guided` (default): stops for your approval after each major stage.
- `checkpoint`: stops after the script and the preview.
- `autonomous`: runs to the final render, then stops for human review.

## Visual styles

All nine styles support a `framed` layout and a `full-bleed` layout. Full-bleed adds word-synchronised captions and an optional hook.

| Style | Use it for | Validation so far |
|---|---|---|
| Paper Explainer | Cut-paper storytelling, nature, everyday science | Production videos (earlier releases) and development previews |
| Tech Explainer | Devices, systems, materials (optional Blender material layers) | One Full HD production completed in Claude Code that passed technical QA (E42, Telugu, induction stove); human review pending |
| Whiteboard | Building an argument on one board | Development keyframes |
| Flat Science | Biology, physics, processes | Development keyframes |
| Data Storytelling | Sourced numbers and trends | Development keyframes |
| Kinetic Typography | Ideas carried by words | Development keyframes |
| X-Ray Explainer | Hidden mechanisms revealed from outside in | Development keyframes |
| Documentary | Real events with verified, credited photographs | Development keyframes |
| 3D Explainer | Genuine 3D mechanisms (WebGL on the CPU) | Development keyframes |

No style has passed human artistic review yet. "Development keyframes" means representative frames on unseen topics, not finished videos.

## Languages and voices

| Locale | Language | Narration route |
|---|---|---|
| `te-IN` | Telugu | Mithi `ahana` |
| `kn-IN` | Kannada | Mithi `vaidehi` |
| `ta-IN` | Tamil | Mithi `malini` |
| `en-IN` | Indian English | Mithi `anirban` |
| `hi-IN` | Hindi | Mithi `charvi`, or Kokoro `hf_alpha` |

Synthesis and word timing are technically validated for all five. Timings are model-predicted, not acoustically verified. **No language has had native-speaker review.** The Skill never switches language or voice silently.

## Prerequisites

The listed hosts and tools are all free. Nothing below is bundled with the Skill.

**Verified configuration** (the only one exercised so far): Windows 11; Node.js 24.19; Python 3.14; FFmpeg 9.0.2; Chrome 157; Mithi in WSL2 Ubuntu 24.04 (Python 3.12.3, CPU PyTorch 2.9.1); Kokoro with the hash-pinned wheel set for CPython 3.12; optional Blender 5.2.2. Exact versions, evidence and vulnerability status are in the package's `references/tested-configurations.md`. Other versions and platforms may work but are **unverified**.

- **An Agent Skill host with shell access:** Claude Code or Codex (see [Host compatibility](#host-compatibility)).
- **Operating system:** Windows 11. This is the only platform exercised so far; Linux and macOS are untested.
- **Node.js 22 or newer**, **Python 3.10 or newer**, **FFmpeg and FFprobe** on `PATH`.
- **A Chromium browser** (Chrome, Edge or Chromium). It is found automatically, or you can pass `--chrome`.
- **At least one narration runtime** (next sections):
  - **Mithi v2 Flash** for all five languages. It needs **WSL2** (for example Ubuntu 24.04) with a CPU-only Python environment.
  - **Kokoro ONNX** for Hindi only. It needs a Windows Python environment.
- **Optional: Blender** (5.2.2 verified) for pre-rendered artwork layers. Without it, every style uses its own renderer.
- **Disk and memory:**
  - The Mithi model is about 208 MB.
  - A Full HD render keeps its JPEG frames until you delete them.
  - Mithi refuses to synthesize below 1 GiB of free memory.
  - Blender used about 2.6 GB peak for one detailed still.

## Installation

Download `video-creator-v0.2.1-beta.zip` and `video-creator-v0.2.1-beta.zip.sha256` from the [releases page](https://github.com/sumannaidur/video-creator-skill/releases). Until v0.2.1-beta is published, use the v0.2.0-beta files and substitute that version in the commands. Verify the checksum:

```powershell
(Get-FileHash .\video-creator-v0.2.1-beta.zip -Algorithm SHA256).Hash.ToLower()
Get-Content .\video-creator-v0.2.1-beta.zip.sha256
```

The two hashes must match. Then extract the archive; it contains one folder, `video-creator`.

```powershell
Expand-Archive .\video-creator-v0.2.1-beta.zip -DestinationPath $env:TEMP\vc-release -Force
```

### Claude Code

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse "$env:TEMP\vc-release\video-creator" "$HOME\.claude\skills\video-creator"
```

Start a new Claude Code session. `video-creator` then appears among the available skills. Ask for a video in plain language, or type `/video-creator`.

### Codex

```powershell
New-Item -ItemType Directory -Force "$HOME\.agents\skills" | Out-Null
Copy-Item -Recurse "$env:TEMP\vc-release\video-creator" "$HOME\.agents\skills\video-creator"
```

Start a new Codex session. Ask in plain language, or mention `$video-creator`.

### Host compatibility

| Host | Status |
|---|---|
| Claude Code, desktop app (Windows 11) | **Verified.** Install, native discovery and invocation (v0.1.0). The v0.2.0 content was used natively, including the complete E42 Full HD production (research to delivery QA) |
| Codex (Windows 11) | **Verified discovery.** Codex natively discovered the v0.2.0 release-candidate content (development install `video-creator-dev`, version 0.2.0-beta-dev, enabled) from `~/.agents/skills`. Development keyframe runs were invoked natively. A complete Codex production has not been run |
| Claude Code headless (`claude -p`) | Discovery only. End-to-end runs **unverified** |
| Antigravity | **Unverified.** Not tested; no compatibility claimed |
| Other Agent Skill hosts, Linux, macOS | **Untested** |

**Update:** delete the installed `video-creator` folder and copy the new one. **Uninstall:** delete the folder. Preferences, runtime files and projects live outside it and are left untouched.

## Narration runtime setup

**What is verified and what is not:** the runtime-file formats, the model hash checks and the doctor's readiness report are verified, because the packaged tools enforce them. The environment-creation steps below are **reference guidance**, derived from what the packaged providers import and check. A fresh install by following them has **not** been exercised end to end. If `doctor.py` reports a route `missing`, its remedy takes precedence over this guide.

Create one small runtime file per provider **outside** the Skill folder. The tools look for exactly one conventional location, so you don't need to pass paths on every run:

- Windows: `%APPDATA%\video-creator\runtimes\mithi.json` and `%APPDATA%\video-creator\runtimes\kokoro-onnx.json`.
- Elsewhere: `$XDG_CONFIG_HOME/video-creator/runtimes/` or `~/.config/video-creator/runtimes/`.
- Or any folder named by the `VC_RUNTIMES` environment variable.

An explicit `--runtime <provider>=<file>` always overrides. The tools refuse runtime paths inside the package.

### Mithi v2 Flash (all five languages, WSL2)

1. Install WSL2 with a Linux distribution, for example `Ubuntu-24.04`.
2. In the distribution, create a Python virtual environment with **CPU-only PyTorch** (a CUDA build is refused), NumPy, soundfile, and whatever else the model's own `run.py` imports. Follow the model card.
3. Download the model repository `Oomni/mithi-v2-flash` at revision `1fc0dd68496a2483508ec764d310146c41ff90be` into a Windows folder. Every file is hash-checked against the packaged manifest before each synthesis, so any other revision is refused.
4. Write `%APPDATA%\video-creator\runtimes\mithi.json`:

```json
{"kind": "wsl", "distro": "Ubuntu-24.04", "python": "/home/<you>/<mithi-env>/bin/python", "model": "D:/<models>/mithi"}
```

### Kokoro ONNX (Hindi only, Windows Python)

1. Create a CPython 3.12 (Windows x64) environment outside the Skill folder, and install the exact tested, hash-pinned wheel set: `python -m pip install --require-hashes -r <installed Skill>\scripts\narration\providers\kokoro-requirements.txt`. That includes kokoro-onnx 0.6.1, onnxruntime 1.32.0 and phonemizer 3.6.0; eSpeak NG data comes from `espeakng-loader`. Other Python versions need different wheels and are unverified.
2. Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the kokoro-onnx `model-files-v1.1` release.
3. Write `%APPDATA%\video-creator\runtimes\kokoro-onnx.json`:

```json
{"python": "C:/<kokoro-env>/Scripts/python.exe", "model": "C:/<models>/kokoro-v1.0.onnx", "voices": "C:/<models>/voices-v1.0.bin"}
```

## Check your setup

Run the packaged doctor. It is read-only: it downloads, installs and changes nothing.

```powershell
python "$HOME\.claude\skills\video-creator\scripts\doctor.py" --locale te-IN
```

For Codex installs, use the `$HOME\.agents\skills\video-creator\...` path. Runtime files are found in the conventional folder. If one is missing, the report prints the exact path it expected. The report lists the system, tools, Blender (optional), every narration route and every style as `available`, `installed`, `planned` or `missing`, each with a remedy. The last line says `READY` or `NOT READY`.

## First-use preferences

On first use the agent asks once and saves your choices to `%APPDATA%\video-creator\preferences.json`. You can also set them yourself:

```powershell
python "$HOME\.claude\skills\video-creator\scripts\preferences.py" init locale=te-IN style=auto presentation=full-bleed review_mode=guided
```

| Key | Values |
|---|---|
| `locale` | `te-IN`, `kn-IN`, `ta-IN`, `en-IN`, `hi-IN` (there is no default language) |
| `style` | `auto` or a style ID (`paper-explainer`, `tech-explainer`, `whiteboard`, `flat-science`, `data-storytelling`, `kinetic-typography`, `x-ray-explainer`, `documentary`, `3d-explainer`) |
| `presentation` | `auto`, `framed`, `full-bleed` |
| `narration.provider` / `narration.voice` | `auto` or an explicit route |
| `review_mode` | `guided`, `checkpoint`, `autonomous` |
| others | duration, orientation, resolution, fps, captions, music, effects |

A value you give in a request overrides the saved preference for that run only, and is never saved.

## Quick start

Ask your agent in plain language. Include the topic, language and length; everything else can be left to the Skill.

- "Make a 30-second Telugu explainer on how an induction stove heats only the pan."
- "Create a 60-second Kannada Data Storytelling video on monsoon rainfall, full-bleed, guided mode."
- "Plan, but don't render, a Hindi whiteboard explainer on photosynthesis."
- "Render three keyframes only, then stop for my review."
- "Resume my video project in `D:\videos\vc-20261127-xxxx`."

In guided mode the agent stops after the research, script, narration, plan, keyframes and preview, so you can steer before anything expensive runs. Downloads of external assets (for example photographs) always need your approval.

## What you get

Inside the project folder:

| Path | Content |
|---|---|
| `research/` | `claims.json`, `sources.json` |
| `script/script.json` | The narration script |
| `narration/` | Narration WAV and word-timing timeline |
| `plan/` | Creative plan and the resolved plan with cue times |
| `captions/` | `captions.json`, `.srt`, `.vtt` |
| `render/` | Keyframes, preview windows, the final MP4 and render evidence |
| `audio/` | Mix spec, mix and mix evidence (if sound is used) |
| `qa/` | `qa-report.json`, `delivery-report.md`, `human-review-checklist.md`, preflight results |

The final video is an H.264/AAC MP4, by default 1080×1920 at 30 fps. 1920×1080 and 24/25/60 fps are also supported.

## Costs and resources

- **Money:** none required. All tools are free; nothing calls a paid API. Your agent host may have its own subscription or usage limits.
- **Time** (reference Windows laptop, CPU only):

  | Task | Measured time |
  |---|---|
  | 30 s Full HD Tech render | About 2.2 minutes (870 frames) |
  | 3D Explainer | About 0.7 s per frame |
  | Keyframes | Seconds |
  | Visual preflight | Seconds to minutes |
  | Blender layer or still (optional) | About 10–25 s each |

- **Agent usage:** expect the most tokens during research, art direction and keyframe review. Use `guided` mode and keyframes-first reviews to avoid wasted renders.

## Troubleshooting

| Symptom | What to do |
|---|---|
| The Skill doesn't appear | Check that the path is `...\skills\video-creator\SKILL.md` (one folder level), then start a new session |
| `doctor.py` says NOT READY or a route is `missing` | Follow the remedy it prints: a missing tool on `PATH`, runtime file, model hash or WSL distribution |
| `decision-required` | Choose an explicit provider or voice instead of `auto` |
| Narration duration off target | Expected: the agent revises the script. Speech speed is never changed |
| `unsupported-style`, `presentation-unsupported` | Pick a listed style or mode. Nothing is substituted silently |
| `stale-plan`, `stale-captions`, `preflight-stale` | An input changed after verification. Re-run the stage the error names; verified stages are reused |
| `[validation] …` or `Composition at …` | The topic has a duplicate ID, an out-of-range time, or a subject that is cropped or covered. The agent fixes the named item, and intentional crops or overlaps need a written reason |
| `[blender-unavailable]` | Blender is optional. Install it, or let the style use its own renderer |
| Slow renders | Review keyframes and short 540×960 preview windows before Full HD |
| Headless `claude -p` says "Not logged in" | Run `claude /login` |

## Known limitations

- **Quality:** the goal is professional animation quality, and this beta does not reach it. Self-reviews rate most keyframes mid quality. Recurring weaknesses:
  - subject-to-frame fit and empty space;
  - labels without leader lines;
  - overlay legibility in perspective views.
- **Validation depth:** only Paper and Tech have production evidence. The other seven styles have development keyframes only. No video has passed human review.
- **Timing:** narration timing is model-predicted and unreviewed.
- **Duration estimator:** moderate confidence for Indian English only; low for the four Indic voices; Kokoro is unmeasured.
- **Composition checks:** they need declared subject regions. Anchors without leader lines, contrast on non-solid labels and 3D occlusion are reported as unsupported, never passed.
- **3D:** the 3D style cannot import textures or models. Blender is verified for static layers and stills only.
- **Captions:** the full-bleed text-safe areas are assumptions, not measured platform UI zones.
- **Platform:** Windows 11 only. Linux, macOS and other hosts are untested. Antigravity is **unverified**.
- **Security:** renderer network isolation blocks remote loads, but topic modules, Blender scripts and narration runtimes run as trusted local code with your user permissions; nothing is sandboxed. See [SECURITY.md](SECURITY.md).
- **Tests:** the runtime category (real synthesis) runs only where a narration runtime file is configured, and CI runs no runtime or Blender tests. Repository-only pixel and mix regressions skip without the archived experiments; `scripts/tests/run_all.py` reports every skip.

## Licensing

- **This project:** original code and documentation are licensed under the [Apache License 2.0](LICENSE).
  - The licence covers only the project's own work. It grants no rights over third-party tools, models, voices, fonts or assets, or over videos you generate.
  - Releases `v0.1.0-beta` and `v0.2.0-beta` were published before this choice and carry the metadata "Proprietary (project-internal)". The archives are unchanged.
- **Third-party material:** see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), which records verified and unresolved terms.
  - Nothing is bundled.
  - Mithi v2 Flash and Kokoro-82M are Apache-2.0, but the provenance and consent of their voice recordings are unresolved.
  - The Kokoro route uses GPL-3.0 phonemizer and eSpeak NG in your own environment.
  - FFmpeg, Node.js, Python, Chromium and Blender each have their own licence.
- **Fonts:** the system's (Nirmala UI, Segoe UI). Microsoft's terms for use in published video are unresolved.
- **Generated media:** original procedural artwork and audio by default. External assets (CC0 or public-domain photographs, models, HDRIs) are used only with your approval and with recorded provenance.
- **Publication rights** for any video remain your responsibility, and need human review.

## Repository layout

- `skills/video-creator/`: **the Skill package**. This folder is what gets installed: `SKILL.md`, `README.md`, `RELEASE-NOTES.md`, `references/`, `scripts/` and optional self-contained `scripts/tests/`.
- `tools/`: release build (`build_release.py`), repository checks (`check_repository.py`), development install (`install_dev.sh`), duration-rate fitting (`duration_fit.py`).
- `docs/`: requirements, quality strategy, architecture, decisions, research, [releases](docs/releases/release-process.md), security, audits, [representative evidence](docs/media/README.md) and [history](docs/history/experiments-index.md). The development experiments (E01–E42) are archived; the history index explains how to recover them. **Not needed to use the Skill.**
- `AGENTS.md`, `CLAUDE.md`: engineering instructions for coding agents that develop this repository.
- `LICENSE`, `THIRD_PARTY_NOTICES.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`: licensing, security reporting and contribution rules.

## For AI agents

If you are an agent using this Skill:
- Read the installed `SKILL.md` first, and load each `references/` file only when its stage begins.
- Run `doctor.py` before starting. Stop and report a NOT READY result instead of substituting a language, voice, provider or style.
- Never fabricate sources, licences or evaluation results.
- Ask before downloads, publishing or anything irreversible.
- Never present a video as publish-ready.

If you are developing the Skill itself, follow `AGENTS.md`.
