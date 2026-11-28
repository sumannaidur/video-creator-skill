# Procedural craftsmanship

Read when constructing important original artwork. This is a practical drawing method, not a style, scene template, mandatory detail count or new renderer. Work within the chosen backend. A sophisticated plan is not evidence of sophisticated artwork.

## 1. Construct a visible object, not its name

Start with the object's intended view, relative dimensions, characteristic silhouette and actual functional structure. For a mechanism, identify the fixed housing, moving parts, their axes, order, contacts and hidden volumes; use sourced facts or disclose simplification. For an organic subject, start with mass, gesture, branching and contours. Decide what must remain recognizable at delivery size. Sketch the silhouette and major volumes first; then build the distinctive components and joints, then surface detail. Keep important moving pieces separate from fixed art.

A camera, for example, is not a polygon with a circle: the lens barrel has depth and a mounting interface, the body has front/side/top planes, controls sit on those planes, and a film camera's optical path runs through the relevant aperture and shutter to the film plane. This is an example of reasoning, not a required camera asset. Choose a specific coherent design rather than combining incompatible mechanisms. Do not make technical claims from generic appearance.

## 2. Establish perspective before drawing parts

For a stylized physical scene, choose an eye level and projection (front, side, parallel/axonometric or perspective). Establish ground/support and vertical axes. Construct a box from shared corners, not disconnected polygons. Parallel projection keeps corresponding edges parallel; perspective sends parallel world edges toward their common vanishing point. Draw circles on the correct planes as projected ellipses; preserve their centers and orientation when constructing concentric rings. A barrel viewed obliquely needs front and rear sections connected by a side wall, with rear edges hidden where appropriate. Avoid mixing front-facing decals with oblique surfaces unless intentional.

A compact original JS point/project helper can keep construction consistent; no new dependency. SVG paths, groups and transforms are sufficient for many 2D/2.5D views. Do not claim that these provide genuine 3D; use existing WebGL when spatial geometry must actually rotate. For a new view, reuse object dimensions and relationships, and redraw visible faces/occlusion. A transformed flat symbol is not a reverse view.

## 3. Make volume and material legible

Choose the light direction first, including ambient fill. For each important object separate major lit, midtone and shadow masses. Use curved shading on rounded forms, distinct value planes on angular forms, contact shadows beneath supported objects and occlusion at seams. Cast shadows should agree with the light and supporting surface. A visible beam should change the appearance of the receiving surface; an isolated translucent triangle is not sufficient when light is part of the story.

| Material | Low-cost construction choices |
| --- | --- |
| Metal | Coherent broad reflected bands, narrow edge highlights, dark seams, selective brushed marks; distinguish matte from polished. |
| Glass | Dark/light rim, controlled translucent interior, curved reflection and background visibility where appropriate; no opaque flat blue disc unless deliberately symbolic. |
| Wood | Grain along board direction, offset joins, end grain where cut, restrained knots and wear. |
| Fabric | Folded masses, tension at attachment, soft shadow on folds, seam or hem where visible. |
| Paper | Layered cut edges, directional thickness, sparse stock texture, folds, shadows; vary treatment by underlying represented material. |
| Organic | Asymmetric contours, branch or anatomical hierarchy, varied tone and restrained texture. |

These are artistic options, not a checklist of mandatory decoration. Use SVG gradients, clipped sparse marks and layered fills; choose unique/scoped IDs for gradients and clip paths. Keep repeated geometry in symbols. Seed procedural variation and compute static texture once where supported. Avoid large animated blur/filter regions, excessive path counts, or detail too small to resolve. Measure rather than assume performance.

For Paper specifically, the existing kit exports cut, piece (stacked shadow), gouache (rounded volume), deckle, folded, vellum, light, textures, masonry, facade, foliage and parts. Read their actual signatures and style guidance before use. A uniform cut() outline on every surface is not a substitute for material or volume. Use the helpers selectively; their output cannot determine the artwork's quality.

## 4. Build a place with spatial relationships

For a setting, sketch the plan or depth arrangement and key subject placement. Decide how the place functions: entry, working surfaces, supports, storage, relevant tools, human activity where needed. Establish foreground framing, subject plane and background; use occlusion, scale changes, tonal separation and coherent perspective. Put a shadow where an object touches the surface. Let a few well-chosen details identify the location; don't scatter generic decorations to fill space. Crop naturally at frame edges. In portrait composition, use lower and upper regions purposefully rather than leaving large unused areas or filling them with repeated floor lines. Negative space is valid when it serves the focal read or captions.

Make environment components reusable as source functions, with local placement and scene state separate. Reuse coherent world relationships between views; do not paste the same backdrop into every shot simply to preserve palette. Abstract, typography and data subjects may need no physical environment; design their visual hierarchy and relationships instead.

## 5. Turn explanation into visible action

For a mechanism, keep the recognizable shell or another identifying landmark when entering an internal view. Reveal functional parts in spatial order using cutaway, selective transparency or an exploded view with correspondence to their installed positions. Label only what needs naming. An independent schematic can be appropriate when it explains more clearly; make the abstraction explicit. Verify the actual path of force, light, liquid or movement and compare against the claim guardrails. Do not imply a moving part is animated if it is static.

For interaction, identify contact anchors and joint pivots, then derive dependent positions or coordinated motion from a common state. Use independent parts and existing tracks where possible; do not assume the renderer has a hierarchical rig. Preview the contact phase, not just endpoints. Avoid arbitrary animation that adds no meaning.

## 6. Develop the hero before multiplying shots

After the sequence sketch, prioritize the hardest or most visible hero object and its environment. Construct a representative frame with real detail, inspect at phone size and at close scale, and compare what is actually visible against the intended art direction. Check projected forms, depth, materials, functional parts, composition and space reserved for text. If the hero looks like a placeholder, spend the available correction on the structural cause before duplicating the style across the sequence. Do not spend the entire budget on polishing an isolated prop if other shots remain unreviewed. Use the existing keyframe/preview gates; this is a prioritization method, not a new mandatory render cycle.

Record specific evidence: what visible features establish identity and setting, where the light is visible, what changes and what is missing. A successful geometry check, path count, number of props, or lengthy creative note is not artistic acceptance. If the budget is exhausted, preserve source and report the weakness instead of calling it finished. Keep the project-specific functions editable for later reuse; shared library promotion and automatic cleanup remain future phases.
