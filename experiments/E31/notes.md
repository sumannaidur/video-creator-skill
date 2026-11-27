# E31 (P024.3) autonomous validation: X-Ray Explainer, "How does a pin-tumbler lock work?" (kn-IN, 27.0 s)

**Run:** native `/video-creator-dev` 0.2.0-dev, project `projects/vc-20261127-ce7275bf`. The rendering engine and kits were not changed.

- **Stages:** doctor READY → preferences → research → script → narration → creative plan → visual production (keyframes only).
  - Research: 4 claims verified from one source. Guardrail: "pin lengths match the key cuts" is not stated in the source, so the script avoids saying it.
  - Narration: Mithi, 5 segments, 27.0 s, within the ±10% target.
  - Creative plan: 4 shots (resolved).
- **Topic module:** `visual/topic.js`. All artwork is original procedural SVG:
  - an exact side section with 5 pin stacks of individual key-pin lengths and a driver length of 110;
  - with no key, the drivers straddle the shear line;
  - the key's cut under each pin is set at shear + key-pin length (asserted in code);
  - pin lift and spring compression are sampled every frame from the key's edge as it slides in;
  - a brass exterior opens through a porthole scan into a glass ghost;
  - red block marks, a green alignment line, and an end-view inset whose plug turns 60°.
- **One correction:** the "turn" cue failed the cue check because its object was already visible before the cue. Fixed with a rotation arrow that appears on the cue.
- **Technical:** 3 keyframes rendered (`render/keys/sheet.png`); 7/7 cue checks passed. Preflight and preview not run, as instructed.

## Self-review against X-Ray criteria

- **Mechanism accuracy: strong.**
  - Key 2: every driver pin crosses the shear line, with a red mark at each crossing.
  - Key 3: every gap sits on the green line, and each pin rests on its own cut.
- **Sectional reveal: adequate.** Hatched section, glass ghost and porthole scan. The brass exterior only appears before key 1, so it is unreviewed.
- **Composition: weak.**
  - The section fills only about 30% of the 9:16 frame, leaving roughly 40% empty between the art and the captions.
  - The key's bow is cropped at the left edge.
  - The ghost shows a double blue/amber outline.
  - The inset is small and isolated.
- **Craft: mid.** Flat fills, no specular or edge lighting on the pins, plain zig-zag springs, and small labels. Plug, housing and shear line are not labelled.
- **Clarity: good for the mechanism, below professional X-Ray polish.**

**Resume:**
- Enlarge the section to about 55% of the frame height (raise VH scale or the camera scale) and move the inset into the empty band.
- Add pin and spring shading, and label the plug, housing and shear line.
- Re-render the keys, then run preflight and a 0.5× preview after owner approval.
