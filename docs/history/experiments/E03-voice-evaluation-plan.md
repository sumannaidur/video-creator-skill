# E03 / P005 — Voice evaluation plan

**Planning only, 2026-11-25.** E03 remains incomplete: no model, audio sample, listening panel, or benchmark was run in P004. Use the [candidate research](../../research/multilingual-tts-research.md), [matrix](../../research/tts-candidate-matrix.md), [license review](../../research/tts-license-review.md), and five [draft locale fixtures](../../../experiments/E03/evaluation-dataset/). The fixtures are original hypothetical teaching examples, not sourced production narration. Native speakers must correct idiom and speech-normalization proposals before use. Their G passages target roughly 60 seconds but actual duration must be measured from generated audio.

## Controlled listening

For each locale, recruit at least two native/fluent listeners familiar with regional speech, with different reviewers where practical. First review fixture text independently for natural writing and correctness; do not use flawed scripts to judge the model. Hold display text, normalized text, settings, loudness, and playback conditions constant within a comparison. Randomize anonymous model labels and order; include repeat samples to test consistency. Preserve consent and provenance for any reference audio. Listen to **actual locally generated audio**, first short A–F, then extended G. Score each sample and the full passage using [scorecard](../../../experiments/E03/listening-scorecard.md), record qualitative defects and pronunciation timestamps. Separate script quality from synthesis quality. Disclose model identity only after scores are recorded.

Proposed 1–5 anchors: **1** unintelligible/unacceptable; **2** major robotic delivery or pronunciation failures; **3** understandable but noticeably synthetic; **4** natural and engaging with minor flaws; **5** excellent, consistently natural. Score naturalness, pronunciation, intelligibility, prosody, accent suitability, conversational flow, pacing, emotional appropriateness, code-switching, voice consistency, and long-form stability separately. Critical blockers regardless of mean: wrong language, omitted or hallucinated content, materially wrong number/name, severe distortion, unlicensed reference voice, or persistent unintelligibility. A tentative mean ≥4 with no critical blocker is a **proposed** gate; calibrate with native reviewers before release. Do not average away a failed locale.

## Reproducible resource benchmark

For each approved model/checkpoint and locale, record exact revision/hash, license copy, OS/CPU, interpreter and dependency versions, available RAM before test, and settings/seed. Measure installation success, checkpoint storage, model load time, cold and warm synthesis latency, total synthesis time, generated duration, sample rate, real-time factor = synthesis seconds ÷ generated-audio seconds, peak process RSS, peak **additional** system RAM, CPU utilization, output decode/integrity, repeated-run stability, and offline operation after setup. Preserve raw timing and monitoring logs. Label third-party published figures separately.

Begin with a short A passage. Before each run recheck available RAM and disk. Start one model at a time; set an approved time/memory ceiling before execution, monitor the process, and stop if the ceiling is reached or the machine becomes unstable. Unload the model and recheck memory before the next candidate. Avoid all-model downloads and parallel heavy processes. Only after a short passage passes quality and resource gates synthesize G. Do not claim a CPU/Windows route until it runs here.

## Smallest P005 sequence

1. Recheck free memory; choose a single checkpoint after exact code, weight, voice lineage, and download terms are approved.
2. Create one isolated compatible Python environment with pinned dependencies. Confirm Windows CPU wheels and interpreter compatibility; do not alter global Python.
3. Download only that checkpoint to D:, record sizes/checksums and licenses.
4. Generate A/B/D/E/F short samples, inspect audio and resource use, then conduct blind native-speaker review.
5. If acceptable, generate G, measure stability and timing, unload, and review results before choosing the next candidate.

**Suggested first lead:** one Piper Hindi voice with a verified commercially usable training chain; if no such voice clears rights review, Kokoro Hindi is the alternate lightweight harness test. This is an experiment recommendation, not final voice selection. IndicF5 and Indic Parler-TTS remain higher-resource leads for Kannada, Telugu, and Tamil when memory permits. Indian English still has a lightweight accent coverage gap. Owner approval is needed for the exact model/checkpoint, license interpretation, reference-audio strategy, download and dependency installation, resource limits, and listening panel before P005 execution.
