# P018.3 Premium visual richness (Paper Explainer and Tech Explainer): evidence

**Status:** technical validation only. Artistic acceptance, any premium-quality judgement, and Telugu wording and typography review are owner and native-reader gates. Nothing here claims premium quality.

## What changed

- **`scripts/styles/shared/texture.js`:** a seeded, seamless texture baker (paper, gouache, brushed and speckle). It draws to a canvas once and is used as bitmap patterns.
  - It is loaded by the shared shot core and the Paper backend.
  - Only kits use it; no style gets textures automatically.
- **Paper kit additions:**
  - `light`, `cut`: directional cut-paper depth with crisp offset shadows and a lit rim;
  - `gouache`: volume;
  - `ridge`, `wave`, `strata`, `sky`, `haze`: layered environments;
  - `textures`;
  - motion: `travel` (camera), `burst` (particles under gravity), `billow` (smoke and ash).
- **Tech kit additions:**
  - `darkStudio`;
  - `litBox`: graded faces, sheen, specular rims, brushed metal;
  - `glassBack` / `glassFront`: translucent shells;
  - `halo`, `beam`: gradient emissives;
  - `isoSpiral`: coils;
  - `textures`;
  - motion: `cameraTravel`, `explode`.
- **Existing helpers are untouched.** All additions are opt-in.

## Unseen-topic compositions (test fixtures)

- **Paper, Telugu, "why does a volcano erupt?"** (`rich-paper-topic.js`, 9.2 s, three shots):
  - a layered landscape with the camera drifting in;
  - a dissolve to a cross-section: textured strata and a gouache magma chamber that glows on "hot";
  - a cut matched on the crater: the camera pulls back with a shake, embers burst, ash billows and lava runs down.
- **Tech, English, "how does a phone charge without a cable?"** (`rich-tech-topic.js`, 11 s, three shots):
  - a dark studio with a light beam; the pad lid turns to glass and the copper coil winds on, then glowing field loops rise;
  - an exploded phone (glass shell, battery, receiver coil, back) with a current trace;
  - a brushed-metal battery that fills and glows.
- **Before vs after:** each fixture renders the same story and cues with `options.rich = false`, which uses only pre-P018.3 means. The two are compared in `before-after-*.png` (plain on the top row, rich on the bottom).

## Results

- **`scripts/tests/test_richness.py --preview --frames 60`:** 20/20 pass.
  - All speech-cue checks pass.
  - Rich full-cadence preflight passes: Paper 276 frames, Tech 330 frames, 0 defects.
  - Baked textures are identical across fresh sessions.
  - Both 540×960 previews pass the media checks.
- **Render cost** (reference laptop; 60 frames at 1080×1920, best of two alternating runs, including browser start):

  | Style | Plain | Rich | Difference |
  |---|---|---|---|
  | Paper | 13.9 s | 21.7 s | about 56 % more |
  | Tech | 10.1 s | 13.5 s | about 34 % more |

  - Earlier single runs varied between +20 % and +78 %, so treat these figures as approximate.
  - Preview render time: Paper 80 s for 276 frames, Tech 62 s for 330 frames.
- **Defects found and fixed during composition:**
  - A duplicate symbol id made the battery close-up draw the wrong part.
  - Gully strokes leaked outside the cone, so they are now clipped to it.
  - Labels were pushed outside the text-safe area or into captions by camera pushes. Preflight found these; the labels now exit before each push.

## Limitations

- These are synthetic fixtures with synthetic timing. The facts are simplified, and the Telugu sentences need native review.
- In the Telugu hook, Nirmala UI places the vattu forms of అగ్నిపర్వతం below and to the right. This is the same at every weight, so it is the font's own shaping, not a defect. Readability still needs native review.
- The objects are still procedural SVG. There are no character figures or licensed assets, and there is no real 3D.
  - Paper's ash and embers and Tech's field lines are stylised.
  - Tech's coil is a flat spiral, not a wound wire.
- The overhead figures come from one machine with small samples.
- Only Paper and Tech have these helpers. Other styles are unchanged.
