# Style: Tech Explainer

A calm, studio-lit technology lab. Clean isometric objects stand on a seamless sweep under one soft overhead light. Signals travel as precise lines and capsules, and every surface is matte and believable. It is the visual language of a premium product explainer: no sci-fi dashboards, no neon, no glowing hexagons. The [creative direction](../creative-direction.md) principles apply first; this file adds what is specific to this style.

## Visual identity

| Token | Value | Use |
|---|---|---|
| Surface | `#f3f5f8` → `#e5e9ef` | Studio sweep, object tops |
| Ink | `#13203a` | Text, dark devices, readouts |
| Ink 2 | `#4a5872` | Secondary lines, leaders |
| Line | `#c7cfdb` | Idle routes, hairlines |
| Signal (cobalt) | `#2e6bff` | The one active colour: data, the current path, focus |
| Amber | `#ffb020` | Rare emphasis: the exception, the warning, the "aha" |
| Mint | `#12b886` | Healthy or confirmed state |
| Coral | `#f0524f` | Failure or error state only |

- **One signal colour per shot.** Cobalt carries the explanation. Amber and coral are rare and always mean something.
- **Light:** one soft key light from above and slightly left, plus a floor falloff (the engine's `shot-light` overlay). Shadows are ambient-occlusion: soft, cool and directly below objects. Never use an offset paper edge or a hard drop shadow.
- **Materials:** matte white and grey solids, dark glass screens, and thin edge lines at about 30% ink. Use glow only for emissive parts (indicator lights, an active node), driven by the `--glow` channel. Never use it as decoration.

## Composition and depth

- **Studio sweep** (`art.studio`): a wall-to-floor gradient with a soft horizon and a perspective dot grid. Objects stand on it and sit in a place, not on a slide.
- **Isometric construction** (`art.iso`, `isoBox`, `isoCylinder`, `isoGrid`): explains structure, such as networks, machines, stacks and layers. Use it for systems; use flat front views for screens and interfaces.
- **Depth:** a backdrop plate, then a floor grid or traces, then the objects, then labels. Use camera moves for depth instead of parallax tricks.
- **Orientation:** topics receive `ctx.aspect` and `ctx.orientation` and compose for the stage's own shape. Stack vertically in portrait; place cause and effect side by side in landscape. Author plate symbols with a `0 0 1000 (1000/aspect)` view box so plate coordinates map exactly onto stage fractions.

## Typography and labels

Labels are set in the multilingual font (`--vc-font`), never forced to uppercase, so every script works. Monospace (`--mono`) is used only for readouts.

| `labelStyle` | Look | Use |
|---|---|---|
| `callout` | White pill with an accent dot | Naming a thing |
| `chip` | Solid accent pill | The key idea of the shot |
| `readout` | Dark panel with tabular monospace digits | Values, counts, states |
| `plain` | Large bold text | A one-word conclusion |

**Captions:** a white card with a 6 px accent rule along the top in the shot's colour, 42 px semibold, balanced lines. Its minimum height fits two lines, so the card never resizes the stage.

## Motion language

- **Machined, not bouncy:** entrances rise slightly and settle with ease-out (`rise`), or scale up from a point (`power`). There is no overshoot.
- **Signals draw:** routes and outlines draw on along their own path (`trace`, using the `--draw` channel and `pathLength="1"`). Packets travel at constant speed along a route (`travel`).
- **State changes glow:** indicator lights pulse on the `--glow` channel (`pulse`) when they become active.
- **Camera:** slow push-ins to the mechanism and settling pull-backs at the plan's camera moments (`planCamera`).
- **Transitions** (the outgoing shot owns them):

| Type | Effect | Use |
|---|---|---|
| `focus` | Rack focus: blur plus a slight push-in through the cut | Changing scale or subject |
| `iris` | An aperture closes on a point (`x`, `y`), then the next shot opens | Diving into a component |
| `scan` | A precise panel with a signal-coloured leading edge sweeps across (optional symbol) | Moving to the next step of a process |

## Kit (`scripts/styles/tech-explainer/kit.js`, `globalThis.techKit`)

- **Art helpers:** `iso`, `isoBox`, `isoGrid`, `isoCylinder`, `trace`, `packet`, `glowDot`, `device`, `studio`, `contact`, `leader`, `poly`.
- **Motion helpers** (`techKit.motion(ctx)`): `when`, `rise`, `power`, `trace`, `pulse`, `label`, `travel`, `planCamera`. Every `at` is seconds or a resolved-plan cue ID.
- **Engine channels:** `ctx.motion.stroke(id, keys)` and `ctx.motion.glow(id, keys)` write `--draw` and `--glow`.
- **Topic contract:** `globalThis.techTopic = {shots, symbols(ctx), css, build(ctx)}`, with the same shot, scene, cue and camera rules as Paper Explainer (see [visual production](../visual-production.md)). Helpers never choose a scene, metaphor or time.

## Shared shot core

This style's `engine.js`, `view.js` and `backend.mjs` are the shot core shared with [Whiteboard](whiteboard.md), [Flat Science](flat-science.md), [Data Storytelling](data-storytelling.md), [Kinetic Typography](kinetic-typography.md), [X-Ray Explainer](x-ray-explainer.md), [Documentary](documentary.md) and [3D Explainer](3d-explainer.md). Optional per-style `browserArgs` and a per-frame `frame` hook (3D Explainer). Optional `prepare({topicOptions})` returns script evaluated before the topic (Documentary uses it for verified media). Other styles use `createShotBackend({name, dir, host, kit, styleFiles, topicGlobal})` and register label styles, transitions and overlays through `globalThis.vcShotStyle`. Without hooks the engine behaves exactly as described here.

## Self-review additions

Add these to the universal art-direction questions:

- Is there exactly one signal colour carrying the explanation in each shot?
- Does every glow belong to something emissive?
- Do objects stand on the floor with contact shadows, or do they float?
- Do routes and data visibly move in the direction of the explanation, at the spoken word?
- Does it look like a premium product film rather than a slide, a dashboard or a sci-fi screen?

## Full-bleed presentation (optional, P018.2)

Set `topic.presentation = {mode: 'full-bleed', ...}` (see [rendering](../rendering.md#presentation-modes-topicpresentation)) to fill the frame with the studio, with no stage card and no caption panel.

- **Captions:** a dark glass pill over the light studio. The spoken word lights up in a tint of the shot accent, and upcoming words are dimmed. Only colour changes, so the text never reflows.
- **Hook:** a heavy ink headline with its key word in an accent chip.
- **Layout:** `ctx.aspect` follows the mode, so layouts adapt automatically. Labels designed for the framed stage may need to move clear of the hook and the text-safe edges.

**Status:** validated on short Telugu and English fixtures only. Not yet used in a production video, and not reviewed by a person.

## Richness helpers (optional, P018.3)

These are additions to `techKit.art` and `techKit.motion`. None of them is applied automatically. They are based on the P018.1 reference audit (3D Explainer, X-Ray, Exploded View): a dark graded studio, lit solids with specular rims, brushed metal, translucent shells that show the mechanism, emissive halos and light beams.

- **`darkStudio(w, h, {id, pool})`:** a graded back wall and floor, a key-light pool, a soft horizon, a top light and a vignette. Gradients only.
- **`litBox(o, spec, {base, id, metal, texture})`:** an iso solid from one base colour.
  - The faces are graded, with a sheen on the top and specular rims on the edges facing the light.
  - With `texture`, it gets an optional brushed-metal surface.
- **`glassBack` / `glassFront`:** a translucent shell. Draw the mechanism between the two calls so it reads as being inside.
- **`halo(cx, cy, r, {id})` and `beam(from, to, w1, w2, {id})`:** an emissive glow and a volumetric light cone, both from gradients with no blur filter.
- **`isoSpiral(o, {r0, r1, turns, z})`:** a flat copper coil in the floor plane. It works with `motion.trace` to wind on.
- **`textures(prefix)`:** baked brushed-metal and speckle patterns (`scripts/styles/shared/texture.js`).
- **Motion helpers:**
  - `cameraTravel(shotId, views)`: continuous camera travel through a shot.
  - `explode(parts, at)`: an exploded view. Parts separate along their own offsets and can regroup.
- **Layout with camera travel:** labels must leave before a camera push. Otherwise they are pushed outside the text-safe area, and preflight reports it.

**Example:** `scripts/tests/fixtures/rich-tech-topic.js` (wireless charging in English; `options.rich = false` for the plain comparison). It is an example, not a template.

**Cost:** measured on the reference laptop with 60 frames at 1080×1920, best of two runs. The rich composition took 13.5 s against 10.1 s plain, about 34 % more.

## Not part of the style

Any topic's objects, networks, devices, layouts or cue times. The P017.1 fixture (`scripts/tests/fixtures/tech-topic.js`) is an example, not a template.

**Status:** P017.1. Validated on a compact synthetic fixture only: portrait and landscape keyframes, preflight, a 6 s preview and cue/camera checks. No full production or human artistic review yet. Fonts are system fonts, and their licensing review is pending.
