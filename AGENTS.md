# Engineering Instructions

## 1. Mission and principles

Build a portable, local-first Agent Skill for sourced, natural, professionally animated videos.

- Prioritize output quality, simplicity, portability and maintainability.
- Require zero mandatory additional software or API costs.
- Prefer agent instructions and existing open tools over unnecessary custom infrastructure.
- Add deterministic scripts only where reliability, reproducibility or automation requires them.
- Separate reusable infrastructure, visual styles, topic-specific content and platform adapters.
- Do not present proposed capabilities as implemented.
- Do not build a SaaS application.

## 2. Agent execution budget

The owner has limited Codex and Claude Code usage, hardware resources and time.

Treat agent tokens, execution time and computational resources as limited project resources. Maximize meaningful quality improvement per unit of resource consumed.

### Default task budget

- Target active agent execution time: 5–10 minutes.
- One narrowly scoped implementation objective.
- One focused validation cycle.
- One evidence-supported corrective attempt per blocker.
- One Full HD render at most, only when explicitly required.
- Completion report under 250 words unless essential evidence requires more.

These are execution targets, not guaranteed runtimes.

### Token and resource efficiency

- Read only files directly relevant to the approved task.
- Reuse existing research, decisions, implementations, fixtures and artifacts.
- Avoid repeated repository scans, excessive investigation and routine progress narration.
- Prefer the smallest reliable implementation over additional infrastructure.
- Inspect representative keyframes before rendering motion previews.
- Run only tests relevant to the changed behavior.
- Do not repeat successful validation without a material change.
- Use reproducible terminal commands for lengthy rendering, encoding, downloads and other routine computational operations.
- Avoid continuously polling long-running processes.
- Do not repeat project history or existing documentation in completion reports.

### Budget enforcement and recovery

If a task exceeds its intended budget, or an unresolved blocker remains after one justified corrective attempt:

1. Preserve completed implementation.
2. Record the current checkpoint and verified artifacts.
3. Report remaining work, blockers and uncertainties.
4. Provide manual terminal commands where practical.
5. Provide a concise resume instruction.
6. Stop for owner review.

Resume from the last valid checkpoint rather than restarting completed work.

Do not silently extend tasks, begin another phase or enter repeated debugging and optimization cycles.

### Quality safeguards

Resource efficiency must not compromise security, factual accuracy, licensing, reliability or approved artistic quality requirements.

Prefer reducing task scope over lowering quality standards.

Explicit owner-approved task budgets override these defaults.

## 3. Task workflow

1. Read this file and only directly relevant documentation.
2. Inspect Git status and relevant existing files.
3. Identify the current approved atomic task.
4. Check existing implementations and acceptance criteria.
5. Implement the smallest reliable solution.
6. Run focused validation.
7. Inspect relevant output artifacts.
8. Report results and stop.

Do not repeat the full project assessment for every task.

Do not automatically begin another atomic task.

## 4. Resource-efficient implementation

- Reuse working code, environments, models, assets and research.
- Avoid repeatedly scanning the entire repository.
- Avoid speculative features and premature abstractions.
- Avoid broad refactoring when a localized change is sufficient.
- Prefer existing utilities and dependencies.
- Do not create duplicate documentation.
- Prioritize working artifacts over extensive reports.
- Do not optimize working implementations without a measurable requirement.
- Do not investigate unrelated issues discovered during execution.
- Prefer lightweight previews and focused tests before expensive operations.

Resource optimization must not compromise security, licensing, correctness or essential product quality.

## 5. Testing and validation strategy

Use progressive validation:

1. Syntax and input validation.
2. Focused unit tests.
3. Relevant regression tests.
4. Representative keyframes.
5. Lightweight media preview.
6. Full-resolution export only when authorized or required.

Do not repeatedly run expensive tests when the relevant acceptance criteria have already passed.

For visual and media validation:

- Prefer keyframes and low-resolution previews during development.
- Verify dimensions, frame rate, codec, duration and decoding.
- Check safe areas, text bounds, missing assets and unintended blank frames.
- Check timing, cue behavior and media integrity.
- Accept documented, visually insignificant raster differences where functional and quality requirements pass.
- Require pixel-identical output only when explicitly required.
- Do not repeatedly render Full HD videos to investigate insignificant pixel differences.
- Preserve deterministic scene geometry and timing.
- Do not silently lower established validation thresholds to pass a test.

If a regression is detected, perform one focused investigation and one justified corrective attempt. Report unresolved differences rather than entering an unlimited debugging cycle.

