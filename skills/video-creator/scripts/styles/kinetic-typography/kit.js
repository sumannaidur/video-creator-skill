// Kinetic Typography kit (browser script, loaded after the shared shot core by backend.mjs). Style implementation #6 (P017.5).
// Text is the picture: whole narration words, set as real shaped text (Indic clusters and conjuncts are shaped by the
// browser and never split), revealed on their resolved speech cues with masks, slams, wipes and drops, emphasised by
// colour and scale, swapped and pushed out. Registers the `shutter` transition via globalThis.vcShotStyle.
// Rules enforced here:
//  - word text must be a whitespace-delimited token of the narration (kit.word refuses anything else);
//  - a word's reveal time must be a resolved-plan cue id (kit.motion.say refuses typed seconds), so no timing is invented;
//  - words are never split into letters or graphemes, and no letter-spacing is applied (it breaks Indic shaping).
(() => {
  const fail = m => { throw new Error('kineticKit: ' + m); };
  const num = (x, what) => (typeof x === 'number' && Number.isFinite(x)) ? x : fail(`${what} must be a number`);
  const FONT = '"Segoe UI Black", "Arial Black", "Nirmala UI", "Segoe UI", sans-serif';
  const PUNCT = /^[\s"'“”‘’«»(\[{]+|[\s"'“”‘’«»)\]},.;:!?।॥]+$/gu;

  // Whitespace tokens of the narration phrases (the only source of displayable words), with trailing punctuation removed
  // for display. Compound words (hyphens, joiners) stay whole.
  const narrationWords = ctx => ctx.phrases.flatMap((p, i) => p.text.split(/\s+/).filter(Boolean).map(t => ({phrase: i, token: t, text: t.replace(PUNCT, '')})));
  const word = (ctx, text) => {
    const w = narrationWords(ctx).find(x => x.text === text || x.token === text);
    if (!w) fail(`"${text}" is not a word of the narration; kinetic words must come from the narration text`);
    return w.text;
  };
  // Largest font size (px, ≤ max) at which `text` fits `maxPx`, measured with the browser's own shaping.
  const ctx2d = document.createElement('canvas').getContext('2d');
  const fit = (text, maxPx, {max = 220, min = 36, weight = 900, family = FONT} = {}) => {
    ctx2d.font = `${weight} 100px ${family}`;
    const w = ctx2d.measureText(text).width || 1;
    return Math.max(min, Math.min(max, Math.floor(100 * maxPx / w)));
  };
  // A plain colour field with an optional giant outlined index numeral or shape behind the type.
  const field = (w, h, {color = '#111214', mark = '', markColor = '#ffffff14'} = {}) => `<rect width="${w}" height="${h}" fill="${color}"/>` +
    (mark ? `<text x="${w * .94}" y="${h * .97}" text-anchor="end" font-family='${FONT}' font-weight="900" font-size="${Math.min(w, h) * .7}" fill="none" stroke="${markColor}" stroke-width="4">${mark}</text>` : '');

  const LABEL_STYLES = ['solid', 'accent', 'outline', 'block'];
  const css = `
    .piece-label { font-family:${FONT}; font-weight:900; line-height:1.5; color:color-mix(in srgb, var(--kt-accent) calc(var(--glow, 0) * 100%), var(--kt-ink)); white-space:nowrap }
    .label-accent .piece-label { color:var(--label-accent, var(--kt-accent)) }
    .label-outline .piece-label { color:transparent; -webkit-text-stroke:3px var(--label-accent, var(--kt-ink)) }
    .label-block .piece-label { color:var(--kt-field); background:var(--label-accent, var(--kt-accent)); padding:0 .18em; border-radius:.08em }
  `;

  // ---------- transition: shutter — horizontal bands slice across like lines of type, covering the cut ----------
  const BANDS = 6;
  const setup = (stage) => {
    const o = document.createElement('div');
    o.className = 'kt-shutter';
    o.innerHTML = Array.from({length: BANDS}, (_, i) => `<i style="top:${(i * 100 / BANDS).toFixed(3)}%"></i>`).join('');
    stage.append(o);
    return {shutter: o};
  };
  const shutter = ({tr, k, before, overlays}) => {
    const o = overlays?.shutter;
    if (!o) return;
    if (!tr) { o.style.visibility = 'hidden'; return; }
    o.style.visibility = 'visible';
    [...o.children].forEach((b, i) => {
      const dir = i % 2 ? 1 : -1, lag = i / BANDS * .35, p = Math.max(0, Math.min(1, (k - lag) / .65));
      b.style.transform = `translateX(${((before ? dir : -dir) * (1 - p) * 102).toFixed(2)}%)`;
    });
  };
  globalThis.vcShotStyle = {labelStyles: LABEL_STYLES, setup, transitions: {shutter: {defaults: {lead: .4, tail: .35}, needsSymbol: false, render: shutter}}};

  function motion(ctx) {
    const {key, N, track, reveal, glow} = ctx.motion;
    const cueTime = (cueId, id) => typeof cueId === 'string' ? ctx.motion.speechCue(cueId, id) : fail('say() needs a resolved-plan cue id: word timings are never typed by hand');
    const at = x => typeof x === 'string' ? ctx.cue(x) : num(x, 'time');
    const EFFECTS = {
      // masked rise: the word slides up into view inside its own line box
      rise: (id, t, d) => { track(id, [key(t, [0, .035, 0, 1, 0]), key(t + .04, [0, .035, 0, 1, 1]), key(t + d, N, 'out')]); reveal(id, t, t + d, 'up'); },
      // slam: arrives big and lands with weight
      // (invisible while larger than 1.12×, so a word fitted to ≤ 88% of the stage never overflows it while landing)
      slam: (id, t, d) => track(id, [key(t, [0, 0, 0, 1.6, 0]), key(t + d * .3, [0, 0, 0, 1.12, 0], 'out'), key(t + d * .6, [0, 0, 0, .97, 1], 'out'), key(t + d, N, 'smooth')]),
      // wipe: revealed along the reading direction
      wipe: (id, t, d) => { track(id, [key(t, [0, 0, 0, 1, 0]), key(t + .04, N)]); reveal(id, t, t + d, 'rightward'); },
      // drop: falls in from above and settles
      drop: (id, t, d) => track(id, [key(t, [0, -.06, 0, 1, 0]), key(t + d, N, 'out')]),
      // P023.5 directional entries, masked along the direction of travel (whole words only; shaping untouched)
      'from-left': (id, t, d) => { track(id, [key(t, [-.08, 0, 0, 1, 0]), key(t + .03, [-.08, 0, 0, 1, 1]), key(t + d, N, 'outQuart')]); reveal(id, t, t + d * .8, 'rightward'); },
      'from-right': (id, t, d) => { track(id, [key(t, [.08, 0, 0, 1, 0]), key(t + .03, [.08, 0, 0, 1, 1]), key(t + d, N, 'outQuart')]); reveal(id, t, t + d * .8, 'leftward'); },
      // stamp: lands with weight from slightly small and settles (never larger than 1.03x, so fitted words stay inside)
      stamp: (id, t, d) => track(id, [key(t, [0, 0, 0, .72, 0]), key(t + d * .35, [0, 0, 0, .95, 1], 'outQuart'), key(t + d, N, 'settle')]),
    };
    return {
      // Reveal a word on its own speech cue (required) with an effect.
      say: (id, cueId, effect = 'rise', dur = .32) => { const t = cueTime(cueId, id); (EFFECTS[effect] ?? fail(`unknown effect ${effect}`))(id, t, dur); return t; },
      // Emphasis: colour flips to the accent (via --glow) and the word pulses; `when` is a cue id or seconds.
      emphasize: (id, when, hold = 99) => { const t = at(when); glow(id, [key(t, [0]), key(t + .2, [1], 'out'), key(t + .2 + hold, [1])]); return t; },
      // Push a word out (up and away), e.g. when the next line takes its place.
      exit: (id, when, dur = .3, keys = []) => { const t = at(when); track(id, [...keys, key(t, N), key(t + dur, [0, -.04, 0, .9, 0], 'in')]); return t; },
      // Shape interaction: a shape object crosses [fromX → toX] (stage fractions) around a word's cue while the word is
      // revealed in the same direction, as if the shape uncovers it. The word keeps its own speech cue.
      sweep: (shapeId, wordId, cueId, {fromX = -.7, toX = .7, lead = .25, dur = .7} = {}) => {
        const t = cueTime(cueId, wordId), dir = toX > fromX ? 'rightward' : 'leftward';
        track(shapeId, [key(t - lead, [fromX, 0, 0, 1, 1]), key(t - lead + dur, [toX, 0, 0, 1, 1], 'inOut')]);
        track(wordId, [key(t, [0, 0, 0, 1, 0]), key(t + .03, N)]); reveal(wordId, t, t + dur * .55, dir); return t;
      },
      // Typographic transformation: `from` gives way as `to` is said (to's own cue).
      swap: (from, to, cueId, effect = 'slam', dur = .32) => {
        const t = cueTime(cueId, to);
        track(from, [key(t - .01, N), key(t + dur * .7, [0, .02, 0, .7, 0], 'in')]);
        (EFFECTS[effect] ?? fail(`unknown effect ${effect}`))(to, t, dur); return t;
      },
      planCamera: (shotId, views) => {
        const shot = ctx.plan?.shots.find(s => s.id === shotId) ?? fail(`planCamera: shot ${shotId} is not in the resolved plan (--plan)`);
        const moments = shot.camera ?? [];
        if (!Array.isArray(views) || views.length !== moments.length) fail(`planCamera: shot ${shotId} has ${moments.length} planned camera keys; give exactly one view for each`);
        const keys = moments.map((m, i) => key(m.seconds, views[i].slice(0, 3), views[i][3] ?? 'smooth'));
        return !keys.length || keys[0][0] > shot.start.seconds + 1e-9 ? [key(shot.start.seconds, keys[0]?.[1] ?? [0, 0, 1]), ...keys] : keys;
      },
    };
  }

  // Simple meaningful shapes for type to interact with (Bass-style): a disc and a slab, as symbol markup (viewBox 0 0 200 200 / w h).
  const disc = (color, {ring = null} = {}) => `<circle cx="100" cy="100" r="98" fill="${color}"/>` + (ring ? `<circle cx="100" cy="100" r="92" fill="none" stroke="${ring}" stroke-width="6"/>` : '');
  const slab = (w, h, color) => `<rect width="${w}" height="${h}" fill="${color}"/>`;
  globalThis.kineticKit = {art: {field, disc, slab}, word, narrationWords, fit, FONT, css, LABEL_STYLES, motion};
})();
