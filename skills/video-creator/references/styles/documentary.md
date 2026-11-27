# Style: Documentary

Real-world imagery, told with restraint. Photographs and footage are framed with purpose, moved slowly, graded and sometimes aged. Original maps place the story. Quiet serif lower thirds name people and places, and edits breathe through black. It is the grammar of a factual film, not a slideshow. The [creative direction](../creative-direction.md) principles apply first; this file adds what is specific to documentary.

## Media integrity (enforced)

- **Verified media only.** Photographs and footage come from an asset manifest (schema `video-creator.assets` v1) that you pass as `--options '{"assets": {"manifest": "<path>", "sha256": "<manifest sha256>"}}'`. The backend's `prepare` step checks the following and refuses with an explicit code (`asset-manifest-changed`, `asset-provenance`, `asset-license`, `asset-path`, `asset-type`, `asset-hash`, `asset-missing`):
  - The manifest hash matches the one in `--options`, so every change to an asset also changes the render configuration and invalidates stale checkpoints.
  - Every asset has an `id`, a `kind` (`original | licensed | public-domain | user-supplied`), a `license`, a `source`, an `attribution`, an `authenticity` (`authentic | reconstruction | illustration | procedural`) and a `media` type (`image | frames`).
  - No licence is `unknown`, `unclear` or `none`.
  - No file path leaves the manifest folder, and every file is PNG, JPEG or WebP.
  - Every file's SHA-256 matches the manifest.
- **Licensed media:** record the exact licence and attribution in the manifest and in the research ledger. Assets with unclear rights are never rendered. Licence review stays a human gate.
- **Never present reconstruction as evidence.**
  - Any scene showing an asset whose authenticity is not `authentic` must also show a `provenance` label. Rendering refuses with `missing-provenance-label` otherwise.
  - Never date, caption or treat a reconstruction or AI-free procedural image as though it were an archival record. An archival treatment is a look, not a claim.
- **Video:** supply footage as a verified frame sequence (`media: "frames"`, with `fps`), for example extracted with local FFmpeg. Decoding video files inside the browser is not frame-deterministic, so they are not used directly.

## Visual identity

- **Frame:** a black surround with a full-bleed image stage. Subtitles sit in the documentary manner: white text with a soft shadow on the black band, no card, and a minimum height that fits two lines.
- **Images:** cover-cropped and composed with intent; give each image one point of interest. Grading via `treatmentCss`:
  - `cinematic`: gentle contrast and saturation.
  - `archival`: an aged print — sepia, contrast, lowered saturation.
  - `map`: for illustrated maps.

  Add film grain (`art.grain`, a deterministic noise filter) and a vignette (`art.vignette`) with restraint.
- **Maps:** original illustrations, never traced from proprietary maps: `art.sea`, `art.land`, `art.route` (draws on), `art.place` and `art.compass`.
- **Typography:** restrained serif (Georgia, with the multilingual font for Indic scripts).

| `labelStyle` | Use |
|---|---|
| `lower-third` | Names of people or places, with an accent rule |
| `date` | Ruled date or period, only for authentic, sourced records |
| `provenance` | Small credit or status badge, such as «synthetic image — not a real photograph» or "Archive X · licence" |
| `quote` | A spoken or written quotation, only from the claim ledger |

## Motion

- **Ken Burns:** `motion.drift(id, t0, t1, [dx, dy, scale], [dx, dy, scale])` gives slow continuous moves across a shot. Use a few percent of movement, never a whip.
- **Footage:** `motion.roll(id, at, assetId)` plays a frame sequence at its own fps from a speech cue and holds the last frame.
- **Maps:** `motion.route` draws the path at the word that describes it, and `motion.mark` pops a place marker.
- **Type:** `motion.lowerThird` slides in with a reveal and leaves before the cut; `motion.fadeIn` is a soft image entrance.
- **Camera:** slow, motivated moves at plan moments (`planCamera`).
- **`dip` transition:** fade through black, the narrative pause between documentary sequences.

## Implementation

`scripts/styles/documentary/` holds:
- `backend.mjs`: `createShotBackend` with `prepare` doing the asset verification. It exports `verifyAssets`.
- `host.html` (grain filter), `doc.css` and `kit.js` (`globalThis.docKit`, which registers `dip`, the label styles and the provenance check via `globalThis.vcShotStyle`).
- The topic contract: `globalThis.documentaryTopic = {shots, symbols(ctx), css, build(ctx)}`. Use `docAsset: '<id>'` on objects that show manifest media so the provenance rule can check them.

## Self-review additions

- Does every image and clip trace to a manifest entry with a clear licence and attribution?
- Is every non-authentic image labelled on screen, and is nothing reconstructed dated or captioned as evidence?
- Does each image have one clear point of interest, and is the camera move motivated?
- Are lower thirds on screen long enough to read, and gone before the cut?
- Would a fact-checker accept every place, date and quotation shown?

## Full-bleed presentation (optional, P018.6)

Selected with the preference `presentation=full-bleed` or by the topic's own `presentation`; see [rendering](../rendering.md#presentation-modes-topicpresentation). Highlighting the spoken word changes only colour, background or decoration, so the caption layout never moves.

- **Look:** Captions: cinematic subtitles, white on a soft dark band, with no card. The spoken word turns warm gold. Hook: a restrained title over a thin gold rule.
- **Composition:** The picture was already edge to edge, so full-bleed changes the captions and hook, not the picture. Keep lower-thirds above the caption band and leave the provenance note visible.
- **Status:** validated on the existing fixture in full-bleed mode (keyframes and preflight). There is no production video in this mode yet.

## Not part of the style

Any topic's images, places, maps, layouts or cue times. The P017.7 fixture (`scripts/tests/fixtures/dc-topic.js`) uses **original procedural** imagery generated by its test and labelled as synthetic. It is an example, not a template.

**Status:** P017.7. Validated on a compact synthetic Telugu fixture only:
- Portrait and landscape layouts.
- Verified original assets.
- Manifest, licence and provenance refusals.
- Preflight, a 5.6 s preview, and cue, camera and transition checks.

There has been no full production, no real photographs, no licensed third-party media and no human editorial or licence review. Fonts are system fonts, with licensing review pending.
