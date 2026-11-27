# Quality and multilingual evaluation strategy

Quality has two separate gates: automated integrity checks and human creative/language review. A successful render proves neither professional quality nor factual accuracy. Score rubrics from 1 (unacceptable) to 5 (excellent); proposed release floor is 4 in each applicable dimension, subject to calibration with reference samples. Record reviewer, locale, date, artifact, and reasons. A critical factual, rights, pronunciation, or rendering defect blocks release regardless of average score.

| Area | Automated checks | Human evaluation |
| --- | --- | --- |
| Story | Claim-source coverage, duration, missing scene beats | Hook, engagement, clarity, naturalness, progression, cultural relevance, factual nuance |
| Voice | File decode, silence/clipping, loudness, sample rate, consistency metadata | Native-speaker intelligibility, pronunciation, accent, prosody, pacing, emotion, narrator consistency, code-switching |
| Visual | Missing assets, dimensions, safe-area text bounds, sampled blank frames | Composition, hierarchy, illustration, consistency, narration relevance, professional finish |
| Motion | Timeline coverage, event offsets, transition continuity | Meaningful movement, smoothness, camera use, reveal timing, transition quality |
| Technical | Probe MP4 codecs, resolution, fps, duration, audio stream, caption timestamps, SRT/VTT parse, decode frames, manifests | Watch and listen to final output for artifacts, caption readability, audio balance |

For each `kn-IN`, `hi-IN`, `te-IN`, `ta-IN`, and `en-IN`, prepare equivalent passages covering numbers, dates, currencies, percentages, measures, abbreviations, names, places, technical terms, and English code-switching. Evaluate native script writing, speech, alignment, captions, font shaping, wrapping, CPU time, and memory separately. Native-speaker reviewers must listen to actual synthesis and inspect the finished captioned video. Do not average a failing locale into a passing multilingual score.

Before R01 acceptance, verify the actual approximately 60-second output and source/asset manifests **and** have suitable human reviewers assess its actual storytelling, narration naturalness/pronunciation, visual quality, animation, and final viewing experience. Before R02 acceptance, repeat the full language-specific suite for all five locales on documented hardware. The acceptance thresholds in `feasibility.md` are hypotheses until measured and approved.
