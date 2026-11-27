# ADR-001 — Portable Skill core with host capability checks

**Status:** accepted for continued development by owner on 2026-11-25. **Date:** 2026-11-24.

## Context and evidence

The [Agent Skills format](https://agentskills.io/specification) defines a shared `SKILL.md` package. [OpenAI](https://learn.chatgpt.com/docs/build-skills), [Anthropic](https://code.claude.com/docs/en/skills), and [Google](https://codelabs.developers.google.com/getting-started-with-antigravity-skills) document different discovery/install paths and execution environments. No platform-neutral media runtime is defined. E01 runtime testing remains limited.

## Accepted direction

Author one portable core Skill with shared production instructions, independent language and visual style modules, and concise references. Add deterministic local tools only for reproducible stages after their tasks are approved. Keep installation adapters and capability checks host-specific; store user preferences and generated artifacts outside the package. Fail openly if a host cannot execute the requested local stage. Do not choose a renderer, speech model, aligner, or programming language in this ADR.

## Alternatives

Separate complete Skills per host duplicate logic and risk drift. A single monolithic instruction file increases context cost. Assuming every host can run local tools would produce false success claims. The proposed approach has more capability-check work but preserves one creative/workflow core.

## License, resources, consequences

No third-party runtime, model, or asset is adopted by this decision; license and resource cost remain to be evaluated per dependency. The common package may be installed at different host paths. Some hosts may support planning or validation but not local rendering; distribution claims must state that boundary. **Architecture acceptance is separate from platform compatibility and E01 runtime validation.** The latter remain evidence gates and are not implied by this ADR.
