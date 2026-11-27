# Locale: Hindi (hi-IN)

**Status:** the only locale with a tested end-to-end narration and timing route. Its quality is not human-validated.

## Voice and timing route

Packaged as provider `kokoro-onnx`, locale `hi-IN`, voice `hf_alpha` (see [narration](../narration.md)). It needs a user-supplied Kokoro runtime environment and the pinned model files, kept outside the package.

- **Voice:** Kokoro ONNX v1.0, voice `hf_alpha`, speed 1.0, CPU, local model with pinned hashes. Synthesis is not bit-reproducible across runs: always time the exact WAV you will use, and never transfer timings to a regenerated file.
- **Timing:** native phoneme durations captured in the same inference call as the WAV. Words are mapped with eSpeak `hi` full-context separators; phrases end at `।॥.?!,;:`. Timings stay `unreviewed` until a person checks them.
- **Speaking rate:** P013 measured about 2.3 words/s, 155 words in 67.4 s of speech. Use it only as a first estimate.

## Alternative route: Mithi (P016)

Provider `mithi`, voice `charvi`, model language `hi`, technically validated on one sample. It's an alternative to Kokoro, not a replacement; you choose it explicitly with `narration.provider=mithi` and `narration.voice=charvi`, and nothing switches between the two automatically. Timing comes from the same-inference token ownership (see [te-IN](te-IN.md)). A nukta word («ख़ुशबू») mapped correctly in the sample. Native listening is pending, and the two Hindi voices have not been compared.

## Writing notes

- Use conversational Hindi with natural loanwords (फ्लाइट, टिकट, एयरपोर्ट) where speakers use them.
- Spell out currency in narration. On screen use «₹», and label illustrative values «उदाहरण».
- Hyphenated compounds such as «अलग-अलग» stay whole when captions are rendered from the caption artifact (`--captions`; see [captions](../captions.md)). Legacy phrase captions (no `--captions`) can still break them at the hyphen.

## Review needs

- Native listening review: naturalness and pronunciation.
- Native-reader review of captions and labels: Devanagari rendering and line breaks.
- Verification of the provisional word timings, especially around sentence breaks.
