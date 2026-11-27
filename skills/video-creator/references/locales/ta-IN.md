# Locale: Tamil (ta-IN)

**Status:** synthesis and native word and phrase timing are packaged and technically validated on one sample (P016). Timings are model-predicted and unreviewed, and nothing here is human-validated.

## Voice and timing route

Packaged as provider `mithi`, locale `ta-IN`, voice `malini` (see [narration](../narration.md)). It needs the user's WSL2 Mithi runtime and the pinned model folder, both outside the package.

- **Voice:** Mithi v2 Flash at the pinned revision, voice `malini`, model language `ta`, CPU (4 threads), seed 0.
- **Timing:** the same-inference token durations, mapped to the original words through the model's own token-to-word ownership (`providers/mithi_mapping.py`), then joined into phrases ending at `।॥.?!,;:`. A mapping that doesn't match the text is rejected, never estimated.
- **Segment length:** each segment must fit in one model piece (at most 400 phonemes).
- **Script check:** the text must contain Tamil script (U+0B80–U+0BFF), or the request fails with `script-mismatch`.

## Writing notes

- Choose deliberately between spoken Tamil forms (for example «வந்துடுச்சு», «நல்லா இருக்கு») and formal written forms for the audience, and keep the choice consistent. Don't translate sentence by sentence.
- Spell out numbers and units.
- Tamil words are long and agglutinative, so caption lines break only at spaces; check that long words fit the caption card.

## Review needs

- Native listening review of `malini`: naturalness, pronunciation and accent.
- Native-reader review of the script wording, captions and labels.
- A native word-boundary review of the timings. The P016 sample and its label track are in `experiments/E14/p016-mithi/`.
- Licence review of the caption font and of Mithi for publishing.
