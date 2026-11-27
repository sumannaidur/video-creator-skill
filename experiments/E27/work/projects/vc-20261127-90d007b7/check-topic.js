// E27 / P023.7 X-Ray Explainer study (unseen topic, en-IN, full-bleed): "Why does one pedal turn spin the wheel three times?"
// Mechanics (exact): 1/2-inch roller chain (pitch 12.7 mm, drawn at 1.2 units/mm); sprocket pitch radius p/(2 sin(pi/z));
// 48T chainring and 16T rear sprocket on an even-link chain loop (98 links, centre distance solved by chainLoop); both
// sprockets turn the same way; the rear sprocket and wheel turn 48/16 = 3x the crank; the chain travels r1*theta1.
// Cutaway conventions: a painted chain guard is scanned open, then shown as a translucent ghost; internals fully drawn.
(() => {
  const {sym, f} = globalThis.techShotArt;
  const X = globalThis.xrayKit, A = X.art, C = X.COLORS;
  const W = 1000, P = 12.7 * 1.2, Z1 = 48, Z2 = 16;
  let VH = 1778, G;
  const geo = () => { const y = VH * .5, c1 = [700, y], s1 = A.sprocket(Z1, P, {id: 'xr-s1', fill: '#aab4be'}), s2 = A.sprocket(Z2, P, {id: 'xr-s2', fill: '#c9a24b'});
    const loop = A.chainLoop(c1, s1.r, [205, y], s2.r, P); return {c1, c2: loop.c2, s1, s2, loop}; };
  const box = 820;                                                       // centred-art symbols: 0 0 box box, art translated to the centre
  const centred = (body, s = 1) => `<g transform="translate(${box / 2} ${box / 2}) scale(${s})">${body}</g>`;
  const crank = () => `<path d="M-14 -10L204 -16L210 0L204 16L-14 10Z" fill="#3a4550" stroke="${C.glass}" stroke-opacity=".5" stroke-width="3"/><circle r="26" fill="#1c2630" stroke="${C.glass}" stroke-width="3"/>` +
    `<rect x="190" y="-24" width="70" height="48" rx="8" fill="#2a333c" stroke="${C.glass}" stroke-opacity=".6" stroke-width="3"/>`;
  const wheel = () => `<circle r="345" fill="none" stroke="${C.glass}" stroke-width="10" stroke-opacity=".9"/><circle r="320" fill="none" stroke="${C.glass}" stroke-width="3" stroke-opacity=".4"/>` +
    Array.from({length: 16}, (_, i) => { const a = i / 16 * Math.PI * 2; return `<path d="M${f(Math.cos(a) * 30)} ${f(Math.sin(a) * 30)}L${f(Math.cos(a + .25) * 320)} ${f(Math.sin(a + .25) * 320)}" stroke="${C.glass}" stroke-opacity=".45" stroke-width="2.5"/>`; }).join('') +
    `<circle cx="0" cy="-332" r="16" fill="${C.cut}"/>`;
  const guard = (fill, extra = '') => `<path d="${G.loop.d}" fill="${fill}" stroke="${fill}" stroke-width="64" stroke-linejoin="round"${extra}/>`;

  globalThis.xrayTopic = {
    shots: [{id: 'guard', scene: 'bk', accent: C.glass}, {id: 'teeth', scene: 'bk', accent: C.cut}, {id: 'ratio', scene: 'bk', accent: C.cut}],
    get css() { return X.css + X.windowCss('o-guard', {x0: 18, y0: 50, x1: 86, y1: 50, r: 170}) + X.litCss('o-ring') + X.litCss('o-sprk'); },
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: () => {
      const r = document.querySelector('.story-stage').getBoundingClientRect();
      VH = Math.round(W * r.height / r.width); G = geo();
      const vb = `0 0 ${W} ${VH}`;
      return [sym('bk-field', vb, A.field(W, VH)), sym('bk-wheel', `0 0 ${box} ${box}`, centred(wheel())),
        sym('bk-chain', vb, G.loop.markup('--draw', G.s1.r * 2 * Math.PI)),   // one crank revolution of travel
        sym('bk-ring', `0 0 ${box} ${box}`, centred(G.s1.body + crank())), sym('bk-sprk', `0 0 ${box} ${box}`, centred(G.s2.body)),
        sym('bk-guard', vb, guard('#8e2a2a') + guard('url(#bk-paint)', ' opacity=".55"') + `<defs><linearGradient id="bk-paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".45"/><stop offset=".3" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".45"/></linearGradient></defs>`),
        sym('bk-ghost', vb, guard(C.glass, ' opacity=".1"') + `<path d="${G.loop.d}" fill="none" stroke="${C.glass}" stroke-width="2.5" stroke-opacity=".7" stroke-dasharray="10 8" transform="translate(0 0)"/>`)].join('');
    },
    build(ctx) {
      const {P: O, plate, motion} = ctx;
      const {key, N, track} = motion;
      const kit = X.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const pc = ([x, y]) => [x / W * 100, y / VH * 100], wb = box / W * 100;
      const objs = [plate('o-field', 'bk-field', 0), O('o-wheel', 'bk-wheel', ...pc(G.c2), wb, 1, {flat: true}),
        plate('o-chain', 'bk-chain', 2, 'exact'), O('o-sprk', 'bk-sprk', ...pc(G.c2), wb, 3, {flat: true}), O('o-ring', 'bk-ring', ...pc(G.c1), wb, 3, {flat: true}),
        plate('o-ghost', 'bk-ghost', 4, 'exact'), plate('o-guard', 'bk-guard', 4, 'exact'),
        O('l-guard', null, 50, pc(G.c1)[1] - 15, 40, 5, {label: 'chain guard', labelStyle: 'callout'}),
        O('l-48', null, pc(G.c1)[0] - 4, pc(G.c1)[1] - 12, 22, 5, {label: '48 teeth', labelStyle: 'amber'}),
        O('l-16', null, pc(G.c2)[0] + 6, pc(G.c2)[1] - 8, 30, 5, {label: '16 teeth', labelStyle: 'amber'}),
        O('l-ratio', null, 50, pc(G.c1)[1] + 22, 66, 5, {label: '48 ÷ 16 = 3 wheel turns', labelStyle: 'callout', accent: C.cut})];
      // 1. exterior: the painted guard; an X-ray window sweeps across it, then it stays only as a ghost
      const s1 = S('guard').start, gd = motion.speechCue('guard', 'l-guard');
      kit.label('l-guard', gd, S('teeth').start);
      kit.scan('o-guard', gd - .9, 1.3);
      track('o-guard', [key(s1, N), key(gd + .45, N), key(gd + .8, [0, 0, 0, 1, 0], 'inOut')]);
      track('o-ghost', [key(s1, [0, 0, 0, 1, 0]), key(gd + .6, [0, 0, 0, 1, 0]), key(gd + 1.1, N, 'inOut')]);
      // 2. teeth: each sprocket is lit as it is named
      const t48 = motion.speechCue('forty-eight', 'l-48'), t16 = motion.speechCue('sixteen.', 'l-16');
      kit.label('l-48', t48 + .05, t48 + 1.1); kit.label('l-16', t16 + .05, S('ratio').start + .2);
      kit.illuminate('o-ring', t48 - .1); kit.illuminate('o-sprk', t16 - .1);
      // 3. ratio: one crank revolution drives the rear sprocket and wheel through exactly three, the chain r1*theta1
      const t0 = cue('turn'), t1 = S('ratio').end - .25;
      kit.chainDrive(['o-ring', Z1], ['o-sprk', Z2], 'o-chain', G.s1.r, t0, t1, 360, 'inOut', ['o-wheel']);
      const th = motion.speechCue('three', 'l-ratio'); kit.label('l-ratio', th + .05);
      const cameras = {guard: [key(s1, [0, 0, 1.04]), key(S('guard').end, [0, 0, 1.08], 'inOut')],
        teeth: [key(S('teeth').start, [0, 0, 1.08]), key(t48 + .3, [.08, 0, 1.3], 'inOut'), key(t16 + .3, [-.1, 0, 1.3], 'inOut')],
        ratio: [key(S('ratio').start, [-.1, 0, 1.3]), key(t0 + .4, [0, 0, 1.06], 'inOut'), key(S('ratio').end, [0, 0, 1.04], 'inOut')]};
      return {scenes: {bk: {objects: objs}}, cameras, checks: {ratios: [{a: motion.angle('o-ring'), b: motion.angle('o-sprk'), ratio: 2.9, label: 'sprocket = 48/16 x chainring'}, {a: motion.angle('o-sprk'), b: motion.angle('o-wheel'), ratio: 1, label: 'wheel = sprocket'}], keyframes: [['scan', gd - .3], ['teeth', t16 + .6], ['ratio', (t0 + t1) / 2]]}};
    },
  };
})();
