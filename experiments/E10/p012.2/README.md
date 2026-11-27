# P012.2 Paper Explainer V2: final tree-cooling video

**Final MP4:** [`experiments/E10/p012.2/trees-v2-1080x1920.mp4`](trees-v2-1080x1920.mp4). It is 1080×1920, 30 fps, H.264 High / AAC-LC, 8.933 s long and 5.3 MB.

This is the approved [P012.1](../p012.1/README.md) three-shot video with three fixes. The narration is the same Kokoro Hindi Sample B WAV, verified by SHA-256 against the timeline. The cues use the same provisional phrase timings: cuts at 1.888 s and 4.675 s, and the same cue offsets. P011–P012 and P012.1 are preserved unchanged. [`shots.js`](shots.js) and [`render-shots.mjs`](render-shots.mjs) are copies of P012.1 with only the changes below.

## Changes

- **Paper wipe:** the sheet was blank. It now carries a printed sky: the warm gradient, a sun halo, rising water-molecule symbols and the distant skyline. The upward sweep now continues the vapour's rise and previews the street. A new `paper-wipe-mid` keyframe captures the frame at the cut.
- **Vapour symbols:** the symbol is now 6.6% of stage width, up from 5.2%. It has a dark slate outline, a tinted fill and a light halo behind it. Peak opacity is now 1, up from 0.9, and mid-fade opacity 0.7, up from 0.5. Street-shot particles are scaled 0.85, up from 0.8.
- **Thermometer:** the shade thermometer moved to the open shade right of the second trunk, at (92.5%, 68%). It no longer overlaps the canopy. It crops briefly during the opening tilt and is fully in frame once the camera settles.
- **Renderer:** the script now takes a `full` or `preview` mode. The full mode writes keyframe PNGs. On any byte mismatch at re-seek it records SSIM, and it fails below 0.999.

## Reproduce

Run these from the repository root with the existing Chrome 157 and FFmpeg 9.0.2. An optional Chromium path can be passed as the last argument.

```
node experiments/E10/p012.2/render-shots.mjs full      # trees-v2-1080x1920.mp4 + full-evidence.json, ~70 s wall
node experiments/E10/p012.2/render-shots.mjs preview   # trees-v2-preview.mp4, 540×960 review copy
```

## Validation ([`full-evidence.json`](full-evidence.json))

- **Media:** H.264 High at 1080×1920, `yuv420p`, BT.709 tags and 30/1 fps, with 268 decoded frames over 8.933 s. Audio is AAC at 48 kHz mono, 8.917 s long. Full FFmpeg decoding reported no errors.
- **Sync:** speech onset falls at 0.5458 s in the WAV and 0.5455 s in the MP4, a 0.25 ms offset.
- **Cues:** seven checks passed: sun rays, shade, water veins, magnifier, first vapour molecule, cool air and the cool-air label. Each object was hidden 20 ms before its cue and visible 0.6 s after it, and every cue falls at or after its phrase start.
- **Frame bounds:** all 268 frames and 10 keyframes passed:
  - The stage and caption stay inside the safe area.
  - Labels are fully inside the clipped stage, and no text overflows.
  - The background plates cover the stage.
  - The headline is never visible, and the opening tag never appears after the first cut.
  - The page never scrolls.

  All three shots, captions and transitions appeared.
- **Repeatability:** a re-seek to 3.75 s gave identical label geometry. The PNG bytes differed, with SSIM 0.999933. This is a known small raster variance with the blur and blend layers, and it is above the 0.999 gate.
- **Inspection:** decoded MP4 frames from all three shots and the wipe midpoint were inspected visually.

Keyframes: [opening](key-1-opening.png) · [shade](key-2-shade.png) · [leaf dissolve](key-3-leaf-dissolve.png) · [water](key-4-water.png) · [vapour](key-5-vapour.png) · [wipe](key-6-paper-wipe.png) · [wipe midpoint](key-7-paper-wipe-mid.png) · [street heat](key-8-street-heat.png) · [cooling](key-9-cooling.png) · [end](key-10-end.png)

The reusable techniques, kept separate from the tree-specific artwork, are recorded in the [Paper Explainer style specification](../../E06/paper-explainer/README.md#p012-narrated-shot-techniques).

## Open gates

- **Factual sourcing:** the narration and visuals have no recorded source. The thermometers are qualitative. «भाप» in the narration versus the invisible-vapour visuals needs an owner decision.
- **Hindi review:** native listening review of Sample B (E03) and native-reader review of the captions and labels are still open.
- **Alignment:** human verification of the phrase timings (E04) is still open.
- **Licensing:** the frames rasterise the installed Nirmala UI font, so redistribution of the rendered output still needs review. All artwork is authored in this repository.
- **Human review:** visual and motion review of the final video is still pending.
