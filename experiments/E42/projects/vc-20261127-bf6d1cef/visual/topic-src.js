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

  // ---- section inset (true side section, schematic, not to scale): pan base on glass, coil turns, ferrite; field, eddies, heat
  const SY = {top: VH * .035, glass: VH * .158, base: VH * .14, coil: VH * .19, fer: VH * .218, bot: VH * .27};
  const secArt = () => `<rect x="40" y="${f(SY.top)}" width="920" height="${f(SY.bot - SY.top)}" rx="26" fill="#0b1018" fill-opacity=".86" stroke="#3a4a63" stroke-width="3"/>` +
    `<path d="M150 ${f(SY.base - 150)}Q158 ${f(SY.base - 10)} 200 ${f(SY.base)}H800Q842 ${f(SY.base - 10)} 850 ${f(SY.base - 150)}" fill="none" stroke="#b8c0ca" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="190" y="${f(SY.base)}" width="620" height="${f(SY.glass - SY.base)}" fill="#9aa3ad"/>` +
    `<rect x="80" y="${f(SY.glass)}" width="840" height="20" rx="4" fill="#1d2430" stroke="#566476" stroke-width="2"/>` +
    [...Array(12).keys()].flatMap(k => [500 - 34 - k * 21, 500 + 34 + k * 21]).map(x => `<circle cx="${f(x)}" cy="${f(SY.coil)}" r="8.5" fill="#c8733f" stroke="#7a3d1c" stroke-width="2"/>`).join('') +
    `<rect x="210" y="${f(SY.fer)}" width="260" height="13" rx="3" fill="#2a2d33"/><rect x="530" y="${f(SY.fer)}" width="260" height="13" rx="3" fill="#2a2d33"/>`;
  // one flux loop: up through the glass into the pan base, along the base, down outside the coil, back through the ferrite
  const loopPath = (xi, xo, s) => { const X = x => 500 + s * (x - 500), yb = SY.fer + 6, yt = (SY.base + SY.glass) / 2, r = 16, d = s * r;
    return `M${f(X(xi))} ${f(yb - r)}V${f(yt + r)}Q${f(X(xi))} ${f(yt)} ${f(X(xi) + d)} ${f(yt)}H${f(X(xo) - d)}Q${f(X(xo))} ${f(yt)} ${f(X(xo))} ${f(yt + r)}` +
      `V${f(yb - r)}Q${f(X(xo))} ${f(yb)} ${f(X(xo) - d)} ${f(yb)}H${f(X(xi) + d)}Q${f(X(xi))} ${f(yb)} ${f(X(xi))} ${f(yb - r)}`; };
  const secFieldArt = () => [0, 1, 2].flatMap(i => [1, -1].map(s => `<path d="${loopPath(507 + 8 * i, 792 + 26 * i, s)}" pathLength="1" fill="none" stroke="${FIELD}" stroke-width="${4 - i * .8}" stroke-linejoin="round" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))"/>` +
      `<path d="M${f(500 + s * (507 + 8 * i - 500) - 9)} ${f(SY.coil - 4)}l9 -16l9 16Z" fill="${FIELD}"/>`)).join('');
  const secEddyArt = () => [...Array(10).keys()].map(k => { const x = 230 + k * 60, y = (SY.base + SY.glass) / 2;
    return `<circle cx="${x}" cy="${f(y)}" r="9" fill="#2a1408" stroke="${HOT}" stroke-width="3"/>` + (k % 2 ? `<circle cx="${x}" cy="${f(y)}" r="3" fill="${HOT}"/>` : `<path d="M${x - 5} ${f(y - 5)}l10 10M${x + 5} ${f(y - 5)}l-10 10" stroke="${HOT}" stroke-width="3"/>`); }).join('');
  const secHeatArt = () => `<defs><linearGradient id="hb-hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="${HOT}"/></linearGradient></defs>` +
    `<rect x="190" y="${f(SY.base)}" width="620" height="${f(SY.glass - SY.base)}" fill="url(#hb-hg)" opacity=".9"/>`;
  const secGlassWarmArt = () => `<defs><linearGradient id="hb-gw" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></linearGradient></defs>` +
    `<rect x="190" y="${f(SY.glass)}" width="620" height="20" fill="url(#hb-gw)"/>`;
  // 3D view: upward flux arrows rising through the glass into the pan base, placed on the projected base ellipse
  const fluxArt = () => { const ring = G.panBase, n = ring.length - 1, c = pt(G.panBaseCentre);
    return [.04, .3, .5, .7, .96].map(u => { const [x, y] = pt(ring[Math.round(n * (.5 + (u - .5) * .9) / 2 + n / 4)] ?? ring[0]); const X = c[0] + (x - c[0]) * .85, Y = c[1] + (y - c[1]) * .85;
      return `<path d="M${f(X)} ${f(Y + 70)}V${f(Y - 30)}" stroke="${FIELD}" stroke-width="5" stroke-linecap="round"/><path d="M${f(X - 11)} ${f(Y - 18)}L${f(X)} ${f(Y - 38)}L${f(X + 11)} ${f(Y - 18)}" fill="none" stroke="${FIELD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`; }).join(''); };

  globalThis.techTopic = {
    shots: [{id: 'hook', scene: 'w-hob', accent: COPPER}, {id: 'coil', scene: 'w-hob', accent: COPPER}, {id: 'field', scene: 'w-hob', accent: FIELD},
      {id: 'eddy', scene: 'w-hob', accent: HOT}, {id: 'payoff', scene: 'w-hob', accent: HOT}],
    css: K.css + ' #l-coil .piece-label, #l-glass .piece-label, #l-eddy .piece-label, #l-here .piece-label, #l-notglass .piece-label, #l-base .piece-label, #l-heatnote .piece-label { font-size:42px }',
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}, hook: {text: 'మంట లేదు. వేడి ఎలా?', highlight: 'వేడి', until: 2.4}},
    symbols: () => { const vb = `0 0 ${VW} ${VH}`;
      return [sym('hb-base', vb, A.raster(V.base, VW, VH)), sym('hb-under', vb, A.raster(V.under, VW, VH)), sym('hb-hot', vb, A.raster(V.hot, VW, VH)),
        sym('hb-coil', vb, coilArt()), sym('hb-ac1', vb, acArt(1)), sym('hb-ac2', vb, acArt(-1)), sym('hb-field', vb, secFieldArt()), sym('hb-sec', vb, secArt()), sym('hb-seceddy', vb, secEddyArt()), sym('hb-secheat', vb, secHeatArt()), sym('hb-glasswarm', vb, secGlassWarmArt()), sym('hb-flux', vb, fluxArt()), sym('hb-eddy', vb, eddyArt()), sym('hb-shimmer', vb, shimmerArt())].join(''); },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id), end = S('payoff').end;
      const label = (id, [x, y], w, text, style, extra = {}) => P(id, null, x * 100, y * 100, w, 5, {label: text, labelStyle: style, ...extra});
      const L = 3, pb = G.panBox, front = G.glassFront;
      const objs = [plate('o-base', 'hb-base', L, 'exact'), plate('o-under', 'hb-under', L, 'exact'), plate('o-hot', 'hb-hot', L, 'exact'),
        plate('o-coilglow', 'hb-coil', L, 'exact'), plate('o-ac', 'hb-ac1', L, 'exact'), plate('o-ac2', 'hb-ac2', L, 'exact'), plate('o-eddy', 'hb-eddy', L, 'exact'), plate('o-shimmer', 'hb-shimmer', L, 'exact'), plate('o-flux', 'hb-flux', L, 'exact'),
        plate('o-sec', 'hb-sec', L, 'exact'), plate('o-field', 'hb-field', L, 'exact'), plate('o-seceddy', 'hb-seceddy', L, 'exact'), plate('o-secheat', 'hb-secheat', L, 'exact'), plate('o-glasswarm', 'hb-glasswarm', L, 'exact'),
        label('l-base', [.5, .1], 50, 'పాన్ అడుగు', 'callout', {accent: '#b8c0ca'}), label('l-heatnote', [.5, .245], 72, 'రంగు: వేడికి సంకేతం మాత్రమే', 'callout', {accent: HOT}),
        label('l-coil', [.5, .66], 50, T.coil, 'callout', {accent: COPPER}), label('l-glass', [.3, .245], 30, T.glass, 'callout', {accent: '#9fb3d6'}),
        label('l-eddy', [.5, Math.min(.74, front[1] + .03)], 60, T.eddy, 'chip', {accent: '#c2410c'}), label('l-here', [.5, .1], 50, T.here, 'chip', {accent: '#c2410c'}),
        label('l-notglass', [.5, Math.min(.74, front[1] + .03)], 60, T.notglass, 'callout', {accent: '#9fb3d6'})];
      const fade = (id, at, dur = .6, off) => track(id, [key(0, [0, 0, 0, 1, 0]), key(at, [0, 0, 0, 1, 0]), key(at + dur, N, 'out'), ...(off !== undefined ? [key(off, N), key(off + .4, [0, 0, 0, 1, 0])] : [])]);
      fade('o-shimmer', cue('heat'), .6, S('hook').end - .2); motion.speechCue('heat', 'o-shimmer');
      fade('o-under', cue('under'), .8, cue('hot') - .2); motion.speechCue('under', 'o-under');
      kit.trace('o-coilglow', 'coil', 1.0, S('field').end); kit.label('l-coil', cue('coil') + .5, S('coil').end - .2);
      const flips = [key(0, [0, 0, 0, 1, 0]), key(cue('ac'), [0, 0, 0, 1, 0], 'hold')], flips2 = [key(0, [0, 0, 0, 1, 0])];      // current reverses every 0.3 s
      for (let k = 0; cue('ac') + k * .3 < S('coil').end; k++) { const t = cue('ac') + k * .3; flips.push(key(t, [0, 0, 0, 1, k % 2 ? 0 : 1], 'hold')); flips2.push(key(t, [0, 0, 0, 1, k % 2 ? 1 : 0], 'hold')); }
      flips.push(key(S('coil').end, [0, 0, 0, 1, 0], 'hold')); flips2.push(key(S('coil').end, [0, 0, 0, 1, 0], 'hold'));
      track('o-ac', flips); track('o-ac2', flips2); motion.speechCue('ac', 'o-ac');
      fade('o-sec', S('field').start + .1, .6); kit.label('l-base', S('field').start + .5, S('eddy').end - .3);
      kit.trace('o-field', 'field', 1.2);
      track('o-field', [key(0, [0, 0, 0, 1, 0]), key(cue('field'), [0, 0, 0, 1, 0]), key(cue('field') + .05, N), key(S('eddy').start + .4, N), key(S('eddy').start + .9, [0, 0, 0, 1, 0])]);   // arrowheads leave with the loops
      kit.label('l-glass', 'glass', S('field').end - .2);
      fade('o-flux', cue('field') + .2, .5, S('eddy').start + .3);
      fade('o-seceddy', cue('eddy'), .5); fade('o-secheat', cue('hot'), .9); fade('o-glasswarm', S('payoff').start + .6, 1.2); kit.label('l-heatnote', cue('hot') + .4, S('payoff').start - .2);
      kit.trace('o-eddy', 'eddy', 1.0); kit.label('l-eddy', cue('eddy') + .6, S('eddy').end - .2);
      fade('o-hot', cue('hot'), .9); motion.speechCue('hot', 'o-hot');
      kit.label('l-here', 'here'); kit.label('l-notglass', 'notglass');
      const [cx, cy] = [G.panBaseCentre[0] - .5, G.panBaseCentre[1] - .5];
      const cameras = {hook: kit.cameraTravel('hook', [[S('hook').start, cx, cy, 1.2], [S('hook').end, cx, cy, 1.23]]),
        coil: kit.cameraTravel('coil', [[S('coil').start, cx, cy, 1.23], [S('coil').end, cx * .6, cy * .6, 1.18]]),
        field: kit.cameraTravel('field', [[S('field').start, 0, 0, 1.0], [S('field').end, 0, 0, 1.0]]),
        eddy: kit.cameraTravel('eddy', [[S('eddy').start, 0, 0, 1.0], [S('eddy').end, 0, 0, 1.0]]),
        payoff: kit.cameraTravel('payoff', [[S('payoff').start, 0, 0, 1.0], [end, 0, 0, 1.0]])};
      const box = b => [b[0], b[1], b[2] - b[0], b[3] - b[1]];
      globalThis.techTopic.composition = {hook: {regions: [{id: 'o-base', box: box(pb)}]}, field: {regions: [{id: 'o-base', box: box(pb)}, {id: 'o-sec', box: [.19, .14, .62, .018]}], annotations: [{id: 'l-glass', target: 'o-sec'}]},
        eddy: {regions: [{id: 'o-hot', box: box(pb)}, {id: 'o-sec', box: [.19, .14, .62, .018]}], annotations: [{id: 'l-eddy', target: 'o-hot'}]}};
      return {scenes: {'w-hob': {objects: objs}}, cameras, checks: {keyframes: [['hook', cue('heat') + .55], ['field', cue('glass') + .9], ['eddy', cue('hot') + .9]]}};
    },
  };
})();
