// P017.2 compact generic Whiteboard fixture (test only): a seed, water, sunlight, a sprout that grows. Two shots joined
// by the whiteboard `erase` transition; every speech moment comes from the resolved plan. Composed for the stage's own
// aspect (ctx.aspect). Labels come from topic options so the same drawing can carry another language.
(() => {
  const {sym} = globalThis.techShotArt;
  const {art, COLORS: K, css} = globalThis.wbKit;
  const L = Object.assign({seed: 'seed', water: 'water', tall: 'tall'}, globalThis.techTopicOptions?.labels ?? {});
  let VW = 1000, VH = 1600, U = 1, land = false, cx = 500, cy = 1250, sun = [730, 300];
  const layout = ctx => {
    land = ctx.aspect > 1; VH = Math.round(1000 / ctx.aspect); U = Math.min(1, VH / 800);
    cx = land ? 380 : 500; cy = VH * (land ? .9 : .8); sun = land ? [780, VH * .3] : [740, VH * .2];
  };
  const pc = (x, y) => [x / VW * 100, y / VH * 100];
  const fr = ([x, y]) => [x / VW, y / VH];
  const u = (dx, dy) => [cx + dx * U, cy + dy * U];
  const plate = (id, markup) => sym(id, `0 0 ${VW} ${VH}`, markup);

  const potStrokes = () => [
    art.hand([u(-165, -240), u(165, -240), u(165, -200), u(-165, -200), u(-165, -240)], {seed: 3}),
    art.hand([u(-150, -200), u(-110, 0), u(110, 0), u(150, -200)], {seed: 5}),
    art.hand([u(-150, -246), u(-60, -262), u(40, -250), u(150, -258)], {seed: 9, wobble: 3}),
    ...art.hatch(cx - 100 * U, cy - 150 * U, 200 * U, 120 * U, {gap: 26 * U, seed: 11}).map(d => ({d, width: 3, color: K.grey, weight: .15})),
  ];
  const seedStrokes = () => [art.loop(...u(0, -270), 30 * U, 18 * U, {seed: 21}), art.hand([u(-14, -272), u(14, -266)], {seed: 23})];
  const drop = (dx, dy, s, seed) => art.hand([u(dx, dy - 40 * s), u(dx - 18 * s, dy), u(dx, dy + 14 * s), u(dx + 18 * s, dy), u(dx, dy - 40 * s)], {seed, wobble: 1});
  const drops = () => [drop(-70, -430, 1, 31), drop(5, -500, 1.15, 33), drop(75, -425, .95, 35)];
  const sunStrokes = () => {
    const [sx, sy] = sun, r = 72 * U;
    return [art.loop(sx, sy, r, r, {seed: 41}), ...Array.from({length: 8}, (_, i) => {
      const a = i / 8 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      return {d: art.hand([[sx + c * r * 1.3, sy + s * r * 1.3], [sx + c * r * 1.75, sy + s * r * 1.75]], {seed: 43 + i}), weight: .35};
    })];
  };
  const leaf = (x, y, w, dir, seed) => art.hand([[x, y], [x + dir * w * .5, y - w * .45], [x + dir * w, y - w * .1], [x + dir * w * .5, y + w * .12], [x, y]], {seed, wobble: 1.5});
  const sprout = () => [art.hand([u(0, -240), u(-8, -320), u(6, -380), u(10, -420)], {seed: 51}), leaf(...u(2, -350), 70 * U, -1, 53), leaf(...u(4, -372), 64 * U, 1, 55)];
  const tall = () => [art.hand([u(10, -420), u(-6, -500), u(4, -580), u(-4, -650)], {seed: 61}), leaf(...u(-2, -560), 96 * U, -1, 63), leaf(...u(0, -600), 90 * U, 1, 65)];
  const sunArrow = () => art.arrow([sun[0] - 90 * U, sun[1] + 70 * U], u(60, -380), {bend: -.18, seed: 71}).map(d => ({d}));

  globalThis.whiteboardTopic = {
    shots: [
      {id: 'seed', scene: 'wb-seed', accent: K.blue, transition: {type: 'erase'}},
      {id: 'sprout', scene: 'wb-sprout', accent: K.green},
    ],
    css,
    symbols: ctx => { layout(ctx); return [
      plate('wb-pot', art.ink(potStrokes(), {width: 8})),
      plate('wb-seedink', art.ink(seedStrokes(), {width: 7, fills: [{d: art.loop(...u(0, -270), 28 * U, 16 * U, {seed: 22, turns: 1}), color: '#c58b4a', after: .5, opacity: .8}]})),
      plate('wb-drops', art.ink(drops(), {color: K.blue, width: 7, fills: drops().map(d => ({d, color: '#7fb0ff', after: .8, opacity: .6}))})),
      plate('wb-sun', art.ink(sunStrokes(), {width: 7, fills: [{d: art.loop(...sun, 70 * U, 70 * U, {seed: 42, turns: 1}), color: K.yellow, after: .2, opacity: .8}]})),
      plate('wb-arrow', art.ink(sunArrow(), {color: K.red, width: 7})),
      plate('wb-sprout', art.ink(sprout(), {color: K.green, width: 8, fills: [{d: sprout()[1], color: '#8fd18f', after: .6}, {d: sprout()[2], color: '#8fd18f', after: .8}]})),
      plate('wb-bud', art.ink([art.loop(...u(10, -432), 14 * U, 14 * U, {seed: 57})], {color: K.green, width: 7})),
      plate('wb-tall', art.ink(tall(), {color: K.green, width: 9, fills: [{d: tall()[1], color: '#8fd18f', after: .6}, {d: tall()[2], color: '#8fd18f', after: .85}]})),
      sym('wb-penart', '-57.4 -104.2 120 260', art.pen(K.blue)),
    ].join(''); },
    build(ctx) {
      const {P, plate: pl, motion} = ctx;
      const {key, ambient, track} = motion;
      const kit = globalThis.wbKit.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const label = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const penW = land ? 5 : 10;
      const rel = (pts, base) => pts.map(p => { const a = fr(p), b = fr(base); return [a[0] - b[0], a[1] - b[1]]; });
      const scenes = {};
      // 1. seed: the pot is drawn, the seed goes in, water drops fall
      const seedPath = [u(-30, -270), u(0, -288), u(30, -270), u(0, -252), u(-30, -270)];
      scenes['wb-seed'] = {objects: [pl('a-pot', 'wb-pot', 2, 'exact'), pl('a-seed', 'wb-seedink', 2, 'exact'), pl('a-drops', 'wb-drops', 3, 'exact'),
        P('a-pen', 'wb-penart', ...pc(...seedPath[0]), penW, 4), label('a-tag-seed', pc(...u(230, -300)), land ? 14 : 24, L.seed, 'boxed', {accent: K.ink}),
        label('a-tag-water', pc(...u(-230, -520)), land ? 14 : 26, L.water, 'highlight', {accent: K.blue})]};
      kit.draw('a-pot', S('seed').start + .05, .8);
      const sd = kit.draw('a-seed', 'seed', .7);
      kit.pen('a-pen', sd, .7, rel(seedPath, seedPath[0]));
      kit.write('a-tag-seed', sd + .3, .5);
      const wt = kit.draw('a-drops', 'water', .6);
      track('a-drops', [key(wt, [0, 0, 0, 1, 0]), key(wt + .04, [0, 0, 0, 1, 1]), key(wt + 1.2, [0, .02, 0, 1, 1])]);
      kit.write('a-tag-water', wt + .2, .5);
      // 2. sprout: a clean board; the pot returns, the sun is drawn, the sprout grows; its bud is rubbed out and redrawn taller
      const stem = [u(0, -240), u(-8, -320), u(6, -380), u(10, -420)];
      scenes['wb-sprout'] = {objects: [pl('b-pot', 'wb-pot', 2, 'exact'), pl('b-sun', 'wb-sun', 2, 'exact'), pl('b-arrow', 'wb-arrow', 3, 'exact'),
        pl('b-sprout', 'wb-sprout', 2, 'exact'), pl('b-bud', 'wb-bud', 2, 'exact'), pl('b-tall', 'wb-tall', 2, 'exact'), P('b-pen', 'wb-penart', ...pc(...stem[0]), penW, 4),
        label('b-tag', (([x, y]) => [x, ctx.presentation === 'full-bleed' ? Math.max(y, ctx.safe.top + 6) : y])(pc(...u(-230, -640))), land ? 12 : 22, L.tall, 'boxed', {accent: K.red})]};
      kit.draw('b-pot', S('sprout').start + .02, .35);
      kit.draw('b-sun', 'sun', .7);
      ambient('b-sun', {spin: 0, breathe: [.01, 2.4, 0]});
      const sp = kit.draw('b-sprout', 'sprout', .6);
      kit.pen('b-pen', sp, .6, rel(stem, stem[0]));
      kit.draw('b-bud', sp + .5, .2);
      kit.draw('b-arrow', sp + .35, .4);
      const gr = kit.draw('b-tall', 'grow', .7);
      kit.erase('b-bud', gr - .05, .25);
      kit.write('b-tag', gr + .45, .4);
      const cam = (id, startView, views, endView) => {
        const keys = kit.planCamera(id, views), s = S(id);
        return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0), ...(endView ? [key(s.end, endView, 'out')] : [])];
      };
      const cameras = {
        seed: cam('seed', [0, .04, 1.1], [[0, -.02, 1.04, 'smooth']]),
        sprout: cam('sprout', [0, .03, 1.08], [[0, 0, 1.0, 'smooth']]),
      };
      return {scenes, cameras, checks: {keyframes: [['seed-drawn', sd + .9], ['water', wt + .8], ['sprout', sp + .35], ['grown', gr + .9]]}};
    },
  };
})();
