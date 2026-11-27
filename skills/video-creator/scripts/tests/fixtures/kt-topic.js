// P017.5 compact Kinetic Typography fixture (test only), language-independent: each shot's words are the whitespace
// tokens of its narration phrase (never split further), each revealed on its own resolved-plan cue (one cue per word,
// in order), sized by measuring the shaped text, composed for the stage's aspect. Shot 2 inverts the palette and its
// last word lands as the emphasis. The same code renders English and Telugu.
(() => {
  const {sym} = globalThis.techShotArt;
  const K = globalThis.kineticKit;
  const PAL = [{field: '#111214', ink: '#f4f1ea', accent: '#ffd400'}, {field: '#ffd400', ink: '#111214', accent: '#e8361e'}];
  let VW = 1000, VH = 1600, layoutCss = '', lines = [];
  const plan = ctx => ctx.plan ?? (() => { throw new Error('kinetic fixture needs --plan'); })();

  // Words of shot i = tokens of narration phrase i, paired in order with the shot's plan cues.
  const compose = ctx => {
    VH = Math.round(1000 / ctx.aspect);
    const stage = document.querySelector('.story-stage').getBoundingClientRect(), Wpx = stage.width, Hpx = stage.height;
    const words = K.narrationWords(ctx);
    lines = plan(ctx).shots.map((s, i) => {
      const toks = words.filter(w => w.phrase === i);
      if (toks.length !== s.cues.length) throw new Error(`shot ${s.id}: ${toks.length} words but ${s.cues.length} cues (one cue per word)`);
      const last = toks.length - 1;
      // P018.6: in full-bleed the words live in the text-safe band above the captions; framed keeps the original layout
      const fb = ctx.presentation === 'full-bleed', sf = ctx.safe, bandTop = fb ? Hpx * sf.top / 100 : 0, band = fb ? Hpx * (sf.captionTop - sf.top) / 100 : Hpx, wide = fb ? Wpx * (sf.right - sf.left) / 100 : Wpx;
      let sizes = toks.map((w, j) => K.fit(K.word(ctx, w.text), wide * (j === last ? .78 : .84), {max: j === last ? 230 : 140}));
      const total = sizes.reduce((a, z) => a + z * 1.5, 0), room = fb ? band * .9 : Hpx * .86;
      if (total > room) sizes = sizes.map(z => Math.floor(z * room / total));
      let y = bandTop + (band - sizes.reduce((a, z) => a + z * 1.5, 0)) / 2;
      return toks.map((w, j) => { const cy = y + sizes[j] * .75; y += sizes[j] * 1.5;
        return {id: plan(ctx).cues[s.cues[j]].object, cue: s.cues[j], text: w.text, size: sizes[j], x: 50 + (j % 2 ? 4 : -4) * (j === last ? 0 : 1), y: cy / Hpx * 100, last: j === last}; });
    });
    layoutCss = lines.flatMap((ws, i) => ws.map(w => `#${w.id} .piece-label { font-size:${w.size}px; --kt-ink:${PAL[i].ink}; --kt-accent:${PAL[i].accent}; --kt-field:${PAL[i].field} }`)).join('\n');
  };

  globalThis.kineticTopic = {
    get shots() { return [{id: 'one', scene: 'kt-one', accent: PAL[0].accent, transition: {type: 'shutter'}}, {id: 'two', scene: 'kt-two', accent: PAL[1].accent}]; },
    get css() { return K.css + layoutCss; },
    symbols: ctx => { compose(ctx); return [sym('kt-f0', `0 0 ${VW} ${VH}`, K.art.field(VW, VH, {color: PAL[0].field, mark: '1'})),
      sym('kt-f1', `0 0 ${VW} ${VH}`, K.art.field(VW, VH, {color: PAL[1].field, mark: '2', markColor: '#11121418'}))].join(''); },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id);
      const scenes = {};
      ['kt-one', 'kt-two'].forEach((scene, i) => {
        scenes[scene] = {objects: [plate(`f-${i}`, `kt-f${i}`, 0), ...lines[i].map(w => P(w.id, null, w.x, w.y, 96, 3, {label: w.text, labelStyle: w.last ? 'accent' : 'solid'}))]};
        lines[i].forEach((w, j) => kit.say(w.id, w.cue, w.last ? 'slam' : ['rise', 'wipe', 'drop'][j % 3], w.last ? .4 : .3));
      });
      const two = lines[1];
      kit.emphasize(two[two.length - 2].id, ctx.cue(two.at(-1).cue) + .25);   // the word before the last flips to the accent as the last lands
      const cam = (id, startView, views) => { const keys = kit.planCamera(id, views), s = S(id); return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0)]; };
      const cameras = {one: cam('one', [0, 0, 1.0], [[0, 0, 1.05, 'smooth']]), two: cam('two', [0, 0, 1.06], [[0, 0, 1.0, 'smooth']])};
      const end = s => S(s).end;
      return {scenes, cameras, checks: {keyframes: [['one-mid', ctx.cue(lines[0][1].cue) + .4], ['one-full', end('one') - .45], ['shutter', end('one') + .05], ['two-full', end('two') - .05]]}};
    },
  };
})();
