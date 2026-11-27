(() => {
  const K = globalThis.kineticKit;
  const {sym} = globalThis.techShotArt;
  const designs = [
    {id: 'night', word: 'தூக்கம்', accent: '#b9c7ff', ink: '#e8ecff', bg: '#10152c', x: 50, y: 40},
    {id: 'trace', word: 'மீண்டும்', accent: '#ffdc97', ink: '#fff2d7', bg: '#27183b', x: 51, y: 46},
    {id: 'hold', word: 'நினைவு', accent: '#143936', ink: '#163b37', bg: '#e0edce', x: 48, y: 48},
  ];
  let css = '';
  const art = [
    '<circle cx="500" cy="710" r="302" fill="#222c52"/><path d="M634 475a285 285 0 1 0 123 391A263 263 0 0 1 634 475Z" fill="#455581"/><path d="M120 1080Q500 1150 880 1080" fill="none" stroke="#65739e" stroke-width="3"/>',
    '<g fill="none" stroke="#bd94d9" stroke-width="3" opacity=".65"><circle cx="500" cy="800" r="130"/><circle cx="500" cy="800" r="242"/><circle cx="500" cy="800" r="354"/></g><g fill="#513667" stroke="#b796cf" stroke-width="3"><rect x="200" y="540" width="122" height="156" rx="12" transform="rotate(-14 261 618)"/><rect x="690" y="800" width="122" height="156" rx="12" transform="rotate(15 751 878)"/></g>',
    '<path d="M200 960H800L742 1062H258Z" fill="#688b6b"/><path d="M258 1062H742V1102H258Z" fill="#416559"/><path d="M290 908H710M340 856H660" stroke="#7da981" stroke-width="4" fill="none"/>',
  ];
  globalThis.kineticTopic = {
    get shots() { return designs.map(d => ({id: d.id, scene: d.id, accent: d.accent})); },
    get css() { return K.css + css; },
    symbols(ctx) {
      const width = document.querySelector('.story-stage').getBoundingClientRect().width;
      css = designs.map(d => {
        const size = K.fit(K.word(ctx, d.word), width * .73, {max: 175});
        return `#word-${d.id} .piece-label{font-size:${size}px;--kt-ink:${d.ink};--kt-accent:${d.accent};--kt-field:${d.bg}}`;
      }).join('\n');
      return designs.map((d, i) => sym(`field-${d.id}`, '0 0 1000 1778',
        K.art.field(1000, 1778, {color: d.bg}) + art[i])).join('') +
        sym('odor-light', '0 0 200 200', K.art.disc('#ffdc974d', {ring: '#ffdc97'}));
    },
    build(ctx) {
      const {P, plate} = ctx;
      const kit = K.motion(ctx);
      const scenes = {};
      const keyframes = [];
      for (const d of designs) {
        const word = `word-${d.id}`;
        const cue = `cue-${d.id}`;
        const wordObject = P(word, null, d.x, d.y, 92, 4, {label: d.word, labelStyle: 'accent'});
        const objects = [plate(`bg-${d.id}`, `field-${d.id}`, 0)];
        if (d.id === 'trace') {
          objects.push(P('odor-light', 'odor-light', 50, d.y, 18, 2));
          kit.sweep('odor-light', word, cue, {fromX: -.36, toX: .36, lead: .14, dur: .75});
        } else {
          kit.say(word, cue, d.id === 'night' ? 'rise' : 'stamp', .42);
        }
        objects.push(wordObject);
        scenes[d.id] = {objects};
        const t = ctx.cue(cue);
        keyframes.push([d.id, Math.min(t + (d.id === 'trace' ? .46 : .57), ctx.shot(d.id).end - .04)]);
      }
      return {scenes, checks: {keyframes}};
    },
  };
})();
