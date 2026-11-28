# V3 product requirements

Status: owner-approved design, not implemented. Baseline: b8a618ec952699d3eec08a4f22424270966d5b66. This is the V3 target; [original requirements](../requirements.md) remain historical baseline. Existing stable release is unchanged.

## Requirements register

| ID | Requirement |
| --- | --- |
| FR-01 | Autonomous by default; ask only for essential missing information. |
| FR-02 | Select single or mixed styles according to intent; respect explicit overrides. |
| FR-03 | Support explainers, stories, documentary, advertising and other suitable content. |
| FR-04 | Use characters only when meaningful. |
| FR-05 | Retain reviewed reusable assets and versioned improvements. |
| FR-06 | Target 8 GB installed RAM and no dedicated GPU; validate on real hardware. |
| FR-07 | Configurable autonomous and guided review modes. |
| FR-08 | Adapt speed and complexity to available resources and preferences. |
| FR-09 | Optional platform adaptations. |
| FR-10 | Choose sound complexity according to content. |
| FR-11 | Configurable retention, minimal by default. |
| FR-12 | Optional publishing package. |
| FR-13 | Learn from every success, failure and user review. |
| FR-14 | Automatic knowledge learning; core modifications require owner approval. |
| FR-15 | Saved brand identities plus topic-specific art direction. |
| FR-16 | Shared asset library plus project-specific editable source. |
| FR-17 | Reuse recurring character identities when useful or requested. |
| FR-18 | Multiple available voices and dialogue. |
| FR-19 | Choose achievable creative approaches; disclose limitations. |
| FR-20 | Bounded correction budget; stop on unresolved critical issues. |
| FR-21 | Regenerate affected shots only where feasible. |
| FR-22 | Adapt world composition, timing and narration for platforms. |
| FR-23 | Shared local knowledge across Claude Code and Codex. |
| FR-24 | Validate unseen topics, cross-project reuse, artistic quality and low-resource hardware. |
| FR-25 | Develop visual world and artistic identity before detailed artwork. |
| FR-26 | Adaptive detail according to framing, importance and resources. |
| FR-27 | Choose narrative structure according to content and audience. |
| FR-28 | Natural dialogue, reactions, gestures and stylized mouth animation. |
| FR-29 | Parameter customization and original source-code extensions. |
| FR-30 | Contextual lessons with evidence, causes and reusable corrections. |
| FR-31 | Maintain requested brand, character, world and narrative continuity. |
| FR-32 | Separate artistic ambition, hardware budget and agent effort. |
| FR-33 | Short- and long-form production with adaptive sequences. |
| FR-34 | Reuse craftsmanship while preserving originality. |
| FR-35 | Online factual research when needed; original artwork and rendering local. |
| FR-36 | All applicable critical gates pass before accepted delivery. |
| FR-37 | Native narration, multilingual dialogue and optional translated captions. |
| FR-38 | Narration, dialogue, music-led or silent storytelling as appropriate. |
| FR-39 | Adaptive time, resource and agent-effort budgets. |
| FR-40 | Missing required artistic or language validation means review candidate, not publication-ready. |
| FR-41 | Local original artwork by default; explicitly authorized user media permitted. |
| FR-42 | Retain resumable checkpoints until completion or safe abandonment. |

## Constraints

Default export 1080p (1920x1080, 1080x1920 or 1080x1080 as appropriate), 30 fps, H.264 MP4 with AAC if audio applies. Preserve five locale targets kn-IN, hi-IN, te-IN, ta-IN, en-IN; no silent substitutions. No new mandatory dependencies, paid generation APIs, Blender, OpenVINO, external asset packs or dedicated GPU. Existing local runtimes remain; host subscription/credits are not necessarily free. No automatic publication. Original inputs and shared resources must not be deleted.

Nonfunctional requirements: CPU-first, available-memory and disk preflight, bounded caches and stages, recoverable failure, measured resource usage, portable source, compact indexed retrieval, no unnecessary duplicate source, no permanent intermediate media by default. Keep current safeguards and rights reviews. Unsupported voices, styles, media inspection and exact reproducibility must be disclosed.

See [architecture](architecture.md), [roadmap](roadmap.md), [acceptance](acceptance.md) and [ADR-003](../decisions/ADR-003-v3-direction.md).
