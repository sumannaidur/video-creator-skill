# Style: X-Ray Explainer

See inside things. Opaque shells give way to an X-ray window or turn to glass, cut faces show their section, and the parts inside are lit one at a time while they work. It is the language of a precise technical cutaway, not a medical scan, a sci-fi HUD or a slide. The [creative direction](../creative-direction.md) principles apply first; this file adds what is specific to cutaways.

## Honesty rules

- **Illustrative, never imaging:** these effects imitate no real X-ray, CT, MRI or industrial imaging. Every video in this style shows a `disclaimer` label (for example «illustration only, not a real scan») in each shot that uses a see-through effect. Never present the style as diagnostic or as real inspection data.
- **Structure stays true:** parts keep their real relationships (what is inside what, what drives what, relative sizes where sourced). The kit enforces mechanical consistency where it can:
  - Gears are built from module × teeth, so the pitch radius is m·z/2. Meshing pairs placed at centre distance m(z₁+z₂)/2 are dimensionally consistent.
  - `motion.mesh` spins meshing gears in opposite senses at exactly the inverse tooth ratio.
  - Gears with fewer than 6 teeth are refused.
- **Mark simplification:** state simplified or symbolic internals in the plan's guardrails.

## Visual identity

- **Light table:** a deep field (`#08151d`) with a soft central illumination and a faint reference grid. It sits on a near-black frame.
- **Shells:** opaque machined metal (`art.metal`) for the outside. Glass shells (`art.glass`) show only a bright cyan rim (`#7fd8ff`) and an almost-clear fill.
- **Internals:** warm technical materials (brass `#c9a24b`, copper `#c46a3c`, steel) under **selective illumination**. Parts stay dimmed until they are the subject (`litCss` with `motion.illuminate`).
- **Section planes:** cut faces are hatched in amber (`#ffb547`) (`art.section`, even-odd, so an outer path plus an inner path hatches only the wall).
- **Inspection:** corner brackets (`art.brackets`), dashed axes (`art.axis`) and exploded offsets (`motion.explode`).

## Labels and captions

The multilingual font, never forced to uppercase (validated with Telugu).

| `labelStyle` | Use |
|---|---|
| `callout` | Naming a part (cyan outline) |
| `spec` | A technical fact, such as teeth or ratio (rule plus text) |
| `amber` | The conclusion of the shot |
| `disclaimer` | The required illustrative note |

**Captions:** a dark inspection card with accent corner brackets and a minimum height that fits two lines.

## Motion

- **X-ray window:** `windowCss(id, {x0, y0, x1, y1, r})` plus `motion.scan(id, at, dur)`. A circular hole opens in an opaque object and travels across it, revealing the real internals drawn beneath. Pair it with a ring object that moves with it, which can carry the speech-cue check.
- **Mechanism-driven:** parts move because they are driven: `mesh` for gears, `explode` for assembly, `illuminate` and `inspect` for attention, all at the word that names them.
- **Camera:** slow push-ins to the mechanism at plan moments (`planCamera`).
- **`sweep` transition:** a cyan scanner beam passes down the frame, darkening behind it before the cut. After the cut it passes again, uncovering the next shot.

## Implementation

`scripts/styles/x-ray-explainer/` holds:
- `backend.mjs`: `createShotBackend` on the shared shot core.
- `host.html`, `xray.css` and `kit.js` (`globalThis.xrayKit`, which registers `sweep` and the label styles via `globalThis.vcShotStyle`).
- The topic contract: `globalThis.xrayTopic = {shots, symbols(ctx), css, build(ctx)}`.
- **Symbol rule:** use zero-origin view boxes. The engine's `<use>` places a symbol's viewport at 0,0, so centred art (gears, brackets, rings) must be translated inside the symbol.

## Self-review additions

- Can the viewer locate the revealed parts within the original exterior? Make the working interface visible and distinguish occluded context from the parts that actually move.
- Is the disclaimer visible wherever a see-through effect is used?
- Do the parts' relationships (containment, drive, ratio, relative size) match the sources and the guardrails?
- Does inspection lighting make the named part or working interface clear?
- Do cutaways show their section faces?
- Could this be mistaken for a real scan? If so, change it.

## Full-bleed presentation (optional, P018.6)

Selected with the preference `presentation=full-bleed` or by the topic's own `presentation`; see [rendering](../rendering.md#presentation-modes-topicpresentation). Highlighting the spoken word changes only colour, background or decoration, so the caption layout never moves.

- **Look:** Captions: a dark glass HUD panel with a thin glass border. The spoken word turns amber. Hook: glowing glass-blue type with the key word outlined in amber.
- **Composition:** The cut-away fills the frame. Keep the inspected mechanism centred and let the sweep cross the whole frame. Place callouts at the sides, never under the caption band.
- **Status:** validated on the existing fixture in full-bleed mode (keyframes and preflight). There is no production video in this mode yet.

## Not part of the style

Any topic's machines, organs, devices, layouts or cue times. The P017.6 fixture (`scripts/tests/fixtures/xr-topic.js`, a two-gear box) is an example, not a template.

**Status:** P017.6. Validated on a compact synthetic Telugu fixture only:
- Portrait and landscape layouts.
- The X-ray window, the glass cutaway with section walls, and selective illumination.
- Mechanics checks.
- Preflight, a 5.6 s preview, and cue, camera and transition checks.

There has been no full production and no human technical review. Fonts are system fonts, with licensing review pending.

## Exact mechanisms and cutaway conventions (P023.7, optional)

- **Chain drives:**
  - `art.sprocket(z, pitch)` uses pitch radius p / (2 sin(π/z)).
  - `art.chainLoop(c1, r1, c2, r2, pitch)` solves the centre distance so the loop is an even whole number of links.
  - `motion.chainDrive(...)` turns both sprockets the same way in the ratio z1/z2, with the chain moving at r·θ.
  - The engine clamps `--draw` to [0, 1], so channels carry normalised progress; scale it in the art (`markup(var, travel)`).
- **Cutaway order:** opaque exterior, then an X-ray porthole (`windowCss` with a radius smaller than the part, so the casing stays readable), then the casing as a translucent ghost with the internals fully drawn. Callouts retire before the camera moves away from their part.
- **Verify mechanisms in preflight:** return `checks.ratios: [{a: motion.angle('driver'), b: motion.angle('driven'), ratio, label}]` from `build`. Preflight's `mechanism` check verifies every frame (relative tolerance 1e-5).
