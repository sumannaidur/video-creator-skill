# E32 (P024.4) autonomous validation: Documentary, "The Apollo 11 Moon landing, 1969" (en-IN, 30.6 s)

**Run:** native `/video-creator-dev` 0.2.0-dev, project `projects/vc-20261127-61868a5b`. No engine changes.

- **Stages:** doctor READY → preferences → research → script → narration → creative plan → visual production (keyframes only).
- **Research:** 6 claims verified.
  - Primary source: the NASA Apollo 11 mission page.
  - The rest are NASA photo captions as reproduced on Wikimedia Commons, so they are secondary copies.
  - Guardrails: the landing quote is shown without a speaker name, because the source does not attribute it. Only the sourced dates (16 and 24 July) appear on screen.
- **Narration:** Mithi, voice anirban.
  - Attempt 1 failed: s1 mapped 0 words (probably the numeral "1969"), and the length was 33.5 s, 11.7% over target.
  - Revision: s1 now spells out the year, and s5 is shorter. Result: 30.6 s, with every word mapped.
- **Assets:** 4 NASA photos downloaded with owner approval (2.2 MB): launch, Eagle in lunar orbit, AS11-40-5903 and AS11-40-5877.
  - Each is marked public domain on Commons and has a SHA-256 in `assets/assets.json`.
  - Wikimedia refused non-standard thumbnail widths (HTTP 400). Re-fetched at the standard 1280 and 1920 px widths.
- **Setup errors fixed along the way:** the script roles must come from the allowed list; the plan's asset `kind` has no "public-domain" value (used "licensed" plus licence and source); a repeated cue word needs `occurrence`; the last shot cannot have a transition.
- **Technical:** 3 keyframes (`render/keys/sheet.png`); 7/7 cue checks passed. No preflight or preview.

## Self-review (Documentary criteria)

- **Authenticity: strong.**
  - Every frame is an unaltered NASA photograph with an on-screen credit naming the photographer where known.
  - The ring is a graphic overlay; no synthetic imagery.
- **Photographic storytelling: good.** The "witness" motif runs through the story: Columbia sees Eagle, Armstrong sees Aldrin, and Aldrin records his own print.
  - Key 2 (push into the visor, ring on the reflected Armstrong) is the strongest frame of P024 so far.
- **Framing: mixed.**
  - Key 1: the near-square Eagle photo, cover-cropped to 9:16, cuts off the right half of the lander, and the quote sits on the lander's top.
  - Key 2: the visor is clamped high in the frame, but this is acceptable.
- **Annotation and typography:**
  - Key 3: the lower third sits over the bootprint itself, hiding the subject.
  - The credit line sits close to the captions.
  - Serif typography is restrained and legible.

## Recurring weaknesses across E30–E32 (P024 autonomous runs)

1. **Subject-to-frame fit in 9:16:**
   - E30: empty sky.
   - E31: the subject fills about 30% of the frame.
   - E32: the subject is cropped.

   Framing is set by fixed scale and percentage values; nothing measures the subject's extent against the safe area.
2. **Annotation placement is fixed, not subject-aware:**
   - E30: labels have no leaders.
   - E31: labels are small and the parts aren't named.
   - E32: a lower third covers the subject and a quote overlaps the art.

   No check detects a label covering the named subject.
3. **The first keyframe is the weakest in every run.** Hooks need more authoring attention.
4. **Pipeline friction costs budget in every run:** stage-ledger re-verification after edits, schema vocabularies that aren't discoverable up front, and cue-visibility rules. Each costs one failed attempt.

**Resume:** pull the Eagle out to fit its full width (or use a contain-fit, with black being the photo's own background), move the bootprint lower third above the print, then re-run the keys.
