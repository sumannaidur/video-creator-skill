# Style: Data Storytelling

Premium editorial data visualisation. Charts build themselves from the true numbers, the one figure that matters is highlighted against muted context, and every graphic carries its units and its source. It reads like a quality newsroom's explainer, not a dashboard or a slide. The [creative direction](../creative-direction.md) principles apply first; this file adds what is specific to data.

## Integrity rules (non-negotiable)

- **Data from sources only:** every number comes from the research claim ledger. Show a **source line** (`labelStyle: 'source'`) in every shot that shows data. Label synthetic, illustrative or estimated data as such on screen.
- **Geometry is computed, never drawn by eye.** The kit refuses rather than distorts:
  - Bars start at a zero baseline. Negative values and domains below the data are refused (`art.barChart`).
  - Proportional circles are area-true (radius ∝ √value) (`art.circles`).
  - Unit charts need integer 0 ≤ value ≤ total (`art.units`).
  - Line charts need a y-domain that contains every value (`art.lineChart`).
  - Counters are integers and end exactly on the true value (`dataKit.counter`).
- **Units and scale:** always show units (the `unit` option, or the label). Gridlines and ticks come from the data's own nice steps. Never truncate an axis to exaggerate a change; use a line chart with an honest domain instead.
- **Animation must not mislead:** growth animates from zero to the true value. A chart may pause mid-build only while the narration is describing that build.

## Visual identity

- **Page:** a crisp white stage with a charcoal top rule, on a pale grey frame. Hairline gridlines (`#e4e6ea`); no textures, shadows, 3D or gradients on data.
- **Colour:** charcoal ink `#1a1c1f`, muted context `#b9bdc4`, one accent `#e4572e` for the point being made, and a secondary `#2f6db3` for a second series or a total. Highlight one thing per shot.
- **Typography:** the multilingual font (`--vc-font`), never forced to uppercase. Big bold numerals with tabular figures for values. Counters can use native digit sets (`system: 'kannada' | 'devanagari' | 'telugu' | 'tamil' | 'decimal'`).

| `labelStyle` | Use |
|---|---|
| `headline` | The shot's statement, left-aligned editorial headline |
| `value` | A big number (also hosts counters) |
| `note` | An annotation with an accent rule; pair with `art.annotate` leaders |
| `source` | Small grey attribution line (required wherever data is shown) |

**Captions:** a charcoal card with an accent bar on the left, white 42 px text, and a minimum height that fits two lines.

## Charts and motion

- **Graphics:** `art.barChart`, `art.lineChart`, `art.circles`, `art.units`, `art.timeline` and `art.annotate` render inside a plate symbol whose view box is `0 0 1000 (1000/aspect)`, so stage geometry is exact. Use `ctx.aspect` and `ctx.orientation` to place charts beside their story in landscape and stacked in portrait.
- **Building:** `motion.build(id, at, dur)` grows a chart from zero through the `--draw` channel. Bars rise in sequence, lines draw along their path, circles and units fill in order, and value labels appear as each bar completes.
- **Counting:** `motion.count(id, at, dur)` counts a `counter` object from its start to its exact end value.
- **Camera:** small, steady push-ins at plan moments. Never move the camera while a value is being read.
- **Transformations (P022.2):**
  - When the story changes the form of the same quantity (parts to a total, values to shares), move the same marks so the viewer can follow them. Keep their identity, order and colour, and keep every intermediate state honest (one shared scale while they move).
  - Bars can stack into a total column by rescaling their `--draw` channel and translating them.
  - Data marks use `inOut` or `outQuart`, **never `overshoot` or `settle`**, which would show false values. Labels and notes may use them. Flag data objects with `dataMark: true`, and preflight's `data-marks` check then refuses those curves.
- **Emphasis:** dim what the narration is not about rather than enlarging what it is about, and put the note next to the mark.
- **Editorial ranked rows (P023.4):** `art.hbars({x, y, w, rowH, data})` returns one symbol per row, so rows can be transformed with identity kept, plus `axis(max, step, {unit})`.
  - Label directly at the bar end (label style `direct`), never with a legend.
  - Headline plus `deck` subtitle; notes as `callout` cards placed where they cover no data.
- **Changing what a mark encodes** (height, then a gap): retract the rows together, swap and relabel the axis, then grow the new values. Never show a mix of two scales.
- **`bars` transition:** chart columns rise across the frame (charcoal with accent columns) to cover the cut, then fall away to reveal the next shot.

## Implementation

`scripts/styles/data-storytelling/` holds:
- `backend.mjs`: `createShotBackend` on the shared shot core.
- `host.html`, `data.css` and `kit.js` (`globalThis.dataKit`, which registers `bars` and the label styles via `globalThis.vcShotStyle`).
- The topic contract: `globalThis.dataStoryTopic = {shots, symbols(ctx), css, build(ctx)}`.

## Self-review additions

- Can the viewer name the comparison from the opening and see its answer in the final emphasis? Keep the scale stable and make any denominator or coverage change visible where it matters.
- Does every number trace to a ledger claim, and does every data shot show its source?
- Would the chart look the same if drawn on graph paper from the numbers (zero baseline, true areas, honest domain)?
- Do highlights distinguish the comparison or value being discussed?
- Are units visible wherever a number is?
- Does any animation suggest a value the data does not contain?

## Full-bleed presentation (optional, P018.6)

Selected with the preference `presentation=full-bleed` or by the topic's own `presentation`; see [rendering](../rendering.md#presentation-modes-topicpresentation). Highlighting the spoken word changes only colour, background or decoration, so the caption layout never moves.

- **Look:** Captions: an editorial white box with the accent rule on the left. The spoken word takes the accent colour, underlined. Hook: a heavy black headline with the key word in the accent.
- **Composition:** The page fills the frame. Charts keep their axes and source line inside the text-safe area. Place the big numeral in the upper half so captions never cover data.
- **Status:** validated on the existing fixture in full-bleed mode (keyframes and preflight). There is no production video in this mode yet.

## Not part of the style

Any topic's datasets, charts, layouts or cue times. The P017.4 fixture (`scripts/tests/fixtures/ds-topic.js`) uses **synthetic** rainfall data labelled as such. It is an example, not a template.

**Status:** P017.4. Validated on a compact synthetic Kannada fixture only:
- Portrait and landscape layouts.
- Kannada numerals in the counter.
- Data-integrity refusals and proportionality checks.
- Preflight, a 5.6 s preview, and cue, camera and transition checks.

There has been no full production and no human editorial review. Counters show integers only and have no thousands separators. Fonts are system fonts, with licensing review pending.
