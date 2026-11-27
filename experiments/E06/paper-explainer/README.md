# Paper Explainer style foundation

The style treats each frame as an editorial page with one visual job. Use the same paper, type hierarchy and caption position across a sequence. Replace the illustration, labels and copy when the topic changes.

| Token | Value | Role |
| --- | --- | --- |
| Paper | `#F4EFE4` | Warm canvas with low-opacity procedural dots and a soft light wash |
| Ink | `#252A30` | Text, outlines and the caption surface |
| Terracotta | `#BF5942` | Attention marks and a contrasting category |
| Forest | `#427361` | Section rules and constructive or explanatory accents |
| Mustard | `#DAB357` | Highlight layer, diagram hub and takeaway label |
| Slate | `#59758D` | Secondary shapes and supporting detail |

## Reuse

- **Page and typography.** Use `.frame`, `.safe`, `.mast`, `.section`, headings and `.lede`. Georgia gives English headings editorial weight, Segoe UI carries English body text, and `.indic` selects Nirmala UI for native captions with a taller line box. Tag text with its locale. Keep the source text intact, leave normal word wrapping enabled, and inspect real localized copy rather than assuming English line counts.
- **Illustration.** Compose local SVG shapes in a viewBox. Keep paper layers to a ground shape, one or two cutouts, and a small offset shadow. Use `.connector` for hand-drawn paths, `.chip` for annotations and `.icon` for a labeled SVG symbol. Keep meaningful distinctions in the labels and silhouette as well as color.
- **Information.** Use `.hub`, `.branches`, `.cards`, and `.card` for category diagrams, or `.factors` and `.action` when several ideas support a takeaway. Quantitative bars use a `.bar-track` containing a `.bar-fill` with a sourced, scaled percentage in `--value`. Pair each with a visible value, units and scale. Equal-size category cards carry no magnitude. The flight preview uses qualitative categories and no numerical statistics.
- **Composition.** At 1920×1080 leave 92 px at the sides and 62 px above and below. At 1080×1920 leave 84 px at the sides and 104 px above and below. These are experiment margins, subject to platform overlays. Lay out hero copy and art side by side in landscape and stack them in portrait. Reflow four diagram cards from one row to a two-column grid. Keep the caption in its own bottom row. When localized copy needs extra space, shorten or reflow the composition before shrinking the type or clipping it.
- **Motion for a later experiment.** Enter cutouts with a short slide and settle, then hold for reading. Trace a connector when narration introduces the relationship. Reveal the mechanism one category at a time in spoken order. Reuse stable anchors across transitions and leave captions stable while illustrations move. Tie events to validated narration timestamps, test holds at playback speed, and offer a static or reduced-motion treatment. This fixture is static.

The original airplane, ticket, icons and connector paths are inline procedural SVG. Text and visual styling live in the fixture. No external imagery or font files are included. Installed system fonts are local candidates under the same redistribution caveats as [E05](../../E05/README.md).

## P009 scene composition

[Scene specifications](story-scenes.js) separate the topic, locale and narrative beat from the visual objects and narration caption. Each object declares an ID, an SVG symbol or a text label, a stage-relative center and width, and a layer. Each relationship names its source, destination and meaning, with an optional dashed line for radio. Semantic cues target object or connector IDs and describe the event and action. Timing and interpolation are outside this prototype.

[The scene view](story.html) renders each object as a separately addressable DOM element and each relationship as an SVG group. Irregular silhouettes, layered paper and soft offsets provide depth. The P009 surface uses subtle procedural grain in place of the P008 dot grid. Portrait places the title above an enlarged illustration and preserves a bottom caption row. Landscape puts the title beside the illustration. The proposed margins are 84 × 104 px in portrait and 92 × 72 px in landscape. Use `?scene=flights-hook&debug=1` to reveal development labels. They are hidden in normal mode. All four scenes use `en-IN`; the narration caption is separate from the short diagram labels.

| Scene | 1080×1920 | 1920×1080 |
| --- | --- | --- |
| Flight hook, ticket and airplane | [Vertical](p009/flights-hook-vertical.png) | [Horizontal](p009/flights-hook-horizontal.png) |
| Flight mechanism, four inputs to one aircraft | [Vertical](p009/flights-mechanism-vertical.png) | [Horizontal](p009/flights-mechanism-horizontal.png) |
| Flight takeaway, two dates on one route | [Vertical](p009/flights-closing-vertical.png) | [Horizontal](p009/flights-closing-horizontal.png) |
| Wi-Fi, device to router to internet | [Vertical](p009/wifi-mechanism-vertical.png) | [Horizontal](p009/wifi-mechanism-horizontal.png) |

