# Capabilities and tool status

## Preflight command (read-only)

```
python scripts/doctor.py [--runtime kokoro-onnx=<runtime.json>] [--project <dir>] [--chrome <path>] [--verify-hashes]
                         [--locale <bcp47>] [--style <id>] [--provider <id>] [--voice <id>] [--json <report.json>]
```

The doctor reports the OS and architecture, CPU, RAM and disk, then Python, Node (22+ required), FFmpeg (with the required filters) and FFprobe. It also reports every planned style and installed backend, via each backend's own `probe()`, and every narration provider and locale, via the provider's read-only `--probe` against your runtime configuration.

- **Statuses:** `planned` means registered but not packaged. `installed` means packaged but its runtime is missing or incomplete. `available` means ready on this host. Candidates and experimentally validated routes are labelled separately.
- **Explicit checks:** `--locale`, `--style`, `--provider` and `--voice` are checked explicitly. Failure codes are `unsupported-locale`, `unsupported-style`, `unknown-style`, `unsupported-provider`, `unsupported-voice`, `narration-unavailable` and `missing-dependency`.
- **Exit codes:** `0` ready, `1` not ready, `2` usage.
- **Read-only:** it installs, downloads and changes nothing. The JSON report must be written outside the package.
- **Not a host test:** running it directly does **not** show that an Agent Skill host can discover or invoke the package.

Check these items on the current host before each stage. A tool that exists in the source repository but **not in this package** counts as *not packaged*: say so, and stop before the stage that needs it unless the user explicitly runs the repository experiment.

## Host requirements

| Need | Used by | How to check |
|---|---|---|
| Shell execution, writable project folder outside the Skill | All | Attempt a harmless write in the project folder |
| Node ≥ 22 (built-in WebSocket) | Rendering | `node -v` |
| Python 3 | Timing, joining, mixing | `python --version` |
| FFmpeg and FFprobe on PATH (lavfi, `loudnorm`, `ebur128`, `sidechaincompress`, `alimiter`) | Audio, encode, validation | `ffmpeg -filters` |
| Chromium-family browser (headless, DevTools) | Rendering | locate executable |
| Locale voice route | Narration | see the locale file |
| Disk space: about 1 GB per minute of Full HD frames, plus models | Rendering | free-space query |

Network access is optional. Use it only when the host allows it and the user opts in. Never replace a local stage with a paid or cloud service.

## Tool status (P014.9)

