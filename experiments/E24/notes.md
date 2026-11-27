# E24 (P023.4) Data Storytelling study: "Everest leads by a whisker" (unseen, en-IN, framed)

- **Data (verified 2026-11-27):** Wikipedia, "List of highest mountains on Earth" (rounded heights; Everest from the 2020 China–Nepal survey). Gaps are computed in the topic and asserted: 0/238/263/333/364.
- **Reference inspected:** The Pudding, "Life After Death on Wikipedia".
- **Kit (additive):** `hbars`, label styles `deck`/`callout`/`direct`. **Guidance:** `data-storytelling.md`.
- **Validation:** harness 7/7 (3 cue checks; preflight on all 318 frames, 0 defects; preview media checks); legacy `test_data_storytelling` 10/10; E20 `test_morph` 7/7.
- **Performance:** 90 Full HD frames 10.5 s; full preview 29 s.
- **Evidence:** `out/peaks-keyframes.png`, `out/peaks-preview-540x960.mp4` (4.6 s, heights to gap).
- **Limits:**
  - Framed presentation only (full-bleed not exercised).
  - Large empty space below the chart.
  - The "−364" label nearly touches the 400 m line.
  - Owner review pending.
