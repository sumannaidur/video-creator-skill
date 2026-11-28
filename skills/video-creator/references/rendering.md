# Rendering: core renderer and style backends

The core renderer is style-agnostic. It handles arguments and paths, the single-writer lock, cue, keyframe and repeatability checks, checkpointed frames, encoding and media validation. Each **style** supplies a backend that draws frames. A different style, including 3D or non-browser renderers, adds a backend. It does not change the core.

## Command

```
node scripts/render.mjs --project <project dir> --topic <topic module> --timeline <timeline.json> --out <dir>
  [--style paper-explainer | --backend <file.mjs>] [--locale <bcp47>] [--font "<css family>"]
  [--width 1080 --height 1920 | --width 1920 --height 1080] [--scale 0.5] [--fps 30] [--quality 95] [--crf 18]
  [--keys-only | --validate-only | --window <start:end>] [--stop-after <n>] [--options <json>] [--chrome <path>] [--clean-frames] [--plan plan/resolved-plan.json]
  [--captions captions/captions.json | --no-captions] [--preflight <dir>/preflight.json]
```

- **Paths:** relative paths, including the timeline's audio path, resolve against `--project`. The timeline's audio path must be relative and inside the project.
- **Network isolation (P026.2, every mode and preflight):** pages may load only `file:`, `data:`, `blob:` and `about:` content. Any other request (remote fonts, images, scripts or `fetch`) is blocked in the browser, and the run stops with `[network-blocked] <url>`. Embed assets locally instead: verified manifest media, `data:` URIs or packed layers.
- **Pre-render validation (P024.14B, every mode):** after the topic is installed and before any capture, `lib/prerender.mjs` checks:
  - duplicate DOM ids, inside each shot (for example an object id equal to a symbol id);
  - that the browser canvas matches `--width`×`--height`;
  - that cue and keyframe times lie inside the narration;
  - that shots are contiguous;
  - that every transition fits between its shot and the next.

  The engines already refuse bad layers, label styles, missing symbols, unknown transition types and unknown plan cues. A failure stops with `[validation]`. `--validate-only` stops after validation and writes `validation.json`; it is the cheapest check of a topic edit.
- **Short windows (`--window start:end`, seconds):**
  - Renders frames `round(start·fps)` to `ceil(end·fps)−1` at their absolute narration times, into the same `frames/` checkpoint and configuration hash as the full render. Window frames are the full render's frames, and a later full render reuses them.
  - The MP4 contains only the window, with audio cut at the same absolute times. Its evidence records `window` (seconds, frame range, start), and the coverage and speech-onset checks are skipped.
  - Use it for 4–5 s motion previews around a key transformation. A window is never a full-video validation.
- **Outputs:** `keyframes/`, `frames/` (checkpoint), `<name>.mp4`, and either `<name>-evidence.json` or `keys-evidence.json`.
- **Exit codes:** `2` usage error, `3` checkpoint locked by a live process, `75` simulated interruption, `1` any other failure, reported as `[code] message`.
- **Style errors:** an unknown style fails with `unsupported-style`. Never substitute another style.
- **Language:** `--locale` and `--font` are configuration. Precedence: a locale declared by a topic scene wins, and `--locale` is the default for scenes that don't declare one. The engine is unchanged across languages; caption shaping quality still needs per-locale review.

## Rendering from a resolved creative plan (`--plan`)

With `--plan`, shot boundaries and speech-cue times come from the plan that `scripts/plan.py resolve` wrote; the topic module never types a speech timestamp. Without `--plan`, the renderer behaves exactly as before (legacy and experimental topics).

**Before rendering**, `scripts/lib/resolved-plan.mjs` checks, and fails with the code shown:
- the plan file is a byte-identical output of the **completed** `creative-plan` ledger stage in `--project` (`plan-not-verified`, or `stale-plan` if it changed since);
- it was resolved against exactly this `--timeline` and its audio, which are still the verified narration outputs (`stale-plan`);
- its shots tile the narration from sample 0 to the last sample with no gaps or overlaps (`conflicting-shot-boundaries`);
- cue IDs are unique and inside their shot (`invalid-plan`);
- the backend declares the contract in `backend.plans` (`plan-unsupported`).

**After the topic is installed:** every plan cue with an `id` must have been used (`missing-cue`), and none that are not in the plan (`unknown-cue`).

The plan and the loader are hashed into the checkpoint configuration, so a re-resolved plan invalidates old frames, and an unchanged one reuses them.

**Render-plan contract** (`video-creator.render-plan` v1), passed to `install({..., plan})`, the same for every backend and language:

```
{sample_rate, sample_count, duration,
 shots: [{id, start: {sample, seconds}, end: {sample, seconds}, cues: [cue ids], camera: [{sample, seconds, intent}]}],
 cues:  {<id>: {id, shot, object, action, sample, seconds, timing_source}},
 source: {path, sha256, timeline_sha256, timing_status}}
```

Times stay integer samples; `seconds` is `sample / sample_rate`, computed once at this boundary. Backends must not re-derive or round cue times.

## Visual preflight (`scripts/preflight.mjs`)

