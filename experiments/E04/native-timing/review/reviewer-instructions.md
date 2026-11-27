# Hindi alignment review

Play both native WAVs in an existing player. Label meaningful phrases first, then words for both clips if practical. Inspect the waveform at ambiguous boundaries. From this experiment directory, use the existing FFmpeg, without any installation.

```powershell
ffmpeg -i samples/sample-A-native.wav -filter_complex showwavespic=s=1800x240 -frames:v 1 "$env:TEMP/E04-A-waveform.png"
ffmpeg -ss 4.1 -i samples/sample-A-native.wav -t 0.6 -c:a pcm_s16le "$env:TEMP/E04-A-review-window.wav"
```

Play the temporary review window in the same player. Add its start offset to any time observed in that clip. Repeat with B and adjust the listening window and temporary filename as needed. The overview runs from time zero at the left to the full clip duration at the right. Convert observed seconds to samples by multiplying by 24,000 and rounding. Use repeated playback to refine endpoints, and keep estimates uncertain when you cannot distinguish a boundary.

Copy the [annotation template](annotation-template.json). Open the [blind script spans](blind-script-spans.json) for the exact WAV paths, spoken text, and untimed word and phrase references. Copy each selected span's `kind`, `spoken` and `text_ref` into its sample's `annotations` array, then add `start`, `end`, `uncertain`, `pronunciation_notes` and `missing_or_repeated`. Use null where a boundary cannot be heard and set `uncertain` to true. Use `missing_or_repeated: "omitted"` for omitted spans. Record repeated occurrences in notes with their observed ranges so the same script span is not scored twice. Add `native_disagreement` only after saving the independent annotations. Do not count punctuation or spaces as spoken words.

## Reproducible scoring procedure

Run the evaluator from the repository root once the reviewer has saved the completed JSON:

```powershell
py -3.12 -B experiments/E04/native-timing/mapping/evaluate_alignment.py path/to/annotations.json
```

Use the existing audio and original spoken text from the **native** timelines for independent annotation. Keep the candidate files closed until annotation is complete. For the five phrase anchors, use A's question and following sentence, and B's opening sentence followed by the two clauses separated by the comma. Keep punctuation in the text span, while marking the audible speech boundaries. The evaluator uses the exact script offsets and reports how much of the script was actually scored, so a few easy labels cannot stand in for full coverage.

1. Verify the annotation and prediction refer to the same SHA-256 and sample rate. Validate bounds and chronology for each kind in each file. Flag zero, reversed, out-of-bounds and overlapping intervals and count them separately.
2. Match one-to-one by sample, level and identical transcript span. Disambiguate repeats by chronological occurrence. Count missing predictions, extra predictions, unresolved text and uncertain human boundaries separately. Never let punctuation-only matches raise word coverage.
3. For each level report reliable coverage as valid matches divided by all eligible reference spans. Report excluded uncertain references and total editorial spans as separate counts. With a zero denominator report unavailable.
4. For confirmed matches compute absolute start and end errors independently in milliseconds using `1000 × |prediction − reference| / sample_rate`. Report sample counts, means and medians for start, end and pooled boundaries. Report p95 using nearest rank, element `ceil(0.95 × n)` in the sorted list. Report each clip and pooled results. Do not score unmatched or uncertain boundaries as zero error.

Proposed engineering gates for this project, pending calibration. All require zero invalid or overlapping intervals at the relevant level.

| Use | Level | Minimum coverage | Median absolute error | p95 absolute error |
| --- | --- | ---: | ---: | ---: |
| Phrase scene transitions | Phrase | 95% | Report | 200 ms |
| Standard captions | Caption cue | 98% | Report | 150 ms |
| Word highlights | Word | 98% | Report | 100 ms |

No production timeline may have unresolved mandatory cues. For captions and animation, reviewers must label the corresponding cue intervals independently before applying the same scoring procedure. The current evaluator scores words and phrases only. These two clips are a pilot, and a small reference count makes p95 coarse.
