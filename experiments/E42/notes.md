# E42 (P024.17) autonomous rich-artwork validation: Tech Explainer, "How does an induction stove heat only the pan?" (te-IN, 28.98 s)

**Run:** native `/video-creator-dev` 0.2.0-dev, project `projects/vc-20261127-bf6d1cef`. No engine changes, no downloads.

- **Stages:** doctor READY → research (4 claims, one secondary source) → script → estimate → narration → plan → Blender layers → keys.
- **Estimator:** 27.96 s predicted against 28.98 s measured, 3.4% low. First synthesis, all 54 words mapped; the plan resolved on the first attempt.

## Technique, chosen by the P024.16B guidance

The materials carry the story (black glass-ceramic, brushed steel, copper), so I used Blender static layers via `scripts/blender_layers.py`, with SVG for motion and labels.
- **No external assets:** procedural studio lighting suits a kitchen product better than E41's sunset HDRI, so nothing was downloaded.
- **Scene:** `visual/hob_scene.py` (original bpy). One perspective camera, three layers:
  - `base`: hob, pan, granite;
  - `under`: see-through glass, copper spiral coil, ferrite bars, ghosted pan;
  - `hot`: pan base glowing.
- **Alignment:** the scene exports projected `GEOMETRY` (coil, pan base, eddy rings, field loops), so the SVG overlays align exactly. All aligned plates share one parallax layer.
- **Cost:** layers at 810×1440, EEVEE 48 samples: base 8.4 s, under 14.4 s, hot 1.7 s. Packed topic is 2.65 MB.

## Corrections during this attempt (before keyframes)

1. The first layer pass was overexposed and framed too tight, and the coil was hidden by a void plane and by the solid pan. Fixed by lowering the lights, pulling the camera back, and using a ghost pan in `under`.
2. The composition check caught the "గాజు" tag overlapping the protected pan region; moved it.

**Checks:** pre-render validation passed; 10/10 cue checks; composition hook and field passed, eddy unsupported (anchor, contrast).

## Self-review against E35 and E40

Evidence: `render/keys/sheet.png`, `visual/layers-sheet.png`.

- **Materials:** the most convincing of all Tech runs. Photographic steel, black glass reflections, granite. E35 and E40 were gradient illustrations.
- **Hook:** strong product shot; the shimmer lines are generic.
- **Field:** coil turns align exactly with the rendered coil. But the field loops (in the x–z plane) project almost edge-on from this 38° view, so they read as flat ellipses instead of loops rising through the glass. Busy.
- **Eddy/heat:** clear payoff. The base glows, with eddy rings and arrows.
- **All frames:** the subject sits in the middle third, with about 40% plain counter above it; the tags are small.

## Recurring (E30–E42)

1. Framing and empty space persists: E39 and E42.
2. Overlay legibility depends on the 3D view. Field geometry must be chosen for the camera, for example a section plane facing the camera, not by physics alone.
3. Improved: material realism (Blender layers), duration, setup friction, and composition-check catches.

**Resume:** tilt the field-loop plane toward the camera (or use a side-section `under` layer), crop the camera to the hob, and enlarge the tags.

## P024.18A production-readiness pass (resumed; research, narration, Blender layers and plan reused unchanged)

**Accuracy:** `research/accuracy-notes.json`, kept outside the verified ledger so earlier stages stay valid.
- **Sourced (S1):** induction heats the pan directly, not via a heating element; the field passes through the pot bottom and induces eddy currents.
- **Glass warming:** secondary warming of the glass by conduction is unsourced general physics. It is shown only as a faint tint in the section, with no on-screen claim.
- **Heat colour:** the orange glow is marked on screen as "రంగు: వేడికి సంకేతం మాత్రమే" (colour is only a heat symbol).

**One bounded correction** (`patch_v2.py`, plus follow-up defect fixes within the same pass):
- **Section inset:** a true side section in the empty top band. Flux loops rise through the coil centre into the pan base, run along it, go down outside the coil and return through the ferrite. Eddy dots and crosses sit in the base, plus the conceptual heat and the glass tint.
- **3D view:** simple upward flux arrows; the flat loops are gone.
- **Framing:** tight hook (1.2× on the pan), static frame for the inset shots.
- **Tags:** 42 px.
- **Defects found and fixed in the pass:**
  - wrong draw order hid the loops;
  - loop topology sat on the coil instead of around it;
  - arrowhead stubs remained after the loops undrew;
  - a mid-line comment silently disabled the glass tag's animation (caught by the cue count dropping from 10 to 9 and by eye);
  - preflight caught tag clipping and caption overlap under the camera zoom (one fix).

**Validation:**
- Pre-render validation passed; 10/10 cue checks.
- Composition: hook passed; field and eddy unsupported (anchor, contrast).
- Preflight passed (870 frames, 0 defects).
- Window `render/window/heat-window.mp4`: 20.6–25.1 s, 540×960, 135 frames, video and audio 4.500 s, with narration; 22 s wall.

**Self-review:**
- Clearly better than v1: the flux path is now correct and legible in the section, the frame is filled, and the hook is tighter.
- **Remaining:**
  - the 3D flux arrows are unevenly placed;
  - the section's loop strokes are thin at phone size;
  - the tags have no leaders;
  - the Telugu terms (సుడి కరెంట్లు) need native review.
