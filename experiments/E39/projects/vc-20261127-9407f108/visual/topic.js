// "How does a seed know which way is up?" (te-IN, Paper Explainer, full-bleed). Original cut-paper artwork, one world lit
// from the upper left. Roots and stems are chains of small paper segments: shown in order for growth, posed every frame
// for bending, so organs grow along their own curves (the Paper engine has no path-draw channel).
//   hook - soil section; an upside-down bean: the root climbs, hooks over and dives; the shoot hooks round and climbs.
//   tip  - inside the root tip: cap cells with starch grains on the floor; the root tips over, the grains slide to the new floor.
//   bend - a sideways root of paper cells; auxin gathers below; the upper side grows more and the root bends down.
//   rise - the stem curls up through the surface into light and opens two leaves.
(() => {
  const {sym} = globalThis.paperShotArt;
  const K = globalThis.paperKit, A = K.art;
  const W = 1000;
  let VH = 1778;
  const lit = A.light({dir: [.6, .8]});
  const L = (d, fill, o = {}) => A.cut(d, {fill, lit, texture: 'sx-paper', ...o});
  const R = d => d * Math.PI / 180;
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const T = {root: 'వేరు', shoot: 'మొలక', grains: 'పిండి రేణువులు', signal: 'దిశ సంకేతం', auxin: 'ఆక్సిన్', grow: 'పై వైపు ఎక్కువ పెరుగుదల', stem: 'కాండం'};

  // ---------- chain geometry: centres and headings (degrees, screen: 0 = right, +90 = down) ----------
  const chain = (p0, headings, len) => { let [x, y] = p0; return headings.map(h => { const c = [x + Math.cos(R(h)) * len / 2, y + Math.sin(R(h)) * len / 2];
    x += Math.cos(R(h)) * len; y += Math.sin(R(h)) * len; return {c, h, end: [x, y]}; }); };
  const hookHeadings = (h0, h1, n, turn) => Array.from({length: n}, (_, i) => i < turn[0] ? h0 : i >= turn[1] ? h1 : h0 + (h1 - h0) * (i - turn[0] + .5) / (turn[1] - turn[0]));
  const bendHeadings = (h0, total, w) => { const s = w.reduce((a, b) => a + b, 0); let acc = h0; return w.map(x => (acc += total * x / s, acc - total * x / s / 2)); };

  // ---------- world (hook and rise share it) ----------
  const G = () => VH * .40;                                                         // ground line
  const skyArt = () => A.sky(W, G() + 60, {id: 'sx-sky', top: '#9fc4cf', bottom: '#f4e6c8', sun: {x: 800, y: VH * .1, r: 70, color: '#f6c15a', halo: '#fff0c2'}}) +
    `<rect width="${W}" height="${G() + 60}" fill="url(#sx-paper)" opacity=".5"/>` +
    L(A.ridge(W, G() - 70, G() + 40, {seed: 6, amp: 70, n: 4}), '#a7bfa6', {depth: 5, rim: .3}) + A.haze(W, G() - 110, 120, {id: 'sx-haze', color: '#f4e6c8', opacity: .5});
  const soilArt = () => A.strata(W, G(), [{h: 120, color: '#8a6243', pebbles: 9}, {h: 300, color: '#7a5439', pebbles: 14}, {h: 380, color: '#69472f', pebbles: 12}, {h: VH, color: '#563a27', pebbles: 16}], {seed: 7, lit, texture: 'sx-paper'}) +
    Array.from({length: 9}, (_, i) => { const x = 60 + i * 110 + (i % 3) * 13, y = G() + 26; return `<path d="M${x} ${y}q${8 - i % 3 * 6} 40 ${-4 + i % 4 * 3} 78" stroke="#c9a77c" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`; }).join('');
  const grassArt = () => L(`${A.wave(W, G() - 6, {seed: 2, amp: 10})}L${W} ${G() + 30}L0 ${G() + 30}Z`, '#6f9a4e', {depth: 8}) +
    Array.from({length: 46}, (_, i) => { const x = i * 22 + (i * 7) % 11, h = 22 + (i * 13) % 26; return `<path d="M${x} ${G() + 4}q${(i % 2 ? 6 : -6)} ${-h * .6} ${(i % 2 ? 10 : -4)} ${-h}" stroke="${i % 3 ? '#5d8a40' : '#86b25d'}" stroke-width="5" fill="none" stroke-linecap="round"/>`; }).join('');
  const bean = (rot) => `<g transform="rotate(${rot} 110 75)">` + A.gouache('M20 80C14 30 70 6 120 14C176 22 206 60 198 98C190 138 140 150 96 140C50 132 24 116 20 80Z', {fill: '#b07a46', id: 'sx-bean' + rot, lit, strength: .5, texture: 'sx-gouache'}) +
    `<path d="M92 128C104 118 122 118 132 128" stroke="#5b3a22" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M60 46C84 32 120 30 146 40" stroke="#e8c79a" stroke-width="6" fill="none" opacity=".7" stroke-linecap="round"/></g>`;
  const segArt = (fill, edge, h) => `<rect x="0" y="0" width="34" height="${h}" rx="${h / 2}" fill="${fill}"/><rect x="0" y="${h * .62}" width="34" height="${h * .38}" rx="${h * .19}" fill="${edge}" opacity=".55"/><rect x="2" y="${h * .14}" width="30" height="${h * .18}" rx="${h * .09}" fill="#fff8e6" opacity=".45"/>`;

  // ---------- root tip (600×900 symbol units = stage units at width 60 %) ----------
  const CELLS = [0, 1].flatMap(c => [0, 1, 2].map(r => [235 + 130 * c, 480 + 120 * r]));
  const GRAIN0 = [[-36, 44], [-12, 46], [12, 44], [36, 46], [-20, 22]], GRAIN1 = [[-49, 36], [-49, 12], [-49, -12], [-49, -36], [-27, 26]];
  const tipArt = () => {
    const body = 'M80 -40V560C80 760 200 880 300 880C400 880 520 760 520 560V-40Z';
    return L(body, '#efe0bd', {depth: 14, rim: .5}) + `<clipPath id="sx-tipclip"><path d="${body}"/></clipPath><g clip-path="url(#sx-tipclip)">` +
      [0, 1, 2].map(c => [0, 1, 2].map(r => `<rect x="${110 + c * 127}" y="${-40 + r * 150}" width="127" height="150" fill="${['#f2e6c6', '#ecdcb6', '#f5ead0'][(c + r) % 3]}" stroke="#a5835b" stroke-width="6"/>`).join('')).join('') +
      CELLS.map(([x, y], i) => `<rect x="${x - 65}" y="${y - 60}" width="130" height="120" rx="10" fill="${i % 2 ? '#f7ecd2' : '#f1e3c2'}" stroke="#9b7b55" stroke-width="6"/><circle cx="${x + 34}" cy="${y - 30}" r="13" fill="#c99a6b" opacity=".8"/>`).join('') +
      `<path d="M120 800C200 900 400 900 480 800L520 900H80Z" fill="#e3caa0" opacity=".7"/></g>` +
      `<path d="${body}" fill="none" stroke="#7d5d3d" stroke-width="8"/>`;
  };
  const grainArt = () => A.gouache('M2 12C2 4 8 1 13 1C19 1 24 5 24 12C24 19 19 24 13 24C7 24 2 19 2 12Z', {fill: '#6e6fb8', id: 'sx-grain', lit, strength: .55}) + '<circle cx="9" cy="8" r="3.5" fill="#d9dcff" opacity=".8"/>';
  const arrowArt = () => L('M60 0H120V300H170L90 420L10 300H60Z', '#e2a33b', {depth: 7, rim: .5});

  // ---------- bend: sideways root of paper cells ----------
  const cellSeg = () => L('M0 4Q0 0 4 0H62Q66 0 66 4V66Q66 70 62 70H4Q0 70 0 66Z', '#e6d3ab', {depth: 0, rim: .25}) +
    '<rect x="3" y="3" width="60" height="31" fill="#f3e7c9" stroke="#9b7b55" stroke-width="4"/><rect x="3" y="36" width="60" height="31" fill="#e2cda2" stroke="#9b7b55" stroke-width="4"/>' +
    '<circle cx="46" cy="16" r="6" fill="#c99a6b" opacity=".7"/><circle cx="18" cy="52" r="6" fill="#c99a6b" opacity=".7"/>';
  const auxSeg = () => '<rect x="5" y="40" width="56" height="25" rx="8" fill="#f08a24" opacity=".28"/>' + [[16, 54], [33, 48], [49, 56], [24, 61]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#f07a18"/>`).join('');
  const capArt = () => L('M0 4Q0 0 6 0H30C64 0 84 18 84 35C84 52 64 70 30 70H6Q0 70 0 66Z', '#ead2a6', {depth: 0, rim: .3}) + '<path d="M30 6C56 8 74 20 76 35" stroke="#b08a5d" stroke-width="4" fill="none"/>';
  const deepArt = () => A.strata(W, -10, [{h: VH * .35, color: '#6c4a31', pebbles: 10}, {h: VH * .4, color: '#5d3f2a', pebbles: 12}, {h: VH, color: '#4c3322', pebbles: 14}], {seed: 12, lit, texture: 'sx-paper'});

  // ---------- leaves ----------
  const leafArt = flip => `<g transform="${flip ? 'translate(160 0) scale(-1 1)' : ''}">` + L('M150 190C120 120 60 70 8 64C20 130 70 186 150 190Z', '#7fb24f', {depth: 6, rim: .6}) + '<path d="M146 186C110 140 66 100 22 76" stroke="#5c8a36" stroke-width="5" fill="none"/></g>';

  globalThis.paperTopic = {
    shots: [{id: 'hook', scene: 'w-hook', accent: '#b07a46', transition: {type: 'dissolve', symbol: 'g-deep', lead: .35, tail: .4, zoom: .2}},
      {id: 'tip', scene: 'w-tip', accent: '#6e6fb8'}, {id: 'bend', scene: 'w-bend', accent: '#f07a18'}, {id: 'rise', scene: 'w-rise', accent: '#6f9a4e'}],
    css: K.css + ' .piece-art { filter:none }',
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}, hook: {text: 'తలకిందులుగా నాటిన విత్తనం?', highlight: 'తలకిందులుగా', until: 2.4}},
    symbols: () => {
      const r = document.querySelector('.story-stage').getBoundingClientRect();
      VH = Math.round(W * r.height / r.width);
      const vb = `0 0 ${W} ${VH}`;
      return A.textures('sx', {tile: 340, seed: 5}) + [sym('g-sky', vb, skyArt()), sym('g-soil', vb, soilArt()), sym('g-grass', vb, grassArt()),
        sym('g-bean-up', '0 0 220 150', bean(180)), sym('g-bean-side', '0 0 220 150', bean(0)),
        sym('g-rseg', '0 0 34 24', segArt('#efe1bf', '#b9946a', 24)), sym('g-sseg', '0 0 34 26', segArt('#a9cf7c', '#5f8c3e', 26)),
        sym('g-deep', vb, deepArt()), sym('g-tip', '0 0 600 900', tipArt()), sym('g-grain', '0 0 26 26', grainArt()), sym('g-arrow', '0 0 180 420', arrowArt()),
        sym('g-cell', '0 0 66 70', cellSeg()), sym('g-aux', '0 0 66 70', auxSeg()), sym('g-cap', '0 0 84 70', capArt()),
        sym('g-leaf-l', '0 0 160 200', leafArt(false)), sym('g-leaf-r', '0 0 160 200', leafArt(true))].join('');
    },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const at = ([x, y], rot = 0, s = 1, o = 1) => [(x - 500) / W, (y - VH / 2) / VH, rot, s, o];        // stage-centred track value
      const piece = (id, art, wPx, layer, extra = {}) => P(id, art, 50, 50, wPx / W * 100, layer, {flat: true, ...extra});
      const label = (id, x, y, w, text, style, extra = {}) => P(id, null, x, y, w, 5, {label: text, labelStyle: style, ...extra});
      const hold = (id, frames) => track(id, frames.map(([t, v]) => key(t, v, 'hold')));
      const grow = (id, pose, t, dur = .18) => track(id, [key(0, at(pose.c, pose.h, .4, 0)), key(t, at(pose.c, pose.h, .4, 0)), key(t + dur, at(pose.c, pose.h, 1, 1), 'out')]);
      const g = G(), seedUp = [500, VH * .62], seedSide = [250, VH * .66];
      const s1 = S('hook'), s2 = S('tip'), s3 = S('bend'), s4 = S('rise'), end = s4.end, fps = 30;

      // ---------- hook: root climbs then dives; shoot hooks round and climbs toward the surface ----------
      const rootH = chain([seedUp[0] + 34, seedUp[1] - 66], hookHeadings(-90, 90, 30, [2, 13]), 22);
      const shootH = chain([seedUp[0] - 30, seedUp[1] + 66], hookHeadings(90, 270, 34, [1, 13]), 22);       // hooks the other way (left) so the organs never cross
      const tr = cue('root'), ts = cue('shoot');
      const hookObjs = [plate('h-sky', 'g-sky', 0), plate('h-soil', 'g-soil', 1), plate('h-grass', 'g-grass', 2),
        ...rootH.map((p, i) => piece(`h-r${i}`, 'g-rseg', 34, 3)), ...shootH.map((p, i) => piece(`h-s${i}`, 'g-sseg', 34, 3)),
        piece('h-seed', 'g-bean-up', 300, 3, {required: true}),
        label('h-lroot', (rootH.at(-1).c[0] + 90) / W * 100, (rootH.at(-1).c[1] - 30) / VH * 100, 16, T.root, 'chip'), label('h-lshoot', (shootH.at(-1).c[0] - 95) / W * 100, (shootH.at(-1).c[1] + 40) / VH * 100, 18, T.shoot, 'chip')];
      track('h-seed', [key(0, at(seedUp, 0, 1, 1)), key(s1.end, at(seedUp, 0, 1, 1))]);
      rootH.forEach((p, i) => grow(`h-r${i}`, p, tr + i * 1.5 / rootH.length));
      shootH.forEach((p, i) => grow(`h-s${i}`, p, ts + i * 1.25 / shootH.length));
      kit.label('h-lroot', tr + 1.3); kit.label('h-lshoot', ts + 1.1);

      // ---------- tip: grains rest; the root tips over; the grains slide to the new floor ----------
      const TC = [500, VH * .5], r0 = cue('grains') + .7, r1 = r0 + 1.0, sl = cue('slide'), theta = t => -90 * ease((t - r0) / (r1 - r0));
      const grainAt = (cell, gi, t) => { const th = R(theta(t)), k = ease((t - sl - gi * .05) / .6), [gx, gy] = [0, 1].map(j => GRAIN0[gi][j] + (GRAIN1[gi][j] - GRAIN0[gi][j]) * k);
        const vx = cell[0] + gx - 300, vy = cell[1] + gy - 450; return [TC[0] + vx * Math.cos(th) - vy * Math.sin(th), TC[1] + vx * Math.sin(th) + vy * Math.cos(th)]; };
      const tipObjs = [plate('t-deep', 'g-deep', 0), piece('t-tip', 'g-tip', 600, 2),
        ...CELLS.flatMap((c, ci) => GRAIN0.map((_, gi) => piece(`t-g${ci}-${gi}`, 'g-grain', 26, 2))),
        piece('o-arrow', 'g-arrow', 120, 4), label('l-grains', 50, 12, 52, T.grains, 'accent', {accent: '#6e6fb8'}), label('l-signal', 74, 74, 40, T.signal, 'chip')];
      const tf = []; for (let f = Math.floor((s2.start - .4) * fps); f / fps <= s2.end + .5; f++) tf.push(f / fps);
      hold('t-tip', tf.map(t => [t, at(TC, theta(t))]));
      CELLS.forEach((c, ci) => GRAIN0.forEach((_, gi) => hold(`t-g${ci}-${gi}`, tf.map(t => [t, at(grainAt(c, gi, t), theta(t))]))));
      track('o-arrow', [key(0, at([870, VH * .3], 0, .8, 0)), key(sl, at([870, VH * .3], 0, .8, 0)), key(sl + .4, at([870, VH * .36], 0, 1, 1), 'out')]); motion.speechCue('slide', 'o-arrow');
      kit.label('l-grains', 'grains'); kit.label('l-signal', 'signal');

      // ---------- bend: cells; auxin below; upper side grows; the root bends down ----------
      const NB = 11, LB = 64, wts = Array.from({length: NB}, (_, i) => Math.max(0, i - 3) ** 1.2), b0 = cue('grow') - .7, b1 = cue('grow') + 2.1;
      const phi = t => 78 * ease((t - b0) / (b1 - b0)), poseB = t => chain([-40, VH * .42], bendHeadings(0, phi(t), wts), LB);
      const bf = []; for (let f = Math.floor((s3.start - .4) * fps); f / fps <= s3.end + .5; f++) bf.push(f / fps);
      const bendObjs = [plate('b-deep', 'g-deep', 0), ...Array.from({length: NB}, (_, i) => piece(`b-s${i}`, 'g-cell', 66, 3, i === 8 ? {required: true} : {})),
        ...Array.from({length: NB}, (_, i) => piece(`b-a${i}`, 'g-aux', 66, 3)), piece('b-cap', 'g-cap', 84, 3),
        label('l-auxin', 38, 56, 34, T.auxin, 'accent', {accent: '#f07a18'}), label('l-grow', 46, 30, 66, T.grow, 'chip')];
      const auxOn = i => cue('lower') + (i - 4) * .12;
      for (let i = 0; i < NB; i++) {
        hold(`b-s${i}`, bf.map(t => { const p = poseB(t)[i]; return [t, at(p.c, p.h)]; }));
        hold(`b-a${i}`, bf.map(t => { const p = poseB(t)[i]; return [t, at(p.c, p.h, 1, i < 4 ? 0 : ease((t - auxOn(i)) / .35))]; }));
      }
      hold('b-cap', bf.map(t => { const ps = poseB(t), p = ps.at(-1), h = R(p.h); return [t, at([p.end[0] + Math.cos(h) * 38, p.end[1] + Math.sin(h) * 38], p.h)]; }));
      motion.speechCue('lower', 'b-a4');
      kit.label('l-auxin', 'auxin'); kit.label('l-grow', 'grow');

      // ---------- rise: the stem grows sideways, curls up through the surface; two leaves open ----------
      const NS = 15, LS = 40, sg0 = s4.start - .2, sg1 = cue('up') - 1.4, u0 = s4.start + .6, u1 = cue('up') - .1;
      const sw = Array.from({length: NS}, (_, i) => i < 8 ? 1 : 0);               // bends early, then rises straight
      const poseS = t => chain([seedSide[0] + 96, seedSide[1] - 10], bendHeadings(0, -90 * ease((t - u0) / (u1 - u0)), sw), LS);
      const rootS = chain([seedSide[0] - 80, seedSide[1] + 20], hookHeadings(180, 90, 22, [0, 9]), 22);
      const tipEnd = poseS(end).at(-1), leafBase = tipEnd.end;
      const sf = []; for (let f = Math.floor((s4.start - .4) * fps); f / fps <= end + 1e-9; f++) sf.push(f / fps);
      const riseObjs = [plate('p-sky', 'g-sky', 0), plate('p-soil', 'g-soil', 1),
        ...rootS.map((p, i) => piece(`p-r${i}`, 'g-rseg', 34, 3)), ...Array.from({length: NS}, (_, i) => piece(`p-s${i}`, 'g-sseg', 46, 3)),
        piece('p-seed', 'g-bean-side', 220, 3), plate('p-grass', 'g-grass', 4),
        piece('p-leaf-l', 'g-leaf-l', 150, 4, {origin: '94% 95%'}), piece('p-leaf-r', 'g-leaf-r', 150, 4, {origin: '6% 95%', required: true}),
        label('l-stem', 72, 72, 26, T.stem, 'chip')];
      track('p-seed', [key(0, at(seedSide)), key(end, at(seedSide))]);
      rootS.forEach((p, i) => track(`p-r${i}`, [key(0, at(p.c, p.h)), key(end, at(p.c, p.h))]));
      for (let i = 0; i < NS; i++) { const on = sg0 + (sg1 - sg0) * i / NS;
        hold(`p-s${i}`, sf.map(t => { const p = poseS(t)[i]; return [t, at(p.c, p.h, .5 + .5 * ease((t - on) / .25), ease((t - on) / .2))]; })); }
      const lb = [leafBase[0] - 70, leafBase[1] - 90], rb = [leafBase[0] + 70, leafBase[1] - 90];
      track('p-leaf-l', [key(0, at(lb, 30, .2, 0)), key(cue('up'), at(lb, 30, .2, 0)), key(cue('up') + .55, at(lb, -8, 1, 1), 'overshoot')]);
      track('p-leaf-r', [key(0, at(rb, -30, .2, 0)), key(cue('up') + .08, at(rb, -30, .2, 0)), key(cue('up') + .63, at(rb, 8, 1, 1), 'overshoot')]);
      motion.speechCue('up', 'p-leaf-l');
      kit.label('l-stem', 'stem');

      const scenes = {'w-hook': {objects: hookObjs}, 'w-tip': {objects: tipObjs}, 'w-bend': {objects: bendObjs}, 'w-rise': {objects: riseObjs}};
      const cameras = {
        hook: kit.travel('hook', [[s1.start, 0, .06, 1.12], [tr, 0, .07, 1.08], [s1.end, 0, .05, 1.0]]),
        tip: kit.travel('tip', [[s2.start, 0, 0, 1.0], [s2.end, 0, 0, 1.04]]),
        bend: kit.travel('bend', [[s3.start, 0, 0, 1.0], [s3.end, 0, .02, 1.05]]),
        rise: kit.travel('rise', [[s4.start, 0, .06, 1.08], [end, 0, -.02, 1.0]]),
      };
      return {scenes, cameras, checks: {keyframes: [['hook', ts + 1.6], ['bend', cue('grow') + 2.3], ['rise', cue('up') + .6]]}};
    },
    composition: {
      hook: {regions: [{id: 'h-seed'}], annotations: [{id: 'h-lroot', target: 'h-seed'}]},
      bend: {regions: [{id: 'b-s8'}, {id: 'b-cap'}]},
      rise: {regions: [{id: 'p-leaf-l'}, {id: 'p-leaf-r'}]},
    },
  };
})();
