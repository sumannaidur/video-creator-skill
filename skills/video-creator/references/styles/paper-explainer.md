# Style: Paper Explainer

A handcrafted paper-diorama look: layered cut paper, organic edges, subtle grain and soft depth, one clear visual job per shot. This file is the style's visual grammar. Topics supply their own scenes and artwork.

"One clear visual job" means one focal idea, **not** a sparse picture. Picture a miniature set built by a paper artist and lit for a camera, not a flat infographic. The universal principles in [creative direction](../creative-direction.md) apply first; this file adds what is specific to paper.

## Visual DNA

| Token | Value | Use |
|---|---|---|
| Paper | `#F4EFE4` | Canvas, sheets |
| Ink | `#252A30` | Outlines, text |
| Terracotta | `#BF5942` | Attention, contrast |
| Forest | `#427361` | Explanatory accents |
| Mustard | `#DAB357` | Highlights, emphasis rings |
| Slate | `#59758D` | Secondary shapes |

Palette extensions per topic are fine, as long as they keep the warm paper base and ink outlines.

## Composition and depth

- **Plates:** build each shot from full-frame paper plates: sky or backdrop, ground, subject and a foreground that frames the subject without competing with it. Overscan the back plates by 12%. Cut-outs carry a small paper drop shadow. Add one grain overlay and a soft vignette over the stage. Check that no backdrop shows below or beside an exact-size plate at any camera position.
- **Parallax:** a camera wrapper moves the layers at different speeds (back 0.45× and 0.7×, foreground 1.2×). Labels must stay inside the clipped stage; artwork may crop.
- **Orientation:** in vertical 9:16, keep a fixed-height caption card below the stage so captions never reflow the picture.

## Art direction for paper

These are techniques, not required elements. Choose what serves the topic.

### Paper construction and material

- **Thickness:** important cut-outs have at least two layers: a darker underlayer offset towards the shadow side (`art.layered`), and an optional thin lighter edge on the lit side. Flat single-fill shapes look like vector icons.
- **Vary the paper:** use different "stocks" for different materials: smooth card for skies, fibrous or torn-edge paper for earth and organic forms, translucent vellum (low-opacity fills with soft edges) for light, glass, water and air, and crisp folded facets (two or three tones) for hard or angular objects.
- **Hand-cut irregularity:** slightly wobbly edges (`art.sheet` `wobble`), uneven repeats (no two windows, leaves or clouds identical) and paper fibres on large flat areas (`art.fibres`).
- **Construction details** sell the diorama: tabs, folds, overlapping strips, small pins or threads that hold up floating elements, and visible layering where a hole is cut through to a plate behind.

### Light, shadow and depth

- **Pick one key light per scene** and keep it consistent: every cast shadow falls the same way, and the lit edges face the light. Change the light only for a story reason (time of day, a beam entering).
- **Show light as paper.** Beams, glows and rays can be translucent vellum strips. Light should **affect the scene**: a beam brightens the surface it hits, a glow tints nearby layers, and a dark room has a pool of light.
- **Value plan:** decide the darkest and lightest area of each frame. Put the strongest value contrast at the focal point. Use darker, larger foreground silhouettes and lighter, lower-contrast distant layers (atmospheric perspective).
- **Depth stack:** aim for three to five depths in a typical shot, for example a framing foreground silhouette, the subject, a mid-ground setting, a distant layer and the sky. Give each depth its own parallax speed and shadow strength.

### Characters

- Build characters with `art.parts` as a paper puppet: head, torso, upper and lower arms, and simple eyes or brows on their own layers, so poses change on cue.
- Prefer three-quarter views that show the face at key moments. Simple cut-paper features (dot eyes, a curved mouth, raised brows) are enough to show curiosity, surprise and understanding.
- Give a returning character a new pose, expression or position each time.

### Explanatory scenes in a paper world

- Mechanisms (scattering, flows, forces, cycles) work best as **physical dioramas**: a cross-section box, a cut-away building, a magnifying-glass porthole, a tabletop experiment, a hand holding the object, or a zoomed-in world with its own floor and backdrop.
- Avoid placing waves, arrows and labels on a flat tinted background. If a chart-like comparison is essential, build it from paper objects (strips, stacks, ribbons) inside a setting.

### Using the vertical paper frame

- Tall settings suit a 9:16 stage: a sky over a skyline over a rooftop over a street, layers of soil, ocean depth, a tall machine, a vertical cross-section.
- Let light, objects or the camera travel vertically to connect the top and bottom of the frame.
- The caption card is fixed below the stage. Keep the stage's lower third meaningful (foreground, ground detail, reflections), not an empty floor.

