// P014.7A generic test topic driven by a resolved creative plan: no speech-cue timestamps are written here.
// Shot boundaries come from the plan (shots list only ids, scenes and looks); every reveal is tied to a plan cue id.
(() => {
  const {sym} = globalThis.paperShotArt;
  const shape = (id, fill, d) => sym(id, '0 0 200 200', `<path d="${d}" fill="${fill}" stroke="#252A30" stroke-width="6"/>`);
  globalThis.paperTopic = {
    shots: [{id: 'open', scene: 'field'}, {id: 'close', scene: 'pond'}],
    symbols: () => sym('pt-bg-a', '0 0 1000 1600', '<rect width="1000" height="1600" fill="#e9dfc8"/>') +
      sym('pt-bg-b', '0 0 1000 1600', '<rect width="1000" height="1600" fill="#cfe0dc"/>') +
      shape('pt-sun', '#DAB357', 'M100 20a80 80 0 1 0 1 0Z') +
      shape('pt-leaf', '#427361', 'M20 180C40 60 120 20 180 20 180 80 140 160 20 180Z') +
      shape('pt-drop', '#59758D', 'M100 10C140 80 170 120 170 140a70 60 0 0 1-140 0C30 120 60 80 100 10Z'),
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, show, speechCue} = motion;
      const scenes = {
        field: {locale: 'und', objects: [plate('field-bg', 'pt-bg-a', 0), P('sun', 'pt-sun', 35, 35, 30, 3), P('leaf', 'pt-leaf', 65, 60, 30, 3)]},
        pond: {locale: 'und', objects: [plate('pond-bg', 'pt-bg-b', 0), P('drop', 'pt-drop', 50, 50, 34, 3)]},
      };
      // The agent's own animation choices; only the moments come from speech.
      show('sun', speechCue('sun-in'), [0, .05, -8, .7, 0], .35);
      show('leaf', speechCue('leaf-in'), [.05, 0, 10, .8, 0], .4);
      show('drop', speechCue('drop-in'), [0, -.08, 0, .6, 0], .3);
      const cameras = Object.fromEntries(ctx.shots.map(s => [s.id, [key(s.start, [0, 0, 1.05]), key(s.end, [0, -.02, 1], 'out')]]));
      return {scenes, cameras};
    },
  };
})();
