// "How does an induction stove heat only the pan?" (te-IN, Tech Explainer, full-bleed). Rich-artwork technique (P024.16B):
// Blender static layers rendered from the original procedural scene visual/hob_scene.py (no external assets): base (black
// glass-ceramic hob, brushed-steel pan, granite), under (see-through glass: copper coil, ferrite bars, ghosted pan), hot
// (pan base glowing). SVG overlays are drawn from the scene's projected GEOMETRY, so field loops, coil turns and eddy rings sit
// exactly on the rendered geometry. All aligned plates and overlays share one parallax layer (P024 lesson).
// Packed with: python scripts/blender_layers.py pack --layers visual/layers --topic visual/topic-src.js --out visual/topic.js
(() => {
  const {sym, f} = globalThis.techShotArt;
  const K = globalThis.techKit, A = K.art, V = globalThis.vcLayers, G = V.geometry;
  const VW = 1000, VH = Math.round(1000 * V.size[1] / V.size[0]);
  const COPPER = '#ff9a52', FIELD = '#8fb8ff', HOT = '#ff6a2a';
  const pt = ([x, y]) => [x * VW, y * VH];
  const line = (pts, color, w, extra = '') => `<path d="M${pts.map(p => pt(p).map(f).join(' ')).join('L')}" pathLength="1" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))" ${extra}/>`;
  const scaleAbout = (pts, c, k) => pts.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]);
  const T = {coil: 'రాగి చుట్ట', glass: 'గాజు', eddy: 'సుడి కరెంట్లు', here: 'వేడి ఇక్కడే', notglass: 'గాజులో కాదు'};

  const coilArt = () => { const c = G.coilCentre, outer = G.coil;
    return Array.from({length: 7}, (_, k) => line(scaleAbout(outer, c, .2 + k * .8 / 6), COPPER, 3.2, 'opacity=".9"')).join('') +
      line(outer, '#ffd2a8', 2, 'opacity=".9"'); };
  // arrowheads along the front half of the coil, pointing along the current; dir = +1 / -1
  const acArt = dir => { const ring = G.coil, n = ring.length - 1, out = [];
    for (const k of [Math.round(n * .12), Math.round(n * .25), Math.round(n * .38)]) {
      const [x, y] = pt(ring[k]), [x2, y2] = pt(ring[k + dir]), a = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI;
      out.push(`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><path d="M-14 -11L12 0L-14 11Z" fill="#ffe3c4" stroke="${COPPER}" stroke-width="3"/></g>`);
    }
    return out.join(''); };
  const fieldArt = () => G.field.map((p, i) => line(p, FIELD, 3.4 - (i >> 1) * .4, `opacity="${.95 - (i >> 1) * .15}"`)).join('');
  const eddyArt = () => G.eddy.map((p, i) => line(p, HOT, 5 - i, 'opacity=".95"')).join('') +
    G.eddy.map((ring, i) => { const n = ring.length - 1, k = Math.round(n * (.3 + i * .12)), [x, y] = pt(ring[k]), [x2, y2] = pt(ring[k + 1]);
      return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(Math.atan2(y2 - y, x2 - x) * 180 / Math.PI)})"><path d="M-12 -9L10 0L-12 9Z" fill="${HOT}"/></g>`; }).join('');
  const shimmerArt = () => { const [cx, ty] = pt(G.panTop);
    return [-110, -40, 30, 100].map((dx, i) => line(Array.from({length: 9}, (_, k) => [(cx + dx + Math.sin(k * 1.3 + i) * 14) / VW, (ty - 40 - k * 26) / VH]), '#ffd9b8', 4, 'opacity=".55"')).join(''); };

  globalThis.techTopic = {
    shots: [{id: 'hook', scene: 'w-hob', accent: COPPER}, {id: 'coil', scene: 'w-hob', accent: COPPER}, {id: 'field', scene: 'w-hob', accent: FIELD},
      {id: 'eddy', scene: 'w-hob', accent: HOT}, {id: 'payoff', scene: 'w-hob', accent: HOT}],
    css: K.css,
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}, hook: {text: 'మంట లేదు. వేడి ఎలా?', highlight: 'వేడి', until: 2.4}},
    symbols: () => { const vb = `0 0 ${VW} ${VH}`;
      return [sym('hb-base', vb, A.raster(V.base, VW, VH)), sym('hb-under', vb, A.raster(V.under, VW, VH)), sym('hb-hot', vb, A.raster(V.hot, VW, VH)),
        sym('hb-coil', vb, coilArt()), sym('hb-ac1', vb, acArt(1)), sym('hb-ac2', vb, acArt(-1)), sym('hb-field', vb, fieldArt()), sym('hb-eddy', vb, eddyArt()), sym('hb-shimmer', vb, shimmerArt())].join(''); },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id), end = S('payoff').end;
      const label = (id, [x, y], w, text, style, extra = {}) => P(id, null, x * 100, y * 100, w, 5, {label: text, labelStyle: style, ...extra});
      const L = 3, pb = G.panBox, front = G.glassFront;
      const objs = [plate('o-base', 'hb-base', L, 'exact'), plate('o-under', 'hb-under', L, 'exact'), plate('o-hot', 'hb-hot', L, 'exact'),
        plate('o-coilglow', 'hb-coil', L, 'exact'), plate('o-ac', 'hb-ac1', L, 'exact'), plate('o-ac2', 'hb-ac2', L, 'exact'), plate('o-field', 'hb-field', L, 'exact'),
        plate('o-eddy', 'hb-eddy', L, 'exact'), plate('o-shimmer', 'hb-shimmer', L, 'exact'),
        label('l-coil', [.5, Math.min(.74, front[1] + .03)], 44, T.coil, 'callout', {accent: COPPER}), label('l-glass', [.5, Math.min(.74, front[1] + .03)], 26, T.glass, 'callout', {accent: '#9fb3d6'}),
        label('l-eddy', [.5, Math.min(.74, front[1] + .03)], 52, T.eddy, 'chip', {accent: '#c2410c'}), label('l-here', [.5, pb[1] - .07], 48, T.here, 'chip', {accent: '#c2410c'}),
        label('l-notglass', [.5, Math.min(.74, front[1] + .03)], 52, T.notglass, 'callout', {accent: '#9fb3d6'})];
      const fade = (id, at, dur = .6, off) => track(id, [key(0, [0, 0, 0, 1, 0]), key(at, [0, 0, 0, 1, 0]), key(at + dur, N, 'out'), ...(off !== undefined ? [key(off, N), key(off + .4, [0, 0, 0, 1, 0])] : [])]);
      fade('o-shimmer', cue('heat'), .6, S('hook').end - .2); motion.speechCue('heat', 'o-shimmer');
      fade('o-under', cue('under'), .8, cue('hot') - .2); motion.speechCue('under', 'o-under');
      kit.trace('o-coilglow', 'coil', 1.0, S('field').end); kit.label('l-coil', cue('coil') + .5, S('coil').end - .2);
      const flips = [key(0, [0, 0, 0, 1, 0]), key(cue('ac'), [0, 0, 0, 1, 0], 'hold')], flips2 = [key(0, [0, 0, 0, 1, 0])];      // current reverses every 0.3 s
      for (let k = 0; cue('ac') + k * .3 < S('coil').end; k++) { const t = cue('ac') + k * .3; flips.push(key(t, [0, 0, 0, 1, k % 2 ? 0 : 1], 'hold')); flips2.push(key(t, [0, 0, 0, 1, k % 2 ? 1 : 0], 'hold')); }
      flips.push(key(S('coil').end, [0, 0, 0, 1, 0], 'hold')); flips2.push(key(S('coil').end, [0, 0, 0, 1, 0], 'hold'));
      track('o-ac', flips); track('o-ac2', flips2); motion.speechCue('ac', 'o-ac');
      kit.trace('o-field', 'field', 1.2, S('eddy').start + .6); kit.label('l-glass', 'glass', S('field').end - .2);
      kit.trace('o-eddy', 'eddy', 1.0); kit.label('l-eddy', cue('eddy') + .6, S('eddy').end - .2);
      fade('o-hot', cue('hot'), .9); motion.speechCue('hot', 'o-hot');
      kit.label('l-here', 'here'); kit.label('l-notglass', 'notglass');
      const [cx, cy] = [G.panBaseCentre[0] - .5, G.panBaseCentre[1] - .5];
      const cameras = {hook: kit.cameraTravel('hook', [[S('hook').start, 0, 0, 1.0], [S('hook').end, cx * .3, cy * .3, 1.05]]),
        coil: kit.cameraTravel('coil', [[S('coil').start, cx * .3, cy * .3, 1.05], [S('coil').end, cx * .5, cy * .5, 1.1]]),
        field: kit.cameraTravel('field', [[S('field').start, cx * .5, cy * .5, 1.1], [S('field').end, cx * .5, cy * .5, 1.12]]),
        eddy: kit.cameraTravel('eddy', [[S('eddy').start, cx * .5, cy * .5, 1.12], [S('eddy').end, cx * .4, cy * .4, 1.08]]),
        payoff: kit.cameraTravel('payoff', [[S('payoff').start, cx * .4, cy * .4, 1.08], [end, 0, 0, 1.02]])};
      const box = b => [b[0], b[1], b[2] - b[0], b[3] - b[1]];
      globalThis.techTopic.composition = {hook: {regions: [{id: 'o-base', box: box(pb)}]}, field: {regions: [{id: 'o-field', box: box(pb)}]}, eddy: {regions: [{id: 'o-hot', box: box(pb)}], annotations: [{id: 'l-eddy', target: 'o-hot'}]}};
      return {scenes: {'w-hob': {objects: objs}}, cameras, checks: {keyframes: [['hook', cue('heat') + .55], ['field', cue('glass') + .9], ['eddy', cue('hot') + .9]]}};
    },
  };
})();