## Paper self-review additions

Add these to the universal art-direction questions:

- Do the important objects have visible paper thickness and the right material?
- Is there one key light, with shadows falling consistently?
- Does light visibly touch the surfaces it reaches?
- Does any scene look like a slide or infographic on a flat background?
- Would the scene work as a photograph of a real paper diorama?

## Motion grammar

- **Reveals:** draw with directional clip reveals. Keep ambient motion small (sway, bob, drift, flicker), computed from the frame time.
- **Paper physics:** paper objects flutter, fold, unfold, pop up from a fold, slide on tabs, swing on threads and tear. Prefer these to generic fades and scales.
- **Entrances:** short slide-and-settle with a slight overshoot. Hold long enough to read.
- **Transitions:** carry motion through the cut. Push into a texture tile (`dissolve`), or sweep a printed sheet that previews the next setting (`sheet`). Never use a blank wipe.

## Captions and labels

- **Captions:** a cream card, ink text, 42 px semibold native-script font at line-height 1.5, a per-shot accent bar. Hold each caption through pauses. Animate captions in place only, never by translation.
- **Labels:** paper tags with a soft shadow, taking their words from the narration.
- **Fonts:** the current fonts are system fonts (*licensing review pending*). An openly licensed native-script font needs approval before distribution.

## Kit (`scripts/styles/paper-explainer/kit.js`, optional)

Reusable primitives generalized from the accepted P012/P013 work, available to topic modules as `globalThis.paperKit`. They produce markup, keyframes and object options for **your** composition. They never choose a scene, layout, object, metaphor or time, and nothing in them applies to other styles.

| Helper | Gives you | Origin |
|---|---|---|
| `art.fibres(seed, count, x, y, w, h, color?, opacity?)` | Paper-fibre hatching for flat areas | P013 `hatch` |
| `art.sheet(w, h, {seed, fill, stroke, wobble, fibreCount})` | A hand-cut paper sheet with an ink edge | P012/P013 cards, tickets, boards |
| `art.layered(cx, cy, rx, ry, {seed, fill, under, edge, depth})` | An organic cut shape over a darker offset underlayer (thickness) | P013 clouds, hills |
| `art.castShadow(filterId, w, h, {opacity, blur})` | A soft blurred shadow for a floating cut-out (use `flat: true`) | P013 aircraft shadow |
| `art.ring(w, h, {color, width, dash})` | A hand-drawn dashed emphasis ring | P013 price and fare rings |
| `art.connector(points, {dash, sag, width})` | A dashed string or explanatory link | P013 strings behind the price |
| `art.tileTexture(seed, palette, {count})` | A 1000×1600 tile texture for `dissolve` transitions | P013 tile dissolves |
| `art.parts(prefix, viewBox, {name: markup})` | Several symbols sharing one frame, so the parts of one object sit on different layers and move independently | P013 aircraft construction |
| Object option `labelStyle: 'tag' \| 'accent' \| 'plain' \| 'chip'` (+ `accent` colour); include `paperKit.css` in `topic.css` | Paper tag, tag with accent bar, bare large text, dark chip | P013 per-ID label CSS |

`paperKit.motion(ctx)` returns motion helpers. Every `at` is seconds **or a resolved-plan cue ID**; a cue ID registers the visibility check on that object (see [visual production](../visual-production.md)).

| Helper | Motion |
|---|---|
| `settle(id, at, from?, dur?)` | Slide-and-settle entrance with an eased landing |
| `label(id, at, off?)` | A tag rises into place and optionally leaves |
| `ring(id, at, off?)` | An emphasis ring drawn on left to right |
| `pulse(id, at, hold?)` | A glow swells, holds and fades |
| `draw(id, at, dur?, dir?)` | A directional draw-on for connectors and outlines |
| `planCamera(shotId, views)` | Camera keys at the plan's resolved camera moments for that shot. You give one `[cx, cy, zoom, ease?]` per moment; the plan's `intent` is never turned into values automatically |
| `when(at, id?)` | Resolves seconds or a cue ID |

Engine features that were already shared stay in `engine.js`: plates, parallax, grain, vignette, cut-out drop shadows, ambient motion, reveals, and the `dissolve` and `sheet` transitions.

## Richness helpers (optional, P018.3)

These are additions to `paperKit.art` and `paperKit.motion`. None of them is applied automatically: use them where a composition needs depth, material or atmosphere. They are based on the P018.1 reference audit (Paper Collage, Painted Story): layered torn-paper depth, crisp offset shadows, gouache and paper grain, stratified ground, sky with a sun halo, and haze between depth planes.

