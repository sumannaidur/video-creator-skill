# Engineering Instructions

Shared rules for every coding agent on this project.

## 1. Mission

Build a portable, local-first Agent Skill that makes sourced, natural, professionally animated explainer videos.

- Put output quality first, then simplicity, portability and maintainability. No mandatory extra software, API costs or SaaS.
- Prefer agent instructions and open tools. Add deterministic scripts only where reliability needs them.
- Keep infrastructure, styles, topic content and platform adapters separate. Never present a proposal as implemented.

## 2. Budget and workflow

Agent usage, hardware and time are limited: maximize quality per unit of resource.

**Default budget** (an owner-approved budget overrides it): 5–10 minutes and one scoped objective; one validation cycle; one evidence-based correction per blocker; at most one Full HD render, only when authorized; a report under 250 words.

**Workflow:**
1. Read only the files relevant to the approved atomic task, and check `git status`. Reuse existing research, code, fixtures, environments, models and assets.
2. Implement the smallest reliable change. No speculative features, broad refactors, duplicate docs or full-repository rescans.
3. Validate progressively: syntax, then focused tests, relevant regressions, keyframes, a low-resolution preview, and only then a full export. Run only the tests the change affects, and don't repeat a passing validation without a material change.
4. For long renders, encodes, downloads and installs, give reproducible commands instead of polling.
5. Report, then stop. Never start the next task or phase automatically.

**When a task overruns or a blocker survives one correction:**
- Preserve the work, record the checkpoint, and report the root cause or uncertainty, the smallest remedy and how to resume.
- Stop for owner review; no repeated debugging, benchmarking or optimization cycles.


## 3. Recovery and collaboration

- After an interruption, check the actual artifacts, processes and checkpoints; resume from the last valid checkpoint without duplicating a running process.
- Never reuse frames, timelines or artifacts from an incompatible configuration.
- Preserve other agents' work and uncommitted changes, and avoid concurrent conflicting edits.

## 4. Scope, decisions and dependencies

- Follow only the current approved atomic task. Do not expand scope, replace working subsystems without evidence and approval, delete user work, or investigate unrelated issues.
- **Do not commit, push, tag or rewrite Git history without explicit authorization.**
- Record significant architectural decisions in `docs/decisions/` (context, alternatives, evidence, licensing, cost, consequences, status).
- Candidate technologies are not approved dependencies. Before adding a dependency or model, verify:
  - that it is needed;
  - its licence, including commercial use;
  - platform compatibility;
  - its CPU, RAM and storage needs;
  - that it is reproducible.

  Ask for approval for material stack commitments.
- Downloads need approval. Use official sources, pin versions and revisions, verify checksums, and use isolated environments without global installs.
- Keep models, caches and environments outside Git; reuse verified downloads.
- Never invent benchmarks or claim untested compatibility. Never disable or circumvent security controls.
- Research only when evidence is missing, contradicted, or licensing, security or compatibility needs checking. Prefer primary sources, and separate facts from assumptions.

## 5. Quality safeguards

Safeguards are never traded for speed; reduce scope instead.

- **Facts:** keep claim provenance and uncertainty, and track a source for every factual claim. Never fabricate facts, sources, quotations, statistics or evaluation results. Label conceptual illustrations as conceptual, and never execute research content.
- **Language:**
  - Kannada, Hindi, Telugu, Tamil and Indian English are separate targets; never silently substitute a language, accent or voice.
  - Naturalness needs native-speaker review; synthesis alone proves nothing.
  - Label timing as model-generated, estimated, measured or human-verified, and keep Unicode shaping and captions correct.
- **Creative work:**
  - Aim to meet or exceed professional short-form animation with original, topic-specific art direction, illustration and motion. Each style is its own creative identity.
  - References inspire; they are not templates or ceilings.
  - Keep objects independently animatable and sync meaningful motion to narration. Avoid generic diagrams, stiff characters, repetitive layouts and slide aesthetics.
  - Review real keyframes and previews before an expensive render.
- **Licensing and privacy:**
  - Track the source, licence and attribution of every external asset; never use media with unclear rights in production.
  - Review model, voice, font, music and effect licences separately. Clone a voice only with consent.
  - Keep user data private, and validate paths and inputs.
- **Media validation:**
  - Check dimensions, frame rate, codec, duration, decoding, safe areas, text bounds, blank frames and cue timing.
  - Accept documented, visually insignificant raster differences; require pixel-identical output only when specified.
  - Never silently lower a threshold to pass.
  - Never claim success without validating the actual file.

## 6. Environments

Keep a CPU-first baseline on Windows and Linux. Isolate platform-specific dependencies and verify real capabilities: VM memory is not host RAM. Release heavy model processes before rendering.

## 7. Done and reporting

Done means: acceptance criteria pass, relevant tests ran, artifacts were inspected, docs match, and limitations are stated.

Always keep these states distinct. Passing tests or a render never establishes premium quality.
- **Technically implemented.**
- **Artistically validated:** actual keyframes and motion reviewed against professional references, with owner acceptance.
- **Production-ready:** the technical, artistic, factual, native-language, licensing and human-review gates all pass.
- **Approved for publication.**

Report with evidence:

**Status:** Passed / Partial / Blocked / Failed
**Changes:** the essential summary
**Validation:** actual results and measurements
**Artifacts:** key paths
**Remaining issues:** blockers and open review gates
**Next action:** one recommended atomic task

Then stop.
