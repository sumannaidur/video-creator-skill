# Product baseline and requirements

Status: confirmed product requirements from P001 request. Architecture and technologies remain proposals.

## Vision and scope

A portable Agent Skill directs free local tools to turn a topic, document, or structured sourced research into a professionally narrated, topic-specific animated explainer. The system is neither a SaaS, a conventional editor, a paid API wrapper, nor a fixed slideshow template.

## User journey and functional requirements

| ID | Requirement | Observable acceptance criterion |
| --- | --- | --- |
| F01 | Save validated first-use preferences for orientation, duration, language, voice, accent, tone, style, captions, music, SFX, resolution, fps, output path, and review mode | A second run reuses saved values; a per-video override does not alter defaults |
| F02 | Ingest topic, documents, structured research, and sources | Input and source manifest are retained; unsupported formats fail clearly |
| F03 | Separate verified claims, uncertainty, and contradictions | Every externally checkable claim has a source or explicit uncertainty marker; no invented source |
| F04 | Write native, conversational scripts with hook, progression, pauses, and conclusion | Script review rubric passes and target duration is checked against generated speech |
| F05 | Route local TTS by locale/voice and prepare pronunciation | Output locale/voice match request; unsupported route fails visibly; listening evaluation is recorded |
| F06 | Align actual speech and derive visual timing | Timestamp coverage and error are measured against manually labeled samples per language |
| F07 | Plan topic-specific scenes with visual purpose and coherent Paper Explainer styling | Scene plan maps each narration beat to a visual explanation and animation events |
| F08 | Source or create assets with license provenance | Each external asset has origin, license, and attribution fields before rendering |
| F09 | Render native-script timed captions and export SRT/VTT | Sample captions render correctly in each target script; timestamps match evaluated speech |
| F10 | Mix voice, music, and SFX with speech priority | Listening check confirms intelligibility; measured peaks and loudness are reported |
| F11 | Render local watermark-free H.264/AAC MP4 | Actual file probes as requested orientation, 1080×1920 or 1920×1080, 30 fps by default |
| F12 | Validate and deliver output with recoverable intermediates | File exists, decodes, has audio/video, and QA report names any failed checks |

## Non-functional requirements

| ID | Requirement | Verification |
| --- | --- | --- |
| N01 | Skill-first and portable | Validate Skill format and execution independently on each claimed platform |
| N02 | Zero additional mandatory software/API charges; local-first, watermark-free | Dependency and license audit; render without paid service |
| N03 | CPU-compatible consumer hardware baseline, Windows initially | Benchmark on documented machine; record elapsed time, peak RAM, storage, and output integrity |
| N04 | Reproducible and recoverable stages | Rerun from a failed stage with retained inputs and provenance |
| N05 | Secure and private local data handling | Path/input checks and review of external transfers; no implicit upload |
| N06 | Maintainable modular language, TTS, style, and rendering boundaries | Interface and replacement tests after architecture selection |
| N07 | Accurate claims and rights-compliant assets | Source and license audit on each produced video |

## Multilingual baseline

R02 requires separate support for `kn-IN`, `hi-IN`, `te-IN`, `ta-IN`, and `en-IN`. Each requires native storytelling guidance, number/date/currency/measurement expansion, names and technical terms, code-switching, pronunciation exceptions, suitable local voice, token-level or language-appropriate alignment, complex-script shaping, line breaking, native-script captions, and SRT/VTT. A fallback must be disclosed and must not change language or acceptable quality silently. Native-speaker listening and script/caption review are release gates for each locale. Expansion to other Indian languages is a later goal, not an R02 claim.

## Visual architecture and output

Styles are independent modules comprising visual DNA (palette, type, illustration, composition, depth, spacing), reusable components, motion language, reference scenes, and a quality rubric. Topic-specific scene direction combines these primitives with narration timestamps. Paper Explainer is the R01 focus. Planned later styles: whiteboard, flat science, technical, data storytelling, documentary collage, cinematic 3D, X-ray/technical, and kinetic typography. None is implemented.

Initial rendering targets: local MP4, H.264 video, AAC audio, 1080×1920 vertical or 1920×1080 horizontal, 30 fps default, no watermark. Higher resolution is future scope. Actual hardware feasibility and rendering speed are unknown.

## Boundaries and open decisions

Confirmed: five initial locales, Paper Explainer first, local-first/free baseline, audio-first synchronization, verified final media. Proposed: exact Skill directory layout, data schemas, TTS and alignment adapters, renderer, visual primitives, numeric quality thresholds. Assumptions: the approximately 60-second R01 sample may use one language and a sourced topic. Approval needed after experiments for material dependencies, stack choices, quality thresholds, and R01 sample topic/voice if the owner wants to specify them.
