# Style: 3D Explainer

Genuine three-dimensional explanation: real meshes in perspective, lit by a key light that casts real shadows, a camera that orbits and dollies, parts that rotate, separate into exploded views and glow when they matter. It is not isometric SVG, and it is not a video game: it is a calm product-visualisation studio for mechanisms. The [creative direction](../creative-direction.md) principles apply first; this file adds what is specific to 3D.

## Rendering approach (P017.8 decision)

- **Engine:** the kit's own compact WebGL2 renderer, with no third-party library. Chromium's WebGL2 runs on CPU through the bundled **SwiftShader**, pinned by the backend's flags (`--disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader`, recorded in the render configuration). No GPU, driver, download or paid service is needed. On the reference host, both the Microsoft Basic Render Driver and SwiftShader exposed WebGL2; SwiftShader was chosen because it ships with Chromium and behaves the same on every host.
- **Determinism:** every transform, camera and highlight is a pure function of time, so frames are checkpointable like every other style.
- **Cost (measured, i5-1145G7, 8 logical CPUs):**
  - 1080×1920 at about **0.64 s per frame**, so roughly 19 minutes for 60 s at 30 fps.
  - A **1.08 GiB** peak working set across the render's Chrome and Node processes.
  - Preflight draws every frame in 3D: about 80 s for 168 frames at 1080×1920.

## Visual identity

- **Studio:** a dark graded backdrop (top-lit gradient with vignette) and a matte floor that catches shadows. One warm key light (`light.dir`, `light.color`) with a 2048² shadow map (3×3 PCF), plus sky/ground ambient (`sky`, `ground`).
- **Materials** (`k3d.material(color, {metal, rough, emissive, opacity})`):
  - Brushed metals, matte plastics, and glass (opacity < 1, sorted, with a fresnel rim).
  - Colours are authored in sRGB and shaded in linear light.
  - Use emissive glow only for a highlighted part (`motion.highlight`).
- **Meshes** (`k3d.mesh`): `box`, `cylinder`, `plane`, `extrude` (any star-shaped outline) and `gear` (pitch radius m·z/2, so meshing pairs are dimensionally consistent). Build mechanisms from real parts, not billboards.
- **Labels and captions:** labels float over the render in the multilingual font (`title`, `spec` with an accent rule, `badge`). Captions sit in a smoked-glass card with an accent top rule, tall enough for two lines.

## Camera and motion

- **Camera:** `motion.planOrbit(shotId, startView, [views at the plan's camera moments], endView)` keys an orbit camera (`az`, `el`, `dist`, `target`, `fov`) to the plan's camera times.
  - `k3d.fitDistance(radius, fov, ctx.aspect)` frames a subject for portrait or landscape.
  - The 2D stage camera stays still; its keys only mark the plan's moments.
- **Mechanisms:**
  - `motion.mesh(z1, z2, deg/s)` spins meshing gears in opposite senses at the inverse ratio, with gear 2 offset half a tooth.
  - `motion.explode(rest, delta, t)` gives exploded-view offsets (positions or rotations).
  - `k3d.keys([[t, xyz], ...])` animates any vector.
- **Visibility and speech cues:** each 3D node can name a DOM **proxy** object. `motion.appear(proxyId, cue)` fades the node in through its proxy, so speech-cue visibility checks run on real 3D parts.
- **Preflight:** every frame, each proxy is resized to its node's projected screen bounds, so `required: true` applies `required-object-bounds` to the actual 3D geometry.
- **`dolly` transition:** the 3D camera pushes in toward its target while the frame dims, cuts, and the next shot pulls back out of the same darkness.

## Implementation

`scripts/styles/3d-explainer/` holds:
- `backend.mjs`: `createShotBackend` with the pinned SwiftShader `browserArgs`.
- `host.html`, `stage3d.css` and `kit.js` (`globalThis.k3d`, which registers the per-frame `frame` hook, `dolly` and the label styles via `globalThis.vcShotStyle`).
- The topic contract: `globalThis.explainer3dTopic = {shots, symbols(ctx), css, build(ctx)}`. Build 3D scenes with `k3d.scene(sceneId, {...})` and `k3d.node(sceneId, {...})`, using the shot's scene ID.
- The shared shot core gained an optional per-frame `frame` hook and a per-style `browserArgs` option. Other styles are unaffected.

## Self-review additions

- Is it genuinely 3D: parts with depth, lit and shadowed, seen in perspective, and moving in three dimensions?
- Do mechanical relationships hold (meshing ratio, containment, axes)?
- Does every camera move have a reason (reveal, follow the mechanism, settle), timed to the plan's moments?
- Is exactly one part highlighted at a time, and is it the one the narration names?
- Is the scene framed for its orientation, with no subject clipped?

## Full-bleed presentation (optional, P018.6)

Selected with the preference `presentation=full-bleed` or by the topic's own `presentation`; see [rendering](../rendering.md#presentation-modes-topicpresentation). Highlighting the spoken word changes only colour, background or decoration, so the caption layout never moves.

- **Look:** Captions: a smoked-glass card with an accent rule on top. The spoken word takes a tint of the shot accent. Hook: white type with the key word in an accent chip.
- **Composition:** The WebGL stage fills the frame. Frame the subject with `fitDistance` for the full-frame aspect. Labels float inside the text-safe area and leave before dolly pushes.
- **Status:** validated on the existing fixture in full-bleed mode (keyframes and preflight). There is no production video in this mode yet.

## Not part of the style

Any topic's machines, models, layouts or cue times. The P017.8 fixture (`scripts/tests/fixtures/3d-topic.js`, a gearbox) is an example, not a template.

**Status:** P017.8. Validated on a compact synthetic Telugu fixture only:
- Portrait and landscape layouts.
- Exploded view, meshing gears, highlights and the `dolly` transition.
- Preflight through proxies, a 5.6 s preview and a 1080×1920 measurement render.

There has been no full production and no human review. Gear teeth are a simplified (non-involute) profile. There is no anti-aliasing beyond what SwiftShader's multisampling provides, no textures and no imported models (glTF/OBJ). Fonts are system fonts, with licensing review pending.
