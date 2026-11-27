# P018.4 Premium artwork and asset intelligence: evidence

**Status:** technical validation only. Premium quality is not claimed; artistic acceptance is the owner's gate.

## Technique chosen: component-built detailed SVG (Paper Explainer)

| Option | Decision | Reason |
|---|---|---|
| Detailed SVG built from components | **Chosen** | No cost, deterministic, every part independently animatable, works with any locale's labels and captions |
| Layered raster artwork | Not used | Needs a source: local image generation (no GPU, a new dependency) or downloaded assets |
| Verified open-license assets | Not used | A per-asset licence check and owner approval for each download. Remains a good option for real photos (Documentary) and models |
| Genuine 3D | Not used here | Already available in the 3D Explainer. A paper look gains nothing from it |

- **New `paperKit.art` helpers:**
  - `masonry`, `facade`, `foliage`, `water`;
  - `figure`: an articulated character with body, head, arm and eyelids, plus shoulder and neck origins.
- **New `paperKit.motion` helpers:** `pose`, `blink`.
- **Existing helpers are unchanged.**

## Unseen-topic composition: "How does a canal lock lift a boat?" (English, 11 s, `detail-paper-topic.js`)

- **valley:** a side elevation of a hillside, with two canal levels, a brick lock, a village of detailed houses, trees, terraced fields and a hedge. A narrowboat sits on the lower canal, and the lock keeper waves and blinks. A dashed route climbs on "climb".
- **lock:** a close cross-section of the chamber.
  - The scene is built from coursed brickwork with coping, timber gates with iron straps, balance beams, paddle gear with a rack and cog, and a narrowboat (portholes, painted panel, chimney, tiller, fenders, roof clutter).
  - The lower gate closes. The keeper winds the paddle gear, water gushes in, and the chamber fills with the boat rising on it.
  - The top gate swings open. The camera follows the boat up.

## Results

- **`test_richness.py --only paper,detail --frames 60 --preview`:** 19/19 pass.
  - Speech cues pass, and preflight passes on all 330 frames.
  - The preview passes its media checks.
- **Focused regressions:** `test_paper_kit` 7/7, `test_presentation` 43/43.
- **Cost** (60 frames at 1080×1920, best of two runs):

  | Composition | Time | Compared with P018.3 rich Paper |
  |---|---|---|
  | P018.4 canal lock | 12.9 s | about 19% less |
  | P018.3 rich Paper (volcano) | 15.1 s | — |
  | Plain Paper | 11.3 s | — |

  - The detail adds geometry but no per-frame filters.
  - The 540×960 preview took 43 s for 330 frames.

## Comparison

- **Against P018.3:** objects are now recognizable through their structure (windows, brick courses, gate straps, a boat's fittings). There is a character with a face and gestures, and the environment tells the story. P018.3 was mainly light and texture applied to simple shapes.
- **Against the reference** (Painted Story, Paper Collage, Flat Science bee):
  - **Closer now:** building detail, staged storytelling, and an in-scene character.
  - **Still behind:**
    - The illustration is hand-placed geometry with uniform line quality. The reference has painterly edges, richer colour variation and atmospheric lighting.
    - The characters are stiff: one moving arm, no body motion, no secondary motion.
    - The valley layout is still blocky. Its ground masses are rectangular and the subject is small.
    - The perspective is flat side elevation only.
    - There are no textural brush marks on objects.

## Remaining quality gap and next options

1. **A character rig with hierarchy:** child parts following their parents. This needs a small engine change and owner approval.
2. **Painterly edges:** baked irregular edge masks, plus per-object tone variation.
3. **Approved open-license asset sets:** for details too costly to draw, such as foliage and people. This needs owner approval and a licence review.
4. **Composition review:** thirds, foreground framing and scale cues, done before artwork, per [creative direction](../../../skills/video-creator/references/creative-direction.md).