```
node scripts/preflight.mjs <the same options as render.mjs> --out <dir>
node scripts/render.mjs ... --preflight <dir>/preflight.json
```

It installs the topic once and inspects **every frame time at the output `--fps`** (intermediate frames, camera moves, transitions) with geometry and visibility checks. It captures no images: the 68.8 s P013 flight timeline (2,064 frames) took 14.7 s. It writes `preflight.json` and a short `preflight.md`. Exit `0` passed, `1` failed, `6` incomplete, `2` usage.

| Check | Scope | Defect when |
|---|---|---|
| `safe-area` | backend | The stage or caption leaves the safe area |
| `text-clipping` | backend | Text overflows its box, or a label leaves the stage |
| `required-object-bounds` | backend | An object declared `required: true` is visible and not fully inside the stage (outside transitions) |
| `invalid-transform` | backend | A NaN or infinite transform, opacity outside 0-1, or a camera zoom ≤ 0 |
| `visibility-requirement` | backend | A declared visibility rule is broken (`absentAfter`, hidden headline) |
| `caption-layout` | Paper Explainer | Too many caption lines, text outside the caption card, a grapheme or word split across lines, or rendered text differing from the cue (see [captions](captions.md)) |
| `plate-coverage`, `viewport` | Paper Explainer | A cover plate leaves a gap; the page scrolls |
| `frame-cadence` | core | Not every output frame time was inspected |
| `cue-visibility` | core | A cue's object is visible 20 ms before its cue or not visible 0.6 s after |
| `speech-cue-timing` | core, with `--plan` | A speech cue's time differs from the resolved plan |
| `camera-timing` | core, with `--plan` | A camera moment in the plan has no camera key at that time |

- **Not defects, but counted:** undeclared art outside the stage (decorative bleed, off-screen entrances and exits), and required objects during transitions. Objects at zero opacity are never checked.
- **Unsupported is never passed:** a check the backend doesn't perform is reported `unsupported`, and the result is `incomplete`.
- **Results:** each defect records its type, object, shot, first and last frame, time and geometric evidence. Results are bound (`binding.sha256`) to the hashes of the topic, plan, timeline, audio, renderer and backend sources, the geometry settings (not output scale or JPEG quality) and the browser build.
- **Gates:** `render.mjs --preflight` refuses a result that is failed or incomplete (`preflight-failed`) or bound to anything else (`preflight-stale`). The project ledger refuses failed or incomplete `preflight.json` as completion evidence, because it records `passed: false`.
- **Scope:** these are technical checks, not an artistic review. A passed preflight says nothing about the quality of the artwork.

## Presentation modes (`topic.presentation`)

The default is `framed`: each style's original stage plus a caption panel. Existing topics are unchanged.

A topic can opt into **`full-bleed`** (P018.2, `scripts/styles/shared/presentation.js`):

```js
presentation: {
  mode: 'full-bleed',
  captions: {position: 'lower', emphasis: 'word'},              // position: lower | middle | upper; emphasis: word | none
  hook: {text: '…', highlight: '…', until: 1.6},                // optional opening headline
}
// topic.shots[i].captionPosition overrides the position for one shot
```

