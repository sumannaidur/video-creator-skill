// Whiteboard kit (browser script, loaded after the shared shot core by backend.mjs). Style implementation #3 (P017.2).
// Marker ink that draws itself stroke by stroke, hand-drawn geometry, a marker pen that follows the drawing, written
// labels, erasing, and the whiteboard's own `erase` transition (registered through globalThis.vcShotStyle).
// Helpers produce markup and keyframes for the topic's own drawings; they never choose a scene, object or time.
(() => {
  const {f, rnd} = globalThis.techShotArt;
  const fail = m => { throw new Error('wbKit: ' + m); };
  const num = (x, what) => (typeof x === 'number' && Number.isFinite(x)) ? x : fail(`${what} must be a number`);
  const INK = '#1d2026';
  const COLORS = {ink: INK, red: '#d93a2b', blue: '#2758c4', green: '#2b8c4e', yellow: '#ffd93b', grey: '#8a8f98'};

  // ---------- hand-drawn geometry ----------
  // A smooth hand path through points with seeded wobble (no two strokes alike).
  const hand = (pts, {seed = 1, wobble = 2.5} = {}) => {
    const p = pts.map(([x, y], i) => [x + (rnd(seed + i * 3) - .5) * wobble * 2, y + (rnd(seed + i * 3 + 1) - .5) * wobble * 2]);
    if (p.length < 3) return `M${p.map(q => q.map(f).join(' ')).join('L')}`;
    let d = `M${p[0].map(f).join(' ')}`;
    for (let i = 1; i < p.length - 1; i++) d += `Q${p[i].map(f).join(' ')} ${f((p[i][0] + p[i + 1][0]) / 2)} ${f((p[i][1] + p[i + 1][1]) / 2)}`;
    return d + `L${p.at(-1).map(f).join(' ')}`;
  };
  // A loose ellipse that overshoots its start, as a marker circle does.
  const loop = (cx, cy, rx, ry = rx, {seed = 1, turns = 1.08, n = 24} = {}) => hand(Array.from({length: Math.round(n * turns) + 1}, (_, i) => {
    const a = -Math.PI / 2 + i / n * Math.PI * 2, k = 1 + (rnd(seed + i) - .5) * .06;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  }), {seed, wobble: 1});
  // A hand arrow: a slightly curved shaft plus a two-stroke head.
  const arrow = ([x0, y0], [x1, y1], {bend = .15, head = 28, seed = 1} = {}) => {
    const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
    const a = Math.atan2(y1 - my, x1 - mx);
    return [hand([[x0, y0], [mx, my], [x1, y1]], {seed, wobble: 1.5}),
      hand([[x1 - Math.cos(a - .5) * head, y1 - Math.sin(a - .5) * head], [x1, y1], [x1 - Math.cos(a + .5) * head, y1 - Math.sin(a + .5) * head]], {seed: seed + 7, wobble: 1})];
  };
  // Shading by marker hatching inside a box (diagonal strokes).
  const hatch = (x, y, w, h, {gap = 16, seed = 1} = {}) => {
    const out = [];
    for (let s = -h; s < w; s += gap) out.push(hand([[x + Math.max(0, s), y + Math.max(0, -s)], [x + Math.min(w, s + h), y + Math.min(h, h - (s + h - w > 0 ? s + h - w : 0))]], {seed: seed + s, wobble: 1}));
    return out;
  };
  // Marker ink: each stroke draws in turn as the object's --draw channel goes 0 → 1 (windows weighted by `weight`).
  // Variable weight: every stroke gets a seeded width and a thin offset second pass, like a chisel marker.
  const ink = (strokes, {color = INK, width = 7, seed = 1, fills = []} = {}) => {
    const list = strokes.map(s => typeof s === 'string' ? {d: s} : s);
    const total = list.reduce((a, s) => a + (s.weight ?? 1), 0) || 1;
    let acc = 0;
    const win = list.map(s => { const a = acc / total; acc += s.weight ?? 1; return [a, acc / total]; });
    const prog = ([a, b]) => `clamp(0, calc((var(--draw, 1) - ${a.toFixed(4)}) / ${Math.max(.0001, b - a).toFixed(4)}), 1)`;
    const fillMarkup = fills.map(({d, color: c = COLORS.yellow, after = 1, opacity = .55}) =>
      `<path d="${d}" fill="${c}" style="mix-blend-mode:multiply;opacity:calc(${opacity} * clamp(0, calc((var(--draw, 1) - ${after}) * 20 + 1), 1))"/>`).join('');
    return fillMarkup + list.map((s, i) => {
      const w = (s.width ?? width) * (.85 + rnd(seed + i) * .3), c = s.color ?? color;
      const dash = `stroke-dasharray:1 1;stroke-dashoffset:calc(1 - ${prog(win[i])})`;
      return `<path d="${s.d}" pathLength="1" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" style="${dash}"/>` +
        `<path d="${s.d}" pathLength="1" fill="none" stroke="${c}" stroke-width="${f(w * .45)}" stroke-linecap="round" opacity=".55" transform="translate(${f(w * .18)} ${f(w * .12)})" style="${dash}"/>`;
    }).join('');
  };
  // The marker pen that follows a drawing (cap off, angled like a hand holding it). Tip at (0, 0) of its 0 0 120 260 frame → place with origin.
  const pen = (body = '#2758c4') => `<g transform="translate(18 10) rotate(-28 40 120)"><rect x="22" y="40" width="36" height="170" rx="10" fill="${body}"/>` +
    `<rect x="22" y="40" width="12" height="170" rx="6" fill="#ffffff" opacity=".25"/><rect x="20" y="150" width="40" height="20" fill="#e8eaee"/>` +
    `<path d="M26 40L40 4L54 40Z" fill="#f4f4f2"/><path d="M36 14L40 2L44 14Z" fill="${body}"/></g>`;

  const LABEL_STYLES = ['marker', 'boxed', 'highlight', 'note'];
  const css = `
    .piece-label { font:700 44px/1.8 var(--hand); padding:4px 16px; color:var(--label-accent, ${INK}) }
    .label-boxed .piece-label { padding:4px 18px; border:4px solid var(--label-accent, ${INK}); border-radius:14px 22px 12px 26px / 22px 12px 26px 14px }
    .label-highlight .piece-label { background:linear-gradient(transparent 42%, #ffd93bcc 42%, #ffd93bcc 84%, transparent 84%) }
    .label-note .piece-label { font-size:36px; padding:16px 22px; background:#fff3a8; box-shadow:0 8px 14px #00000022; transform:rotate(-2deg) }
  `;

  // ---------- the whiteboard's transition: erase the board, then the next drawing starts on a clean board ----------
  const setup = (stage) => {
    const o = document.createElement('div');
    o.className = 'wb-erase';
    o.innerHTML = '<div class="wb-wipe"></div><div class="wb-eraser"><div class="wb-felt"></div></div>';
    stage.append(o);
    return {erase: o};
  };
  const eraseRender = ({t, tr, k, before, overlays}) => {
    const o = overlays?.erase;
    if (!o) return;
    if (!tr) { o.style.visibility = 'hidden'; return; }
    o.style.visibility = 'visible';
    const wipe = o.firstChild, eraser = o.lastChild;
    // Before the cut the eraser sweeps in rows across the board; after it the clean board fades and the eraser leaves.
    const p = before ? k : 1, x = before ? -10 + k * 112 : 102 + (1 - k) * 30;
    wipe.style.width = `${(p * 112).toFixed(2)}%`;
    o.style.opacity = before ? '1' : String(k.toFixed(3));
    eraser.style.transform = `translate(${x.toFixed(2)}%, ${(Math.sin(t * 22) * 6).toFixed(2)}%) rotate(${(-8 + Math.sin(t * 22) * 4).toFixed(2)}deg)`;
  };
  globalThis.vcShotStyle = {labelStyles: LABEL_STYLES, setup,
    transitions: {erase: {defaults: {lead: .45, tail: .3}, needsSymbol: false, render: eraseRender}}};

  // ---------- motion helpers (bound to ctx; `at` is seconds or a resolved-plan cue id) ----------
  function motion(ctx) {
    const {key, N, track, show, showHide, stroke, reveal} = ctx.motion;
    const when = (at, id) => typeof at === 'string' ? ctx.motion.speechCue(at, id) : num(at, 'time');
    return {
      when,
      // Draw an ink object stroke by stroke over `dur` seconds (its strokes come from art.ink).
      draw: (id, at, dur = 1) => { const t = when(at, id); show(id, t, [0, 0, 0, 1, 0], .04); stroke(id, [key(t, [0]), key(t + dur, [1], 'linear')]); return t; },
      // Write a label left to right like handwriting (and optionally rub it out later).
      write: (id, at, dur = .6, off) => {
        const t = when(at, id);
        off === undefined ? show(id, t, [0, 0, 0, 1, 0], .04) : showHide(id, t, [0, 0, 0, 1, 0], when(off), .2);
        reveal(id, t, t + dur, 'rightward'); return t;
      },
      // Erase an object: a rubbed-out band travels left to right until nothing remains.
      erase: (id, at, dur = .5) => { const t = num(at, 'time'); reveal(id, t, t + dur, 'leftward', 1, 0); return t; },
      // The marker pen follows stage-fraction offsets [[dx,dy], ...] over [t, t+dur], then lifts away.
      pen: (id, at, dur, pts) => {
        const t = when(at, id);
        const keys = [key(t - .12, [pts[0][0] + .03, pts[0][1] + .05, 6, 1, 0], 'out'), key(t, [pts[0][0], pts[0][1], 0, 1, 1], 'out')];
        pts.forEach((p, i) => { if (i) keys.push(key(t + dur * i / (pts.length - 1), [p[0], p[1], Math.sin(i) * 3, 1, 1], 'linear')); });
        keys.push(key(t + dur + .25, [pts.at(-1)[0] + .05, pts.at(-1)[1] + .06, 8, 1, 0], 'out'));
        track(id, keys); return t;
      },
      label: (id, at, off) => { const t = when(at, id); off === undefined ? show(id, t, [0, 0, 0, 1, 0], .25) : showHide(id, t, [0, 0, 0, 1, 0], when(off), .2); return t; },
      planCamera: (shotId, views) => {
        const shot = ctx.plan?.shots.find(s => s.id === shotId) ?? fail(`planCamera: shot ${shotId} is not in the resolved plan (--plan)`);
        const moments = shot.camera ?? [];
        if (!Array.isArray(views) || views.length !== moments.length) fail(`planCamera: shot ${shotId} has ${moments.length} planned camera keys; give exactly one view for each`);
        const keys = moments.map((m, i) => key(m.seconds, views[i].slice(0, 3), views[i][3] ?? 'smooth'));
        return !keys.length || keys[0][0] > shot.start.seconds + 1e-9 ? [key(shot.start.seconds, keys[0]?.[1] ?? [0, 0, 1]), ...keys] : keys;
      },
    };
  }

  globalThis.wbKit = {art: {hand, loop, arrow, hatch, ink, pen}, COLORS, css, LABEL_STYLES, motion};
})();
