// P018.3 Tech Explainer richness fixture (test only; an unseen topic, not a template): "how does a phone charge without a
// cable?" in English, full-bleed. A dark product studio lit by one cool key light from the upper left:
//   pad     - a charging pad under a light beam; on "coil" its lid turns to glass and the copper coil winds on; on "field"
//             glowing field loops rise towards the hovering phone. Camera pushes in, then lifts.
//   phone   - exploded view: glass, battery, receiver coil and back separate above the pad; current traces from the
//             receiver coil into the battery. Camera pulls back, then pushes into the battery.
//   battery - close-up: the battery block (brushed metal, specular rims) fills on "refills" and glows.
// options.rich === false renders the same story with pre-P018.3 means only (light studio, flat iso blocks, no glass,
// halos, beams, textures, explode helper or camera travel), for before/after comparison.
(() => {
  const {f, sym} = globalThis.techShotArt;
  const K = globalThis.techKit, A = K.art;
  const RICH = globalThis.techTopicOptions?.rich !== false;
  const COPPER = '#d98a4b', FIELD = '#5ab8ff', CHARGE = '#3ddc97';
  let VW = 1000, VH = 1778, O = [500, 1060];
  const layout = ctx => { VH = Math.round(1000 / ctx.aspect); O = [500, VH * .6]; };
  const pc = ([x, y]) => [x / VW * 100, y / VH * 100];
  const I = (x, y, z) => A.iso(O, x, y, z);
  const tex = RICH ? 'wx-brushed' : null;

  const studio = (id, pool) => RICH ? A.darkStudio(VW, VH, {id, floor: .6, pool, poolStrength: .3}) : A.studio(VW, VH, {floor: .6, id});
  const solid = (spec, base, id, metal = false) => RICH ? A.litBox(O, spec, {base, id, metal, texture: metal ? tex : null}) :
    A.isoBox(O, {...spec, top: A.mix(base, '#ffffff', .3), left: base, right: A.mix(base, '#000000', .25)});
  // ---------- pad ----------
  const padBody = () => {
    const [cx, cy] = I(0, 0, 0);
    return A.contact(cx, cy + 10, 260, 70, RICH ? .55 : .25) +
      A.isoCylinder(O, {r: 200, h: 34, top: RICH ? '#2a3346' : '#dfe5ee', side: RICH ? '#141b27' : '#b9c3d1'}) +
      (RICH ? `<ellipse cx="${f(cx)}" cy="${f(cy - 34)}" rx="${f(200 * .866 * 1.15)}" ry="${f(200 * .5 * 1.15)}" fill="none" stroke="#8fb4e8" stroke-opacity=".35" stroke-width="2"/>` : '');
  };
  const padCoil = (z = 35) => A.isoSpiral(O, {r0: 26, r1: 150, turns: 7, z, color: COPPER, shine: '#ffd3a8', width: RICH ? 7 : 6});
  const padLid = () => {
    const [cx, cy] = I(0, 0, 34), rx = 200 * .866 * 1.15, ry = 200 * .5 * 1.15;
    return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${RICH ? '#222b3b' : '#e9edf3'}"/>` +
      (RICH ? `<ellipse cx="${f(cx - rx * .25)}" cy="${f(cy - ry * .3)}" rx="${f(rx * .55)}" ry="${f(ry * .35)}" fill="#ffffff" opacity=".07"/>` : '');
  };
  const padLed = () => { const [cx, cy] = I(0, 200, 20); return (RICH ? A.halo(cx, cy, 70, {id: 'wx-led', color: FIELD, strength: .8}) : '') + `<circle cx="${f(cx)}" cy="${f(cy)}" r="7" fill="${FIELD}"/>`; };
  const beamArt = () => RICH ? A.beam([VW * .18, -40], I(0, 0, 40), 120, 520, {id: 'wx-beam', color: '#b9d3ff', strength: .2}) : '';
  const fieldLoops = (top = 230, n = 4, z = 40) => {
    const [cx, cy] = I(0, 0, z);
    return Array.from({length: n}, (_, i) => {
      const rx = 60 + i * 38, h = top - i * 30, d = `M${f(cx - rx)} ${f(cy)}C${f(cx - rx * 1.05)} ${f(cy - h)} ${f(cx + rx * 1.05)} ${f(cy - h)} ${f(cx + rx)} ${f(cy)}`;
      return (RICH ? `<path d="${d}" fill="none" stroke="${FIELD}" stroke-width="16" stroke-opacity=".14" stroke-linecap="round" style="opacity:var(--glow, 1)"/>` : '') +
        `<path d="${d}" pathLength="1" fill="none" stroke="${RICH ? '#a8dcff' : FIELD}" stroke-width="${RICH ? 3.5 : 4}" stroke-linecap="round" stroke-dasharray="${RICH ? '.04 .025' : '1 0'}" style="stroke-dashoffset:calc(1 - var(--draw, 1))"/>`;
    }).join('');
  };
  const phoneSlab = (z = 380) => solid({x: -130, y: -250, z, w: 260, d: 500, h: 22}, '#2c3648', 'wx-ph', true) +
    (() => { const T = [I(-118, -238, z + 22), I(118, -238, z + 22), I(118, 238, z + 22), I(-118, 238, z + 22)];
      return `<path d="${A.poly(T)}" fill="${RICH ? '#0e1522' : '#1b2740'}"/>` + (RICH ? `<path d="${A.poly([T[0], T[1], I(-20, 238, z + 22), T[3]])}" fill="#ffffff" opacity=".05"/>` : ''); })();
  // ---------- phone (exploded) ----------
  const LIFT = {back: 0, rcoil: -.035, battery: -.1, glass: -.19};
  const part = (name, z) => {
    if (name === 'back') return solid({x: -130, y: -250, z, w: 260, d: 500, h: 12}, '#3a465b', 'wx-back', true);
    if (name === 'rcoil') return A.isoSpiral(O, {r0: 18, r1: 100, turns: 6, z: z + 14, color: COPPER, shine: '#ffd3a8', width: 5});
    if (name === 'battery') return solid({x: -100, y: -170, z: z + 26, w: 200, d: 300, h: 30}, '#4a5a74', 'wx-bat-s', true);
    const T = [I(-130, -250, z + 70), I(130, -250, z + 70), I(130, 250, z + 70), I(-130, 250, z + 70)];
    return RICH ? A.glassBack(O, {x: -130, y: -250, z: z + 62, w: 260, d: 500, h: 8}) + A.glassFront(O, {x: -130, y: -250, z: z + 62, w: 260, d: 500, h: 8}, {tint: '#9cc8ff', opacity: .16}) +
      `<path d="${A.poly([T[0], T[1], I(-40, 250, z + 70), T[3]])}" fill="#ffffff" opacity=".08"/>`
      : solid({x: -130, y: -250, z: z + 62, w: 260, d: 500, h: 8}, '#8fa7c8', 'wx-gl');
  };
  const currentArt = z => {
    // receiver coil centre to the battery's near corner, in the exploded positions (stage fractions -> symbol units)
    const a = I(100, 0, z + 14), b = I(80, 150, z + 40);
    return A.trace([[a[0], a[1] + LIFT.rcoil * VH], [a[0] + 70, a[1] + LIFT.rcoil * VH - 30], [b[0] + 60, b[1] + LIFT.battery * VH]], {color: CHARGE, width: RICH ? 6 : 5, under: RICH ? '#1c3a33' : '#c7cfdb', round: 18});
  };
  // ---------- battery close-up ----------
  const BAT = {x: -210, y: -110, z: 0, w: 420, d: 220, h: 170};
  const batteryArt = () => { const [cx, cy] = I(0, 0, 0); return A.contact(cx, cy + 20, 330, 90, RICH ? .55 : .25) + solid(BAT, '#55657f', 'wx-bat', true) +
    solid({x: 150, y: -40, z: 170, w: 50, d: 80, h: 22}, '#9aa8bd', 'wx-term', true); };
  const fillArt = () => {
    // charge bars on the battery's left (front) face, filling bottom to top
    const {x, y, d, h} = BAT, face = y + d, w = BAT.w;
    return Array.from({length: 5}, (_, i) => {
      const z0 = 16 + i * 30, pts = [I(x + 30, face, z0 + 22), I(x + w - 30, face, z0 + 22), I(x + w - 30, face, z0), I(x + 30, face, z0)];
      return `<path d="${A.poly(pts)}" fill="${CHARGE}" opacity="${RICH ? .9 : 1}"/>` + (RICH ? `<path d="${A.poly(pts.slice(0, 2).concat([I(x + w - 30, face, z0 + 18), I(x + 30, face, z0 + 18)]))}" fill="#ffffff" opacity=".25"/>` : '');
    }).join('');
  };
  const batteryGlow = () => { const [cx, cy] = I(0, BAT.y + BAT.d, 90); return RICH ? A.halo(cx, cy, 380, {id: 'wx-bglow', color: CHARGE, strength: .35}) : ''; };

  globalThis.techTopic = {
    shots: [
      {id: 'pad', scene: 'w-pad', accent: FIELD, transition: {type: 'focus', lead: .3, tail: .35, blur: 14, zoom: .08}},
      {id: 'phone', scene: 'w-phone', accent: COPPER, transition: {type: 'focus', lead: .3, tail: .35, blur: 14, zoom: .1}},
      {id: 'battery', scene: 'w-battery', accent: CHARGE},
    ],
    css: K.css + (RICH ? ` .piece-art { filter:none }
      html[data-presentation="full-bleed"] footer .ct { box-shadow: 0 16px 36px #0008, inset 0 1px 0 #ffffff2e, 0 0 0 1.5px #9fb8e04d }
      .vc-hook { color:#eef4ff; text-shadow:0 4px 24px #000a }` : ''),
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'},
      hook: {text: 'How does a phone charge without a cable?', highlight: 'cable', until: 1.7}},
    symbols: ctx => { layout(ctx); const vb = `0 0 ${VW} ${VH}`, Z = 300; return (RICH ? A.textures('wx', {tile: 220, seed: 7}) : '') + [
      sym('w-studio-a', vb, studio('wx-sa', [.5, .66])), sym('w-studio-b', vb, studio('wx-sb', [.5, .6])), sym('w-studio-c', vb, studio('wx-sc', [.5, .64])),
      sym('w-beam', vb, beamArt()), sym('w-pad', vb, padBody()), sym('w-coil', vb, padCoil()), sym('w-lid', vb, padLid()), sym('w-led', vb, padLed()),
      sym('w-field', vb, fieldLoops(320, 5)), sym('w-phone', vb, phoneSlab()), sym('w-field-tall', vb, fieldLoops(330, 5)),
      sym('w-pad-lit', vb, padBody() + padCoil() + padLed()),
      ...['back', 'rcoil', 'battery', 'glass'].map(n => sym(`w-${n}`, vb, part(n, Z))), sym('w-current', vb, currentArt(Z)),
      sym('w-cell', vb, batteryArt()), sym('w-fill', vb, fillArt()), sym('w-bglow', vb, batteryGlow()),
    ].join(''); },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const label = (id, xy, w, text, style, extra = {}) => P(id, null, ...pc(xy), w, 5, {label: text, labelStyle: style, ...extra});
      const X = (o = {}) => ({flat: true, ...o});
      const scenes = {
        'w-pad': {objects: [plate('p-bg', 'w-studio-a', 0), ...(RICH ? [plate('p-beam', 'w-beam', 1, 'exact')] : []), plate('p-pad', 'w-pad', 2, 'exact'), plate('p-coil', 'w-coil', 3, 'exact'),
          plate('p-lid', 'w-lid', 3, 'exact'), plate('p-led', 'w-led', 3, 'exact'), plate('p-field', 'w-field', 4, 'exact'), plate('p-phone', 'w-phone', 4, 'exact'),
          label('p-tag-coil', [VW * .3, VH * .69], 44, 'transmitter coil', 'callout', {accent: COPPER}), label('p-tag-field', [VW * .72, VH * .44], 40, 'magnetic field', 'chip', {accent: '#2b7fd6'})]},
        'w-phone': {objects: [plate('ph-bg', 'w-studio-b', 0), plate('ph-pad', 'w-pad-lit', 2, 'exact'), plate('ph-field', 'w-field-tall', 3, 'exact'),
          ...['back', 'rcoil', 'battery', 'glass'].map(n => plate(`ph-${n}`, `w-${n}`, 4, 'exact')), plate('ph-current', 'w-current', 4, 'exact'),
          label('ph-tag-rc', [VW * .7, VH * .5], 34, 'receiver coil', 'callout', {accent: COPPER}), label('ph-tag-i', [VW * .26, VH * .47], 24, 'current', 'chip', {accent: '#1f9e6d'})]},
        'w-battery': {objects: [plate('b-bg', 'w-studio-c', 0), ...(RICH ? [plate('b-glow', 'w-bglow', 1, 'exact')] : []), plate('b-battery', 'w-cell', 2, 'exact'),
          plate('b-fill', 'w-fill', 3, 'exact'), label('b-tag', [VW * .5, VH * .3], 40, 'battery 80%', 'readout', {accent: CHARGE})]},
      };
      // pad: the lid turns to glass and the coil winds on; field loops rise; the phone hovers
      const coil = kit.trace('p-coil', 'coil', 1.1);
      track('p-lid', [key(S('pad').start, N), key(coil, N), key(coil + .5, [0, 0, 0, 1, RICH ? .18 : 0], 'out')]);
      const field = ctx.cue('field');
      kit.label('p-tag-coil', coil + .35, field - .3);
      kit.trace('p-field', 'field', .9);
      if (RICH) { motion.glow('p-field', [key(field + .9, [.6]), key(field + 1.4, [1]), key(field + 1.9, [.6])]); kit.pulse('p-led', S('pad').start + .2, 9, .3, .3); }
      kit.label('p-tag-field', field + .3, S('pad').end - .55);
      if (RICH) ambient('p-phone', {bob: [.004, 2.2, 0]});
      // phone: the receiver tag lands on "second" and the parts separate; current traces into the battery
      const second = kit.label('ph-tag-rc', 'second', S('phone').end - .45);
      const parts = Object.entries(LIFT).filter(([, dy]) => dy).map(([n, dy]) => [`ph-${n}`, [0, dy]]);
      for (const [n] of Object.entries(LIFT)) track(`ph-${n}`, [key(S('phone').start, N)]);
      if (RICH) kit.explode(parts, second - .15, {dur: .8, stagger: .08});
      else parts.forEach(([id, [dx, dy]]) => kit.rise(id, second - .15, 0, .4, [dx, dy, 0, 1, 1]));
      if (RICH) motion.glow('ph-field', [key(S('phone').start, [.7]), key(S('phone').start + 1, [1]), key(S('phone').end, [.7])]);
      const cur = kit.trace('ph-current', 'current', .7);
      kit.label('ph-tag-i', cur + .3, S('phone').end - .45);
      // battery: bars fill on "refills"; glow follows
      kit.rise('b-battery', S('battery').start + .05, .02, .5);
      const fill = kit.when('refills', 'b-fill');
      motion.show('b-fill', fill, [0, 0, 0, 1, 0], .05); motion.reveal('b-fill', fill, fill + 1.1, 'up');
      if (RICH) track('b-glow', [key(fill, [0, 0, 0, 1, .15]), key(fill + 1.1, N, 'out')]);
      kit.label('b-tag', fill + .5);
      const cameras = RICH ? {
        pad: kit.cameraTravel('pad', [[S('pad').start, 0, .02, 1.02], [coil, 0, .03, 1.12], [field, 0, -.03, 1.12], [S('pad').end, 0, -.06, 1.2, 'in']]),
        phone: kit.cameraTravel('phone', [[S('phone').start, 0, -.03, 1.12, 'out'], [second + .6, 0, -.06, .96], [S('phone').end, .02, -.08, 1.25, 'in']]),
        battery: kit.cameraTravel('battery', [[S('battery').start, 0, .02, 1.2, 'out'], [fill, 0, .01, 1.06], [S('battery').end, 0, .01, 1.02]]),
      } : {};
      return {scenes, cameras, checks: {keyframes: [['pad-coil', coil + 1.0], ['pad-field', field + 1.0], ['exploded', cur + .8], ['battery', fill + 1.2]]}};
    },
  };
})();
