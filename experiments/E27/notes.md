# E27 (P023.7) X-Ray study: "One pedal turn, three wheel turns" (unseen, en-IN)

- **Reference:** cutaway search ([x-cal.us cutaway trainers](https://www.x-cal.us/products/right-angle-straight-bevel-gear-reducer-cutaway); the Wikiwand Cutaway page showed no image in view). Standard cutaway conventions were applied.
- **Kit (additive):** `sprocket`, `chainLoop`, `motion.chainDrive`. **Guidance:** `x-ray-explainer.md`.
- **Validation:**
  - Harness 7/7 (4 cue checks; preflight on all 336 frames, 0 defects; preview media checks).
  - `test_mechanism.py` 6/6: 3:1 ratio at every frame (relative error 6e-6), wheel = sprocket, chain travel = r1·θ, end at 360/1080 degrees, pitch radii, 98-link even loop.
  - Legacy `test_xray_explainer` 10/10.
- **Bugs caught:** the chain stood still because `--draw` is clamped (fixed by normalised travel); scan porthole too large; labels leaving the safe area during pans.
- **Performance:** 90 Full HD frames 11.3 s; full preview 31 s.
- **Evidence:** `out/bike-keyframes.png`, `out/bike-preview-540x960.mp4` (4.6 s, drive turning), `out/bike-motion-strip.png`.
- **Limits:**
  - The guard is a band around the chain rather than a full chaincase.
  - Teeth are simplified profiles.
  - No frame or derailleur.
  - Weak reference inspection.
  - Owner review pending.
