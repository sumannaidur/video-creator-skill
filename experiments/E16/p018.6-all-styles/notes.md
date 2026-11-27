# P018.6: full-bleed presentation across all nine styles — evidence

**Status:** technical validation on the existing fixtures. Artistic review by the owner is pending. Nothing is committed.

## What changed

- **Preference `presentation`** (`auto` | `framed` | `full-bleed`, default `auto`).
  - `auto`: the topic decides. It is framed unless the topic authors full-bleed, so P018.2 topics and E17 are unchanged.
  - `framed` / `full-bleed`: enforced.
  - `preferences.py resolve --check` reports `presentation-unsupported` when a style doesn't support the chosen mode.
- **Registry:** `styles/registry.json` now lists `presentations` for each style; all nine support both modes.
- **Renderer and preflight:**
  - `render.mjs` and `preflight.mjs` read the project's resolved preference, refuse unsupported combinations, and bind the mode into the checkpoint and preflight configuration. Legacy projects without the key keep identical settings.
  - The backends pass the mode to the engines.
  - `presentation.js` applies the preference when the topic has no spec, and refuses a contradicting topic spec (`presentation-mismatch`).
- **Topic context:** topics get `ctx.presentation` and `ctx.safe`, which is the text-safe area and the top of the caption band, in stage percent. In framed mode it is the whole stage, so layouts don't change.
- **Style typography:** the seven remaining styles each have their own full-bleed captions, active-word emphasis and hook, in their own stylesheets. Each style reference lists its look and composition rules.
- **Fixtures:** seven fixtures place notes, sources and edge labels within `ctx.safe` in full-bleed only. Kinetic Typography sizes its words to the safe band above the captions.

## Results

- **Full-bleed suites** (`--presentation full-bleed`, word-group captions; portrait, plus landscape where the suite has it; full-cadence preflight):

  | Suite | Result |
  |---|---|
  | Whiteboard (en, hi) | 13/13 |
  | Flat Science (te) | 9/9 |
  | Data Storytelling (kn) | 10/10 |
  | Kinetic Typography (en, te) | 16/16 |
  | X-Ray Explainer (te) | 10/10 |
  | Documentary (te) | 10/10 |
  | 3D Explainer (te) | 11/11 |

- **Hook probe** (`hook-probe.json`, `*-hook.png`, `hooks-overview.png`): a localized hook renders in all seven styles with a whole-word highlight.
  - The Whiteboard hook needed more top offset because of the hand font's tall line box. Fixed.
  - Data Storytelling and Documentary: preflight reports the hook overlapping the fixture's own top headline or provenance note. That is a composition conflict for the agent to resolve per topic, not a style defect.
- **Framed regressions:** all pass.
  - The seven style suites: 13, 9, 10, 16, 10, 10 and 11 checks.
  - Tech Explainer 9/9, Paper kit 7/7, presentation 43/43, preflight 16/16, render-plan 16/16, preferences 18/18, doctor 14/14.
  - Tech framed keyframes are byte-identical to the P017.1 archive.
- **Explicit refusals:**
  - `presentation=cinema` is rejected by preferences.
  - A topic asking for framed in a full-bleed project fails with `presentation-mismatch`.

## Limitations

- These are fixture-scale validations only. No production video exists in full-bleed for the seven styles.
- The fixtures were composed for the framed stage. Full-bleed placement changes are minimal and test-only.
- The text-safe insets are assumptions, not measured platform UI zones.
- Hook/label conflicts are detected, not automatically resolved.
