// E20 / P022.2 "after" version of the Data Storytelling fixture (tests/fixtures/ds-topic.js), same data, words and cues.
// SYNTHETIC data (labelled on screen). Changes, all in service of the story "four cities -> one total":
//  - accurate transformation: the four bars, drawn at their true heights (domain 0-500), rescale together and stack into one
//    total column (domain 0-1200 = the exact sum), keeping their identity, order and colour; the counter lands on the sum.
//  - editorial emphasis: the record city (B) keeps the accent; the others step back when the narration names the total's
//    share; a leader note gives B's exact share (420 / 1200, Kannada digits).
//  - motion: bars grow with a staggered, decelerating build (never past their value: data marks do not overshoot); then
//    all bars rescale together (one shared scale) and stack with staggered starts; labels and notes arrive with gentle overshoot (non-data marks).
//  - one continuous scene across both shots (the morph is the transition), instead of a wipe that hides the change.
(() => {
  const {sym, f} = globalThis.techShotArt;
  const {counter, COLORS: C, css} = globalThis.dataKit;
  const M = globalThis.vcMotion;
  const DATA = [{label: 'ಎ', value: 180, tone: '#c3c7cd'}, {label: 'ಬಿ', value: 420, highlight: true}, {label: 'ಸಿ', value: 260, tone: '#a9aeb6'}, {label: 'ಡಿ', value: 340, tone: '#c3c7cd'}];
  const TOTAL = DATA.reduce((a, d) => a + d.value, 0);   // 1200
  const DMAX = 500, KN = n => String(n).replace(/\d/g, d => '೦೧೨೩೪೫೬೭೮೯'[d]);
  const SOURCE = 'ಮೂಲ: ಪರೀಕ್ಷಾ ದತ್ತಾಂಶ (ಕಾಲ್ಪನಿಕ)';
  let VW = 1000, VH = 1600, U = 1, land = false, box;
  const layout = ctx => {
    land = ctx.aspect > 1; VH = Math.round(1000 / ctx.aspect); U = Math.min(1, VH / 800);
    box = land ? {x: 110, y: VH * .3, w: 520, h: VH * .48} : {x: 150, y: VH * .38, w: 760, h: VH * .37};
  };
  const pc = (x, y) => [x / VW * 100, y / VH * 100];
  const bw = () => box.w / DATA.length * .62;
  const bx = i => box.x + (i + .5) * box.w / DATA.length;             // bar centre x
  const u1 = () => box.h / DMAX, u2 = () => box.h / TOTAL;            // px per mm: chart, then stacked column
  const K = () => u2() / u1();                                        // vertical rescale factor (500 / 1200)
  const colX = () => land ? box.x + box.w + 150 : box.x + box.w * .5; // stacked column centre
  const base = () => box.y + box.h;
  const cum = i => DATA.slice(0, i).reduce((a, d) => a + d.value, 0);
  const color = d => d.highlight ? C.ACCENT : d.tone;
  const axis = (dmax, step, x, w, font) => {
    let s = '';
    for (let v = 0; v <= dmax + 1e-9; v += step) {
      const y = base() - v / dmax * box.h;
      s += `<path d="M${f(x)} ${f(y)}H${f(x + w)}" stroke="${v === 0 ? C.INK : C.GRID}" stroke-width="${v === 0 ? 3 : 2}"/>` +
        `<text x="${f(x - 14)}" y="${f(y + font * .34)}" text-anchor="end" font-size="${font * .8}" fill="#6b7078">${KN(v)}</text>`;
    }
    return s + `<text x="${f(x - 14)}" y="${f(box.y - font * .9)}" text-anchor="end" font-size="${font * .8}" fill="#6b7078">ಮಿ.ಮೀ.</text>`;
  };

  globalThis.dataStoryTopic = {
    shots: [
      {id: 'chart', scene: 'ds-chart', accent: C.ACCENT},
      {id: 'total', scene: 'ds-chart', accent: C.BLUE},
    ],
    css: css + ` .label-note .piece-label { white-space:nowrap }
      [id^="d-val"] .piece-label, [id^="d-seg"] .piece-label { font:800 32px/1.3 var(--vc-font); color:#1a1c1f }
      #d-val1 .piece-label { color:${C.ACCENT} }`,
    symbols: ctx => {
      layout(ctx);
      if (TOTAL !== 1200 || DATA.some(d => !(d.value >= 0))) throw new Error('E20 ds-topic: data integrity');
      const font = 30 * U, vb = `0 0 ${VW} ${VH}`;
      const cities = DATA.map((d, i) => `<text x="${f(bx(i))}" y="${f(base() + font * 1.25)}" text-anchor="middle" font-size="${font}" font-weight="600" fill="${C.INK}">${d.label}</text>`).join('');
      return [
        sym('ds-axis1', vb, axis(DMAX, 100, box.x, box.w, font) + cities),
        sym('ds-axis2', vb, axis(TOTAL, 300, colX() - bw() / 2 - 30, bw() + 60, font)),
        ...DATA.map((d, i) => sym(`ds-bar${i}`, vb,
          `<rect x="${f(bx(i) - bw() / 2)}" y="${f(base() - d.value * u1())}" width="${f(bw())}" height="${f(d.value * u1())}" fill="${color(d)}" stroke="#ffffff" stroke-width="3"` +
          ` style="transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(var(--draw, 1))"/>`)),
        sym('ds-lead', vb, `<path d="M${f(land ? colX() - bw() / 2 - 8 : colX() + bw() / 2 + 8)} ${f(base() - (cum(1) + DATA[1].value / 2) * u2())}h${f(land ? -60 : 70)}" stroke="${C.INK}" stroke-width="2.5"/>`),
      ].join('');
    },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, stroke} = motion;
      const kit = globalThis.dataKit.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const L = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const FB = ctx.presentation === 'full-bleed', fbTop = v => FB ? Math.max(v, ctx.safe.top / 100 + .12) : v, fbLow = v => FB ? Math.min(v, ctx.safe.captionTop / 100 - .04) : v;
      const font = 30 * U;
      const headXY = land ? pc(330, VH * fbTop(.13)) : pc(500, VH * fbTop(.12));
      const valueXY = i => pc(bx(i), base() - DATA[i].value * u1() - font * .9);
      const segXY = i => pc(colX(), base() - (cum(i) + DATA[i].value / 2) * u2());
      const objects = [
        L('c-head', headXY, land ? 40 : 84, 'ನಾಲ್ಕು ನಗರಗಳ ಮಳೆ', 'headline'), L('t-head', headXY, land ? 40 : 84, 'ಒಟ್ಟು ಮಳೆ', 'headline'),
        plate('c-axis1', 'ds-axis1', 1, 'exact'), plate('c-axis2', 'ds-axis2', 1, 'exact'),
        ...DATA.map((d, i) => plate(`d-bar${i}`, `ds-bar${i}`, 2, 'exact')),
        ...DATA.map((d, i) => L(`d-val${i}`, valueXY(i), 12, KN(d.value), 'source', {accent: color(d)})),
        ...DATA.map((d, i) => L(`d-seg${i}`, segXY(i), 6, d.label, 'source')),
        L('t-count', land ? pc(colX() - 90, VH * .2) : pc(500, VH * fbTop(.12) + VH * .085), land ? 40 : 60, '​', 'value', {accent: C.BLUE, ...counter({to: TOTAL, suffix: ' ಮಿ.ಮೀ.', system: 'kannada'})}),
        plate('t-lead', 'ds-lead', 3, 'exact'),
        L('t-note', land ? pc(colX() - bw() / 2 - 180, segXY(1)[1] * VH / 100) : pc(colX() + bw() / 2 + 210, segXY(1)[1] * VH / 100), land ? 20 : 30, `ಬಿ: ${KN(420)} / ${KN(TOTAL)}`, 'note', {accent: C.ACCENT}),
        L('c-src', land ? pc(250, VH * fbLow(.93)) : pc(300, VH * fbLow(.95)), land ? 30 : 56, SOURCE, 'source'),
      ];
      const scenes = {'ds-chart': {objects}};
      const s1 = S('chart').start, s2 = S('total').start, end = S('total').end;
      // non-data marks (labels, notes, axes) arrive with a gentle overshoot and leave with a soft ease
      const FROM = [0, .012, 0, .92, 0];
      const pop = (id, t, off) => track(id, [key(s1, FROM), key(t, FROM), key(t + .38, N, 'overshoot'),
        ...(off !== undefined ? [key(off, N), key(off + .25, [0, -.01, 0, .97, 0], 'inOut')] : [])]);
      // chart: headline, axis and source settle in; bars grow in a staggered, decelerating build (no overshoot on data)
      pop('c-head', s1 + .05, cue('total') - .3);
      track('c-axis1', [key(s1, [0, 0, 0, 1, 0]), key(s1 + .3, N, 'out'), key(cue('total') - .25, N), key(cue('total') + .05, [0, 0, 0, 1, 0], 'inOut')]);
      pop('c-src', s1 + .1);
      const ch = motion.speechCue('chart', 'd-bar0');
      const grow = M.stagger(DATA, ch, .14);
      DATA.forEach((d, i) => track(`d-bar${i}`, [key(s1, [0, 0, 0, 1, 0]), key(grow[i], [0, 0, 0, 1, 0]), key(grow[i] + .05, N)]));
      DATA.forEach((d, i) => pop(`d-val${i}`, grow[i] + .55, cue('total') - .05));
      // total: the old axis leaves; all bars rescale together to the 0-1200 scale (one shared scale at every instant),
      // then stack in order (A at the bottom) with staggered starts
      const tt = cue('total'), r0 = tt + .05, r1 = tt + .5, st = M.stagger(DATA, tt + .45, .08), dur = .75;
      DATA.forEach((d, i) => {
        const dx = (colX() - bx(i)) / VW, dy = -cum(i) * u2() / VH;
        stroke(`d-bar${i}`, [key(s1, [0]), key(grow[i], [0]), key(grow[i] + .7, [1], 'outQuart'), key(r0, [1]), key(r1, [K()], 'inOut')]);
        track(`d-bar${i}`, [key(s1, [0, 0, 0, 1, 0]), key(grow[i], [0, 0, 0, 1, 0]), key(grow[i] + .05, N), key(st[i], N), key(st[i] + dur, [dx, dy, 0, 1, 1], 'inOut'),
          ...(i === 1 ? [] : [key(cue('compare') - .1, [dx, dy, 0, 1, 1]), key(cue('compare') + .35, [dx, dy, 0, 1, .38], 'inOut')])]);
        pop(`d-seg${i}`, st[i] + dur + .05);
      });
      pop('c-axis2', st.at(-1) + dur - .2);
      motion.speechCue('total', 't-head'); pop('t-head', tt + .1);
      kit.count('t-count', 'count', 1.1);
      const cmp = motion.speechCue('compare', 't-note');
      track('t-lead', [key(s1, [0, 0, 0, 1, 0]), key(cmp, [0, 0, 0, 1, 0]), key(cmp + .3, N, 'out')]);
      pop('t-note', cmp + .05);
      const cam = (id, startView, views) => { const keys = kit.planCamera(id, views), s = S(id); return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0)]; };
      const cameras = {chart: cam('chart', [0, 0, 1.0], [[0, .02, 1.05, 'inOut']]), total: cam('total', [0, .02, 1.05], [[0, 0, 1.0, 'inOut']])};
      return {scenes, cameras, checks: {keyframes: [['chart', ch + 1.05], ['stack', tt + .55], ['count', cue('count') + .6], ['compare', cmp + .6]]}};
    },
  };
})();
