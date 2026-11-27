// E26 / P023.6 Tech Explainer study (unseen topic, en-IN, full-bleed): "How does a hard drive read data?" Simplified.
// Artwork: three static Blender layers (blender/plate.py, top-down orthographic: base, hub, arm) composited by the Tech
// engine, which rotates the hub and the arm exactly in 2D about the rendered centres; SVG adds the mechanism overlays
// (target track, head marker, cross-section inset). Spin is slowed for legibility (labelled). Facts (simplified): the
// platter spins thousands of times a minute; the actuator arm positions the head over a track; the head flies on a thin
// air cushion without touching the surface (some drives use helium; guardrail: "simplified").
(() => {
  const {sym} = globalThis.techShotArt;
  const K = globalThis.techKit, PL = globalThis.E26_PLATES, G = PL.geometry;
  const W = 1000;
  let VH = 1778;
  const C = '#5fd3ff';
  // geometry in frame millimetres (ortho camera), converted from the render's image fractions
  const [FW, FH] = G.frameMm, mm = ([fx, fy]) => [fx * FW, (1 - fy) * FH];      // y up
  const PC = mm(G.platter), PV = mm(G.pivot), L = G.armLen * FW, REST = G.restDeg * Math.PI / 180;
  // arm angle (world, radians) that puts the head at radius r from the platter centre (solved by bisection on the arc)
  const angleFor = r => { let a = REST - 1.2, b = REST, f = t => Math.hypot(PV[0] + Math.cos(t) * L - PC[0], PV[1] + Math.sin(t) * L - PC[1]) - r;
    for (let i = 0; i < 60; i++) { const m = (a + b) / 2; (f(a) * f(m) <= 0) ? b = m : a = m; } return (a + b) / 2; };
  const headAt = t => [PV[0] + Math.cos(t) * L, PV[1] + Math.sin(t) * L];
  const R_TRACK = 26, TRACK = angleFor(R_TRACK), R_PARK = 41, PARK = angleFor(R_PARK);
  const pct = ([x, y]) => [x / FW * 100, (1 - y / FH) * 100];
  const inset = () => `<rect x="0" y="0" width="460" height="300" rx="26" fill="#0d1118" stroke="#5fd3ff" stroke-opacity=".5" stroke-width="3"/>` +
    `<rect x="30" y="210" width="400" height="40" fill="#b9c2cf"/><rect x="30" y="210" width="400" height="7" fill="#eef3fa"/>` +
    Array.from({length: 10}, (_, i) => `<rect x="${38 + i * 40}" y="222" width="22" height="10" rx="3" fill="${i % 3 ? '#7d8796' : '#5fd3ff'}" opacity=".85"/>`).join('') +
    `<path d="M150 120H330L350 190H130Z" fill="#20262f" stroke="#4b5563" stroke-width="3"/><rect x="225" y="186" width="30" height="8" fill="#5fd3ff"/>` +
    `<path d="M240 196V206M240 206l-7 -8M240 206l7 -8M240 210V200" stroke="#ffd166" stroke-width="3" fill="none"/>` +
    `<path d="M60 160C120 165 160 175 200 190M60 180C120 184 160 192 200 200" stroke="#9fb3c8" stroke-width="3" fill="none" stroke-dasharray="6 8" opacity=".8"/>` +
    `<path d="M210 196l-14 -8M210 196l-14 4" stroke="#9fb3c8" stroke-width="3"/>`;

  globalThis.techTopic = {
    shots: [{id: 'spin', scene: 'hd', accent: C}, {id: 'seek', scene: 'hd', accent: C}, {id: 'float', scene: 'hd', accent: '#ffd166'}],
    css: K.css + ' .piece-art { filter:none } #o-arm .piece-art { filter: drop-shadow(10px 16px 10px #0008) } #o-hub .piece-art { filter: drop-shadow(4px 7px 5px #0007) }',
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: () => {
      const r = document.querySelector('.story-stage').getBoundingClientRect();
      VH = Math.round(W * r.height / r.width);
      const vb = `0 0 ${W} ${VH}`, [cx, cy] = pct(PC), rr = R_TRACK / FW * W;
      return [sym('hd-base', vb, K.art.raster(PL.base, W, VH)), sym('hd-hub', vb, K.art.raster(PL.hub, W, VH)), sym('hd-arm', vb, K.art.raster(PL.arm, W, VH)),
        sym('hd-track', vb, `<circle cx="${cx * 10}" cy="${cy / 100 * VH}" r="${rr}" fill="none" stroke="${C}" stroke-width="5" stroke-dasharray="14 10"/>`),
        sym('hd-spin', vb, `<path d="M${cx * 10 + 150} ${cy / 100 * VH - 380}A410 410 0 0 1 ${cx * 10 + 400} ${cy / 100 * VH - 110}" stroke="${C}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${cx * 10 + 400} ${cy / 100 * VH - 110}l-6 -40M${cx * 10 + 400} ${cy / 100 * VH - 110}l-38 -16" stroke="${C}" stroke-width="9" stroke-linecap="round"/>`),
        sym('hd-head', '0 0 100 100', `<circle cx="50" cy="50" r="22" fill="none" stroke="#ffd166" stroke-width="6"/><circle cx="50" cy="50" r="6" fill="#ffd166"/>`),
        sym('hd-inset', '0 0 460 300', inset())].join('');
    },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient} = motion;
      const kit = K.motion(ctx), S = ctx.shot, cue = ctx.cue, M = globalThis.vcMotion;
      const [pcx, pcy] = pct(PC), [pvx, pvy] = pct(PV);
      const head = t => pct(headAt(t));
      const deg = t => -(t - REST) * 180 / Math.PI;                       // CSS rotation (screen y down) relative to the rendered rest pose
      const objs = [plate('o-base', 'hd-base', 0), plate('o-track', 'hd-track', 1, 'exact'), plate('o-spin', 'hd-spin', 2, 'exact'),
        P('o-hub', 'hd-hub', 50, 50, 100, 2, {plate: 'exact', origin: `${pcx}% ${pcy}%`}), P('o-arm', 'hd-arm', 50, 50, 100, 3, {plate: 'exact', origin: `${pvx}% ${pvy}%`}),
        P('o-head', 'hd-head', ...head(TRACK), 7, 4, {flat: true}), P('o-inset', 'hd-inset', 50, 22, 66, 5, {flat: true}),
        P('l-plat', null, 50, 13, 44, 5, {label: 'platter (spin slowed)', labelStyle: 'chip'}), P('l-track', null, 36, 36, 16, 5, {label: 'track', labelStyle: 'chip', accent: C}),
        P('l-air', null, 50, 39, 44, 5, {label: 'air cushion', labelStyle: 'chip', accent: '#ffd166'})];
      const s1 = S('spin').start, sp = motion.speechCue('spins', 'o-spin');
      ambient('o-hub', {spin: 90});                                         // illustrative: real drives spin ~5,400-7,200 rpm
      track('o-spin', [key(s1, [0, 0, 0, .96, 0]), key(sp, [0, 0, 0, .96, 0]), key(sp + .4, N, 'outQuart'), key(S('spin').end, N), key(S('spin').end + .3, [0, 0, 0, 1, 0])]);
      kit.label('l-plat', sp + .3, S('seek').start);
      // seek: the arm accelerates off the park radius, brakes and settles on the exact track (servo settle)
      const sw = cue('swings'), ex = motion.speechCue('exact', 'o-track');
      track('o-arm', [key(s1, [0, 0, deg(PARK), 1, 1]), key(sw, [0, 0, deg(PARK), 1, 1]), key(ex + .05, [0, 0, deg(TRACK), 1, 1], 'settle')]);
      track('o-track', [key(s1, [0, 0, 0, 1.06, 0]), key(ex, [0, 0, 0, 1.06, 0]), key(ex + .35, N, 'outQuart')]);
      track('o-head', [key(s1, [0, 0, 0, .6, 0]), key(ex + .3, [0, 0, 0, .6, 0]), key(ex + .6, N, 'overshoot')]);
      kit.label('l-track', ex + .4, S('float').start + .3);
      // float: a cross-section inset opens over the platter; the head flies over the tracks without touching
      const fl = motion.speechCue('floats', 'o-inset');
      track('o-inset', [key(s1, [0, .02, 0, .9, 0]), key(fl, [0, .02, 0, .9, 0]), key(fl + .45, N, 'outQuart')]);
      kit.label('l-air', fl + .5);
      const cameras = {spin: [key(s1, [0, .02, 1.0]), key(S('spin').end, [0, .01, 1.06], 'inOut')],
        seek: [key(S('seek').start, [0, .01, 1.06]), key(ex + .4, [.06, .04, 1.22], 'inOut'), key(S('seek').end, [.06, .04, 1.24], 'inOut')],
        float: [key(S('float').start, [.06, .04, 1.24]), key(fl, [.02, -.02, 1.12], 'inOut'), key(S('float').end, [.02, -.02, 1.1], 'inOut')]};
      return {scenes: {hd: {objects: objs}}, cameras, checks: {keyframes: [['spinning', sp + .9], ['on-track', ex + .9], ['air-cushion', fl + 1.0]]}};
    },
  };
})();
