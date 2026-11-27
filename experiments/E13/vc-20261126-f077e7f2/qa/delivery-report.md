# Delivery report: technical PASSED

- Human review: **pending** (never automatic). Publication: **not-approved**; ready to publish: **False**.

| Check | Status | Detail |
|---|---|---|
| stage:research | passed | "completed" |
| stage:script | passed | "completed" |
| stage:narration | passed | "completed" |
| stage:creative-plan | passed | "completed" |
| stage:visual-production | passed | "completed" |
| stage:sound | passed | "completed" |
| artifact:video | passed | "audio/final-1080x1920.mp4" |
| artifact:render-evidence | passed | "render/fullhd/video-1080x1920-evidence.json" |
| artifact:preflight | passed | "qa/preflight/preflight.json" |
| artifact:mix-evidence | passed | "audio/mix.evidence.json" |
| narration-timeline | passed | "narration/narration-1d6e722da7.timeline.json" |
| visual-preflight | passed | "1911 frames at 30 fps" |
| render-media-checks | passed | [] |
| captions | passed | "24 cues; files: srt, vtt" |
| audio-mix | passed | {"lufs": -16.0, "true_peak": -3.8, "speech_over_bed_lu": 13.9, "sync_lag_ms": 0} |
| narration-sync | passed | "{\"method\": \"bed-subtracted envelope cross-correlation\", \"lag_ms\": 0, \"correlation\": 1.0, \"max_lag_ms\": 2, \"min_correlation\": 0.95, \"passed\": true |
| final-video | passed | {"size": "1080x1920", "fps": "30/1", "frames": "1911", "duration": "63.700000", "codecs": "h264/aac"} |

## Deliverables
- Video: `audio/final-1080x1920.mp4`
- Subtitles: `captions/captions.srt`, `captions/captions.vtt`
- Sources: `research/sources.json`, `research/claims.json`
- Supporting artifacts: 22 files (see qa-report.json)

## Provenance (recorded, not reviewed)
- narration_provider: "mithi"
- voice: "ahana"
- model: "MISSING (not recorded by the narration stage)"
- timing_method: "MISSING"
- timing_status: "unreviewed"
- fonts: {"caption": "\"Nirmala UI\", \"Segoe UI\", sans-serif", "label": "\"Nirmala UI\",\"Segoe UI\",sans-serif", "note": "system fonts as reported by the browser; font licensing is not reviewed"}
- audio_assets: {"assets/chime.wav": {"sha256": "4318779372088c36cc4b15cd2c17622c5999da8b8b9b649560cb0b8528f87a94", "license": "Original procedural audio synthesized in this project with FFmpeg lavfi; no third-party 
- visual_assets: "topic artwork: see the creative plan's assets list"
- renderer: {"browser": "Chrome/157.0.8103.79", "style": "paper-explainer"}

Technical checks do not judge artistic quality, native-language quality, acoustic timing accuracy or licensing.
