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
3. **Assets:** `kind` is original, procedural, licensed or user-supplied. Licensed and user-supplied assets need `source` and `license`.
4. **Shots:** any number. The first starts at 0; each later shot needs a `start` anchor strictly after the previous one, and ends where the next starts (the last at the end of the narration). Minimum 0.3 s. Record purpose, metaphor, objects, camera intentions and the transition with its reason.
5. **Cues:** each key reveal is tied to the word that introduces its concept. Give a cue an `id` (lowercase, unique in the plan) to make it addressable from the topic module; the renderer requires every such cue to be used. Allow at most one major reveal about every 0.8 s.
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

## Think like a production team, not a diagram generator

Work through each shot four times, each time in a different role, before you write any artwork code. These are ways of thinking, not templates. You still invent every scene.

| Role | The question you answer | What it produces |
|---|---|---|
| **Storyboard artist** | What single image would make this idea land for someone scrolling on a phone? Where is the viewer standing? | A sentence-long thumbnail per shot: shot scale, viewpoint, focal subject, what fills the top, middle and bottom of the frame |
| **Illustrator** | What does this place or thing actually look like, specifically? What details make it recognisable and this topic's own? | A list of specific, observed details: materials, wear, local objects, characteristic shapes |
| **Art director** | Where does the eye go first, second and third? Where is the light coming from? What is the mood? | A focal hierarchy, light direction, palette temperature and value plan (where the darkest and lightest areas are) |
| **Motion designer** | What moves *because of* the narration, and what does that motion explain? What carries over into the next shot? | Cause-and-effect motion per cue, a camera intention, and a transition that continues an action or motif |

Record the thumbnails and the art-direction choices in the project's `creative-decisions` note (the plan schema doesn't need new fields for this).

## Universal principles (any style, any language)

These apply to every style and are independent of the narration language and TTS provider. A style reference adds its own medium-specific rules on top.

### Opening hook

- The first 2–3 seconds decide whether a mobile viewer stays. Open on a **specific, striking image with a question already visible in it**, not on a title or an empty establishing shot.
- Prefer tension, scale or surprise: a close-up of something familiar behaving unexpectedly, a person reacting, an object mid-action, a contrast placed side by side.
- Motion must start within the first second. A static first frame reads as a slide.

### Composition and visual hierarchy

- **One focal point per moment.** Decide what the eye lands on first and make it win on at least two of: size, contrast (value or colour), detail density, motion and position. Keep secondary elements quieter.
- **Use the whole vertical frame.** A 9:16 frame is tall. Plan what sits in the upper, middle and lower thirds. Stacking (sky over subject over foreground), vertical journeys (a beam travelling downwards, something rising) and tall subjects suit it. Avoid a single horizontal band of content with dead space above and below it.
- **Layer for depth.** Most shots benefit from a foreground (framing elements, partly out of frame, darker or larger), a middle ground (the subject and the action) and a background (environment, atmosphere, receding detail). Layers that move at different speeds give parallax.
- **Place the subject in a world.** Even an abstract mechanism (molecules, waves, money, data) can sit inside a physical setting: a room, a landscape, a hand, a machine, a cross-section. Scenes floating on a plain coloured backdrop read as textbook diagrams.
- **Negative space is intentional, not left over.** An empty area must do a job: give a label room, isolate the focal point or suggest scale. Unplanned empty space larger than about a third of the frame is a defect.

### Shot variation and cinematic language

- **Vary the shot scale** across the video: extreme wide (where we are), wide, medium, close-up (detail, emotion) and macro (the invisible made visible). Avoid three similar medium shots in a row.
- **Vary the viewpoint** where the story allows: eye level, looking up (awe, scale), looking down (overview, a map) and through or behind something (a window, a lens, a leaf).
- **Repeat for a reason.** A callback shot should change: a new time of day, a new pose, a new camera position, or a detail that now carries the answer.
- **Continuity:** keep the light direction, scale relationships and motif colours consistent within a scene, so cuts feel like one world.

