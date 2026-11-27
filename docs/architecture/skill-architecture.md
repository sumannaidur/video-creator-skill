# Proposed portable Skill architecture

**Status: direction accepted in ADR-001; no production stack or host compatibility selected.** The smallest portable core is a standards-compliant folder with `SKILL.md`. Add `references/` only for guidance actually used, `scripts/` only when repeatable deterministic work warrants them, and `assets/` only for distributable assets. The P002 experiment is isolated in `experiments/E01/`; it is not the production Skill.

The future production package may have `references/` for workflow, locale, style, and quality guidance; `scripts/` for validation, audio/timestamp/render operations; `assets/` for licensed reusable material. These are conceptual boundaries, not committed directories or technologies. Keep generated projects, user preferences, downloaded models, and large outputs **outside** the immutable Skill package in host-writable locations chosen during setup. Resolve references from the Skill directory; resolve user inputs and output paths independently after validation.

| Layer | Responsibility |
| --- | --- |
| Agent | Interpret evidence, write story, choose metaphors and compositions, respond to feedback |
| Skill instructions | Workflow, decision rules, standards, quality gates, failure policy |
| Deterministic tools | Validate files/config, compute timestamps, process audio, render and probe media |
| Human reviewers | Judge narration, pronunciation, storytelling, visual and motion quality |
| Host adapter (optional) | Installation path, tool invocation, permission prompts, artifact handoff; never duplicate creative core |

Alternatives considered: separate full Skills per host (duplicates logic and drifts); one monolithic `SKILL.md` (wastes context and obscures optional guidance); a single package that assumes universal terminal/media access (unsafe compatibility claim). The proposed core plus thin host installation instructions preserves the common format while capability negotiation handles execution differences. No renderer, TTS, aligner, programming language, or package manager is selected.

## Permanent architecture requirements (added P014.3A)

These supplement `docs/requirements.md`, which already sets the five locales and independent style modules:

- **Independence:** the core workflow and core renderer are independent of language and style. Adding a locale or style adds reference files and, for styles, a rendering backend. It never rewrites the workflow.
- **Locale capabilities:** each locale supplies its own pluggable narration, pronunciation, alignment, typography and caption capabilities.
- **Distinct styles:** a style is a distinct visual system, with its own design DNA, illustration principles, motion grammar, rendering backend and quality criteria. A colour variation of another style is not a style.
- **Style choice:** the style comes from the user's explicit preference, or from the agent (`auto`), which records its reason.
- **No silent fallback:** an unsupported locale, style or capability is reported with a stage code, never substituted.
- **Renderer boundary:** the core renderer owns checkpointing, validation and encoding. Backends own drawing (`skills/video-creator/references/rendering.md`). This allows non-browser and 3D backends.
- **Initial targets only:** Hindi and Paper Explainer are the initial implementation targets, not defaults. Planned styles: Whiteboard, Flat Science, Tech Explainer, Data Storytelling, Documentary, 3D Explainer, X-Ray Explainer, Kinetic Typography.
