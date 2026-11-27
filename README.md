# Video Creator Skill

**Status: v0.1.0-beta — a functional beta.** It is **not** artistically validated and **not** production-ready. Every produced video still needs human artistic, factual, native-language, licensing and publication review.

Video Creator is a portable Agent Skill that turns a topic into a **sourced, narrated, animated explainer video**. It uses only free, local, CPU-first tools; no paid service or API is required.

The agent makes every editorial and creative decision: research, script, art direction, shots and motion. Packaged deterministic tools synthesize and time the speech, render, mix and measure. Humans own the quality gates.

**Permanent creative quality objective:** meet or exceed professional animation references through original, topic-specific artistic direction. This beta has not reached that bar. Our own audit against the reference standard (E17) still finds gaps in illustration finish, compositional variety and character animation.

## What the beta does

| Area | Supported |
|---|---|
| Visual styles | Nine:<br>• **Paper Explainer**: production-tested<br>• **Tech Explainer, Whiteboard, Flat Science, Data Storytelling, Kinetic Typography, X-Ray Explainer, Documentary, 3D Explainer**: fixture-validated only |
| Presentation | `framed` and `full-bleed` for all nine styles. Full-bleed adds word-synchronised captions with active-word emphasis and an optional hook |
| Languages | Telugu, Kannada, Tamil, Indian English and Hindi. Technically validated; **native-speaker review pending for all five** |
| Narration | Mithi v2 Flash in WSL2 (all five languages); Kokoro ONNX (Hindi). Native word/phrase timing |
| Production | Resumable project ledger, plan-driven speech cues, full-cadence visual preflight, checkpointed rendering, SRT/VTT captions, procedural music and effects with loudness and sync checks, unified QA report |
| Output | H.264/AAC MP4: 1080×1920 or 1920×1080 at 24/25/30/60 fps |

### Host compatibility

- **Verified:** Claude Code 2.1.330 on Windows 11 (P019): personal-skill install, native discovery and invocation, tools running from the installed location.
- **Partial:** headless `claude -p` discovers the skill, but end-to-end invocation is not yet verified.
- **Not validated:** Codex. **Untested:** other hosts, Linux and macOS.

## Install

1. Download `video-creator-v0.1.0-beta.zip` and its `.sha256` file from the [GitHub release](https://github.com/sumannaidur/video-creator-skill/releases/tag/v0.1.0-beta).
2. Verify the checksum, then copy the `video-creator` folder to `%USERPROFILE%\.claude\skills\`.
3. Configure a narration runtime outside the Skill folder.
4. Run the packaged `doctor.py`.

The [package README](skills/video-creator/README.md) gives the exact install, runtime-setup, first-use preference, invocation, update, uninstall and troubleshooting steps. Changes are listed in the [release notes](skills/video-creator/RELEASE-NOTES.md).

The archive bundles no models, fonts or credentials. Runtimes, preferences and projects always stay outside the Skill folder.

## Known limitations and open gates

- Eight of the nine styles, and the full-bleed mode for seven of them, are validated on fixtures only.
- Narration timings are model-predicted, not acoustically measured.
- The full-bleed text-safe insets are assumptions, not measured platform UI zones.
- Fonts are system fonts with an unreviewed redistribution licence.
- The package licence is "Proprietary (project-internal)" pending licensing review. **This repository stays private until that review.**
- Still open, for the owner and human reviewers: artistic acceptance, factual (subject-matter) review, native-language review, licensing review, and publication approval.

## Repository

- `skills/video-creator/`: the Skill package (`SKILL.md`, `references/`, `scripts/`, self-contained `scripts/tests/`).
- `docs/`:
  - [requirements](docs/requirements.md), [quality strategy](docs/quality-strategy.md) and [architecture](docs/architecture/);
  - [decisions](docs/decisions/), [research](docs/research/) and experiment write-ups (`docs/experiments/`), including [P019 native Skill validation](docs/experiments/P019-native-skill-validation.md).
- `experiments/`: lightweight development evidence (notes, scripts, plans, captions, QA reports, contact sheets) for E01–E17. Generated media, frames and machine-specific runtime files are excluded (see `.gitignore`).
- [Engineering instructions](AGENTS.md), shared by the coding agents.
