# Captions and subtitles

Captions come from the **verified narration timeline**, never from the script and never from estimated times. The caption timing contract is the same for every locale, narration provider and visual style. Each style draws captions in its own way.

## Build

```
python scripts/captions.py build <project> [--mode phrase|words] [--max-chars 42] [--max-words 6] [--max-lines 2] [--hold-ms 700]
python scripts/captions.py check <project>
```

- **Input:** the timeline output of the completed narration stage. A changed timeline fails with `stale-narration`.
- **Grouping:**
  - `phrase` (default) makes one cue per phrase record.
  - `words` makes cues of at most `--max-words` words, and also breaks after clause punctuation (including the danda ।).
  - A cue longer than `--max-chars` is split, but only between two words that both have measured times. If no such boundary exists, the cue stays whole and is flagged `long`. It is never truncated and never given a guessed time.
  - `--max-chars` counts characters without combining marks. It is only a hint for grouping; actual wrapping is measured at render time.
- **Text:** every cue is an exact slice of the timeline's own text (`text_ref`). Nothing is normalized, transliterated or rewritten. Cue boundaries fall only between words, so grapheme clusters, conjuncts, vowel signs and compounds such as «अलग-अलग» are never split.
- **Timing:** integer samples. A cue starts at its first measured word or phrase. It ends at its speech end plus `--hold-ms`, but never after the next cue starts or after the audio ends.
- **Rejected:** unmapped phrase timing (`unmapped-reference`), invalid ranges (`invalid-timing`), and overlapping or out-of-order cues, checked in samples and again after rounding to milliseconds (`overlapping-cues`).
- **Preferences** (resolved project configuration):
  - `captions.enabled=false`: no cues and no files.
  - `captions.burn_in=false`: subtitle files only; nothing is drawn on the video.
  - `captions.subtitle_files`: which of `srt` and `vtt` are written.

## Outputs (`captions/`)

- **`captions.json`** (`video-creator.captions` v1) records:
  - Locale.
  - Narration timeline and audio hashes, sample rate and count, timing method and review status (`unreviewed` stays unreviewed).
  - The configuration used.
  - The cues (`id`, `start_sample`, `end_sample`, `speech_end_sample`, seconds, `text`, `text_ref`, `segment`, `timing_sources`, `long`).
  - Hashes of the subtitle files.
  - Review status: `technical: passed`, while language and readability review stay `pending`.
- **`captions.srt`** and **`captions.vtt`**: UTF-8, times `round(sample × 1000 / rate)` milliseconds, cue text unchanged.
- **`check`** re-validates the artifact against the current narration and its file hashes (`stale-captions`).

## Rendering

`render.mjs` and `preflight.mjs` take `--captions captions/captions.json`, or `--no-captions` to hide captions. See [rendering](rendering.md).

- **Checks before use:** the renderer requires the artifact's narration hashes to match the timeline, the audio and the ledger's verified narration output (`stale-captions`). Cues must be valid (`invalid-captions`).
- **Fingerprints:** the artifact and the caption mode are part of the render checkpoint and the preflight binding.
- **Without either flag**, legacy phrase captions are used unchanged. They can still break a hyphenated compound across lines.
- **Paper Explainer treatment:** each whitespace-separated word is one unbreakable span inside one inline line container. The browser wraps only between words, using the real font metrics. `max_lines` comes from the artifact.
- **Preflight `caption-layout`** (Paper Explainer) uses the browser's own shaping and is cached per caption text, width and font. A caption fails when:
  - it has more lines than allowed,
  - text falls outside the caption card,
  - a grapheme cluster (`Intl.Segmenter`) or a word spans two lines, or
  - the rendered text differs from the cue text.

  Caption safe-area violations are reported by `safe-area`.

### Integrated captions (full-bleed presentation, P018.2)

When a topic opts into the full-bleed presentation ([rendering](rendering.md#presentation-modes-topicpresentation)), captions are drawn over the artwork instead of in a panel.

- **Build short phrases** with `captions.py build <project> --mode words --max-words 4 --max-chars 28`. These are starting values: pick the limits per locale and style, since Indic words are long. The same artifact still writes the SRT/VTT files. The presentation never changes them.
- **Word times:** the renderer contract adds an optional `words: [{at, from, to}]` to each cue. Each entry is a word's measured start in seconds and its character range in the cue text, taken from the verified timeline's own word records.
  - Words without a measured start are left out.
  - A cue whose text cannot be found exactly in the timeline gets no `words`. It is then shown without emphasis; nothing is guessed.
- **Active-word emphasis:** the emphasised word is the latest measured word that has started. It is held through short gaps and is never ahead of speech.
  - Emphasis may change only colour, background and shadow, never font metrics. A caption therefore keeps exactly the same layout in every frame of its cue.
  - Each style chooses the look. Paper uses a marker stroke; Tech uses an accent colour, with upcoming words dimmed.
- **Text:** whole whitespace-separated words never break, as in the panel. Compounds, conjuncts and ZWNJ sequences stay intact, and the rendered text must equal the cue text (`caption-layout`).
- **Position:** `lower`, `middle` or `upper`, set per topic or per shot. A caption keeps the position and accent of the shot it starts in, even across a shot boundary.
- **Extra `caption-layout` findings:**
  - the caption overlaps a visible label (outside transitions);
  - the caption box moved or resized within its cue.

## Not proven by these checks

Technical validity is not language quality. Native-reader review of wording, line breaks, readability and reading speed stays a human gate for every locale. The tests use synthetic typography timelines in kn, hi, te, ta and en-IN; they do **not** show that narration exists or sounds natural in those languages. Fonts are system fonts (Nirmala UI, Segoe UI on the test machine) and are still under licensing review.
