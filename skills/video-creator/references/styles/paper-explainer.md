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
- **Depth stack:** use as many depths as the shot needs, often a framing foreground silhouette, the subject, a mid-ground setting, a distant layer and the sky. Give each depth its own parallax speed and shadow strength.

### Paper craft (reference-derived, P023.1B)

Observed in professional layered cut-paper illustration (for example Owen Gildersleeve's work): the shadows, value steps and cut edges carry most of the craft. Use these where they serve the shot:

- **Soft, directional paper shadows:** darkest at the cut edge, wide and faint further out, all along one light. `paperKit.art.piece(d, {fill, lit, depth})` stacks a filter-free penumbra under `cut`. Avoid per-frame blur filters on animated pieces: Blur measured about 2.5× the render cost; the stacked penumbra costs about the same as plain cut paper.
- **Hand-cut silhouettes:** `art.deckle(points, seed, amp, step)` turns a polygon into a slightly irregular cut outline. Intricate, recognisable silhouettes (hair, beard, leaf serration, a bee's legs) beat geometric primitives. Keep the irregularity small; this is crisp cut paper, not torn paper.
- **Cut-edge core:** coloured paper shows a lighter core where it is cut. `piece` draws it by default (`core`); set `core: 0` for white or very light paper.
- **Folds:** `art.folded(base, tip, halfWidth, {fill})` gives petals, leaves, wings and paper flaps a crease, with one half lit and one shaded.
- **Vellum:** `art.vellum(d, {lines})` makes translucent tracing paper for wings, vapour, light, water spray and glass.
- **Value steps toward a focus:** professional pieces often pull the eye with nested layers that step from dark outside to bright at the core. Build it yourself, or use `art.recede(w, h, cx, cy, {colors})` for tunnels, burrows, cells or portals. A vignette made of darker paper tones around one lit subject does the same job in a constructed scene.
- **Macro framing for small processes:** when the story happens inside something small (a cell, a seed, a drop), make that thing the stage. Fill a third or more of the frame with it, let neighbours crop at the edges, and stage the change there (for example: empty cell, then a nectar drop, pale watery nectar, vapour rising off, deep amber honey, a wax cap).

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

- At the reveal, can you see which physical layer lifts or shifts? Use an exposed edge, a fold or consistent contact shadow to make that relationship readable.
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
- **Hand-animated articulation (optional, P022.2):**
  - Figure parts and hand-worked mechanisms can hold poses on twos (`vcMotion.stepped(keys, 12)`), which reads as cut paper moved by hand.
  - Heavy parts wind up and settle (`anticipate`, `settle`); attached parts follow through (a head answering an arm, a beam after a gate).
  - Keep the camera, water and light smooth, so stepped parts feel tactile rather than choppy.
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

## Spatial layout helper (P033.1, optional)

For a physical setting with a level one-point view, `art.groundPlane({cx,horizon,focal,eyeHeight,near})` shares one ground projection across scenery, paths and object placement. Coordinates `cx` and `horizon` are SVG viewBox units; `focal` is positive in the same units, `eyeHeight` and positive depth `z` are in consistent world units. `near` defaults to 0.1 world units. It does not draw or select a setting.

- `project(x,z,h=0)` gives screen x/y and scale (screen units per world unit). Equal-height objects get smaller with distance and their bases approach the horizon.
- `polygon([[x,z],...])` returns a closed SVG ground footprint path; use for floors, paths, banks, supporting surfaces or cast shadow footprints.
- `upright(x,z,markup)` places your own upright art, drawn in world units with its base at (0,0), above the ground anchor (negative local y). Draw far objects before near ones where their silhouettes overlap. For large volumes, construct the visible faces with the shared projection rather than treating the whole object as a billboard.

Example: `const g = art.groundPlane({cx:800,horizon:320,focal:650,eyeHeight:1.7});` Then design meaningful scenery, structural faces, footpaths and placements for the actual subject. Use coherent depth, varied silhouettes and appropriate detail. Avoid uniform rows or scatter as a substitute for art direction. Use existing layers, sky, haze, foliage, masonry and piece helpers selectively; separate movable parts from static plates. This is not genuine 3D, does not perform clipping or automatic occlusion and assumes a level camera. A new viewpoint requires its own authored composition. No new dependency.

### Grounded lighting (P033.2)

`g.shadow(x,z,{radius,height,direction,lengthPerHeight,softness,opacity,color})` returns four filter-free SVG paths on the same ground plane as `g.upright`. Radius and height are world units. Direction is the horizontal direction away from the light, [dx,dz], not the screen-space `art.light().dir`. Length equals height times lengthPerHeight; softness 0..1 controls the layered footprint edges. Color is six-digit hex. Use height:0 for contact only. Draw before the object and ensure the entire footprint stays beyond the near plane; caller handles surface clipping, obstacles, slopes and depth order. The capsule is a stylized approximation for upright objects, not a shadow of an arbitrary silhouette. For complex objects draw the actual projected footprint yourself. Do not cast a shadow through walls or off the platform.

Choose a consistent world light direction and derive appropriate screen directions for paper edges per view. Use existing gouache for curved surfaces, piece/penumbra for paper thickness, and haze for distant layers; do not confuse paper-edge offsets with world-ground shadows. Construct a recessed opening from actual jamb, sill, interior planes and visible depth; shade surfaces according to the chosen light. These are authored scene decisions, not automatic geometry. No claim of photorealistic lighting.

### Alternate horizontal viewpoints (P033.3)

`art.worldCamera({x,z,yaw,cx,horizon,focal,eyeHeight,near})` wraps the existing ground projection in a level camera transform. World x/z locate the camera; yaw is degrees clockwise from +z toward +x (90 faces +x, 180 faces -z). With x=z=yaw=0 it matches groundPlane. Supply world coordinates directly to project(x,z,h), polygon(points), upright(x,z,markup) and shadow(x,z,options); shadow direction is a world horizontal vector and rotates with the view. face([[x,z,h],...]) returns a projected closed path for an authored planar surface. depth(x,z) returns camera-forward distance for ordering. Use the same object dimensions and world light across shots.

Construct visible faces for each viewpoint, draw far surfaces before near where appropriate, and author orientation-specific upright artwork; upright remains a billboard. Points behind the near plane are rejected, not clipped. No automatic face visibility, polygon clipping, perspective texture mapping, pitch, roll, continuous camera animation or dynamic occlusion. Use existing genuine 3D for requirements exceeding this level projection. Prefer purposefully selected shots, not arbitrary rotation. Keep static plates separate from independently animated parts when motion is required.

### Time-dependent geometry (P033.4A, optional)

Use `ctx.dynamic(id, viewBox, draw, x, y, width, layer, extra)` when the actual shape changes over time. The fixed SVG viewBox has four finite numbers with positive width and height. `draw(t)` synchronously returns trusted original SVG children, at most 65,536 characters per evaluation. An empty string is allowed. Time is absolute clamped timeline seconds. Derive geometry from a pure shared state function: no wall clock, unseeded randomness, previous-frame integration, DOM reads, external requests or asynchronous work. Use existing symbols and transform tracks for static geometry. Scope SVG IDs uniquely. Topic code is trusted executable code; this is not a sanitizer or sandbox.

For example, a rope can return a path whose endpoint depends on the drum angle. Use `{plate:'exact',flat:true}` with centered position and 100% width for a full-stage viewport; ordinary objects can use their own fixed viewBox and placement. Tracks, reveals and ambient motion still apply to the outer object. Geometry is evaluated on every renderAt, including inspection and arbitrary seeks; unchanged markup avoids DOM replacement. Keep dynamic objects small and independent, not a full-world redraw. Preflight still checks outer object bounds rather than all generated inner shapes. Review actual keyframes and motion. No automatic physical simulation, camera re-projection or hierarchical rig in this slice.

### Connected components (P033.4B)

`art.rig2D(nodes)` compiles 1–128 uniquely named nodes, each `{id,parent?,offset?,pivot?,anchors?}`. Parent may be null (root); offset and pivot default to [0,0]. Anchors map names to local [x,y] coordinates. All units are SVG units, +y down, positive rotation clockwise. A node's pivot maps to its offset in its parent's local space. To connect a child, set its offset to the parent's local anchor and its pivot to the child's own contact point. Define nodes in any order. Cycles and unknown parents are rejected.

`rig.evaluate({arm:{angle:30},forearm:{angle:65}})` returns a fresh pose with `matrix(id)` (SVG affine matrix), `point(id,[x,y])`, `anchor(id,name)` and `group(id,markup)` (absolute SVG transform wrapper). Local pose overrides are angle in degrees, positive uniform scale and offset. Draw absolute groups as siblings, not nested, to avoid applying transforms twice. Use the same evaluated pose to draw rope endpoints, attached tools and other dependent geometry with `ctx.dynamic`. Derive pose from absolute time; no previous-frame state is stored. This is forward kinematics only: no inverse kinematics, collision, automatic anchor constraints, dynamics, or 3D projection. The author must choose matching local anchors and offsets, joint angles, draw order and contact timing.

### Continuous world camera (P033.4D)

`art.cameraPath({cx,horizon,focal,near?,keys,target?})` compiles up to 256 strictly increasing absolute-time keys `{t,x,z,eyeHeight,yaw?,ease?}`. Keys specify complete camera poses; yaw defaults to zero, and the destination key selects `linear` or `smooth` (default). Interpolation clamps to the first/last pose outside the key range. Author unwrapped yaw deliberately (350 to 370 crosses north; 350 to 10 rotates the long way). Optional pure `target(t)` returns a moving world [x,z] and replaces interpolated yaw with the horizontal bearing; targets closer than near are rejected. Target sampling uses requested absolute time, not clamped key time. `poseAt(t)` returns the camera pose; `at(t)` returns the existing worldCamera projection helper. Keep focal length, horizon and near fixed per path.

Inside `ctx.dynamic`, evaluate the same camera path and world state at absolute t for every moving viewpoint-dependent component. Reproject world geometry; don't scroll screen-space art and also move its world coordinates. Static screen overlays need no redraw. Perspective depth produces parallax naturally. This helper is level only: no pitch, roll, automatic clipping, visibility, collision or occlusion. The author owns near-plane handling, depth ordering, target continuity and animation cost. Do not rebuild an entire world unnecessarily; measure actual motion and memory.

### Continuous velocity through camera keys (P033.5A)

Set `interpolation:'continuous'` on cameraPath to opt into time-aware, shape-preserving cubic Hermite interpolation of x, z, eyeHeight and unwrapped yaw. Interior key slopes use a weighted harmonic mean of neighboring secants; slopes are zero at coordinate reversals and at the clamped path endpoints. This prevents coordinate overshoot and gives continuous first derivatives, not constant speed or continuous acceleration. A deliberate stop is possible with repeated positions; interior keys on a monotonic coordinate need not stop. The existing default `interpolation:'segment'` retains destination-key linear/smooth easing exactly. In continuous mode per-key ease is validated but does not select the interpolation. A target callback still overrides yaw; its continuity is the author's responsibility. Coordinate bounds do not guarantee obstacle clearance along the curved path. Sample the actual trajectory against scene geometry and review rendered motion. No renderer change or new dependencies.

### Articulated characters (P034.1)

`art.characterRig({height:640,proportions:{}})` builds a reusable 16-node front-view skeleton around a pelvis origin, with torso, neck, head and bilateral upper-arm, forearm, hand, thigh, shin and foot nodes. Anatomical left is screen-right in the neutral front view. Local +y points down; positive angles rotate clockwise. Height is a reference scale, not a promise of exact standing height. Proportions are positive fractions of that reference scale; available keys are torso, neck, head, shoulder, hip, upperArm, forearm, hand, thigh, shin, foot and ankle. `dimensions` reports local dimensions and `joints` lists node IDs.

`actor.evaluate(pose)` gives rig2D matrices, points and named anchors (elbow, wrist, grip, tip, knee, ankle, sole, toe, neck, chest, crown, eyes and pelvis centre on their respective parts). Only pelvis may translate or scale; other nodes rotate, preserving limb lengths. `actor.draw(pose,parts,order)` draws independently authored local SVG part strings in explicit back-to-front order using absolute transforms. Missing parts are allowed; the order must include all supplied parts. Prebuild detailed artwork once, then use a pure time-dependent pose inside ctx.dynamic. Define joint-centered shapes, overlap seams, distinguish near and far limbs and author the intended silhouette and facing. This is anatomy/forward kinematics, not finished character artwork, IK, walking, balance, joint limits or automatic depth sorting. Existing figure() remains unchanged.

### Two-bone inverse kinematics (P034.2)

`art.twoBoneIK({target:[x,y],lengths:[a,b],bend:1})` solves two positive-length bones in the first joint's parent axes, relative to that joint. Neutral bones point down (+y); returned `angles` are local clockwise degrees for the first and second joint. `bend` is +1 or -1 and selects the second joint's rotation sign. The result includes `endpoint`, `reachable` and `error`. Unreachable targets clamp to the nearest radial reach (including the inner radius for unequal lengths); a coincident target uses +y as a deterministic fallback. Fully folded/extended poses are singular. Do not infer anatomical limits or continuous angle values across singularities from the solver.

`actor.solve(pose,{side:'left',limb:'arm',target:[x,y],bend:1})` returns a new `pose`, stage-space `endpoint`, `reachable` and `error`. Side is left/right and limb arm/leg. Targets are wrist/ankle joint origins, not grip/sole offsets. The solver accounts for parent rotation, pelvis translation and uniform scale; it preserves other pose entries without mutating input. Chain solves can be composed sequentially. Choose wrist/foot orientation and target offsets separately when maintaining grip or sole contact; inspect actual contact and joint silhouettes. This is planar position IK, not automatic joint limits, collision, balance, foot planting, grip orientation or dynamics. Explicitly choose bend direction and reachable targets; report residual errors rather than stretching limbs.

### Steady procedural walking (P034.3)

`art.walkCycle(actor,{origin:[x,groundY],stride?,period:1.2,stance:.62,lift?,bob?,armSwing:18,direction:1,scale:1})` returns `at(t)`, speed, stride and period. Stride is travel in a complete same-foot cycle, in stage units; speed is stride/period. `at(t)` returns pose, root, phase and feet (planted flag, ankle target, actual sole, reachability and residual). Time is elapsed seconds from the authored walking origin. Alternating stance targets stay fixed in stage coordinates; smooth swing advances to the next plant, lifts above level ground, and has zero endpoint velocity. IK preserves leg lengths and counter-rotates feet to keep sole anchors level. Pelvis bob and arm counter-swing are stylized. A conservative reach envelope rejects excessive stride/lift/bob. Author artwork and facing appropriate to direction; the front-view skeleton is not an automatic side-view character. Use the same coordinates for ground and actor; do not also translate the outer object by travel. This helper is a steady cyclic gait only, not starts/stops, turning, stairs, joint limits, heel/toe roll, actual centre-of-mass balance or collision detection. Author transitions and weight-transfer poses separately; verify the actual silhouette and contact in motion.

### Oriented physical contacts (P034.4)

`actor.contact(pose,{side,limb,target:[x,y],angle,bend:1,weight:1})` targets the actual grip (arm) or sole (leg) anchor, with a requested absolute stage-space clockwise angle in degrees (0 means local +y points down). It subtracts the rotated, scaled terminal offset before IK, then counter-rotates the terminal joint. `weight` blends the free pose's anchor position and shortest angular arc toward the requested contact; zero preserves the free pose. Returns pose, endpoint, reachable, error (blended target residual), targetError (full target residual), and angleError in degrees. Sequential solves on distinct limbs can maintain two-handed contact if both targets are reachable. Derive moving targets from object rig anchors at absolute t; choose compatible bend directions and reachable paths. A blended target may become unreachable even when both end poses are reachable. This is not a joint-angle blend, automatic release scheduler or whole-body constraint solver.

`actor.attachment(pose,{side,limb:'arm',point:[0,0],angle:0})` returns an SVG affine matrix and `group(markup)` for trusted original local artwork. The specified local point maps to grip/sole, inheriting character scale and terminal rotation plus an optional relative clockwise angle. Draw the absolute group as a sibling, not inside another rig group. For a two-handed object, derive both hand targets from one independently authored object transform instead of attaching the same object twice. Contact is kinematic only: no force, weight, finger articulation, collision, anatomical angle limits or automatic body repositioning. Review the actual rendered reach/grasp/release and report residuals. Use prebuilt artwork and pure time functions in ctx.dynamic.

### Expressive performance channels (P034.5)

`art.characterPerformance({tracks,blinks,gestures})` compiles independent absolute-time scalar curves. Each track is an array of `[seconds,value,ease?]` keys, strictly increasing, with destination-key `smooth` (default) or `linear` interpolation and endpoint clamping. Face channels default to zero: `gazeX`, `gazeY`, `browLeft`, `browRight`, `smile` range -1..1; `lidLeft`, `lidRight`, `mouthOpen`, `mouthRound` range 0..1. Positive gaze points right/down in local face artwork; positive brow raises; positive smile lifts mouth corners; lid 1 means closed. These are author-facing normalized parameters, not automatic face deformation. `blinks` contains `{t,close:.06,hold:.02,open:.10,side:'both'}` events (left/right/both), merged by maximum closure with authored lid tracks. `gestures` maps torso, neck, head, left/right upper-arm, forearm or hand IDs to additive degree curves (-360..360). `at(t,basePose={})` returns `{face,pose}`; it preserves other base pose entries and applies gesture angles without mutating input. Author custom facial paths from face values, reuse fixed identity artwork, apply performance after gait and before any required contact solves. No emotion classifier, lip-sync timing, phoneme inference, automatic gaze targeting, anatomy limits or built-in face design. Inspect motion and facial readability at actual output size; keep dialogue timing for P035.

### Reusable character identity (P034.6)

`art.characterIdentity({id,height,proportions,palette,features,appearances})` wraps one characterRig and a stable authored identity. IDs and appearance/palette names are lowercase identifiers (letters/digits with optional dot/hyphen separators); palette colors are six-digit hex; features are short descriptive strings. `appearances` requires `default` and may include independently authored profile, rear or costume views. Each entry is `{build:(context,face)=>parts,order:[joint IDs...]}`. The frozen context contains id, palette, features and rig dimensions; the face input is a shallow frozen copy of the performance channels. Build returns local SVG strings keyed by joints. Prebuild static pieces in closures; dynamic face markup must be pure and use stable SVG IDs. `identity.actor` exposes the existing rig, IK and contacts; `identity.draw(pose,{appearance:'default',face})` uses the same rig for all appearances. The helper does not generate view artwork, verify that authors honor the palette, enforce visual likeness, or morph between views. Switch authored views at appropriate cuts and inspect continuity. Appearance differences are explicit source choices, not random per-frame variation.

For cross-project reuse register the original JS/MJS factory under existing asset_registry.py category `character`, with metadata id matching the identity and an immutable version. Include capabilities (rig, face, authored views) and exact dependency pins where applicable; use the existing checkout and verify-snapshot workflow. Keep performance curves, poses and scene placement outside the identity factory. New costume or artwork changes require a new asset version; do not overwrite reviewed source. Candidate status remains until explicit evidence-based review. No registry schema or storage changes are needed. A passing identity helper test does not establish cross-project or visual continuity; render and review multiple views before promotion.

### Upright gait and stopping (P034.7A)

Optional `heightRatio:.97` requests a higher pelvis relative to total scaled leg length. A smooth reach-aware cap lowers the pelvis when either ankle target requires it, with a small extension margin. The default omitted option retains the original steady gait. Excessive stride/lift/bob is rejected by a conservative reach envelope. `stop:{at:2.46,duration:.6,settle:.4}` (with period 1.2) specifies the **gait-clock** endpoint, which must land in double support. Deceleration begins at `at-duration/2` in elapsed time and reaches zero speed at `at+duration/2`; gait time advances quadratically during braking. Both feet then remain fixed while the pelvis settles toward an upright reachable height and upper-body swing relaxes. `state.speed` is instantaneous nonnegative speed; `walk.speed` remains nominal. Choose the stopping position and phase deliberately, then author subsequent contact actions from the final pose. No automatic foot repositioning, acceleration from rest, force-based balance, toe roll, or arbitrary-phase stopping is provided. Render review is still required for natural movement.
