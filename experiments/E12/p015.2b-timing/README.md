# P015.2B Mithi native word and phrase timing evidence (2026-11-26)

## The one new sample

- **File:** `project/narration/te-IN-ahana-phrases.wav`. The text is in `project/inputs/te-phrases.txt`; the agent wrote it, and it needs native review.
- **Content:** 9.150 s (219,600 samples at 24 kHz) covering 17 words and 7 phrases. «వాన» is repeated, and the commas and question marks give natural pauses.
- **Speed:** synthesis 6.55 s (real-time factor 0.716); peak RSS 1,265 MiB.
- **Evidence files:**
  - `te-IN-ahana-phrases.raw-duration.json`: provenance, tokens, durations, the model's word split and special token ids.
  - `.mapping.json`: the per-word token and sample ranges.
  - `.timeline.json`: the provider-independent timeline.

## Timing result

- **Exact sample accounting:** 148 decoded tokens, the same as the encoder tokens (no breaths inserted). Their 366 duration units × 600 samples = 219,600 samples, exactly the WAV.
- **Words:** the model's word split (17 words, 17 token groups) equals the text words. All 17 words and all 7 phrases are mapped with `source: native_model`.
- **Pauses:** 18 pause records (edge silence, word gaps and punctuation pauses), with no word overlapping a pause. For example, the comma pause after «అమ్మా,» runs 0.500–0.725 s.
- **Repeated word:** the two «వాన» spans are 1.325–1.600 s and 6.025–6.375 s.
- **Review status:** `unreviewed`. These are model-predicted timings, not acoustic measurements.

## Listening review

`review/word-boundary-review.md` holds the word table and review columns. `review/word-labels-audacity.txt` and `review/phrase-labels-audacity.txt` are label tracks to import into Audacity.

## Tests

| Test | Result |
|---|---|
| `test_mithi_timing.py --sample project/narration` | 25/25 |
| `test_narration.py` (Kokoro regression) | 13/13 |
| `test_narration_stage.py` | 22/22 (1 expectation updated: Mithi is now packaged, so kn-IN fails with `unsupported-locale`) |
| `test_doctor.py --mithi-runtime` | 16/16 |
| `test_plan.py` | 23/23 |
| `test_captions.py` | 30/30 |

The Skill package has no `__pycache__` folder, and the installed-copy immutability checks pass.
