# E40 (P024.15B) autonomous revalidation: Tech Explainer, "How does a touchscreen know where you touched?" (en-IN, 29.25 s)

**Run:** native `/video-creator-dev` 0.2.0-dev, project `projects/vc-20261127-ae7edc19`. No engine changes.

**Stages:** doctor READY → research (5 claims from one secondary source) → script → estimate → narration → plan → keys → preflight → one 540×960 window.

- **Estimator:** first draft 31.4 s (+4.7%), so s3 was trimmed before synthesis to 30.35 s. Measured 29.25 s, all 84 words mapped on the first synthesis; the estimate was 3.8% high.
- **Technique:** SVG, not Blender. The explanation is animated conductors, fields and signals, and the phone's materials work with gradients; Blender layers would only add static material at extra cost.

## Checks and corrections

**Validation and composition (fixes, not artistic corrections):**
- A cue fell inside the outgoing focus transition, so it moved from "touching" to "without".
- Protected regions on full-stage plates need boxes. Without them the composition check flagged every tag on the layers shot.
- Layer tags were clipped (the full-bleed callout font is large), so the stack was shrunk and shifted right to open a tag column.
- Grid marks and the crosshair sat on different parallax layers from the grid, so they drifted during the camera push. Moved to one layer.
- Preflight found tags clipped during the focus push, so they now exit 0.5 s before the cut. Preflight then passed (878 frames, 0 defects).

**Bounded artistic correction:** in the touch shot the fingertip covered the location readout. The finger now enters from the right at −62°, with its tip computed onto the crossing.

## Self-review against E35 and Tech criteria

Evidence: `render/keys/sheet.png` (v1), `render/keys-v2/sheet.png`, `render/window/strip.png`.

- **Hook:** strong product shot. Aluminium frame, glass sheen and lock-screen detail, with the grid glowing through under a hovering fingertip. Better than E35's opening. The grid reads slightly as drawn on the screen rather than under the glass.
- **Layers:** clean exploded stack. Rows trace on, then columns, with a dashed no-contact mark. The stack is compact and the tags have no leaders (anchor checks unsupported).
- **Touch (payoff):**
  - One column pulses at a time.
  - The field bends into the fingertip.
  - That crossing's bar drops on "drops".
  - The crosshair locks on, and the readout appears on "dropped".

  Clear causal storytelling, verified in motion.
- **Limits:** the skin and finger are illustrative rather than photoreal; the frame is busy at the lock; not premium.

## Recurring (E30–E40)

1. Tag placement: tags still have no leaders, and plates need explicit region boxes. The checks now catch clipping and overlap; neither was visible by eye in v1.
2. Parallax-layer mismatch: this recurred in Paper chains and here. Marks that must sit on a grid have to share its layer.
3. Resolved here: duration (pre-synthesis estimate), setup friction, and the opening (strongest hook of P024 so far).
