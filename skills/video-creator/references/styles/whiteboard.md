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

- Does every drawing appear at the word that introduces it, in the order a person would draw it?
- Is colour rare and meaningful?
- Is there at least one transformation (erase and redraw, add and change) instead of only new drawings?
- Does it look like a person explaining at a board, rather than a slide or clip art?

## Full-bleed presentation (optional, P018.6)

Selected with the preference `presentation=full-bleed` or by the topic's own `presentation`; see [rendering](../rendering.md#presentation-modes-topicpresentation). Highlighting the spoken word changes only colour, background or decoration, so the caption layout never moves.

- **Look:** Captions: a clean card with an ink border and an offset shadow. The spoken word gets a yellow highlighter stroke. Hook: hand-lettered ink, with the key word circled in red marker.
- **Composition:** The whole frame is the board. Keep drawings at hero scale in the central two thirds. Leave the lower sixth for captions. Draw labels inside the text-safe area, not near the board edge.
- **Status:** validated on the existing fixture in full-bleed mode (keyframes and preflight). There is no production video in this mode yet.

## Not part of the style

Any topic's drawings, layouts or cue times. The P017.2 fixture (`scripts/tests/fixtures/wb-topic.js`) is an example, not a template.

**Status:** P017.2. Validated on a compact synthetic fixture only: English portrait and landscape, a Hindi caption and label variant, preflight, a 5.6 s preview and cue/camera/transition checks. There has been no full production and no human artistic review. Handwriting and caption fonts are system fonts, with licensing review pending.
