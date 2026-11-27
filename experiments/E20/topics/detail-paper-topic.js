// E20 / P022.2 "after" version of the P018.4 fixture: same art, words and cues; motion and camera re-directed (marked P022.2).
// P018.4 Paper Explainer construction fixture (test only; an unseen topic, not a template): "how does a canal lock lift
// a boat?" in English, full-bleed. Everything is built from components with the paperKit construction helpers plus
// topic-specific parts (narrowboat, timber gates, paddle gear), lit by one low sun from the upper left.
//   valley - side elevation of a hillside: lower and upper canal, a brick lock between, a village of detailed houses on
//            the upper level, trees, a narrowboat on the lower canal and the lock keeper waving; a dashed route climbs.
//   lock   - close cross-section of the lock chamber: coursed brick walls with coping, timber gates with iron straps and
//            balance beams; the lower gate closes, the keeper winds the paddle gear, water gushes in, the chamber fills
//            and the boat rises with it, then the top gate swings open. The camera follows the boat up.
(() => {
  const {sym, f, rnd, blob} = globalThis.paperShotArt;
  const K = globalThis.paperKit, A = K.art;
  const W = 1000;
  let VH = 1778;
  const lit = A.light({dir: [.6, .8]});
  const INK = '#2b2622';
  const C = (d, fill, o = {}) => A.cut(d, {fill, lit, depth: 5, rim: .4, ...o});
  const MAN = A.figure({skin: '#c58b62', hair: '#3a2c24', shirt: '#efe7d8', vest: '#2f5d62', trousers: '#4a4038', cap: '#3d3a52', scarf: '#c0533c'});

  // ---------- narrowboat (side view, bow to the right) in a 640x240 box; waterline at y=176 ----------
  const boat = () => {
    const hull = 'M30 120L560 120C590 122 614 132 628 150L612 188C596 196 572 198 540 198L70 198C46 198 30 190 24 176L20 140C20 128 24 122 30 120Z';
    const ports = [140, 200, 260, 320, 380].map(x => `<circle cx="${x}" cy="82" r="13" fill="#c9a04a"/><circle cx="${x}" cy="82" r="9" fill="#2c3d4a"/><path d="M${x - 5} 77a7 7 0 0 1 9 -1" stroke="#ffffff" stroke-opacity=".5" stroke-width="2" fill="none"/>`).join('');
    return C(hull, '#2f4f3a', {depth: 6, rim: .55}) +
      `<path d="M30 132L566 132C590 134 608 142 618 152" stroke="#b8402e" stroke-width="12" fill="none"/><path d="M30 146L560 146C584 148 600 156 610 166" stroke="#e2b54a" stroke-width="4" fill="none"/>` +
      `<path d="M24 176L612 176" stroke="#000000" stroke-opacity=".25" stroke-width="3"/>` +
      // cabin with roof rail, door, portholes, painted panel
      C('M92 120V52C92 46 96 42 102 42H468C474 42 478 46 478 52V120Z', '#8f2f2a', {depth: 4}) +
      `<rect x="86" y="34" width="398" height="12" rx="4" fill="#3b2a24"/><path d="M98 34V26H476V34" stroke="#c9a04a" stroke-width="3" fill="none"/>` +
      `<rect x="100" y="54" width="364" height="56" rx="6" fill="none" stroke="#e2b54a" stroke-width="3"/>` + ports +
      `<rect x="410" y="56" width="46" height="60" rx="4" fill="#efe2c0"/>` +
      [[433, 72, '#c0392b'], [423, 90, '#e8b04b'], [443, 92, '#d9534f'], [433, 104, '#4f7a46']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="7" fill="${c}"/>`).join('') +
      `<path d="M412 62L454 112M454 62L412 112" stroke="#2f4f3a" stroke-width="2" opacity=".35"/>` +
      `<rect x="102" y="58" width="30" height="58" rx="3" fill="#6d2420"/><circle cx="126" cy="88" r="3" fill="#c9a04a"/>` +
      // chimney with brass bands, roof clutter (pots, rope coil), tiller, fenders
      `<rect x="438" y="-6" width="18" height="40" fill="#2a2320"/><rect x="436" y="2" width="22" height="5" fill="#c9a04a"/><rect x="436" y="14" width="22" height="5" fill="#c9a04a"/>` +
      `<path d="M300 34c0-10 18-10 18 0z" fill="#a5523a"/><circle cx="304" cy="22" r="8" fill="#5c8a4f"/><circle cx="314" cy="20" r="7" fill="#e87ca0"/>` +
      `<ellipse cx="210" cy="30" rx="26" ry="7" fill="none" stroke="#c7a878" stroke-width="5"/><ellipse cx="210" cy="28" rx="16" ry="4" fill="none" stroke="#c7a878" stroke-width="4"/>` +
      `<path d="M30 118C18 100 10 84 24 70L58 62" stroke="#3b2a24" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="54" y="56" width="16" height="12" rx="4" fill="#c9a04a"/>` +
      `<path d="M598 150c10 10 10 30 0 40" stroke="#c7a878" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M36 150c-10 10-10 28 0 38" stroke="#c7a878" stroke-width="12" fill="none" stroke-linecap="round"/>` +
      [[180, '#3b2a24'], [330, '#3b2a24'], [500, '#3b2a24']].map(([x, c]) => `<rect x="${x}" y="150" width="34" height="18" rx="9" fill="#c7a878" stroke="${c}" stroke-opacity=".4" stroke-width="2"/>`).join('');
  };
  // ---------- timber lock gate (side elevation) in a 90xH box: planks, rails, iron straps, bolts ----------
  const gate = (h, open = false) => {
    if (open) return C(`M30 0H60V${h}H30Z`, '#5a4232', {depth: 4}) + `<path d="M45 10V${h - 10}" stroke="#000000" stroke-opacity=".25" stroke-width="3"/>`;
    let s = C(`M8 0H82V${h}H8Z`, '#6b4f39', {depth: 6, rim: .45});
    for (let i = 1; i < 5; i++) s += `<path d="M${8 + i * 14.8} 4V${h - 4}" stroke="#000000" stroke-opacity=".2" stroke-width="2"/>`;
    for (let y = 30; y < h; y += h / 6) s += `<rect x="4" y="${f(y)}" width="82" height="18" rx="3" fill="#5a4232"/><rect x="4" y="${f(y + 6)}" width="82" height="6" fill="#3b3836"/>` +
      [14, 45, 76].map(x => `<circle cx="${x}" cy="${f(y + 9)}" r="3.5" fill="#8b8680"/>`).join('');
    return s + `<rect x="24" y="${f(h * .78)}" width="42" height="40" rx="4" fill="#2b2622"/>`;
  };
  const beam = len => C(`M0 6H${len}C${len + 10} 6 ${len + 14} 12 ${len + 14} 18C${len + 14} 24 ${len + 10} 30 ${len} 30H0Z`, '#5a4232', {depth: 5}) +
    `<rect x="${len - 30}" y="2" width="10" height="32" fill="#3b3836"/><path d="M6 12H${len - 40}" stroke="#ffffff" stroke-opacity=".18" stroke-width="3"/>`;
  // paddle gear: post, rack, cog (the keeper winds it)
  const paddleGear = () => C('M30 0H60V230H30Z', '#3b3836', {depth: 4}) + `<rect x="58" y="10" width="14" height="150" fill="#57524c"/>` +
    Array.from({length: 14}, (_, i) => `<rect x="70" y="${14 + i * 10}" width="7" height="5" fill="#57524c"/>`).join('') +
    `<circle cx="45" cy="70" r="26" fill="#4a4640"/><circle cx="45" cy="70" r="10" fill="#2a2724"/>` + Array.from({length: 10}, (_, i) => { const a = i * Math.PI / 5;
      return `<rect x="41" y="38" width="8" height="10" fill="#4a4640" transform="rotate(${f(a * 57.3)} 45 70)"/>`; }).join('') + `<rect x="10" y="222" width="70" height="14" rx="3" fill="#2a2724"/>`;
  const windlass = () => `<path d="M10 10L60 10L60 70" stroke="#57524c" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="10" cy="10" r="9" fill="#3b3836"/><rect x="52" y="64" width="16" height="22" rx="4" fill="#8a6a4a"/>`;
  const reeds = (x, y, n, seed) => Array.from({length: n}, (_, i) => { const xx = x + i * 9 + rnd(seed + i) * 6, h = 40 + rnd(seed + 20 + i) * 50;
    return `<path d="M${f(xx)} ${y}q${f(-6 + rnd(seed + 40 + i) * 12)} ${f(-h / 2)} ${f(-4 + rnd(seed + 60 + i) * 10)} ${f(-h)}" stroke="${i % 3 ? '#5f7f48' : '#7d9a5a'}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      (i % 4 === 0 ? `<ellipse cx="${f(xx + 2)}" cy="${f(y - h + 6)}" rx="4" ry="11" fill="#6b4a33"/>` : ''); }).join('');
  const lamp = (x, y) => `<rect x="${x - 4}" y="${y - 170}" width="8" height="170" fill="#2b2622"/><path d="M${x - 16} ${y - 170}h32l-6 -34h-20z" fill="#2b2622"/><rect x="${x - 10}" y="${y - 200}" width="20" height="26" fill="#f6d27a" opacity=".9"/><rect x="${x - 12}" y="${y - 6}" width="24" height="8" fill="#2b2622"/>`;
  const bollard = (x, y) => `<path d="M${x - 14} ${y}V${y - 30}C${x - 14} ${y - 44} ${x + 14} ${y - 44} ${x + 14} ${y - 30}V${y}Z" fill="#2b2622"/><rect x="${x - 18}" y="${y - 30}" width="36" height="6" fill="#3b3836"/>`;

  // ---------- valley (side elevation of the hillside) ----------
  const valley = () => {
    const up = VH * .5, low = VH * .74, lx0 = 470, lx1 = 640;
    const sky = A.sky(W, VH, {id: 'cx-sky', top: '#b9d3df', bottom: '#f1e6cf', sun: {x: 190, y: VH * .12, r: 58, color: '#f2c35a', halo: '#fff1c4'}}) + `<rect width="${W}" height="${VH}" fill="url(#cx-paper)"/>`;
    const far = C(A.ridge(W, VH * .36, VH, {seed: 3, amp: 120, n: 5}), '#9fb3a9', {depth: 6, rim: .25}) + A.haze(W, VH * .28, VH * .2, {id: 'cx-h1', color: '#eee3cb', opacity: .55});
    const upperGround = C(`M${lx1} ${up}H${W}V${VH}H${lx1}Z`, '#8ea661', {depth: 9}) +
      // terraced fields, a hedge line and a towpath on the hillside (environmental detail instead of an empty slab)
      Array.from({length: 7}, (_, i) => `<path d="M${lx1 + 10} ${f(up + 90 + i * 70)}C${lx1 + 140} ${f(up + 70 + i * 70)} ${W - 120} ${f(up + 110 + i * 70)} ${W} ${f(up + 85 + i * 70)}" stroke="${i % 2 ? '#7d9a52' : '#9db56c'}" stroke-width="34" fill="none" opacity=".7"/>`).join('') +
      `<path d="M${lx1} ${f(up + 30)}H${W}" stroke="#c9b48a" stroke-width="16"/>` +
      Array.from({length: 9}, (_, i) => A.cut(blob(lx1 + 30 + i * 42, up + 76, 30, 20, 9, .2, 50 + i), {fill: i % 2 ? '#4f7a46' : '#5f8a4f', depth: 5, lit, rim: .35})).join('') + C(`M0 ${low}H${lx1}V${VH}H0Z`, '#86a05a', {depth: 9});
    const lock = A.masonry(lx0, up + 6, lx1 - lx0, low - up + 60, {seed: 7, brick: [34, 15], gap: 2.4, lit}) + C(`M${lx0 - 6} ${up - 2}H${lx1 + 6}V${up + 14}H${lx0 - 6}Z`, '#c9c0ae', {depth: 3});
    const waterUp = A.water(lx1, up - 2, W - lx1, 46, {id: 'cx-w1', seed: 2, ripples: 6}), waterLow = A.water(0, low - 2, lx0, 60, {id: 'cx-w2', seed: 4, ripples: 9});
    const houses = A.facade(660, up - 4, 150, 230, {seed: 3, floors: 2, cols: 2, wall: '#ecd9b6', shutter: '#4f6b8a', lit, texture: 'cx-paper'}) +
      A.facade(822, up - 4, 170, 300, {seed: 5, floors: 3, cols: 2, wall: '#d9b48f', roof: '#7d4a3a', shutter: null, door: '#8f2f2a', lit, texture: 'cx-paper'});
    const trees = A.foliage(560, up - 210, 70, {seed: 4, lit, height: 200}) + A.foliage(120, low - 220, 90, {seed: 9, lit, height: 230}) + A.foliage(330, low - 160, 60, {seed: 12, lit, height: 160});
    const fore = C(`${A.wave(W, VH * .86, {seed: 6, amp: 18})}L${W} ${VH}L0 ${VH}Z`, '#6f8b4d', {depth: 10}) + reeds(30, VH * .87, 16, 3) + reeds(700, VH * .865, 14, 7) +
      bollard(420, low + 2) + lamp(700, up - 2);
    return {sky, far, ground: upperGround + lock + waterUp + waterLow + houses + fore, trees};
  };
  // ---------- lock chamber (cross-section) ----------
  const G = () => ({bank: VH * .4, floor: VH * .82, low: VH * .7, high: VH * .46, x0: 110, x1: 890});
  const chamber = () => {
    const g = G();
    const sky = A.sky(W, g.bank + 20, {id: 'cx-sky2', top: '#b9d3df', bottom: '#f1e6cf'}) + `<rect width="${W}" height="${g.bank + 20}" fill="url(#cx-paper)"/>`;
    const town = A.facade(40, g.bank - 30, 140, 190, {seed: 8, floors: 2, cols: 2, wall: '#e6d0ab', shutter: '#4f6b8a', lit, texture: 'cx-paper'}) +
      A.facade(196, g.bank - 30, 120, 150, {seed: 2, floors: 1, cols: 2, wall: '#d9b48f', roof: '#7d4a3a', lit, texture: 'cx-paper'}) +
      A.foliage(400, g.bank - 230, 80, {seed: 5, lit, height: 200}) + A.facade(560, g.bank - 30, 150, 210, {seed: 11, floors: 2, cols: 2, wall: '#efe0c4', shutter: '#5f7f48', lit, texture: 'cx-paper'});
    const bankStrip = C(`M0 ${g.bank - 30}H${W}V${g.bank + 30}H0Z`, '#8ea661', {depth: 6});
    const wall = A.masonry(g.x0, g.bank + 26, g.x1 - g.x0, g.floor - g.bank - 26, {seed: 3, brick: [56, 24], lit}) +
      `<rect x="${g.x0}" y="${f(g.floor - 8)}" width="${g.x1 - g.x0}" height="14" fill="#5a4c40"/>` +
      Array.from({length: 4}, (_, i) => `<path d="M${g.x0 + 80 + i * 200} ${g.bank + 40}V${f(g.floor - 20)}" stroke="#3b3836" stroke-width="5" stroke-dasharray="2 22" opacity=".5"/>`).join('');
    const coping = Array.from({length: 2}, (_, i) => C(`M${i ? g.x1 - 10 : 0} ${g.bank + 14}H${i ? W : g.x0 + 10}V${g.bank + 34}H${i ? g.x1 - 10 : 0}Z`, '#c9c0ae', {depth: 3})).join('') +
      C(`M${g.x0 - 20} ${g.bank + 10}H${g.x1 + 20}V${g.bank + 30}H${g.x0 - 20}Z`, '#c9c0ae', {depth: 3});
    return {sky, town: town + bankStrip, wall: wall + coping};
  };
  // the lower and upper pounds outside the gates, and the foreground section strata under everything
  const outside = () => {
    const g = G();
    return A.water(0, g.low, g.x0 - 6, g.floor - g.low + 120, {id: 'cx-w3', seed: 5, ripples: 4}) + A.water(g.x1 + 6, g.high, W - g.x1, g.floor - g.high + 120, {id: 'cx-w4', seed: 6, ripples: 6}) +
      A.masonry(0, g.floor + 6, W, 30, {seed: 9, brick: [56, 24], coping: null, lit}) +
      A.strata(W, g.floor + 30, [{h: 90, color: '#7d5b3c', pebbles: 8}, {h: VH, color: '#5d4636', pebbles: 12}], {seed: 4, lit, texture: 'cx-paper'});
  };
  const chamberWater = () => { const g = G(); return A.water(g.x0, g.low, g.x1 - g.x0, g.floor - g.high + 40, {id: 'cx-w5', seed: 8, ripples: 14}) + `<rect x="${g.x0}" y="${g.low}" width="${g.x1 - g.x0}" height="5" fill="#ffffff" opacity=".35"/>`; };
  const gush = () => `<path d="M60 20C30 30 10 50 4 80C30 60 50 50 80 46Z" fill="#cfe6ee"/><path d="M60 26C40 34 26 48 20 66" stroke="#ffffff" stroke-width="5" fill="none" opacity=".8"/>`;
  const drop = () => '<circle cx="12" cy="12" r="10" fill="#d9eef4"/><circle cx="9" cy="9" r="3" fill="#ffffff"/>';
  const riseArrow = () => `<path d="M40 280V40" stroke="${INK}" stroke-width="8" stroke-dasharray="20 14" stroke-linecap="round"/><path d="M14 66L40 30L66 66" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const route = () => { const v = VH; return A.connector([[300, v * .73], [430, v * .63], [560, v * .53], [760, v * .47]], {width: 7, dash: '18 14', color: INK, sag: -30}) +
    `<path d="M736 ${f(v * .47 - 26)}L768 ${f(v * .47)}L736 ${f(v * .47 + 22)}" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; };

  globalThis.paperTopic = {
    shots: [{id: 'valley', scene: 'k-valley', accent: '#8f2f2a', transition: {type: 'dissolve', symbol: 'k-wall', lead: .35, tail: .45, zoom: .18}},
      {id: 'lock', scene: 'k-lock', accent: '#2f5d62'}],
    css: K.css + ' .piece-art { filter:none }',
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}, hook: {text: 'How does a boat climb a hill?', highlight: 'climb', until: 1.3}},
    symbols: () => {
      const r = document.querySelector('.story-stage').getBoundingClientRect();
      VH = Math.round(W * r.height / r.width);
      const vb = `0 0 ${W} ${VH}`, v = valley(), c = chamber(), g = G();
      return A.textures('cx', {tile: 320, seed: 21}) + [
        sym('k-vsky', vb, v.sky), sym('k-vfar', vb, v.far), sym('k-vground', vb, v.ground), sym('k-vtrees', vb, v.trees), sym('k-route', vb, route()),
        sym('k-boat', '0 -10 640 250', boat()), sym('k-man-body', MAN.viewBox, MAN.body), sym('k-man-head', MAN.viewBox, MAN.head), sym('k-man-arm', MAN.viewBox, MAN.arm),
        sym('k-man-blink', MAN.viewBox, MAN.blink), sym('k-lsky', vb, c.sky), sym('k-town', vb, c.town), sym('k-wall', vb, c.wall), sym('k-outside', vb, outside()),
        sym('k-cwater', vb, chamberWater()), sym('k-gate', `0 0 90 ${f(g.floor - g.bank)}`, gate(g.floor - g.bank)), sym('k-gate-open', `0 0 90 ${f(g.floor - g.bank)}`, gate(g.floor - g.bank, true)),
        sym('k-beam', '0 0 300 36', beam(280)), sym('k-paddle', '0 0 90 240', paddleGear()), sym('k-windlass', '0 0 80 90', windlass()),
        sym('k-fore', '0 0 300 260', C('M0 260C20 170 60 120 120 150C150 90 210 80 240 150C262 120 290 140 300 260Z', '#3f5a35', {depth: 8, rim: .2}) + reeds(10, 260, 22, 31)),
        sym('k-gush', '0 0 90 90', gush()), sym('k-drop', '0 0 24 24', drop()), sym('k-rise', '0 0 80 290', riseArrow()),
      ].join('');
    },
    build(ctx) {
      const M = globalThis.vcMotion;
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const g = G(), pct = y => y / VH * 100, label = (id, x, y, w, text, style, extra = {}) => P(id, null, x, y, w, 5, {label: text, labelStyle: style, ...extra});
      const man = (prefix, x, y, w, layer = 4) => ['body', 'head', 'arm', 'blink'].map(p => P(`${prefix}-${p}`, `k-man-${p}`, x, y, w, layer,
        {flat: true, ...(p === 'arm' ? {origin: MAN.origin.arm} : p === 'head' ? {origin: MAN.origin.head} : {})}));
      const DROPS = Array.from({length: 10}, (_, i) => P(`l-drop${i}`, 'k-drop', 84, pct(g.floor - 190), 2.2, 4, {flat: true}));
      const scenes = {
        'k-valley': {objects: [plate('v-sky', 'k-vsky', 0), plate('v-far', 'k-vfar', 1, 'exact'), plate('v-ground', 'k-vground', 2, 'exact'), plate('v-trees', 'k-vtrees', 3, 'exact'),
          P('v-boat', 'k-boat', 24, pct(VH * .74 - 50 + 6), 30, 3, {flat: true}), ...man('v-man', 56, pct(VH * .5 - 88), 9, 4), plate('v-route', 'k-route', 4, 'exact'),
          label('v-tag', 54, pct(VH * .62), 22, 'lock', 'chip')]},
        'k-lock': {objects: [plate('l-sky', 'k-lsky', 0), plate('l-town', 'k-town', 1, 'exact'), plate('l-wall', 'k-wall', 2, 'exact'), plate('l-water', 'k-cwater', 2, 'exact'),
          P('l-boat', 'k-boat', 50, pct(g.low - 60 + 4), 62, 3, {flat: true}), plate('l-outside', 'k-outside', 3, 'exact'),
          P('l-gate-low', 'k-gate', g.x0 / 10, pct((g.bank + g.floor) / 2), 9, 4, {flat: true}), P('l-gate-low-open', 'k-gate-open', g.x0 / 10 - 2, pct((g.bank + g.floor) / 2), 9, 4, {flat: true}),
          P('l-beam-low', 'k-beam', 3, pct(g.bank - 8), 30, 4, {flat: true, origin: '100% 50%'}),
          P('l-gate-up', 'k-gate', g.x1 / 10, pct((g.bank + g.floor) / 2), 9, 4, {flat: true}), P('l-gate-up-open', 'k-gate-open', g.x1 / 10 + 2, pct((g.bank + g.floor) / 2), 9, 4, {flat: true}),
          P('l-beam-up', 'k-beam', 97, pct(g.bank - 8), 30, 4, {flat: true, origin: '0% 50%'}),
          P('l-paddle', 'k-paddle', 84, pct(g.bank - 110), 9, 4, {flat: true}), P('l-windlass', 'k-windlass', 81, pct(g.bank - 128), 7, 5, {flat: true, origin: '12% 11%'}),
          P('l-gush', 'k-gush', 84, pct(g.floor - 170), 9, 4, {flat: true, origin: '70% 25%'}), ...DROPS, P('l-rise', 'k-rise', 16, pct((g.low + g.high) / 2), 8, 5, {flat: true}),
          ...man('l-man', 70, pct(g.bank - 114), 12, 5), P('l-fore', 'k-fore', 8, 88, 34, 5, {flat: true}),
          label('l-tag', 50, pct(g.bank + 90), 34, 'lock chamber', 'chip'), label('l-tag-in', 70, pct(g.floor - 290), 24, 'water in', 'accent', {accent: '#2f6f8f'})]},
      };
      // valley: the boat idles, the keeper waves and blinks, the route climbs on "climb"
      ambient('v-boat', {bob: [.002, 2.4, 0]});
      // P022.2: hand-animated feel - poses held on twos (12 fps), a small wind-up before the wave, the head answering the arm
      const wave = M.stepped([[S('valley').start, [-10]], [.32, [4], 'inOut'], [.6, [-125], 'overshoot'], [.85, [-95], 'inOut'], [1.1, [-128], 'inOut'], [1.4, [-100], 'inOut'], [1.9, [-15], 'settle']], 12);
      kit.pose('v-man-arm', wave.map(([t, [d], e]) => [t, d, e]));
      kit.pose('v-man-head', M.stepped([[S('valley').start, [0]], [.45, [0]], [.75, [-7], 'inOut'], [1.5, [-4], 'inOut'], [2.0, [0], 'settle']], 12).map(([t, [d], e]) => [t, d, e]));
      kit.blink('v-man-blink', [.9, 2.3]);
      const climb = kit.draw('v-route', 'climb', .8, 'rightward');
      kit.label('v-tag', climb + .4);
      // lock: the lower gate closes, the keeper winds, water gushes in, the boat rises with the water, the top gate opens
      const s2 = S('lock').start, lockAt = kit.label('l-tag', 'lock', cue('close') - .2);
      const close = cue('close');
      track('l-gate-low', [key(s2, [-.05, 0, 0, 1, 0]), key(close - .02, [-.05, 0, 0, 1, 0]), key(close, [-.05, 0, 0, 1, .2]), key(close + .12, [-.058, 0, 0, 1, 1], 'inOut'), key(close + .62, N, 'settle')]);
      motion.speechCue('close', 'l-gate-low');
      track('l-gate-low-open', [key(s2, N), key(close, N), key(close + .3, [0, 0, 0, 1, 0])]);
      kit.pose('l-beam-low', [[s2, -28], [close + .08, -28], [close + .16, -32, 'inOut'], [close + .82, 0, 'settle']]);
      kit.pose('l-man-arm', M.stepped([[s2, [-20]], [cue('pours') - .4, [-70], 'outQuart'], [cue('pours') + .1, [-98], 'inOut'], [cue('pours') + .6, [-70], 'inOut'], [cue('pours') + 1.1, [-98], 'inOut'], [cue('pours') + 1.6, [-70], 'inOut'], [cue('swings'), [-25], 'settle']], 12).map(([t, [d], e]) => [t, d, e]));
      track('l-windlass', [key(s2, [0, 0, 0, 1, 0]), key(cue('pours') - .5, [0, 0, 0, 1, 0]), key(cue('pours') - .3, N),
        ...M.stepped([[cue('pours'), [0, 0, 0, 1, 1]], [cue('pours') + 1.5, [0, 0, -270, 1, 1], 'inOut'], [cue('swings') - .3, [0, 0, -360, 1, 1], 'outQuart']], 12).slice(0), key(cue('swings'), [0, 0, -360, 1, 0])]);
      kit.blink('l-man-blink', [s2 + .7, s2 + 3.1, s2 + 5.6]);
      const pours = cue('pours');
      track('l-gush', [key(s2, [0, 0, 0, .3, 0]), key(pours, [0, 0, 0, .3, 0]), key(pours + .25, N, 'out'), key(cue('swings') - .3, N), key(cue('swings'), [0, 0, 0, .6, 0])]);
      motion.speechCue('pours', 'l-gush');
      ambient('l-gush', {sway: [4, .5, 0]});
      kit.burst(DROPS.map(o => o.id), pours + .1, {spread: .08, rise: .05, fall: .2, dur: 1.1, seed: 3, stagger: .12});
      kit.label('l-tag-in', pours + .3, cue('rises') + .6);
      const lift = (g.low - g.high) / VH, fill0 = pours + .2, fill1 = cue('swings') - .15;
      track('l-water', [key(s2, N), key(fill0, N), key(fill1, [0, -lift, 0, 1, 1], 'smooth')]);
      track('l-boat', [key(s2, N), key(fill0 + .12, N), key(fill1 + .1, [0, -lift - .004, -1.2, 1, 1], 'inOut'), key(fill1 + .55, [0, -lift, 0, 1, 1], 'settle'), key(S('lock').end, [.08, -lift, 0, 1, 1], 'in')]);
      kit.draw('l-rise', 'rises', .6, 'up');
      const swings = cue('swings');
      track('l-gate-up', [key(s2, N), key(swings, N), key(swings + .1, [-.004, 0, 0, 1, 1], 'inOut'), key(swings + .5, [.05, 0, 0, 1, 0], 'outQuart')]);
      track('l-gate-up-open', [key(s2, [0, 0, 0, 1, 0]), key(swings - .02, [0, 0, 0, 1, 0]), key(swings + .4, N)]);
      motion.speechCue('swings', 'l-gate-up-open');
      kit.pose('l-beam-up', [[s2, 0], [swings + .06, 0], [swings + .16, -4, 'inOut'], [swings + .85, 30, 'settle']]);
      const cameras = {
        valley: kit.travel('valley', [[S('valley').start, -.04, .1, 1.12], [climb, .02, .02, 1.08], [S('valley').end, .04, -.04, 1.2, 'in']]),
        lock: kit.travel('lock', [[s2, 0, .08, 1.08, 'outQuart'], [close - .1, -.12, .12, 1.32, 'inOut'], [close + .9, -.1, .12, 1.3, 'inOut'], [pours - .1, .12, 0, 1.3, 'inOut'], [cue('rises') + .2, 0, .02, 1.04, 'inOut'], [swings - .1, .1, -.02, 1.22, 'inOut'], [S('lock').end, .11, -.03, 1.26, 'inOut']]),
      };
      return {scenes, cameras, checks: {keyframes: [['valley', climb + .8], ['gate-closes', close + .65], ['filling', cue('rises') + .7], ['top-gate', swings + .7]]}};
    },
  };
})();
