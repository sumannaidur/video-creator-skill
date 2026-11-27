# Style: Whiteboard

A hand-drawn explanation on a real whiteboard. The viewer watches ideas being drawn, written, connected, rubbed out and redrawn as the narrator speaks. It is a drawing that thinks, not clip art on a white slide. The [creative direction](../creative-direction.md) principles apply first; this file adds what is specific to whiteboards.

## Visual identity

- **Board:** a glossy off-white board (`#fbfbf8`) in an aluminium frame on a pale wall. It carries a soft gloss streak and faint ghosting from earlier erasures. Drawings are flat ink with **no drop shadows**.
- **Ink:** black marker (`#1d2026`) for structure. Variable weight comes from a seeded width per stroke plus a thinner offset second pass, like a chisel-tip marker.
- **Selective colour:** blue `#2758c4`, red `#d93a2b`, green `#2b8c4e`, and a yellow highlighter `#ffd93b`. Use one or two accents per shot, each with a meaning (water is blue, the cause is red, growth is green). Fill colour with translucent marker that appears after its outline is drawn.
- **Shading:** marker hatching (`art.hatch`), never gradients.

## Drawing language

- **Hand-drawn geometry:** `art.hand` draws seeded wobbly strokes through points, `art.loop` draws overshooting circles, `art.arrow` gives curved shafts with two-stroke heads.
- **Ink order is storytelling:** `art.ink(strokes)` draws its strokes in sequence as the object's `--draw` channel goes from 0 to 1. Order the strokes the way a person would draw: outline first, then detail, then the colour fill. `weight` gives a stroke a longer or shorter share of the time.
- **The pen:** a marker (`art.pen`) can follow the stroke being drawn (`motion.pen`), so the drawing visibly comes from a hand. Use it on key reveals, not every stroke.
- **Writing:** labels are written left to right (`motion.write`) in a handwriting font. Indic scripts fall back per glyph to the multilingual font, so Devanagari, Telugu and the other locales stay legible.
- **Connections:** draw hand arrows and loops between ideas at the word that relates them.
- **Erasing and redrawing:** rub out a part (`motion.erase`), then redraw it changed. A bud becomes a taller stem; a wrong answer is replaced. Only erase when the change means something.

## Reference-derived craft (P023.2; RSA Animate / Cognitive)

Observed in RSA Animate frames:
- strongly varied marker line weight (heavy contours, light interior detail);
- expressive caricature faces and gestures;
- a dense board that fills edge to edge as the talk goes;
- hand-lettered capitals fitted into the spaces between drawings;
- one spot colour that links ideas, plus hatching for shade;
- concrete visual metaphors (an economy as a coin with a globe).

Use these where they serve the explanation:

- **`art.brush(points, {width, taper, pressure})`:** one organic stroke with thin ends and a full-weight middle. It is returned as consecutive segments, so it draws in the order a hand would. Spread it into `art.ink([...])`. Use about 10 for contours and about 4–5 for interior detail.
- **`art.ribbon(points, {color})`:** a spot-colour band linking ideas. Its inked outline draws first, then it is coloured in. Route it through empty board space, never across drawings.
- **Lettering:** the `caps` label style gives hand-lettered capitals in the board font. Place lettering in a clear space beside its drawing, never on top of it.
- **Continuous board:** one scene can serve several shots. The board fills up, the camera travels between regions, and a final pull-back can reveal the whole argument.
- **Board lettering (P023.2B):** `art.letter(text, x, y, {size, color, dir})` goes inside an `ink()` list. It is written in stroke order as part of the drawing, travels with the board, and may be cropped by deliberate camera framing.
  - Use it for words that belong to a drawing.
  - Keep UI labels (callouts that must always be fully readable) as labels. Their safe-area rules are unchanged.
  - Board lettering keeps its own checks, run by preflight (`ink-legibility`): a minimum on-screen size (`minPx`, default 26 px at 1080 wide) wherever it is mostly in view, and never under a visible caption.
  - Script shaping is the browser's. `caps` affects only cased scripts; use `dir: 'rtl'` for right-to-left text.

## Composition

- Build one drawing per idea and grow it. Prefer adding to and transforming a drawing over starting a new one.
- Leave white space around the drawing, because the board itself is part of the look, but plan where the next part will grow so that the space is purposeful.
- Topics receive `ctx.aspect` and `ctx.orientation`. Author plate symbols with a `0 0 1000 (1000/aspect)` view box so drawing coordinates map exactly onto the stage. Stack in portrait; place cause and effect side by side in landscape.

## Labels and captions

| `labelStyle` | Look |
|---|---|
| `marker` | Handwritten text in ink or an accent colour |
| `boxed` | Handwritten text in a hand-drawn box |
| `highlight` | Handwritten text over a highlighter swipe |
| `note` | A small sticky note |

**Captions:** a clean white card with a marker underline in the shot's accent colour. They're set in the multilingual font for legibility, not handwriting. The card's minimum height fits two lines, so it never resizes the stage.

## Motion and transitions

- **Motion:** drawing follows speech: each `draw`, `write` and `pen` starts at a resolved-plan cue. Camera moves are slow and quiet (`planCamera`), like stepping back from the board.
- **`erase` transition** (the only Whiteboard transition): a felt eraser sweeps across the board and leaves a clean band. After the cut, the next shot starts on a clean board and draws itself. Use `lead` and `tail` to tune it.

## Implementation

`scripts/styles/whiteboard/` holds:
- `backend.mjs`: the shared shot core via `createShotBackend`.
- `host.html`, `board.css` and `kit.js`. The kit holds `globalThis.wbKit` and registers the `erase` transition and label styles through `globalThis.vcShotStyle`.
- The topic contract: `globalThis.whiteboardTopic = {shots, symbols(ctx), css, build(ctx)}`.

## Self-review additions

- When the board accumulates marks, can the eye follow new ink back to its cause? Keep lettering adjacent to the drawing and route connectors through open board space.
- Does every drawing appear at the word that introduces it, in the order a person would draw it?
- Is colour rare and meaningful?
- Does it look like a person explaining at a board, rather than a slide or clip art?

## Full-bleed presentation (optional, P018.6)

Selected with the preference `presentation=full-bleed` or by the topic's own `presentation`; see [rendering](../rendering.md#presentation-modes-topicpresentation). Highlighting the spoken word changes only colour, background or decoration, so the caption layout never moves.

- **Look:** Captions: a clean card with an ink border and an offset shadow. The spoken word gets a yellow highlighter stroke. Hook: hand-lettered ink, with the key word circled in red marker.
- **Composition:** The whole frame is the board. Keep drawings at hero scale in the central two thirds. Leave the lower sixth for captions. Draw labels inside the text-safe area, not near the board edge.
- **Status:** validated on the existing fixture in full-bleed mode (keyframes and preflight). There is no production video in this mode yet.

## Not part of the style

Any topic's drawings, layouts or cue times. The P017.2 fixture (`scripts/tests/fixtures/wb-topic.js`) is an example, not a template.

**Status:** P017.2. Validated on a compact synthetic fixture only: English portrait and landscape, a Hindi caption and label variant, preflight, a 5.6 s preview and cue/camera/transition checks. There has been no full production and no human artistic review. Handwriting and caption fonts are system fonts, with licensing review pending.
