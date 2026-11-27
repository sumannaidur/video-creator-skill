# Delivery notes (P015.3 resume)

These notes were added after the visual-production stage was recorded. `creative-decisions.md` is a recorded stage output and is left unchanged.

## Sound (one corrective attempt)

The first mix failed `speech_over_bed_lu` (6.9 LU against a minimum of 12). The cause: the Mithi narration measures −26.6 LUFS, 7 dB below the Kokoro narration that E11's bed levels were set against. Music and every effect were lowered by 7 dB (`BED_OFFSET_DB` in `audio/make-spec.py`). The second mix passed: −16.0 LUFS, −3.8 dBTP, 13.9 LU, sync lag 0 ms.

## Weakness found in the final frames

- **Low-contrast label, found in the final frames after rendering:** the «సన్నగా» chip in the cone shot renders blue text on the dark chip (a topic CSS colour rule overrides the chip text colour), so it is hard to read. Fixing it needs a CSS change and a full re-render, which this resume task did not authorise.
