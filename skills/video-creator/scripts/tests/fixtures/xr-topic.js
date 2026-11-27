// P017.6 compact X-Ray Explainer fixture (test only): a two-gear box, Telugu labels. A closed housing is seen through
// a travelling X-ray window, then a glass cutaway with hatched section walls; gears are sized from module × teeth and
// mesh at the true 12:24 ratio. Marked illustrative on screen. Every speech moment comes from the resolved plan.
(() => {
  const {sym, f} = globalThis.techShotArt;
  const X = globalThis.xrayKit, {art, COLORS: C} = X;
  const ZA = 12, ZB = 24;
  const T = {parts: 'చక్రాలు', small: `చిన్న చక్రం · ${ZA} పళ్ళు`, big: `పెద్ద చక్రం · ${ZB} పళ్ళు`, slow: 'సగం వేగం', note: 'చిత్రణ మాత్రమే — నిజమైన స్కాన్ కాదు'};
  let VW = 1000, VH = 1600, U = 1, land = false, g = {}, extraCss = '';
  const layout = ctx => {
    land = ctx.aspect > 1; VH = Math.round(1000 / ctx.aspect); U = Math.min(1, VH / 700);
    const m = 9 * U, A = art.gear(ZA, m, {id: 'ga'}), B = art.gear(ZB, m, {id: 'gb', fill: C.copper});
    const cy = VH * (land ? .5 : .46), cxA = (land ? 420 : 500) - (A.r + B.r) / 2 - (B.r - A.r) / 2, cxB = cxA + A.r + B.r;
    const pad = 48 * U, x = cxA - A.outer - pad, w = cxB + B.outer + pad - x, y = cy - B.outer - pad, h = 2 * (B.outer + pad);
    g = {m, A, B, cy, cxA, cxB, box: {x, y, w, h}};
    const stage = document.querySelector('.story-stage').getBoundingClientRect(), k = stage.width / VW;
    extraCss = X.windowCss('s-shell', {x0: cxA / VW * 100, y0: cy / VH * 100, x1: cxB / VW * 100, y1: cy / VH * 100, r: (B.r + 18 * U) * k}) +
      X.litCss('c-ga') + X.litCss('c-gb');
  };
  const pc = (x, y) => [x / VW * 100, y / VH * 100];
  const plate = (id, body) => sym(id, `0 0 ${VW} ${VH}`, body);
  // symbols use zero-origin view boxes (the engine's <use> places the viewport at 0,0); centred art is translated in
  const centred = (id, o, body) => sym(id, `0 0 ${f(2 * o)} ${f(2 * o)}`, `<g transform="translate(${f(o)} ${f(o)})">${body}</g>`);
  const gearSym = (id, G) => centred(id, G.outer + 4, G.body);
  const gw = G => (2 * (G.outer + 4)) / VW * 100;
  const housing = () => art.rounded(g.box.x, g.box.y, g.box.w, g.box.h, 40 * U);
  const inner = () => art.rounded(g.box.x + 26 * U, g.box.y + 26 * U, g.box.w - 52 * U, g.box.h - 52 * U, 26 * U);
  const shaft = () => art.metal(`M${f(g.box.x - 140 * U)} ${f(g.cy - 12 * U)}H${f(g.cxA)}V${f(g.cy + 12 * U)}H${f(g.box.x - 140 * U)}Z`, 'xs', C.steel) +
    art.axis(g.box.x - 170 * U, g.cy, g.cxB + g.B.outer + 30 * U, g.cy);
  const bolts = () => [[.06, .1], [.94, .1], [.06, .9], [.94, .9]].map(([a, b]) => `<circle cx="${f(g.box.x + g.box.w * a)}" cy="${f(g.box.y + g.box.h * b)}" r="${f(10 * U)}" fill="#22313b" stroke="#0b141a" stroke-width="3"/>`).join('');

  globalThis.xrayTopic = {
    shots: [
      {id: 'closed', scene: 'xr-closed', accent: C.glass, transition: {type: 'sweep'}},
      {id: 'cutaway', scene: 'xr-cutaway', accent: C.cut},
    ],
    get css() { return X.css + extraCss; },
    symbols: ctx => { layout(ctx); const s = Math.min(VW, VH); return [
      plate('xr-field', art.field(VW, VH, {grid: 60 * U})), plate('xr-shaft', shaft()),
      plate('xr-shell', art.metal(housing(), 'xh', '#5d6f7c') + bolts()),
      plate('xr-glass', art.section(`${housing()} ${inner()}`, 'xcut') + art.glass(housing()) + art.glass(inner(), {width: 2})),
      gearSym('xr-ga', g.A), gearSym('xr-gb', g.B),
      centred('xr-ring', 100, `<circle r="96" fill="none" stroke="${C.glass}" stroke-width="5"/><circle r="99" fill="none" stroke="${C.glass}" stroke-opacity=".25" stroke-width="10"/>`),
      centred('xr-brA', g.A.outer + 14, art.brackets(2 * g.A.outer + 20, 2 * g.A.outer + 20)),
      centred('xr-brB', g.B.outer + 14, art.brackets(2 * g.B.outer + 20, 2 * g.B.outer + 20, {color: C.cut})),
    ].join(''); },
    build(ctx) {
      const {P, plate: pl, motion} = ctx;
      const {key, track} = motion;
      const kit = X.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const L = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const A = pc(g.cxA, g.cy), B = pc(g.cxB, g.cy), lw = land ? .55 : 1;
      const noteY = ctx.presentation === 'full-bleed' ? ctx.safe.top / 100 + .07 : null;   // P018.6: top of the text-safe area in full-bleed
      const note = id => L(id, land ? pc(500, VH * (noteY ?? .9)) : pc(500, VH * (noteY ?? .91)), noteY ? 80 : 90, T.note, 'disclaimer');
      const scenes = {};
      // 1. closed housing, X-ray window travels from the small gear to the big one
      const ringW = 2 * (g.B.r + 18 * U) / VW * 100;
      scenes['xr-closed'] = {objects: [pl('s-field', 'xr-field', 0), P('s-ga', 'xr-ga', ...A, gw(g.A), 2), P('s-gb', 'xr-gb', ...B, gw(g.B), 2), pl('s-shaft', 'xr-shaft', 2, 'exact'),
        pl('s-shell', 'xr-shell', 3, 'exact'), P('s-ring', 'xr-ring', ...A, ringW, 4), L('s-tag', land ? pc(820, VH * .2) : pc(500, VH * .14), 34 * lw, T.parts, 'callout'), note('s-note')]};
      kit.mesh(['s-ga', ZA], ['s-gb', ZB], 90);
      const w = kit.scan('s-shell', cue('window'), 1.3);
      track('s-ring', [key(w - .01, [0, 0, 0, .2, 0]), key(w + .22, [0, 0, 0, 1, 1], 'out'), key(w + 1.3, [(B[0] - A[0]) / 100, 0, 0, 1, 1], 'smooth')]);
      kit.when('window', 's-ring');
      kit.label('s-tag', 'parts');
      // 2. glass cutaway: gears lit and bracketed on their words; the big gear turns at half speed (12:24)
      scenes['xr-cutaway'] = {objects: [pl('c-field', 'xr-field', 0), pl('c-shaft', 'xr-shaft', 2, 'exact'), P('c-ga', 'xr-ga', ...A, gw(g.A), 2), P('c-gb', 'xr-gb', ...B, gw(g.B), 2),
        pl('c-glass', 'xr-glass', 3, 'exact'), P('c-bra', 'xr-brA', ...A, (2 * g.A.outer + 28) / VW * 100, 4), P('c-brb', 'xr-brB', ...B, (2 * g.B.outer + 28) / VW * 100, 4),
        L('c-tag-a', land ? pc(820, VH * .2) : pc(330, VH * .2), 40 * lw, T.small, 'spec'), L('c-tag-b', land ? pc(820, VH * .34) : pc(640, VH * .72), 40 * lw, T.big, 'spec', {accent: C.cut}),
        L('c-tag-slow', land ? pc(820, VH * .5) : pc(640, VH * (ctx.presentation === 'full-bleed' ? Math.min(.8, ctx.safe.captionTop / 100 - .06) : .8)), 26 * lw, T.slow, 'amber'), note('c-note')]};
      kit.mesh(['c-ga', ZA], ['c-gb', ZB], 90);
      kit.inspect('c-bra', 'small'); kit.illuminate('c-ga', cue('small')); kit.label('c-tag-a', cue('small') + .15);
      kit.inspect('c-brb', 'big'); kit.illuminate('c-gb', cue('big')); kit.label('c-tag-b', cue('big') + .15);
      kit.label('c-tag-slow', 'slow');
      for (const id of ['s-note', 'c-note']) kit.label(id, S(id[0] === 's' ? 'closed' : 'cutaway').start + .05);
      const cam = (id, startView, views) => { const keys = kit.planCamera(id, views), s = S(id); return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0)]; };
      const cameras = {closed: cam('closed', [0, 0, 1.0], [[0, 0, 1.06, 'smooth']]), cutaway: cam('cutaway', [0, 0, 1.06], [[0, 0, 1.0, 'smooth']])};
      return {scenes, cameras, checks: {keyframes: [['window', cue('window') + .7], ['sweep', S('closed').end + .1], ['small', cue('small') + .5], ['slow', cue('slow') + .6]]}};
    },
  };
})();
