# Release notes

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
