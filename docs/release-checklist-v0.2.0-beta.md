# v0.2.0-beta release checklist (P025.1, prepared 2026-11-27; not released)

Status key: **done** = verified in this repository; **open** = must be completed or decided before release; **gate** = human gate that stays open after release.

## 1. Technical state (verified)

| Item | State | Evidence |
|---|---|---|
| End-to-end pipeline produces a Full HD video that passes delivery QA | done | E42: 1080×1920, 30 fps, 870 frames, −16.0 LUFS, −1.6 dBTP, speech 15.2 LU above bed, sync 0 ms, 23 caption cues, full decode (`experiments/E42/.../qa/qa-report.json`) |
| Narration model and timing-method provenance in QA | done (P025.1) | `qa.py` reads them from each segment's provider record and segment timeline; they must agree across segments, and are never invented. E42 now reports `Oomni/mithi-v2-flash@1fc0dd6…` and `native_durations`; timing status stays `unreviewed` |
| Focused regression tests | done | `test_qa.py` 16/16, `test_plan.py` 23/23, `test-prerender.mjs`, `test-composition.mjs` |
| Package completeness | done | All 9 styles have reference, backend and kit. SKILL.md and reference links resolve (an audit flagged 4 references, all false positives) |
| New 0.2.0 capabilities documented | done | `references/visual-production.md`: composition, pre-render validation, `--window`, rich artwork. `references/narrative.md`: duration estimator. `references/rendering.md`: new flags |
| Stable v0.1.0-beta installation untouched | done | `~/.claude/skills/video-creator` still 0.1.0-beta |

## 2. Before tagging (open)

1. **Version metadata.** SKILL.md `metadata.version` is still `0.1.0-beta`; the dev install rewrites it to `0.2.0-dev`. Set `0.2.0-beta` and update the status line.
2. **README is stale (v0.1.0-beta throughout):**
   - capability matrix, host compatibility, installation zip name, known limitations ("eight of nine styles fixture-validated only");
   - no mention of Blender (optional), composition, validation, window rendering, the duration estimator, or rich-artwork rules.
3. **RELEASE-NOTES.md:** add a v0.2.0-beta section covering:
   - P022–P025 changes;
   - what was validated where (E30–E42);
   - what remains unvalidated.
4. **Codex installation drift:** `~/.agents/skills/video-creator-dev` differs from the source in 21 files (it predates P024.13+). Refresh it from the release build and re-verify one Codex keyframe run. Not done here (out of scope).
5. **Compatibility claims:**
   - Claude Code native runs: E30–E32, E39–E42.
   - Codex native runs: P024.5–P024.10 (E33–E38).
   - Headless `claude -p` end-to-end is still unverified (README).
   - Only Windows 11 has been exercised.
6. **Release build:** produce the zip from the source tree with no `__pycache__` or test results, and verify that the installed copy matches the source hashes. Add a checksum to the release notes.
7. **Commit and tag:** only with explicit owner authorisation.

## 3. Licensing limitations (state honestly in the release; gate)

- **Package licence:** "Proprietary (project-internal)". Owner decision is needed before any distribution.
- **Fonts:** system fonts (Nirmala UI, Segoe UI); redistribution not reviewed, none bundled.
- **Narration models:** not bundled. Mithi (`Oomni/mithi-v2-flash`, repo LICENSE hashed in evidence) and Kokoro (Apache-2.0 per its manifest) need review of each voice and model licence for publication.
- **Visual assets:** procedural or original by default. External assets are CC0 Poly Haven (E41, not packaged) and public-domain NASA and Library of Congress photos (E28, E32, not packaged); each is recorded with provenance and is project-local.
- **Audio:** procedural FFmpeg assets only.
- **Blender:** optional external tool; not bundled.

## 4. Human gates (remain open after release)

- **Artistic acceptance:** no production has owner acceptance. E42 is technically passed only, and P024 self-reviews rate most styles mid quality.
- **Native-language review:** none of the five locales has been human-reviewed, including E42's Telugu terms (సుడి కరెంట్లు).
- **Acoustic timing:** narration timing is model-predicted (`native_durations`), status `unreviewed`.
- **Factual review:** claims rely on single secondary sources (Wikipedia) in E39–E42.
- **Publication:** never automatic. `publication_ready: false` until `project.py approve`.

## 5. Known limitations to carry into the release notes

- **Composition checks:** cannot verify anchors without leaders, contrast on non-solid labels, or 3D occlusion; regions must be declared by hand.
- **Duration estimator:** moderate confidence for en-IN only (5 projects); low for the four Indic voices; Kokoro unmeasured.
- **WebGL 3D:** no textures, HDRIs or model import. Blender is used for static layers and stills only; animated Blender shots are untested.
- **Recurring artistic weaknesses (E30–E42):** subject-to-frame fit, tags without leaders, overlay legibility under perspective.
