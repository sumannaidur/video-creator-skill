# E20 (P022.2): professional motion and composition, demonstrated on Paper and Data Storytelling

**Scope:**
- Reusable motion primitives and creative-direction guidance in the Skill source (`skills/video-creator`).
- Before and after versions of two existing compositions:
  - the Paper Explainer canal-lock fixture (P018.4);
  - the Data Storytelling rainfall fixture.
- No new styles, renderers or dependencies.
- The released v0.1.0-beta tag and zip are untouched. Nothing is committed.

## What changed in the Skill (source tree, uncommitted)

| File | Change |
|---|---|
| `scripts/styles/shared/motion.js` (new) | **Curves:** `inOut`, `outQuart`, `anticipate`, `overshoot`, `settle`, `hold`. Each starts at 0 and ends exactly at 1. **Key builders:** `arrive`, `follow`, `stepped`, `stagger`, `jitter`, `sample`. Pure and deterministic |
| `tech-explainer/engine.js`, `paper-explainer/engine.js` | Curve table merges `vcMotion.ease`; the four original curves are defined last, so they can never be replaced. Opacity channel clamped to [0, 1] |
| `tech-explainer/backend.mjs` (shared shot core: 8 styles), `paper-explainer/backend.mjs` | Load `motion.js` before the engine; added to checkpoint sources |
| `references/creative-direction.md` | Negative space and ambient motion are judged by purpose (no percentage quota); foreground framing; colour continuity; scale changes within a shot; continuous transformation as a transition; a primitives table with "use when / avoid when" |
| `references/visual-production.md` | Documents `vcMotion` |
| `references/styles/paper-explainer.md` | Hand-animated articulation (stepped poses, wind-up and settle, follow-through; camera and water stay smooth) |
| `references/styles/data-storytelling.md` | Transformation rules: same marks, one shared scale, never overshoot or settle on data marks; emphasis by dimming |

**Why the opacity clamp:** overshoot and settle act on every track channel. The first after-render pushed opacity to 1.024, which preflight caught. Legacy values are already within [0, 1], and CSS clamps opacity anyway, so legacy pixels cannot change. Verified below.

**Not covered:** the 3D Explainer has its own engine and does not load `motion.js`.

## Demonstrations (topic files in `experiments/E20/topics`, same art, words, cues and data as the fixtures)

**Paper (canal lock):**
- The keeper's arm and head, and the windlass, move on twos at 12 fps, reading as hand-moved cut paper.
- The wave has a wind-up, and the head answers the arm (follow-through).
- The lower gate winds up and lands heavily (`settle`); the balance beam follows through.
- The boat rides the rising water a beat late and settles with a small roll.
- The top gate has anticipation and its beam follows through.
- **Camera:** story-driven shot sizes. Medium, then a close-up on the closing gate, then the keeper winding, then wide as the chamber fills, then a close-up on the top gate. Previously it drifted within about 1.08–1.16 zoom.
- **Foreground framing:** a dark reed bank on the fastest parallax layer.

**Data (rainfall):**
- The four bars grow in a staggered, decelerating build that never passes their values.
- On "total" the old axis leaves, all bars rescale together to the 0–1,200 scale, then stack in order into one column (A at the bottom). Their identity, order and colour are kept.
- The counter ends on the exact sum, 1,200 (checked in the topic).
- On the compare cue, the other cities dim and a leader note gives B's exact share, 420 / 1,200.
- One continuous scene: the morph replaces the earlier black bar wipe, which hid the change.

## Validation (actually run; synthetic timelines from the existing test harnesses, identical for before and after)

