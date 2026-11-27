# E39 (P024.15A) autonomous revalidation: Paper Explainer, "How does a seed know which way is up?" (te-IN, 30.6 s)

**Run:** native `/video-creator-dev` 0.2.0-dev, project `projects/vc-20261127-9407f108`. No engine changes.

**Stages:** doctor READY → research → script → narration → plan → keys → one correction → preflight → one 540×960 window.

- **Research:** gravitropism; 4 claims verified from one secondary source.
- **Estimator:** 28.9 s predicted (ahana, low confidence) against 30.6 s measured, an error of −5.4%. Narration passed on the first synthesis, with all 54 words mapped. The plan resolved on the first attempt; the setup friction from E31/E32 did not recur.
- **New checks used:**
  - Pre-render validation passed.
  - Composition: first pass failed on the payoff because a leaf crossed the frame edge (`p-leaf-r`). Fixed by re-routing the stem. In v2, bend and payoff pass; the hook reports label anchoring as unsupported (no leader).
  - Preflight caught a declaration error: the rotating root tip's bounding box, which deliberately bleeds off-frame, was marked required. After unmarking it, preflight passed (918 frames, 0 defects).

## Artistic self-review

Phone-size keys, no audio: `render/keys/sheet2.png` (v1) and `render/keys-v2/sheet.png`; window strip `render/window/strip.png`.

- **Hook:**
  - v1 failed: root and shoot hooked to the same side and overlapped into a "paperclip".
  - **Correction** (the highest-impact weakness): the organs now hook to opposite sides, the seed is larger, and the tags sit at the organs. v2 reads instantly: the root hooks over and dives, and the shoot hooks round and climbs to the surface.
- **Transformation (bend):** the mechanism is legible: paper cells, auxin on the lower side, and a bend in sync with "the upper side grows more… it bends". It is weak compositionally: the root fills a thin band of an otherwise empty soil frame, and the top tag floats far from the root.
- **Payoff:** strongest frame. The sprout breaks the grass line into sun with two cut-paper leaves.
- **Overall:** one consistent paper world with a real transformation, more environment-specific than E34. Still below professional Paper standard:
  - segment joints are visible in the stems;
  - the sky is flat;
  - nothing stops the tags floating from their organs;
  - the empty bend frame.

## Recurring (E30–E39)

1. Subject-to-frame fit: E39's bend frame is mostly empty. The composition checks catch crops but not emptiness.
2. Tags are not attached to their subjects. Anchoring stays "unsupported" without leaders, and topics rarely draw leaders.
3. Hook weakness: present in v1 again, fixed by the bounded correction.
4. Resolved: setup friction (known command chain) and duration (the estimate was in tolerance).

**Resume:** fill the bend frame (scale the root 1.6×, add a soil-surface and seed context strip), and add leaders to the tags. Then render a payoff window.
