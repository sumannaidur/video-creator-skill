// P013.1 synthetic test topic: proves the engine has no tree assumptions.
// Shot layout comes from globalThis.paperTopicOptions.shots (defaults to one shot per phrase).
(() => {
  const {f, rnd, blob, sym} = globalThis.paperShotArt;
  const palette = ['#59758D', '#BF5942', '#427361', '#DAB357', '#8a6fa8', '#4f8a9a'];
  const options = globalThis.paperTopicOptions ?? {};
  globalThis.paperTopic = {
    shots: options.shots ?? [
      {id: 'card-a', scene: 'card-0', phrases: [0, 0]},
      {id: 'card-b', scene: 'card-1', phrases: [1, 1], transition: {type: 'dissolve', symbol: 'tc-tiles'}},
      {id: 'card-c', scene: 'card-2', phrases: [2, 2]},
    ],
    symbols: () => palette.map((c, i) => sym(`tc-bg-${i}`, '0 0 1000 1600',
      `<rect width="1000" height="1600" fill="${c}" opacity=".35"/><path d="${blob(500, 900, 420, 360, 18, .1, i * 7)}" fill="${c}" opacity=".5"/>`)).join('') +
      sym('tc-card', '0 0 300 220', '<path d="M12 18 288 8 292 204 8 212Z" fill="#fff9ee" stroke="#252A30" stroke-width="4"/><path d="M40 70h200M40 120h160M40 170h120" stroke="#252A30" stroke-width="9" stroke-linecap="round"/>') +
      sym('tc-dot', '0 0 40 40', '<circle cx="20" cy="20" r="16" fill="#fff9ee" stroke="#252A30" stroke-width="3"/>') +
      sym('tc-tiles', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#252A30"/>${Array.from({length: 40}, (_, i) =>
        `<circle cx="${f(rnd(i) * 1000)}" cy="${f(rnd(i + 50) * 1600)}" r="${f(40 + rnd(i + 99) * 90)}" fill="${palette[i % palette.length]}"/>`).join('')}`),
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, show, cue, ambient} = motion;
      const scenes = {}, cameras = {};
      ctx.shots.forEach((shot, i) => {
        const scene = options.shots?.[i]?.scene ?? `card-${i}`;
        if (!scenes[scene]) scenes[scene] = {locale: 'en-IN', objects: [
          plate(`${scene}-bg`, `tc-bg-${i % palette.length}`, 0),
          P(`${scene}-card`, 'tc-card', 50, 46, 58, 3),
          ...[0, 1, 2].map(k => motion.emit(`${scene}-dot-${k}`, 'tc-dot', [30 + k * 20, 70], 6, 4, 0, -.12, shot.start + .1 + k * .15, 1, 1)),
          P(`${scene}-label`, null, 50, 18, 60, 5, {label: shot.id}),
        ]};
        if (!scenes[scene].shown) {
          scenes[scene].shown = true;
          show(`${scene}-card`, i === 0 ? ctx.phrases[0].start : shot.start, [0, .04, -4, .9, 0], .35);
          ambient(`${scene}-card`, {sway: [.6, 2.5, i]});
        }
        cameras[shot.id] = [key(shot.start, [0, 0, 1.06]), key(shot.end, [0, -.02, 1], 'out')];
      });
      cue('card-0-card', 0, 0);
      return {scenes, cameras};
    },
  };
})();
