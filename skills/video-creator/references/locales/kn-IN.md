# Locale: Kannada (kn-IN)

**Status:** synthesis and native word and phrase timing are packaged and technically validated on one sample (P016). Timings are model-predicted and unreviewed, and nothing here is human-validated.

## Voice and timing route

Packaged as provider `mithi`, locale `kn-IN`, voice `vaidehi` (see [narration](../narration.md)). It needs the user's WSL2 Mithi runtime and the pinned model folder, both outside the package.

- **Voice:** Mithi v2 Flash at the pinned revision, voice `vaidehi`, model language `kn`, CPU (4 threads), seed 0.
- **Timing:** the same-inference token durations, mapped to the original words through the model's own token-to-word ownership (`providers/mithi_mapping.py`), then joined into phrases ending at `।॥.?!,;:`. A mapping that doesn't match the text is rejected, never estimated.
- **Segment length:** each segment must fit in one model piece (at most 400 phonemes).
- **Script check:** the text must contain Kannada script (U+0C80–U+0CFF), or the request fails with `script-mismatch`.

## Writing notes

- Write natural, spoken Kannada directly (for example «ಅಲ್ವಾ?», «ಚೆನ್ನಾಗಿರುತ್ತೆ»). Don't translate sentence by sentence from another language.
- Spell out numbers and units.
- Kannada stacks consonant clusters and has vowel signs above and below the baseline. Captions need generous line height and must never break inside a grapheme cluster (the caption tools segment by grapheme).

## Review needs

- Native listening review of `vaidehi`: naturalness, pronunciation and accent.
- Native-reader review of the script wording, captions and labels.
- A native word-boundary review of the timings. The P016 sample and its label track are in `experiments/E14/p016-mithi/`.
- Licence review of the caption font and of Mithi for publishing.
