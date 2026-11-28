# V3 acceptance criteria

Status: targets, not passing test claims. See [requirements](requirements.md) and [roadmap](roadmap.md).

| ID | Passing evidence |
| --- | --- |
| AT-01 | Topic-only request produces complete reviewable video. |
| AT-02 | Subject-specific coherent artistic identity. |
| AT-03 | Believable detailed environment constructed locally from source. |
| AT-04 | Reviewed source reused in a distinct production. |
| AT-05 | Parameter or code extension preserves old version. |
| AT-06 | Original composition, not fixed-template variation. |
| AT-07 | Meaningful cinematic viewpoints and shot choices. |
| AT-08 | Required physical contacts and actions remain coherent. |
| AT-09 | Recurring character identity and state persist. |
| AT-10 | Distinct supported voices and coherent dialogue timing. |
| AT-11 | Native-speaker review of pronunciation and script. |
| AT-12 | Music-led or silent production without forced narration. |
| AT-13 | Coherent mixed-style sequence. |
| AT-14 | Later project demonstrably applies a recorded lesson. |
| AT-15 | Owner feedback demonstrably influences later production. |
| AT-16 | Claude and Codex share versioned local knowledge. |
| AT-17 | Portrait/landscape recomposition, not merely cropping. |
| AT-18 | Localized edit avoids unnecessary regeneration when feasible. |
| AT-19 | Complete coherent long-form multi-sequence video. |
| AT-20 | Actual 8 GB laptop production without dedicated GPU. |
| AT-21 | Measured safe RAM/disk behavior and bounded stages. |
| AT-22 | Interrupted production resumes valid checkpoint. |
| AT-23 | Unrequested intermediate media absent after verified cleanup. |
| AT-24 | Editable project and pinned assets remain available. |
| AT-25 | Cleanup protects original inputs and unrelated files. |
| AT-26 | Unverified required review produces review candidate. |
| AT-27 | Unresolved critical failure is reported, never accepted. |
| AT-28 | No unapproved additional production dependencies. |
| AT-29 | Existing supported capabilities pass applicable regressions. |
| AT-30 | All release-critical checks and owner artistic review pass. |

## Review gates

Technical decode/codec/dimensions/fps/duration/sync; factual claim provenance and reconstruction labeling; artwork, narrative, motion and camera; native speech, captions and sound; continuity; rights including voice and font; resource safety; source preservation and cleanup. Critical failures block accepted status regardless of score. Missing required artistic/language review means review candidate. Publication approval remains separate. Record reviewer, actual artifact identity, evidence, limitations and status; do not claim full motion/audio inspection from stills.

Initial artistic target 80/100: artwork 20, storytelling 20, motion/interaction 15, cinematography 10, sound 10, editing/continuity 10, narration/performance 10, platform presentation 5. Normalize genuinely inapplicable categories, not unverified ones. Preserve existing per-dimension and native review safeguards; calibrate with owner-reviewed examples, never lower thresholds to pass.

## Benchmark coverage

Unseen scientific and technical explainers, rich environment, character dialogue short, product ad, data story, documentary reconstruction, long-form mixed style, cross-project reuse and actual low-resource production. Choose topics at test time; do not hardcode benchmarks. Compare prior and later productions for repeated defects, reuse, duplicated source, observed quality, wall time, peak memory/disk and agent effort where measurable. Record limitations and confounders. No invented speed or credit reduction claims.

Defaults: 1080p/30 fps H.264 MP4 with AAC when audio applies; zero unapproved dependencies, unresolved critical failures, lost pinned versions or unapproved core edits. Zero unrequested retained intermediate media after successful cleanup. Establish measured hardware-specific time/memory/source budgets before claiming compatibility. Release needs owner approval.
