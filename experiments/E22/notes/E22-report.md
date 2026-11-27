# E22 (P023.2): premium Whiteboard study, "Why are cities hotter?" (unseen topic, en-IN, full-bleed). Simplified.

**Reference inspected:** the [RSA Animate "Changing Education Paradigms"](https://www.thersa.org/videos/rsa-animate-changing-paradigms/) poster frame. Observed:
- varied line weight;
- caricature with gesture;
- a dense continuous board;
- fitted all-caps lettering;
- one orange spot-colour ribbon linking ideas;
- hatching;
- a coin-and-globe metaphor.

The Cognitive Media page linked from search returned 404.

**Reusable changes** (Whiteboard kit, additive; legacy strokes unchanged):
- `art.brush`: a variable-width stroke drawn in natural order.
- `art.ribbon`: the spot-colour connector.
- `caps` label style, with side padding for hand-font overhang.
- `exact` stroke widths in `ink`.
- Guidance: `references/styles/whiteboard.md`, "Reference-derived craft".

**Demo** (`topics/heat-wb-topic.js`):
- One continuous board across three shots: city baking under the sun, then a frying-pan metaphor for stored heat with a thermometer, then night with heat leaking out and a tree with a relieved person.
- A red ribbon links the regions; a final pull-back shows the whole board.

**Evidence:**
- Keyframes: `out/key-1-baking.png`, `out/key-2-frying-pan.png`, `out/key-3-whole-board.png`; sheet `out/heat-keyframes.png`.
- Earlier passing preview strip: `out/heat-motion-strip.png`.
- Earlier passing 4.6 s preview excerpt: `out/heat-preview-540x960.mp4`, from the run whose lettering overlapped the drawings.

**Validation (final run):**
- Plan and captions pass.
- Keyframes render with all 4 speech-cue checks passing.
- 90 Full HD frames take 8.8 s, about 0.10 s per frame, the cheapest style measured so far.
- **Preflight fails** (labels outside the text-safe area during camera travel), so the final preview render was refused.

**Defects found and fixed:**
- object ids clashing with symbol ids;
- `caps` line height below the hand font's glyph height;
- lettering drawn over drawings;
- the ribbon crossing the thermometer;
- the night region sitting in the caption band.

**Blocked:** HTML labels on a panning continuous board conflict with the label safe-area rule. Per-label hide-and-return timing (as done for "bakes") does not scale.
- **Recommended capability:** board lettering rendered as ink in the board plates. It would be drawn with the board, exempt from label rules, and keep its own legibility checks (minimum size at phone scale).
- Not implemented (out of budget).

**Remaining artistic gaps:**
- Drawings are simpler than RSA's: no detailed caricature, sparse interior detail, a scribbly tree canopy.
- Large empty board areas early on.
- The ribbon is decorative rather than carrying the narrative path.
- Owner review pending.

## P023.2B completion: board lettering

**Capability:** `wbKit.art.letter` (Whiteboard kit, additive). Lettering is written as board ink inside drawing plates, revealed in stroke order with a clip, using the browser's script shaping and an optional RTL direction. Board lettering may be cropped by camera framing. Caption and label safeguards are unchanged.

**Composition:**
- "BAKES", "STORES HEAT" and "COOLER" are now board lettering, fitted beside or inside their drawings ("COOLER" inside the tree canopy, written on its own cue).
- The HTML labels and the hide-and-return workaround are removed.

**Validation:**
- Harness 7/7: 5 speech-cue checks; final preflight on all 342 frames, 0 defects; preview renders and passes the media checks.
- `test_ink.py` 3/3 over 498 samples:
  - every word is written;
  - smallest in-view on-screen size 54 px against a 26 px minimum;
  - never under a caption;
  - intentional crops: "bakes", "cooler".
- Legacy `test_whiteboard` 13/13.

**Performance:** 90 Full HD frames take 11.5 s (was 8.8 s with HTML labels); the full 540×960 preview takes 40 s.

**Evidence:**
- `out/heat-keyframes.png` (`key-1-baking`, `key-2-frying-pan` with "BAKES" deliberately cropped by the pan, `key-3-whole-board`).
- 4.6 s preview `out/heat-preview-540x960.mp4` (night beat and pull-back to the whole board).
- `out/heat-motion-strip.png`.

**Remaining gaps:**
- The lower quarter of the board stays empty.
- The night building is partly behind the caption at the end.
- The ribbon ends at the thermometer rather than leading to the tree.
- "STORES HEAT" touches the canopy fill.
- Drawings remain simpler than RSA references.
- Owner review pending.
