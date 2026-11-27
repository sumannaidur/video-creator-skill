// E22 / P023.2 Whiteboard study (unseen topic, en-IN, full-bleed): "Why are cities hotter?" Simplified.
// Reference-derived choices (RSA Animate / Cognitive): one continuous board that fills up as the story goes, a single
// spot-colour ribbon that links the ideas, heavy contours with light interior detail (brush), hatching for shade,
// hand-lettered caps fitted beside the drawings, a visual metaphor (concrete = a frying pan), a small caricature with a
// readable expression, and a final pull-back that shows the whole argument on one board.
(() => {
  const {sym} = globalThis.techShotArt;
  const {art, COLORS: K, css} = globalThis.wbKit;
  const W = 1000;
  let VH = 1778;
  const B = (pts, o = {}) => art.brush(pts, {width: 10, ...o});                   // contour
  const T = (pts, o = {}) => art.brush(pts, {width: 4.5, taper: .5, ...o});      // interior detail
  const box = (x, y, w, h, seed) => B([[x, y + h], [x, y], [x + w, y], [x + w, y + h]], {seed});
  const plate = (id, strokes, o = {}) => sym(id, `0 0 ${W} ${VH}`, art.ink(strokes, o));

  // ---------- region A (top): the sun bakes roads and roofs ----------
  const city = () => { const y0 = VH * .36, s = [];
    [[90, 170, 120], [230, 250, 110], [360, 140, 130], [510, 210, 100]].forEach(([x, h, w], i) => {
      s.push(...box(x, y0 - h, w, h, 10 + i * 7));
      for (let r = 0; r < Math.floor(h / 48); r++) for (let c = 0; c < 2; c++) s.push(...T([[x + 22 + c * w * .45, y0 - h + 24 + r * 48], [x + 40 + c * w * .45, y0 - h + 24 + r * 48]], {seed: 40 + i * 13 + r * 3 + c, segs: 1}));
      s.push(...art.hatch(x + w - 26, y0 - h + 8, 20, h - 12, {gap: 14, seed: 70 + i}).map(d => ({d, width: 2.5, color: K.grey, weight: .05})));
    });
    s.push(...B([[40, y0], [640, y0 + 4]], {seed: 90, width: 12}));
    return s; };
  const sun = () => { const [cx, cy] = [820, VH * .13]; return [{d: art.loop(cx, cy, 78, 78, {seed: 5}), width: 9},
    ...Array.from({length: 10}, (_, i) => { const a = i / 10 * Math.PI * 2; return B([[cx + Math.cos(a) * 104, cy + Math.sin(a) * 104], [cx + Math.cos(a) * 146, cy + Math.sin(a) * 146]], {seed: 20 + i, width: 7, segs: 2, weight: .4}); }).flat(),
    ...T([[788, VH * .12], [800, VH * .115]], {seed: 3, segs: 1}), ...T([[836, VH * .12], [848, VH * .115]], {seed: 4, segs: 1}), ...T([[790, VH * .145], [820, VH * .155], [850, VH * .145]], {seed: 6, segs: 3})]; };
  const bake = () => [0, 1, 2].flatMap(i => { const x0 = 700 - i * 70, y0 = VH * .2 + i * 10; return [...B([[x0, y0], [x0 - 60, y0 + 40], [x0 - 40, y0 + 80], [x0 - 110, y0 + 130 + i * 20]], {seed: 120 + i, width: 7, color: K.red}),
    ...art.arrow([x0 - 90, y0 + 112 + i * 20], [x0 - 112, y0 + 132 + i * 20], {head: 22, seed: 130 + i}).slice(1).map(d => ({d, width: 7, color: K.red}))]; });
  // ---------- region B (middle): concrete stores heat like a frying pan (metaphor) ----------
  const pan = () => { const cx = 420, cy = VH * .58, s = [];
    s.push({d: art.loop(cx, cy, 250, 70, {seed: 31, turns: 1.02}), width: 11});
    s.push(...B([[cx - 240, cy + 10], [cx - 200, cy + 90], [cx + 200, cy + 90], [cx + 240, cy + 10]], {seed: 33, width: 11}));
    s.push(...B([[cx + 250, cy + 20], [cx + 470, cy + 60], [cx + 480, cy + 90], [cx + 250, cy + 54]], {seed: 35, width: 10}));
    s.push(...box(cx - 120, cy - 150, 110, 150, 37), ...box(cx + 10, cy - 110, 130, 110, 39));
    s.push(...art.hatch(cx - 116, cy - 140, 100, 132, {gap: 13, seed: 41}).map(d => ({d, width: 2.5, color: K.grey, weight: .04})));
    return s; };
  const panHeat = () => [-160, -40, 80, 200].flatMap((dx, i) => B([[420 + dx, VH * .5 - 60], [440 + dx, VH * .5 - 110], [415 + dx, VH * .5 - 160], [440 + dx, VH * .5 - 210]], {seed: 150 + i, width: 7, color: K.red}));
  const thermo = () => { const x = 860, y = VH * .5; return [{d: art.loop(x, y + 150, 34, 34, {seed: 61}), width: 8}, ...B([[x - 18, y + 122], [x - 18, y - 120], [x + 18, y - 120], [x + 18, y + 122]], {seed: 62, width: 8}),
    ...[0, 1, 2, 3].flatMap(i => T([[x + 22, y - 90 + i * 50], [x + 44, y - 90 + i * 50]], {seed: 63 + i, segs: 1}))]; };
  // ---------- region C (bottom): at night it leaks back out; trees and shade keep the street cooler ----------
  const night = () => { const cx = 130, cy = VH * .69; return [{d: art.hand([[cx + 20, cy - 60], [cx - 30, cy - 40], [cx - 40, cy + 10], [cx - 10, cy + 50], [cx + 40, cy + 54], [cx + 10, cy + 30], [cx - 4, cy - 6], [cx + 20, cy - 60]], {seed: 71}), width: 8}]; };
  const leak = () => { const s = [], x = 250, y = VH * .84; s.push(...box(x, y - 200, 150, 200, 81));
    [[-1, -150], [1, -170], [-1, -80], [1, -60]].forEach(([sgn, dy], i) => s.push(...B([[x + 75 + sgn * 90, y + dy], [x + 75 + sgn * 120, y + dy - 30], [x + 75 + sgn * 150, y + dy - 10], [x + 75 + sgn * 180, y + dy - 40]], {seed: 85 + i, width: 7, color: K.red})));
    return s; };
  const tree = () => { const x = 720, y = VH * .84, s = [];
    s.push(...B([[x - 14, y], [x - 10, y - 170], [x - 30, y - 230]], {seed: 91, width: 11}), ...B([[x + 14, y], [x + 12, y - 160], [x + 40, y - 220]], {seed: 92, width: 11}));
    s.push(...B(Array.from({length: 15}, (_, i) => { const a = Math.PI * (1.05 + i / 14 * .9) + .15, r = 150 + (i % 2) * 26; return [x + Math.cos(a) * r * 1.25, y - 270 + Math.sin(a) * r * .9 + 130]; }).concat([[x + 190, y - 230]]), {seed: 93, width: 10, segs: 12}));
    s.push(...art.hatch(x - 220, y - 12, 440, 22, {gap: 16, seed: 95}).map(d => ({d, width: 3, color: K.grey, weight: .06})));
    return s; };
  const person = () => { const x = 560, y = VH * .84; return [{d: art.loop(x, y - 150, 30, 34, {seed: 101}), width: 8}, ...B([[x, y - 116], [x - 4, y - 50]], {seed: 102, width: 9}),
    ...B([[x - 4, y - 50], [x - 26, y]], {seed: 103, width: 8}), ...B([[x - 4, y - 50], [x + 20, y]], {seed: 104, width: 8}), ...B([[x - 2, y - 96], [x + 40, y - 120], [x + 60, y - 150]], {seed: 105, width: 8}),
    ...T([[x - 12, y - 156], [x - 6, y - 158]], {seed: 106, segs: 1}), ...T([[x + 8, y - 156], [x + 14, y - 158]], {seed: 107, segs: 1}), ...T([[x - 12, y - 140], [x + 2, y - 132], [x + 16, y - 140]], {seed: 108, segs: 3})]; };
  const route = () => art.ribbon([[860, VH * .25], [950, VH * .34], [960, VH * .44], [945, VH * .52], [915, VH * .565]], {seed: 7, width: 22, color: K.red});

  globalThis.whiteboardTopic = {
    shots: [{id: 'bake', scene: 'h-board'}, {id: 'store', scene: 'h-board'}, {id: 'night', scene: 'h-board'}],
    css: css + ' .label-caps .piece-label { font-size:46px }',
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: () => {
      const r = document.querySelector('.story-stage').getBoundingClientRect();
      VH = Math.round(W * r.height / r.width);
      return [plate('h-city', city()), plate('h-sun', sun(), {fills: [{d: art.loop(820, VH * .13, 76, 76, {seed: 8, turns: 1}), color: K.yellow, after: .3, opacity: .75}]}),
        plate('h-bake', [...bake(), art.letter('bakes', 330, VH * .165, {size: 12})]), plate('h-pan', pan()), plate('h-panheat', [...panHeat(), art.letter('stores heat', 400, VH * .655, {size: 54, color: K.red})]), plate('h-thermo', thermo(), {fills: [{d: art.hand([[848, VH * .5 + 150], [848, VH * .5 - 60], [872, VH * .5 - 60], [872, VH * .5 + 150]], {seed: 64, wobble: 1}), color: K.red, after: .6, opacity: .8}]}),
        plate('h-moon', night(), {fills: [{d: night()[0].d, color: K.yellow, after: .5, opacity: .5}]}), plate('h-leak', leak()), plate('h-cool', [art.letter('cooler', 850, VH * .725, {size: 50, color: '#1f6e3a'})]), plate('h-tree', tree(), {fills: [{d: art.loop(720, VH * .84 - 250, 230, 120, {seed: 96, turns: 1}), color: '#8fd18f', after: .7, opacity: .55}]}),
        plate('h-person', person()), plate('h-route', route())].join('');
    },
    build(ctx) {
      const {P, plate: pl, motion} = ctx;
      const {key, ambient} = motion;
      const kit = globalThis.wbKit.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const L = (id, x, y, w, text, extra = {}) => P(id, null, x, y, w, 5, {label: text, labelStyle: 'caps', ...extra});
      const ids = ['h-city', 'h-sun', 'h-bake', 'h-route', 'h-pan', 'h-panheat', 'h-thermo', 'h-moon', 'h-leak', 'h-tree', 'h-person', 'h-cool'];
      const scenes = {'h-board': {objects: [...ids.map(id => pl('o' + id.slice(1), id, 2 + (id === 'h-route' ? 0 : 1), 'exact'))]}};
      // A: the city is drawn, then the sun, then the baking heat on "bakes"
      kit.draw('o-city', S('bake').start + .05, 1.1);
      kit.draw('o-sun', S('bake').start + .9, .6);
      const bk = kit.draw('o-bake', 'bakes', .8);
      kit.draw('o-route', bk + .9, 1.8);
      // B: the metaphor builds on "stores": pan, rising heat, thermometer fills
      const st = kit.draw('o-pan', 'stores', .9);
      kit.draw('o-panheat', st + .7, .6); kit.draw('o-thermo', st + .4, .8);
      // C: night, heat leaks out of the building; the tree and a relieved person on "trees"
      kit.draw('o-moon', 'night', .4); kit.draw('o-leak', cue('night') + .3, .9);
      const tr = kit.draw('o-tree', 'trees', .9); kit.draw('o-person', tr + .5, .6);
      kit.draw('o-cool', 'cooler', .5);
      ambient('o-sun', {breathe: [.01, 2.4, 0]});
      // camera follows the ribbon down the board, then pulls back to reveal the whole argument
      const cameras = {
        bake: [key(S('bake').start, [-.02, -.13, 1.42]), key(bk, [0, -.12, 1.38], 'inOut'), key(S('bake').end, [.03, -.04, 1.34], 'inOut')],
        store: [key(S('store').start, [.03, -.03, 1.34]), key(st + .5, [.0, .0, 1.36], 'inOut'), key(S('store').end, [-.01, .06, 1.34], 'inOut')],
        night: [key(S('night').start, [-.01, .07, 1.34]), key(tr + .6, [.02, .12, 1.36], 'inOut'), key(cue('cooler') + .5, [0, .06, 1.2], 'inOut'), key(S('night').end, [0, 0, 1.0], 'inOut')],
      };
      return {scenes, cameras, checks: {keyframes: [['baking', bk + 1.0], ['frying-pan', st + 1.4], ['whole-board', S('night').end - .1]]}};
    },
  };
})();
