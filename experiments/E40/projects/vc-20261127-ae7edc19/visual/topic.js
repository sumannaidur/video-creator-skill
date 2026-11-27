// "How does a touchscreen know where you touched?" (en-IN, Tech Explainer, full-bleed). Original SVG artwork (no Blender:
// the explanation lives in animated conductors, fields and signals; the phone's glass and aluminium use gradients).
//   hook   - a phone in a dark studio, a fingertip hovering; on "grid" a hidden grid glows up through the glass.
//   layers - exploded stack: cover glass, row conductors, column conductors, display; rows then columns trace on; no contact.
//   scan   - top view of the grid: each crossing a capacitor; one column pulses at a time; a readout shows every crossing.
//   touch  - a fingertip lands on a crossing; field lines bend into it; that crossing's signal drops; a crosshair locks on.
// Grid pitch, line counts and readout values are schematic (claims guardrail).
(() => {
  const {sym, f} = globalThis.techShotArt;
  const K = globalThis.techKit, A = K.art;
  const VW = 1000;
  let VH = 1778, O = [500, 1100];
  const ROW = '#5ab4ff', COL = '#ffb347', HOT = '#ff5d5d';
  const pc = ([x, y]) => [x / VW * 100, y / VH * 100];
  const I = (x, y, z) => A.iso(O, x, y, z);
  const L = (pts, color, w = 4, extra = '') => `<path d="M${pts.map(p => p.map(f).join(' ')).join('L')}" pathLength="1" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))" ${extra}/>`;
  const R62 = 62 * Math.PI / 180;                                                 // finger from the right: tip (0,-230) rotated -62 deg lands on the crossing
  const PH = () => ({x: 220, y: VH * .13, w: 560, h: 1120});
  const GX = c => 200 + c * 120, GY = r => VH * .12 + r * 100, FC = [3, 4];          // grid geometry; the touched crossing

  // ---------- hook: phone, glass, wallpaper, fingertip ----------
  const phoneArt = () => { const {x, y, w, h} = PH();
    return A.contact(500, y + h + 10, 300, 40, .6) +
      `<defs><linearGradient id="tc-al" x1="0" x2="1"><stop offset="0" stop-color="#eef1f5"/><stop offset=".18" stop-color="#9aa3b0"/><stop offset=".5" stop-color="#d7dce3"/><stop offset=".82" stop-color="#848d99"/><stop offset="1" stop-color="#e9edf2"/></linearGradient>` +
      `<linearGradient id="tc-wall" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#22336a"/><stop offset=".55" stop-color="#3a2257"/><stop offset="1" stop-color="#0b1430"/></linearGradient>` +
      `<radialGradient id="tc-blob" cx=".7" cy=".35" r=".5"><stop offset="0" stop-color="#6a7dff" stop-opacity=".55"/><stop offset="1" stop-color="#6a7dff" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="tc-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="tc-screen"><rect x="${x + 26}" y="${y + 26}" width="${w - 52}" height="${h - 52}" rx="62"/></clipPath></defs>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="86" fill="url(#tc-al)"/><rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" rx="76" fill="#05080d"/>` +
      `<g clip-path="url(#tc-screen)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#tc-wall)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#tc-blob)"/>` +
      `<text x="500" y="${f(y + 250)}" text-anchor="middle" font-family="Segoe UI" font-weight="200" font-size="150" fill="#eef2ff" opacity=".92">10:08</text>` +
      `<text x="500" y="${f(y + 310)}" text-anchor="middle" font-family="Segoe UI" font-size="34" fill="#cdd6f5" opacity=".75">Thursday 27 November</text></g>` +
      `<rect x="${500 - 70}" y="${y + 44}" width="140" height="40" rx="20" fill="#000"/>` +
      `<rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" rx="76" fill="url(#tc-sheen)"/><rect x="${x + 10.5}" y="${y + 10.5}" width="${w - 21}" height="${h - 21}" rx="76" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>` +
      `<rect x="${x + w - 3}" y="${y + 260}" width="7" height="120" rx="3" fill="#8d96a3"/>`; };
  const gridThroughArt = () => { const {x, y, w, h} = PH(), rows = 11, cols = 6;
    return `<g clip-path="url(#tc-screen)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#02050b" opacity=".35"/>` +
      Array.from({length: rows}, (_, r) => L([[x + 30, y + 90 + r * 95], [x + w - 30, y + 90 + r * 95]], ROW, 3, 'opacity=".85"')).join('') +
      Array.from({length: cols}, (_, c) => L([[x + 70 + c * 84, y + 30], [x + 70 + c * 84, y + h - 30]], COL, 3, 'opacity=".85"')).join('') + '</g>'; };
  const fingerArt = (alpha = 1) => `<defs><linearGradient id="tc-skin${alpha}" x1="0" x2="1"><stop offset="0" stop-color="#b9785c"/><stop offset=".45" stop-color="#e6ad8d"/><stop offset="1" stop-color="#a86a50"/></linearGradient></defs>` +
    `<g opacity="${alpha}"><path d="M30 520V150C30 66 70 20 130 20C190 20 230 66 230 150V520Z" fill="url(#tc-skin${alpha})"/>` +
    `<path d="M70 150C70 92 96 62 130 62C164 62 190 92 190 150V200C190 214 180 222 166 222H94C80 222 70 214 70 200Z" fill="#f3cdb8" stroke="#c99076" stroke-width="3"/><path d="M84 110C100 84 160 84 176 110" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none"/>` +
    `<path d="M62 330Q130 350 198 330M66 360Q130 376 194 360" stroke="#9a5f46" stroke-opacity=".5" stroke-width="4" fill="none"/></g>`;

  // ---------- layers: exploded iso stack ----------
  const SL = {x: -170, y: -110, w: 340, d: 220};
  const Z = {display: 0, cols: 150, rows: 300, glass: 450};
  const displayArt = () => A.litBox(O, {...SL, z: Z.display, h: 28}, {base: '#1c2436', id: 'tc-disp'}) +
    `<path d="M${[I(SL.x + 20, SL.y + 20, 28), I(SL.x + SL.w - 20, SL.y + 20, 28), I(SL.x + SL.w - 20, SL.y + SL.d - 20, 28), I(SL.x + 20, SL.y + SL.d - 20, 28)].map(p => p.map(f).join(' ')).join('L')}Z" fill="#283a6e" opacity=".9"/>`;
  const sheetArt = (z, tint) => A.glassBack(O, {...SL, z, h: 6}, {tint}) + A.glassFront(O, {...SL, z, h: 6}, {tint, opacity: .2});
  const rowsArt = () => Array.from({length: 7}, (_, k) => { const yy = SL.y + (k + 1) * SL.d / 8; return L([I(SL.x + 6, yy, Z.rows + 6), I(SL.x + SL.w - 6, yy, Z.rows + 6)], ROW, 5); }).join('');
  const colsArt = () => Array.from({length: 6}, (_, k) => { const xx = SL.x + (k + 1) * SL.w / 7; return L([I(xx, SL.y + 6, Z.cols + 6), I(xx, SL.y + SL.d - 6, Z.cols + 6)], COL, 5); }).join('');
  const gapArt = () => { const xx = SL.x + 4 * SL.w / 7, yy = SL.y + 4 * SL.d / 8, a = I(xx, yy, Z.rows + 6), b = I(xx, yy, Z.cols + 6);
    return L([a, b], '#e8f1ff', 3, 'stroke-dasharray="1 1"') + [a, b].map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="11" fill="none" stroke="${i ? COL : ROW}" stroke-width="4"/>`).join(''); };
  const glassArt = () => A.glassBack(O, {...SL, z: Z.glass, h: 18}, {tint: '#bcd8ff'}) + A.glassFront(O, {...SL, z: Z.glass, h: 18}, {tint: '#bcd8ff', opacity: .22});

  // ---------- grid: top view ----------
  const gridBg = () => `<defs><radialGradient id="tc-gbg" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#121c30"/><stop offset="1" stop-color="#03060c"/></radialGradient></defs><rect width="${VW}" height="${VH}" fill="url(#tc-gbg)"/>` +
    Array.from({length: 8}, (_, r) => `<path d="M130 ${f(GY(r))}H870" stroke="${ROW}" stroke-width="4" opacity=".75"/>`).join('') +
    Array.from({length: 6}, (_, c) => `<path d="M${GX(c)} ${f(GY(0) - 60)}V${f(GY(7) + 60)}" stroke="${COL}" stroke-width="4" opacity=".7"/>`).join('') +
    Array.from({length: 8}, (_, r) => Array.from({length: 6}, (_, c) => `<path d="M${GX(c)} ${f(GY(r) - 11)}l11 11l-11 11l-11 -11Z" fill="#dbe9ff" opacity=".85"/>`).join('')).join('');
  const pulseArt = () => `<defs><linearGradient id="tc-pg" x1="0" x2="1"><stop offset="0" stop-color="${COL}" stop-opacity="0"/><stop offset=".5" stop-color="${COL}" stop-opacity=".45"/><stop offset="1" stop-color="${COL}" stop-opacity="0"/></linearGradient></defs>` +
    `<rect x="${GX(0) - 40}" y="${f(GY(0) - 60)}" width="80" height="${f(GY(7) - GY(0) + 120)}" fill="url(#tc-pg)"/><path d="M${GX(0)} ${f(GY(0) - 60)}V${f(GY(7) + 60)}" stroke="#ffe2b0" stroke-width="8"/>` +
    Array.from({length: 8}, (_, r) => A.halo(GX(0), GY(r), 34, {id: `tc-ph${r}`, color: COL, strength: .8}) + `<circle cx="${GX(0)}" cy="${f(GY(r))}" r="9" fill="#fff4dd"/>`).join('');
  const capArt = () => { const [x, y] = [GX(1), GY(2)]; return `<rect x="${x - 42}" y="${f(y - 42)}" width="84" height="84" rx="14" fill="none" stroke="#e8f1ff" stroke-width="3"/>` +
    `<path d="M${x - 18} ${f(y - 22)}v44M${x + 18} ${f(y - 22)}v44M${x - 40} ${f(y)}h22M${x + 18} ${f(y)}h22" stroke="#e8f1ff" stroke-width="6"/>`; };
  const panel = dip => { const y0 = VH * .6, h = VH * .1;
    return `<rect x="140" y="${f(y0)}" width="720" height="${f(h)}" rx="22" fill="#0a1220" stroke="#2c3d5c" stroke-width="3"/>` +
      `<text x="170" y="${f(y0 + 40)}" font-family="Segoe UI" font-size="26" fill="#9fb3d6" data-ink-text="1">signal at each crossing · illustrative</text>` +
      Array.from({length: 8}, (_, r) => { const bh = (dip && r === FC[1] ? .28 : .92 - (dip && Math.abs(r - FC[1]) === 1 ? .2 : 0)) * (h - 70);
        return `<rect x="${200 + r * 82}" y="${f(y0 + h - 18 - bh)}" width="46" height="${f(bh)}" rx="6" fill="${dip && r === FC[1] ? HOT : '#4fd1ff'}"/>`; }).join(''); };
  const fieldArt = () => { const [cx, cy] = [GX(FC[0]), GY(FC[1])];
    return [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.3], [0, 1.3]].map(([dx, dy]) => L([[cx + dx * 110, cy + dy * 80], [cx + dx * 50, cy + dy * 60 - 40], [cx + dx * 10, cy - 18]], '#9fe6ff', 4)).join('') +
      A.halo(cx, cy, 90, {id: 'tc-fh', color: '#9fe6ff', strength: .6}); };
  const lockArt = () => { const [cx, cy] = [GX(FC[0]), GY(FC[1])];
    return `<circle cx="${cx}" cy="${f(cy)}" r="50" fill="none" stroke="#eafcff" stroke-width="5"/><circle cx="${cx}" cy="${f(cy)}" r="8" fill="${HOT}"/>` +
      [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => `<path d="M${cx + dx * 62} ${f(cy + dy * 62)}L${cx + dx * 92} ${f(cy + dy * 92)}" stroke="#eafcff" stroke-width="5" stroke-linecap="round"/>`).join(''); };

  globalThis.techTopic = {
    shots: [{id: 'hook', scene: 'w-hook', accent: ROW, transition: {type: 'focus', lead: .3, tail: .35, blur: 14, zoom: .08}},
      {id: 'layers', scene: 'w-layers', accent: COL, transition: {type: 'focus', lead: .3, tail: .35, blur: 14, zoom: .1}},
      {id: 'scan', scene: 'w-grid', accent: COL}, {id: 'touch', scene: 'w-grid', accent: HOT}],
    css: K.css,
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}, hook: {text: 'Where did you touch?', highlight: 'touch', until: 2.0}},
    symbols: ctx => { VH = Math.round(1000 / ctx.aspect); O = [610, VH * .6]; const vb = `0 0 ${VW} ${VH}`;
      return A.textures('tc', {tile: 220, seed: 4}) + [sym('tc-studio', vb, A.darkStudio(VW, VH, {id: 'tc-st', floor: .82, pool: [.5, .8], poolStrength: .35})),
        sym('tc-phone', vb, phoneArt()), sym('tc-through', vb, gridThroughArt()), sym('tc-finger', '0 0 260 540', fingerArt(1)), sym('tc-finger-top', '0 0 260 540', fingerArt(.82)),
        sym('tc-display', vb, displayArt()), sym('tc-colsheet', vb, sheetArt(Z.cols, '#ffd9a6')), sym('tc-rowsheet', vb, sheetArt(Z.rows, '#a6d4ff')), sym('tc-glass', vb, glassArt()),
        sym('tc-rows', vb, rowsArt()), sym('tc-cols', vb, colsArt()), sym('tc-gap', vb, gapArt()),
        sym('tc-gridbg', vb, gridBg()), sym('tc-pulse', vb, pulseArt()), sym('tc-cap', vb, capArt()), sym('tc-bars', vb, panel(false)), sym('tc-dip', vb, panel(true)),
        sym('tc-field', vb, fieldArt()), sym('tc-lock', vb, lockArt())].join(''); },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const label = (id, xy, w, text, style, extra = {}) => P(id, null, ...pc(xy), w, 5, {label: text, labelStyle: style, ...extra});
      const s1 = S('hook'), s2 = S('layers'), s3 = S('scan'), s4 = S('touch'), end = s4.end;
      const scenes = {
        'w-hook': {objects: [plate('h-bg', 'tc-studio', 0), plate('o-phone', 'tc-phone', 2, 'exact'), plate('o-grid', 'tc-through', 3, 'exact'),
          P('h-finger', 'tc-finger', 66, 66, 26, 4, {flat: true})]},
        'w-layers': {objects: [plate('l-bg', 'tc-studio', 0), plate('l-display', 'tc-display', 2, 'exact'), plate('l-colsheet', 'tc-colsheet', 2, 'exact'), plate('o-cols', 'tc-cols', 3, 'exact'),
          plate('l-rowsheet', 'tc-rowsheet', 3, 'exact'), plate('o-rows', 'tc-rows', 3, 'exact'), plate('o-gapmark', 'tc-gap', 4, 'exact'), plate('l-glass', 'tc-glass', 4, 'exact'),
          label('t-glass', [VW * .2, I(SL.x, SL.y + SL.d, Z.glass)[1] - 20], 38, 'cover glass', 'callout', {accent: '#bcd8ff'}),
          label('t-rows', [VW * .2, I(SL.x, SL.y + SL.d, Z.rows)[1] - 10], 38, 'rows', 'callout', {accent: ROW}),
          label('t-cols', [VW * .2, I(SL.x, SL.y + SL.d, Z.cols)[1] - 10], 38, 'columns', 'callout', {accent: COL}),
          label('t-display', [VW * .2, I(SL.x, SL.y + SL.d, Z.display)[1] + 10], 38, 'display', 'callout', {accent: '#6c7fb3'}),
          label('l-gap', [VW * .55, VH * .16], 70, 'they cross, never touch', 'chip', {accent: '#2b6fd6'})]},
        'w-grid': {objects: [plate('g-bg', 'tc-gridbg', 3), plate('o-pulse', 'tc-pulse', 3, 'exact'), plate('o-cap', 'tc-cap', 3, 'exact'), plate('o-bars', 'tc-bars', 3, 'exact'), plate('o-dip', 'tc-dip', 3, 'exact'),   // one parallax layer: marks stay on the grid under camera moves
          plate('o-field', 'tc-field', 3, 'exact'), P('o-finger', 'tc-finger-top', ...pc([GX(FC[0]) + 230 * Math.sin(R62), GY(FC[1]) + 230 * Math.cos(R62)]), 26, 3, {flat: true}), plate('o-lock', 'tc-lock', 3, 'exact'),
          label('l-cap', [GX(1) + 230, GY(2) - 80], 36, 'tiny capacitor', 'callout', {accent: '#e8f1ff'}),
          label('l-xy', [VW * .5, VH * .565], 64, 'touch: column 4 · row 5', 'readout')]},
      };
      // hook: fingertip glides in and hovers; the grid glows through the glass on "grid"
      track('h-finger', [key(0, [.08, .1, -24, 1, 0]), key(.9, [0, 0, -24, 1, 1], 'out'), key(s1.end, [-.01, -.012, -24, 1, 1], 'inOut')]);
      kit.trace('o-grid', 'grid', 1.1);
      // layers: the stack separates, tags arrive, rows then columns trace on, the no-contact mark and tag
      const sep = s2.start + .1;
      [['l-display', 0], ['l-colsheet', 70], ['l-rowsheet', 140], ['l-glass', 210]].forEach(([id, drop], i) =>
        track(id, [key(s2.start - .4, [0, (Z[id.slice(2).replace('sheet', '') === 'col' ? 'cols' : id.slice(2).replace('sheet', '') === 'row' ? 'rows' : id.slice(2)] - [0, 30, 45, 60][i]) / VH, 0, 1, 1]), key(sep, [0, (Z[id.slice(2).replace('sheet', '') === 'col' ? 'cols' : id.slice(2).replace('sheet', '') === 'row' ? 'rows' : id.slice(2)] - [0, 30, 45, 60][i]) / VH, 0, 1, 1]), key(sep + .9, N, 'out')]));
      const out = s2.end - .5;                                                        // tags leave before the focus push
      ['t-glass', 't-display'].forEach((id, i) => kit.label(id, sep + 1 + i * .15, out));
      kit.trace('o-rows', 'rows', .9); kit.label('t-rows', cue('rows') + .3, out);
      kit.trace('o-cols', 'cols', .9); kit.label('t-cols', cue('cols') + .3, out);
      kit.trace('o-gapmark', cue('gap') - .25, .4); kit.label('l-gap', 'gap', out);
      // scan: capacitor callout; one column pulses at a time across the grid; the readout shows every crossing
      kit.power('o-cap', cue('cap') - .05, .35); kit.label('l-cap', 'cap', s3.end - .2);
      track('o-cap', [key(0, [0, 0, 0, .86, 0]), key(cue('cap') - .05, [0, 0, 0, .86, 0]), key(cue('cap') + .3, N, 'out'), key(s3.end - .3, N), key(s3.end, [0, 0, 0, 1, 0])]);
      const p0 = cue('pulse'), step = .5, pk = [key(0, [0, 0, 0, 1, 0]), key(p0, [0, 0, 0, 1, 0])];
      for (let k = 0; k < 7; k++) { const c = k % 6; pk.push(key(p0 + k * step, [c * .12, 0, 0, 1, 1], 'hold')); }
      pk.push(key(s4.start, [FC[0] * .12, 0, 0, 1, 1], 'hold'), key(end, [FC[0] * .12, 0, 0, 1, 1]));
      track('o-pulse', pk); motion.speechCue('pulse', 'o-pulse');
      kit.rise('o-bars', 'measure');
      // touch: finger lands; field bends into it; that crossing's signal drops; the chip locks on
      track('o-finger', [key(0, [.06, .02, -62, 1.08, 0]), key(cue('finger'), [.06, .02, -62, 1.08, 0]), key(cue('finger') + .5, [0, 0, -62, 1, 1], 'out')]); motion.speechCue('finger', 'o-finger');
      kit.trace('o-field', 'field', .9);
      track('o-dip', [key(0, [0, 0, 0, 1, 0]), key(cue('drop'), [0, 0, 0, 1, 0]), key(cue('drop') + .3, N, 'out')]); motion.speechCue('drop', 'o-dip');
      kit.power('o-lock', 'lock', .45); kit.label('l-xy', 'xy');
      const cameras = {hook: kit.cameraTravel('hook', [[s1.start, 0, -.01, 1.0], [s1.end, 0, .01, 1.07]]),
        layers: kit.cameraTravel('layers', [[s2.start, 0, 0, 1.02], [s2.end, 0, -.01, 1.06]]),
        scan: kit.cameraTravel('scan', [[s3.start, 0, 0, 1.0], [s3.end, 0, 0, 1.0]]),
        touch: kit.cameraTravel('touch', [[s4.start, 0, 0, 1.0], [cue('drop'), .03, -.05, 1.1], [end, .03, -.05, 1.12]])};
      // protected regions on full-stage plates need boxes: the rows face and the crosshair
      const face = [[SL.x, SL.y], [SL.x + SL.w, SL.y], [SL.x + SL.w, SL.y + SL.d], [SL.x, SL.y + SL.d]].map(([x, y]) => I(x, y, Z.rows + 6)), xs = face.map(p => p[0]), ys = face.map(p => p[1]);
      const box = (x0, y0, x1, y1) => [x0 / VW, y0 / VH, (x1 - x0) / VW, (y1 - y0) / VH], [lx, ly] = [GX(FC[0]), GY(FC[1])];
      globalThis.techTopic.composition = {hook: {regions: [{id: 'o-phone', box: [.2, .12, .6, .45]}]},
        layers: {regions: [{id: 'o-rows', box: box(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys))}], annotations: [{id: 'l-gap', target: 'o-rows'}]},
        touch: {regions: [{id: 'o-lock', box: box(lx - 95, ly - 95, lx + 95, ly + 95)}], annotations: [{id: 'l-xy', target: 'o-lock'}]}};
      return {scenes, cameras, checks: {keyframes: [['hook', cue('grid') + 1.2], ['layers', cue('gap') + .5], ['touch', cue('xy') + .8]]}};
    },
  };
})();
