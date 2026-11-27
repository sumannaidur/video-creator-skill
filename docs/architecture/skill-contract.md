# Skill contract v0.1 (design contract)

**Status:** proposed, implementation-independent. This is not a claim that operations work yet. Contract version is distinct from the Agent Skills format, which has no version number asserted here.

## Inputs and operations

Inputs: plain-text topic; research documents; structured research; source references; an existing production project; and preference overrides. Preserve provenance, distinguish trusted user instructions from untrusted research text, and reject unsupported formats clearly. Do not specify detailed schemas in P002.

| Operation | Release | Required outcome |
| --- | --- | --- |
| First-time setup | R01 | Validate and save preferences in a persistent writable location |
| Generate video | R01 | Produce and verify the requested output or report a stage-specific failure |
| Update preferences | R01 | Validate update and retain effective defaults |
| Preview production | R01 | Produce a viewable preview when render capability exists |
| Resume failed production | R04 | Continue from retained stage artifacts; R01 retains intermediates but does not promise resume |
| Regenerate selected scene | R04 | Replace selected scene and revalidate dependent outputs |
| Validate existing output | R01 | Probe actual media and emit a quality report; creative review remains human |

Conceptual outputs: user configuration, research/source manifest, narration script/audio, speech alignment, storyboard, visual assets and rights manifest, scene timeline, captions/subtitles, audio mix, preview, final MP4, and quality report. Output paths and detailed schemas belong to later tasks. Every artifact must identify its stage and be retained on failure where safe.

## Capability negotiation

Before each operation, inspect the **current host** for readable input, writable project and preferences locations, permission to execute approved local programs, required installed dependencies, sufficient runtime access to intermediate artifacts, media rendering, and independent final-file verification. Report each as available, denied, missing, or untested. A written script without executable access does not satisfy rendering. Network and model downloads are optional and require explicit policy/rights checks; never replace local production with a paid service silently. If a required capability is absent, stop before the dependent stage and give the missing capability, affected operation, and next remedy. A different host may run the same package with different capabilities.

## Failure contract

Use a stable stage, reason, evidence path, and recoverability note for: unsupported host; missing dependency; unsupported locale; unavailable or unacceptable voice; invalid configuration; denied permission; missing research evidence; invalid source/asset rights; speech, alignment, or render failure; and failed quality validation. Never claim success until the actual output exists, decodes, has required streams/properties, and passes applicable checks. A human-quality gate cannot be replaced by a media probe.

## Required invariants

No fabricated claims or licenses; no silent language change; actual-audio-driven timing; no mandatory paid service; no watermark; local data private by default. R01 needs a validated single-locale slice and human review of its actual story, narration, visuals, motion, and final video. R02 requires independent five-locale acceptance.
