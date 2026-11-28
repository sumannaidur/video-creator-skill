# Video Creator: Agent Skill, v0.2.1-beta

Video Creator is an Agent Skill that turns a topic into a **sourced, narrated, animated explainer video**. Everything runs with free, local, CPU-first tools; no paid service or API is required.

The agent makes the editorial and creative decisions: research, script, art direction, shots and motion. Packaged deterministic tools synthesize speech, time it, render, mix and measure. Humans own the quality gates.

> **Permanent quality objective:** meet or exceed professional animation references through original, topic-specific artistic direction. The v0.2.0 beta does **not** claim that level yet; see [Known limitations](#known-limitations).

## Contents

- `SKILL.md`: the workflow the agent follows.
- `references/`: stage, style and locale guides, loaded on demand.
- `scripts/`: packaged tools.
  - Preflight `doctor.py`, `preferences.py` and the `project.py` ledger.
  - Narration stage (Kokoro ONNX and Mithi providers).
  - `plan.py`, `captions.py`.
  - Renderer `render.mjs` (with pre-render validation, keyframe composition checks and exact short `--window` renders), visual `preflight.mjs` and nine style backends.
  - Narration duration estimator `narration/estimate.py`.
  - Optional Blender artwork layers `blender_layers.py` (Blender is never required).
  - Audio mixer and procedural audio.
  - Unified `qa.py`.
- `scripts/tests/`: optional, self-contained validation suites. Each copies the package to a temporary folder first.

## Capability matrix (v0.2.1-beta)

| Area | Supported | Validation level |
|---|---|---|
| **Visual styles** (9) | Paper Explainer | Production videos E11 and E13 (framed) and E17 (full-bleed). Human artistic review is pending |
| | Tech Explainer | One development Full HD production (E42, Telugu, Blender material layers): delivery QA passed technically. Development keyframes and 540×960 windows (E26, E35, E40). Human review pending |
| | Whiteboard, Flat Science, Data Storytelling, Kinetic Typography, X-Ray Explainer, Documentary, 3D Explainer | Fixtures plus development keyframes on unseen topics (P023, P024); one 540×960 window for Paper (E39). No production video yet |
| **Presentation modes** | `framed`, `full-bleed` (word-synchronised captions with active-word emphasis, optional hook) for all nine styles | Full-bleed: fixture-validated per style; one production video (E17, Paper) |
| **Languages** (5) | te-IN, kn-IN, ta-IN, en-IN, hi-IN | Synthesis and native word/phrase timing technically validated. **Native-speaker listening, caption and wording review pending for every language** |
| **Narration** | `mithi` (Mithi v2 Flash in WSL2): te `ahana`, kn `vaidehi`, ta `malini`, en `anirban`, hi `charvi` | Technically validated. Timings are model-predicted, not acoustically verified |
| | `kokoro-onnx`: hi-IN `hf_alpha` | Experimentally validated |
| **Captions** | Burned-in captions plus SRT/VTT, phrase or word-group cues, sample-exact timing | Technically validated |
| **Sound** | Original procedural music and effects (FFmpeg lavfi), ducking, loudness and sync checks | Technically validated |
| **Output** | 1080×1920 or 1920×1080 at 24/25/30/60 fps, H.264 and AAC MP4. Checkpointed, resumable rendering; exact short windows sharing the full-render checkpoint | Technically validated |
| **Checks before capture** | Pre-render validation (duplicate IDs, canvas, cue/keyframe/transition timing, project paths); keyframe composition checks (protected regions, label overlap, crops, contrast; unsupported cases reported) | Technically validated on fixtures and E39–E42 |
| **Duration estimate** | Per-voice measured speaking rates before synthesis | en-IN moderate confidence (held-out script error −4.3 % to +5.9 %); Indic voices low confidence; Kokoro unmeasured |
| **Rich artwork (optional)** | Blender static layers and verified CC0 or public-domain assets, with provenance (`references/visual-production.md`) | Blender 5.2.2 verified on Windows 11 (E26, E41, E42). WebGL 3D has no texture or model import |

### Host compatibility

| Host | Status |
|---|---|
| Claude Code (Windows 11, desktop app, Code tab) | **Verified:** v0.1.0 personal-skill install and invocation (P019, 2.1.330). 0.2.0 content used natively (E30–E32, E39–E42), including the complete E42 Full HD production |
| Claude Code headless (`claude -p`) | Discovery verified. End-to-end invocation **not yet verified** (the CLI was not signed in) |
| Codex (Windows 11) | **Discovery verified:** the v0.2.0 release-candidate content (development install `video-creator-dev` 0.2.0-beta-dev) was natively discovered and enabled from `~/.agents/skills`. Development keyframe runs (P024.5–P024.10) were invoked natively. No complete Codex production has been run yet |
| Antigravity | **Unverified.** Not tested; no compatibility claimed |
| ChatGPT, other Agent Skill hosts | **Untested.** No compatibility claimed |
| Linux, macOS | **Untested** |

## Requirements (all free, none bundled)

- Agent Skill host with shell access (verified: Claude Code).
- Node.js 22+, Python 3.10+, FFmpeg and FFprobe on PATH.
- A local Chromium browser: Chrome, Edge or Chromium, found automatically or given with `--chrome`.
- Optional: Blender (verified 5.2.2) for pre-rendered artwork layers. `doctor.py` reports it as not required; without it the styles use their own renderers.
- At least one narration runtime, configured **outside** the package:
  - **Mithi v2 Flash** (te, kn, ta, en, hi): a WSL2 Linux Python environment plus the pinned model folder, which is checked against `scripts/narration/providers/mithi-v2-flash.manifest.json`.
  - **Kokoro ONNX** (hi-IN): a Python environment with the ONNX model and voices files.

The models are **not** included. Obtain them under their own licences and keep them outside the Skill folder.

## Installation (personal skill, Claude Code)

PowerShell. Extract the archive and copy the `video-creator` folder into your personal skills folder:

```powershell
Expand-Archive video-creator-v0.2.1-beta.zip -DestinationPath $env:TEMP\vc-release -Force
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse "$env:TEMP\vc-release\video-creator" "$HOME\.claude\skills\video-creator"
```

**Codex:** copy the same folder to `$HOME\.agents\skills\video-creator` instead, start a new Codex session, and ask in plain language or mention `$video-creator`. In the commands below, replace `.claude\skills` with `.agents\skills`.

Restart Claude Code, or start a new session. `video-creator` then appears among the available skills. To install it for one project only, copy the folder to `<project>\.claude\skills\video-creator` instead (not exercised in this release).

## Runtime setup (once)

Create one small runtime file per provider **outside** the Skill folder. The tools look for exactly one conventional location, so you don't need to pass paths on every run:

- Windows: `%APPDATA%\video-creator\runtimes\mithi.json` and `%APPDATA%\video-creator\runtimes\kokoro-onnx.json`.
- Elsewhere: `$XDG_CONFIG_HOME/video-creator/runtimes/` or `~/.config/video-creator/runtimes/`.
- Or any folder named by the `VC_RUNTIMES` environment variable.

An explicit `--runtime <provider>=<file>` always overrides. The tools refuse runtime paths inside the package.

```json
// %APPDATA%\video-creator\runtimes\mithi.json
{"kind": "wsl", "distro": "Ubuntu-24.04", "python": "/home/<you>/<mithi-env>/bin/python", "model": "D:/<models>/mithi"}
```

```json
// %APPDATA%\video-creator\runtimes\kokoro-onnx.json  (environment: pip install --require-hashes -r scripts\narration\providers\kokoro-requirements.txt)
{"python": "C:/<kokoro-env>/Scripts/python.exe", "model": "C:/<models>/kokoro-v1.0.onnx", "voices": "C:/<models>/voices-v1.0.bin"}
```

Check the installation with the packaged preflight. It is read-only and downloads nothing:

```powershell
python "$HOME\.claude\skills\video-creator\scripts\doctor.py"
```

The report lists every style and language route as available, installed, planned or missing, each with a remedy.

## First-use preferences

On first use the agent asks once and saves your choices to `%APPDATA%\video-creator\preferences.json`, which is outside the package. You can also set them yourself:

```powershell
python "$HOME\.claude\skills\video-creator\scripts\preferences.py" init locale=te-IN style=auto presentation=full-bleed review_mode=guided
```

| Key | Values |
|---|---|
| `locale` | `te-IN`, `kn-IN`, `ta-IN`, `en-IN`, `hi-IN` |
| `style` | `auto` or one of the nine style IDs |
| `presentation` | `auto` (the topic decides), `framed`, `full-bleed` |
| `narration.provider` / `narration.voice` | `auto` or an explicit route |
| `review_mode` | `guided`, `checkpoint`, `autonomous` |

Also: duration, orientation, resolution, fps, captions, music and effects. See `references/preferences.md`.

A value in the request always overrides the saved preference for that one run, and is never saved.

## Invocation examples

Ask in plain language. The Skill runs the stages itself.

- "Make a 60-second Telugu explainer about how the human heart pumps blood, full-bleed, autonomous."
- "Create a short Kannada video explaining monsoon rainfall in the Data Storytelling style."
- "Resume my video project in D:\videos\vc-20261126-xxxx."
- "Plan, but don't render, a Hindi whiteboard explainer on photosynthesis."

Each project lives outside the Skill folder and keeps a ledger (`project.json`), so interrupted work resumes from verified stages.

## Update and uninstall

Your preferences (`%APPDATA%\video-creator\`), runtime files and projects are outside the Skill folder, so these commands leave them untouched.

**Update** to a newer release:

```powershell
Remove-Item -Recurse -Force "$HOME\.claude\skills\video-creator"
Expand-Archive video-creator-<new-version>.zip -DestinationPath $env:TEMP\vc-release -Force
Copy-Item -Recurse "$env:TEMP\vc-release\video-creator" "$HOME\.claude\skills\video-creator"
```

**Uninstall:**

```powershell
Remove-Item -Recurse -Force "$HOME\.claude\skills\video-creator"
```

Optional: also remove the saved preferences with `Remove-Item -Recurse "$env:APPDATA\video-creator"`.

## Troubleshooting

| Symptom | Remedy |
|---|---|
| The Skill doesn't appear | Check the path is `...\.claude\skills\video-creator\SKILL.md` (one folder level), then start a new session |
| `doctor.py` reports NOT READY or a route `missing` | Follow the remedy it prints: missing tool on PATH, runtime file, model hash or WSL distribution |
| `unsupported-style`, `presentation-unsupported`, `presentation-mismatch` | Choose a listed style or mode, or align the topic's presentation with your preference. Nothing is ever substituted silently |
| `stale-narration`, `stale-captions`, `preflight-stale` | An input changed after verification. Re-run the stage the error names; verified stages are reused |
| Narration duration off target | The stage reports revision hints. The agent revises the script; speech speed is never changed |
| Headless `claude -p` says "Not logged in" | Run `claude /login` for that CLI |
| `[validation]` or `Composition at …` before rendering | Fix the named object, time or region in the topic; intentional crops and overlaps need an `allow` entry with a reason |
| `[blender-unavailable]` | Blender is optional; install it or keep the style's own renderer |
| Slow 3D Explainer renders | It runs WebGL on the CPU, about 0.6 s per 1080×1920 frame. Use previews (`--scale 0.5`) before Full HD |

## Known limitations

- **Artistic quality:** the reference benchmark is a professional animation library. Our own audit (E17) still finds the artwork below it in illustration finish, compositional variety and character animation. No video is premium-certified.
- **Validation depth:** Paper and Tech have production evidence (Tech: one development production, E42); the other seven styles have development keyframes only, with no production video. No video has passed human review.
- **Recurring artistic weaknesses (E30–E42 self-reviews):** subject-to-frame fit, tags without leaders, overlay legibility in perspective views. Most keyframes rate mid quality.
- **Checks:** composition checks need declared regions; anchors without leaders, non-solid label contrast and 3D occlusion are reported unsupported.
- **Sources:** recent development topics rely on single secondary sources.
- **Timing:** narration timings are model-predicted, not acoustically measured.
- **Safe areas:** the full-bleed text-safe insets are assumptions, not measured platform UI zones.
- **Fonts:** fonts are the system's (Nirmala UI, Segoe UI); their redistribution licence has not been reviewed, and none are bundled.
- **Platform:** Windows 11 only. Mithi requires WSL2. Linux and macOS untested.

## Outstanding acceptance gates (owner and human reviewers)

None of these are automated, and none are closed by this release:

1. **Artistic acceptance** of each style and of every produced video against the professional reference standard.
2. **Factual review:** claims are sourced, but subject-matter review is still required (for example, the anatomy in E17).
3. **Native-language review** for te, kn, ta, en-IN and hi: narration naturalness, pronunciation, wording, captions and word boundaries.
4. **Licensing review:** voice-recording provenance and consent, font terms for published video, and publication rights. The package is licensed under Apache-2.0 (`LICENSE`); third-party terms are in `THIRD_PARTY_NOTICES.md`.
5. **Publication approval:** recorded per project with `project.py approve`. Technical QA never implies it.

See `RELEASE-NOTES.md` for the changes in this release.