| Capability | Status | Where it lives today |
|---|---|---|
| Narration front end and provider registry (explicit failures, no fallback) | **Packaged** and tested; see [narration](narration.md) | `scripts/narration/narrate.py`, `providers/registry.json` |
| Hindi TTS with same-inference timing and word/phrase mapping (Kokoro ONNX `hf_alpha`, CPU) | **Packaged**; experimentally validated; timings model-predicted and unreviewed; listening review pending. Needs a user-supplied runtime (environment and model outside the package) | `scripts/narration/providers/kokoro_provider.py` |
| Timeline validator, segment joining | **Packaged**; P013 timelines and the combined narration reproduce exactly | `scripts/narration/timeline.py`, `combine_segments.py` |
| Telugu TTS with same-inference word and phrase timing (Mithi v2 Flash `ahana`, CPU in WSL2) | **Packaged**. Synthesis (P015.2A) and native word/phrase timing (P015.2B) technically validated, 25 focused tests. `doctor` reports READY with a note that timing is model-predicted and not human-validated. Listening and word-boundary review pending | `scripts/narration/providers/mithi_provider.py`, `mithi_mapping.py`, `scripts/narration/runtimes.py` |
| Kannada, Tamil, Indian English and Hindi (alternative) on Mithi (`vaidehi`, `malini`, `anirban`, `charvi`) | **Packaged** (P016). Each locale passed its own sample checks: sample-exact timing, full word and phrase coverage, two-segment combine, repeated-word cue and SRT/VTT. Listening, accent and word-boundary review pending | same provider; see the locale files |
| Core renderer (checkpoint, single-writer lock, cues, keyframes, repeatability, encode, media checks) | **Packaged** and tested; see [rendering](rendering.md) | `scripts/render.mjs`, `scripts/lib/chrome.mjs` |
| Paper Explainer backend and shot engine | **Packaged** and regression-identical to P013 | `scripts/styles/paper-explainer/` |
| Paper Explainer kit (paper fibres, sheets, layered shapes, cast shadows, rings, connectors, tile textures, multi-part objects, label treatments; settle/label/ring/pulse/draw motions; plan-timed camera keys) | **Packaged** and tested (7 focused tests, 3 keyframes). Optional, style-specific | `scripts/styles/paper-explainer/kit.js` |
| Tech Explainer backend, engine and kit (studio lighting, isometric helpers, stroke-draw and glow channels, focus/iris/scan transitions, portrait and landscape, full preflight inspection) | **Packaged** (P017.1); validated on a compact fixture (10 tests); no full production or human review | `scripts/styles/tech-explainer/` |
| Whiteboard backend and kit (marker ink drawn stroke by stroke, hand-drawn geometry, marker pen, handwriting reveals, erasing, `erase` transition, portrait/landscape, preflight with empty-caption check) | **Packaged** (P017.2) on the shared shot core; fixture-validated (14 tests incl. Hindi captions); no full production or human review | `scripts/styles/whiteboard/` |
| Flat Science backend and kit (organic flat shading, colour-coded particles and molecules, endless flows, cross-sections, grow/morph/emit/flow motions, `magnify` transition, portrait/landscape, preflight with empty-caption check) | **Packaged** (P017.3) on the shared shot core; fixture-validated (10 tests, Telugu); no full production or human review | `scripts/styles/flat-science/` |
| Data Storytelling backend and kit (zero-based bar charts, line charts, area-true circles, unit charts, timelines, exact native-numeral counters, data-integrity refusals, `bars` transition, portrait/landscape, preflight with empty-caption check) | **Packaged** (P017.4) on the shared shot core; fixture-validated (11 tests, Kannada); no full production or human review | `scripts/styles/data-storytelling/` |
| Kinetic Typography backend and kit (narration-only words, cue-only reveals, measured fit, rise/slam/wipe/drop/emphasis/swap/exit, `shutter` transition, portrait/landscape, preflight with empty-caption check) | **Packaged** (P017.5) on the shared shot core; fixture-validated (17 tests, English and Telugu); no full production or human review | `scripts/styles/kinetic-typography/` |
| X-Ray Explainer backend and kit (X-ray window through opaque shells, glass shells, even-odd section planes, inspection brackets, selective illumination, gears from module × teeth meshing at the true ratio, `sweep` transition, mandatory illustrative disclaimer, portrait/landscape, preflight with empty-caption check) | **Packaged** (P017.6) on the shared shot core; fixture-validated (11 tests, Telugu); no full production or human review | `scripts/styles/x-ray-explainer/` |
| Documentary backend and kit (verified asset manifest with sha256, licence, source, attribution and authenticity; photos and frame-sequence footage; Ken Burns; original maps; archival/cinematic treatments; lower thirds; mandatory provenance labels for non-authentic media; `dip` transition; portrait/landscape; preflight with empty-caption check) | **Packaged** (P017.7) on the shared shot core; fixture-validated (11 tests, Telugu, original procedural assets); no full production or human review | `scripts/styles/documentary/` |
| 3D Explainer backend and kit (own WebGL2 renderer: meshes incl. extruded gears, Blinn-Phong materials, shadow mapping, transparency, orbit cameras keyed to plan moments, exploded views, emissive highlights, `dolly` transition; DOM proxies for cue checks and projected-bounds preflight; CPU SwiftShader pinned) | **Packaged** (P017.8) on the shared shot core; fixture-validated (12 tests, Telugu); 0.64 s/frame and 1.08 GiB peak at 1080x1920 on an i5-1145G7; no full production or human review | `scripts/styles/3d-explainer/` |
| Other style backends | All nine registered styles are implemented; other names fail with `unsupported-style` | — |
| Procedural audio assets, spec-driven mixer (music, effects, ducking, loudness, limiter, stream-copy mux), narration sync check | **Packaged** and tested; procedural music only, with no licensed music library. See [sound design](sound-design.md) | `scripts/audio/make_procedural_assets.py`, `scripts/audio/mix_audio.py` |
| Capability detection and preflight (`doctor`) | **Packaged** and tested (14 focused tests, plus 2 Mithi checks when a Mithi runtime is given). Reports synthesis, word-timing availability and timing review status separately | `scripts/doctor.py`, `scripts/lib/probe-backends.mjs` |
| Persistent preferences and configuration resolver (precedence, validation, capability check via doctor) | **Packaged** and tested (18 focused tests); see [preferences](preferences.md) | `scripts/preferences.py` |
| Project manifest and stage ledger (dependencies, fingerprints, invalidation, approvals) | **Packaged** and tested (19 focused tests); see [projects](projects.md) | `scripts/project.py` |
| Script artifact, script-to-narration stage (validation, segment reuse, duration measurement and revision hints, bounded attempts, ledger integration) | **Packaged** and tested (22 focused tests); see [narration](narration.md) | `scripts/narration/stage.py` |
| Creative-plan schema and validator, speech cue resolver (word, phrase, segment and shot anchors → sample times; ledger integration; stale-narration detection) | **Packaged** and tested (23 focused tests, synthetic Kannada and English timelines); see [creative direction](creative-direction.md). Rendered directly with `render.mjs --plan` (shot bounds and speech cues by ID, hash and ledger checks, checkpoint fingerprint; 16 integration tests) | `scripts/plan.py`, `scripts/lib/resolved-plan.mjs` |
| Visual preflight: full-timeline geometry, visibility and plan-timing checks without capture; backend inspection hooks; result binding; render and ledger gates | **Packaged** and tested (16 focused tests); see [rendering](rendering.md). Paper Explainer implements the inspection hook; other backends report its checks as unsupported | `scripts/preflight.mjs` |
| Captions from the verified timeline (phrase or word grouping), SRT/WebVTT export, burn-in with whole-word wrapping, caption-layout preflight | **Packaged** and tested (30 focused tests on synthetic kn, hi, te, ta and en-IN typography timelines; not evidence of narration in those languages). Native-reader review pending; see [captions](captions.md) | `scripts/captions.py`, `scripts/lib/captions.mjs` |
| Unified QA report, delivery report and human review checklist (ledger, evidence hashes, preflight binding, captions, mix and sync, final MP4 against configuration; review-delivery stage) | **Packaged** and tested (16 focused tests). Never approves human review or publication | `scripts/qa.py` |
| Single-scene regeneration | **Missing** | — |

Package integration (P014.3D) is verified by `scripts/tests/smoke_integration.py`, run from an isolated installed copy on Windows 11. **Discovery and invocation of this package by an Agent Skill host has not been demonstrated yet.** Only Windows 11 with Claude Code and Codex has been exercised as a development host. Other hosts, Linux and macOS are **untested**: say so rather than assuming they work.
