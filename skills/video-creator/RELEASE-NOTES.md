# Release notes

## Unreleased (after v0.2.0-beta)

- **Licence:** original code and documentation are now licensed under the **Apache License 2.0**.
  - `LICENSE` and `THIRD_PARTY_NOTICES.md` are included in the package.
  - The v0.1.0-beta and v0.2.0-beta archives were published earlier with "Proprietary (project-internal)" metadata; they remain unchanged.
- **Documentation:** reflects the public repository. Codex install instructions were added to the package README.

## v0.2.0-beta (release candidate, 2026-11-27): quality and reliability upgrades

A release candidate for evaluation, not publication-ready output. It extends v0.1.0-beta; projects and preferences stay compatible.

### Added or changed (P022–P025)

- **Creative workflow:**
  - Creative plans design the visual hook, transformation and payoff first.
  - A keyframe review gate comes before previews.
  - Motion primitives (`styles/shared/motion.js`).
  - Per-style craft helpers for all nine styles.
- **Pre-render validation** (`lib/prerender.mjs`, every render mode; `--validate-only`): duplicate DOM IDs per shot, canvas size, cue, keyframe and transition timing, shot continuity, and project-relative audio paths.
- **Keyframe composition checks** (`lib/composition.mjs`; topic `composition`): protected regions, label overlap, crops, anchors and contrast. Intentional crops and overlaps are allowed with a written reason; unsupported cases are reported, never passed.
- **Exact short windows** (`render.mjs --window start:end`): frames at absolute narration times in the full-render checkpoint, with audio cut to match.
- **Production preflight checks:** `ink-legibility`, `data-marks`, `mechanism` (per-frame ratio verification).
- **Duration estimator** (`narration/estimate.py`, `duration-rates.json`): per-voice measured speaking rates, with held-out error reported.
- **Optional Blender artwork layers** (`blender_layers.py`; never required) and **rich-artwork guidance**: technique selection by quality, accuracy, rights and cost; provenance; supported formats.
- **QA provenance:** the narration model and timing method are now recovered from each segment's provider record.
- **Asset kinds:** the creative plan accepts `public-domain`.
- **Documentation:** compatibility and timing wording corrected.

### Evidence (development runs, Windows 11)

- **Claude Code native runs:** E30–E32 and E39–E42. Codex native runs: P024.5–P024.10 (E33–E38).
- **E42** (Telugu Tech Explainer, Blender material layers): one Full HD production passed delivery QA technically.
  - 1080×1920 at 30 fps, 870 frames.
  - Audio: −16.0 LUFS, −1.6 dBTP, speech 15.2 LU above the bed, sync 0 ms.
  - 23 caption cues; full decode clean.
- **Windows:** 540×960 windows for E39 (Paper), E40 and E42 (Tech).
- **Keyframes:** development keyframes for the other seven styles. Self-reviews rate most of them mid quality.

### Known limitations and open gates

- **Production evidence:** none of the seven other styles has a production video. No video has passed human artistic, factual, native-language or licensing review, and publication is never automatic.
- **Timing:** narration timing is model-predicted and unreviewed.
- **Duration estimator:** moderate confidence for en-IN only.
- **3D:** WebGL 3D cannot import textures or models. Blender is verified for static layers and stills only.
- **Composition checks:** need declared regions.
- **Fonts:** system fonts, licensing not reviewed. The package licence stays "Proprietary (project-internal)".
- **Platforms:** Linux, macOS and headless `claude -p` end-to-end are untested.

## v0.1.0-beta (2026-11-26): first usable beta

This is the first packaged release of the Video Creator Agent Skill. Its purpose is installation and evaluation. It is not publication-ready output.

### Included

- **Workflow:** a seven-stage pipeline with a resumable project ledger.
  - Stages: research, script, narration, creative plan, visual production, sound, review and delivery.
  - Review modes: guided, checkpoint, autonomous.
  - Human approval and publication are separate gates.
- **Narration:**
  - Mithi v2 Flash (WSL2) for te-IN, kn-IN, ta-IN, en-IN and hi-IN.
  - Kokoro ONNX for hi-IN.
  - Native word and phrase timing, and a duration target with revision hints.
- **Visual styles (nine):** Paper Explainer, Tech Explainer, Whiteboard, Flat Science, Data Storytelling, Kinetic Typography, X-Ray Explainer, Documentary and 3D Explainer (CPU WebGL).
- **Presentations:** framed and full-bleed for every style.
  - Full-bleed adds word-synchronised captions with active-word emphasis and an optional hook headline.
  - Each style has its own typography.
  - The mode can be chosen as a preference (`presentation`).
- **Art capabilities (Paper and Tech kits):**
  - lighting, materials, layered environments and baked procedural textures;
  - construction helpers: masonry, facades, foliage, water and an articulated figure;
  - camera travel, exploded views, particles.
- **Production tools:**
  - plan-driven speech cues;
  - full-cadence visual preflight (safe area, text clipping, caption layout, cue timing);
  - checkpointed rendering;
  - SRT/VTT captions;
  - procedural music and effects with loudness and sync checks;
  - a unified QA report and a human-review checklist.

### Packaging

- **Relative paths only.** Runtimes, models, preferences and projects all live outside the package.
- **Excluded from the archive:**
  - models, caches and credentials;
  - generated experiments;
  - test result files;
  - the repository-only regression test `scripts/tests/test-package.mjs`.
- **Version:** the `version` field in `SKILL.md` metadata.

### Known limitations and open gates

See "Known limitations" and "Outstanding acceptance gates" in `README.md`.
