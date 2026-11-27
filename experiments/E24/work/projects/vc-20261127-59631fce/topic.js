// E24 / P023.4 Data Storytelling study (unseen topic, en-IN, full-bleed): "Everest leads by a whisker".
// SOURCE (verified 2026-11-27): Wikipedia, "List of highest mountains on Earth", table "Height (rounded)":
//   Everest 8,849 m (rounded 2020 China-Nepal survey value 8,848.86 m), K2 8,611, Kangchenjunga 8,586, Lhotse 8,516, Makalu 8,485.
// Story: heights on a zero-based scale (they look almost equal), then the same rows transform to "metres below Everest"
// on a new, explicitly relabelled 0-400 m scale: the rows retract together, the axis is swapped, the gaps grow.
// Never an intermediate mix of the two scales; Everest's gap is 0 and shown as a marker.
(() => {
  const {sym, f} = globalThis.techShotArt;
  const {art, COLORS: C, css} = globalThis.dataKit;
  const DATA = [{label: 'Everest', value: 8849, highlight: true}, {label: 'K2', value: 8611}, {label: 'Kangchenjunga', value: 8586}, {label: 'Lhotse', value: 8516}, {label: 'Makalu', value: 8485}];
  const TOP = DATA[0].value, GAP = DATA.map(d => TOP - d.value);        // 0, 238, 263, 333, 364
  const H_MAX = 9000, G_MAX = 400;
  if (GAP.join() !== '0,238,263,333,364' || Math.max(...GAP) > G_MAX) throw new Error('E24: data integrity');
  const N = n => n.toLocaleString('en-IN');
  let VW = 1000, VH = 1778, B;
  const layout = ctx => { VH = Math.round(1000 / ctx.aspect); B = art.hbars({x: 330, y: VH * .36, w: 560, rowH: VH * .07, data: DATA, prefix: 'pk-row'}); };
  const pc = (x, y) => [x / VW * 100, y / VH * 100];

  globalThis.dataStoryTopic = {
    shots: [{id: 'heights', scene: 'pk', accent: C.ACCENT}, {id: 'gap', scene: 'pk', accent: C.ACCENT}, {id: 'band', scene: 'pk', accent: C.BLUE}],
    css: css + ` .story-stage { background:#f6f3ee } .label-headline .piece-label { font-size:56px; line-height:1.35 } .label-direct .piece-label { font-size:30px }`,
    symbols: ctx => { layout(ctx); const vb = `0 0 ${VW} ${VH}`;
      const names = DATA.map((d, i) => `<text x="${f(B.x0 - 18)}" y="${f(B.rows[i].y + 11)}" text-anchor="end" font-size="31" font-weight="${d.highlight ? 800 : 600}" fill="${d.highlight ? C.ACCENT : C.INK}">${d.label}</text>`).join('');
      const bandX = B.end(0, G_MAX, G_MAX);
      return [sym('pk-names', vb, names), sym('pk-axisH', vb, B.axis(H_MAX, 3000, {unit: 'height, metres'})), sym('pk-axisG', vb, B.axis(G_MAX, 100, {unit: 'metres below Everest'})),
        ...B.rows.map(r => sym(r.id, vb, r.markup)),
        sym('pk-zero', vb, `<circle cx="${f(B.x0)}" cy="${f(B.rows[0].y)}" r="13" fill="${C.ACCENT}"/><circle cx="${f(B.x0)}" cy="${f(B.rows[0].y)}" r="5" fill="#ffffff"/>`),
        sym('pk-band', vb, `<rect x="${f(B.x0)}" y="${f(B.rows[0].y - VH * .05)}" width="${f(bandX - B.x0)}" height="${f(VH * .07 * 5)}" fill="${C.BLUE}" opacity=".08"/>` +
          `<path d="M${f(bandX)} ${f(B.rows[0].y - VH * .05)}V${f(B.rows[4].y + VH * .035)}" stroke="${C.BLUE}" stroke-width="4" stroke-dasharray="10 8"/>`)].join(''); },
    build(ctx) {
      const M = globalThis.vcMotion;
      const {P, plate, motion} = ctx;
      const {key, N: REST, track, stroke} = motion;
      const kit = globalThis.dataKit.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const FB = ctx.presentation === 'full-bleed', top = v => FB ? Math.max(v, ctx.safe.top / 100 + .02) : v, low = v => FB ? Math.min(v, ctx.safe.captionTop / 100 - .03) : v;
      const L = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const hEnd = i => pc(B.end(i, DATA[i].value, H_MAX) - 70, B.rows[i].y), gEnd = i => pc(B.end(i, GAP[i], G_MAX) + 62, B.rows[i].y);
      const objs = [
        L('t-head', pc(470, VH * top(.11)), 84, 'Everest leads by a whisker', 'headline'),
        L('t-deck', pc(470, VH * top(.11) + VH * .07), 84, 'The five highest mountains', 'deck'),
        plate('o-names', 'pk-names', 2, 'exact'), plate('o-axis-h', 'pk-axisH', 1, 'exact'), plate('o-axis-g', 'pk-axisG', 1, 'exact'), plate('o-band', 'pk-band', 1, 'exact'),
        ...B.rows.map(r => plate(`o-${r.id}`, r.id, 2, 'exact')), plate('o-zero', 'pk-zero', 3, 'exact'),
        ...DATA.map((d, i) => L(`v-h${i}`, hEnd(i), 15, N(d.value), 'direct', {accent: '#ffffff'})),
        ...DATA.map((d, i) => L(`v-g${i}`, gEnd(i), 13, i ? `−${GAP[i]}` : '0', 'direct', {accent: i === 1 ? C.ACCENT : C.INK})),
        L('l-k2', pc(560, B.rows[4].y + VH * .085), 56, 'K2 is only 238 m lower', 'callout', {accent: C.ACCENT}),
        L('l-band', pc(560, B.rows[4].y + VH * .085), 62, 'All five within 400 m of the top', 'callout', {accent: C.BLUE}),
        L('t-src', pc(470, VH * low(.95)), 84, 'Source: Wikipedia, List of highest mountains on Earth (Everest: 2020 China–Nepal survey)', 'source'),
      ];
      const sc = {pk: {objects: objs}};
      const s1 = S('heights').start, s2 = S('gap').start, end = S('band').end;
      const FROM = [0, .01, 0, .96, 0];
      const pop = (id, t, off) => track(id, [key(s1, FROM), key(t, FROM), key(t + .35, REST, 'overshoot'), ...(off !== undefined ? [key(off, REST), key(off + .25, [0, 0, 0, 1, 0], 'inOut')] : [])]);
      pop('t-head', s1 + .05); pop('t-deck', s1 + .2); pop('t-src', s1 + .3); pop('o-names', s1 + .3);
      // heights: zero-based rows build in a staggered, decelerating sequence (data marks never overshoot)
      const hi = motion.speechCue('highest', 'o-pk-row0');
      const grow = M.stagger(DATA, hi, .12);
      pop('o-axis-h', hi - .1, cue('only') - .45);
      // gap: rows retract together (no mixed scales), the axis is swapped, the same rows grow to the gap below Everest
      const on = cue('only'), r0 = on - .35, r1 = on + .05, g0 = on + .3;
      DATA.forEach((d, i) => {
        track(`o-pk-row${i}`, [key(s1, [0, 0, 0, 1, 0]), key(grow[i], [0, 0, 0, 1, 0]), key(grow[i] + .04, REST)]);
        stroke(`o-pk-row${i}`, [key(s1, [0]), key(grow[i], [0]), key(grow[i] + .8, [d.value / H_MAX], 'outQuart'), key(r0, [d.value / H_MAX]), key(r1, [0], 'inOut'),
          key(g0 + i * .1, [0]), key(g0 + i * .1 + .7, [GAP[i] / G_MAX], 'outQuart')]);
        pop(`v-h${i}`, grow[i] + .6, r0);
        pop(`v-g${i}`, g0 + i * .1 + .55);
      });
      pop('o-axis-g', r1);
      pop('o-zero', g0);
      const k2 = motion.speechCue('lower', 'l-k2'); pop('l-k2', k2, cue('within') - .2);
      const wi = motion.speechCue('within', 'l-band'); pop('l-band', wi + .05); pop('o-band', wi);
      const cameras = {heights: [key(s1, [0, 0, 1.0]), key(S('heights').end, [0, .01, 1.03], 'inOut')], gap: [key(s2, [0, .01, 1.03]), key(S('gap').end, [0, 0, 1.0], 'inOut')],
        band: [key(S('band').start, [0, 0, 1.0]), key(end, [0, 0, 1.0])]};
      return {scenes: sc, cameras, checks: {keyframes: [['heights', hi + 1.4], ['gap', k2 + .6], ['band', wi + .9]]}};
    },
  };
})();
