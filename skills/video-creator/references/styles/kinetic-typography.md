# Style: Kinetic Typography

Text is the picture. Bold editorial type fills the frame, each word arriving exactly when it is spoken, composed with dynamic scale, position and masking so that rhythm and emphasis become visible. It is not animated subtitles: the composition, not the caption strip, carries the story. The [creative direction](../creative-direction.md) principles apply first; this file adds what is specific to type.

## Rules (enforced by the kit)

- **Words come from the narration only.** `kineticKit.word(ctx, text)` refuses anything that is not a whitespace token of the narration phrases (`ctx.phrases`). Trailing punctuation is dropped for display, and compounds stay whole.
- **Timing comes from speech cues only.** `motion.say(id, cueId)` requires a resolved-plan cue ID and refuses typed seconds. Give every displayed word its own plan cue. Emphasis and exits may use seconds or cues, but reveals may not.
- **Indic shaping is preserved:**
  - Words are real HTML text shaped by the browser.
  - They are never split into letters or graphemes, never letter-spaced and never forced to uppercase.
  - Line-height is at least 1.5 for marks above and below the baseline.
- **Fit by measurement:** `kineticKit.fit(text, maxPx)` measures the shaped word with the browser's font engine. Leave headroom for effects: `slam` lands from 1.12×, so fit slammed words to 88% or less of the stage width.

## Visual identity

- **Fields:** full-bleed colour (`kineticKit.art.field`), with an optional giant outlined index numeral. The default is an ink field `#111214` with warm white type `#f4f1ea` and one signal yellow `#ffd400`. Shots may invert, for example to yellow with ink type and a red accent. Use one accent per shot.
- **Type:** the heaviest available weight (`"Segoe UI Black"`, falling back to `"Nirmala UI"` bold for Indic scripts). Scale contrast carries the hierarchy: one word dominates each beat.
- **Label styles:**

| `labelStyle` | Look |
|---|---|
| `solid` | Ink-coloured type |
| `accent` | Accent colour |
| `outline` | Stroked, transparent fill |
| `block` | Field-coloured type on an accent block |

  Emphasis flips any word's colour to the accent through the `--glow` channel.
- **Captions:** a quiet strip under the stage with a hairline in the shot's accent colour. It stays readable but never competes with the composition. The minimum height fits two lines.

## Motion

| Helper | Effect |
|---|---|
| `say(id, cue, 'rise')` | Masked rise |
| `say(id, cue, 'slam')` | Lands with weight |
| `say(id, cue, 'wipe')` | Revealed in reading order |
| `say(id, cue, 'drop')` | Falls in from above |
| `emphasize(id, when)` | Colour flip to the accent |
| `swap(from, to, cue)` | One word gives way to another, for typographic transformation |
| `exit(id, when)` | Pushed up and out |

- **Rhythm:** vary the effect with the beat. Use `slam` for the key word and lighter reveals for connecting words. Keep pauses visible as stillness.
- **Camera:** small breathing pushes at plan moments (`planCamera`). The type moves; the camera barely does.
- **`shutter` transition:** horizontal bands, like lines of type, slice in from alternating sides to cover the cut, then slide out the other way.

## Composition

Topics receive `ctx.aspect`, `ctx.orientation` and the measured stage size. Compose per orientation:
- **Portrait:** tall stacks with alternating offsets.
- **Landscape:** rows, or one dominant word with satellites. The P017.5 fixture only stacks, which leaves landscape type small.

Set per-word font sizes and palettes in the topic's own CSS, for example `#id .piece-label {font-size}` through a `css` getter computed in `symbols(ctx)`.

## Implementation

`scripts/styles/kinetic-typography/` holds:
- `backend.mjs`: `createShotBackend` on the shared shot core.
- `host.html`, `type.css` and `kit.js` (`globalThis.kineticKit`, which registers `shutter` and the label styles via `globalThis.vcShotStyle`).
- The topic contract: `globalThis.kineticTopic = {shots, symbols(ctx), css, build(ctx)}`.

## Self-review additions

- Can the shape interaction convey the verb or relationship with audio off? Inspect the largest rendered words for intact marks and clear space around them.
- Is every word on screen a narration word, revealed on its own cue?
- Is there one dominant word per beat, and is it the word the narration stresses?
- Do Indic words render as whole, correctly shaped clusters at every size?
- Does the composition change shape across beats instead of repeating one layout?

## Full-bleed presentation (optional, P018.6)

Selected with the preference `presentation=full-bleed` or by the topic's own `presentation`; see [rendering](../rendering.md#presentation-modes-topicpresentation). Highlighting the spoken word changes only colour, background or decoration, so the caption layout never moves.

- **Look:** Captions: quiet. No box, light text with a dark halo, smaller than the kinetic words. The spoken word turns yellow. Hook: a huge statement in the style's own colours with the key word in yellow.
- **Composition:** The type is the picture. Keep kinetic words in the upper two thirds so captions don't compete with them. Avoid duplicating the caption line as a kinetic word on the same beat.
- **Status:** validated on the existing fixture in full-bleed mode (keyframes and preflight). There is no production video in this mode yet.

## Not part of the style

Any topic's words, layouts, effects per word or cue times. The P017.5 fixture (`scripts/tests/fixtures/kt-topic.js`) is an example, not a template.

**Status:** P017.5. Validated on a compact synthetic fixture only:
- English and Telugu, in portrait and landscape.
- One cue per word, with refusals of non-narration words and of typed reveal times.
- Preflight, a 5.6 s preview and the shutter transition.

There has been no full production and no human typographic review. Indic scripts use the multilingual font's bold, as no black weight is available. Fonts are system fonts, with licensing review pending.

## Choreography helpers (P023.5, optional)

- **Effects for `say()`:** `from-left` and `from-right` (directional, masked along the direction of travel) and `stamp` (lands with weight, never larger than 1.03×). Words are always whole narration tokens: never split a word, conjunct or cluster.
- **`sweep(shape, word, cue)`:** a shape crosses the frame and uncovers a word in its direction. Shapes from `art.disc` and `art.slab` should mean something (light, an object, a boundary), never decoration.
- **Indic line spacing:** scripts with marks below the baseline (Telugu, Kannada, and others) need about 1.6× the font size between stacked lines. At 1.45× stacked Telugu lines were measured to collide.
