// E21 / P023.1 premium Paper Explainer study (unseen topic, en-IN, full-bleed): "How do bees make honey?" Simplified.
// Craft decisions (topic-level, built on paperKit.cut and textures; no new engine helpers):
//  - two-layer paper shadow: a tight dark contact shadow plus a wide soft ambient shadow, both along one key light
//  - hand-cut silhouettes: outlines are densified and deckled (small seeded irregularity), never perfect geometry
//  - cut-edge core: coloured paper shows a lighter core along its cut edge; drawn as a thin light edge line
//  - folded paper: petals and leaves have a centre crease, one half lit, one half in shade
//  - vellum: bee wings are translucent tracing paper with veins
//  - atmosphere: far layers paler and cooler, foreground framing leaves darker and larger
//  - motion: wings flutter on held poses (stepped), the bee lands with anticipation and settle, the flower head dips
//    under its weight and recovers (follow-through); honey caps press on and settle.
(() => {
  const {sym, f, rnd, smooth, blob} = globalThis.paperShotArt;
  const K = globalThis.paperKit, A = K.art;
  const W = 1000;
  let VH = 1778;
  const lit = A.light({dir: [.5, .86], warm: '#fff3d6', shade: '#2a1d10'});
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + hex(a).map((x, i) => Math.round(x + (hex(b)[i] - x) * t).toString(16).padStart(2, '0')).join('');
  // craft helpers come from paperKit (P023.1B): deckle, piece (filter-free penumbra + cut + paper core), folded, vellum
  const deckle = A.deckle;
  const paper = (d, fill, depth = 8, o = {}) => A.piece(d, {fill, lit, depth, ambient: o.ambient ?? .16, rim: o.rim ?? .45, texture: 'bz-paper'});
  const folded = (b, t, wd, fill, seed, depth = 6) => A.folded(b, t, wd, {fill, lit, depth, seed, texture: 'bz-paper'});
  const ellipse = (cx, cy, rx, ry, n = 22, rot = 0) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; });
  const hexPts = (cx, cy, rr) => Array.from({length: 6}, (_, i) => [cx + Math.cos(i * Math.PI / 3) * rr, cy + Math.sin(i * Math.PI / 3) * rr]);

  // ---------- art ----------
  const bee = () => {
    const stripes = [0, 1, 2].map(i => `<path d="M${88 + i * 22} 62C${84 + i * 22} 74 ${84 + i * 22} 96 ${92 + i * 22} 108" stroke="#2a2017" stroke-width="11" fill="none" stroke-linecap="round"/>`).join('');
    const legs = [[70, 96, 58, 128], [84, 100, 80, 132], [98, 102, 104, 132]].map(([a, b, c, d]) => `<path d="M${a} ${b}Q${(a + c) / 2 - 6} ${(b + d) / 2} ${c} ${d}" stroke="#2a2017" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');
    return legs + paper(deckle(ellipse(118, 84, 52, 30, 26), 3, 1.6), '#e3a92f', 5) + stripes +
      `<path d="M166 84l14 4-14 4z" fill="#2a2017"/>` + paper(deckle(ellipse(68, 80, 24, 22, 18), 5, 1.4), '#5a3d22', 4) +
      paper(deckle(ellipse(40, 82, 18, 17, 16), 7, 1.2), '#3a281a', 4) + `<circle cx="34" cy="78" r="6" fill="#120c08"/><circle cx="32" cy="76" r="2" fill="#ffffff"/>` +
      `<path d="M30 66Q22 44 10 40M38 64Q36 42 28 34" stroke="#2a2017" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  };
  const wing = () => A.vellum(deckle([[0, 70], [30, 18], [86, 4], [112, 22], [96, 52], [40, 72]], 11, 1.6),
    {texture: 'bz-paper', lines: 'M4 68C40 44 70 26 104 22M40 50C52 40 64 34 92 36M30 30C40 40 46 50 50 62'});
  const flowerHead = (petal, centre, seed) => {
    let s = '';
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + .2, r = 118; s += folded([150, 150], [150 + Math.cos(a) * r, 150 + Math.sin(a) * r * .62], 30, i % 2 ? petal : mix(petal, '#ffffff', .12), seed + i * 13); }
    return s + paper(deckle(ellipse(150, 150, 46, 32, 24), seed + 300, 2), centre, 7) +
      Array.from({length: 26}, (_, i) => { const a = i * 2.4, r = 6 + i * 1.3; return `<circle cx="${f(150 + Math.cos(a) * r)}" cy="${f(150 + Math.sin(a) * r * .7)}" r="3.2" fill="${mix(centre, '#3a1f08', .45)}"/>`; }).join('');
  };
  const stem = (x0, y0, x1, y1, seed) => paper(deckle([[x0 - 7, y0], [x1 - 6, y1], [x1 + 6, y1], [x0 + 7, y0]], seed, 1.5, 24), '#4e7d3a', 5) +
    folded([x0 + (x1 - x0) * .45, y0 + (y1 - y0) * .45], [x0 + (x1 - x0) * .45 + 120, y0 + (y1 - y0) * .45 - 70], 32, '#5f9446', seed + 5);
  const meadow = () => {
    const sky = A.sky(W, VH, {id: 'bz-sky', top: '#bfd8de', bottom: '#f6e7c6', sun: {x: 780, y: VH * .16, r: 70, color: '#f6cd6a', halo: '#fff2cf'}}) + `<rect width="${W}" height="${VH}" fill="url(#bz-paper)"/>`;
    const far = paper(A.ridge(W, VH * .42, VH, {seed: 4, amp: 90, n: 5}), '#b9c9b4', 6, {ambient: .08, rim: .25}) + A.haze(W, VH * .36, VH * .14, {id: 'bz-h1', color: '#f3ead6', opacity: .6}) +
      paper(A.ridge(W, VH * .5, VH, {seed: 9, amp: 70, n: 7}), '#9fb98f', 8, {ambient: .1});
    const hedge = Array.from({length: 8}, (_, i) => paper(blob(40 + i * 135 + rnd(40 + i) * 30, VH * (.55 + rnd(50 + i) * .02), 100, 70 + rnd(60 + i) * 30, 15, .2, 40 + i), i % 2 ? '#6f9a55' : '#7ea862', 10)).join('');
    const grass = paper(deckle([[0, VH * .64], [W, VH * .62], [W, VH], [0, VH]], 60, 5, 40), '#8fb25d', 12) +
      Array.from({length: 46}, (_, i) => { const x = rnd(70 + i) * W, y = VH * (.66 + rnd(90 + i) * .3), h = 30 + rnd(110 + i) * 50;
        return `<path d="M${f(x - 5)} ${f(y)}Q${f(x + (rnd(i) - .5) * 20)} ${f(y - h * .6)} ${f(x + (rnd(i + 5) - .5) * 26)} ${f(y - h)}Q${f(x + 2)} ${f(y - h * .5)} ${f(x + 5)} ${f(y)}Z" fill="${rnd(i + 3) > .5 ? '#6e9a48' : '#a3c26a'}"/>`; }).join('');
    const extras = [[180, VH * .62, '#f1eee6', '#e2b33c'], [880, VH * .66, '#e98fa6', '#f0c25a']].map(([x, y, p, c], i) => `<g transform="translate(${f(x - 60)} ${f(y - 70)}) scale(.42)">${stem(150, 470, 150, 150, 500 + i * 50)}${flowerHead(p, c, 600 + i * 40)}</g>`).join('');
    return {sky, far, mid: hedge + grass + extras};
  };
  const fore = () => folded([0, 300], [300, 40], 70, '#2f5a2e', 701, 14) + folded([40, 320], [380, 210], 52, '#386638', 702, 14) + folded([0, 330], [180, 130], 50, '#294d28', 703, 14);
  // ---------- hive, macro: one cell is the stage; neighbours recede into darkness (value steps toward the lit focal cell) ----------
  const R = 200, HH = R * Math.sqrt(3), FOC = () => [500, VH * .44];
  const comb = () => {
    const [fx, fy] = FOC();
    let s = `<rect width="${W}" height="${VH}" fill="#3a1f08"/>`;
    for (let c = -3; c <= 3; c++) for (let r = -4; r <= 4; r++) {
      const x = fx + c * R * 1.5, y = fy + r * HH + (Math.abs(c) % 2 ? HH / 2 : 0), dist = Math.hypot(x - fx, (y - fy) * .8) / 900, i = (c + 3) * 9 + r + 4;
      if (y < -HH || y > VH + HH) continue;
      const wax = A.mix('#f0c060', '#5a3410', Math.min(.75, dist * .9)), pit = A.mix('#9a5a14', '#24120a', Math.min(.85, dist));
      s += paper(deckle(hexPts(x, y, R - 6), 900 + i, 3, 26), wax, 10, {ambient: .2, rim: .4 * (1 - Math.min(1, dist))}) +
        `<path d="${deckle(hexPts(x, y, R - 30), 1900 + i, 2.4, 24)}" fill="${pit}"/>` +
        (c || r ? (rnd(i) > .45 ? paper(deckle(hexPts(x, y, R - 40), 2900 + i, 2, 22), A.mix(rnd(i + 3) > .5 ? '#f4e2b0' : '#d98a1e', '#24120a', Math.min(.8, dist)), 5, {ambient: .12, rim: .2}) : '')
          : `<ellipse cx="${x}" cy="${f(y + 30)}" rx="${R * .5}" ry="${R * .28}" fill="#1c0d04" opacity=".55"/>`);
    }
    return s;
  };
  const cellFill = (fill, gloss, seed) => paper(deckle(hexPts(150, 150, 142), seed, 2.4, 20), fill, 4, {ambient: .1, rim: .3}) +
    `<path d="M70 92C100 64 160 56 214 74" stroke="${gloss}" stroke-width="14" fill="none" stroke-linecap="round" opacity=".8"/><ellipse cx="104" cy="196" rx="38" ry="14" fill="${gloss}" opacity=".35"/>`;
  const nectar = () => cellFill('#f3dc8c', '#fffbe6', 51) + `<path d="M60 170C100 160 140 182 180 170S240 160 250 168M70 214C110 204 150 224 200 212" stroke="#fff6d2" stroke-width="5" fill="none" opacity=".8"/>`;
  const honey = () => cellFill('#d47a12', '#ffd78a', 52) + `<path d="M150 150m-70 0a70 50 0 1 0 140 0" fill="#b35c0a" opacity=".45"/>`;
  const cap = () => paper(deckle(hexPts(160, 160, 150), 88, 3, 18), '#f3e3b6', 8) + `<path d="M70 140C120 118 200 118 250 142M80 190C130 172 190 172 240 192" stroke="#dcc58a" stroke-width="5" fill="none"/>`;
  const vapour = () => A.vellum(`M40 120C10 96 30 60 56 70C50 40 90 24 104 50C130 36 150 70 126 88C140 108 110 126 90 112C78 130 52 132 40 120Z`, {texture: 'bz-paper', opacity: .5});
  const drop = () => paper(`M30 4C42 24 56 36 56 52C56 68 44 78 30 78C16 78 4 68 4 52C4 36 18 24 30 4Z`, '#f2cf6a', 4, {rim: .5}) + `<path d="M18 44C18 34 22 28 27 22" stroke="#fff4c8" stroke-width="5" fill="none" stroke-linecap="round"/>`;

  globalThis.paperTopic = {
    shots: [{id: 'meadow', scene: 'b-meadow', accent: '#c98a1e', transition: {type: 'dissolve', symbol: 'b-wall', lead: .35, tail: .45, zoom: .2}},
      {id: 'hive', scene: 'b-hive', accent: '#b8621a'}],
    css: K.css + ' .piece-art { filter:none }',
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}, hook: {text: 'Where does honey come from?', highlight: 'honey', until: 1.4}},
    symbols: () => {
      const r = document.querySelector('.story-stage').getBoundingClientRect();
      VH = Math.round(W * r.height / r.width);
      const vb = `0 0 ${W} ${VH}`, m = meadow();
      return A.textures('bz', {tile: 300, seed: 17}) + [
        sym('b-sky', vb, m.sky), sym('b-far', vb, m.far), sym('b-mid', vb, m.mid), sym('b-fore', '0 0 400 340', fore()),
        sym('b-flower', '0 0 300 700', stem(150, 700, 150, 170, 120) + flowerHead('#f4a8b8', '#f0b73a', 200)),
        sym('b-bee', '0 0 200 140', bee()), sym('b-wing', '0 0 120 80', wing()), sym('b-wall', vb, comb()),
        sym('b-nectar', '0 0 300 300', nectar()), sym('b-honey', '0 0 300 300', honey()), sym('b-cap', '0 0 320 320', cap()), sym('b-vapour', '0 0 160 150', vapour()), sym('b-drop', '0 0 60 82', drop()),
      ].join('');
    },
    build(ctx) {
      const M = globalThis.vcMotion;
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient} = motion;
      const kit = K.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const st = M.stepped, pose = (id, keys, fps = 12) => kit.pose(id, st(keys.map(([t, d, e]) => [t, [d], e]), fps).map(([t, [d], e]) => [t, d, e]));
      const BEE = (id, x, y, w, layer = 4) => [P(`${id}-wing2`, 'b-wing', x + w * .02, y - w * .08, w * .55, layer, {flat: true, origin: '0% 90%'}), P(`${id}`, 'b-bee', x, y, w, layer, {flat: true}),
        P(`${id}-wing`, 'b-wing', x + w * .05, y - w * .1, w * .6, layer, {flat: true, origin: '0% 90%'})];
      // wing flutter on held poses (12 per second): alternating up/down strokes inside [t0, t1)
      const flapAt = (t, windows) => { for (const [a, b, amp] of windows) if (t >= a && t < b) return Math.floor((t - a) * 12) % 2 ? -amp : amp * .2; return 0; };
      const flap = (id, t0, t1, amp = 38) => { const ks = [[t0, 0]]; for (let i = 1; t0 + i / 12 < t1; i++) ks.push([t0 + i / 12, i % 2 ? -amp : amp * .2, 'hold']); kit.pose(id, [...ks, [t1, 0, 'settle']]); };
      // honeycomb geometry for the cells we animate (stage percent)
      // flower geometry (stage units): one 300x700 piece at 34% width, stem base on the grass; the bee lands on the head
      const sc = 340 / 300, base = VH * .95, FL = {cy: (base - 350 * sc) / VH * 100}, headY = base - 700 * sc + 150 * sc;
      const LX = (580 - 300) / W, LY = (headY - 72 - VH * .3) / VH;
      const scenes = {
        'b-meadow': {objects: [plate('m-sky', 'b-sky', 0), plate('m-far', 'b-far', 1, 'exact'), plate('m-mid', 'b-mid', 2, 'exact'),
          P('m-flower', 'b-flower', 58, FL.cy, 34, 3, {flat: true, origin: '50% 100%'}),
          ...BEE('m-bee', 30, 30, 20, 4), P('m-fore', 'b-fore', 22, 90, 50, 5, {flat: true})]},
        'b-hive': {objects: [plate('h-wall', 'b-wall', 0),
          // macro: the focal cell (50%, 44%) fills a third of the frame; a large fanning bee in front, a carrier bee cropped above
          P('h-nectar', 'b-nectar', 50, 44, 35.9, 1, {flat: true}), P('h-honey', 'b-honey', 50, 44, 35.9, 1, {flat: true}), P('h-cap', 'b-cap', 50, 44, 37.5, 2, {flat: true}),
          ...[0, 1, 2].map(i => P(`h-vap${i}`, 'b-vapour', 40 + i * 9, 38, 11, 3, {flat: true})),
          ...BEE('h-bee2', 84, 18, 52, 4), P('h-drop', 'b-drop', 50, 44, 7, 4, {flat: true}), ...BEE('h-bee1', 24, 66, 46, 5),
          P('h-tag', null, 66, 58, 20, 5, {label: 'honey', labelStyle: 'chip'})]},
      };
      // ---- meadow: the bee flies in (stepped wings), anticipates, lands; the flower head dips and recovers
      const s1 = S('meadow').start, land = cue('visits'), sip = cue('nectar');
      const flight = [[s1, [-.3, .08, -8, 1, 1]], [land - .5, [LX - .06, LY - .07, 6, 1, 1], 'inOut'], [land - .25, [LX - .05, LY - .09, 10, 1, 1], 'inOut'], [land, [LX, LY, 2, 1, 1], 'settle']];
      const flightKeys = [key(s1, [-.3, .08, -8, 1, 0]), key(s1 + .05, [-.3, .08, -8, 1, 1]), ...flight.slice(1).map(([t, v, e]) => key(t, v, e)),
        key(sip, [LX, LY, 2, 1, 1]), key(sip + .3, [LX, LY + .006, 4, 1, 1], 'inOut'), key(S('meadow').end, [LX + .01, LY, 0, 1, 1], 'inOut')];
      track('m-bee', flightKeys);
      // wings ride the body's flight path exactly (sampled every frame) and add their held flap angle
      for (const [id, amp, ph] of [['m-bee-wing', 1, 0], ['m-bee-wing2', .8, 1 / 24]]) {
        const ks = [];
        for (let k = Math.ceil(s1 * 30); k / 30 <= S('meadow').end + 1e-9; k++) { const t = k / 30, v = [...M.sample(flightKeys, t)];
          v[2] += flapAt(t + ph, [[s1, land + .1, 38 * amp], [land + .6, land + .9, 20 * amp]]); ks.push(key(t, v, 'hold')); }
        track(id, ks);
      }
      pose('m-flower', [[s1, 0], [land - .02, 0], [land + .12, 2.2, 'inOut'], [land + .8, 0, 'settle']], 24);
      ambient('m-flower', {sway: [.5, 3.2, 0]}); ambient('m-fore', {sway: [.8, 4, 1]});
      // ---- hive: bees pass a drop of nectar, fan it (stepped), honey thickens, wax caps press on and settle
      // nectar-to-honey in one cell: the carrier drops nectar in (pale, watery), the fanned water rises off as vellum wisps,
      // the cell turns deep amber (thickens), a wax cap presses on and settles
      const s2 = S('hive').start, pass = motion.speechCue('pass', 'h-drop'), fan = cue('fan'), thick = motion.speechCue('thickens', 'h-honey'), seal = motion.speechCue('seal', 'h-cap');
      track('h-drop', [key(s2, [.14, -.2, 0, .8, 0]), key(pass, [.14, -.2, 0, .8, 0]), key(pass + .1, [.14, -.19, 0, 1, 1], 'outQuart'), key(pass + .6, [0, 0, 0, 1, 1], 'inOut'), key(pass + .75, [0, .005, 0, .6, 0], 'inOut')]);
      track('h-nectar', [key(s2, [0, 0, 0, .55, 0]), key(pass + .6, [0, 0, 0, .55, 0]), key(pass + 1.1, N, 'settle')]);
      M.stagger([0, 1, 2], fan + .3, .45, (i, t) => track(`h-vap${i}`, M.stepped([[s2, [0, 0, 0, .6, 0]], [t, [0, 0, 0, .6, 0]], [t + .3, [0, -.03, -6, 1, .9], 'outQuart'], [t + 1.4, [(i - 1) * .03, -.16, 10, 1.3, 0], 'inOut']], 12)));
      for (const [id, a, amp] of [['h-bee1', 0, 46], ['h-bee2', 1, 30]]) { flap(`${id}-wing`, (a ? pass - .6 : fan) + a * .04, thick + .4, amp); flap(`${id}-wing2`, (a ? pass - .6 : fan) + a * .04 + 1 / 24, thick + .4, amp * .78);
        for (const o of [id, `${id}-wing`, `${id}-wing2`]) ambient(o, {bob: [.003, .5, a]}); }
      track('h-honey', [key(s2, [0, 0, 0, .92, 0]), key(thick, [0, 0, 0, .92, 0]), key(thick + .9, N, 'inOut')]);
      track('h-cap', [key(s2, [0, -.025, -8, 1.12, 0]), key(seal, [0, -.025, -8, 1.12, 0]), key(seal + .14, [0, -.027, -9, 1.14, 1], 'inOut'), key(seal + .55, N, 'settle')]);
      kit.label('h-tag', thick + .5);
      const cameras = {
        meadow: kit.travel('meadow', [[s1, -.06, .04, 1.18, 'inOut'], [land, .1, -.06, 1.32, 'inOut'], [S('meadow').end, .12, -.07, 1.36, 'inOut']]),
        hive: kit.travel('hive', [[s2, 0, .02, 1.04, 'outQuart'], [pass, .02, .01, 1.08, 'inOut'], [thick, 0, 0, 1.16, 'inOut'], [S('hive').end, 0, -.01, 1.22, 'inOut']]),
      };
      return {scenes, cameras, checks: {keyframes: [['landing', land + .25], ['nectar', fan + .9], ['honey', thick + 1.0]]}};
    },
  };
})();
