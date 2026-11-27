# P018.2 Premium full-bleed presentation: evidence

**Status:** implementation validated on synthetic fixtures. Human visual, language and readability review is pending.

## What was built

- An opt-in presentation, `topic.presentation = {mode: 'full-bleed', captions, hook}`.
  - It lives in `scripts/styles/shared/presentation.js` and is called by the Paper and Tech engines.
  - Without it, the original framed presentation runs unchanged.
- The caption contract gains optional per-cue `words` (measured word starts), loaded in `scripts/lib/captions.mjs`.
- Paper and Tech each have their own full-bleed typography, in `story.css` and `tech.css`.
- Preflight adds these full-bleed checks:
  - the stage covers the frame;
  - the hook and labels stay inside the text-safe area;
  - the hook and captions don't overlap labels;
  - the caption box is stable within each cue.
- Docs: `references/rendering.md`, `references/captions.md`, the Paper and Tech style references, and the tests README.

## Fixtures

The fixtures are short synthetic timelines in Telugu and English, with sample-exact word records:
- Paper: `kit-topic.js`, 5.2 s.
- Tech: `tech-topic.js`, 6 s.

Each locale gets relabelled artwork. The full-bleed versions move some labels in portrait to keep them clear of the hook and the text-safe edges; an agent composing for full-bleed would make the same kind of decision.

- **Before:** framed presentation with phrase captions.
- **After:** full-bleed, with word-group captions (`--mode words --max-words 4 --max-chars 28`), active-word emphasis and the hook.

## Results

- **`scripts/tests/test_presentation.py --preview`:** 45/45 pass (`presentation-test-results.json`).
- **Full-cadence preflight** passes for full-bleed portrait in all four fixtures, Tech Telugu landscape, and Tech Telugu framed (`qa/`).
- **Active word:** at 40 probed Tech times and 16 Paper times, the emphasised word equals the latest timeline word that has started. There were no mismatches.
- **Stability and text:** caption boxes are stable within every cue. The rendered text equals the cue text, including ZWNJ in ప్యాకెట్‌ను and హాప్‌లు.
- **SRT/VTT:** the caption artifacts are byte-identical before and after rendering.
- **Detection and refusals:** a hook left over a label is detected. Four invalid specs are refused: a partial-word highlight, a missing highlight, an unknown mode and an invalid caption position.
- **Legacy compatibility:**
  - All 12 existing suites pass: tech, paper kit, captions, preflight, render-plan, whiteboard, flat-science, data, kinetic, x-ray, documentary and 3D.
  - The Tech framed keyframes (3 portrait and 3 landscape) are byte-identical to the archived P017.1 keyframes.
- **Render cost** (single runs, 540×960 preview, 180 frames):
  - Full-bleed Tech Telugu: 21.8 s.
  - Archived framed Tech English (P017.1): 18.6 s.
  - Full-bleed preflight costs about the same as framed: 1.7 s for 180 frames in both modes.
  - The ~17% difference comes from one run per mode, with different locale and text. It is not a controlled benchmark.

## Artifacts

- `before-after-{paper,tech}-{en-IN,te-IN}.png`: framed keyframes on the top row, full-bleed on the bottom row.
- `full-bleed-preview.mp4` (6 s, 540×960, Tech Telugu), with its evidence and `motion-sheet.png` (2 fps).

## Limitations

- **Styles covered:** only Paper and Tech have full-bleed styling. The other seven shot-core styles load the module but are unstyled and unvalidated in this mode.
- **Composition:** the fixture artwork was designed for the framed stage, so full-bleed adds space but not richer art. The P018.1 atmosphere and hero-scale work is still needed.
- **Text-safe insets:** 7% top, 15% bottom and 6.5% sides are assumptions, not measured platform UI zones.
- **Overlap checks:** they cover labels only. Captions over hero artwork are not detected, so composition is the agent's job.
- **Contrast during transitions:** in Tech's iris transition, the dark caption pill sits on a dark background, so separation is low. Readable, but needs a human look.
- **Hook lines:** Paper's hook strips touch between lines when the hook wraps.
- **Human gates:** Telugu and English wording, line breaks, reading speed and artistic acceptance need human review. The synthetic timings prove integration, not natural sync.
