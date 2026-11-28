# V3 architecture

Status: approved direction, implementation pending. Extend the [existing architecture](../architecture/skill-architecture.md) and [cinematic planning](../decisions/ADR-002-cinematic-planning.md); do not replace the seven-stage ledger. See [requirements](requirements.md).

## Creative workflow

Interpret intent and preferences; research actual subject structure, function and relationships; co-develop spoken and visual story; design artistic identity and world layout; retrieve relevant assets and lessons; create or adapt source; direct each shot, action, light, camera, sound and transitions; inspect keyframes and animatic; render within resources; review and correct; preserve source, deliver, learn and clean up. Iterate where justified. These are responsibilities, not rigid templates or independent agents.

Construct recognizable silhouettes, functional parts, materials, perspective, contact shadows and appropriate macro/medium/micro detail. Prioritize visible focal detail rather than clutter. Plan alternate views as actual alternate artwork or existing geometry; zoom is not a reverse angle. Track spatial relationships, object state, character identity, light, action and continuity. Reuse existing SVG/JS, Chromium, WebGL, Python, local narration and procedural audio/FFmpeg. Nine styles remain distinct capabilities; mixed-style timeline is a future implementation. Documentary illustrations must be identified as reconstructions, not archival evidence.

## Persistent source and learning

Shared local data outside both immutable host installs: indexed assets (source modules, immutable versions, parameters, capabilities, supported views, anchors, dependencies, rights, review provenance); contextual lessons (observation, cause or hypothesis, correction, applicability, evidence, status); brand/character profiles; project-specific source, script, timing, plan, pinned references, validation and output identity. Use compact JSON/Markdown/JS, no separate database service. Retrieve only relevant records; respect explicit preferences and scope. Safe coordinated writes and atomic updates; prevent stale writers, path traversal and unsafe code execution. Generated source remains executable code, not trusted merely because it was indexed. No implicit upload.

Reuse exact match, customize similar match, create missing assets. Never overwrite pinned versions; promote only validated and reviewed source. Distinguish owner review, automated evidence, agent assessments and hypotheses. Record failures even when assets cannot be promoted. Core changes, stack commitments and safety policies remain owner-controlled. Learning is persistent knowledge, not model retraining.

## Production and retention

Independent artistic ambition, hardware budget and agent effort; adapt based on actual available resources, not installed RAM alone. Prefer sequential heavy stages, bounded shot work, selective caching, streaming where justified, release memory between stages. Preserve creative quality by simplifying computation rather than silently lowering critical standards. No new software required.

Preserve final MP4 and compact source/recipe/QA; requested publishing deliverables are exceptions. Retain intermediate media only during active/recoverable work or configured retention. Before scoped cleanup verify output decode, required checks, source/version preservation and ownership; never delete original inputs, shared runtimes, or unrelated projects. Crash-safe cleanup and resume required. Editing invalidates dependent shots, audio and transitions; reuse final encoded segments only where safe. Exact regeneration is not promised when runtimes or authorized external inputs differ.

## Quality and security

Technical, factual, artistic, language/audio, continuity, rights, resource and preservation gates remain separate. Unsupported inspection is unverified. Review candidates are not accepted or approved for publication. Preserve native-speaker and owner review; no false claims from successful rendering. Follow AGENTS.md and existing security boundaries; no new dependencies or security bypass.

See [acceptance](acceptance.md) and [roadmap](roadmap.md).
