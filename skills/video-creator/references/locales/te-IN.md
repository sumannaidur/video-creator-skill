# Locale: Telugu (te-IN)

**Status:** synthesis and native word and phrase timing are packaged and technically validated (P015.2B). Timings are model-predicted and unreviewed, and nothing here is human-validated.

## Voice and timing route

Packaged as provider `mithi`, locale `te-IN`, voice `ahana` (see [narration](../narration.md)). It needs the user's WSL2 Mithi runtime and the pinned model folder, both outside the package.

- **Voice:** Mithi v2 Flash at the pinned revision, voice `ahana`, model language `te`, CPU (4 threads), seed 0. Synthesis is deterministic at that seed.
- **Timing:** native token durations from the same inference, mapped to words through the model's own token-to-word ownership, then joined into phrases ending at `।॥.?!,;:`.
  - The pause after punctuation is a `pause` record, not part of the word.
  - A mapping that doesn't match the text is rejected, never estimated.
  - Timings stay `unreviewed` until a native speaker checks the word boundaries.
- **Speaking rate:** one sample measured 19 words in 10.0 s of audio, including edge silence. Telugu words are long and agglutinative, so a words-per-second figure from another language doesn't transfer. Use measured durations.
- **Segment length:** each segment must fit in one model piece (at most 400 phonemes). Longer text is rejected.

## Writing notes

- Write natural, conversational Telugu directly. Don't translate from Hindi or English sentence by sentence.
- Keep sentences short for narration. Use spoken forms where speakers would (for example «వాన» alongside «వర్షం»).
- Spell out numbers and units in the narration text.
- The text must contain Telugu script (U+0C00–U+0C7F), or the request fails with `script-mismatch`.

## Captions and typography (not yet verified)

- Telugu has stacked conjuncts and vowel signs above and below the baseline. Captions need extra line height and must never break inside a grapheme cluster. The caption tools segment by grapheme. Caption layout passed for synthetic Telugu fixtures (P014.8). In P015.2B, real Mithi timelines built and checked as SRT and WebVTT, but a native reader hasn't reviewed the rendered captions.
- An openly licensed Telugu font needs licence review before distribution. System fonts are pending review, as for Hindi.

## Review needs

- Native listening review of `ahana`: naturalness, pronunciation and accent.
- Native-reader review of the script wording, captions and labels.
- A native word-boundary review of the timings (a review sheet and Audacity label tracks are in `experiments/E12/p015.2b-timing/review/` (archived development evidence, not part of the installed package; see `docs/history/experiments-index.md` in the source repository)).