- **Layout:** the artwork fills the whole frame, with no frame, card or caption panel. Captions are drawn over it as short, speech-synchronized phrases with optional active-word emphasis ([captions](captions.md#integrated-captions-full-bleed-presentation-p0182)).
- **Hook:** the agent writes it for the video and it is not narration. It is visible from the first frame and fades out before `until` (default: the end of the first shot, at most 4 s).
  - `highlight` must be a whole-word part of the text, so graphemes and compounds are never split.
  - Its wording needs the same native-language review as captions.
- **Text-safe area:** captions, the hook and labels must stay inside a text-safe area (`--safe-top`, `--safe-bottom`, `--safe-x`; defaults 7 / 15 / 6.5 % portrait).
  - These defaults are conservative assumptions, not measured platform UI zones.
  - Compose labels for the full frame (`ctx.aspect` changes with the mode), and keep them clear of the hook and captions.
- **Style ownership:** typography, contrast and the default caption offset belong to each style's stylesheet (`html[data-presentation="full-bleed"]` rules). The shared module sets only geometry and timing.
- **Preflight** also checks, in addition to the usual checks:
  - the stage covers the frame (`safe-area`);
  - the hook stays inside the text-safe area (`safe-area`);
  - labels stay inside the text-safe area (`text-clipping`);
  - the hook and captions don't overlap visible labels (`caption-layout`);
  - each caption's box is stable within its cue (`caption-layout`).
- **Selecting it:**
  - Through the project preference `presentation=full-bleed` ([preferences](preferences.md)). `render.mjs` and `preflight.mjs` read the project's resolved configuration and bind the mode into the checkpoint and preflight configuration. A topic without its own spec then gets full-bleed with default captions and no hook.
  - Or by the topic's own `presentation`. A topic spec that names a different mode from the preference fails with `presentation-mismatch`.
  - A style that does not list the mode in `registry.json` fails with `presentation-unsupported`.
- **Status:** all nine styles have their own full-bleed typography and caption treatment.
  - Paper Explainer and Tech Explainer: P018.2.
  - The other seven: P018.6, validated on their existing fixtures. Each style reference lists its composition rules.

## Backend contract

A module exporting `backend = {name, sources, settings?, plans?, open(opts)}`.

- **`plans`** (optional): the resolved-plan contracts this backend consumes, for example `['video-creator.render-plan/1']`.
- **`captions`** (optional): caption contracts the backend draws, for example `['video-creator.captions/1']`. `install` then receives `captions: {visible, locale, max_lines, cues: [{id, start, end, text, words?}]}` (`words`: measured word starts for active-word emphasis, see [captions](captions.md#integrated-captions-full-bleed-presentation-p0182)); the visual treatment is the style's own. Without the declaration, `--captions` fails with `captions-unsupported`.
- **`preflight`** (optional): `{checks: [names]}`, the geometry checks the session's `inspect(t)` performs. Each backend defines its own rules; Paper Explainer's are not required of other styles.

- **`sources`:** absolute paths of every file that can change pixels. They are hashed into the checkpoint configuration.
- **`open({chrome, width, height, locale, font})`** returns a session with:
  - **`version`:** the renderer identity, part of the checkpoint configuration.
  - **`install({timeline, topicSource, topicOptions, plan?})`** → `{duration, phrases, captions, shots, cues, checks}`, plus `planCuesUsed` (the plan cue IDs the topic consumed) when a plan was given. Cue entries without a `phrase` index are speech cues and are checked for visibility only.
  - **`seek(t)`** → `{shot, captionId, transition, labels, opacity, outside[]}`. A non-empty `outside` fails the frame.
  - **`capture({format: 'png'|'jpeg', quality, scale})`** → image bytes.
  - **`inspect(t)`** (optional) → `{shot, transition, findings: [{type, object, evidence}], exempt, zoom}`, with no capture. Without it, every backend check is reported unsupported.
  - `install` may report `shots[].cameraTimes` so preflight can check camera timing.
  - **`describe()`** (optional) → presentation facts for the evidence.
  - **`close()`**.
- **Determinism:** every state must be a pure function of `t`. Seeded variation only.

## Implemented backends

| Style | Backend | Status |
|---|---|---|
| Paper Explainer | `scripts/styles/paper-explainer/` (Chromium, inline SVG, shot engine) | Implemented. Regression-identical to P013 |
| Tech Explainer | `scripts/styles/tech-explainer/` (Chromium, inline SVG; its own engine, kit and CSS; shot core derived from Paper Explainer) | Implemented (P017.1). Validated on a compact fixture in portrait and landscape; no full production yet. See [Tech Explainer](styles/tech-explainer.md) |
| Whiteboard | `scripts/styles/whiteboard/` (its own host page, board stylesheet, marker kit and `erase` transition on the shared shot core via `createShotBackend` and `vcShotStyle` hooks) | Implemented (P017.2). Fixture-validated in portrait, landscape and Hindi; no full production yet. See [Whiteboard](styles/whiteboard.md) |
| Flat Science | `scripts/styles/flat-science/` (its own host, stylesheet, science kit and `magnify` transition on the shared shot core) | Implemented (P017.3). Fixture-validated with Telugu in portrait and landscape; no full production yet. See [Flat Science](styles/flat-science.md) |
| Data Storytelling | `scripts/styles/data-storytelling/` (its own host, stylesheet, data kit with integrity rules and the `bars` transition on the shared shot core) | Implemented (P017.4). Fixture-validated with Kannada in portrait and landscape; no full production yet. See [Data Storytelling](styles/data-storytelling.md) |
| Kinetic Typography | `scripts/styles/kinetic-typography/` (its own host, stylesheet, word-motion kit and `shutter` transition on the shared shot core) | Implemented (P017.5). Fixture-validated in English and Telugu, portrait and landscape; no full production yet. See [Kinetic Typography](styles/kinetic-typography.md) |
| X-Ray Explainer | `scripts/styles/x-ray-explainer/` (its own host, stylesheet, cutaway and mechanics kit and `sweep` transition on the shared shot core) | Implemented (P017.6). Fixture-validated with Telugu in portrait and landscape; no full production yet. See [X-Ray Explainer](styles/x-ray-explainer.md) |
| Documentary | `scripts/styles/documentary/` (its own host, stylesheet, media kit, verified asset manifest in `prepare` and the `dip` transition on the shared shot core) | Implemented (P017.7). Fixture-validated with original procedural assets and Telugu in portrait and landscape; no full production yet. See [Documentary](styles/documentary.md) |
| 3D Explainer | `scripts/styles/3d-explainer/` (genuine 3D: the kit's own WebGL2 renderer on CPU SwiftShader, on the shared shot core; `dolly` transition) | Implemented (P017.8). Fixture-validated with Telugu in portrait and landscape; about 0.64 s per 1080x1920 frame on the reference laptop; no full production yet. See [3D Explainer](styles/3d-explainer.md) |
| (none) | — | **Not implemented.** The renderer fails with `unsupported-style` |

`scripts/tests/fixtures/solid-backend.mjs` is a test-only backend with no browser. It shows that the boundary works for non-Chromium renderers.
