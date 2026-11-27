# P011–P012 first integrated narrated Paper Explainer

[`trees-1080x1920.mp4`](trees-1080x1920.mp4) is the first narrated prototype. It combines the synchronized Kokoro Hindi Sample B with the P009/P010 Paper Explainer view and motion adapter. The topic is how trees cool the air. [`trees-preview.mp4`](trees-preview.mp4) is a lightweight 540×960, 15 fps review copy of the same timeline.

- [`trees.js`](trees.js) adds the tree-cooling scene. It authors the SVG cut-outs, the vertical layout overrides, and the motion plan. All three are derived from the timeline.
- [`render-trees.mjs`](render-trees.mjs) loads the timeline and checks the WAV SHA-256 against it. It then drives the shared E05 headless Chrome capture at 1080×1920. Each frame is seeked deterministically with `paperMotion.renderAt(i/fps)`. The script muxes the WAV with FFmpeg and validates the output file.
- [`story-motion.js`](../../E06/paper-explainer/story-motion.js) accepts an external plan and phrase caption windows. Its default P010 flight plan is unchanged.

## Reproduce

From the repository root, run these with the existing Chrome 157 and FFmpeg 9.0.2. A Chromium path can be passed as the last argument.

```
node experiments/E10/p011-p012/render-trees.mjs preview   # ~45 s wall
node experiments/E10/p011-p012/render-trees.mjs full      # ~60 s wall
```

The full encode uses H.264 High, CRF 18, limited-range `yuv420p` and BT.709 tags. Audio is AAC-LC at 160 kb/s and 48 kHz mono, with `+faststart`. Each run writes `<mode>-evidence.json`. The run fails if any frame, cue, decode or media check fails.

## Timing

Cues use the three provisional `contextual_word_union` phrase records from [`sample-B-candidate.timeline.json`](../../E04/native-timing/outputs/sample-B-candidate.timeline.json). Their validation status is `unreviewed`. The timings are model-derived candidates, not human-verified alignment.

| Phrase | Start (s) | Visual |
|---|---|---|
| पेड़ धूप रोकते हैं। | 0.550 | Sun rays strike the canopy, and the shade patch expands beneath the tree. |
| पत्तियों से पानी भाप बनकर निकलता है, | 1.925 | Three droplets rise from the canopy in a stagger. The vapour cloud appears at about 3.1 s, near the candidate time of “भाप” (3.0 s). |
| तो आसपास की हवा ठंडी होने में भी मदद मिल सकती है। | 4.725 | The air arrows sweep out over 1.6 s. The camera drift continues to the end of the audio. |

Each caption is held until the next phrase starts. This avoids 75–100 ms blank flashes in the inter-phrase pauses. The last caption runs to the end of the audio at 8.925 s.

## Evidence (full render, [`full-evidence.json`](full-evidence.json))

- **Media:** FFprobe reports H.264 High at 1080×1920, `yuv420p`, 30/1 fps, 268 decoded frames and 8.933 s. Audio is AAC-LC at 48 kHz mono, lasting 8.917 s; the source WAV lasts 8.925 s. Both streams start at 0. Full FFmpeg decoding reported no errors. The preview passed the same checks at 540×960, 15 fps and 134 frames.
- **Sync:** silencedetect at −40 dB placed the first speech onset at 0.5458 s in the source WAV and 0.5455 s in the MP4. The offset is −0.25 ms. Each cue object was at opacity 0 at 20 ms before its phrase start. It reached opacity 1 after the phrase start, with the matching caption ID showing.
- **Frame bounds:** all 268 frames and 8 keyframes passed several checks. Every visible object stayed inside the safe area, and no text overflowed its box. The page never scrolled. All three captions appeared.
- **Repeatability:** a nonsequential re-seek to 1.45 s reproduced identical object bounds and PNG SHA-256 (`--disable-gpu`).
- **Keyframes:** [start](start.png) · [shade before](shade-before.png) / [after](shade.png) · [vapour before](vapor-before.png) / [after](vapor.png) · [air before](air-before.png) / [after](air.png) · [end](end.png). A frame decoded from the MP4 at 6.5 s was visually inspected and matched the browser capture.
- **Layout fixes:** the first capture failed the text-bounds check because Devanagari marks in the 82 px title extended about 3 px outside the line box. The title got block padding and `text-wrap: balance`, which also removed the one-word second line. The droplets and cloud were moved so the third droplet no longer covers the “जलवाष्प” label. The sun rays were moved clear of the “धूप” label.

## Open gates

- **Voice:** native Hindi listening review of Sample B naturalness is still open (E03).
- **Alignment:** human verification of the phrase and word timings is still open (E04). The sync check above shows only that the audio is not offset in the container. It does not show perceived visual-to-speech alignment.
- **Visual and motion:** human review of the visuals, motion and caption readability is still open (E06/E07). This includes a native reader's Devanagari check.
- **Factual content:** the narration claim has no recorded source yet. Sourcing and fact review are still needed.
- **Licensing:** the frames rasterize the installed Microsoft Nirmala UI font, and no font file ships with them. Redistribution terms for rendered output still need review. The Kokoro model and voice terms follow the E03 records. All SVG art is authored in this repository.
- **Scope:** the prototype is a single 9-second scene. The E10 target of a sourced video of about 60 seconds remains open.
