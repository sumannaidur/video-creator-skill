// "How does a car differential let the wheels turn at different speeds?" (en-IN, 3D Explainer, full-bleed). Original
// procedural WebGL artwork authored for this project. One scene: a rear axle on a curved road, with a cutaway into an
// open differential. Kinematics are exact for an open differential with equal planet and axle gears:
//   carrier = (left + right) / 2;  planet spin = (right - left) / 2;  pinion = carrier x ring teeth / pinion teeth.
// In the turn, the outer/inner wheel speed ratio equals (Rc + W) / (Rc - W) for turn radius Rc (illustrative). Slowed.
(() => {
  const K = globalThis.k3d, {mesh, material, node, M} = K;
  const W = 1.9, RC = 6.3, DELTA = W / RC, OMEGA = 120, D = .56, ZR = 35, ZP = 10;      // half-track, turn radius, deg/s
  const MAT = {tyre: material('#1d2126', {rough: .85}), rim: material('#b7c0c8', {metal: 1, rough: .22}), steel: material('#9aa6b2', {metal: 1, rough: .3}),
    gear: material('#c9a24b', {metal: 1, rough: .28}), planet: material('#e07a3a', {metal: .9, rough: .3}), side: material('#6fc3ff', {metal: .8, rough: .3}),
    case: material('#5b6672', {metal: .85, rough: .4}), road: material('#2a2f36', {rough: .95}), track: material('#4d5a68', {rough: .8}), hot: material('#ffc857', {rough: .5})};
  // ---- toothed cone (bevel gear) about +Y: base radius r0 at y = 0, narrowing to r1 at y = h; z teeth along the slant
  const bevel = (z, r0, r1, h) => {
    const body = mesh.lathe([[1e-4, 0], [r0 * .92, 0], [r1 * .92, h], [1e-4, h]], 64), data = [...body.data];
    const slant = Math.hypot(r0 - r1, h), tilt = Math.atan2(h, r0 - r1) * 180 / Math.PI, tooth = mesh.box(slant, h * .22, Math.PI * (r0 + r1) / z * .5);
    for (let k = 0; k < z; k++) {
      const phi = k / z * 360, m = M.trs([0, 0, 0], [0, -phi, 0], [1, 1, 1]), mt = M.mul(m, M.trs([(r0 + r1) / 2 * .95, h / 2, 0], [0, 0, tilt], [1, 1, 1]));
      for (let i = 0; i < tooth.data.length; i += 6) {
        const p = M.xform(mt, tooth.data.slice(i, i + 3)), n = tooth.data.slice(i + 3, i + 6), nm = M.normal(mt);
        data.push(...p, nm[0] * n[0] + nm[3] * n[1] + nm[6] * n[2], nm[1] * n[0] + nm[4] * n[1] + nm[7] * n[2], nm[2] * n[0] + nm[5] * n[1] + nm[8] * n[2]);
      }
    }
    return {data, bounds: [[-r0, 0, -r0], [r0, h, r0]]};
  };
  const SIDE = bevel(14, .5, .26, .26), PLANET = bevel(14, .5, .26, .26), RING = bevel(ZR, 1.18, 1.0, .14), PINION = bevel(ZP, .36, .2, .2);
  const TYRE = mesh.lathe([[.5, -.22], [.7, -.22], [.79, -.13], [.79, .13], [.7, .22], [.5, .22]], 72), HUB = mesh.lathe([[1e-4, -.1], [.5, -.18], [.5, .18], [1e-4, .1]], 48);
  const ROD = len => mesh.lathe([[1e-4, 0], [.07, 0], [.07, len], [1e-4, len]], 24), CASE = mesh.lathe([[.86, -.62], [.96, -.62], [.96, .62], [.86, .62]], 72, {from: Math.PI * .35, to: Math.PI * 1.85});
  const band = r => mesh.lathe([[r - .23, 0], [r + .23, 0], [r + .23, .012], [r - .23, .012]], 96, {from: -.55, to: .55});

  // ---- kinematics (pure functions of t), set once the plan times are known
  let curveAt = () => 1;
  const DT = 1 / 300, table = [0];
  const Dacc = t => { const i = Math.min(table.length - 1, Math.max(0, Math.floor(t / DT))); return table[i] + (t / DT - i) * ((table[i + 1] ?? table[i]) - table[i]); };
  const thC = t => OMEGA * t, thL = t => thC(t) - Dacc(t), thR = t => thC(t) + Dacc(t), thP = t => Dacc(t), thPin = t => thC(t) * ZR / ZP;

  globalThis.explainer3dTopic = {
    shots: [{id: 'corner', scene: 'df', accent: '#ffc857'}, {id: 'diff', scene: 'df', accent: '#6fc3ff'}, {id: 'curve', scene: 'df', accent: '#e07a3a'}],
    css: K.css,
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: () => '',
    build(ctx) {
      const {P, motion} = ctx;
      const {key} = motion;
      const kit = K.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const smooth = p => { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); };
      const straight0 = S('diff').start, straight1 = S('curve').start;
      curveAt = t => 1 - smooth((t - straight0 + .3) / .6) + smooth((t - straight1 + .3) / .6);
      for (let i = 1; i * DT <= S('curve').end + 1; i++) table.push(table[i - 1] + OMEGA * DELTA * curveAt(i * DT) * DT);
      const fov = 32, dist = r => K.fitDistance(r, fov, ctx.aspect);
      const L = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const top = ctx.safe.top + 5;
      K.scene('df', {background: ['#27313d', '#07090c'], light: {dir: [-.35, -1, -.5], color: '#fff3e6'}, sky: '#c3d1df', ground: '#2b2620', shadowRadius: 6, env: .9,
        camera: K.orbitKeys([[S('corner').start, {az: 200, el: 58, dist: dist(3.4), target: [-.4, -.4, 0], fov}], [S('corner').end - .2, {az: 196, el: 50, dist: dist(3.0), target: [-.3, -.3, 0], fov}],
          [cue('ring') - .2, {az: 150, el: 26, dist: dist(1.55), target: [0, 0, 0], fov}], [cue('planet') + .6, {az: 130, el: 22, dist: dist(1.45), target: [0, 0, 0], fov}],
          [cue('speeds'), {az: 118, el: 24, dist: dist(1.6), target: [0, 0, 0], fov}], [S('curve').end, {az: 96, el: 30, dist: dist(2.1), target: [0, -.1, 0], fov}]])});
      // road with the two wheel tracks around the turn centre (x = -RC); the outer track lights up on "longer"
      node('df', {id: 'road', mesh: mesh.plane(60, 60), material: MAT.road, pos: [0, -.795, 0], castShadow: false});
      node('df', {id: 'track-in', mesh: band(RC - W), material: MAT.track, pos: [-RC, -.79, 0], castShadow: false});
      node('df', {id: 'track-out', mesh: band(RC + W), material: MAT.track, pos: [-RC, -.79, 0], castShadow: false, emissive: kit.highlight('#ffc857', cue('longer'), .55)});
      // axle frame: local +Y = world +X (left wheel at -W, right/outer wheel at +W)
      node('df', {id: 'frame', pos: [0, 0, 0], rot: [0, 0, -90]});
      for (const [side, y, th, flip] of [['l', -W, thL, false], ['r', W, thR, true]]) {
        node('df', {id: `wheel-${side}`, parent: 'frame', pos: [0, y, 0], rot: t => [0, th(t), 0]});
        node('df', {id: `tyre-${side}`, parent: `wheel-${side}`, mesh: TYRE, material: MAT.tyre});
        node('df', {id: `hub-${side}`, parent: `wheel-${side}`, mesh: HUB, material: MAT.rim});
        for (let k = 0; k < 5; k++) node('df', {id: `spoke-${side}${k}`, parent: `wheel-${side}`, mesh: mesh.box(.44, .05, .09), material: MAT.steel, pos: [Math.cos(k * 1.2566) * .26, flip ? -.2 : .2, Math.sin(k * 1.2566) * .26], rot: [0, -k * 72, 0]});
        node('df', {id: `shaft-${side}`, parent: `wheel-${side}`, mesh: ROD(W - D), material: MAT.steel, rot: flip ? [180, 0, 0] : [0, 0, 0]});
        node('df', {id: `side-${side}`, parent: `wheel-${side}`, mesh: SIDE, material: MAT.side, pos: [0, flip ? -(W - D) : W - D, 0], rot: flip ? [180, 0, 0] : [0, 0, 0], proxy: 'p-diff'});
      }
      // carrier (turns with the ring gear) holding the cross pin and the two planet gears; cut-away case
      node('df', {id: 'carrier', parent: 'frame', rot: t => [0, thC(t), 0]});
      node('df', {id: 'case', parent: 'carrier', mesh: CASE, material: MAT.case, proxy: 'p-diff'});
      node('df', {id: 'ring', parent: 'carrier', mesh: RING, material: MAT.gear, pos: [0, -.97, 0], proxy: 'p-diff', emissive: kit.highlight('#ffc857', cue('ring'), .3)});
      node('df', {id: 'pin', parent: 'carrier', mesh: ROD(1.6), material: MAT.steel, pos: [.8, 0, 0], rot: [0, 0, 90], proxy: 'p-diff'});
      for (const [sg, x] of [['a', 1], ['b', -1]]) {
        node('df', {id: `pframe-${sg}`, parent: 'carrier', pos: [x * D, 0, 0], rot: [0, 0, x > 0 ? 90 : -90]});
        node('df', {id: `planet-${sg}`, parent: `pframe-${sg}`, mesh: PLANET, material: MAT.planet, rot: t => [0, x * thP(t), 0], proxy: 'p-diff', emissive: kit.highlight('#ff9a4a', cue('planet'), .3)});
      }
      // pinion and drive shaft (fixed axis toward the front, meshing with the ring gear)
      node('df', {id: 'pin-frame', parent: 'frame', pos: [0, -.72, 1.5], rot: [-90, 0, 0]});
      node('df', {id: 'pinion', parent: 'pin-frame', mesh: PINION, material: MAT.gear, rot: t => [0, thPin(t), 0], proxy: 'p-diff'});
      node('df', {id: 'prop', parent: 'pin-frame', mesh: ROD(2.4), material: MAT.steel, rot: [180, 0, 0], proxy: 'p-diff'});
      const objs = [P('p-diff', null, 50, 50, 1, 4, {required: true}),
        L('l-longer', [50, top], 70, 'outer path is longer', 'spec', {accent: '#ffc857'}),
        L('l-ring', [50, top], 50, 'ring gear', 'spec', {accent: '#ffc857'}), L('l-planet', [50, top + 6], 50, 'planet gears', 'spec', {accent: '#e07a3a'}),
        L('l-slow', [28, top], 40, 'inner: slower', 'spec', {accent: '#6fc3ff'}), L('l-fast', [72, top], 40, 'outer: faster', 'spec', {accent: '#ffc857'}),
        L('l-avg', [50, top + 7], 78, 'carrier = average of the two', 'badge', {accent: '#ffc857'})];
      kit.label('l-longer', 'longer', S('corner').end - .1);
      kit.appear('p-diff', 'diff', .6);
      kit.label('l-ring', 'ring', S('curve').start - .1); kit.label('l-planet', 'planet', S('curve').start - .1);
      kit.label('l-fast', 'speeds'); kit.label('l-slow', 'slows'); kit.label('l-avg', 'average');
      const still = id => [key(S(id).start, [0, 0, 1])];
      return {scenes: {df: {objects: objs}}, cameras: {corner: still('corner'), diff: still('diff'), curve: still('curve')},
        checks: {keyframes: [['corner', cue('longer') + .7], ['parts', cue('planet') + .8], ['average', cue('average') + .7]],
          ratios: [{a: t => thL(t) + thR(t), b: thC, ratio: .5, label: 'carrier = average of the wheels'},
            {a: t => thR(t) - thL(t), b: thP, ratio: .5, label: 'planet spin = half the wheel difference'},
            {a: thC, b: thPin, ratio: ZR / ZP, label: 'pinion = carrier x ring/pinion teeth'}]}};
    },
  };
})();
