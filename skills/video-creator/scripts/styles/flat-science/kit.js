// Flat Science kit (browser script, loaded after the shared shot core by backend.mjs). Style implementation #4 (P017.3).
// Organic flat shapes with one-step shading, colour-coded particles and molecules, flows that keep moving, cross-section
// layers, mechanism motions (grow, morph, flow, emit) and the `magnify` transition (registered via globalThis.vcShotStyle).
// Helpers produce markup and keyframes for the topic's own science; they never choose a subject, layout or time.
(() => {
  const {f, rnd, blob} = globalThis.techShotArt;
  const fail = m => { throw new Error('fsKit: ' + m); };
  const num = (x, what) => (typeof x === 'number' && Number.isFinite(x)) ? x : fail(`${what} must be a number`);
  // A colour-coding palette: each hue is meant to stand for one substance or role throughout a video.
  const HUES = {water: '#2f8fe0', oxygen: '#e5484d', carbon: '#6b7280', energy: '#f5b301', life: '#2bb673', sugar: '#ff8a3d', violet: '#7c5cff', ink: '#1c2540'};
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const tone = (h, k) => '#' + hex(h).map(c => Math.max(0, Math.min(255, Math.round(k > 1 ? c + (255 - c) * (k - 1) : c * k))).toString(16).padStart(2, '0')).join('');

  // Organic flat body with one-step shading: a base shape, a darker crescent on the shadow side, a light sheen.
  const organic = (cx, cy, rx, ry, color, {seed = 1, n = 12, amp = .1, shade = .78, sheen = true} = {}) =>
    `<path d="${blob(cx, cy, rx, ry, n, amp, seed)}" fill="${color}"/>` +
    `<path d="${blob(cx + rx * .12, cy + ry * .14, rx * .9, ry * .86, n, amp, seed)}" fill="${tone(color, shade)}" clip-path="none" opacity=".55"/>` +
    `<path d="${blob(cx - rx * .06, cy - ry * .08, rx * .9, ry * .86, n, amp, seed)}" fill="${color}"/>` +
    (sheen ? `<ellipse cx="${f(cx - rx * .38)}" cy="${f(cy - ry * .42)}" rx="${f(rx * .22)}" ry="${f(ry * .12)}" fill="#ffffff" opacity=".45" transform="rotate(-25 ${f(cx - rx * .38)} ${f(cy - ry * .42)})"/>` : '');
  // A particle (atom-like ball) with shading and a highlight.
  const ball = (cx, cy, r, color) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${tone(color, .8)}"/><circle cx="${f(cx - r * .1)}" cy="${f(cy - r * .1)}" r="${f(r * .9)}" fill="${color}"/>` +
    `<circle cx="${f(cx - r * .35)}" cy="${f(cy - r * .35)}" r="${f(r * .25)}" fill="#ffffff" opacity=".55"/>`;
  // A small molecule from atoms [[dx, dy, r, color], ...] joined by bonds to the first atom.
  const molecule = (cx, cy, atoms, {bond = '#ffffff99'} = {}) =>
    atoms.slice(1).map(([dx, dy]) => `<path d="M${f(cx)} ${f(cy)}L${f(cx + dx)} ${f(cy + dy)}" stroke="${bond}" stroke-width="${f(atoms[0][2] * .35)}" stroke-linecap="round"/>`).join('') +
    atoms.map(([dx, dy, r, c]) => ball(cx + dx, cy + dy, r, c)).join('');
  // A scatter of particles of one colour inside a box (seeded, never overlapping much).
  const particles = (seed, n, x, y, w, h, color, r = 10) => Array.from({length: n}, (_, i) => ball(x + rnd(seed + i) * w, y + rnd(seed + 99 + i) * h, r * (.75 + rnd(seed + 199 + i) * .5), color)).join('');
  // A flow: dots marching along a path forever, driven by the object's --draw channel (motion.flow). Faint track underneath.
  const flow = (d, {color = HUES.water, dot = 14, gap = 46, track = .18, speed = 6} = {}) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(dot * .9)}" stroke-linecap="round" opacity="${track}"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${dot}" stroke-linecap="round" stroke-dasharray="0 ${gap}" style="stroke-dashoffset:calc(var(--draw, 0) * ${-gap * speed}px)"/>`;
  // Concentric organic layers for a cross-section, outermost first: [[rx, ry, color], ...].
  const section = (cx, cy, layers, {seed = 1} = {}) => layers.map(([rx, ry, color], i) =>
    `<path d="${blob(cx, cy, rx, ry, 16, .05, seed + i)}" fill="${color}"/>` + (i === 0 ? `<path d="${blob(cx, cy, rx, ry, 16, .05, seed)}" fill="none" stroke="${tone(color, .7)}" stroke-width="6"/>` : '')).join('');
  // A soft radiant source (sun, lamp, energy).
  const rays = (cx, cy, r, color = HUES.energy, n = 10) => `<circle cx="${cx}" cy="${cy}" r="${f(r * 2)}" fill="${color}" opacity=".16"/><circle cx="${cx}" cy="${cy}" r="${f(r * 1.45)}" fill="${color}" opacity=".22"/>` +
    Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2; return `<path d="M${f(cx + Math.cos(a) * r * 1.25)} ${f(cy + Math.sin(a) * r * 1.25)}L${f(cx + Math.cos(a) * r * 1.7)} ${f(cy + Math.sin(a) * r * 1.7)}" stroke="${color}" stroke-width="${f(r * .14)}" stroke-linecap="round"/>`; }).join('') +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/><circle cx="${f(cx - r * .3)}" cy="${f(cy - r * .3)}" r="${f(r * .35)}" fill="#ffffff" opacity=".35"/>`;

  const LABEL_STYLES = ['key', 'tag', 'title', 'pointer'];
  const css = `
    .piece-label { font:700 38px/1.5 var(--vc-font); color:var(--ink) }
    .label-key .piece-label { padding:6px 22px 6px 52px; border-radius:999px; background:#ffffffee; box-shadow:0 6px 16px #1c254024; position:relative }
    .label-key .piece-label::before { content:""; position:absolute; left:16px; top:50%; width:24px; height:24px; margin-top:-12px; border-radius:50%; background:var(--label-accent, var(--ink)) }
    .label-tag .piece-label { padding:6px 22px; border-radius:16px; color:#ffffff; background:var(--label-accent, var(--ink)) }
    .label-title .piece-label { font:800 52px/1.4 var(--vc-font); color:var(--label-accent, var(--ink)) }
    .label-pointer .piece-label { padding:2px 4px 8px; border-bottom:5px solid var(--label-accent, var(--ink)) }
  `;

  // ---------- transition: magnify — zoom into a point, then the next shot opens inside a growing lens ----------
  const setup = (stage) => {
    const ring = document.createElement('div');
    ring.className = 'fs-lens';
    stage.append(ring);
    return {ring};
  };
  const magnify = ({tr, k, before, stage, camera, overlays}) => {
    const ring = overlays?.ring;
    if (!tr) { camera.style.scale = ''; camera.style.transformOrigin = ''; if (ring) ring.style.visibility = 'hidden'; return; }
    const W = stage.clientWidth, H = stage.clientHeight, ref = Math.hypot(W, H) / Math.SQRT2;
    camera.style.transformOrigin = `${tr.x * 100}% ${tr.y * 100}%`;
    let r;
    if (before) { camera.style.scale = String(1 + tr.zoom * k); r = .06 + .16 * k; }
    else { camera.style.scale = ''; r = .22 + (1 - k) * 1.3; camera.style.clipPath = `circle(${(r * 100).toFixed(2)}% at ${tr.x * 100}% ${tr.y * 100}%)`; }
    const px = r * ref;
    Object.assign(ring.style, {visibility: 'visible', left: `${(tr.x * W - px).toFixed(1)}px`, top: `${(tr.y * H - px).toFixed(1)}px`,
      width: `${(2 * px).toFixed(1)}px`, height: `${(2 * px).toFixed(1)}px`, opacity: String((before ? k : k).toFixed(3))});
  };
  globalThis.vcShotStyle = {labelStyles: LABEL_STYLES, setup,
    transitions: {magnify: {defaults: {lead: .5, tail: .45, x: .5, y: .5, zoom: 1.6}, needsSymbol: false, render: magnify}}};

  // ---------- motion helpers (bound to ctx; `at` is seconds or a resolved-plan cue id) ----------
  function motion(ctx) {
    const {key, N, track, show, showHide, stroke} = ctx.motion;
    const when = (at, id) => typeof at === 'string' ? ctx.motion.speechCue(at, id) : num(at, 'time');
    return {
      when,
      // Organic growth from its own centre with a soft overshoot (cells dividing, leaves unfolding).
      grow: (id, at, dur = .55) => { const t = when(at, id); track(id, [key(t, [0, 0, 0, .2, 0]), key(t + dur * .7, [0, 0, 0, 1.06, 1], 'out'), key(t + dur, N, 'smooth')]); return t; },
      // A flow that starts at `at` and keeps moving until `until` (seconds), dots marching along its path.
      flow: (id, at, until, dur = .3) => { const t = when(at, id); show(id, t, [0, 0, 0, 1, 0], dur); stroke(id, [key(t, [0]), key(num(until, 'until'), [1], 'linear')]); return t; },
      // Emit: an object leaves its origin along [dx, dy] while fading in, then holds (products leaving a reaction).
      emit: (id, at, [dx, dy], dur = .8) => { const t = when(at, id); track(id, [key(t, [0, 0, 0, .5, 0]), key(t + dur * .3, [dx * .3, dy * .3, 0, 1, 1], 'out'), key(t + dur, [dx, dy, 0, 1, 1], 'smooth')]); return t; },
      // Transformation: `from` shrinks away while `to` grows in its place (reactants → products, state changes).
      morph: (from, to, at, dur = .6) => {
        const t = when(at, to);
        track(from, [key(t - .01, N), key(t + dur * .6, [0, 0, 0, .3, 0], 'in')]);
        track(to, [key(t, [0, 0, 0, .3, 0]), key(t + dur, [0, 0, 0, 1.04, 1], 'out'), key(t + dur + .2, N)]);
        return t;
      },
      label: (id, at, off) => { const t = when(at, id); off === undefined ? show(id, t, [0, .012, 0, .94, 0], .3) : showHide(id, t, [0, .012, 0, .94, 0], when(off), .25); return t; },
      planCamera: (shotId, views) => {
        const shot = ctx.plan?.shots.find(s => s.id === shotId) ?? fail(`planCamera: shot ${shotId} is not in the resolved plan (--plan)`);
        const moments = shot.camera ?? [];
        if (!Array.isArray(views) || views.length !== moments.length) fail(`planCamera: shot ${shotId} has ${moments.length} planned camera keys; give exactly one view for each`);
        const keys = moments.map((m, i) => key(m.seconds, views[i].slice(0, 3), views[i][3] ?? 'smooth'));
        return !keys.length || keys[0][0] > shot.start.seconds + 1e-9 ? [key(shot.start.seconds, keys[0]?.[1] ?? [0, 0, 1]), ...keys] : keys;
      },
    };
  }

  globalThis.fsKit = {art: {organic, ball, molecule, particles, flow, section, rays, tone}, HUES, css, LABEL_STYLES, motion};
})();
