# Autonomous creative direction

You decide the shot count, metaphors, artwork, composition, camera, cues and transitions for each topic. There is **no fixed storyboard, scene count or template**. The structures below make your reasoning reviewable; they don't dictate content.

## Creative plan (`plan/creative-plan.json`, before any artwork)

Schema `video-creator.creative-plan` v1. The plan records **your** decisions; `scripts/plan.py` only checks references and resolves speech anchors to times. It never chooses shots, metaphors or timings for you.

```json
{"schema": "video-creator.creative-plan", "version": 1,
 "narration": {"timeline": "narration/narration.timeline.json", "sha256": "<hash of that timeline>"},
 "style": "paper-explainer", "style_reason": "why this style fits the topic",
 "story": [{"segment": "s1", "role": "hook", "idea": "..."}],
 "motifs": [{"id": "m1", "stands_for": "the idea or spoken word it carries"}],
 "assets": [{"id": "a1", "kind": "original", "description": "..."}],
 "guardrails": ["what the visuals must never imply"],
 "shots": [{"id": "open", "purpose": "what the viewer should understand", "metaphor": "...",
            "objects": [{"id": "o1", "asset": "a1", "motif": "m1", "description": "..."}],
            "camera": [{"at": {"phrase_index": 0, "edge": "end"}, "intent": "settle"}],
            "cues": [{"object": "o1", "action": "reveal", "at": {"word": "shade"}}],
            "transition": {"type": "dissolve", "reason": "why it fits"}},
           {"id": "turn", "purpose": "...", "start": {"segment": "s2"}}],
 "extensions": {"paper-explainer": {"anything style-specific": true}}}
```

1. **Story-role map** (`story`): each script segment's role (hook, context, mechanism, contrast, example, transition, resolution) and its idea.
2. **Motif ledger** (`motifs`): each symbol and the idea it stands for. Reuse a motif whenever its idea returns; add new art only for new ideas, so the ending can call back the opening.
3. **Assets:** `kind` is original, procedural, licensed, public-domain or user-supplied. Licensed, public-domain and user-supplied assets need `source` and `license`; their file integrity and rights are checked by the style's asset manifest (for example [Documentary](styles/documentary.md)).
4. **Shots:** any number. The first starts at 0; each later shot needs a `start` anchor strictly after the previous one, and ends where the next starts (the last at the end of the narration). Minimum 0.3 s. Record purpose, metaphor, objects, camera intentions and the transition with its reason.
5. **Cues:** each key reveal is tied to the word that introduces its concept. Give a cue an `id` (lowercase, unique in the plan) to make it addressable from the topic module; the renderer requires every such cue to be used.
6. **Guardrails:** for example a formula, a guaranteed outcome, a ranking the sources don't support.
7. **Extensions:** keyed by registered style ID; their contents pass through unchanged for that style's backend.

**Speech anchors** (`start`, `cues[].at`, `camera[].at`) — every form takes an optional `offset_ms`:

| Anchor | Resolves to |
|---|---|
| `{"word": "w", "segment"?: "s2", "occurrence"?: 2, "edge"?: "start"\|"end"}` | That word record. Matching ignores leading and trailing punctuation only. A word that occurs more than once in scope needs `segment` or `occurrence` |
| `{"phrase": "text"}` or `{"phrase_index": 0, "segment"?: "s2"}` | That phrase record |
| `{"segment": "s2"}` | The segment's start (or end with `edge`) |
| `{"shot": "id"}` | That shot's resolved start |
| `{"at": "narration-start"\|"narration-end"}` | The audio bounds |

Explicit failures: `missing-reference`, `ambiguous-reference`, `unmapped-reference` (the word has no measured timing; a time is **never** invented), `unknown-segment`, `out-of-range`, `cue-outside-shot`, `cue-order`, `shot-too-short`, `asset-provenance`, `unknown-style`, `stale-narration`, `narration-not-verified`, `invalid-anchor`, `invalid-plan`.

```
python scripts/plan.py validate <project> [--plan plan/creative-plan.json]
python scripts/plan.py resolve  <project> [--plan plan/creative-plan.json] [--out plan/resolved-plan.json]
```

- `validate` checks without touching the ledger.
- `resolve` runs the ledger's `creative-plan` stage. It writes `plan/resolved-plan.json` (every anchor as an integer sample plus seconds, its timing source and edge) and `plan/plan-evidence.json`, then completes the stage, or fails it with the reason.
- The timeline must be a verified output of the completed narration stage, and `narration.sha256` must match it. When narration changes, the ledger invalidates the plan stage and the old plan is refused until you review it against the new narration.
- Only contract fields are read (`audio`, `segments`, word and phrase records with `source` and `segment`), so any provider's timeline works. The resolved plan keeps the timeline and audio hashes, the timing method and sources, and the review status (`unreviewed` stays unreviewed).

## Cinematic direction (new productions)

Set top-level `"cinematic": true` on new plans. Legacy v1 plans remain valid without it. Add a `direction` object to every shot:

```json
{"action": "hand places cup on counter",
 "environment": "street tea stall, foreground jars, distant pedestrians",
 "composition": "cup and hand in focus, clear space for captions",
 "viewpoint": "counter-height close-up, static",
 "lighting": "warm daylight from left, contact shadow under cup",
 "performance": "wrist follows the cup until contact, then releases",
 "sound": "market ambience continues; cup contact follows visible impact",
 "continuity": "same cup, counter and screen direction as previous shot",
 "technique": "original layered SVG with articulated hand",
 "assets": ["a1"]}
```