- **`light({dir})`:** one key light per composition, given as the direction the light travels. Shadows fall along it, and lit rims face against it.
- **`cut(d, {fill, depth, lit, texture})`:** a cut-paper layer with a crisp offset shadow along the light, the body, and a lit rim clipped to the shape. It uses no blur filter.
- **`gouache(d, {fill, id, lit})`:** volume for rounded objects. The lit side is warmer and lighter; the far side is darker.
- **`ridge`, `wave`, `strata`, `sky`, `haze`:** layered environments.
  - `ridge`: distant silhouettes.
  - `strata`: cut-paper bands for cross-sections, with pebbles.
  - `sky`: a gradient sky with a sun halo.
  - `haze`: aerial-perspective bands that push far layers back.
- **`textures(prefix)`:** baked paper, gouache and speckle patterns.
  - They are drawn once in the page by `scripts/styles/shared/texture.js` as seeded, seamlessly tiling bitmaps, not per-frame SVG filters.
  - They are deterministic: two fresh sessions produce identical data.
- **Motion helpers:**
  - `travel(shotId, views)`: continuous camera travel through a shot, so a held shot stays alive between cues.
  - `burst(ids, at)`: cut-paper particles thrown under gravity with seeded spread and spin.
  - `billow(id, at)`: smoke, ash or cloud that rises and grows.

**Example:** `scripts/tests/fixtures/rich-paper-topic.js` (a volcano in Telugu; `options.rich = false` renders the same composition without these helpers). It is an example, not a template.

**Cost:** measured on the reference laptop with 60 frames at 1080×1920, best of two runs. The rich composition took 21.7 s against 13.9 s plain, about 56 % more. The noise between runs is large (±20 %).

## Construction helpers (optional, P018.4)

Build recognizable objects from components rather than decorating basic shapes. Work in this order:
1. Silhouette.
2. Parts.
3. Structural detail: frames, sills, mortar, straps, bolts.
4. Small life: flower boxes, rope, chimney pots.

Everything shares one `light()`.

- **`masonry(x, y, w, h)`:** coursed brick or stone, with per-brick tone, chips, lit edges, coping and moss.
- **`facade(x, groundY, w, h)`:** a building with floors, framed windows with mullions, sills and lintels, optional shutters and flower boxes, a panelled door, quoins, a tiled roof and chimney pots.
- **`foliage(cx, cy, r)`:** a branching trunk and layered leaf clusters, from back to highlight.
- **`water(x, y, w, h, {id})`:** depth gradient, bank shadow and ripples.
- **`figure({...})`:** an articulated cut-paper character in a shared 300×640 viewBox.
  - Its parts are `body`, `head`, `arm` and `blink`, and it supplies transform origins for the shoulder and neck.
  - Place the parts as separate objects at the same position and width, and pass `origin` for the arm and head.
  - Motion: `motion.pose(id, [[t, deg]])` and `motion.blink(id, times)`.
  - The character is posed and expressive (cap, scarf, face, blush, eyes looking ahead) but stays still in place. Parts don't follow one another, so there is no walk cycle.
- **Topic-specific parts** (a boat, gates, a machine) stay in the topic and use the same `cut`/`light` vocabulary.

**Example:** `scripts/tests/fixtures/detail-paper-topic.js`, a canal lock in English. It is an example, not a template.

**Evaluated and not used:**
- **Layered raster art** needs a source: either local image generation (no GPU here, and a new dependency) or downloaded assets.
- **Open-license asset libraries** need a per-asset licence check and owner approval for each download.
- **Genuine 3D** belongs to the 3D Explainer style and would break the paper look.

## Not part of the style

Any topic's objects, metaphors, scene layouts or cue times. The P012 tree and P013 flight artwork are examples, not templates.

## Full-bleed presentation (optional, P018.2)

Set `topic.presentation = {mode: 'full-bleed', ...}` (see [rendering](../rendering.md#presentation-modes-topicpresentation)) to fill the whole frame with the paper scene, with no rounded stage and no caption panel.

- **Captions:** a cream paper strip in ink type. The spoken word gets the shot accent colour and a mustard marker stroke.
- **Hook:** large ink type on paper strips, with its key word in the accent.
- **Layout:** compose for the full frame. Keep labels clear of the hook and captions, and use `captionPosition: 'upper'` on shots whose subject sits low.

**Status:** validated on short Telugu and English fixtures only. Not yet used in a production video, and not reviewed by a person.
