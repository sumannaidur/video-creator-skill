# Telugu word-boundary listening review (Mithi `ahana`, P015.2B)

**Reviewer:** a native Telugu speaker. **Status:** not reviewed.

These timings are **model-predicted**: they come from Mithi's own token durations for this exact audio. They have not been measured acoustically or checked by a person. Nothing here claims they are accurate or that the pronunciation is natural.

## Files

- **Audio:** `../project/narration/te-IN-ahana-phrases.wav` (9.15 s, 24 kHz mono, SHA-256 `e11d159f32ce6302…`).
- **Text:** «అమ్మా, ఈ రోజు వాన వస్తుందా? ఆకాశం చూడు, మబ్బులు ఎంత నల్లగా ఉన్నాయో. వాన వస్తే, మనం ఇంట్లోనే ఉందాం, సరేనా?». The agent wrote this sentence, and it also needs a wording review.
- **Label tracks:** `word-labels-audacity.txt` and `phrase-labels-audacity.txt`, in Audacity label format (start, end, text, in seconds). In Audacity, open the WAV, then choose File › Import › Labels.

## How to review

1. Play each word label (click the label, then press Space).
2. In **Boundary**, mark **OK** if the label covers the word, **Early** or **Late** if its start or end is off by more than about 50 ms, or **Wrong** if it covers a different word.
3. In **Pronunciation**, mark **OK** or describe the problem. Also add a note on naturalness overall.
4. Pay particular attention to:
   - Word 1 «అమ్మా,» — the first word after the leading silence.
   - Words 4 and 12, the repeated word «వాన».
   - Words just before a comma or question mark. The pause after punctuation is deliberately **not** part of the word.

| # | Word | Start (s) | End (s) | Length (ms) | Boundary (OK / Early / Late / Wrong) | Pronunciation | Notes |
|---|---|---|---|---|---|---|---|
| 1 | అమ్మా, | 0.050 | 0.500 | 450 | | | |
| 2 | ఈ | 0.725 | 0.875 | 150 | | | |
| 3 | రోజు | 0.950 | 1.250 | 300 | | | |
| 4 | వాన | 1.325 | 1.600 | 275 | | | |
| 5 | వస్తుందా? | 1.650 | 2.200 | 550 | | | |
| 6 | ఆకాశం | 2.675 | 3.175 | 500 | | | |
| 7 | చూడు, | 3.225 | 3.550 | 325 | | | |
| 8 | మబ్బులు | 3.875 | 4.275 | 400 | | | |
| 9 | ఎంత | 4.350 | 4.625 | 275 | | | |
| 10 | నల్లగా | 4.675 | 5.100 | 425 | | | |
| 11 | ఉన్నాయో. | 5.150 | 5.525 | 375 | | | |
| 12 | వాన | 6.025 | 6.375 | 350 | | | |
| 13 | వస్తే, | 6.425 | 6.800 | 375 | | | |
| 14 | మనం | 7.125 | 7.425 | 300 | | | |
| 15 | ఇంట్లోనే | 7.475 | 7.950 | 475 | | | |
| 16 | ఉందాం, | 8.000 | 8.325 | 325 | | | |
| 17 | సరేనా? | 8.650 | 9.075 | 425 | | | |

**Overall naturalness (1–5):** ___ **Accent suitable for te-IN narration (yes / no):** ___ **Reviewer and date:** ___
