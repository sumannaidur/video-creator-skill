# Style: Flat Science

Expressive flat vector science. It is a world of organic shapes, coded colour and visible mechanisms, where the viewer zooms from the everyday into the invisible and watches the process happen. It is not a textbook diagram, a slide or a recoloured paper scene. The [creative direction](../creative-direction.md) principles apply first; this file adds what is specific to Flat Science.

## Visual identity

- **Field:** a calm mint field (`#e8f3f1` → `#d7ebe8`) around a stage with rounded corners. Deep indigo (`#1f2a5a`) is the "inside" colour, seen only through the magnify lens.
- **Forms:** organic blobs and simple geometry with **one-step shading**: a darker crescent on the shadow side and a small light sheen (`art.organic`, `art.ball`). No outlines, no grain, no glow, no drop shadows. Depth comes from overlap, scale and value.
- **Colour coding:** each substance or role keeps one hue for the whole video (`fsKit.HUES`): water `#2f8fe0`, oxygen `#e5484d`, carbon `#6b7280`, energy `#f5b301`, life `#2bb673`, sugar `#ff8a3d`, violet `#7c5cff`, ink `#1c2540`. Colour carries meaning, so never use a coded hue for decoration.
- **Hierarchy:** the mechanism is the brightest, most saturated thing in the frame. The surroundings (tissue, field, ground) are paler versions of related hues.

## Scientific storytelling

- **Magnification:** go from the familiar object to its inside (leaf → cell → chloroplast) with the `magnify` transition. Plan the zoom point on the object, not the centre of the frame.
- **Cross-sections:** concentric organic layers (`art.section`) cut an object open; label the layers that matter.
- **Particles and molecules:** `art.particles` and `art.molecule` are symbolic and not to scale. Say so in the guardrails.
- **Flows:** `art.flow` draws a path whose dots keep marching (driven by `--draw`) for as long as the process runs.
- **Transformations:** `motion.morph` shrinks reactants as products grow, and `motion.emit` sends products out along a direction. A change of state should be visible as a change of shape and colour, at the word that names it.

## Typography and labels

Labels use the multilingual font (`--vc-font`) at weight 700–800 and are never forced to uppercase, so every script works (validated with Telugu).

| `labelStyle` | Look | Use |
|---|---|---|
| `key` | Pill with the substance's colour dot | Naming a colour-coded substance (a legend in place) |
| `tag` | Solid colour block with white text | A key stage or result |
| `title` | Large bold text in a colour | Naming the object of a shot |
| `pointer` | Underlined text | Pointing at a part |

**Captions:** a rounded card tinted with the shot's accent colour, inside a 3 px accent ring; 42 px, weight 650. The minimum height fits two lines, so the card never resizes the stage.

## Motion

- **Mechanism-driven:** things move because the process moves them: flows run, products are emitted, structures grow.
- **Entrances:** organic growth from the object's own centre with a soft overshoot (`grow`; set `origin` for full-frame symbols).
- **Camera:** gentle push-ins toward the mechanism and easing pull-backs at plan moments (`planCamera`).
- **`magnify` transition:** the camera zooms toward `x`, `y` while a white lens rim grows. After the cut, the next shot opens inside the expanding lens over the deep field. Labels must leave before the zoom (hide them at the shot end minus `lead`), or they're carried off the stage.

## Implementation

`scripts/styles/flat-science/` holds:
- `backend.mjs`: `createShotBackend` on the shared shot core.
- `host.html`, `science.css` and `kit.js` (`globalThis.fsKit`, which registers `magnify` and the label styles via `globalThis.vcShotStyle`).
- The topic contract: `globalThis.flatScienceTopic = {shots, symbols(ctx), css, build(ctx)}`, with `ctx.aspect` and `ctx.orientation` for portrait and landscape composition.

## Self-review additions

- Could a viewer tell the actors or states apart by silhouette or structure? Carry an identifying feature through the transformation and mark simplified geometry that could be read literally.
- Does every coded colour mean the same thing everywhere in the video?
- Is the mechanism (the moving part) the clearest thing in each shot?
- Do flows, emissions and transformations happen at the word that names them?
- Are symbolic particles and molecules marked as not to scale in the guardrails?

## Full-bleed presentation (optional, P018.6)

Selected with the preference `presentation=full-bleed` or by the topic's own `presentation`; see [rendering](../rendering.md#presentation-modes-topicpresentation). Highlighting the spoken word changes only colour, background or decoration, so the caption layout never moves.

- **Look:** Captions: a rounded navy pill. The spoken word lights up mint. Hook: heavy white type with the key word in a mint pill.
- **Composition:** The deep field fills the frame. Centre the specimen or cell, and use the magnify transition to change scale. Keep orbiting labels clear of the hook in the first shot.
- **Status:** validated on the existing fixture in full-bleed mode (keyframes and preflight). There is no production video in this mode yet.

## Not part of the style

Any topic's organisms, molecules, layouts or cue times. The P017.3 fixture (`scripts/tests/fixtures/fs-topic.js`, photosynthesis) is an example, not a template.

**Status:** P017.3. Validated on a compact synthetic Telugu fixture only: portrait and landscape, preflight, a 5.6 s preview, cue, camera and transition checks. There has been no full production and no human artistic or scientific review. Fonts are system fonts, with licensing review pending.

## Reference-derived craft (P023.3, optional)

- **Flat depth without gradients:** `art.litForm(d, color, {dir})` gives one dark crescent on the shadow side and a lit rim sliver. It uses fills only, so union shapes such as cloud puffs show no inner outlines.
- **Light as flat steps:** `art.halo` (stepped concentric discs) and `art.flare` (four-point flare) replace blurred glows. `art.starfield` provides seeded fine stars.
- **Palettes:** `PALETTES` (`space`, `ocean`, `cell`). Choose one per video and keep its roles fixed.
- **Transformations:** show the change in one scene when the science is a change (a cloud collapsing into a disc, a core igniting). Use existing motion curves. Mark simplifications and scale in the plan's guardrails.
