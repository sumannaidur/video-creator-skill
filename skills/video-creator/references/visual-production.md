# Visual production

Author each topic as a **topic module**: original inline SVG artwork plus motion data, evaluated by the shot engine. The style file supplies the visual grammar; the topic module supplies every topic-specific shape, scene and cue.

## Original construction and adaptive detail

For important artwork, apply [procedural craftsmanship](procedural-craftsmanship.md): establish projection, structural components, material and lighting, spatial relationships and visible action. Prioritize a representative hero frame before multiplying weak artwork across shots.

Build important objects from recognizable structure, not generic placeholders. Identify functional parts, proportions, view, material, attachment points and how the object interacts with its surroundings. Use existing SVG paths, gradients, symbols, procedural textures and motion helpers; for genuine 3D use existing WebGL geometry. Construct independent moving components and explicit contact anchors where the action needs them. Keep reusable functions parameterized where useful; use scoped IDs and seeded variation. Do not introduce a framework or a universal rig for a single shot.

Compose the environment as a coherent layout: ground or support plane, appropriate architecture and props, foreground occlusion, background depth, coherent lighting and shadows. Match the level of detail to delivery size: silhouette and broad tonal masses for distant objects; functional construction, surface variation and joints for close focal objects. Prefer inexpensive repeated symbols and selective detail over large filters or thousands of invisible elements. A close-up may require distinct artwork, not simply enlarging a wide shot. For diagrams and typography, precision and legibility take priority over decorative scenery.

Keep scene code editable, separate reusable construction from project placement and timing, and preserve source in the project. The existing project retention contract remains in force until safe cleanup is implemented. Do not delete intermediate files manually as part of this phase.

## Topic module contract (as implemented by the experimental engine)

`globalThis.paperTopic = { shots, symbols(ctx), css, build(ctx) }`

- **`shots`** is a list of `{id, scene, phrases:[first,last] | start, accent, transition}`.
  - The default cut is the midpoint of the pause between phrases.
  - An explicit `start` (seconds, or `{phrase, offset}`) allows several shots within one phrase.
  - Transitions belong to the outgoing shot: `dissolve` (needs a texture symbol) or `sheet`.
