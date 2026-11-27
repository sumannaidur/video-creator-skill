# E29 (P023.9) 3D Explainer study: "How does a ball bearing work?" (unseen, en-IN, genuine WebGL 3D)

- **Choice:** existing WebGL renderer (integrated, deterministic; about 0.8 s per Full HD frame) over Blender (about 5–18 s per frame, E19).
- **Kit (additive):** `mesh.lathe` (smooth revolutions, cutaway caps), `mesh.sphere`, `scene.env` studio reflections (default off). **Guidance:** `3d-explainer.md`.
- **Demo:** 6204-class bearing (OD 47, bore 20, 8 × 7.94 mm balls, dm 33.5); outer ring cut away with section faces; brass cage; keyed shaft. Cage orbits at (1 − Dw/dm)/2 = 0.38 of the shaft; balls spin relative to the cage. Slowed.
- **Benchmark before the preview:** 30 Full HD frames 24 s (two runs). Preview: 342 frames at 540×960 in 234 s.
- **Validation:**
  - Harness 5/5 (3 cue checks; preflight on all 342 frames, 0 defects).
  - `test_bearing.mjs` 7/7: no slip at both raceways, cage ratio, no ball/ring intersection, conformity 0.516, cage clearance, lathe normals and caps.
  - Legacy `test_3d_explainer` 11/11.
- **Evidence:** `out/bearing-keyframes.png`, `out/bearing-preview-540x960.mp4` (4.6 s).
- **Limits:**
  - Ball spin markers are barely visible.
  - The shaft dominates the frame.
  - Labels have no leaders.
  - Preflight is slow for WebGL (191 s).
  - Owner review pending.
