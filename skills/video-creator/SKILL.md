---
name: video-creator
description: Create a sourced, narrated, topic-specific animated explainer video (nine visual styles, framed or full-bleed) from a topic, documents or research, using only free local tools. Use when the user asks to make, plan, resume, validate or revise an explainer video. Not for editing existing footage, slideshows from fixed templates, or paid/cloud video services.
license: Apache-2.0 (see LICENSE). Third-party tools, models, voices and fonts keep their own terms (see THIRD_PARTY_NOTICES.md).
compatibility: Requires shell access, Node 22+, Python 3, FFmpeg/FFprobe and local Chromium. Narration uses locally configured Kokoro ONNX (hi-IN) or Mithi on WSL 2 (hi-IN, kn-IN, ta-IN, te-IN, en-IN). Windows 11 evidence includes Claude Code release validation (P019) and development keyframe workflows run natively in Claude Code (P024.2–P024.4) and Codex (P024.5–P024.10).
metadata:
  version: 0.2.1-beta
  status: beta (maintenance release candidate); nine styles, framed and full-bleed presentations, five locales; optional Blender artwork layers; human artistic, factual, native-language, licensing and publication gates stay open (see README.md)
  contract: skill-contract v0.1
---

# Video Creator

You direct a local pipeline that turns a topic into a narrated, animated explainer. **You make every editorial and creative decision.** Deterministic tools synthesize, time, render, mix and measure. Humans own the quality gates. Never present a video as publish-ready.

## Before starting

1. Run the read-only preflight: `python scripts/doctor.py --runtime <provider>=<runtime.json> --locale <locale> --style <style|omit for auto> --json <project>/qa/capabilities.json`. See [capabilities](references/capabilities.md). Report what it finds as available, installed, planned or missing. **If it reports NOT READY, or a stage's packaged tool is missing, stop before that stage** and give the reported code, the missing item and the remedy. Never substitute another language, voice, provider or style.
2. Resolve preferences: `python scripts/preferences.py resolve [key=value ...] --check --runtime <provider>=<runtime.json> --json <project>/qa/config.json`. See [preferences](references/preferences.md). The request overrides saved preferences, which override defaults; request values are never saved. On first use, ask once and save with `init`. There is no default language. `presentation=full-bleed` selects the full-bleed presentation for every style (`framed` forces the original framed layout; the default `auto` lets the topic decide). `auto` style, provider or voice means **you** choose among the available options the check lists, and record why. An unsupported choice is reported, never substituted.
3. Create the project outside this Skill directory: `python scripts/project.py init --root <projects folder> --topic "..." --config <resolve.json> --capabilities <doctor.json>`. See [projects](references/projects.md). For each stage, call `start`, do the work, then `complete` it with its artifacts and passing evidence; use `fail` or `block` with a reason otherwise. Use `next` to resume: verified stages are reused, never repeated. Keep every artifact, and never write into the Skill package.

## Stages

Load each reference only when you reach its stage.

| # | Stage | You (agent) | Tools | Reference |
|---|---|---|---|---|
| 1 | Research | Gather evidence, build a claim ledger, flag uncertainty | none required | [research](references/research.md) |
| 2 | Script | Develop spoken and visual narratives together; write native, conversational narration with a hook, progression and payoff | duration measurement (after stage 3) | [narrative](references/narrative.md) |
| 3 | Narration | Choose the provider and voice; revise the script when the measured length is off target | `scripts/narration/stage.py` synthesizes and joins clips, resolves model-predicted timing, measures audio duration and updates the ledger. Human acoustic alignment review is separate. | [narration](references/narration.md), locale file |
| 4 | Creative plan | Design the visual hook, transformation and payoff before choosing artwork or effects. Use the cinematic shot contract; record cues and claim guardrails. | `scripts/plan.py` (validate, resolve); `render.mjs --plan` | [creative direction](references/creative-direction.md) |
| 5 | Visual production | Build topic-specific artwork and motion. Apply the keyframe review gate before advancing to preview or final render. | shot engine, visual preflight, checkpointed renderer, frame validation | [visual production](references/visual-production.md), style file |
| 6 | Sound | Decide music, effects and levels; write a mix spec | procedural assets, mixer, sync check | [sound design](references/sound-design.md) |
| 7 | Review and delivery | Run all gates, assemble the review packet, report honestly | `scripts/qa.py` (unified QA report, delivery report, human review checklist), `scripts/captions.py` (SRT/VTT) | [quality review](references/quality-review.md) |

Iterate between stages when evidence requires it: duration off target, an unverifiable claim, an unclear visual. Record why each iteration happened. Ledger stage names: `research`, `script`, `narration`, `creative-plan`, `visual-production`, `sound`, `review-delivery`. Technical completion is not approval: human review and publication are separate gates recorded with `project.py approve`.

## Review modes

- **guided** (default): stop for user approval after research, script, narration, creative plan, keyframes and the preview.
- **checkpoint**: stop after the script and after the preview.
- **autonomous**: run through to the final render, then stop for human review.

Every mode keeps the human gates in [quality review](references/quality-review.md) open. Autonomous mode never skips automated checks and never publishes.

## Stop conditions

Stop and report (stage, reason, evidence path, how to recover) when:

- A required capability or packaged tool is missing.
- A claim cannot be sourced and the user hasn't accepted it as uncertain.
- The requested locale or voice is unavailable. Never switch language or voice silently.
- An asset's rights are unknown.
- A validation check fails after your one budgeted correction.
- The user's review mode requires approval.

Never fabricate sources, quotations, statistics, licenses or evaluation results.

## Extensibility

The workflow is independent of language and style.

- **Styles:** each style has a reference file in `references/styles/` (design DNA, illustration, motion, quality criteria) and a rendering backend in `scripts/styles/<name>/`. See [rendering](references/rendering.md). [Paper Explainer](references/styles/paper-explainer.md), [Tech Explainer](references/styles/tech-explainer.md), [Whiteboard](references/styles/whiteboard.md), [Flat Science](references/styles/flat-science.md), [Data Storytelling](references/styles/data-storytelling.md), [Kinetic Typography](references/styles/kinetic-typography.md), [X-Ray Explainer](references/styles/x-ray-explainer.md), [Documentary](references/styles/documentary.md) and [3D Explainer](references/styles/3d-explainer.md) are implemented. Production evidence so far: Paper Explainer (P013); Tech Explainer (one technically passed development Full HD production, E42); the other seven have only development keyframes or short preview windows. No production has passed human review; any other style name fails with `unsupported-style`.
- **Locales:** each locale has a file in `references/locales/` covering narration, pronunciation, alignment, typography and captions. All five target locales have technically validated routes: [hi-IN](references/locales/hi-IN.md) (Kokoro, or Mithi as an alternative), [te-IN](references/locales/te-IN.md), [kn-IN](references/locales/kn-IN.md), [ta-IN](references/locales/ta-IN.md) and [en-IN](references/locales/en-IN.md) (Mithi). None of them has been human-reviewed for quality.

Add a style or locale with new files, never by editing this workflow, and never fall back silently to another one.
