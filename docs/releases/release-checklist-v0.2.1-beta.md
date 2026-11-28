# v0.2.1-beta release checklist (P027.1)

A maintenance release with no new features. **Status: ready for owner release authorization.** The release is not committed, tagged or published.

| Gate | Result | Evidence |
|---|---|---|
| Unified runner on the extracted package (outside the repository, runtimes auto-discovered) | **29 of 29 suites passed** (P027.1); after the P027.2 fixture change, the affected core and runtime suites passed 9 of 9 again; 4 checks skipped inside passing suites | `scripts/tests/run_all.py`: test-package 1, test_audio 1 and test_narration 2 are repository-only regressions |
| Narration runtime smoke test | Passed | `smoke_integration.py`, 9 of 9: real Kokoro hi-IN synthesis carried through the timeline, keyframe render and mix |
| Repository checks | 12 of 12 passed | `tools/check_repository.py` |
| Deterministic package | Rebuild identical | `video-creator-v0.2.1-beta.zip`: 579,906 bytes, 162 files, SHA-256 `b6635d4dc9f14be53b22b76dcc97a176fadc6155761423bb44232a53fd8d9374` |
| CI configuration | Reviewed, not yet run on GitHub | `.github/workflows/ci.yml`: SHA-pinned actions; repository and determinism checks; tests on the source and on the extracted package (no runtime or Blender tests) |
| Privacy scan of candidate tracked files | No email, user name, machine path or token found | `docs/audits/` (which holds machine paths) is now local-only |
| Third-party rights | **Resolved (P027.2)** | The Kokoro recording was replaced by an original synthetic tone-burst WAV and timeline (notices §6a), reproduced byte for byte by `make_synthetic_fixture.py`. The recording was never committed; it is absent from the candidate files and the ZIP |

## Fixes made during readiness

These changed tests only; no runtime behaviour changed.
- `test_doctor.py` and `test_preferences.py` assumed that no conventional runtime files exist. They now set `VC_RUNTIMES` to an empty folder.
- `smoke_integration.py` had two stale expectations from before v0.2.0: it used `kinetic-typography` as the "unsupported" style (now `claymation`) and expected the old provider status `candidate`.

## Open for the owner

- **Narration evidence:** the packaged fixture is synthetic. Real Kokoro synthesis and timing are tested only with a locally configured runtime (`test_narration_stage.py`, `smoke_integration.py`, and the `test_narration.py` Hindi smoke). Voice provenance for user-generated narration stays open (notices §4).
- **Security:** topic modules, Blender scripts and narration runtimes run as trusted local code. Network isolation is not a sandbox.
- **Hosts:** only Windows 11 with Claude Code and Codex is verified. Antigravity, Linux and macOS are unverified.
- **Quality:** artistic quality, native-language naturalness, timing accuracy and font licensing remain human gates.
- **README links:** they point to the v0.2.1-beta release, which does not exist until it is published.