Use concise topic-specific decisions, not generic adjectives. Each field is a nonempty string; environment, viewpoint, lighting, performance and sound may instead be an object such as `{"omit":"abstract chart, no character"}`. Action, composition, continuity and technique always require text (a static hold or deliberate cut can be the action or continuity). Assets is a list of existing plan asset IDs, empty if none. Do not repeat timed camera keys or cues: use existing anchors for the actual timing. Direction is editorial metadata, not automatic camera, rig, sound or renderer support.

Group adjacent shots into narrative sequences in the creative-decisions note. Sketch the entire sequence in shot order before detailed artwork, including entry/exit states, reusable assets, sound perspective and the visible payoff. Reuse sets and character identities across views; use alternate artwork or real geometry for genuine viewpoint changes. Plan silence when useful. Choose the cheapest technique that meets the intended visual quality, and do not promise unavailable capabilities.

## Plan the visual argument

Use the existing plan and a brief `creative-decisions` note. Sketch the opening, the change that explains the mechanism, and the payoff. These are story beats and may share a shot.

- **Open on evidence.** Put a recognisable subject in a specific situation. Show a contrast, tension or unexpected state that raises the question before the explanation. A quiet opening can work when the image itself creates curiosity.
- **Make the change do the explaining.** Identify what stays recognisable and what changes, then tie the visible cause and result to speech cues. Keep symbolic scale, colours and shapes faithful to the claim guardrails. Show the answer at the end through a changed object, relationship or value the viewer can compare with the opening.
- **Compose for the actual delivery frame.** Name the first read and direct attention through scale, contrast, placement or detail. Decide where the subject, supporting context and captions fit. Keep annotations beside their targets and use leaders where the referent is ambiguous. Leave negative space where it serves the reading order.
- **Pick the craft and tool together.** Identify the material, shape, stroke, evidence crop or typographic relationship that makes this subject recognisable. In the note, connect each consequential capability choice to the intended visual result and its cost. Use styled SVG for precise silhouettes, diagrams and labels, optional raster layers when material or photographic evidence does explanatory work, and 3D when geometry or viewpoint needs to remain coherent. Check the selected style reference for supported tools. Reuse simpler working techniques when they carry the idea as clearly.

Keep art independent of narration word order and label length. Bind motion to resolved cues and reserve space for localised text. Choose cuts, camera moves and effects when they clarify an action, reveal a relationship or carry a motif forward.

### Motion primitives (optional, `scripts/styles/shared/motion.js`)

Loaded by the Paper and shared shot-core engines (all styles except 3D Explainer). They are tools, not requirements. Choose them per object for a story reason:

| Primitive | Use when | Avoid when |
|---|---|---|
| Curve `inOut` | Natural acceleration and braking of objects and cameras | |
| Curve `outQuart` | Launches and arrivals that should feel quick, then soft | |
| Curve `anticipate`, or `vcMotion.arrive(..., {anticipate})` | A wind-up before a deliberate action (a gate swing, a throw, a jump) | Small UI changes; anything on a data value |
| Curve `overshoot` | Lively arrival of labels, notes, icons and characters | **Data marks.** A bar, line or circle never passes its true value |
| Curve `settle` | Weight and impact (a heavy gate closing, a boat coming to rest), and follow-through | Precise readouts |
| `vcMotion.follow(keys, {lag})` | Secondary parts answering a primary one (a head after an arm, a beam after a gate) | |
| `vcMotion.stagger(items, start, gap)` | Related objects that build or move together in sequence | Items the narration names one by one (use their own cues) |
| `vcMotion.stepped(keys, fps)` | Handmade styles (cut paper, chalk) when a held-pose, on-twos feel suits the tone | Data, UI, the camera, technical precision styles |
| `vcMotion.jitter(seed, i, amp)` | Hand-placed irregularity, deterministic | Aligned grids and charts |

Every curve starts at 0 and ends exactly at 1, so key values, speech-cue timing and data values hold at key times. Everything is deterministic.

## Keyframe review gate

Before any preview or full render, inspect representative frames from every shot in sequence at delivery aspect ratio and phone size with sound off, including the hook, change and payoff. Record missing or unreviewed shots explicitly; do not advance on a partial review. Read them first without relying on captions. Use the selected style's review criteria for the medium.

| Check | Evidence to record |
|---|---|
| Visual argument | Name the subject and question in the opening, the visible change and its cause in the middle, and what answers the question at the end. Record any essential inference carried only by narration. |
| Composition | Identify the first read in each frame. Verify captions and labels remain readable, leaders terminate at their subjects and critical evidence stays visible. Note intentional crops. |
| Craft and accuracy | Point to a topic-specific detail that serves recognition or explanation, and compare the result against the style reference and claim guardrails. |

Record the strongest frame and the most consequential weakness in the same note. Address failures that obscure the explanation or violate guardrails before advancing. Use the available correction budget on the highest-impact failure. If scope or budget prevents a correction, preserve the frames and stop for review. Technical checks and self-review support the decision to advance; artistic acceptance stays with the owner.
