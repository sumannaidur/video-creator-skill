# P012.1 creative quality preview: three-shot tree cooling

[`trees-shots-preview.mp4`](trees-shots-preview.mp4) is a 540×960, 30 fps creative-review preview. It retells the same 8.925 s Kokoro Hindi Sample B narration in three animated shots. The validated [P011–P012 prototype](../p011-p012/README.md) is the baseline and is unchanged. Full HD is not rendered and waits for owner approval of this preview.

## Shots and cues

Cuts sit at the midpoints of the two inter-phrase pauses: 1.888 s and 4.675 s. Cue times are offsets from the provisional `contextual_word_union` phrase starts in [`sample-B-candidate.timeline.json`](../../E04/native-timing/outputs/sample-B-candidate.timeline.json). These timings are unreviewed.

| Shot | Phrase (start) | Content and motion |
|---|---|---|
| 1. Canopy and shade | «पेड़ धूप रोकते हैं।» (0.550 s) | A layered paper landscape. The opening question shows briefly as a small tag, then fades out at 1.0–1.35 s. Sun rays draw in from the sun at +0.22 s and stop at the canopy. One ray passes beside the tree and lights the ground. The cool shade pool spreads at +0.55 s. The camera pushes slowly in, then quickly into the canopy. |
| Transition | | A leaf-tile dissolve. The push into the canopy fills the frame with leaves, which land on a single leaf. |
| 2. Leaf close-up | «पत्तियों से पानी भाप बनकर निकलता है,» (1.925 s) | The camera settles from 1.4× onto one leaf against out-of-focus canopy bokeh. Water flows along the veins from the stem at +0.30 s. A magnifier opens on one stoma at +0.55 s. Vapour is shown as small water-molecule symbols that leave the stomata from +1.0 s, spread out and fade. The label reads «जलवाष्प (अदृश्य)». The camera tilts up with the rising particles. |
| Transition | | A paper sheet sweeps upward, continuing the rising motion, and reveals the street. |
| 3. Street environment | «तो आसपास की हवा ठंडी होने में भी मदद मिल सकती है।» (4.725 s) | The camera tilts down from the sky onto a sunlit pavement with heat shimmer and a «गर्म हवा» thermometer. Two trees stand over a shaded bench. At +0.95 s, near the candidate time of «हवा», cool-air currents flow out from the shade. At +1.3 s the «ठंडी हवा» label appears and the shaded thermometer drops. Faint molecules keep leaving the canopies. |

## What changed from the baseline

- **Illustrations:**
  - Full-frame paper plates are layered for depth: sky, ground, subject and foreground. Inner layers have paper-cut drop shadows. A fibre-grain overlay and a soft vignette add texture.
  - Canopies, leaves and grass are generated from deterministic seeded organic shapes. There are no external or third-party assets.
- **Camera:**
  - Each shot has its own framing: a push into the canopy, a match landing on the leaf, a tilt up with the vapour, then a tilt down to the street.
  - Background layers move at 0.45× and 0.7× of the camera, and the foreground at 1.2×, for parallax depth.
  - Trees, the leaf, the heat shimmer and the cool air carry gentle ambient motion computed from the frame time.
- **Headline:** the persistent 82 px headline is gone. The question appears only as a small opening tag.
- **Captions:** a cream paper card replaces the dark slab. Text is 42 px Nirmala UI semibold at 1.5 line height in ink colour. A left accent colour changes per shot. The fixed 176 px height means two-line captions never reflow the stage. Captions fade in and scale up slightly at each phrase start and hold through the pauses.
- **Vapour accuracy:** no droplets, clouds or fog appear anywhere. Water vapour is drawn as sparse symbolic molecules that disperse and fade, labelled as invisible.

## Files and command

