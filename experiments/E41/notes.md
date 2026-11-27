# E41 (P024.15C) autonomous revalidation: 3D Explainer, "How does a lighthouse lens send light so far?" (en-IN, 30.3 s)

**Run:** native `/video-creator-dev` 0.2.0-dev, project `projects/vc-20261127-ec4fc18a`. No engine changes; WebGL only, no Blender.

**Stages:** doctor READY → research (4 claims, one secondary source) → script → estimate → narration → plan → keys → one correction.

- **Estimator:** first draft 27.5 s (−8.4%), so s5 was expanded before synthesis (estimate 29.2 s). Measured 30.3 s, all 94 words mapped on the first synthesis; the estimate was 3.6% low.
- **Plan:** one ambiguous cue word ("rings" twice) needed `occurrence`.
- **Checks:** pre-render validation passed; 11/11 cue checks. Composition was not declared (3D proxies are points, so it would report unsupported). Preflight and window were not run because the payoff is not artistically ready.

## Self-review against E30 and 3D criteria

Evidence: `render/keys/sheet.png` (v1), `render/keys-v2/sheet.png` (after the correction).

- **Lens (prisms):** the strongest 3D in P024. A real barrel Fresnel lens: lathed glass prism rings, bronze ribs and hoops, the lamp on a pedestal. Steep rays visibly turn level beside the beam. Dense, though: rays to the back-facing beams clutter the left half.
- **Coast hook:** reads as a lighthouse (banded tower, gallery, lantern, roof, beams). But the sea renders as a pale sand-like plane (probably a broad sun sheen on the low-roughness surface), with no horizon and no ship. Weaker than E30 v2's road context.
- **Sweep payoff, after the correction (water, open beam cones, ship and camera moved):**
  - The water is fixed.
  - The ship is still about 1° outside the portrait field, because I placed it without checking the horizontal field-of-view limit.
  - The "flash" does not read.
  - **Not ready**, so no window was rendered (per the brief).
- **Overall:** strongest technical 3D craft so far, but the environmental context and the payoff fail. Below professional 3D criteria.

## Recurring (E30–E41)

1. **Portrait framing of 3D context:** E30's empty sky and E41's off-frame ship. Placement must be solved against the portrait horizontal field (about ±8.6° at fov 30), not judged by eye. A projected in-frame check for key context objects would catch this; 3D composition regions are currently unsupported.
2. **Busy mechanism close-ups:** E30 and E41. Show only the rays for the visible beam direction.
3. **Resolved:** duration (estimator within 4%), setup friction.

**Resume:**
- Place the ship at az ≈ 156° (inside ±8°), or widen the final shot's fov to 40.
- Raise the sea's roughness and lower the key light's elevation.
- Trim back-beam rays.
- Re-render the keys, then preflight and a 28–30 s window.

## P024.16A rich-artwork feasibility (one hero keyframe, `hero/`)

**Assets:** 3 CC0 assets from Poly Haven, downloaded with owner approval into `assets/`.
- `the_sky_is_on_fire` HDRI, 2k (Greg Zaal).
- `coastal_cliff_01` scan, 1k glTF (Rob Tuytel, Rico Cilliers).
- `ship_pinnace`, 1k glTF (James Ray Cock et al.).

Each asset page was checked individually and states "CC0 1.0 Universal". 29 files, 42.5 MB, with URLs, authors and SHA-256 in `assets/provenance.json`.

**Scene:** the lighthouse, lantern, lamp, beam and ocean are procedural geometry and materials in `hero/hero_scene.py`, rendered with existing Blender 5.2.2 EEVEE at 540×960 and 64 samples.
- Placement is solved from the camera's field of view.
- The ship's frame bounds are verified by projection (`metrics.json`): ship x 0.12–0.40 and y 0.42–0.56, fully in frame; lantern 0.34 from the top.

**Cost** (reference laptop, CPU and integrated GPU as available to Blender):
- Render 24.5 s; total wall time 30.5 s including about 3 s of import and setup.
- Peak working set 2.57 GB (PowerShell `PeakWorkingSet64`).

**Result:** `hero/hero.png`; comparison with E41 key 1 in `hero/compare.png`.
- Substantially better than the WebGL frame: a real twilight sky, reflections, a scanned rock headland, a detailed ship, and a cinematic low horizon.
- **Weaknesses** (no correction, per the brief):
  - the beam cone is not visible;
  - the lantern halo reads as a white ball;
  - the sea is mirror-calm, more lake than coast;
  - the cliff reads as a flat-topped slab;
  - the lighthouse is small in the frame (about 13% of height).
- **Feasibility:** yes for stills and for static background layers, through the existing `blender_layers.py` route. The WebGL engine cannot use textures or HDRIs, so animated hero shots would need per-frame Blender renders (about 25 s per frame; not tested).
