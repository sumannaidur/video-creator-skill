# E21 (P023.1): premium Paper Explainer study, "How do bees make honey?" (unseen topic, en-IN, full-bleed)

**Scope:**
- Topic-level craft only; no engine, kit or dependency changes.
- The released Skill is untouched; nothing is committed.
- Synthetic timeline, from the `test_richness` harness flow (`harness.py`).

## Also closed: E20 Data morph and camera assertions

`experiments/E20/test_morph.py` passes **7/7**. It drives the real Data Storytelling page with the after topic and the resolved plan, and asserts:
- 2 camera moments per shot and no wipe;
- every bar's `--draw` stays within [0, 1] at 30 fps (no data overshoot);
- one shared scale across all bars during the rescale (13 frames);
- every bar lands at exactly 500/1200;
- every bar lands at its stacked position computed from the data (0 px error);
- stack order and offsets 0/180/600/860;
- the counter ends at 1200 in Kannada digits.

The legacy fixture and test are unchanged.

## Craft decisions (in `topics/bees-paper-topic.js`)

- **Two-layer paper shadow:** a tight contact shadow (from `paperKit.cut`) plus a wide, soft ambient shadow along the same key light.
- **Hand-cut silhouettes:** outlines are densified and deckled with seeded irregularity.
- **Cut-edge core:** a thin lighter line where coloured paper is cut.
- **Folded paper:** petals and leaves have a centre crease, one half lit and one in shade.
- **Vellum:** translucent bee wings with veins.
- **Atmospheric depth:** pale, cool far ridges with haze; bumpy cut-paper bushes; darker foreground leaves.
- **Motion** (existing primitives):
  - wings flutter on held poses at 12 per second while riding the body's flight path, sampled per frame;
  - the bee hovers (anticipation), then lands on the flower with `settle`;
  - the flower, built as one piece with its stem, dips from its base and recovers;
  - honey fills in a staggered sequence; wax caps press on and settle.
- **Composition:** the camera pushes in to the landing; a vignette focuses the comb on the cells being filled.

## Evidence

- **Keyframes (Full HD):** `out/key-1-landing.png`, `out/key-2-fanning.png`, `out/key-3-sealed.png`; sheet `out/bees-keyframes.png`.
- **Preview:** `out/bees-preview-540x960.mp4`, 540×960, 30 fps, 336 frames, 11.2 s, passes the media checks. Motion sheet `out/motion-bees.png`.
- **Harness, 7/7:**
  - plan resolves; word captions build;
  - keyframes with 2 speech-cue checks;
  - preflight on every frame (336 frames, 0 defects);
  - two cost runs; preview media checks.
- **One correction pass, after the first keyframes:**
  - the flower head was detached from its stem and the bee landed in empty air;
  - bushes read as lily pads; foreground leaves were out of frame;
  - the comb had no focal point.
  - **Fix:** the stem and head became one piece, and the landing point is computed from the flower geometry; bumpy bushes; a vignette.
- **Earlier correction:** the honey fill started 0.1 s before its cue (caught by the cue check).

## Performance (same harness as P018.4)

| Measure | P018.4 canal lock | E21 bees |
|---|---|---|
| 90 Full HD frames | 16.5–18.4 s (about 0.19 s per frame) | 45.5 s (about 0.51 s per frame) |
| Preview at 540×960 | 42–52 s for 330 frames | 154 s for 336 frames |

About 2.5× the per-frame cost. The likely cause is the blurred ambient-shadow filter on many layered pieces (not profiled). It is still far below the Blender path (17.6 s per Full HD frame). A 60 s Full HD film is estimated at about 15 min of rendering.

## Assessment (agent self-review; owner review required)

**Improved over P018.4:**
- Pieces read more like physical paper: softer layered shadows, irregular hand-cut edges, folded petals, translucent wings.
- The bee is an appealing, articulated character, and the landing reads as weight.
- The comb has convincing layered cells.

**Remaining gaps:**
- **Hive staging:** the comb fills the whole frame with a repeating pattern. The bees are small and the honey fill is subtle, so the key story moment (nectar becoming honey) is weak. It needs a closer shot size and stronger honey colour and gloss.
- **Meadow composition:** the upper half is empty sky once the hook leaves, and there are few mid-scale details (no stamens, buds or insects' trail).
- **Small parts:** the nectar drop is too small to read; the "honey" chip partly covers a cap.
- **Reference study:** I did **not** inspect professional cut-paper frames in this task (budget). These choices rest on general knowledge of cut-paper and diorama craft, which should be checked against references you choose.
- **Cost and tone:** about 2.5× the render cost; the held wing poses may need tuning.
- Not artistically validated; not production-ready.

## P023.1B update: reusable craft, macro hive

**Reference study (actually inspected):** layered cut-paper work by Owen Gildersleeve ([Inspiration Grid feature](https://theinspirationgrid.com/handcrafted-worlds-layered-papercut-art-by-owen-gildersleeve/)). Observed:
- wide, low-opacity shadows, darkest at the cut edge;
- nested layers stepping from dark to a bright core as the focal device;
- intricate, crisp silhouettes with a visible paper core;
- saturated palettes with clear value steps.

**Reusable Paper capabilities** (`paperKit.art`, additive):
- `deckle`: hand-cut outline;
- `penumbra`: filter-free soft shadow;
- `piece`: penumbra + cut + paper core; blur is optional;
- `folded`, `vellum`;
- `recede`: nested layers toward a lit core.

**Guidance:** `references/styles/paper-explainer.md`, "Paper craft (reference-derived)", including macro framing for small processes. The depth-stack quota was softened to "as many depths as the shot needs".

**E21 topic:**
- Now uses the kit helpers; its local copies were removed.
- The hive is restaged as a macro of one cell (a third of the frame, neighbours cropping) with darker, greyer outer cells.
- A large fanning bee is in front and a cropped carrier bee above.
- The story is staged in the cell: empty, then a nectar drop, pale watery nectar, vellum vapour rising (stepped), deep amber honey, a wax cap pressing on and settling.

**Validation:**
- Harness 7/7: 3 speech-cue checks (pass, thickens, seal); preflight on all 336 frames, 0 defects; preview media checks.
- `test_paper_kit` 7/7. The kit change is additive: existing helpers are unchanged, and legacy topics don't call the new functions.

**Evidence:**
- `out/key-1-landing.png`, `out/key-2-nectar.png`, `out/key-3-honey.png`; sheet `out/bees-keyframes.png`.
- Motion excerpt `out/bees-hive-excerpt-540x960.mp4` (4.8 s: nectar drop, vapour, honey), strip `out/bees-hive-excerpt-strip.png`.

**Performance (filter-free shadows):**
- 90 Full HD frames: **18.6 s**, down from 45.5 s with blur; P018.4 measured 16.5–18.4 s.
- Full 11.2 s preview at 540×960: 65 s, down from 154 s.

**Remaining gaps:**
- The nectar drop and vapour wisps are still small and faint at phone size.
- The fanning bee's head crops at the left edge.
- Distant capped cells mix toward a dull grey-brown.
- The meadow still has empty sky after the hook.
- The "honey" chip floats loosely in a neighbouring cell.
- Only one reference artist was inspected.
- Owner artistic review is pending.