| Check | Result |
|---|---|
| **Legacy compatibility:** original fixtures, old engine vs changed engines | All 8 keyframes (4 Paper, 4 Data) **byte-identical** |
| Legacy test runs with the changed engines | `test_richness --only detail` 7/7; `test_data_storytelling --presentation full-bleed` 10/10 |
| Focused regression suites (changed engines) | `test_presentation` 43/43, `test_paper_kit` 7/7, `test_tech_explainer` 9/9, `test_preflight` 16/16 (logs in `work/regress`) |
| Paper after (`test_richness` harness on the after topic) | **9/9**: every speech-cue check, full-cadence preflight on every frame (330 frames, 0 defects), cost runs, preview media checks |
| Data after (`test_data_storytelling` harness) | **10/11**: keyframes with speech-cue checks (portrait and landscape), preflight on every frame in both orientations, Kannada caption text, preview media checks. The one failure is **expected**: that test asserts the old fixture's `bars` wipe, which the after version deliberately replaces with the morph. Its bundled camera-moments assertion therefore did not run for the after version |
| Data accuracy | Bar heights computed from the data on a zero-based 0–500 scale. The stack uses one shared 0–1,200 scale at every instant (all bars rescale together before stacking). Counter ends at 1,200, the exact sum (asserted in the topic). No overshoot or settle on data marks |
| Text shaping | Kannada and English captions and Kannada labels and digits pass the existing caption and text checks. Native review still required |
| Determinism | Pure functions of time; same harness checkpointing. Legacy outputs are byte-identical across engine versions |
| Previews | 4 files, 540×960, 30 fps, 135 frames, 4.5 s each (ffprobe), same windows before and after: Paper 4.4–8.9 s, Data 1.0–5.5 s |

**Bugs caught by our own checks and fixed:**
- Overshoot pushing opacity to 1.024 (preflight `invalid-transform`): opacity clamp in the engine plus a topic key fix.
- Landscape label clipping (counter, then share note): repositioned.

**Rendering overhead (same host, same harness, no measurable cost):**

| Measure | Before | After |
|---|---|---|
| Paper: 90 Full HD frames (best of 2) | 18.1 s | 16.5 s |
| Paper: full 11 s preview at 540×960 | 52.3 s | 42.0 s |
| Data: full 5.6 s preview at 540×960 | 14.3 s | 14.1 s |

The differences are within host noise. The motion primitives only change key values, not per-frame work.

**Evidence (`experiments/E20/out`):**
- Matched keyframes: `paper-key1..4-before-after.png`, `data-key1..4-before-after.png`.
- Sheets: `paper-sheet-before-top-after-bottom.png`, `data-sheet-before-top-after-bottom.png`.
- Motion strips: `*-motion-before-top-after-bottom.png`.
- Previews: `paper-before/after-preview-540x960.mp4`, `data-before/after-preview-540x960.mp4`.
- Logs: `work/*.log`.

## Artistic assessment (agent self-review, for owner review)

**Data Storytelling: clear improvement in storytelling and accuracy of what is shown.**
- **Before:** the chart is wiped away by black bars and replaced by an unrelated counter and two circles. The viewer never sees that 1,200 is made of the four cities.
- **After:** the same marks become the total. The viewer follows each city into the column, sees B's share in context, and the emphasis lands on the cue.
- **Remaining:**
  - The upper right of the frame is empty after stacking; the column is narrow for a 9:16 frame.
  - The source line still sits close to the baseline (also true before).
  - The 4.5 s window is dense; the stack, count and compare follow each other quickly in the synthetic timing.

**Paper Explainer: moderate improvement, mostly visible in motion, not in stills.**
- **Gains:**
  - Stepped keeper and windlass motion reads as hand-moved paper.
  - The gate and beam feel heavy (wind-up, settle, follow-through); the boat lags the water and settles.
  - Story-driven shot sizes: a gate close-up, the keeper, wide as the chamber fills, a top-gate close-up.
- **Weaknesses:**
  - The foreground reed bank is placed inside the underground cross-section, which reads as a bush in the soil, not as foreground framing. It needs a different placement or should be dropped. Not corrected: the one corrective pass went to the keeper crop.
  - Close-ups crop the boat at the frame edge during the gate beat.
  - The stepped arm can look like low frame rate rather than intent at phone size; needs owner judgement.

**Overall:**
- The primitives and guidance are reusable across eight styles at no measurable cost, with legacy output unchanged.
- The Data demo shows a substantial improvement; the Paper demo a moderate one.
- **Owner review of the previews is required.** No professional-quality claim is made.

**Open:**
- Owner artistic review.
- Native Kannada review of the new note text (`ಬಿ: ೪೨೦ / ೧೨೦೦`).
- `test_data_storytelling`'s bars-transition assertion is specific to the original fixture: keep the fixture, and no test change was made.
- The 3D Explainer does not load `motion.js`.
- Uncommitted source changes listed above.
