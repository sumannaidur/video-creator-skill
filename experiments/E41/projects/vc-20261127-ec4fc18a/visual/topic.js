// "How does a lighthouse lens send light so far?" (en-IN, 3D Explainer, full-bleed). Original procedural WebGL artwork.
//   coast  - dusk headland, banded tower, glass lantern, a beam sweeping over a reflective sea toward a ship.
//   flame  - studio: the bare lamp spills rays in every direction.
//   rings  - a barrel Fresnel lens assembles (glass prism rings, bronze ribs); the central belt bends rays into four beams.
//   prisms - close on the outer prisms: steep rays enter, reflect inside the glass and leave level with the beam.
//   sweep  - back outside: the lens turns; from behind the ship the beam swings into view as a flash.
// Rays are idealised; the lens is a generic catadioptric design; four beams follow the sourced four-flash lens.
(() => {
  const K = globalThis.k3d, {mesh, material, node} = K;
  const ROD = (len, r = .016) => mesh.lathe([[1e-4, 0], [r, 0], [r, len], [1e-4, len]], 10);
  const MAT = {
    glass: material('#d6efff', {metal: .25, rough: .05, opacity: .38}), bronze: material('#8c6239', {metal: 1, rough: .32}), iron: material('#2a2e33', {metal: .7, rough: .5}),
    lamp: material('#fff1c4', {emissive: '#ffd27a'}), glow: material('#ffd27a', {emissive: '#ffc35a', opacity: .22}), ray: material('#ffe29a', {emissive: '#ffcf70', opacity: .7}),
    beam: material('#ffe7a8', {emissive: '#ffdc8a', opacity: .13}), floor: material('#14181e', {metal: .3, rough: .4}),
    sea: material('#0a1a28', {metal: .35, rough: .28}), rock: material('#4a4038', {rough: .92}), white: material('#ece8df', {rough: .55}), red: material('#a3322a', {rough: .5}),
    dark: material('#2b2f35', {metal: .6, rough: .45}), roof: material('#5a1d1a', {metal: .4, rough: .4}), hull: material('#26313d', {rough: .6}), cabin: material('#d9d4c8', {rough: .6}),
    lantern: material('#bfe3ff', {metal: .2, rough: .05, opacity: .2}), flare: material('#ffffff', {emissive: '#ffffff', opacity: .9}),
  };
  // ---- barrel Fresnel lens about +Y (radius ~1.1): a central belt, refracting rings, and larger catadioptric prism rings
  const belt = mesh.lathe([[.95, -.26], [1.07, -.14], [1.1, 0], [1.07, .14], [.95, .26]], 72);
  const ring = (y0, depth, h) => mesh.lathe([[.95, y0], [.95 + depth, y0 + h * .4], [.95, y0 + h]], 72);
  const REFR = [0, 1, 2].map(k => ring(.28 + k * .17, .12, .15)), CATA = [0, 1, 2].map(k => ring(.82 + k * .2, .3 + k * .03, .19));
  const flip = m => ({...m, data: m.data.map((v, i) => [1, 4].includes(i % 6) ? -v : v)});      // mirror in y (positions and normals)
  const lens = (sc, parent, prefix, proxy) => {
    node(sc, {id: `${prefix}-belt`, parent, mesh: belt, material: MAT.glass, proxy, castShadow: false});
    [...REFR, ...CATA].forEach((m, i) => { node(sc, {id: `${prefix}-u${i}`, parent, mesh: m, material: MAT.glass, proxy, castShadow: false}); node(sc, {id: `${prefix}-d${i}`, parent, mesh: flip(m), material: MAT.glass, proxy, castShadow: false}); });
    for (let k = 0; k < 8; k++) node(sc, {id: `${prefix}-rib${k}`, parent, mesh: mesh.box(.05, 2.9, .05), material: MAT.bronze, pos: [Math.cos(k * Math.PI / 4) * 1.14, 0, Math.sin(k * Math.PI / 4) * 1.14], proxy});
    for (const y of [-1.45, -.27, .27, 1.45]) node(sc, {id: `${prefix}-hoop${y}`, parent, mesh: mesh.lathe([[1.12, y - .025], [1.17, y - .025], [1.17, y + .025], [1.12, y + .025]], 72), material: MAT.bronze, proxy});
  };
  // a ray from the origin at elevation e (deg) and azimuth a (deg), length len, starting at distance r0
  const ray = (sc, id, e, a, len, proxy, {r0 = 0, y0 = 0, mat = MAT.ray, rad} = {}) => {
    node(sc, {id: `${id}-az`, pos: [0, y0, 0], rot: [0, a, 0]});
    node(sc, {id: `${id}-el`, parent: `${id}-az`, rot: [0, 0, -(90 - e)]});
    node(sc, {id, parent: `${id}-el`, mesh: ROD(len, rad), material: mat, pos: [0, r0, 0], proxy, castShadow: false});
  };
  let VPHASE = 0;

  globalThis.explainer3dTopic = {
    shots: [{id: 'coast', scene: 'coast', accent: '#ffd27a'}, {id: 'flame', scene: 'lens', accent: '#ffc35a'}, {id: 'rings', scene: 'lens', accent: '#9fd3ff'},
      {id: 'prisms', scene: 'lens', accent: '#9fd3ff'}, {id: 'sweep', scene: 'coast', accent: '#ffd27a'}],
    css: K.css,
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}, hook: {text: 'One lamp. Seen for miles?', highlight: 'miles', until: 2.0}},
    symbols: () => '',
    build(ctx) {
      const {P, motion} = ctx;
      const {key} = motion;
      const kit = K.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const fov = 30, fit = r => K.fitDistance(r, fov, ctx.aspect);
      const L = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const top = ctx.safe.top + 5, end = S('sweep').end;
      // beam azimuth: turning at 40 deg/s; faces the final camera (az 160 -> phi 70) at t = 29.35
      const SHIP_AZ = 160, phi = t => 70 + 40 * (t - 29.35);
      // ---------- coast ----------
      K.scene('coast', {background: ['#3b4b70', '#0c111d'], light: {dir: [.6, -.45, .5], color: '#ffd9b0'}, sky: '#4a5a80', ground: '#10151b', shadowRadius: 30, env: .7,
        camera: K.orbitKeys([[0, {az: 222, el: 10, dist: 78, target: [0, 7, 0], fov}], [S('coast').end, {az: 205, el: 7, dist: 54, target: [0, 8, 0], fov}],
          [S('sweep').start, {az: 196, el: 6, dist: 46, target: [0, 9, 0], fov}], [cue('turn'), {az: 180, el: 4, dist: 56, target: [2, 7, -10], fov}], [end, {az: SHIP_AZ, el: 1.5, dist: 64, target: [0, 5, 0], fov}]])});
      node('coast', {id: 'sea', mesh: mesh.plane(600, 600), material: MAT.sea, castShadow: false});
      node('coast', {id: 'head', mesh: mesh.lathe([[1e-4, 4.2], [3, 4.1], [6.5, 3], [10, 1.4], [15, -.4]], 48), material: MAT.rock});
      node('coast', {id: 'tower', mesh: mesh.lathe([[1.7, 4], [1.15, 14]], 48), material: MAT.white, pos: [0, 0, 0]});
      node('coast', {id: 'band', mesh: mesh.lathe([[1.52, 7.6], [1.37, 10.4]], 48), material: MAT.red, scale: [1.02, 1, 1.02]});
      node('coast', {id: 'gallery', mesh: mesh.lathe([[1e-4, 14], [1.85, 14], [1.85, 14.18], [1e-4, 14.18]], 48), material: MAT.dark});
      node('coast', {id: 'rail', mesh: mesh.lathe([[1.76, 14.18], [1.8, 14.18], [1.8, 14.7], [1.76, 14.7]], 48), material: MAT.dark, castShadow: false});
      node('coast', {id: 'lantern', mesh: mesh.lathe([[1.0, 14.18], [1.0, 16.0], [1.03, 16.0], [1.03, 14.18]], 48), material: MAT.lantern, castShadow: false});
      node('coast', {id: 'roof', mesh: mesh.lathe([[1.2, 16], [.95, 16.5], [.45, 16.95], [1e-4, 17.1]], 48), material: MAT.roof});
      node('coast', {id: 'c-lens', mesh: mesh.lathe([[.55, 14.4], [.62, 15.1], [.55, 15.8]], 32), material: MAT.glass, rot: t => [0, phi(t), 0], castShadow: false});
      node('coast', {id: 'c-lamp', mesh: mesh.sphere(.3, 16), material: MAT.lamp, pos: [0, 15.1, 0], castShadow: false});
      for (let k = 0; k < 4; k++) {                                                   // four beams turning with the lens
        node('coast', {id: `cb-az${k}`, pos: [0, 15.1, 0], rot: t => [0, phi(t) + k * 90, 0]});
        node('coast', {id: `cb-${k}`, parent: `cb-az${k}`, mesh: mesh.lathe([[.45, 0], [4, 48]], 24), material: MAT.beam, rot: [0, 0, -90], castShadow: false});   // open cone, shorter than the final camera distance
      }
      const SA = (SHIP_AZ - 12) * Math.PI / 180, shipAt = [Math.sin(SA) * 28, 0, Math.cos(SA) * 28];      // beside the line of sight, in frame below the tower
      node('coast', {id: 'ship', pos: shipAt, rot: [0, SHIP_AZ + 70, 0]});
      node('coast', {id: 'hull', parent: 'ship', mesh: mesh.extrude([[-3.2, 0], [3.2, 0], [3.8, 1.3], [-3.6, 1.3]], 1.6), material: MAT.hull, pos: [0, -.4, -.8]});
      node('coast', {id: 'cabin', parent: 'ship', mesh: mesh.box(1.8, 1.1, 1.3), material: MAT.cabin, pos: [-1, 1.45, 0]});
      node('coast', {id: 'mast', parent: 'ship', mesh: ROD(3, .06), material: MAT.dark, pos: [1.2, .9, 0]});
      node('coast', {id: 'glare', mesh: mesh.sphere(1.25, 24), material: MAT.flare, pos: [0, 15.1, 0], proxy: 'p-glare', castShadow: false});
      // ---------- lens (studio) ----------
      K.scene('lens', {background: ['#1b2230', '#06080c'], light: {dir: [-.4, -1, -.3], color: '#fff3e6'}, sky: '#9fb3cc', ground: '#20232a', shadowRadius: 5, env: .9,
        camera: K.orbitKeys([[S('flame').start, {az: 28, el: 14, dist: fit(1.2), target: [0, 0, 0], fov}], [cue('spill') + 1.2, {az: 22, el: 10, dist: fit(2.4), target: [0, 0, 0], fov}],
          [S('rings').start, {az: 30, el: 12, dist: fit(2.0), target: [0, 0, 0], fov}], [cue('straight') + .4, {az: 18, el: 8, dist: fit(2.6), target: [0, 0, 0], fov}],
          [S('prisms').start, {az: 62, el: 6, dist: fit(1.15), target: [.8, .7, 0], fov}], [cue('reflect') + 1.2, {az: 52, el: 4, dist: fit(1.35), target: [1.0, .6, 0], fov}], [S('prisms').end, {az: 46, el: 4, dist: fit(1.5), target: [1.2, .5, 0], fov}]])});
      node('lens', {id: 'floor', mesh: mesh.plane(40, 40), material: MAT.floor, pos: [0, -2.3, 0], castShadow: false});
      node('lens', {id: 'pedestal', mesh: mesh.lathe([[1e-4, -2.3], [.9, -2.3], [.7, -1.8], [.5, -1.55], [1e-4, -1.55]], 48), material: MAT.iron});
      node('lens', {id: 'lamp', mesh: mesh.sphere(.13, 24), material: MAT.lamp});
      node('lens', {id: 'lamp-glow', mesh: mesh.sphere(.34, 24), material: MAT.glow, castShadow: false});
      node('lens', {id: 'burner', mesh: ROD(1.4, .04), material: MAT.iron, pos: [0, -1.55, 0]});
      node('lens', {id: 'lens-frame', pos: t => [0, 0, 0], scale: t => { const k = Math.max(0, Math.min(1, (t - cue('rings') + .1) / 1.0)); const e = k * k * (3 - 2 * k); return [1, .55 + .45 * e, 1]; }});
      lens('lens', 'lens-frame', 'f', 'p-rings');
      // bare lamp: rays in every direction
      let n = 0; for (const e of [-70, -40, -15, 15, 40, 70]) for (let a = 0; a < 360; a += 60) ray('lens', `sp${n++}`, e, a + (e > 0 ? 30 : 0), 3.4, 'p-spill', {r0: .15});
      // four beams: from the lamp to the belt, then straight out, at five heights
      for (let b = 0; b < 4; b++) for (const [i, y] of [-.18, -.09, 0, .09, .18].entries()) {
        ray('lens', `bi${b}-${i}`, Math.atan2(y, 1) * 180 / Math.PI, b * 90 + 45, Math.hypot(1, y), 'p-beam', {r0: .15});
        ray('lens', `bo${b}-${i}`, 0, b * 90 + 45, 7, 'p-beam', {r0: 1.1, y0: y});
      }
      for (let b = 0; b < 4; b++) { node('lens', {id: `lb-az${b}`, rot: [0, b * 90 + 45, 0]}); node('lens', {id: `lb-${b}`, parent: `lb-az${b}`, mesh: mesh.lathe([[1e-4, 1.1], [.34, 1.1], [.9, 8], [1e-4, 8]], 24), material: MAT.beam, rot: [0, 0, -90], proxy: 'p-beam', castShadow: false, emissive: kit.highlight('#ffdc8a', cue('reflect') + 2.6, .6, .6)}); }
      // outer prisms: steep rays to each catadioptric ring (upper and lower) in the beam directions, then level out
      for (let b = 0; b < 4; b++) for (const [i, y] of [.92, 1.12, 1.32].entries()) for (const s of [1, -1]) {
        const e = Math.atan2(s * y, 1.05) * 180 / Math.PI;
        ray('lens', `st${b}-${i}-${s}`, e, b * 90 + 45, Math.hypot(1.05, y), 'p-steep', {r0: .15});
        ray('lens', `tr${b}-${i}-${s}`, 0, b * 90 + 45, 6.5, 'p-tir', {r0: 1.25, y0: s * y});
      }
      const objs = [P('p-spill', null, 50, 50, 1, 4), P('p-rings', null, 50, 50, 1, 4), P('p-beam', null, 50, 50, 1, 4), P('p-steep', null, 50, 50, 1, 4), P('p-tir', null, 50, 50, 1, 4), P('p-glare', null, 50, 50, 1, 4),
        L('l-lamp', [50, top], 50, 'one lamp', 'spec', {accent: '#ffd27a'}), L('l-central', [50, top], 60, 'central rings: bend', 'spec', {accent: '#9fd3ff'}),
        L('l-outer', [50, top], 70, 'outer prisms: reflect inside', 'spec', {accent: '#9fd3ff'}), L('l-turn', [50, top], 50, 'the lens turns', 'spec', {accent: '#ffd27a'})];
      kit.label('l-lamp', 'lamp', S('coast').end - .3);
      kit.appear('p-spill', 'spill', .5);
      motion.track('p-spill', [key(0, [0, 0, 0, 1, 0]), key(cue('spill'), [0, 0, 0, 1, 0]), key(cue('spill') + .5, [0, 0, 0, 1, 1], 'out'), key(cue('rings') + .4, [0, 0, 0, 1, 1]), key(cue('rings') + 1.2, [0, 0, 0, 1, 0])]);
      motion.speechCue('spill', 'p-spill');
      kit.appear('p-rings', 'rings', .7); kit.label('l-central', 'central', S('rings').end - .3); kit.appear('p-beam', 'straight', .6);
      kit.label('l-outer', 'outer', S('prisms').end - .3); kit.appear('p-steep', 'steep', .4); kit.appear('p-tir', 'reflect', .5);
      kit.label('l-turn', 'turn', end - .2);
      motion.track('p-glare', [key(0, [0, 0, 0, 1, 0]), key(cue('flash'), [0, 0, 0, 1, 0]), key(cue('flash') + .55, [0, 0, 0, 1, .9], 'out'), key(29.6, [0, 0, 0, 1, .9]), key(end, [0, 0, 0, 1, .55])]);
      motion.speechCue('flash', 'p-glare');
      const still = id => [key(S(id).start, [0, 0, 1])];
      return {scenes: {coast: {objects: objs.filter(o => ['p-glare', 'l-lamp', 'l-turn'].includes(o.id))}, lens: {objects: objs.filter(o => !['p-glare', 'l-lamp', 'l-turn'].includes(o.id))}},
        cameras: Object.fromEntries(['coast', 'flame', 'rings', 'prisms', 'sweep'].map(id => [id, still(id)])),
        checks: {keyframes: [['coast', cue('lamp') + 2.5], ['prisms', cue('reflect') + 2.9], ['sweep', 29.45]]}};
    },
  };
})();