- [`shots.js`](shots.js) holds the scene data, SVG symbols and a shot adapter. The adapter reuses the P009 page and `renderPaperScene` from [`story.html`](../../E06/paper-explainer/story.html) and adds a camera wrapper, per-layer parallax, keyframe tracks, clip reveals, ambient motion and the two transitions.
  - The shared `story-motion.js` was not modified. Extending it would have changed the validated baseline's motion code.
- [`render-shots.mjs`](render-shots.mjs) drives the shared E05 headless Chrome capture on a 1080×1920 canvas. It seeks `paperShots.renderAt(i/30)` for every frame, writes the JPEG frames at half scale, muxes the exact Sample B WAV and validates the output.

```
node experiments/E10/p012.1/render-shots.mjs        # ~60 s wall on the tested machine
```

## Validation ([`preview-evidence.json`](preview-evidence.json))

- **Media:** H.264 High at 540×960, `yuv420p`, BT.709 tags and 30/1 fps, with 268 decoded frames over 8.933 s. Audio is AAC at 48 kHz mono, 8.917 s long. Full FFmpeg decoding reported no errors. The audio file hash matched the timeline before rendering.
- **Sync:** speech onset falls at 0.5458 s in the WAV and 0.5455 s in the MP4, a 0.25 ms offset. Seven cue objects were checked, each starting at or after its phrase start. Each was hidden 20 ms before its cue and visible 0.6 s after it: sun rays, shade, water veins, magnifier, first vapour molecule, cool air and the cool-air label.
- **Frame checks:** all 268 frames and 9 keyframes passed several checks:
  - The stage and caption stay inside the safe area.
  - Every visible label is fully inside the clipped stage, and no text overflows its box.
  - The background plates cover the stage with no gaps.
  - The headline is never visible.
  - The opening tag never appears after the first cut.
  - The page never scrolls.

  All three shots, all three captions and both transitions appeared.
- **Problem caught during testing:** a 10 px caption slide-in briefly crossed the safe-area bottom (frame 17). It was replaced with an in-place scale.
- **Repeatability:** a nonsequential re-seek to 3.75 s reproduced identical label geometry. Across three runs, the PNG bytes were identical in two and differed in the first. That run happened before SSIM recording was added, so its size is unmeasured. The renderer now records SSIM and fails below 0.999 on any byte mismatch. The baseline was byte-identical at its tested time. The new blur filters and blend overlays may make rasterisation slightly less stable.
- **Inspection:** keyframes and decoded MP4 frames around both cuts were inspected visually.

## Keyframes (540×960)

[Opening](key-1-opening.png) · [shade](key-2-shade.png) · [leaf dissolve](key-3-leaf-dissolve.png) · [water in veins](key-4-water.png) · [vapour](key-5-vapour.png) · [paper wipe](key-6-paper-wipe.png) · [street heat](key-7-street-heat.png) · [cooling](key-8-cooling.png) · [end](key-9-end.png)

## Limitations and open gates

- **Creative review:** owner review of the preview is pending. Specific concerns:
  - The paper-wipe midpoint is a plain sheet for about 0.2 s.
  - The lower street pavement is sparse.
  - Molecules are small at 540×960.
  - The shade-side thermometer overlaps the canopy edge.
- **Science and wording:**
  - The thermometers show only a qualitative difference, with no values. The visuals still need a factual source and an expert check.
  - The narration word «भाप» (steam) may suggest visible steam. The visuals deliberately show invisible vapour instead, and the wording may need an owner decision.
- **Hindi review:** the new on-screen labels «जलवाष्प (अदृश्य)», «पानी», «गर्म हवा» and «ठंडी हवा» need native-reader review, as do caption readability and Devanagari rendering at preview size.
- **Earlier gates:** Hindi listening (E03) and human timing verification (E04) remain open.
- **Licensing:** frames rasterise the installed Nirmala UI font. Redistribution terms for rendered output still need review. All artwork is authored in this repository.
- **Full HD:** not rendered. After approval, the same script can render at 1080×1920 by setting `scale = 1` and `crf = 18`, but that path is not yet exercised.
