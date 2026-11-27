// P017.8 compact 3D Explainer fixture (test only), Telugu labels: a real 3D gearbox rendered in WebGL2. Shot 1: an
// orbiting camera on a closed housing; on the cue the lid lifts and the front wall swings away (exploded view) revealing
// two extruded spur gears meshing at the true 12:24 ratio. `dolly` transition. Shot 2: a closer view; each gear glows on
// its word. Camera moments come from the plan; visibility of 3D parts is checked through DOM proxies.
(() => {
  const K = globalThis.k3d, {mesh, material, node} = K;
  const ZA = 12, ZB = 24, MOD = .09;
  const T = {parts: 'చక్రాలు', small: `చిన్న చక్రం · ${ZA} పళ్ళు`, big: `పెద్ద చక్రం · ${ZB} పళ్ళు`, slow: 'సగం వేగం'};
  const GA = mesh.gear(ZA, MOD, .26), GB = mesh.gear(ZB, MOD, .26), AX = mesh.cylinder(.07, .95), HUB = mesh.cylinder(.16, .34, 24);
  const XA = -1.06, XB = XA + GA.pitch + GB.pitch;          // centre distance m(z1 + z2)/2
  const MAT = {steel: material('#8796a6', {metal: .85, rough: .32}), dark: material('#39424d', {metal: .7, rough: .45}), brass: material('#c9a24b', {metal: .9, rough: .28}),
    copper: material('#c8703f', {metal: .9, rough: .3}), floor: material('#1b2129', {metal: 0, rough: .9}), axle: material('#c7d0da', {metal: 1, rough: .2})};
  const PARTS = {back: [mesh.box(3.9, 2.9, .12), [0, 0, -.5]], bottom: [mesh.box(3.9, .12, 1.1), [0, -1.45, 0]], left: [mesh.box(.12, 2.9, 1.1), [-1.95, 0, 0]],
    right: [mesh.box(.12, 2.9, 1.1), [1.95, 0, 0]]};
  let land = false;
  const pc = (x, y) => [x, y];

  globalThis.explainer3dTopic = {
    shots: [
      {id: 'box', scene: 'g-box', accent: '#6fc3ff', transition: {type: 'dolly'}},
      {id: 'mesh', scene: 'g-mesh', accent: '#ffc857'},
    ],
    css: K.css,
    symbols: () => '',
    build(ctx) {
      land = ctx.aspect > 1;
      const {P, motion} = ctx;
      const {key} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const L = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const proxy = (id, required = true) => P(id, null, 50, 50, 1, 4, {required});
      const [spinA, spinB] = kit.mesh(ZA, ZB, 70);
      const fov = 30, dist = r => K.fitDistance(r, fov, ctx.aspect);
      const gears = (s, pa, pb, glowA, glowB) => {
        node(s, {id: `${s}-ga`, mesh: GA, material: MAT.brass, pos: [XA, 0, 0], rot: spinA, proxy: pa, emissive: glowA});
        node(s, {id: `${s}-gb`, mesh: GB, material: MAT.copper, pos: [XB, 0, 0], rot: spinB, proxy: pb, emissive: glowB});
        for (const x of [XA, XB]) { node(s, {id: `${s}-ax${x}`, mesh: AX, material: MAT.axle, pos: [x, 0, -.1], proxy: pa}); node(s, {id: `${s}-hub${x}`, mesh: HUB, material: MAT.dark, pos: [x, 0, 0], proxy: pa}); }
        for (const [k, [m, p]] of Object.entries(PARTS)) node(s, {id: `${s}-${k}`, mesh: m, material: MAT.steel, pos: p});
        node(s, {id: `${s}-floor`, mesh: mesh.plane(40, 40), material: MAT.floor, pos: [0, -1.52, 0], castShadow: false});
      };
      // 1. closed housing; lid and front wall explode away on the cue
      const open = cue('window');
      K.scene('g-box', {background: ['#2b3646', '#0b0f14'], light: {dir: [-.45, -1, -.55], color: '#fff2e2'}, sky: '#aebfd2', ground: '#3b3128', shadowRadius: 5,
        camera: kit.planOrbit('box', {az: 40, el: 20, dist: dist(2.9), fov}, [{az: 22, el: 26, dist: dist(2.75), fov}], {az: 16, el: 24, dist: dist(2.7), fov})});
      gears('g-box', 's-gears', 's-gears');
      node('g-box', {id: 'lid', mesh: mesh.box(3.9, .12, 1.1), material: MAT.steel, pos: kit.explode([0, 1.45, 0], [0, 1.35, -.2], open), rot: kit.explode([0, 0, 0], [-18, 0, 0], open)});
      node('g-box', {id: 'front', mesh: mesh.box(3.9, 2.9, .12), material: MAT.dark, pos: kit.explode([0, 0, .5], [0, -1.1, 1.55], open, .9), rot: kit.explode([0, 0, 0], [78, 0, 0], open, .9)});
      // 2. closer view, each gear glows on its word
      K.scene('g-mesh', {background: ['#26303e', '#090c10'], light: {dir: [-.35, -1, -.7], color: '#fff2e2'}, sky: '#aebfd2', ground: '#3b3128', shadowRadius: 5,
        camera: kit.planOrbit('mesh', {az: 14, el: 12, dist: dist(2.35), target: [-.15, 0, 0], fov}, [{az: -10, el: 18, dist: dist(2.3), target: [-.15, 0, 0], fov}], {az: -14, el: 20, dist: dist(2.3), target: [-.15, 0, 0], fov})});
      gears('g-mesh', 'c-ga', 'c-gb', kit.highlight('#3fb6ff', cue('small')), kit.highlight('#ffb000', cue('big'), .3));
      const scenes = {
        'g-box': {objects: [proxy('s-gears'), L('s-tag', land ? pc(84, 18) : pc(50, 12), land ? 18 : 34, T.parts, 'title')]},
        'g-mesh': {objects: [proxy('c-ga'), proxy('c-gb'), L('c-tag-a', land ? pc(82, 16) : pc(50, 9), land ? 26 : 56, T.small, 'spec', {accent: '#3fb6ff'}),
          L('c-tag-b', land ? pc(82, 30) : pc(50, 17), land ? 26 : 56, T.big, 'spec', {accent: '#ffb000'}), L('c-tag-slow', land ? pc(82, 46) : pc(50, ctx.presentation === 'full-bleed' ? Math.min(88, ctx.safe.captionTop - 6) : 88), land ? 16 : 30, T.slow, 'badge')]},
      };
      kit.appear('s-gears', 'window', .5);
      kit.label('s-tag', 'parts');
      kit.label('c-tag-a', 'small'); kit.label('c-tag-b', 'big'); kit.label('c-tag-slow', 'slow');
      // the 2D stage camera stays still (the 3D camera moves); its keys mark the plan's camera moments
      const still = id => { const s = S(id), sh = ctx.plan.shots.find(x => x.id === id); return [key(s.start, [0, 0, 1]), ...(sh.camera ?? []).map(m => key(m.seconds, [0, 0, 1]))]; };
      return {scenes, cameras: {box: still('box'), mesh: still('mesh')},
        checks: {keyframes: [['closed', .4], ['exploded', open + 1.0], ['dolly', S('box').end + .1], ['glow', cue('slow') + .6]]}};
    },
  };
})();
