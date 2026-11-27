// "How does a pin-tumbler lock work?" (kn-IN, X-Ray Explainer, full-bleed). Original procedural SVG artwork authored for
// this project. Side section of a cylinder lock: housing (with pin chambers), plug, five pin stacks (spring, driver pin,
// key pin of its own length), shear line. Geometry is exact: with no key, every driver pin straddles the shear line; the
// correct key's cut under pin i sits at shear + keyPin_i, so every gap lands on the shear line (asserted below).
(() => {
  const {sym, f} = globalThis.techShotArt;
  const X = globalThis.xrayKit, A = X.art, C = X.COLORS;
  const VW = 1000;
  let VH = 1778, G;
  const geo = () => {
    const Y0 = VH * .33, g = {CT: Y0, S: Y0 + 220, F: Y0 + 360, PB: Y0 + 400, HT: Y0 - 50, HB: Y0 + 450, xs: [300, 410, 520, 630, 740], L: [70, 45, 80, 55, 65], D: 110, PW: 54};
    g.cut = g.L.map(l => g.S + l);                                                       // key edge height under each pin
    g.cut.forEach((c, i) => { if (Math.abs(c - g.L[i] - g.S) > 1e-9 || c > g.F || g.F - g.L[i] - g.D >= g.S || g.F - g.L[i] <= g.S) throw new Error('lock geometry'); });
    return g;
  };
  // key top edge (y, smaller = higher) at blade coordinate u in [160, 830]: flat seats under each pin, straight ramps between, sloped tip
  const edge = u => {
    const {xs, cut, F} = G, pts = [[160, cut[0]], ...xs.flatMap((x, i) => [[x - 22, cut[i]], [x + 22, cut[i]]]), [830, F - 6]];
    if (u <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const [a, ya] = pts[i - 1], [b, yb] = pts[i]; return ya + (yb - ya) * (u - a) / (b - a); }
    return F;
  };
  const keyPath = () => { let d = `M80 ${f(G.PB - 8)}L80 ${f(G.cut[0])}`; for (let u = 160; u <= 830; u += 5) d += `L${u} ${f(edge(u))}`; return d + `L840 ${f(G.F + 12)}L840 ${f(G.PB - 8)}Z`; };

  globalThis.xrayTopic = {
    shots: [{id: 'lock', scene: 'pl'}, {id: 'inside', scene: 'pl', accent: C.glass}, {id: 'blocked', scene: 'pl', accent: '#ff5a4e'}, {id: 'unlock', scene: 'pl', accent: '#5fe08a'}],
    get css() { return X.css + X.windowCss('o-shell', {x0: 12, y0: 50, x1: 88, y1: 50, r: 230}) + ' .piece-label { font-size:40px }'; },
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: ctx => {
      VH = Math.round(1000 / ctx.aspect); G = geo();
      const vb = `0 0 ${VW} ${VH}`, {CT, S, F, PB, HT, HB, xs, PW} = G;
      const housingD = A.rounded(110, HT, 780, HB - HT, 26), plugD = A.rounded(150, S, 700, PB - S, 14);
      const chambers = xs.map(x => `M${x - PW / 2 - 4} ${CT}H${x + PW / 2 + 4}V${F}H${x - PW / 2 - 4}Z`).join('');
      const section = A.section(housingD + ' ' + plugD, 'pl-cut') + `<path d="${chambers}" fill="#081118"/>` + A.metal(plugD, 'pl-plug', '#9aa8b5') + `<path d="${chambers.replace(new RegExp(`M(\\d+) ${CT}`, 'g'), `M$1 ${S}`)}" fill="#0b1720"/>` +
        `<path d="M150 ${f(F + 6)}H850V${f(PB - 4)}H150Z" fill="#0b1720"/>`;                                                     // keyway channel
      const driver = `<rect x="0" y="0" width="${PW}" height="${G.D}" rx="10" fill="#5fc8ff"/><rect x="6" y="6" width="10" height="${G.D - 12}" rx="5" fill="#ffffff" opacity=".35"/>`;
      const keyPin = l => `<path d="M0 0H${PW}V${l - 14}Q${PW / 2} ${l + 10} 0 ${l - 14}Z" fill="#f0a63a"/><rect x="6" y="6" width="10" height="${l - 22}" rx="5" fill="#ffffff" opacity=".35"/>`;
      const spring = h => `<path d="M${PW / 2} 0` + Array.from({length: 10}, (_, i) => `L${i % 2 ? 6 : PW - 6} ${f((i + .5) * h / 10)}`).join('') + `L${PW / 2} ${h}" fill="none" stroke="#c6d3de" stroke-width="5" stroke-linejoin="round" style="transform-box:fill-box;transform-origin:50% 0;transform:scaleY(var(--draw, 1))"/>`;
      return [sym('pl-field', vb, A.field(VW, VH)), sym('pl-section', vb, section),
        sym('pl-shell', vb, A.metal(housingD, 'pl-brass', '#c9a24b') + `<path d="M150 ${f(F + 6)}H210V${f(PB - 4)}H150Z" fill="#2a1d08"/>` + `<circle cx="180" cy="${f((F + PB) / 2)}" r="9" fill="#2a1d08"/>`),
        sym('pl-ghost', vb, A.glass(housingD)),
        sym('pl-shear', vb, `<path d="M120 ${S}H880" stroke="#ffffff" stroke-width="4" stroke-dasharray="16 10" opacity=".9"/>`),
        sym('pl-align', vb, `<path d="M120 ${S}H880" stroke="#5fe08a" stroke-width="10" stroke-linecap="round" opacity=".85"/>`),
        sym('pl-block', vb, xs.map(x => `<path d="M${x - 40} ${S - 18}l80 36M${x + 40} ${S - 18}l-80 36" stroke="#ff5a4e" stroke-width="9" stroke-linecap="round"/>`).join('')),
        sym('pl-key', vb, `<path d="${keyPath()}" fill="#d9dee4" stroke="#7f8b96" stroke-width="3"/><circle cx="60" cy="${f((G.cut[0] + PB) / 2)}" r="58" fill="#d9dee4" stroke="#7f8b96" stroke-width="3"/><circle cx="48" cy="${f((G.cut[0] + PB) / 2)}" r="16" fill="#08151d"/>`),
        sym('pl-driver', `0 0 ${PW} ${G.D}`, driver), ...G.L.map((l, i) => sym(`pl-kpin${i}`, `0 0 ${PW} ${l}`, keyPin(l))),
        ...xs.map((x, i) => sym(`pl-spring${i}`, `0 0 ${PW} ${F - G.L[i] - G.D - CT}`, spring(F - G.L[i] - G.D - CT))),
        sym('pl-inset', '0 0 300 300', `<circle cx="150" cy="150" r="140" fill="#08151d" stroke="${C.glass}" stroke-width="5"/><circle cx="150" cy="150" r="128" fill="url(#pl-cut)" opacity=".6"/>` +
          `<rect x="128" y="0" width="44" height="60" fill="#5fc8ff"/>`),
        sym('pl-turn', '0 0 300 300', `<path d="M150 22A128 128 0 0 1 261 86" fill="none" stroke="#5fe08a" stroke-width="10" stroke-linecap="round"/><path d="M270 70l-4 34-28-18z" fill="#5fe08a"/>`),
        sym('pl-inset-plug', '0 0 300 300', `<circle cx="150" cy="150" r="88" fill="#9aa8b5" stroke="#0b1720" stroke-width="4"/><rect x="128" y="62" width="44" height="60" fill="#f0a63a"/><rect x="108" y="170" width="84" height="28" rx="6" fill="#0b1720"/>`)].join('');
    },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, stroke} = motion;
      const kit = X.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const {CT, F, xs, L, D, PW} = G, pc = ([x, y]) => [x / VW * 100, y / VH * 100], end = S('unlock').end;
      const kIn0 = cue('lift') - 3.25, kIn1 = cue('lift') - .05, OUT = -660;              // key slides in on the second "key" of s4 and is home by "lifts"
      const keyOff = t => t <= kIn0 ? OUT : t >= kIn1 ? 0 : OUT * (1 - (t - kIn0) / (kIn1 - kIn0)) ** 1.6;
      const lift = (i, t) => { const off = keyOff(t), u = xs[i] - off; return u >= 160 && u <= 830 ? Math.max(0, F - Math.min(F, edge(u))) : 0; };   // px the pin stack rises
      const objs = [plate('o-field', 'pl-field', 0), plate('o-section', 'pl-section', 1, 'exact'),
        ...xs.flatMap((x, i) => [P(`o-spring${i}`, `pl-spring${i}`, ...pc([x, (CT + F - L[i] - D) / 2]), PW / VW * 100, 2, {flat: true}),
          P(`o-driver${i}`, 'pl-driver', ...pc([x, F - L[i] - D / 2]), PW / VW * 100, 2, {flat: true}), P(`o-kpin${i}`, `pl-kpin${i}`, ...pc([x, F - L[i] / 2]), PW / VW * 100, 2, {flat: true})]),
        plate('o-key', 'pl-key', 3, 'exact'), plate('o-shear', 'pl-shear', 3, 'exact'), plate('o-block', 'pl-block', 4, 'exact'), plate('o-align', 'pl-align', 4, 'exact'),
        plate('o-ghost', 'pl-ghost', 4, 'exact'), plate('o-shell', 'pl-shell', 5, 'exact'),
        P('o-inset', 'pl-inset', 74, ctx.safe.top + 10, 30, 5, {flat: true}), P('o-inset-plug', 'pl-inset-plug', 74, ctx.safe.top + 10, 30, 5, {flat: true}), P('o-turn', 'pl-turn', 74, ctx.safe.top + 10, 30, 5, {flat: true}),
        P('l-spring', null, 30, pc([0, CT])[1] - 6, 30, 5, {label: 'ಸ್ಪ್ರಿಂಗ್', labelStyle: 'spec'}), P('l-pins', null, 66, pc([0, CT])[1] - 6, 34, 5, {label: 'ಪಿನ್‌ಗಳ ಜೋಡಿ', labelStyle: 'spec', accent: '#f0a63a'}),
        P('l-lift', null, 50, pc([0, G.HB])[1] + 4, 56, 5, {label: 'ಸರಿಯಾದ ಎತ್ತರ', labelStyle: 'amber', accent: '#5fe08a'})];
      // 1. exterior: brass body; the key waits outside; 2. X-ray porthole scans it open, the body becomes a ghost outline
      track('o-key', [key(0, [-.66, .02, 0, 1, 0]), key(cue('key'), [-.66, .02, 0, 1, 0]), key(cue('key') + .4, [-.66, 0, 0, 1, 1], 'outQuart'),
        key(S('inside').start + .2, [-.66, 0, 0, 1, 1]), key(S('inside').start + .6, [-.66, 0, 0, 1, 0], 'inOut'), key(kIn0 - .3, [-.66, 0, 0, 1, 0]), key(kIn0, [-.66, 0, 0, 1, 1]),
        ...Array.from({length: Math.ceil((kIn1 - kIn0) * 30) + 1}, (_, k) => { const t = Math.min(kIn1, kIn0 + k / 30); return key(t, [keyOff(t) / VW, 0, 0, 1, 1], 'hold'); })]);
      kit.scan('o-shell', S('inside').start - .2, 1.1);
      track('o-shell', [key(0, N), key(S('inside').start + .7, N), key(S('inside').start + 1.0, [0, 0, 0, 1, 0], 'inOut')]);
      track('o-ghost', [key(0, [0, 0, 0, 1, 0]), key(S('inside').start + .6, [0, 0, 0, 1, 0]), key(S('inside').start + 1.0, N, 'inOut')]);
      kit.label('l-spring', 'spring', S('blocked').start); kit.label('l-pins', 'pins', S('blocked').start);
      // 3. no key: the shear line appears; red marks where every driver pin crosses it
      track('o-shear', [key(0, [0, 0, 0, 1, 0]), key(cue('line'), [0, 0, 0, 1, 0]), key(cue('line') + .3, N, 'out')]); motion.speechCue('line', 'o-shear');
      track('o-block', [key(0, [0, 0, 0, 1.1, 0]), key(cue('stop'), [0, 0, 0, 1.1, 0]), key(cue('stop') + .25, N, 'overshoot'), key(kIn0, N), key(kIn0 + .3, [0, 0, 0, 1, 0], 'inOut')]); motion.speechCue('stop', 'o-block');
      // 4. the right key: every pin stack rides the key edge (sampled per frame) and springs compress; gaps meet the line; plug turns
      for (let i = 0; i < xs.length; i++) {
        const ks = [key(0, N)], ss = [key(0, [1])], rest = F - L[i] - D - CT;
        for (let k = Math.floor(kIn0 * 30); k / 30 <= end + 1e-9; k++) { const t = k / 30, l = lift(i, t); ks.push(key(t, [0, -l / VH, 0, 1, 1], 'hold')); ss.push(key(t, [(rest - l) / rest], 'hold')); }
        for (const id of [`o-driver${i}`, `o-kpin${i}`]) track(id, ks);
        track(`o-spring${i}`, ks.map(([t, v, c]) => [t, [0, 0, 0, 1, 1], c])); stroke(`o-spring${i}`, ss);
      }
      kit.label('l-lift', 'lift');
      track('o-align', [key(0, [0, 0, 0, 1, 0]), key(cue('align'), [0, 0, 0, 1, 0]), key(cue('align') + .35, N, 'out')]); motion.speechCue('align', 'o-align');
      for (const id of ['o-inset', 'o-inset-plug']) track(id, [key(0, [0, 0, 0, .9, 0]), key(cue('align'), [0, 0, 0, .9, 0]), key(cue('align') + .4, N, 'outQuart'),
        ...(id === 'o-inset-plug' ? [key(cue('turn') - .3, N), key(end, [0, 0, 60, 1, 1], 'inOut')] : [])]);
      track('o-turn', [key(0, [0, 0, 0, 1, 0]), key(cue('turn'), [0, 0, 0, 1, 0]), key(cue('turn') + .2, N, 'out')]); motion.speechCue('turn', 'o-turn');
      const cams = {lock: [key(0, [0, .02, 1.04]), key(S('lock').end, [0, .01, 1.08], 'inOut')], inside: [key(S('inside').start, [0, .01, 1.08]), key(S('inside').end, [0, 0, 1.14], 'inOut')],
        blocked: [key(S('blocked').start, [0, 0, 1.14]), key(cue('stop') + .3, [0, .02, 1.2], 'inOut')], unlock: [key(S('unlock').start, [0, .02, 1.2]), key(cue('align'), [0, .02, 1.12], 'inOut'), key(end, [0, 0, 1.06], 'inOut')]};
      return {scenes: {pl: {objects: objs}}, cameras: cams, checks: {keyframes: [['inside', cue('pins') + .6], ['blocked', cue('stop') + .6], ['aligned', cue('align') + .6]]}};
    },
  };
})();
