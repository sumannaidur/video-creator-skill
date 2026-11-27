// P017.3 compact Flat Science fixture (test only): photosynthesis, with Telugu labels. A plant in sunlight, then the
// `magnify` transition opens a leaf cell where water flows in and sugar and oxygen are made. Every speech moment comes
// from the resolved plan; composed for the stage's own aspect (ctx.aspect).
(() => {
  const {f, sym, blob} = globalThis.techShotArt;
  const {art, HUES: H, css} = globalThis.fsKit;
  const T = Object.assign({leaf: 'ఆకు', sun: 'సూర్యకాంతి', water: 'నీరు', sugar: 'చక్కెర', oxygen: 'ఆక్సిజన్'}, globalThis.techTopicOptions?.labels ?? {});
  let VW = 1000, VH = 1600, U = 1, land = false, leafC = [500, 800], sunC = [760, 300], cellC = [500, 800];
  const layout = ctx => {
    land = ctx.aspect > 1; VH = Math.round(1000 / ctx.aspect); U = Math.min(1, VH / 760);
    leafC = land ? [400, VH * .5] : [480, VH * .55]; sunC = land ? [800, VH * .24] : [760, VH * .2]; cellC = land ? [430, VH * .52] : [500, VH * .5];
  };
  const pc = ([x, y]) => [x / VW * 100, y / VH * 100];
  const plate = (id, markup) => sym(id, `0 0 ${VW} ${VH}`, markup);
  const leafShape = ([cx, cy], len, w, ang) => {
    const b = [cx - len / 2, cy], t = [cx + len / 2, cy];
    return `<g transform="rotate(${ang} ${f(cx)} ${f(cy)})"><path d="M${f(b[0])} ${f(b[1])}Q${f(cx)} ${f(cy - w)} ${f(t[0])} ${f(t[1])}Q${f(cx)} ${f(cy + w)} ${f(b[0])} ${f(b[1])}Z" fill="${H.life}"/>` +
      `<path d="M${f(b[0])} ${f(b[1])}L${f(t[0])} ${f(t[1])}Q${f(cx)} ${f(cy + w)} ${f(b[0])} ${f(b[1])}Z" fill="${art.tone(H.life, .82)}"/>` +
      `<path d="M${f(b[0] + 10)} ${f(cy)}L${f(t[0] - 16)} ${f(cy)}" stroke="#d9f7e3" stroke-width="${f(6 * U)}" stroke-linecap="round"/>` +
      [-.25, 0, .25].map(k => `<path d="M${f(cx + k * len)} ${f(cy)}L${f(cx + k * len + len * .1)} ${f(cy - w * .42)}M${f(cx + k * len)} ${f(cy)}L${f(cx + k * len + len * .1)} ${f(cy + w * .42)}" stroke="#d9f7e3" stroke-width="${f(4 * U)}" stroke-linecap="round" opacity=".8"/>`).join('') + `</g>`;
  };
  const field = () => `<defs><linearGradient id="fs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeef4"/><stop offset="1" stop-color="#f3fbf6"/></linearGradient></defs>` +
    `<rect width="${VW}" height="${VH}" fill="url(#fs-sky)"/>` + art.organic(VW * .5, VH * 1.02, VW * .8, VH * .16, '#8a6a4a', {seed: 3, sheen: false}) +
    art.organic(VW * .12, VH * .9, VW * .18, VH * .06, '#9fd6a5', {seed: 7, sheen: false}) + art.organic(VW * .9, VH * .92, VW * .2, VH * .07, '#9fd6a5', {seed: 9, sheen: false});
  const plant = () => { const [cx, cy] = leafC; return `<path d="M${f(cx - 40 * U)} ${f(VH * .93)}Q${f(cx - 90 * U)} ${f(cy + 160 * U)} ${f(cx - 150 * U)} ${f(cy + 20 * U)}" fill="none" stroke="${art.tone(H.life, .75)}" stroke-width="${f(18 * U)}" stroke-linecap="round"/>` +
    leafShape([cx - 220 * U, cy + 170 * U], 220 * U, 70 * U, 150); };
  const bigLeaf = () => leafShape(leafC, 420 * U, 150 * U, -18);
  const sunBeam = () => `M${f(sunC[0] - 60 * U)} ${f(sunC[1] + 60 * U)}Q${f((sunC[0] + leafC[0]) / 2 + 40 * U)} ${f((sunC[1] + leafC[1]) / 2 - 40 * U)} ${f(leafC[0] + 60 * U)} ${f(leafC[1] - 30 * U)}`;
  const tissue = () => {
    let s = `<rect width="${VW}" height="${VH}" fill="#a9dcb3"/>`;
    for (let j = -1; j < VH / (220 * U) + 1; j++) for (let i = -1; i < VW / (240 * U) + 1; i++) {
      const x = i * 240 * U + (j % 2) * 120 * U, y = j * 220 * U;
      s += `<path d="${blob(x, y, 112 * U, 100 * U, 8, .08, 11 + i * 7 + j * 13)}" fill="#c9edd0" stroke="#7cc78b" stroke-width="${f(7 * U)}"/>`;
    }
    return s;
  };
  const cell = () => { const [cx, cy] = cellC; return art.section(cx, cy, [[300 * U, 270 * U, '#7cc78b'], [282 * U, 252 * U, '#e6f8ea']], {seed: 21}) +
    art.organic(cx + 60 * U, cy + 20 * U, 120 * U, 90 * U, '#bfe3f7', {seed: 23}) +
    [[-170, -90, 20], [-150, 120, -15], [40, -170, 10], [190, -40, 30], [130, 160, -25]].map(([dx, dy, a], i) =>
      `<g transform="rotate(${a} ${f(cx + dx * U)} ${f(cy + dy * U)})">${art.organic(cx + dx * U, cy + dy * U, 58 * U, 30 * U, H.life, {seed: 31 + i})}` +
      [-24, 0, 24].map(k => `<rect x="${f(cx + dx * U + k * U - 7 * U)}" y="${f(cy + dy * U - 14 * U)}" width="${f(14 * U)}" height="${f(28 * U)}" rx="${f(4 * U)}" fill="${art.tone(H.life, .7)}"/>`).join('') + `</g>`).join(''); };
  const waterFlow = () => { const [cx, cy] = cellC; return art.flow(`M${f(cx - 40 * U)} ${f(VH + 20)}Q${f(cx - 80 * U)} ${f(cy + 300 * U)} ${f(cx + 40 * U)} ${f(cy + 40 * U)}`, {color: H.water, dot: 18 * U, gap: 44 * U}); };
  const co2 = (r = 16 * U) => art.molecule(r * 2.4, r * 1.4, [[0, 0, r, H.carbon], [-r * 1.7, 0, r * .9, H.oxygen], [r * 1.7, 0, r * .9, H.oxygen]]);
  const sugar = (r = 13 * U) => Array.from({length: 6}, (_, i) => { const a = i / 6 * Math.PI * 2; return [Math.cos(a) * r * 2.3, Math.sin(a) * r * 2.3]; })
    .map(([x, y], i, a) => `<path d="M${f(60 * U + x)} ${f(60 * U + y)}L${f(60 * U + a[(i + 1) % 6][0])} ${f(60 * U + a[(i + 1) % 6][1])}" stroke="#ffffffaa" stroke-width="${f(r * .5)}"/>`).join('') +
    Array.from({length: 6}, (_, i) => { const a = i / 6 * Math.PI * 2; return art.ball(60 * U + Math.cos(a) * r * 2.3, 60 * U + Math.sin(a) * r * 2.3, r, i % 2 ? H.sugar : '#ffb27a'); }).join('');
  const o2 = (r = 15 * U) => art.molecule(r * 2.2, r * 1.4, [[-r * .8, 0, r, H.oxygen], [r * .8, 0, r, H.oxygen]]);

  globalThis.flatScienceTopic = {
    shots: [
      {id: 'leaf', scene: 'fs-leaf', accent: H.life, transition: {type: 'magnify', x: .48, y: .55}},
      {id: 'cell', scene: 'fs-cell', accent: H.sugar},
    ],
    css,
    symbols: ctx => { layout(ctx); return [
      plate('fs-field', field()), plate('fs-plant', plant()), plate('fs-bigleaf', bigLeaf()), plate('fs-sun', art.rays(...sunC, 70 * U)),
      plate('fs-beam', art.flow(sunBeam(), {color: H.energy, dot: 16 * U, gap: 40 * U, track: .25})),
      plate('fs-tissue', tissue()), plate('fs-cellart', cell()), plate('fs-water', waterFlow()),
      sym('fs-co2', `0 0 ${f(77 * U)} ${f(45 * U)}`, co2()), sym('fs-sugar', `0 0 ${f(120 * U)} ${f(120 * U)}`, sugar()), sym('fs-o2', `0 0 ${f(66 * U)} ${f(42 * U)}`, o2()),
    ].join(''); },
    build(ctx) {
      const {P, plate: pl, motion} = ctx;
      const {key, ambient} = motion;
      const kit = globalThis.fsKit.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const label = (id, xy, w, text, style, accent) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, accent});
      const lw = land ? 16 : 30;
      const scenes = {};
      scenes['fs-leaf'] = {objects: [pl('l-field', 'fs-field', 0), pl('l-plant', 'fs-plant', 2, 'exact'), P('l-leaf', 'fs-bigleaf', 50, 50, 100, 2, {origin: `${pc(leafC)[0]}% ${pc(leafC)[1]}%`}),
        pl('l-sun', 'fs-sun', 1, 'exact'), pl('l-beam', 'fs-beam', 3, 'exact'),
        label('l-tag-leaf', pc([leafC[0] - 60 * U, leafC[1] + 150 * U]), lw * .6, T.leaf, 'title', H.life), label('l-tag-sun', pc([sunC[0] - 40 * U, sunC[1] + 140 * U]), lw, T.sun, 'key', H.energy)]};
      kit.grow('l-leaf', 'leaf', .6);
      kit.grow('l-sun', 'sun', .5);
      ambient('l-sun', {breathe: [.015, 2.2, 0]});
      kit.flow('l-beam', cue('sun') + .3, S('leaf').end + .5);
      const dive = S('leaf').end - .55;   // labels leave before the magnify zoom carries them off the stage
      kit.label('l-tag-leaf', cue('leaf') + .4, dive); kit.label('l-tag-sun', cue('sun') + .4, dive);
      const [cx, cy] = cellC;
      scenes['fs-cell'] = {objects: [pl('c-tissue', 'fs-tissue', 0), pl('c-cell', 'fs-cellart', 2, 'exact'), pl('c-water', 'fs-water', 3, 'exact'),
        P('c-co2', 'fs-co2', ...pc([cx - 380 * U, cy - 60 * U]), land ? 4.5 : 8, 4), P('c-sugar', 'fs-sugar', ...pc([cx + 190 * U, cy - 40 * U]), land ? 7 : 12, 4, {required: true}),
        P('c-o2', 'fs-o2', ...pc([cx + 40 * U, cy - 170 * U]), land ? 4 : 7, 4), P('c-o2b', 'fs-o2', ...pc([cx + 120 * U, cy - 150 * U]), land ? 4 : 7, 4),
        label('c-tag-water', pc([cx - 330 * U, cy + 200 * U]), lw * .8, T.water, 'key', H.water), label('c-tag-sugar', pc([cx + 200 * U, cy + 120 * U]), lw, T.sugar, 'key', H.sugar),
        label('c-tag-o2', (([x, y]) => [x, ctx.presentation === 'full-bleed' ? Math.max(y, ctx.safe.top + 6) : y])(pc([cx + 60 * U, cy - 330 * U])), lw, T.oxygen, 'key', H.oxygen)]};
      kit.flow('c-water', 'water', S('cell').end);
      kit.label('c-tag-water', cue('water') + .3);
      kit.emit('c-co2', cue('water') + .4, [200 * U / VW, 0], 1.1);
      kit.emit('c-sugar', 'sugar', [40 * U / VW, 30 * U / VH], .7);
      kit.label('c-tag-sugar', cue('sugar') + .3);
      kit.emit('c-o2', 'oxygen', [-30 * U / VW, -260 * U / VH], 1);
      kit.emit('c-o2b', cue('oxygen') + .15, [40 * U / VW, -250 * U / VH], 1);
      kit.label('c-tag-o2', cue('oxygen') + .35);
      const cam = (id, startView, views, endView) => {
        const keys = kit.planCamera(id, views), s = S(id);
        return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0), ...(endView ? [key(s.end, endView, 'out')] : [])];
      };
      const cameras = {leaf: cam('leaf', [0, .02, 1.04], [[0, 0, 1.08, 'smooth']]), cell: cam('cell', [0, 0, 1.12], [[0, 0, 1.02, 'smooth']])};
      return {scenes, cameras, checks: {keyframes: [['leaf-sun', cue('sun') + .9], ['magnify', S('leaf').end + .15], ['water', cue('water') + .7], ['products', cue('oxygen') + .8]]}};
    },
  };
})();
