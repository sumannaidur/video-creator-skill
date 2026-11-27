// E25 / P023.5 Kinetic Typography study (unseen topic, te-IN, full-bleed): "Why does the moon change shape?" Simplified;
// Telugu wording needs native review. Every word is a whole narration token placed on its own speech cue (never split).
// Shapes carry meaning: a dark moon disc (it has no light of its own), a sunlight slab that sweeps across and uncovers
// the words of the sunlight line, then a shadow disc sliding over the lit moon to make phases as the last line lands.
(() => {
  const {sym} = globalThis.techShotArt;
  const K = globalThis.kineticKit;
  const PAL = [{field: '#0e1020', ink: '#eef0ff', accent: '#9fb3ff'}, {field: '#13151f', ink: '#fff7e0', accent: '#ffc83d'}, {field: '#0b0c16', ink: '#eef0ff', accent: '#ffc83d'}];
  let VW = 1000, VH = 1778, layoutCss = '', lines = [];
  // per line: [effect per word], x offset pattern (expressive staggered layout), emphasis word index
  const CHOREO = [{fx: ['rise', 'from-left', 'stamp'], x: [-6, 6, 0], key: 2}, {fx: ['sweep', 'sweep', 'from-left', 'from-right', 'stamp'], x: [-8, 8, -10, 6, 0], key: 4},
    {fx: ['rise', 'from-right', 'from-left', 'rise', 'stamp', 'drop'], x: [-8, 8, -6, 6, 0, 0], key: 4}];
  const compose = ctx => {
    VH = Math.round(1000 / ctx.aspect);
    const st = document.querySelector('.story-stage').getBoundingClientRect(), Wpx = st.width, Hpx = st.height, sf = ctx.safe;
    const words = K.narrationWords(ctx), plan = ctx.plan;
    lines = plan.shots.map((s, i) => {
      const toks = words.filter(w => w.phrase === i), c = CHOREO[i];
      if (toks.length !== s.cues.length) throw new Error(`shot ${s.id}: one cue per word required`);
      const top = Hpx * (sf.top / 100 + .27), band = Hpx * (sf.captionTop - sf.top) / 100 - Hpx * .29, wide = Wpx * (sf.right - sf.left) / 100;
      let sizes = toks.map((w, j) => K.fit(K.word(ctx, w.text), wide * (j === c.key ? .8 : .62), {max: j === c.key ? 170 : 104, min: 44}));
      const total = sizes.reduce((a, z) => a + z * 1.62, 0); if (total > band) sizes = sizes.map(z => Math.floor(z * band / total));
      let y = top + (band - sizes.reduce((a, z) => a + z * 1.62, 0)) / 2;
      return toks.map((w, j) => { const cy = y + sizes[j] * .72; y += sizes[j] * 1.62;
        return {id: plan.cues[s.cues[j]].object, cue: s.cues[j], text: w.text, size: sizes[j], x: 50 + c.x[j], y: cy / Hpx * 100, fx: c.fx[j], key: j === c.key}; });
    });
    layoutCss = lines.flatMap((ws, i) => ws.map(w => `#${w.id} .piece-label { font-size:${w.size}px; --kt-ink:${PAL[i].ink}; --kt-accent:${PAL[i].accent}; --kt-field:${PAL[i].field} }`)).join('\n');
  };

  globalThis.kineticTopic = {
    get shots() { return [{id: 'dark', scene: 'mk-1', accent: PAL[0].accent, transition: {type: 'shutter'}}, {id: 'sun', scene: 'mk-2', accent: PAL[1].accent}, {id: 'phases', scene: 'mk-3', accent: PAL[2].accent}]; },
    get css() { return K.css + layoutCss; },
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: ctx => { compose(ctx); const vb = `0 0 ${VW} ${VH}`;
      return [sym('mk-f0', vb, K.art.field(VW, VH, {color: PAL[0].field})), sym('mk-f1', vb, K.art.field(VW, VH, {color: PAL[1].field})), sym('mk-f2', vb, K.art.field(VW, VH, {color: PAL[2].field})),
        sym('mk-moon-dark', '0 0 200 200', K.art.disc('#2a2e48', {ring: '#3a3f63'})), sym('mk-moon', '0 0 200 200', K.art.disc('#eef0ff')),
        sym('mk-half', '0 0 200 200', `<path d="M100 2A98 98 0 0 0 100 198Z" fill="#ffe9a8"/><path d="M100 2A98 98 0 0 1 100 198Z" fill="#2a2e48"/>`),
        sym('mk-shadow', '0 0 200 200', K.art.disc(PAL[2].field)), sym('mk-slab', `0 0 360 ${VH}`, K.art.slab(360, VH, '#ffc83d'))].join(''); },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, glow} = motion;
      const kit = K.motion(ctx), S = ctx.shot;
      const wordObjs = i => lines[i].map(w => P(w.id, null, w.x, w.y, 96, 4, {label: w.text, labelStyle: w.key ? 'accent' : 'solid'}));
      const moonY = ctx.safe.top + 14, M_W = 34;
      const scenes = {
        'mk-1': {objects: [plate('f-0', 'mk-f0', 0), P('o-moon1', 'mk-moon-dark', 50, moonY, M_W, 2, {flat: true}), ...wordObjs(0)]},
        'mk-2': {objects: [plate('f-1', 'mk-f1', 0), P('o-slab', 'mk-slab', 50, 50, 36, 1, {flat: true}), P('o-half', 'mk-half', 50, moonY, M_W, 2, {flat: true}), ...wordObjs(1)]},
        'mk-3': {objects: [plate('f-2', 'mk-f2', 0), P('o-moon3', 'mk-moon', 50, moonY, M_W, 2, {flat: true}), P('o-shadow', 'mk-shadow', 50, moonY, M_W * 1.02, 3, {flat: true}), ...wordObjs(2)]},
      };
      // line 1: the moon sits dark; words arrive on their cues; "does not shine" stamps in
      lines[0].forEach(w => kit.say(w.id, w.cue, w.fx, w.key ? .5 : .34));
      track('o-moon1', [key(S('dark').start, [0, .01, 0, .9, 0]), key(S('dark').start + .6, N, 'settle')]);
      // line 2: a slab of sunlight sweeps across, uncovering the first words; the moon is lit on one side only
      lines[1].forEach((w, j) => w.fx === 'sweep' ? kit.sweep('o-slab', w.id, w.cue, {fromX: -.75 + j * .4, toX: -.35 + j * .4, lead: .2, dur: .55}) : kit.say(w.id, w.cue, w.fx, w.key ? .5 : .34));
      const s2 = S('sun').start, lit = ctx.cue(lines[1][0].cue);
      track('o-slab', [key(s2, [-.75, 0, 0, 1, 1]), key(lit - .2, [-.75, 0, 0, 1, 1]), key(lit + .35, [-.35, 0, 0, 1, 1], 'inOut'), key(ctx.cue(lines[1][1].cue) + .35, [.05, 0, 0, 1, 1], 'inOut'), key(ctx.cue(lines[1][2].cue) + .5, [.8, 0, 0, 1, 0], 'inOut')]);
      track('o-half', [key(s2, [0, 0, 0, 1, .25]), key(lit, [0, 0, 0, 1, .25]), key(lit + .5, N, 'inOut')]);
      // line 3: the shadow slides off the lit moon as the words come (new -> crescent -> gibbous), "phases" stamps in
      lines[2].forEach(w => kit.say(w.id, w.cue, w.fx, w.key ? .5 : .34));
      const s3 = S('phases').start, ph = ctx.cue(lines[2][4].cue);
      track('o-shadow', [key(s3, [0, 0, 0, 1, 1]), key(ctx.cue(lines[2][1].cue), [.0, 0, 0, 1, 1]), key(ph, [.16, 0, 0, 1, 1], 'inOut'), key(S('phases').end, [.3, 0, 0, 1, 1], 'inOut')]);
      kit.emphasize(lines[2][4].id, ph + .3);
      const cameras = {dark: [key(S('dark').start, [0, 0, 1.0]), key(S('dark').end, [0, 0, 1.03], 'inOut')], sun: [key(s2, [0, 0, 1.03]), key(S('sun').end, [0, 0, 1.0], 'inOut')],
        phases: [key(s3, [0, 0, 1.0]), key(S('phases').end, [0, -.01, 1.05], 'inOut')]};
      return {scenes, cameras, checks: {keyframes: [['dark', ctx.cue(lines[0][2].cue) + .7], ['sunlight', ctx.cue(lines[1][4].cue) + .6], ['phases', ph + .7]]}};
    },
  };
})();