## 6. Research efficiency

Use existing project research and owner-provided findings whenever sufficient.

Perform additional research only when:

- Existing evidence is materially incomplete or outdated.
- A technical decision requires verification.
- Licensing, security or compatibility needs clarification.
- New evidence contradicts an established assumption.

Prefer official documentation, repositories, model cards and primary sources.

Do not repeat completed technology comparisons.

Record significant findings in existing relevant documents.

Separate verified facts from assumptions.

## 7. Interrupted-task recovery

When execution is interrupted by usage limits, network failure, system restart or another external condition:

1. Inspect the actual current state.
2. Identify completed and remaining work.
3. Verify existing artifacts and active processes.
4. Resume from the last valid checkpoint.
5. Reuse verified downloads and installations.
6. Avoid duplicating active processes.

Do not restart a task unless existing progress is demonstrably unusable.

Preserve recoverable intermediate artifacts.

Validate checkpoint compatibility and integrity before reuse.

Do not reuse stale frames, timelines or artifacts from incompatible configurations.

## 8. Decisions and dependencies

Document significant architectural decisions under `docs/decisions/`.

Include context, alternatives, evidence, licensing, resource costs, consequences and decision status.

Do not create an ADR for routine implementation details.

Candidate technologies are not approved production dependencies.

Before introducing a dependency or model, verify:

- Actual necessity.
- License and commercial-use conditions.
- Platform compatibility.
- CPU, RAM and storage requirements.
- Reliability and reproducibility.

Request approval for material stack commitments or work outside the authorized scope.

Do not repeatedly request approval for actions already explicitly authorized.

Never invent benchmark results or claim untested compatibility.

## 9. Downloads and environment management

- Preserve existing working environments.
- Use isolated dependency environments.
- Avoid unnecessary global installations.
- Pin relevant dependency versions and model revisions.
- Verify available artifact checksums.
- Reuse existing verified model files.
- Keep large models, caches and environments outside Git.
- Prefer official package indexes and trusted sources.
- Use bounded network retries.
- Preserve resumable download progress.
- Avoid downloading completed assets again.

For lengthy downloads, installations, rendering or encoding, prefer reproducible terminal commands the owner can execute independently.

Do not consume excessive coding-agent usage continuously monitoring routine computational operations.

## 10. Troubleshooting strategy

Identify the likely root cause using existing evidence.

Distinguish:

- Model failures.
- Dependency failures.
- Network failures.
- Hardware limitations.
- Host security policy restrictions.
- Unsupported environments.
- Implementation defects.

Perform one evidence-supported corrective attempt per blocker by default.

If the blocker persists:

- Preserve the evidence.
- Report the root cause or remaining uncertainty.
- Provide the smallest concrete remediation.
- Stop for owner review.

Do not enter repeated debugging, benchmarking or optimization cycles without approval.

Continue independent approved tasks when appropriate.

Never disable or circumvent security controls.

## 11. Product quality safeguards

### Research and factual accuracy

- Preserve claim provenance and uncertainty.
- Do not fabricate facts, research, quotations, statistics, sources or evaluation results.
- Distinguish factual illustrations from conceptual or illustrative visualizations.
- Track sources for factual claims.
- Do not execute untrusted research content.

### Narration and language

- Treat Kannada, Hindi, Telugu, Tamil and Indian English as separate evaluation targets.
- Do not silently substitute another language, accent or voice.
- Require native-speaker evaluation for human-like narration quality.
- Successful speech synthesis alone does not establish naturalness.
- Distinguish model-generated timing, estimated timing, measured audio boundaries and human-verified alignment.
- Preserve correct Unicode text shaping and readable captions.

### Visual storytelling and creative quality

- Aim to meet or exceed professional short-form animation quality.
- Treat Viral Styles Launchpad and other professional references as inspiration, not templates or quality ceilings.
- Require original, topic-specific artistic direction, illustration, composition and motion design.
- Treat visual styles as independent creative identities, not fixed templates or colour variations.
- Select the strongest feasible artwork techniques within approved hardware, licensing and cost constraints.
- Do not restrict artwork to basic SVG geometry when better techniques are available.
- Use sophisticated illustrations, convincing materials, intentional lighting, environmental depth and expressive characters where appropriate.
- Preserve independently animatable visual objects.
- Use purposeful framing, visual hierarchy, camera movement and transitions.
- Synchronize meaningful motion with narration rather than relying on decorative animation.
- Prioritize engaging openings, narrative continuity and memorable explanations.
- Preserve professional multilingual typography and caption readability.
- Avoid generic diagrams, stiff characters, repetitive compositions, excessive empty space and presentation-slide aesthetics.
- Allow flexible shot counts and autonomous creative decisions without requiring owner-supplied scene instructions.
- Review actual rendered keyframes and motion previews before expensive final rendering.
- Compare artistic output against relevant professional references, not merely previous internal demonstrations.
- Distinguish technical validation, artistic acceptance and production readiness.
- Never claim premium quality solely because automated tests pass.
- Improve creative capabilities through actual production evidence rather than endless infrastructure development.

