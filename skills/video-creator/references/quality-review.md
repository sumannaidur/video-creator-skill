# Quality review and delivery

Never claim success until the file exists, decodes fully, and passes every applicable automated check. Automated checks never replace the human gates.

## Automated gates (stage evidence)

| Gate | Pass criterion |
|---|---|
| Narration | WAV hash matches its timeline; one run ID; sample count equals the predicted duration; 100% word coverage, or unmapped words listed |
| Captions | `captions.py check` passes: built from the current verified narration, exact text, valid non-overlapping sample ranges, SRT/VTT matching the cues. With burn-in, preflight `caption-layout` passes. Technical only; language and readability stay human gates |
| Visual preflight | `preflight.json` status `passed` and bound to the current configuration: every output frame time checked for safe area, text clipping, required-object bounds, transforms, visibility rules, cue visibility and plan cue/camera timing. Technical only; not an artistic judgement |
| Frames | Every frame passes the safe-area, label, text-overflow, plate-coverage and viewport checks |
| Cues | Each cue's object is hidden 20 ms before its cue and visible 0.6 s after it; every cue falls at or after its phrase start |
| Coverage | All shots, captions and declared transitions appear |
| Repeatability | A frame re-rendered out of order is identical, or SSIM ≥ 0.999 |
| Media | Codec, resolution, `yuv420p`, fps, exact frame count, duration (video, audio and container) and full decode |
| Audio | Loudness and true-peak targets; speech-over-bed separation; narration sync; asset provenance |
| Mux | Video stream unchanged by the audio mux |

## Unified QA report (`scripts/qa.py`)

```
python scripts/qa.py report <project> --video <final.mp4> --render-evidence <render dir>/<name>-evidence.json     --preflight <preflight.json> --mix-evidence <mix.evidence.json> [--captions captions/captions.json] [--out-dir qa] [--complete]
```

It reuses the existing validators; it adds no new ones and no scores.

1. **Stages:** `project.py verify` is run first. Each stage before review-delivery must be completed. Its evidence file must be present, unchanged since completion, and record a pass.
2. **Ownership:** the video, render evidence, preflight and mix evidence must be recorded artifacts of their stage, with current hashes.
3. **Narration:** the timeline passes the provider-independent timeline validator.
4. **Visual preflight (required for delivery):** status `passed`, and the exact result the final render was gated on (`render.mjs --preflight`). Bound to the current timeline and resolved plan.
5. **Captions:** `captions.py check` passes. With burn-in, the render used this exact artifact.
6. **Audio:** the mix evidence passed, was made from the current narration WAV, and produced this MP4. Narration sync is re-checked with `mix_audio.py --check-sync`.
7. **Final MP4:** H.264/AAC `yuv420p`. Size and frame rate match the resolved configuration (`resolution`, `orientation`, `fps`). The frame count equals the rendered frames. The video stream is unchanged through the mux. Video, audio and narration durations agree, and a full decode is clean.

Each check is `passed`, `failed`, `missing`, `stale` or `unsupported`. Anything but `passed` blocks technical completion, including checks that can't run because FFmpeg is unavailable.

**Outputs:** `qa-report.json`, a readable `delivery-report.md` and `human-review-checklist.md`.
- The report lists deliverables: the video, subtitle files, sources and supporting artifacts.
- It records provenance where available (provider, voice, model, timing method and status, fonts, audio assets, renderer) and writes `MISSING` where it is not.
- `--complete` records the result in the ledger's `review-delivery` stage: completed on a technical pass, failed otherwise.

**Three separate states:**
- **Technical:** the checks above.
- **Human review:** pending until a person records `project.py approve human-review`.
- **Publication:** ready only with a technical pass, an approved human review and an explicit `approve publication`. Any later invalidation revokes both approvals.

The tools never approve artistic quality, native-language quality, acoustic timing accuracy or licensing.

## Human gates (always open until a person records them)

`human-review-checklist.md` lists them: factual accuracy, storytelling, visual composition, illustration quality, motion, pronunciation, accent, narration naturalness, timing alignment, caption readability, audio balance and licensing.


- Native listening review of the narration.
- Timing alignment review.
- Visual and motion review, including a full-motion viewing.
- Native-reader review of captions and labels, including line breaks.
- Source verification.
- Mix intelligibility.
- Licensing review: fonts baked into frames, voice and model terms, any external assets.

## Delivery note

Report:

- Output paths.
- Checks passed and failed, with their evidence.
- Every human gate still open.
- Known weaknesses and illustrative values.
- Measured versus target duration.
- How to resume from the retained artifacts.

Keep all intermediates. Do not publish or upload.
