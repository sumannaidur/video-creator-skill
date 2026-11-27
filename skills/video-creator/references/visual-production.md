# Visual production

Author each topic as a **topic module**: original inline SVG artwork plus motion data, evaluated by the shot engine. The style file supplies the visual grammar; the topic module supplies every topic-specific shape, scene and cue.

## Topic module contract (as implemented by the experimental engine)

`globalThis.paperTopic = { shots, symbols(ctx), css, build(ctx) }`

- **`shots`** is a list of `{id, scene, phrases:[first,last] | start, accent, transition}`.
  - The default cut is the midpoint of the pause between phrases.
  - An explicit `start` (seconds, or `{phrase, offset}`) allows several shots within one phrase.
  - Transitions belong to the outgoing shot: `dissolve` (needs a texture symbol) or `sheet`.
- **`symbols(ctx)`** returns `<symbol>` markup. Give symbol IDs a different prefix from object IDs, because a collision breaks lookups.
- **`build(ctx)`** returns `{scenes, cameras, checks}`. Use `ctx.motion` helpers: `track`, `show`, `showHide`, `reveal`, `ambient`, `emit` and `cue(id, phraseIndex, offset)`. A cue must make its object invisible before the cue time and visible after it.
- **Speech cues from the resolved plan** (render with `--plan`; see [rendering](rendering.md)): `ctx.motion.speechCue(cueId, objectId?)` returns the cue's time in seconds and registers the visibility check on the plan's object (or the one you name). `ctx.cue(cueId)` returns the time without a check, for anything else you want to time to speech. `ctx.plan` exposes the resolved shots and cues. Use these instead of typing speech timestamps; every plan cue with an `id` must be used. With a plan, `shots` lists the plan's shot IDs in order with only `scene` and `transition`: boundaries come from the plan, and a `start` or `phrases` is rejected. How an object appears, moves and leaves stays entirely your choice.
- `cue(id, phraseIndex, offset)` remains for legacy topics rendered without a plan.
- **Style kits:** a style may ship optional helpers for its own look. Paper Explainer's is `globalThis.paperKit` (see [Paper Explainer](styles/paper-explainer.md)); its motion helpers accept cue IDs, and `planCamera` places camera keys at the plan's camera moments. Kits are building blocks, not templates; other styles are not bound by them.
- **`checks`** optionally sets `keyframes`, `repeatAt` and `absentAfter`.
- **Timing:** every state is a pure function of time. Seed any variation; no randomness at render time.

## Production loop

1. Build one shot at a time. Render keyframes only with the packaged renderer (`scripts/render.mjs --keys-only`; see [rendering](rendering.md)). Cue, layout and repeatability checks run automatically.
2. Self-review the keyframes (see creative direction). Make one correction.
3. **Before the preview, run the visual preflight** (`scripts/preflight.mjs`; see [rendering](rendering.md)). It inspects every output frame time, including mid-move frames that keyframes miss (such as a label still visible while the camera pans away), without capturing images. Fix every defect; then render with `--preflight <out>/preflight.json`. Mark art that must stay fully in frame with `required: true`; undeclared art may bleed or move off-screen on purpose.
4. Render a 540×960 preview. Then render Full HD, checkpointed, with one writer per checkpoint folder.

## Layout rules learned so far

- **Pans:** hide a zone's labels before the camera leaves that zone.
- **Camera bounds:** keep the camera inside the artwork. For an exact plate, keep |offset| ≤ 0.5 − 0.5/zoom.
- **Font clearance:** Devanagari marks and large numerals need line-height ≥ 1.4 in labels.
- **Duplicate helpers:** watch for duplicate helper names when one module holds several scenes.

Artwork must be original or listed in a rights manifest with source, license and attribution. *Asset rights manifests for visuals are missing*; procedural SVG drawn in the module counts as original work.
