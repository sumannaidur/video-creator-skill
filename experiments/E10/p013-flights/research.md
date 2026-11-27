# Flight explainer research provenance

**Status: owner-supplied candidate references, pending final source verification.** The owner supplied these references. They have not been independently opened, read or verified in this project. No claim below is established until each source is checked against the narration wording. Statistics, quotations and dates must not be added from these sources without that check.

Video: “Why are flights so expensive?” · hi-IN · Paper Explainer V2 · about 60 s · 1080×1920, 30 fps · Kokoro `hf_alpha`.

## Candidate sources

| ID | Topic | Reference |
|---|---|---|
| F01 | Aviation fuel costs | https://www.iata.org/en/publications/newsletters/iata-knowledge-hub/unveiling-the-biggest-airline-costs/ |
| F02 | Airline operating expenses | https://www.iata.org/en/pressroom/2025-releases/2025-12-09-01 |
| F03 | Revenue management and fare categories | https://www.iata.org/en/publications/newsletters/iata-knowledge-hub/revenue-management-the-heartbeat-of-aviation/ |
| F04 | Supply and demand | https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1986163&lang=2&reg=48 |
| F05 | Booking time and dynamic pricing | https://www.pib.gov.in/PressReleasePage.aspx?PRID=1843408&lang=2&reg=48 |

## Narration-to-claim mapping

| Segment | Role | Narration file | Candidate sources | Verification |
|---|---|---|---|---|
| D | Hook | [`inputs/D.txt`](inputs/D.txt) | F03, F04 | Pending |
| E | Fuel costs | [`inputs/E.txt`](inputs/E.txt) | F01 | Pending |
| F | Operating expenses | [`inputs/F.txt`](inputs/F.txt) | F02 | Pending |
| G | Pricing transition | [`inputs/G.txt`](inputs/G.txt) | F03, F04 | Pending |
| H | Fare categories | [`inputs/H.txt`](inputs/H.txt) | F03 | Pending |
| I | Supply and demand | [`inputs/I.txt`](inputs/I.txt) | F04 | Pending |
| J | Different passenger prices | [`inputs/J.txt`](inputs/J.txt) | F03 | Pending |
| K | Conclusion | [`inputs/K.txt`](inputs/K.txt) | F01, F02, F03, F04, F05 | Pending |

## Open checks before publication

- Confirm that each source supports its segment's specific wording. For example, E says fuel is *one of the biggest* costs, and F lists the cost categories.
- Record the access date and the relevant passage summary for each source.
- F05 is the only source for the booking-time claim in K. Confirm that it addresses booking time or dynamic pricing.
- Native Hindi review of the narration wording.

## Narration (P013.2B.2)

Synthesized with the existing pipeline: `capture_native_timing.py --text-file inputs/<ID>.txt <ID>`, then `map_text_to_phonemes.py D E F G H I J K` and `combine_segments.py --gap-ms 200`. Model: pinned Kokoro v1.0 ONNX. Voice: `hf_alpha`, speed 1.0, CPU. Segments ran one at a time. All timings are **unreviewed** candidates.

| Segment | Duration (s) | Words mapped | Phrases mapped | Run ID |
|---|---|---|---|---|
| D | 7.550 | 20/20 | 2/2 | `931b7589…` |
| E | 8.025 | 19/19 | 3/3 | `44c107d1…` |
| F | 10.500 | 24/24 | 3/3 | `8c15a732…` |
| G | 5.125 | 11/11 | 1/1 | `87ecb5b5…` |
| H | 9.775 | 19/19 | 3/3 | `46e5172c…` |
| I | 9.375 | 23/23 | 3/3 | `b52dc131…` |
| J | 6.800 | 14/14 | 1/1 | `f9a3f2ea…` |
| K | 10.250 | 25/25 | 3/3 | `071641fc…` |

- **Combined:** [`narration-DK.wav`](narration-DK.wav) and [`narration-DK.timeline.json`](narration-DK.timeline.json). 1,651,200 samples at 24 kHz = **68.800 s**: 67.400 s of speech plus 7 × 0.2 s gaps. SHA-256 `71e936410d68ed38b7dea51895b6287e5a6f46e5e9616a228982e7425a9b0c53`. Run `combined-73ea5d17e7b00b0054e5f7a2`. 155/155 words and 19/19 phrases mapped, with no unresolved timestamps.
- **Validation:**
  - Per segment, 13 checks each, all passed ([`segment-validation.json`](segment-validation.json)): PCM16 mono 24 kHz, clean FFmpeg decode, consistent audio hash, run ID and sample count, text identical to the input, full word and phrase coverage, monotonic words, contiguous phonemes, in-bounds records, and unreviewed status.
  - Combined: all 8 checks in `combine_segments.py` passed, the FFmpeg decode is clean, and FFprobe reports 68.8 s. All 27 pre-existing E04 files have unchanged hashes.
- **Observations:**
  - The duration is 8.8 s over the roughly 60 s target. No speed-up or script change was applied.
  - Per-segment WAVs and timelines are in `experiments/E04/native-timing/{samples,outputs}/sample-{D..K}-*`.
  - Native listening review and human alignment review are pending.
