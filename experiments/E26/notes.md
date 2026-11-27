# E26 (P023.6) Tech Explainer study: "How does a hard drive read data?" (unseen, en-IN, simplified)

- **Artwork:** three static Blender layers (`blender/plate.py`: top-down orthographic base, hub and arm; about 13 s render in total) composited by the existing Tech engine via the new `techKit.art.raster`. SVG overlays show the track, head marker and cross-section inset.
- **Motion:** the hub spins (slowed, labelled); the arm seek uses an angle solved from the render geometry and lands exactly on the track (`settle`).
- **Corrections:**
  - Blender: scale applied after bevel (oval chassis), metre-scale light energy, and a black platter reflection (fixed with a zenith world gradient).
  - Topic: labels outside the safe area under zoom.
- **Validation:** harness 7/7 (3 cue checks; preflight on all 342 frames, 0 defects; preview media checks).
- **Performance:** 90 Full HD frames 18.7 s; full preview 70 s (the raster layers cost more than pure SVG).
- **Evidence:** `out/hdd-keyframes.png`, `out/hdd-preview-540x960.mp4` (4.6 s seek).
- **Limits:**
  - The arm is a simple bar.
  - No head-flex or platter-stack detail.
  - Shadows are CSS drop shadows, not rendered.
  - The topic file carries about 0.9 MB of data URIs.
  - No packaged Blender step.
  - Owner review pending.