Run `node experiments/E06/paper-explainer/render-story.mjs` from the repository root. All eight frames passed exact dimensions, 42 total text probes, required element safe areas and asset checks. The lowest checked text contrast was 9.96:1. Both the E05 typography fixture and the three P008 directions passed the shared renderer regression in temporary directories. The [P009 render evidence](p009/render-evidence.json) retains the checks. Art and texture are procedural, and the examples use qualitative relationships. P009 demonstrates static reuse across two topics. Human visual scores, narration timing and animation remain untested.

## Previews and checks

From the repository root run `node experiments/E06/paper-explainer/render.mjs`. The shared E05 capture pipeline uses headless Chrome, an isolated profile and device scale 1. Open `preview.html?scene=hook`, `?scene=mechanism` or `?scene=closing` to inspect a direction interactively.

| Composition | 1080×1920 | 1920×1080 |
| --- | --- | --- |
| Hook, airplane and ticket | [Vertical](hook-vertical.png) | [Horizontal](hook-horizontal.png) |
| Mechanism, operating costs | [Vertical](mechanism-vertical.png) | [Horizontal](mechanism-horizontal.png) |
| Closing, costs and demand | [Vertical](closing-vertical.png) | [Horizontal](closing-horizontal.png) |

All six passed exact PNG dimensions, text bounds and wrap checks, required element safe areas, and image/SVG reference checks in Chrome 157.0.8103.79. The [render evidence](render-evidence.json) records 66 text block checks across the six frames. All five authored text/background contrast pairs cleared 4.5:1, with a minimum of 7.27:1. The E05 fixture also passed a shared-renderer regression in a temporary folder. Visual inspection checked the reading order, composition, caption placement and repeated visual tokens. Static preview evidence is available for one topic. Native caption review, multi-topic reuse, final player safe areas, and motion remain separate gates.

## P012 narrated shot techniques

Source: [P012.1 preview](../../E10/p012.1/README.md), finalized in [P012.2](../../E10/p012.2/README.md). The tree-cooling video tested these techniques once, in Hindi, portrait only. They are candidates until human visual and motion review approves them.

### General techniques (reusable for any topic)

- **One shot per spoken idea.** Give each narration phrase its own framing: wide context, close-up mechanism, then wide consequence. Cut at the midpoint of the measured pause between phrases. Never cut inside a phrase.
- **Cue offsets from phrase starts.** Anchor each reveal to a phrase start plus an offset. Visuals may lead a keyword slightly, and each visual should match its own phrase. Validate cues automatically: each object is hidden just before its cue and visible after it. Treat the timings as provisional until a human aligns them.
- **Layered paper plates.** Build a shot from four full-frame plates: sky or backdrop, ground, subject, and a sparse foreground. Overscan back plates by 12% so camera moves never expose an edge. Cutouts inside a plate keep the small paper drop shadow. Plates themselves are flat. Add a single grain overlay and a soft inner vignette over the whole stage.
- **Camera with parallax.** Put one camera wrapper per shot inside a clipped, rounded stage. Back layers move at 0.45× and 0.7× of the camera, the foreground at 1.2×. Label and caption checks use the clipped stage, so art may crop at the frame edge but labels may not.
- **Motivated transitions.** Continue a motion through the cut, never a generic wipe:
  - Push into a subject and dissolve through a tile of its own texture.
  - Match the rising direction with a printed sheet that previews the next setting. Never use a blank sheet.
  - Keep each transition within ±0.25 s of the cut.
- **Clip reveals and ambient motion.** Draw rays, flows and fills with directional inset clips: diagonal, up or sideways. Add low-amplitude sway, bob or flicker computed from the frame time. Never use randomness at render time; seed any variation.
- **Symbolic invisible processes.** Show gases and other invisible quantities as sparse labelled symbols that disperse and fade. Never show them as clouds or droplets unless that is what forms. Give small symbols a light halo and a dark outline so they stay legible on mid-tone backgrounds at 540 px wide.
- **Headline and captions.** Show the question only as a short opening tag that fades before the first cut. Do not keep a persistent headline. Captions sit on a fixed-height cream paper card in ink, 42 px Nirmala UI semibold, line height 1.5, with a per-shot accent bar. Animate captions in place with opacity and scale; any translation can cross the safe area. Hold each caption through the pause until the next phrase.
- **Qualitative indicators.** Unlabelled gauges, such as thermometers, may show a direction of change only. Add values only with a source.

### Tree-specific artwork (not part of the style)

Generated canopies, leaves, grass and the leaf-tile pattern. The stomata magnifier and water-molecule symbol. Sun rays and the shade pool. The street, building, bench, heat shimmer, cool-air currents and thermometers. The printed sky wipe sheet. The Hindi labels «धूप», «छाया», «पानी», «जलवाष्प (अदृश्य)», «गर्म हवा» and «ठंडी हवा». These live in [`shots.js`](../../E10/p012.2/shots.js) as topic content. The shot adapter in the same file is reusable, but it has not yet been separated into a shared module.
