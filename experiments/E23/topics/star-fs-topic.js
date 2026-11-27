// E23 / P023.3 Flat Science study (unseen topic, en-IN, full-bleed): "How is a star born?" Simplified, not to scale.
// Science (simplified, standard account): a cold molecular cloud of gas and dust collapses under gravity; conserving its
// spin it flattens into a rotating disc around a hot, dense core (protostar); when the core is hot enough, hydrogen
// fusion begins and the star shines. Reference-derived craft (Kurzgesagt-style flat vector): deep harmonious palette,
// flat crescent shading with lit rims (litForm), stepped flat glows (halo), star flares, one continuous transformation.
(() => {
  const {sym, f, blob, rnd} = globalThis.techShotArt;
  const {art, PALETTES, css} = globalThis.fsKit;
  const C = PALETTES.space, W = 1000;
  let VH = 1778;
  const CX = 500, CY = () => VH * .42;
  const cloudParts = () => [[-230, -150, 210, 150, C.mid, 3], [190, -190, 190, 140, '#6a3fb0', 5], [-150, 170, 240, 150, '#3a2f8f', 7], [230, 120, 200, 160, C.mid, 9], [0, -10, 230, 180, '#5d3aa6', 11]];
  // a gas lobe = union of overlapping puffs (one path, nonzero fill), flat-lit, slightly translucent so lobes layer
  const puffs = (cx, cy, rx, ry, seed) => Array.from({length: 9}, (_, i) => { const a = i / 9 * Math.PI * 2 + rnd(seed + i), k = .55 + rnd(seed + 20 + i) * .35, r = Math.min(rx, ry) * (.42 + rnd(seed + 40 + i) * .25);
    const x = cx + Math.cos(a) * rx * k * .7, y = cy + Math.sin(a) * ry * k * .7; return `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`; }).join('') +
    `M${f(cx - rx * .6)} ${f(cy)}a${f(rx * .6)} ${f(ry * .6)} 0 1 0 ${f(rx * 1.2)} 0a${f(rx * .6)} ${f(ry * .6)} 0 1 0 ${f(-rx * 1.2)} 0Z`;
  const cloud = ([dx, dy, rx, ry, col, seed]) => `<g opacity=".88">` + art.litForm(puffs(500 + dx, 500 + dy, rx, ry, seed), col, {dir: [-.55, .83], depth: 24, shade: .64, rim: 1.55, rimWidth: 6}) + `</g>` +
    Array.from({length: 26}, (_, i) => `<circle cx="${f(500 + dx + (rnd(seed * 40 + i) - .5) * rx * 1.4)}" cy="${f(500 + dy + (rnd(seed * 40 + 99 + i) - .5) * ry * 1.3)}" r="${f(2 + rnd(seed * 7 + i) * 4)}" fill="#c9b8ff" opacity=".55"/>`).join('');
  const disc = () => { const d = `M${CX - 330} ${f(CY())}A330 70 0 1 0 ${CX + 330} ${f(CY())}A330 70 0 1 0 ${CX - 330} ${f(CY())}Z`, inner = `M${CX - 200} ${f(CY())}A200 40 0 1 0 ${CX + 200} ${f(CY())}A200 40 0 1 0 ${CX - 200} ${f(CY())}Z`;
    return `<path d="${d}" fill="${C.accent}" opacity=".55"/><path d="${inner}" fill="${C.warm}" opacity=".55"/>` +
      art.flow(`M${CX - 300} ${f(CY())}A300 60 0 1 0 ${CX + 300} ${f(CY())}A300 60 0 1 0 ${CX - 300} ${f(CY())}`, {color: '#ffe3f0', dot: 9, gap: 60, track: .25, speed: 5}) +
      art.flow(`M${CX - 240} ${f(CY())}A240 48 0 1 0 ${CX + 240} ${f(CY())}A240 48 0 1 0 ${CX - 240} ${f(CY())}`, {color: '#fff3d0', dot: 7, gap: 44, track: .2, speed: 7}); };
  const arrows = () => [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.4], [0, 1.4]].map(([sx, sy], i) => { const x0 = CX + sx * 330, y0 = CY() + sy * 300, x1 = CX + sx * 170, y1 = CY() + sy * 150;
    const a = Math.atan2(y1 - y0, x1 - x0), h = 26; return `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${C.cool}" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M${f(x1 - Math.cos(a - .5) * h)} ${f(y1 - Math.sin(a - .5) * h)}L${f(x1)} ${f(y1)}L${f(x1 - Math.cos(a + .5) * h)} ${f(y1 - Math.sin(a + .5) * h)}" stroke="${C.cool}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; }).join('');

  globalThis.flatScienceTopic = {
    shots: [{id: 'cloud', scene: 'sb-space', accent: C.mid}, {id: 'collapse', scene: 'sb-space', accent: C.cool}, {id: 'ignite', scene: 'sb-space', accent: C.warm}],
    css: css + ` .story-stage { background:${C.bg} } .piece-label { color:#ffffff }`,
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: () => {
      const r = document.querySelector('.story-stage').getBoundingClientRect();
      VH = Math.round(W * r.height / r.width);
      const vb = `0 0 ${W} ${VH}`;
      return [sym('sb-bg', vb, `<rect width="${W}" height="${VH}" fill="${C.bg}"/><path d="M0 ${f(VH * .7)}C300 ${f(VH * .62)} 600 ${f(VH * .8)} ${W} ${f(VH * .68)}V${VH}H0Z" fill="${C.deep}" opacity=".7"/>` + art.starfield(7, W, VH, {n: 170, flares: 7})),
        ...cloudParts().map((p, i) => sym(`sb-c${i}`, '0 0 1000 1000', cloud(p))),
        sym('sb-disc', vb, disc()), sym('sb-pull', vb, arrows()),
        sym('sb-core', '0 0 400 400', art.halo(200, 200, 34, C.warm, {steps: 5, spread: 3.2, opacity: .45, core: '#fff6d8'})),
        sym('sb-star', '0 0 600 600', art.halo(300, 300, 70, '#ffd166', {steps: 6, spread: 3.6, opacity: .5, core: '#ffffff'}) + art.flare(300, 300, 290, '#fff8e0', {width: .035}) + art.flare(300, 300, 160, '#ffffff', {width: .05, tilt: .785})),
      ].join('');
    },
    build(ctx) {
      const M = globalThis.vcMotion;
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient} = motion;
      const kit = globalThis.fsKit.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const cy = CY() / VH * 100;
      const parts = cloudParts();
      const scenes = {'sb-space': {objects: [plate('o-bg', 'sb-bg', 0),
        ...parts.map((p, i) => P(`o-c${i}`, `sb-c${i}`, 50, cy, 100, 2, {flat: true})),
        plate('o-disc', 'sb-disc', 3, 'exact'), plate('o-pull', 'sb-pull', 4, 'exact'),
        P('o-core', 'sb-core', 50, cy, 40, 4, {flat: true}), P('o-star', 'sb-star', 50, cy, 60, 5, {flat: true}),
        P('l-cloud', null, 50, cy + 21, 50, 5, {label: 'gas + dust', labelStyle: 'tag'}),
        P('l-grav', null, 50, cy - 22, 40, 5, {label: 'gravity', labelStyle: 'tag', accent: C.cool}),
        P('l-fuse', null, 50, cy + 18, 60, 5, {label: 'hydrogen fuses', labelStyle: 'tag', accent: C.warm})]}};
      // 1. the cloud drifts in, each lobe arriving with a soft settle (staggered)
      const s1 = S('cloud').start, cl = motion.speechCue('cloud', 'o-c4');
      M.stagger(parts, s1, .12, (p, t, i) => ambient(`o-c${i}`, {bob: [.003, 3 + i * .4, i]}));
      parts.forEach((p, i) => track(`o-c${i}`, [key(s1, [p[0] / 2000, p[1] / 3000, 0, .92, i === 4 ? 0 : .9]), ...(i === 4 ? [key(cl, [0, 0, 0, .92, 0]), key(cl + .5, [0, 0, 0, 1, 1], 'outQuart')] : [key(s1 + .6 + i * .1, N, 'settle')]),
        key(cue('gravity') - .05, N), key(cue('spins') + .2, [-p[0] / 1400, -p[1] / 2400, (i % 2 ? 1 : -1) * 40, .32, .6], 'inOut'), key(cue('spins') + .8, [-p[0] / 1100, -p[1] / 1900, (i % 2 ? 1 : -1) * 70, .12, 0], 'inOut')]));
      kit.label('l-cloud', cl + .4, cue('gravity') - .1);
      // 2. gravity pulls inward (arrows close in), the cloud contracts and spins into a flat disc around a warming core
      const gv = motion.speechCue('gravity', 'o-pull');
      track('o-pull', [key(s1, [0, 0, 0, 1.15, 0]), key(gv, [0, 0, 0, 1.15, 0]), key(gv + .4, [0, 0, 0, 1.05, 1], 'outQuart'), key(gv + 1.2, [0, 0, 0, .9, 1], 'inOut'), key(cue('spins') + .4, [0, 0, 0, .8, 0], 'inOut')]);
      kit.label('l-grav', gv + .2, cue('spins'));
      const sp = motion.speechCue('spins', 'o-disc');
      track('o-disc', [key(s1, [0, 0, 0, .4, 0]), key(sp, [0, 0, 0, .4, 0]), key(sp + .8, N, 'settle')]);
      kit.flow('o-disc', sp, S('ignite').end);
      track('o-core', [key(s1, [0, 0, 0, .2, 0]), key(gv + .3, [0, 0, 0, .2, 0]), key(sp + .6, [0, 0, 0, .8, 1], 'inOut'), key(cue('hot'), [0, 0, 0, 1.1, 1], 'inOut'), key(cue('fuses') + .4, [0, 0, 0, 1.4, 0], 'inOut')]);
      // 3. ignition: the core flares into a star (anticipation: a small dip before the burst)
      const fu = motion.speechCue('fuses', 'o-star');
      track('o-star', [key(s1, [0, 0, 0, .3, 0]), key(fu, [0, 0, 0, .3, 0]), key(fu + .15, [0, 0, 0, .26, .6], 'inOut'), key(fu + .85, N, 'overshoot')]);
      ambient('o-star', {spin: 3, breathe: [.015, 1.6, 0]});
      kit.label('l-fuse', fu + .5);
      const cameras = {
        cloud: [key(s1, [0, 0, 1.05]), key(S('cloud').end, [0, 0, 1.12], 'inOut')],
        collapse: [key(S('collapse').start, [0, 0, 1.12]), key(S('collapse').end, [0, 0, 1.32], 'inOut')],
        ignite: [key(S('ignite').start, [0, 0, 1.32]), key(fu, [0, 0, 1.4], 'inOut'), key(S('ignite').end, [0, 0, 1.25], 'outQuart')],
      };
      return {scenes, cameras, checks: {keyframes: [['cloud', cl + 1.0], ['disc', sp + 1.2], ['star', fu + 1.1]]}};
    },
  };
})();
