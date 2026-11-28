# Locale: Indian English (en-IN)

**Status:** synthesis and native word and phrase timing are packaged and technically validated on one sample (P016). Timings are model-predicted and unreviewed, and nothing here is human-validated.

## Voice and timing route

Packaged as provider `mithi`, locale `en-IN`, voice `anirban` (see [narration](../narration.md)). It needs the user's WSL2 Mithi runtime and the pinned model folder, both outside the package.

- **Voice:** Mithi v2 Flash at the pinned revision, voice `anirban`, model language `en`, CPU (4 threads), seed 0.
- **Timing:** the same-inference token durations, mapped to the original words through the model's own token-to-word ownership (`providers/mithi_mapping.py`), then joined into phrases ending at `।॥.?!,;:`. A mapping that doesn't match the text is rejected, never estimated.
- **Apostrophe contractions:** the model's word list splits contractions (it's → it, s) but keeps one phoneme group per contraction. The mapper accepts group *i* as text word *i* only when that is the only difference, with every text word still letter-checked against the model's split. Any other mismatch is rejected.
- **Segment length:** each segment must fit in one model piece (at most 400 phonemes).
- **Script check:** the text must contain Latin letters, or the request fails with `script-mismatch`.

## Writing notes

- Write natural spoken English for an Indian audience. Contractions are fine (see Timing).
- Spell out numbers, currency and units in the narration text, and avoid unexplained abbreviations.
- Whether `anirban` sounds authentically Indian English is unreviewed. This needs a reviewer before production use.

## Review needs

- Native listening review of `anirban`: naturalness, pronunciation and accent.
- Native-reader review of the script wording, captions and labels.
- A native word-boundary review of the timings. The P016 sample and its label track are in `experiments/E14/p016-mithi/` (archived development evidence, not part of the installed package; see `docs/history/experiments-index.md` in the source repository).
- Licence review of the caption font and of Mithi for publishing.
