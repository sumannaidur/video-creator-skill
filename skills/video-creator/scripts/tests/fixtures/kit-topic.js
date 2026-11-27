// P014.7B generic kit demonstration (abstract shapes, not a topic library): every helper of paperKit, driven by
// resolved-plan cue ids and camera moments. No speech timestamps are written here.
(() => {
  const {sym} = globalThis.paperShotArt;
  const {art, css} = globalThis.paperKit;
  globalThis.paperTopic = {
    shots: [{id: 'open', scene: 'growth', accent: '#427361', transition: {type: 'dissolve', symbol: 'kt-tiles'}}, {id: 'close', scene: 'water', accent: '#59758D'}],
    css,
    symbols: () => [
      sym('kt-backdrop', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#efe6d2"/>${art.fibres(3, 90, 0, 0, 1000, 1600, '#d9ccb2', .45)}
        ${art.layered(500, 1350, 640, 260, {seed: 9, fill: '#c9d3b4', under: '#aebd98', n: 16, amp: .08})}`),
      sym('kt-card', '0 0 600 420', art.sheet(600, 420, {seed: 5, fibreCount: 30})),
      sym('kt-sun', '0 0 300 300', art.layered(140, 140, 110, 110, {seed: 2, fill: '#DAB357', under: '#c79a3c', edge: '#252A30', amp: .05})),
      sym('kt-sun-shadow', '0 0 400 60', art.castShadow('kt-soft', 400, 60)),
      sym('kt-leaf', '0 0 200 200', '<path d="M20 180C40 60 120 20 180 20 180 80 140 160 20 180Z" fill="#427361" stroke="#252A30" stroke-width="6"/>'),
      sym('kt-ring', '0 0 400 260', art.ring(400, 260)),
      sym('kt-string', '0 0 1000 1600', art.connector([[330, 560], [520, 700], [660, 860]], {sag: 40, width: 5})),
      sym('kt-tiles', '0 0 1000 1600', art.tileTexture(17, ['#59758D', '#BF5942', '#427361', '#DAB357'])),
      sym('kt-water', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#d7e3e0"/>${art.fibres(8, 80, 0, 0, 1000, 1600, '#b9cdca', .5)}`),
      art.parts('kt-fold', '0 0 400 300', {
        back: art.sheet(400, 300, {seed: 12, fill: '#c9d6dc'}),
        front: '<path d="M30 120L370 90 380 290 20 296Z" fill="#fff9ee" stroke="#252A30" stroke-width="4" stroke-linejoin="round"/>'}),
      sym('kt-drop', '0 0 200 200', '<path d="M100 10C140 80 170 120 170 140a70 60 0 0 1-140 0C30 120 60 80 100 10Z" fill="#59758D" stroke="#252A30" stroke-width="6"/>'),
      sym('kt-glow', '0 0 300 300', '<circle cx="150" cy="150" r="130" fill="#DAB357" opacity=".45"/>'),
    ].join(''),
    build(ctx) {
      const {P, plate, motion} = ctx;
      const kit = globalThis.paperKit.motion(ctx);
      const scenes = {
        growth: {locale: 'und', objects: [
          plate('g-back', 'kt-backdrop', 0), P('g-card', 'kt-card', 50, 52, 74, 2),
          P('sun-shadow', 'kt-sun-shadow', 33, 47, 26, 3, {flat: true}), P('sun', 'kt-sun', 33, 34, 26, 3),
          plate('g-string', 'kt-string', 3, 'exact'), P('leaf', 'kt-leaf', 66, 55, 22, 3), P('leaf-ring', 'kt-ring', 66, 55, 36, 4, {flat: true}),
          P('leaf-tag', null, 66, 70, 40, 5, {label: 'leaf', labelStyle: 'accent', accent: '#427361'}),
          P('sun-tag', null, 33, 20, 30, 5, {label: 'Sun', labelStyle: 'plain'})]},
        water: {locale: 'und', objects: [
          plate('w-back', 'kt-water', 0), P('fold-back', 'kt-fold-back', 50, 55, 60, 2), P('fold-front', 'kt-fold-front', 50, 55, 60, 3),
          P('drop-glow', 'kt-glow', 50, 40, 34, 3, {flat: true}), P('drop', 'kt-drop', 50, 40, 22, 4),
          P('drop-tag', null, 50, 72, 30, 5, {label: 'falls', labelStyle: 'chip'})]},
      };
      const sunAt = kit.settle('sun', 'sun-in', [0, .05, -8, .7, 0]);
      kit.settle('sun-shadow', sunAt, [-.04, 0, 0, .6, 0]);
      kit.label('sun-tag', sunAt + .2);
      const leafAt = kit.settle('leaf', 'leaf-in', [.05, 0, 10, .8, 0], .4);
      kit.draw('g-string', leafAt - .5, .45);
      kit.ring('leaf-ring', 'leaf-in');
      kit.label('leaf-tag', leafAt + .25);
      const dropAt = kit.settle('drop', 'drop-in', [0, -.08, 0, .6, 0], .35);
      kit.pulse('drop-glow', dropAt + .1);
      kit.settle('fold-front', ctx.shot('close').start + .2, [0, .02, -6, 1, 0], .5);
      kit.label('drop-tag', dropAt + .3);
      ctx.motion.ambient('sun', {bob: [.004, 3, 1]});
      const cameras = {open: kit.planCamera('open', [[.04, .06, 1.25], [0, 0, 1, 'out']]), close: kit.planCamera('close', [[0, -.02, 1.08, 'out']])};
      return {scenes, cameras, checks: {keyframes: [['kit-sun', sunAt + .7], ['kit-leaf', leafAt + .9], ['kit-water', dropAt + .8]]}};
    },
  };
})();
