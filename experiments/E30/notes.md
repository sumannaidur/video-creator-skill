# E30 (P024.2A) autonomous validation 1/9: 3D Explainer, "How does a car differential let the wheels turn at different speeds?" (en-IN, 30 s)

**Run:** native `/video-creator-dev` (0.2.0-dev). Project `projects/vc-20261127-88858c02`.
- **Stages completed:** doctor READY → preferences → research (1 source, 6 claims verified; secondary source noted) → script → narration (Mithi, anirban; 25.9 s off target, then s1/s5 revised to 28.5 s, within) → creative plan (resolved) → visual production (keyframes only).

**Capabilities used (P022–P024):**
- `mesh.lathe` (tyres, hubs, cutaway case, road tracks), the topic's own bevel gears (toothed cones);
- `scene.env` reflections, parent-node kinematics;
- `checks.ratios`, verified by preflight's `mechanism` check;
- `kit.highlight`, full-bleed captions.
- Not used: `motion.js` curves (3D motion is functional), Blender.

**Technical:**
- Keyframes: 3 rendered, 7/7 speech-cue checks (12 s).
- Preflight (855 frames, 624 s):
  - `mechanism` **passed** on every frame (carrier = average, planet = half the difference, pinion ratio);
  - captions, text and safe-area checks passed;
  - `required-object-bounds` failed for the differential proxy, because the deliberate close-up dolly crops it. It should be marked non-required for intentional crops.

**Artistic (agent self-review against the 3D criteria):**
- **Keys 2–3:** real geometry and lighting, a readable cutaway (ring gear, carrier, planets, axle gears, pinion), and purposeful dolly and orbit. Mid quality, not premium: bevel teeth are block-like, labels have no leaders, and the frame is busy at the close-up.
- **Key 1 (hook):** weak. Floating wheels over abstract track arcs, no car context, large empty space.
- **Preview:** not rendered. Key 1 does not justify it yet, and the budget was exceeded.

**Remaining gaps:**
- Key 1 composition.
- Proxy required-flag.
- Preflight cost for 3D (about 0.7 s per frame).
- `render.mjs` cannot render a time window, so a 4–5 s preview needs the full 540×960 render (about 10 min) and a cut.
- en-IN listening review; owner review.

**Resume:**
- Revise key 1 (add a simple car body or top-down road context; fill the frame).
- Set `p-diff` to `required: false`.
- Re-run keys, then the preview: `node <dev>/scripts/render.mjs --project <P> --style 3d-explainer --topic visual/topic.js --timeline narration/narration-aa91a66b25.timeline.json --plan plan/resolved-plan.json --captions captions/captions.json --locale en-IN --fps 30 --scale 0.5 --out render/preview`

## P024.2B correction (keyframes only; narration, timing, research and plan reused)

- **Changes in the project's topic module only** (no engine or helper changes; previous version kept as `visual/topic-v1.js`; patch `patch_v2.py`):
  - **Opening:** a ghosted car body; front wheels steered at exact Ackermann angles and spinning at their own path radius; a road with lane edges, dashed centre line, kerb and verge; the camera frames the whole car in the bend.
  - **Craft:** bevel teeth are now tapered extrusions, not blocks.
  - **Annotation:** marker dots on the ring and planet gears in the label colours.
  - **Cropping:** the required proxy `p-diff` now covers only the core (planets and axle gears), so bounds stay strictly validated on the subject. Ring gear, case, pin and pinion use `p-wide` (not required), so the deliberate close-up crop is no longer misreported.
- **Result:** 3 keyframes (`render/keys-v2`), 7/7 cue checks. Full preflight not re-run (as instructed).
- **Self-review:**
  - Key 1 now reads as a car turning on a road; it is the largest improvement.
  - Keys 2–3: cleaner teeth; the car shell gives context.
  - Still mid quality: the body is a stack of translucent boxes, the planet marker is hidden behind the case, labels have no leaders, and there is empty sky in key 1.