- **`symbols(ctx)`** returns `<symbol>` markup. Give symbol IDs a different prefix from object IDs, because a collision breaks lookups.
- **`build(ctx)`** returns `{scenes, cameras, checks}`. Use `ctx.motion` helpers: `track`, `show`, `showHide`, `reveal`, `ambient`, `emit` and `cue(id, phraseIndex, offset)`. A cue must make its object invisible before the cue time and visible after it.
- **Speech cues from the resolved plan** (render with `--plan`; see [rendering](rendering.md)): `ctx.motion.speechCue(cueId, objectId?)` returns the cue's time in seconds and registers the visibility check on the plan's object (or the one you name). `ctx.cue(cueId)` returns the time without a check, for anything else you want to time to speech. `ctx.plan` exposes the resolved shots and cues. Use these instead of typing speech timestamps; every plan cue with an `id` must be used. With a plan, `shots` lists the plan's shot IDs in order with only `scene` and `transition`: boundaries come from the plan, and a `start` or `phrases` is rejected. How an object appears, moves and leaves stays entirely your choice.
- `cue(id, phraseIndex, offset)` remains for legacy topics rendered without a plan.
- **Production checks (P024.1B, shared shot-core styles):** preflight also runs `ink-legibility` (board lettering), `data-marks` (objects with `dataMark: true` may not use overshoot, settle or anticipate) and `mechanism` (`checks.ratios` returned by `build`; `motion.angle(id)` gives a track's rotation). Legacy optional Blender layer interface exists but is excluded from V3 production.
- **Shared motion primitives (optional, P022.2):** `globalThis.vcMotion` adds track curves (`inOut`, `outQuart`, `anticipate`, `overshoot`, `settle`, `hold`) and key builders (`arrive`, `follow`, `stepped`, `stagger`, `jitter`, `sample`). See [creative direction](creative-direction.md) for when each serves the story. The original curves are unchanged.
- **Style kits:** a style may ship optional helpers for its own look. Paper Explainer's is `globalThis.paperKit` (see [Paper Explainer](styles/paper-explainer.md)); its motion helpers accept cue IDs, and `planCamera` places camera keys at the plan's camera moments. Kits are building blocks, not templates; other styles are not bound by them.
- **`checks`** optionally sets `keyframes`, `repeatAt` and `absentAfter`.
- **`composition`** (optional, P024.13) declares, per keyframe name, what `--keys-only` must verify geometrically: `{name: {regions: [{id, box?: [x, y, w, h]}], annotations: [{id, target, leader?}], allow: [{check: 'crop' | 'overlap', id, with?, reason}]}}`.
  - A **region** is protected evidence: an object, or a fractional box within it. It must be visible, stay inside the stage and be free of labels, captions and the hook.
  - An **annotation** names its label's target region. Label contrast is checked only on an opaque, solid label background. A label beside its target is anchored only through a declared SVG `leader` path or line whose two ends reach the label and the target.
  - **`allow`** records an intentional crop or overlap with a written reason.
  - A failure stops the render and writes `keyframes/composition-failure-<name>.json`. Checks that cannot be decided are reported as `unsupported`, never passed: 3D mesh occlusion, contrast on gradient or translucent labels, and anchors without a leader. The result is stored per keyframe in `keys-evidence.json`.
  - Supported by the shared shot core (eight styles, 3D on projected proxies) and Paper. These are geometric checks only; they say nothing about artistic quality.
- **Timing:** every state is a pure function of time. Seed any variation; no randomness at render time.

## Production loop

1. Build one shot at a time. Render keyframes only with the packaged renderer (`scripts/render.mjs --keys-only`; see [rendering](rendering.md)). Cue, layout and repeatability checks run automatically.
2. Apply the [keyframe review gate](creative-direction.md#keyframe-review-gate) before advancing. Follow the approved correction budget and stop point.
3. **Before the preview, run the visual preflight** (`scripts/preflight.mjs`; see [rendering](rendering.md)). It inspects every output frame time, including mid-move frames that keyframes miss (such as a label still visible while the camera pans away), without capturing images. Fix every defect; then render with `--preflight <out>/preflight.json`. Mark art that must stay fully in frame with `required: true`; undeclared art may bleed or move off-screen on purpose.
4. Render a low-resolution preview at delivery aspect ratio. Review the whole sequence in order, with narration and intended sound where available: pacing, physical contacts, continuity, camera moves and transitions. Record untested sound or motion as unreviewed, not passed. Fix material problems within the correction budget before Full HD, checkpointed, with one writer per checkpoint folder.

## Rich artwork: technique selection (P024.16B)

For V3 use the cheapest original local procedural technique that meets the artistic need. If review reveals weak art, refine construction, composition or choose a more achievable stylized approach within existing capabilities; do not escalate to Blender, OpenVINO, new dependencies or downloaded artwork. The following legacy technique table documents historical capabilities and measurements only; it does not authorize their use in V3. Keep labels, captions, cues and moving explanatory parts in the style's own renderer.

| Technique | Use when | Measured cost (reference laptop) | Limits |
|---|---|---|---|
| **Native procedural** (SVG styles; WebGL for 3D) | Default. Mechanisms, motion, diagrams, labels | WebGL about 0.7 s per frame at 540×960. SVG preflight about 5 s for about 900 frames | Gradient and flat materials. WebGL has no textures, HDRIs or model import |
| **Blender static layers** (`scripts/blender_layers.py render` + `pack`, then `techKit.art.raster`) | Materials carry the explanation: a product, metal or glass (E26) | About 10 s per layer at 810×1440 | Parts move only by 2D transforms; use an orthographic, axis-aligned camera. Verified in Tech Explainer only |
| **Blender with verified external assets** (CC0 HDRI, scanned models, textures, plus your own geometry) | An environment carries the story and procedural art failed review (E41: the WebGL coast read as a pale floor) | E41 hero, 540×960, EEVEE at 64 samples: 24.5 s render, 30.5 s wall, 2.57 GB peak for about 42 MB of 1k assets | Delivered as a static still or backdrop layer. Per-frame animated Blender renders are untested; budget about 25 s per frame before trying |
| **Verified photographs** | Real events and places | — | Documentary only, through its enforced asset manifest |

**Selection:**
- **Artistic quality:** decide from keyframes, not expectations.
- **Factual accuracy:** a rendered scene with real assets is still an illustration unless it depicts a specific sourced record, so never present it as a photograph.
- **Rights:** only verified licences are allowed.
- **Cost:** check memory and render time against the budget, close Blender before rendering video, and run long renders as reproducible terminal commands.

**Genuine 3D:** the 3D Explainer's explanatory parts stay real geometry (WebGL meshes). For V3 construct surroundings procedurally within supported capabilities; report limitations rather than substituting Blender layers.

**Rights and provenance:**
- For V3, original local artwork is the default; only explicitly authorized user media is permitted as an exception. The following provenance requirements apply to authorized media; legacy download guidance is not permission to download assets.
- Check the licence on each asset's own page, not the site in general.
- Ask the owner before every download, giving the files, source, size and licence.
- Keep the files inside the project (for example `assets/`).
- Record `assets/provenance.json`: for each asset, the id, licence, source page, authors, and every file's URL, bytes and SHA-256 (the format used in E41).
- Name the source assets in the scene script's header, because rendered layers inherit their provenance.
- Documentary images additionally go through the enforced `video-creator.assets` manifest.
- Unclear rights mean the asset is not used.

**Formats:**
- **Verified:**
  - Blender 5.2.2 imports glTF 2.0 (`.gltf` + `.bin` + JPEG textures) and Radiance `.hdr` environments (E41).
  - `blender_layers.py` outputs PNG and JPEG layers as data URIs.
  - Documentary renders PNG, JPEG or WebP from its manifest.
- **Not verified here** (Blender supports them, but they haven't been tested): FBX, OBJ, USD, Alembic, EXR environments, `.blend` libraries, and raster layers in styles other than Tech.
- **Unsupported:**
  - Model, texture or HDRI import in the WebGL 3D engine.
  - Direct video files; use frame sequences, in Documentary only.

## Layout rules learned so far

- **Pans:** hide a zone's labels before the camera leaves that zone.
- **Camera bounds:** keep the camera inside the artwork. For an exact plate, keep |offset| ≤ 0.5 − 0.5/zoom.
- **Font clearance:** Devanagari marks and large numerals need line-height ≥ 1.4 in labels.
- **Duplicate helpers:** watch for duplicate helper names when one module holds several scenes.

Artwork must be original or listed in a rights manifest with source, license and attribution. *Asset rights manifests for visuals are missing*; procedural SVG drawn in the module counts as original work.
