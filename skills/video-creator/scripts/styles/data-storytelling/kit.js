// Data Storytelling kit (browser script, loaded after the shared shot core by backend.mjs). Style implementation #5 (P017.4).
// Editorial data graphics whose geometry is computed from the data, never drawn by eye: zero-based bar charts with ticks
// and units, line charts, area-true proportional circles, unit (waffle) charts, timelines, and exact counters. Charts
// grow through the object's --draw channel. Registers the `bars` transition via globalThis.vcShotStyle.
// Integrity rules are enforced here: negative or non-finite values, bar domains that exclude zero, domains smaller than
// the data, radius-scaled circles and non-integer counters are refused with an error instead of being drawn.
(() => {
  const {f} = globalThis.techShotArt;
  const fail = m => { throw new Error('dataKit: ' + m); };
  const num = (x, what) => (typeof x === 'number' && Number.isFinite(x)) ? x : fail(`${what} must be a finite number`);
  const INK = '#1a1c1f', MUTED = '#b9bdc4', GRID = '#e4e6ea', ACCENT = '#e4572e', BLUE = '#2f6db3';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const win = (i, n, spread = .55) => { const a = i / n * (1 - spread), b = a + spread; return [a, Math.min(1, b)]; };
  const grow = ([a, b]) => `clamp(0, calc((var(--draw, 1) - ${a.toFixed(4)}) / ${(b - a).toFixed(4)}), 1)`;
  // Round tick step (1, 2, 2.5, 5 × 10^n) for a domain [0, max].
  const niceStep = (max, target = 4) => {
    const raw = max / target, p = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw);
  };
  // Vertical bar chart in a w×h box at (x, y). data: [{label, value, highlight?}], domain [0, max] (max defaults to a nice
  // ceiling of the data). Bars grow from the zero baseline one after another as --draw goes 0 → 1.
  const barChart = ({x, y, w, h, data, max, unit = '', colors = {base: MUTED, highlight: ACCENT}, font = 30, gap = .32}) => {
    if (!Array.isArray(data) || !data.length) fail('barChart needs data');
    data.forEach((d, i) => { if (num(d.value, `value ${i}`) < 0) fail('barChart values must be ≥ 0 (bars start at a zero baseline)'); });
    const top = Math.max(...data.map(d => d.value));
    const step = niceStep(max ?? top);
    const dmax = max ?? Math.ceil(top / step) * step;
    if (num(dmax, 'max') < top) fail(`barChart domain max ${dmax} is below the largest value ${top}`);
    const sy = v => y + h - v / dmax * h, bw = w / data.length * (1 - gap);
    let s = '';
    for (let v = 0; v <= dmax + 1e-9; v += step) {
      s += `<path d="M${f(x)} ${f(sy(v))}H${f(x + w)}" stroke="${v === 0 ? INK : GRID}" stroke-width="${v === 0 ? 3 : 2}"/>` +
        `<text x="${f(x - 14)}" y="${f(sy(v) + font * .34)}" text-anchor="end" font-size="${font * .8}" fill="#6b7078">${+v.toFixed(6)}</text>`;
    }
    if (unit) s += `<text x="${f(x - 14)}" y="${f(y - font * .9)}" text-anchor="end" font-size="${font * .8}" fill="#6b7078">${esc(unit)}</text>`;
    data.forEach((d, i) => {
      const bx = x + (i + .5) * w / data.length - bw / 2, bh = d.value / dmax * h, c = d.highlight ? colors.highlight : colors.base;
      s += `<rect x="${f(bx)}" y="${f(y + h - bh)}" width="${f(bw)}" height="${f(bh)}" fill="${c}" style="transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(${grow(win(i, data.length))})"/>` +
        `<text x="${f(bx + bw / 2)}" y="${f(y + h + font * 1.25)}" text-anchor="middle" font-size="${font}" font-weight="600" fill="${INK}">${esc(d.label)}</text>` +
        `<text x="${f(bx + bw / 2)}" y="${f(y + h - bh - font * .45)}" text-anchor="middle" font-size="${font}" font-weight="700" fill="${d.highlight ? colors.highlight : INK}" style="opacity:${grow([win(i, data.length)[1] - .05, Math.min(1, win(i, data.length)[1] + .05)])}">${esc(d.display ?? d.value)}</text>`;
    });
    return s;
  };
  // Line chart: points [[xValue, yValue], ...] scaled into the box; the line draws on with --draw (pathLength = 1).
  const lineChart = ({x, y, w, h, points, xDomain, yDomain = [0, null], color = BLUE, width = 8}) => {
    points.forEach(([a, b], i) => { num(a, `x ${i}`); num(b, `y ${i}`); });
    const [x0, x1] = xDomain ?? [Math.min(...points.map(p => p[0])), Math.max(...points.map(p => p[0]))];
    const y0 = yDomain[0], y1 = yDomain[1] ?? Math.max(...points.map(p => p[1]));
    if (points.some(([, b]) => b < y0 || b > y1)) fail('lineChart y domain must contain every value');
    const P = ([a, b]) => [x + (a - x0) / (x1 - x0) * w, y + h - (b - y0) / (y1 - y0) * h];
    return `<path d="M${points.map(p => P(p).map(f).join(' ')).join('L')}" pathLength="1" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))"/>`;
  };
  // Area-true proportional circles: radius ∝ √value (so area ∝ value), aligned on a common baseline.
  const circles = ({x, y, rMax, data, gap = 40, font = 30}) => {
    data.forEach((d, i) => { if (num(d.value, `value ${i}`) < 0) fail('circle values must be ≥ 0'); });
    const vmax = Math.max(...data.map(d => d.value));
    let cx = x, s = '';
    data.forEach((d, i) => {
      const r = rMax * Math.sqrt(d.value / vmax);
      s += `<circle cx="${f(cx + r)}" cy="${f(y - r)}" r="${f(r)}" fill="${d.color ?? MUTED}" style="transform-box:fill-box;transform-origin:50% 100%;transform:scale(${grow(win(i, data.length, .6))})"/>` +
        `<text x="${f(cx + r)}" y="${f(y + font * 1.3)}" text-anchor="middle" font-size="${font}" font-weight="600" fill="${INK}">${esc(d.label)}</text>`;
      cx += 2 * r + gap;
    });
    return s;
  };
  // Unit (waffle) chart: `total` cells, the first `value` coloured, filling in order as --draw rises.
  const units = ({x, y, cols, total, value, size = 30, gap = 8, color = ACCENT, rest = GRID}) => {
    if (!Number.isInteger(total) || !Number.isInteger(value) || value < 0 || value > total) fail('units needs integer 0 ≤ value ≤ total');
    return Array.from({length: total}, (_, i) => {
      const cx = x + (i % cols) * (size + gap), cy = y + Math.floor(i / cols) * (size + gap), on = i < value;
      return `<rect x="${f(cx)}" y="${f(cy)}" width="${size}" height="${size}" rx="${f(size * .2)}" fill="${rest}"/>` +
        (on ? `<rect x="${f(cx)}" y="${f(cy)}" width="${size}" height="${size}" rx="${f(size * .2)}" fill="${color}" style="opacity:${grow([i / value * .85, i / value * .85 + .15])}"/>` : '');
    }).join('');
  };
  // Timeline axis from `from` to `to` with event markers [{at, label}] placed proportionally; markers pop in order.
  const timeline = ({x, y, w, from, to, events, font = 28, color = INK}) => {
    if (!(num(to, 'to') > num(from, 'from'))) fail('timeline needs to > from');
    const X = v => x + (v - from) / (to - from) * w;
    return `<path d="M${f(x)} ${f(y)}H${f(x + w)}" stroke="${color}" stroke-width="4" pathLength="1" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - ${grow([0, .4])})"/>` +
      events.map((e, i) => { if (num(e.at, 'event') < from || e.at > to) fail('timeline event outside its range'); const g = grow(win(i, events.length, .3).map(v => .4 + v * .6));
        return `<g style="opacity:${g}"><circle cx="${f(X(e.at))}" cy="${f(y)}" r="12" fill="${e.color ?? ACCENT}"/><text x="${f(X(e.at))}" y="${f(y - 26)}" text-anchor="middle" font-size="${font}" font-weight="700" fill="${INK}">${esc(e.label)}</text>` +
          `<text x="${f(X(e.at))}" y="${f(y + font + 18)}" text-anchor="middle" font-size="${font * .85}" fill="#6b7078">${esc(e.at)}</text></g>`; }).join('');
  };
  // An annotation: thin leader from a point to a note anchor, with a dot on the data.
  const annotate = ([x0, y0], [x1, y1], {color = INK} = {}) => `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${color}" stroke-width="2.5" pathLength="1" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))"/>` +
    `<circle cx="${f(x0)}" cy="${f(y0)}" r="7" fill="${color}"/>`;

  // Counter: a label object whose number counts from `from` to `to` (integers) as --draw goes 0 → 1, ending exactly on `to`.
  // `system` uses a native digit set (CSS counter style: decimal, devanagari, kannada, telugu, tamil, ...).
  const COUNTER_CSS = `@property --vc-n { syntax: '<integer>'; inherits: false; initial-value: 0 }`;
  const counter = ({from = 0, to, prefix = '', suffix = '', system = 'decimal'}) => {
    if (!Number.isInteger(from) || !Number.isInteger(to)) fail('counter values must be integers');
    return {counter: {from, to, prefix, suffix, system}};
  };

  const LABEL_STYLES = ['headline', 'value', 'note', 'source', 'deck', 'callout', 'direct'];
  const css = `
    ${COUNTER_CSS}
    .piece-label { font:700 36px/1.5 var(--vc-font); color:${INK} }
    .label-headline .piece-label { font:800 50px/1.35 var(--vc-font); text-align:left; white-space:normal; width:auto }
    .label-value .piece-label { font:800 96px/1.25 var(--vc-font); color:var(--label-accent, ${INK}); font-variant-numeric:tabular-nums }
    .label-note .piece-label { font:600 30px/1.5 var(--vc-font); color:#3b3f45; padding-left:16px; border-left:5px solid var(--label-accent, ${ACCENT}) }
    .label-source .piece-label { font:500 22px/1.5 var(--vc-font); color:#7a7f87 }
    .label-deck .piece-label { font:500 34px/1.4 var(--vc-font); color:#5b6068; text-align:left; white-space:normal; width:auto }
    .label-callout .piece-label { font:600 30px/1.45 var(--vc-font); color:${INK}; background:#ffffff; padding:14px 20px; border-left:6px solid var(--label-accent, ${ACCENT}); box-shadow:0 6px 18px #0000001f; white-space:normal; width:auto }
    .label-direct .piece-label { font:700 30px/1.3 var(--vc-font); color:var(--label-accent, ${INK}); font-variant-numeric:tabular-nums }
    .piece[data-counter] .piece-label { --vc-n: calc(var(--from) + (var(--to) - var(--from)) * var(--draw, 1)); counter-reset: vcn var(--vc-n) }
    .piece[data-counter] .piece-label::after { content: var(--prefix) counter(vcn, var(--system)) var(--suffix) }
  `;
  // Counters need their own pseudo-content and per-object variables; applied once the scene is built.
  const applyCounters = () => {
    for (const s of Object.values(globalThis.techScenes ?? {})) for (const o of s.objects ?? []) if (o.counter) {
      const el = document.getElementById(o.id);
      if (!el || el.dataset.counter) continue;
      const c = o.counter, q = v => JSON.stringify(String(v));
      el.dataset.counter = '1';
      el.style.setProperty('--from', c.from); el.style.setProperty('--to', c.to); el.style.setProperty('--system', c.system);
      el.style.setProperty('--prefix', q(c.prefix)); el.style.setProperty('--suffix', q(c.suffix));
    }
  };

  // ---------- transition: bars — chart columns rise to cover the frame, then fall away on the next shot ----------
  const N = 9;
  const setup = (stage) => {
    applyCounters();
    const o = document.createElement('div');
    o.className = 'ds-bars';
    o.innerHTML = Array.from({length: N}, (_, i) => `<i style="left:${(i * 100 / N).toFixed(3)}%"></i>`).join('');
    stage.append(o);
    return {bars: o};
  };
  const barsRender = ({tr, k, before, overlays}) => {
    const o = overlays?.bars;
    if (!o) return;
    if (!tr) { o.style.visibility = 'hidden'; return; }
    o.style.visibility = 'visible';
    [...o.children].forEach((b, i) => {
      const lag = (before ? i : N - 1 - i) / N * .45, p = Math.max(0, Math.min(1, (k - lag) / (1 - .45)));
      b.style.height = `${(p * 101).toFixed(2)}%`;
    });
  };
  globalThis.vcShotStyle = {labelStyles: LABEL_STYLES, setup, transitions: {bars: {defaults: {lead: .45, tail: .4}, needsSymbol: false, render: barsRender}}};

  function motion(ctx) {
    const {key, N: REST, track, show, showHide, stroke} = ctx.motion;
    const when = (at, id) => typeof at === 'string' ? ctx.motion.speechCue(at, id) : num(at, 'time');
    return {
      when,
      // Animate a chart (bars, line, circles, units, timeline) or a counter from 0 to its true values over `dur`.
      build: (id, at, dur = 1) => { const t = when(at, id); show(id, t, [0, 0, 0, 1, 0], .15); stroke(id, [key(t, [0]), key(t + dur, [1], 'out')]); return t; },
      count: (id, at, dur = 1.2) => { const t = when(at, id); show(id, t, [0, .01, 0, 1, 0], .2); stroke(id, [key(t, [0]), key(t + dur, [1], 'out')]); return t; },
      label: (id, at, off) => { const t = when(at, id); off === undefined ? show(id, t, [0, .01, 0, 1, 0], .3) : showHide(id, t, [0, .01, 0, 1, 0], when(off), .25); return t; },
      planCamera: (shotId, views) => {
        const shot = ctx.plan?.shots.find(s => s.id === shotId) ?? fail(`planCamera: shot ${shotId} is not in the resolved plan (--plan)`);
        const moments = shot.camera ?? [];
        if (!Array.isArray(views) || views.length !== moments.length) fail(`planCamera: shot ${shotId} has ${moments.length} planned camera keys; give exactly one view for each`);
        const keys = moments.map((m, i) => key(m.seconds, views[i].slice(0, 3), views[i][3] ?? 'smooth'));
        return !keys.length || keys[0][0] > shot.start.seconds + 1e-9 ? [key(shot.start.seconds, keys[0]?.[1] ?? [0, 0, 1]), ...keys] : keys;
      },
    };
  }

  // P023.4 editorial ranked bars (reference: The Pudding / FT style): one symbol per row so topics can transform rows
  // (E20 morph technique) while keeping identity; direct labels instead of legends; one highlight, the rest muted.
  // Each row symbol is a full-length bar (width w = value max) scaled by its object's --draw (scaleX, origin left), so a
  // row shows value v on domain [0, max] at --draw = v / max. Returns {rows: [{id, markup, y}], axis(max, step), x0, w}.
  const hbars = ({x, y, w, rowH, data, colors = {base: MUTED, highlight: ACCENT}, thick = .56, prefix = 'hb'}) => {
    if (!Array.isArray(data) || !data.length) fail('hbars needs data');
    data.forEach((d, i) => { if (num(d.value, `value ${i}`) < 0) fail('hbars values must be ≥ 0'); });
    const rows = data.map((d, i) => { const cy = y + (i + .5) * rowH, h = rowH * thick;
      return {id: `${prefix}${i}`, y: cy, markup: `<rect x="${f(x)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(h * .12)}" fill="${d.highlight ? colors.highlight : colors.base}" style="transform-box:fill-box;transform-origin:0% 50%;transform:scaleX(var(--draw, 1))"/>`}; });
    const axis = (max, step, {font = 22, unit = ''} = {}) => { if (num(max, 'max') <= 0) fail('axis max must be > 0'); let s = '';
      for (let v = 0; v <= max + 1e-9; v += step) { const X = x + v / max * w; s += `<path d="M${f(X)} ${f(y - 10)}V${f(y + rowH * data.length)}" stroke="${v === 0 ? INK : GRID}" stroke-width="${v === 0 ? 3 : 2}"/>` +
        `<text x="${f(X)}" y="${f(y - 22)}" text-anchor="middle" font-size="${font}" fill="#6b7078" style="letter-spacing:.06em">${esc(String(+v.toFixed(6)))}</text>`; }
      return s + (unit ? `<text x="${f(x + w)}" y="${f(y - 22 - font * 1.4)}" text-anchor="end" font-size="${font}" fill="#6b7078" style="letter-spacing:.08em;text-transform:uppercase">${esc(unit)}</text>` : ''); };
    return {rows, axis, x0: x, w, end: (i, v, max) => x + v / max * w};
  };

  globalThis.dataKit = {art: {barChart, lineChart, circles, units, timeline, annotate, niceStep, hbars}, counter, COLORS: {INK, MUTED, GRID, ACCENT, BLUE}, css, LABEL_STYLES, motion};
})();
