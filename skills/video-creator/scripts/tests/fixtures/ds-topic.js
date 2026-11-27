// P017.4 compact Data Storytelling fixture (test only), Kannada labels. SYNTHETIC data (labelled as such on screen):
// rainfall of four cities, a zero-based bar chart, the `bars` transition, an exact counter in Kannada numerals that
// totals the same data, and area-true circles. Every speech moment comes from the resolved plan.
(() => {
  const {sym} = globalThis.techShotArt;
  const {art, counter, COLORS: C, css} = globalThis.dataKit;
  const DATA = [{label: 'ಎ', value: 180}, {label: 'ಬಿ', value: 420, highlight: true}, {label: 'ಸಿ', value: 260}, {label: 'ಡಿ', value: 340}];
  const TOTAL = DATA.reduce((a, d) => a + d.value, 0);   // 1200: the counter shows the true sum of the charted data
  const SOURCE = 'ಮೂಲ: ಪರೀಕ್ಷಾ ದತ್ತಾಂಶ (ಕಾಲ್ಪನಿಕ)';
  let VW = 1000, VH = 1600, U = 1, land = false, box;
  const layout = ctx => {
    land = ctx.aspect > 1; VH = Math.round(1000 / ctx.aspect); U = Math.min(1, VH / 800);
    box = land ? {x: 110, y: VH * .3, w: 470, h: VH * .48} : {x: 150, y: VH * .3, w: 760, h: VH * .42};
  };
  const pc = (x, y) => [x / VW * 100, y / VH * 100];
  const bar = i => { const w = box.w / DATA.length; return [box.x + (i + .5) * w, box.y + box.h - DATA[i].value / 500 * box.h]; };

  globalThis.dataStoryTopic = {
    shots: [
      {id: 'chart', scene: 'ds-chart', accent: C.ACCENT, transition: {type: 'bars'}},
      {id: 'total', scene: 'ds-total', accent: C.BLUE},
    ],
    css,
    symbols: ctx => { layout(ctx); const font = 30 * U; return [
      sym('ds-bars', `0 0 ${VW} ${VH}`, art.barChart({...box, data: DATA, max: 500, unit: 'ಮಿ.ಮೀ.', font})),
      sym('ds-note', `0 0 ${VW} ${VH}`, art.annotate([bar(1)[0] + 30 * U, bar(1)[1] - 40 * U], land ? [700, VH * .32] : [700, VH * .22])),
      sym('ds-circles', `0 0 ${VW} ${VH}`, art.circles({x: land ? 600 : 170, y: VH * (land ? .78 : .8), rMax: (land ? 150 : 210) * U, font,
        data: [{label: 'ಬಿ', value: 420, color: C.ACCENT}, {label: 'ಎ', value: 180, color: C.MUTED}]})),
    ].join(''); },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key} = motion;
      const kit = globalThis.dataKit.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const L = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const scenes = {};
      // P018.6: in full-bleed, headline and source line stay inside the text-safe area, above the caption band
      const FB = ctx.presentation === 'full-bleed', fbTop = v => FB ? Math.max(v, ctx.safe.top / 100 + .12) : v, fbLow = v => FB ? Math.min(v, ctx.safe.captionTop / 100 - .04) : v;
      scenes['ds-chart'] = {objects: [L('c-head', land ? pc(330, VH * fbTop(.13)) : pc(500, VH * fbTop(.12)), land ? 40 : 84, 'ನಾಲ್ಕು ನಗರಗಳ ಮಳೆ', 'headline'),
        plate('c-bars', 'ds-bars', 2, 'exact'), plate('c-note', 'ds-note', 3, 'exact'),
        L('c-note-t', land ? pc(800, VH * .3) : pc(760, VH * .19), land ? 22 : 40, 'ಅತಿ ಹೆಚ್ಚು: ಬಿ', 'note'),
        L('c-src', land ? pc(250, VH * fbLow(.93)) : pc(300, VH * fbLow(.95)), land ? 30 : 56, SOURCE, 'source')]};
      kit.label('c-head', S('chart').start + .05);
      kit.label('c-src', S('chart').start + .1);
      const ch = kit.build('c-bars', 'chart', 1.0);
      kit.build('c-note', ch + 1.0, .3); kit.label('c-note-t', ch + 1.15);
      scenes['ds-total'] = {objects: [L('t-head', land ? pc(250, VH * .2) : pc(500, VH * .14), land ? 30 : 50, 'ಒಟ್ಟು ಮಳೆ', 'headline'),
        L('t-count', land ? pc(250, VH * .45) : pc(500, VH * .3), land ? 44 : 90, '​', 'value', {accent: C.BLUE, ...counter({to: TOTAL, suffix: ' ಮಿ.ಮೀ.', system: 'kannada'})}),
        plate('t-circles', 'ds-circles', 2, 'exact'), L('t-note', land ? pc(760, VH * .2) : pc(500, VH * .5), land ? 34 : 70, 'ವೃತ್ತದ ವಿಸ್ತೀರ್ಣ = ಮಳೆ', 'note', {accent: C.BLUE}),
        L('t-src', land ? pc(250, VH * fbLow(.93)) : pc(300, VH * fbLow(.95)), land ? 30 : 56, SOURCE, 'source')]};
      kit.label('t-head', 'total'); kit.label('t-src', S('total').start + .1);
      kit.count('t-count', 'count', 1.2);
      kit.build('t-circles', 'compare', .7); kit.label('t-note', cue('compare') + .3);
      const cam = (id, startView, views) => { const keys = kit.planCamera(id, views), s = S(id); return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0)]; };
      const cameras = {chart: cam('chart', [0, 0, 1.0], [[0, .02, 1.06, 'smooth']]), total: cam('total', [0, 0, 1.04], [[0, 0, 1.0, 'smooth']])};
      return {scenes, cameras, checks: {keyframes: [['chart', ch + 1.05], ['bars', S('chart').end - .05], ['count', cue('count') + .6], ['compare', cue('compare') + .6]]}};
    },
  };
})();
