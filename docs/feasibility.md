# Feasibility plan, risks, and decisions

E01 remains open after P002.1; see [E01 evidence](experiments/E01-skill-portability.md). **E02 baseline inventory and bounded execution checks were completed in P003**; see [E02 findings](experiments/E02-hardware-assessment.md). **E03 research, candidate screening, and evaluation design were completed in P004; Hindi synthesis and resource benchmarking passed in P005.1B, with listening and broader coverage pending**, so E03 is incomplete. See [voice research](research/multilingual-tts-research.md) and [E03 plan](experiments/E03-voice-evaluation-plan.md). [E04 P006.1](experiments/E04-P006.1-speech-alignment.md) measured waveform boundaries and investigated native timings. Evaluated text alignment remains open. [E05 P007](../experiments/E05/README.md) rendered five locale fixtures at both Full HD orientations; native-reader visual review remains open. [E06 P008](../experiments/E06/paper-explainer/README.md) produced the static Paper Explainer foundation. P009 validated eight revised frames across flight fares and Wi-Fi; human visual scoring and motion remain open. [E07 P010](../experiments/E07/p010/README.md) produced a deterministic silent Paper Explainer motion prototype; human motion review remains open. [E10 P011–P012](../experiments/E10/p011-p012/README.md) produced the first narrated 1080×1920, 30 fps H.264/AAC prototype. It uses Kokoro Hindi Sample B and provisional phrase timings. Listening, alignment, visual and licensing review remain open, and the 60-second sourced E10 target remains open. E08–E10 remain defined. Record machine specifications, commands, model/software versions, licenses, samples, and raw results when run. Numeric limits below are proposed experiment gates, subject to calibration and approval; they are not measured achievements.

| ID | Objective and method | Prerequisites | Measurable gate / artifacts | Risk and decision outcome |
| --- | --- | --- | --- | --- |
| E01 | Compare Skill package, invocation, filesystem, process, and tool rules on Codex, Claude Code, Antigravity, and capable ChatGPT environments | Access to official platform specs and test environments | Compatibility matrix with tested/untested labels; minimal invocation logs | Host differences → common core plus documented adapters or narrow support claims |
| E02 | Inventory CPU, RAM, GPU, OS, storage; run safe sample workload | Target Windows machine | Hardware report, peak memory/storage, runtime logs | Resource limits → choose viable CPU baseline |
| E03 | Synthesize matched short passages in all five locales with local candidates; native speakers compare blind samples | Hardware, licensed candidate models, reviewers, scripts | Audio, model/license matrix, per-locale intelligibility/naturalness/pronunciation scores; proposed gate ≥4/5 mean with no critical pronunciation failure | No acceptable voice → investigate alternatives, narrow release, never silent fallback |
| E04 | Align manually labeled speech in each locale; compare token and sentence boundaries | E03 audio, native transcripts, annotators | Timing files, per-locale median/p95 absolute error and coverage; proposed gate median ≤150 ms, p95 ≤400 ms, ≥98% tokens covered | Indic token mismatch → alternate aligner or manual correction path |
| E05 | Render fixture strings for five scripts, mixed English, combining marks, long lines | Candidate fonts/renderers | PNGs and reviewer checklist; zero broken graphemes or clipped mandatory text | Shaping gaps → font/renderer change |
| E06 | Produce several subject-specific programmatic graphics and licensed-asset examples | Rights review, design rubric | Image set, asset manifest, reviewer ratings; proposed gate ≥4/5 visual clarity and relevance | Weak aesthetic → improve art direction or asset strategy |
| E07 | Build one Paper Explainer reference scene during future experiment phase | E06, style draft | Short scene and style evaluation sheet; proposed gate ≥4/5 visual/motion quality | Style lacks range → redesign module |
| E08 | Render a representative Full HD scene locally and measure speed, RAM, storage | E02, renderer candidates | MP4, probe, timing/resource logs; proposed gate completion on baseline machine without crash; time budget to approve after measurement | CPU impractical → optimize or revise baseline |
| E09 | Drive captions and three visual events from measured speech timestamps; inspect frames | E04, E07 | Timeline, frame samples, offset report; proposed gate event offset ≤2 frames plus alignment error | Drift → revise timebase |
| E10 | Produce approximately 60-second sourced Paper Explainer in one language | E01–E09 sufficient, R01 path | Full HD MP4, intermediates, source/asset manifests, QA and human review; proposed duration 50–70 seconds, all media integrity gates pass | Integration failure → diagnose stage and retry |

## Candidate technology research

Research candidates only: Indian-language/AI4Bharat speech models, Kokoro, Chatterbox, Piper, other local multilingual TTS; Faster Whisper, WhisperX and forced aligners; SVG, HTML Canvas, Remotion, Three.js, Blender, FFmpeg, Python, TypeScript, and optional local image generation. Compare measured quality by locale, rights and commercial use, CPU/GPU and RAM needs, setup, reliability, portability, maintenance, offline operation after setup, and reproducibility. No candidate is an approved dependency or final choice.

## Major technical risks

| Risk | Early evidence and response |
| --- | --- |
| Natural local voice quality differs sharply by locale | E03 blind native-speaker tests; voice route per language |
| Forced alignment fails on Indic scripts/code-switching | E04 labeled timing tests; tokenization and correction path |
| Complex text shaping or wrapping corrupts captions | E05 script fixtures and visual review |
| Programmatic visuals look generic or static | E06/E07 multi-topic rubric and motion reference |
| Full HD CPU render is too slow or memory-heavy | E02/E08 measured baseline and optimization decision |
| Skill format or execution differs by host | E01 tested compatibility matrix; no blanket claim |
| Asset/model license blocks intended use | Record versions, terms, provenance before adoption |
| Research errors survive into polished video | Claim-source mapping and human factual review |

## Decisions and unresolved questions

Confirmed constraints are in `requirements.md`. Proposed decisions: a common Skill contract with optional adapters; provider-independent TTS; stage manifests; Paper Explainer first. Assumptions: R01 can validate one locale; external assets may be used only when rights are documented. Unresolved: actual host capabilities, machine baseline, local voice quality, alignment accuracy, renderer choice, measurable render-time target, owner-preferred sample topic/voice, and calibrated human-review thresholds. Material stack and release gates require approval after experiment evidence. Record approved choices as ADRs rather than editing claims retroactively.