### Licensing and privacy

- Track source, license and attribution for external assets.
- Do not use media with unclear rights in production output.
- Review model, voice, font, music and sound-effect licensing independently.
- Use voice cloning only with appropriate consent.
- Keep user research, settings and local artifacts private by default.
- Validate paths and external inputs.

### Output reliability

- Preserve intermediate artifacts for recovery.
- Report failed stages and supporting evidence.
- Never claim successful output without validating the actual file.
- Distinguish technical success from production readiness.

## 12. Execution environments

Maintain a CPU-first local development baseline.

- Use Windows and Linux environments where supported and authorized.
- Keep platform-specific dependencies isolated.
- Preserve working environments when testing alternatives.
- Record benchmarks separately for different runtimes.
- Do not treat virtual-machine memory as additional physical host RAM.
- Verify actual runtime capabilities.
- Monitor relevant memory and storage limits.
- Release heavyweight model processes before rendering when appropriate.

Avoid unnecessary infrastructure and paid service dependencies.

## 13. Multi-agent collaboration

This project may be developed using Codex, Claude Code or other approved coding agents.

- AGENTS.md is the shared source of engineering instructions.
- Platform-specific instruction files should reference it.
- Inspect existing uncommitted changes before editing.
- Preserve work completed by other agents.
- Resume from documented checkpoints.
- Do not duplicate completed experiments.
- Do not assume access to another agent's conversation history.
- Do not allow concurrent conflicting modifications.

Keep handover information concise and sufficient for another agent to resume.

## 14. Scope control

Follow only the current approved atomic task.

Do not:

- Automatically start another phase.
- Expand approved release scope.
- Implement unrelated features.
- Replace working subsystems without evidence and approval.
- Silently weaken quality requirements.
- Delete existing user work.
- Perform unnecessary Full HD rendering.
- Continue investigating minor issues after acceptance criteria pass.
- Commit or push without explicit authorization.

Keep incomplete experiments explicitly open even when independent development proceeds.

## 15. Definition of done

An atomic implementation task is complete when:

- Its approved acceptance criteria are satisfied.
- Relevant tests have actually executed.
- Required output artifacts have been inspected and validated.
- Documentation matches the implementation.
- Applicable safeguards and licensing requirements are respected.
- Remaining limitations are clearly identified.

### Technical acceptance

- Technical acceptance requires verified functionality, correctness, reliability and compliance with the approved task requirements.
- A visual style may be technically implemented while its artistic validation remains pending.
- Successful rendering and automated tests do not establish professional visual quality.

### Artistic acceptance

- Evaluate actual rendered keyframes and motion previews against the approved creative quality standard.
- Aim to meet or exceed relevant professional animation references, not merely improve upon previous internal demonstrations.
- Assess illustration quality, composition, lighting, materials, typography, storytelling, motion and overall visual engagement.
- Do not claim premium quality without supporting visual evidence and owner acceptance.
- Do not lower artistic standards to meet release deadlines.

### Production readiness

Production readiness requires all applicable technical, artistic, factual accuracy, native-language, licensing and human-review gates to be satisfied.

Clearly distinguish between:

- Technically implemented.
- Artistically validated.
- Production-ready.
- Approved for publication.

A technical pass does not close outstanding quality, factual review, licensing or publication gates.

Do not require perfection beyond an atomic task's approved acceptance criteria, but do not confuse task completion with final product acceptance.

## 16. Completion reporting

Keep completion reports concise and evidence-based.

Use this format:

**Status:** Passed / Partial / Blocked / Failed

**Changes:** Essential implementation summary.

**Validation:** Actual test results and relevant measurements.

**Artifacts:** Important generated file paths.

**Remaining issues:** Unresolved blockers and mandatory review gates.

**Next action:** One recommended atomic task.

Keep detailed logs in relevant experiment artifacts.

Do not repeat the full project history.

Stop immediately after the completion report.