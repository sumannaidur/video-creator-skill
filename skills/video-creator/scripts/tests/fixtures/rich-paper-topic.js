// P018.3 Paper Explainer richness fixture (test only; an unseen topic, not a template): "why does a volcano erupt?" in
// Telugu, full-bleed. Three shots in one consistent paper world lit by a low sun from the upper left:
//   land    - layered landscape (sky + sun halo, hazed far ridges, gouache volcano, cut-paper village and trees); the camera
//             drifts in and down while a dashed arrow points beneath the ground; dissolves into the section.
//   section - cross-section of the same volcano: textured strata, a glowing magma chamber and the conduit.
//   erupt   - matched on the crater: the camera pulls back from the vent while the ground shakes, lava bursts out as
//             cut-paper embers, ash billows and lava runs down the flanks.
// options.rich === false renders the same composition with the pre-P018.3 means only (flat fills, no light, texture,
// haze, particles or camera travel), for before/after comparison.
(() => {
  const {sym, rnd} = globalThis.paperShotArt;
  const K = globalThis.paperKit, A = K.art;
  const RICH = globalThis.paperTopicOptions?.rich !== false;
  const T = {inside: 'లోపల', magma: 'శిలాద్రవం', pressure: 'ఒత్తిడి'};
  const W = 1000;
  let VH = 1778;
  const lit = A.light({dir: [.62, .78]});
  const tex = RICH ? 'vx-paper' : null, gtex = RICH ? 'vx-gouache' : null;
  const crater = () => [500, VH * .392];
  // cut-paper layer or a flat fill (before)
  const layer = (d, fill, o = {}) => RICH ? A.cut(d, {fill, lit, texture: tex, ...o}) : `<path d="${d}" fill="${fill}"/>`;
  const vol = (d, fill, id, o = {}) => RICH ? A.gouache(d, {fill, id, lit, texture: gtex, ...o}) : `<path d="${d}" fill="${fill}"/>`;

  const cone = (top, base, wTop, wBase) => {
    const [cx] = crater();
    return `M${cx - wBase} ${base}C${cx - wBase * .55} ${base - 40} ${cx - wTop * 1.4} ${top + 120} ${cx - wTop} ${top}` +
      `Q${cx} ${top + 34} ${cx + wTop} ${top}C${cx + wTop * 1.4} ${top + 120} ${cx + wBase * .55} ${base - 40} ${cx + wBase} ${base}Z`;
  };
  const house = (x, y, s, wall, roof) => {
    const body = `M${x} ${y}h${70 * s}v${-55 * s}h${-70 * s}Z`, top = `M${x - 8 * s} ${y - 55 * s}L${x + 35 * s} ${y - 95 * s}L${x + 78 * s} ${y - 55 * s}Z`;
    return layer(body, wall, {depth: 5, rim: .4}) + layer(top, roof, {depth: 5, rim: .5}) +
      `<rect x="${x + 22 * s}" y="${y - 30 * s}" width="${14 * s}" height="${16 * s}" fill="#3b2f2a" opacity=".75"/>`;
  };
  const tree = (x, y, s, leaf) => layer(`M${x - 4 * s} ${y}h${8 * s}v${-60 * s}h${-8 * s}Z`, '#6b4a33', {depth: 4, rim: 0}) +
    layer(`M${x} ${y - 150 * s}C${x + 46 * s} ${y - 140 * s} ${x + 50 * s} ${y - 60 * s} ${x} ${y - 52 * s}C${x - 50 * s} ${y - 60 * s} ${x - 46 * s} ${y - 140 * s} ${x} ${y - 150 * s}Z`, leaf, {depth: 7});

  // ---------- land ----------
  const skyArt = (id, dusk = false) => RICH
    ? A.sky(W, VH, {id, top: dusk ? '#6e4a5c' : '#e9b994', bottom: dusk ? '#e0875a' : '#f6e3c4', sun: dusk ? null : {x: 230, y: VH * .17, r: 62, color: '#f2a94a', halo: '#ffe7b0'}}) +
      `<rect width="${W}" height="${VH}" fill="url(#vx-paper)"/>`
    : `<rect width="${W}" height="${VH}" fill="${dusk ? '#c9876a' : '#f0d9bb'}"/>` + (dusk ? '' : `<circle cx="230" cy="${VH * .17}" r="62" fill="#f2a94a"/>`);
  const farArt = () => layer(A.ridge(W, VH * .53, VH, {seed: 4, amp: 150, n: 5}), '#a9b7b4', {depth: 6, rim: .3}) +
    (RICH ? A.haze(W, VH * .42, VH * .3, {id: 'vx-haze1', color: '#f3e2c8', opacity: .6}) : '') +
    layer(A.ridge(W, VH * .6, VH, {seed: 9, amp: 110, n: 4}), '#8aa197', {depth: 8, rim: .35}) +
    (RICH ? A.haze(W, VH * .56, VH * .2, {id: 'vx-haze2', color: '#f3e2c8', opacity: .38}) : '');
  const coneArt = () => {
    const [, cy] = crater(), base = VH * .72;
    return vol(cone(cy, base, 70, 360), '#9a5d3e', 'vx-cone', {strength: .42}) +
      (RICH ? `<path d="${cone(cy, base, 70, 360)}" fill="url(#vx-speckle)"/>` : '') +
      // gullies (clipped to the cone) and the crater lip
      (RICH ? `<clipPath id="vx-cone-clip"><path d="${cone(cy, base, 70, 360)}"/></clipPath><g clip-path="url(#vx-cone-clip)">` +
        [-.5, -.18, .2, .52].map(k => `<path d="M${500 + k * 120} ${cy + 30}Q${500 + k * 260} ${cy + 220} ${500 + k * 430} ${base + 20}" fill="none" stroke="#5e3626" stroke-width="7" opacity=".4" stroke-linecap="round"/>`).join('') + '</g>' : '') +
      `<path d="M430 ${cy}Q500 ${cy - 22} 570 ${cy}Q500 ${cy + 30} 430 ${cy}Z" fill="#3d2620"/>` +
      (RICH ? `<path d="M440 ${cy - 2}Q500 ${cy - 18} 560 ${cy - 2}" fill="none" stroke="#f3c9a0" stroke-width="5" opacity=".6"/>` : '');
  };
  const groundArt = () => {
    const y1 = VH * .7, y2 = VH * .8;
    return layer(`${A.wave(W, y1, {seed: 3, amp: 26})}L${W} ${VH}L0 ${VH}Z`, '#8ea661', {depth: 10}) +
      (RICH ? Array.from({length: 7}, (_, i) => `<path d="M${-40 + i * 160} ${y1 + 60 + i * 8}q90 -20 180 0" stroke="#7a9352" stroke-width="10" fill="none" opacity=".55" stroke-linecap="round"/>`).join('') : '') +
      house(110, y1 + 12, 1.1, '#f1e3c6', '#bf5942') + house(215, y1 + 30, .9, '#e8d7b8', '#a94c3a') + house(300, y1 + 4, 1, '#f4e8cf', '#c76a46') +
      layer(`${A.wave(W, y2, {seed: 8, amp: 22})}L${W} ${VH}L0 ${VH}Z`, '#6f8b4d', {depth: 12});
  };
  const treesArt = () => tree(760, VH * .79, 1.15, '#4f7a46') + tree(860, VH * .8, .9, '#5c8a4f') + tree(690, VH * .82, .8, '#46703f') + tree(80, VH * .86, 1, '#4f7a46');
  const cloudArt = (seed, rx) => RICH ? A.layered(200, 90, rx, rx * .38, {seed, fill: '#fff8ec', under: '#e2cfb5', depth: [8, 10]}) : `<ellipse cx="200" cy="90" rx="${rx}" ry="${rx * .38}" fill="#fff8ec"/>`;
  const arrowArt = () => {
    const [cx, cy] = crater();
    return A.connector([[cx, cy + 60], [cx, VH * .86]], {width: 7, dash: '18 14', color: '#3a2c24'}) +
      `<path d="M${cx - 28} ${VH * .86 - 34}L${cx} ${VH * .86 + 6}L${cx + 28} ${VH * .86 - 34}" fill="none" stroke="#3a2c24" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  // ---------- section ----------
  const sectionArt = () => {
    const g = VH * .36, [cx] = crater();
    return (RICH ? A.sky(W, g + 40, {id: 'vx-ssky', top: '#e9b994', bottom: '#f6e3c4'}) : `<rect width="${W}" height="${g + 40}" fill="#f0d9bb"/>`) +
      vol(`M${cx - 330} ${g + 10}C${cx - 200} ${g - 30} ${cx - 110} ${VH * .2} ${cx - 60} ${VH * .17}L${cx + 60} ${VH * .17}C${cx + 110} ${VH * .2} ${cx + 200} ${g - 30} ${cx + 330} ${g + 10}Z`, '#9a5d3e', 'vx-scone', {strength: .4}) +
      (RICH ? A.strata(W, g, [{h: 90, color: '#7d5b3c', pebbles: 10}, {h: 260, color: '#a1805f', pebbles: 14}, {h: 330, color: '#77604c', pebbles: 12}, {h: VH, color: '#54433a', pebbles: 16}], {seed: 5, lit, texture: 'vx-paper'})
        : [[g, '#7d5b3c'], [g + 90, '#a1805f'], [g + 350, '#77604c'], [g + 680, '#54433a']].map(([y, c]) => `<rect y="${y}" width="${W}" height="${VH}" fill="${c}"/>`).join('')) +
      // the conduit from the chamber to the crater
      `<path d="M${cx - 26} ${VH * .17}L${cx - 30} ${VH * .62}L${cx + 30} ${VH * .62}L${cx + 26} ${VH * .17}Z" fill="#3a2520"/>` +
      (RICH ? `<path d="M${cx - 24} ${VH * .45}L${cx - 28} ${VH * .62}L${cx + 28} ${VH * .62}L${cx + 24} ${VH * .45}Z" fill="#d9542b" opacity=".85"/>` : '');
  };
  const chamberArt = () => (RICH ? A.gouache(`M40 160C40 60 180 20 300 26C440 30 560 70 560 160C560 250 430 300 300 296C160 292 40 250 40 160Z`, {fill: '#e0552b', id: 'vx-ch', lit, strength: .5, texture: 'vx-gouache'}) +
      `<path d="M150 150C170 100 260 80 330 90C400 100 440 130 430 160" fill="none" stroke="#ffc76a" stroke-width="10" opacity=".7" stroke-linecap="round"/>`
      : `<path d="M40 160C40 60 180 20 300 26C440 30 560 70 560 160C560 250 430 300 300 296C160 292 40 250 40 160Z" fill="#e0552b"/>`);
  const glowArt = () => !RICH ? '<ellipse cx="400" cy="220" rx="330" ry="170" fill="#ff7a2f" opacity=".22"/>' : `<defs><radialGradient id="vx-glow"><stop offset="0" stop-color="#ffb347" stop-opacity=".75"/><stop offset=".5" stop-color="#ff7a2f" stop-opacity=".3"/><stop offset="1" stop-color="#ff7a2f" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="400" cy="220" rx="390" ry="210" fill="url(#vx-glow)"/>`;
  // ---------- erupt ----------
  const lavaArt = () => {
    const [cx, cy] = crater(), base = VH * .72;
    return [[-1, 0], [1, 1], [-.4, 2], [.55, 3]].map(([k, i]) =>
      `<path d="M${cx + k * 30} ${cy + 6}C${cx + k * 70} ${cy + 140} ${cx + k * (150 + i * 30)} ${cy + 260} ${cx + k * (220 + i * 40)} ${base - 40 - i * 30}" fill="none" stroke="#e8562a" stroke-width="${22 - i * 3}" stroke-linecap="round"/>` +
      (RICH ? `<path d="M${cx + k * 30} ${cy + 6}C${cx + k * 70} ${cy + 140} ${cx + k * (150 + i * 30)} ${cy + 260} ${cx + k * (220 + i * 40)} ${base - 40 - i * 30}" fill="none" stroke="#ffc56a" stroke-width="${6 - i}" stroke-linecap="round" opacity=".85"/>` : '')).join('');
  };
  const emberArt = () => RICH ? A.cut('M30 6C48 8 56 24 52 38C48 52 30 58 18 50C6 42 4 22 14 12C18 8 24 6 30 6Z', {fill: '#f06a2c', depth: 4, rim: .7, lit}) +
    '<circle cx="24" cy="22" r="7" fill="#ffd27a" opacity=".8"/>' : '<circle cx="30" cy="30" r="24" fill="#f06a2c"/>';
  // ash: a cluster of overlapping cut-paper puffs, lit from the upper left (lighter tops, darker undersides)
  const ashArt = seed => RICH ? [[200, 210, 120, .0], [110, 190, 82, .1], [295, 195, 88, .05], [150, 120, 78, .18], [255, 112, 84, .22], [205, 70, 62, .3]].map(([x, y, r, k], i) =>
      A.cut(`M${x - r} ${y}C${x - r} ${y - r * .9} ${x + r} ${y - r * .9} ${x + r} ${y}C${x + r} ${y + r * .7} ${x - r} ${y + r * .7} ${x - r} ${y}Z`, {fill: A.mix('#77716b', '#d8d2ca', k + rnd(seed + i) * .12), depth: 9, lit, rim: .45, texture: 'vx-gouache'})).join('')
    : `<ellipse cx="200" cy="160" rx="170" ry="120" fill="#8a8580"/>`;
  const duskArt = () => skyArt('vx-dusk', true);

  globalThis.paperTopic = {
    shots: [
      {id: 'land', scene: 'v-land', accent: '#bf5942', ...(RICH ? {transition: {type: 'dissolve', symbol: 'v-section', lead: .35, tail: .4, zoom: .2}} : {})},
      {id: 'section', scene: 'v-section-scene', accent: '#d9542b'},
      {id: 'erupt', scene: 'v-erupt', accent: '#e8562a'},
    ],
    css: K.css + (RICH ? ' .piece-art { filter:none }' : ''),
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'},
      hook: {text: 'అగ్నిపర్వతం ఎందుకు బద్దలవుతుంది?', highlight: 'అగ్నిపర్వతం', until: 1.9}},
    symbols: () => {
      const r = document.querySelector('.story-stage').getBoundingClientRect();
      VH = Math.round(W * r.height / r.width);
      const vb = `0 0 ${W} ${VH}`;
      return (RICH ? A.textures('vx', {tile: 340, seed: 11}) : '') + [
        sym('v-sky', vb, skyArt('vx-sky')), sym('v-far', vb, farArt()), sym('v-cone', vb, coneArt()), sym('v-ground', vb, groundArt()),
        sym('v-trees', vb, treesArt()), sym('v-cloud-a', '0 0 400 200', cloudArt(3, 150)), sym('v-cloud-b', '0 0 400 200', cloudArt(7, 120)),
        sym('v-arrow', vb, arrowArt()), sym('v-section', vb, sectionArt()), sym('v-chamber', '0 0 600 320', chamberArt()), sym('v-glow', '0 0 800 440', glowArt()),
        sym('v-lava', vb, lavaArt()), sym('v-ember', '0 0 60 60', emberArt()), sym('v-ash-a', '0 0 400 320', ashArt(4)), sym('v-ash-b', '0 0 400 320', ashArt(9)),
        sym('v-dusk', vb, duskArt()),
      ].join('');
    },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const [, cyPx] = crater(), cy = cyPx / VH * 100;
      const label = (id, x, y, w, text, style, extra = {}) => P(id, null, x, y, w, 5, {label: text, labelStyle: style, ...extra});
      const EMBERS = RICH ? Array.from({length: 14}, (_, i) => P(`e-p${i}`, 'v-ember', 50, cy + 1, 2.6 + (i % 3) * .8, 4, {flat: true})) : [];
      const scenes = {
        'v-land': {objects: [plate('l-sky', 'v-sky', 0), P('l-cloud-a', 'v-cloud-a', 72, 20, 40, 1), P('l-cloud-b', 'v-cloud-b', 24, 33, 30, 1),
          plate('l-far', 'v-far', 1), plate('l-cone', 'v-cone', 2), plate('l-arrow', 'v-arrow', 3), plate('l-ground', 'v-ground', 4), plate('l-trees', 'v-trees', 5),
          label('l-tag', 64, 64, 30, T.inside, 'chip')]},
        'v-section-scene': {objects: [plate('s-bg', 'v-section', 0), P('s-glow', 'v-glow', 50, 68, 92, 1, {flat: true}), P('s-chamber', 'v-chamber', 50, 67, 62, 2, {required: true}),
          label('s-tag', 74, 56, 34, T.magma, 'accent', {accent: '#d9542b'})]},
        'v-erupt': {objects: [plate('e-sky', 'v-sky', 0), plate('e-dusk', 'v-dusk', 0), P('e-cloud-a', 'v-cloud-a', 72, 20, 40, 1), plate('e-far', 'v-far', 1), plate('e-cone', 'v-cone', 2),
          plate('e-lava', 'v-lava', 2), ...(RICH ? [P('e-ash-a', 'v-ash-a', 50, cy - 8, 46, 3), P('e-ash-b', 'v-ash-b', 44, cy - 12, 36, 3), P('e-glow', 'v-glow', 50, cy + 2, 60, 3, {flat: true})] : []),
          ...EMBERS, plate('e-ground', 'v-ground', 4), plate('e-trees', 'v-trees', 5), label('e-tag', 30, 56, 28, T.pressure, 'chip')]},
      };
      // land: clouds drift; the arrow draws down beneath the volcano on "deep"; the inside tag follows
      if (RICH) { ambient('l-cloud-a', {drift: [.012, 7, 0]}); ambient('l-cloud-b', {drift: [.01, 6, 1.3]}); ambient('e-cloud-a', {drift: [.012, 7, 0]}); }
      const deep = kit.draw('l-arrow', 'deep', .7, 'down');
      kit.label('l-tag', deep + .45);
      // section: the chamber glows on "hot"; the magma tag lands on its word
      kit.settle('s-chamber', S('section').start + .1, [0, .02, 0, .96, 0], .5);
      const hot = kit.pulse('s-glow', 'hot', 2.4, .35, .4);
      if (RICH) ambient('s-chamber', {breathe: [.012, 1.1, 0]});
      kit.label('s-tag', 'magma');
      // erupt: dusk falls with the pressure, the tag appears, embers burst on "shoots", lava runs on "bursts"
      const pr = kit.label('e-tag', 'pressure');
      if (RICH) track('e-dusk', [key(S('erupt').start, [0, 0, 0, 1, 0]), key(pr + 1.2, [0, 0, 0, 1, .75])]);
      else track('e-dusk', [key(S('erupt').start, [0, 0, 0, 1, 0]), key(pr, [0, 0, 0, 1, 0]), key(pr + .01, [0, 0, 0, 1, .75])]);
      const shoot = RICH ? kit.burst(EMBERS.map(o => o.id), 'shoot', {spread: .2, rise: .2, fall: .14, dur: 1.5, seed: 4, stagger: .035}) : cue('shoot');
      if (RICH) { kit.billow('e-ash-a', shoot - .1, {dx: .03, dy: -.1, grow: 1.5, dur: 2.2}); kit.billow('e-ash-b', shoot + .15, {dx: -.04, dy: -.07, grow: 1.35, dur: 2}); kit.pulse('e-glow', shoot, 2, .2, .4); }
      kit.draw('e-lava', 'burst', .8, 'down');
      // cameras: drift in and down over the land; slow rise up the conduit; matched pull-back from the vent with a shake
      const [ex, ey] = [0, cy / 100 - .5];
      const cameras = RICH ? {
        land: kit.travel('land', [[S('land').start, 0, -.02, 1.04], [deep, 0, .02, 1.12], [S('land').end, 0, .08, 1.3, 'in']]),
        section: kit.travel('section', [[S('section').start, 0, .1, 1.18, 'out'], [hot, 0, .08, 1.1], [S('section').end, 0, -.12, 1.22]]),
        erupt: kit.travel('erupt', [[S('erupt').start, ex, ey, 1.9, 'out'], [pr - .05, ex, ey * .6, 1.45, 'out'], [pr + .08, ex + .006, ey * .6, 1.45], [pr + .16, ex - .006, ey * .6, 1.45],
          [pr + .24, ex + .004, ey * .6, 1.45], [pr + .32, ex, ey * .6, 1.45], [shoot, 0, ey * .25, 1.12, 'out'], [S('erupt').end, 0, .02, 1.04]]),
      } : {};
      return {scenes, cameras, checks: {keyframes: [['land', deep + .9], ['section', hot + .8], ['pressure', pr + .7], ['eruption', cue('burst') + .7]]}};
    },
  };
})();