### Characters and expression (when a character helps)

- A character gives the viewer someone to identify with. Show the character's **face or a clear gesture** at moments of curiosity, surprise and understanding, not only the back of the head.
- Build characters from separately animated parts (head, torso, arms, and eyes or brows where possible) so they can turn, point, look and react **on the cue**.
- Give each appearance a new pose or action that matches what the narration says at that moment.
- Represent people respectfully and specifically for the audience's own setting. Avoid stereotypes.

### Motion that explains

- Every major motion should answer "what does this show?". Prefer **cause and effect**: something pushes, splits, fills, bends, travels or transforms *because* the narration says it does.
- Keep ambient motion (sway, drift, flicker, breathing) on most layers so no frame is completely still, but keep it subordinate to the explanatory motion.
- Use **anticipation and follow-through**: a small wind-up before a big reveal, and a settle after it. Stagger related objects instead of revealing them all at once.
- **Transitions continue an action:** a beam that keeps travelling into the next scene, a zoom into a detail that becomes the next setting, or a motif that morphs. A transition without a story reason is decoration.

### Richness versus clutter

- Richness means **specific, meaningful detail at several scales**: a big readable shape, mid-size supporting objects and small textures or details that reward a second look.
- Clutter means competing focal points, unreadable small text, decoration unrelated to the topic, or detail that buries the explanation.
- Test: at phone size, can a viewer say what the shot is about in one second? If not, simplify the middle ground, not the environment's texture.
- There is no required object count. A single well-lit, well-composed object can be richer than twenty flat icons.

### Explanatory accuracy

- Make abstract ideas concrete with objects from the topic's own world. Invisible processes may be symbolic, but stay faithful to the facts and to the guardrails.
- Mark illustrative visuals (symbolic scale, illustrative colours) as such in the plan's guardrails, and never imply measured values.

## Heuristics (guidance, not rules)

- **Shots:** use one shot per distinct setting or idea. Keep a single continuous shot when one sentence builds toward one image. Cut in the pause between phrases unless the metaphor needs to continue across the cut.
- **Labels:** reuse the narration's own words, and keep them few and large; the picture should carry most of the meaning. Every on-screen word in the target language needs native review.
- **Language independence:** never place art or labels based on a language's word order or text length. Bind motion to resolved cue IDs, leave room for longer or shorter labels, and leave the caption card to the caption system. Changing the narration language or provider must not need changes to the artistic design.
- **Endings:** the conclusion should answer the hook visibly, for example by calling back the opening objects or values in a changed state.

## Budgeted self-review

After the first keyframes, review in two passes. Write down an answer to every question, then spend your **one** correction on the worst problem and record the rest.

**Defects:**

- Overlaps, and labels crowding icons.
- Unplanned empty regions larger than about a third of the frame.
- Cropped subjects, and small detail that won't read at phone size.
- Guardrail violations.

**Art direction (judge every keyframe at phone size):**

1. **Hook:** would the first frame stop a scrolling viewer? Is the question visible?
2. **Focal point:** is there one clear first read in each keyframe?
3. **Vertical frame:** are the upper, middle and lower thirds all doing a job?
4. **Depth:** can you name the foreground, middle ground and background of each shot?
5. **World:** does every scene sit in a place, or do some float on a plain backdrop like a textbook diagram?
6. **Specificity:** would someone recognise this topic, and this place, from the art alone?
7. **Light and material:** is there a consistent light direction, and do surfaces look like the style's medium?
8. **Variety:** do the shot scale and viewpoint change across the video? Do repeated settings change?
9. **Character:** where a character appears, does it react to the narration?
10. **Motion:** does each major motion show cause and effect, tied to a cue?

Rank the problems by how much they hurt understanding and engagement. Fix composition and storytelling problems before polish.

Write the decisions, thumbnails, the self-review answers and known weaknesses to a `creative-decisions` note in the project. Don't claim the visuals are high quality: artistic quality is a human review gate.
