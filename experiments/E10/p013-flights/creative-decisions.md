# P013.3B.8 autonomous creative direction (51.450–68.800 s)

No scene-specific instructions were given for this span. It covers segment J (P16) and segment K (P17–P19). The decisions below were made from the narration, the candidate timeline, the Paper Explainer V2 style specification and the existing video.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Shot count | **2.** Scene 07 (J) is kept. One new conclusion shot covers K. | Scene 07 already shows "same flight, different price" without implying different seat quality. K is one sentence that builds toward a single image, so one continuous shot resolves it better than cutting between factors. |
| Central metaphor | **Strings behind the price.** The Scene 04 ticket returns showing «₹ ?», and on «पीछे» ("behind") it rises to reveal dashed strings tied to four luggage tags. | The narration says what lies *behind* the price. Scene 04 left a «?» beside "only costs". The conclusion pays that off by turning the «?» into the missing factors. Luggage tags fit the travel topic and avoid generic cards. |
| Factors | Tags appear on their spoken words: «उड़ान का खर्च» (62.2 s, tanker icon), «मांग» (64.15 s, travellers and arrow), «सीटों की उपलब्धता» (65.5 s, booked and free seats), «बुकिंग का समय» (66.725 s, calendar and spinning clock). | Each icon reuses artwork from the scene that explained it (Scenes 02, 06, 05). The only new idea in the narration is booking time, so it is the only one with new art (a clock). |
| Callback | On «नहीं» (63.1 s) the Scene 04 «?» swings back into the empty tag slot. On «मांग» it shrinks away as the demand tag drops in. | It makes the conclusion visibly answer the earlier open question. |
| Resolution | On «होता है» (67.85 s) the strings brighten and every tag pulses. The price changes from «₹ ?» to «₹3,000 या ₹9,000», tagged «उदाहरण». The opening aircraft crosses the top of the frame. | This returns to the opening question with the same example prices and aircraft, so the video ends where it began. «या» ("or") presents the two values as alternatives, not a calculated range. |
| Camera | Starts close on «₹ ?» (1.7×), pulls back on «पीछे» to reveal the strings and tags, then settles to 1.0× by the end. | One camera move that carries meaning ("look behind the price"). It avoids zone-hopping, which would crop the labels on the other tags. |
| Transition | A paper-sheet wipe printed with the Scene 04 board, from the cabin into the answer board. | It brings back the Scene 04 space where the question was asked. |
| Wording | The tag labels reuse the narration's own words. No percentages, weights or ordering of factors are shown. | This keeps the video from implying a formula or ranking, and keeps all Hindi on screen traceable to the reviewed script. |

## Validation

- **Keyframes:** [`answer-keys/keyframes/`](answer-keys/keyframes/) `key-21-question-returns` at 63.45 s, `key-22-four-factors` at 67.2 s and `key-23-resolution` at 68.55 s.
- **Cues:** 45/45 pass, 7 of them new. Each new cue sits on its word: पीछे, उड़ान, नहीं, मांग, उपलब्धता, बुकिंग, होता.
- **Layout:** all 23 keyframes pass the safe-area, label, text and background-coverage checks.
- **Repeatability:** SSIM 0.99984.
- **Regression:** keyframes 3–20 are byte-identical. Opening keyframes 1–2 match at SSIM ≥ 0.9995.

## Known weaknesses (not corrected, within budget)

- The lower third of the board stays empty in the conclusion. The tags could sit lower, or the final pull-back could reveal more.
- The lower tags' strings pass behind the upper tags rather than routing cleanly around them.
- Tag icons crowd their labels: «मांग» touches the travellers' feet.
- The closing aircraft is small and appears only in the last second.
- The «अलग-अलग» caption line break in Scene 07 is still unresolved, because that is an engine caption-layout issue.

## Instructions that would help a future agent do this for any topic

1. **Story-role map before art.** For each narration sentence, record its role (hook, mechanism, contrast, example, resolution) and the open question or promise it creates or pays off. The conclusion should resolve the hook explicitly. This was the most useful decision here, and nothing in the current instructions asks for it.
2. **Visual motif ledger.** Keep a running list of introduced symbols and the words they stand for (ticket = price, tanker = fuel cost, «?» = unexplained factor…). Later scenes should reuse a motif when its word recurs and add new art only for new concepts.
3. **Cue selection rule.** Put a cue on the content word that introduces a concept, not on function words. At most one major reveal per roughly 0.8 s. Labels use the narration's own words.
4. **Shot-count heuristic.** Use one shot per distinct setting or idea. Keep a single shot when one sentence builds toward one image. Cut at the pause between phrases unless a metaphor needs continuity across the cut.
5. **Layout pre-checks before rendering.** Use a coarse grid for subject, label and empty areas. Check label clearance against icons. Check the camera against the artwork bounds: with an exact plate, keep |offset| ≤ 0.5 − 0.5/zoom. This style of problem has needed a corrective render in several scenes.
6. **Claim guardrails per topic.** List what the visuals must not imply, such as a formula, a guaranteed rise, or different service for different prices, and check each keyframe against that list.
7. **Budgeted self-review.** After the first keyframe render, check for overlaps, empty regions over a third of the frame, cropped subjects and unreadable small detail. Spend one correction on the worst issue and record the rest.
8. **Engine gaps that need human decisions.** Examples are caption hyphen breaks and transitions that need a following shot. Report these instead of working around them in topic code.
