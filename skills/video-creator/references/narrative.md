# Narrative development

Write for the ear, natively in the target language. Never translate a script written in another language. Use the locale file for numbers, dates, currency, code-switching and pronunciation notes.

## Structure

- **Hook:** a concrete question or tension the viewer recognises.
- **Progression:** one idea per sentence, each building on the last. Use contrast where it helps ("not only…, but also…").
- **Example:** one relatable case that makes the mechanism tangible.
- **Payoff:** answer the hook explicitly in words that echo it. An open question left in the middle (a «?» moment) must be resolved by the end.

Split the script into **segments**, one to three sentences each. Give each segment a role: hook, mechanism, contrast, example or resolution. These segments become the units for synthesis and timing.

## Story-role map (write before the creative plan)

For each segment, record:

- Its role.
- The question it opens or the promise it pays off.
- The single idea the viewer should keep from it.

This map drives shot planning later. It was the most useful decision aid in P013, where the conclusion paid off a «?» from the mid-video turn.

## Duration control

The narration stage (`scripts/narration/stage.py run`; see [narration](narration.md)) measures the real duration and names the segments to revise. It never changes voice speed.

- Estimate first from a measured speaking rate for the chosen voice (see the locale file). Then measure the actual audio after narration.
- If the measured length misses the target by more than ±10%, revise the script: cut redundant clauses or merge examples. **Never** speed up the voice or alter audio to hit the target. Record each revision and the reason.
- Short pauses between segments (about 0.2 s) are part of the length budget.

## Review

Check the script against these questions before synthesis:

- Is every claim in the ledger?
- Does the hook get answered?
- Would a native speaker say it this way?
- Are any terms ambiguous to the ear?
- Does it fit the length target?

Native-speaker review remains a human gate.
