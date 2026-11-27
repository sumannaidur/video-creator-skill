# E05 Indic caption shaping proof

Run `node experiments/E05/render.mjs` from the repository root on the tested Windows machine. The optional first argument is the path to an existing Chromium executable. The fixture can also be opened directly in a browser. Node 24.19.0 used its built-in WebSocket to drive headless Chrome 157.0.8103.79 through a temporary browser profile. The offline fixture contains no remote resources. Browser device scale is 1. Edge 158.0.4370.33 was found on disk and was not used for capture.

| Evidence | Results |
| --- | --- |
| [Vertical PNG](vertical.png) | 1080 × 1920, no scrollbar after fixing an initial 25 px overflow |
| [Horizontal PNG](horizontal.png) | 1920 × 1080, no viewport overflow |
| [Browser evidence](render-evidence.json) | All specimen and caption bounds pass in both layouts. No grapheme spans were detected across lines. Kannada, Hindi, Telugu and English captions occupy two lines. Tamil occupies three in both layouts. |

The UTF-8 fixture tests conjuncts, vowel signs, marks above and below the baseline, regional numerals, punctuation, the rupee sign, inline English and wrapping. The Latin specimen includes a decomposed accent. The PNGs showed no obvious tofu boxes, cut-off text, visibly detached marks or gross order anomalies on inspection. Browser bounds and font usage cannot establish linguistic shaping correctness or directly identify each missing glyph. The test covers these five strings and captions in the tested browser, not all possible text.

Chrome reports Nirmala UI for all four Indic specimens and Segoe UI for English and the explicitly styled English spans. The deliberate missing-family control fell back to Nirmala UI in both frames. No additional font family appeared in the probed text blocks. Windows registers the installed fonts as `Nirmala.ttc` and `segoeui.ttf`. Use these as candidates for the local Windows experiment. They are Microsoft system fonts. Their presence does not grant permission to bundle, redistribute, embed as a web font, or deploy them to a server. The fixture references installed fonts by family name and ships no font files. [Nirmala UI coverage and licensing](https://learn.microsoft.com/en-us/typography/font-list/nirmala-ui) · [Microsoft font redistribution FAQ](https://learn.microsoft.com/en-us/typography/fonts/font-faq)

E05 awaits native-reader visual review. Ask reviewers for each locale to compare both PNGs to the source at full size and record the exact failing token, layout and issue if any. Check consonant clusters, vowel and mark placement, expected visual order, punctuation, numeral legibility, wrap points and the acceptability of Tamil’s third caption line. Review the caption layout on the actual target player before accepting it for production.
