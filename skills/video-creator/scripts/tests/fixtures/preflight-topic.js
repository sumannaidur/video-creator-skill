// P014.7C generic preflight fixture (abstract shapes). Keyframes sit where the camera is at rest, so they pass; between them
// the camera pushes in. With options.zoom large, the label is clipped only on intermediate frames (the P013.4 pattern).
// Other options inject single defects: pushRequired (required object leaves the stage), badZoom (invalid camera transform).
(() => {
  const {sym} = globalThis.paperShotArt;
  const {art, css} = globalThis.paperKit;
  const o = globalThis.paperTopicOptions ?? {};
  globalThis.paperTopic = {
    shots: [{id: 'open', scene: 'a', transition: {type: 'dissolve', symbol: 'pf-tiles'}}, {id: 'close', scene: 'b'}],
    css,
    symbols: () => [
      sym('pf-bg', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#efe6d2"/>${art.fibres(4, 60, 0, 0, 1000, 1600)}`),
      sym('pf-bg2', '0 0 1000 1600', '<rect width="1000" height="1600" fill="#d7e3e0"/>'),
      sym('pf-disc', '0 0 300 300', art.layered(140, 140, 110, 110, {seed: 2, fill: '#DAB357', under: '#c79a3c', edge: '#252A30', amp: .05})),
      sym('pf-streak', '0 0 400 80', '<path d="M10 40Q200 0 390 40Q200 80 10 40Z" fill="#59758D" opacity=".6"/>'),
      sym('pf-drop', '0 0 200 200', '<path d="M100 10C140 80 170 120 170 140a70 60 0 0 1-140 0C30 120 60 80 100 10Z" fill="#59758D" stroke="#252A30" stroke-width="6"/>'),
      sym('pf-tiles', '0 0 1000 1600', art.tileTexture(5, ['#59758D', '#BF5942', '#427361', '#DAB357'])),
    ].join(''),
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, track} = motion;
      const kit = globalThis.paperKit.motion(ctx);
      const open = ctx.shot('open'), close = ctx.shot('close');
      const scenes = {
        a: {locale: 'und', objects: [plate('a-bg', 'pf-bg', 0), P('sun', 'pf-disc', 40, 45, 30, 3, {required: true}),
          P('streak', 'pf-streak', 50, 75, 40, 4, {flat: true}), P('tag', null, 86, 30, 20, 5, {label: 'Sun', labelStyle: 'plain'})]},
        b: {locale: 'und', objects: [plate('b-bg', 'pf-bg2', 0), P('drop', 'pf-drop', 50, 45, 24, 3, {required: true})]},
      };
      const sunAt = kit.settle('sun', 'sun-in', [0, .05, -8, .7, 0]);
      kit.label('tag', sunAt + .2);
      kit.settle('leaf-stand-in', 'leaf-in'); // the plan's leaf cue animates a small marker
      scenes.a.objects.push(P('leaf-stand-in', 'pf-disc', 70, 62, 10, 3));
      // Decorative streak deliberately crosses the whole frame, leaving it on both sides (intentional off-screen motion).
      track('streak', [key(open.start, [-1.1, 0, 0, 1, 1]), key(open.end, [1.1, 0, 0, 1, 1], 'linear')]);
      if (o.pushRequired) track('sun', [key(sunAt, [0, .05, -8, .7, 0]), key(sunAt + .45, motion.N, 'out'), key(sunAt + .9, motion.N), key(sunAt + 1.2, [.7, 0, 0, 1, 1])]);
      kit.settle('drop', 'drop-in', [0, -.08, 0, .6, 0], .35);
      // Camera: the plan's two moments at rest, with the agent's own push-in between them.
      const [k0, k1, k2] = kit.planCamera('open', [[0, 0, 1], [0, 0, 1]]);
      const peak = (k1[0] + k2[0]) / 2;
      const cameras = {open: [k0, k1, key(peak, [.04, 0, o.badZoom ? 0 : (o.zoom ?? 1.1)]), k2], close: kit.planCamera('close', [[0, -.02, 1.05, 'out']])};
      return {scenes, cameras, checks: {keyframes: [['rest-a', k1[0] + .2], ['rest-b', k2[0] + .2], ['close', close.end - .2]]}};
    },
  };
})();
