// E29 / P023.9 3D Explainer study (unseen topic, en-IN): "How does a ball bearing work?" Genuine WebGL 3D, simplified.
// Geometry (1 unit = 10 mm, 6204-class proportions): outer ring OD 47 / raceway groove r 4.1 mm; inner ring bore 20;
// 8 balls dia 7.94 mm on pitch diameter dm 33.5 mm; outer ring cut away (90-degree sector) with section faces.
// Kinematics (outer ring fixed, contact angle 0, pure rolling): cage / balls orbit at kc = (1 - g)/2 of the shaft speed,
// g = Dw/dm; each ball spins relative to the cage at kbr = -(1 - g^2) / (2g) of the shaft speed. Speeds slowed for legibility.
(() => {
  const K = globalThis.k3d, {mesh, material, node} = K;
  const DM = 3.35, RP = DM / 2, DW = .794, RB = DW / 2, RG = .41, G = DW / DM, KC = (1 - G) / 2, KBR = -(1 - G * G) / (2 * G), W = .7;
  const outerProf = [[1.98, -W / 2], [2.35, -W / 2], [2.35, W / 2], [1.98, W / 2], [1.98, .274], ...Array.from({length: 13}, (_, i) => { const y = .274 - i * .548 / 12; return [RP + Math.sqrt(RG * RG - y * y), y]; }), [1.98, -.274]];
  const innerProf = [[1.0, -W / 2], [1.37, -W / 2], [1.37, -.274], ...Array.from({length: 13}, (_, i) => { const y = -.274 + i * .548 / 12; return [RP - Math.sqrt(RG * RG - y * y), y]; }), [1.37, .274], [1.37, W / 2], [1.0, W / 2]];
  const OPEN = 60 * Math.PI / 180;                                            // sector facing the camera's starting azimuth
  const OUTER = mesh.lathe(outerProf, 96, {from: OPEN + Math.PI / 4, to: OPEN - Math.PI / 4 + Math.PI * 2}), INNER = mesh.lathe(innerProf, 96);
  const BALL = mesh.sphere(RB, 32), DOT = mesh.sphere(.09, 12), SHAFT = mesh.lathe([[1e-4, -2.4], [.995, -2.4], [.995, 2.4], [1e-4, 2.4]], 64);
  const CAGE = mesh.lathe([[1.5, .405], [1.86, .405], [1.86, .445], [1.5, .445]], 72), CAGE2 = mesh.lathe([[1.5, -.445], [1.86, -.445], [1.86, -.405], [1.5, -.405]], 72);
  const MAT = {steel: material('#b8c0c8', {metal: 1, rough: .18}), ring: material('#9aa4ae', {metal: 1, rough: .3}), cut: material('#d9dee3', {metal: .6, rough: .55}),
    ball: material('#e4e9ee', {metal: 1, rough: .08}), dot: material('#22272d', {metal: .2, rough: .6}), brass: material('#c9a24b', {metal: 1, rough: .3}),
    shaft: material('#6f7a86', {metal: 1, rough: .35}), floor: material('#14181e', {metal: 0, rough: .9})};
  globalThis.E29 = {KC, KBR, G};

  globalThis.explainer3dTopic = {
    shots: [{id: 'bearing', scene: 'bb', accent: '#6fc3ff'}, {id: 'balls', scene: 'bb', accent: '#ffc857'}, {id: 'speed', scene: 'bb', accent: '#ffc857'}],
    css: K.css,
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: () => '',
    build(ctx) {
      const {P, motion} = ctx;
      const {key} = motion;
      const kit = K.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const L = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const proxy = id => P(id, null, 50, 50, 1, 4, {required: true});
      const s1 = S('bearing').start, end = S('speed').end, OMEGA = 50;                  // shaft deg/s (slowed)
      const th = t => OMEGA * Math.max(0, t - s1);
      const fov = 30, dist = r => K.fitDistance(r, fov, ctx.aspect);
      K.scene('bb', {background: ['#26303c', '#07090c'], light: {dir: [-.4, -1, -.35], color: '#fff3e6'}, sky: '#c3d1df', ground: '#2c2622', shadowRadius: 4, env: 1,
        camera: K.orbitKeys([[s1, {az: 30, el: 38, dist: dist(2.7), target: [0, .15, 0], fov}], [cue('balls') + .4, {az: 42, el: 30, dist: dist(2.2), target: [.25, 0, .3], fov}],
          [cue('half'), {az: 58, el: 34, dist: dist(2.35), target: [.15, 0, .2], fov}], [end, {az: 72, el: 40, dist: dist(2.6), target: [0, .1, 0], fov}]])});
      node('bb', {id: 'floor', mesh: mesh.plane(40, 40), material: MAT.floor, pos: [0, -2.4, 0], castShadow: false});
      node('bb', {id: 'outer', mesh: OUTER, material: MAT.ring, pos: [0, 0, 0], proxy: 'p-ring'});
      node('bb', {id: 'outer-cut', mesh: OUTER.caps, material: MAT.cut, pos: [0, 0, 0], proxy: 'p-ring'});
      node('bb', {id: 'inner', mesh: INNER, material: MAT.ring, pos: [0, 0, 0], rot: t => [0, th(t), 0], proxy: 'p-ring'});
      node('bb', {id: 'shaft', mesh: SHAFT, material: MAT.shaft, pos: [0, 0, 0], rot: t => [0, th(t), 0]});
      node('bb', {id: 'key', mesh: mesh.box(.22, 1.6, .12), material: MAT.brass, pos: [0, 1.4, 1.0], parent: 'shaft'});
      node('bb', {id: 'cage', pos: [0, 0, 0], rot: t => [0, KC * th(t), 0]});
      node('bb', {id: 'cage-a', mesh: CAGE, material: MAT.brass, parent: 'cage', proxy: 'p-balls'});
      node('bb', {id: 'cage-b', mesh: CAGE2, material: MAT.brass, parent: 'cage', proxy: 'p-balls'});
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        node('bb', {id: `ball${i}`, mesh: BALL, material: MAT.ball, parent: 'cage', pos: [Math.cos(a) * RP, 0, Math.sin(a) * RP], rot: t => [0, KBR * th(t), 0], proxy: 'p-balls'});
        node('bb', {id: `dot${i}`, mesh: DOT, material: MAT.dot, parent: `ball${i}`, pos: [RB * .92, 0, 0], proxy: 'p-balls'});
      }
      const scenes = {bb: {objects: [proxy('p-ring'), proxy('p-balls'),
        L('l-title', [50, ctx.safe.top + 4], 70, 'ball bearing', 'title'),
        L('l-inner', [30, 64], 34, 'inner ring turns', 'spec', {accent: '#6fc3ff'}), L('l-outer', [72, 22], 34, 'outer ring fixed', 'spec', {accent: '#9aa4ae'}),
        L('l-ratio', [50, ctx.safe.top + 4], 80, `cage = ${KC.toFixed(2)} × shaft speed`, 'badge', {accent: '#ffc857'})]}};
      kit.appear('p-ring', s1 + .05, .5);
      kit.label('l-title', 'bearing', S('balls').start);
      kit.appear('p-balls', 'balls', .45);
      kit.label('l-inner', cue('inner') + .1, S('speed').start + .2); kit.label('l-outer', cue('outer') + .1, S('speed').start + .2);
      kit.label('l-ratio', 'half');
      return {scenes, cameras: {bearing: [key(s1, [0, 0, 1])], balls: [key(S('balls').start, [0, 0, 1])], speed: [key(S('speed').start, [0, 0, 1])]},
        checks: {keyframes: [['bearing', cue('bearing') + .8], ['balls', cue('outer') + .6], ['speed', cue('half') + .8]]}};
    },
  };
})();
