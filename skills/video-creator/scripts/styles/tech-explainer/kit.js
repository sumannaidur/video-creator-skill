// Tech Explainer kit (browser script, loaded after engine.js by backend.mjs): optional artistic primitives and motion
// helpers for this style only. They produce markup, keyframes and options for the topic's own composition and never
// choose a scene, layout, object, metaphor or time. Available to topic modules as globalThis.techKit.
(() => {
  const {f} = globalThis.techShotArt;
  const fail = m => { throw new Error('techKit: ' + m); };
  const num = (x, what) => (typeof x === 'number' && Number.isFinite(x)) ? x : fail(`${what} must be a number`);
  const INK = '#13203a';

  // ---------- isometric construction (30°): x to the lower right, y to the lower left, z up ----------
  const C = Math.cos(Math.PI / 6), S = .5;
  const iso = (o, x, y, z = 0) => [o[0] + (x - y) * C, o[1] + (x + y) * S - z];
  const poly = pts => 'M' + pts.map(p => p.map(f).join(' ')).join('L') + 'Z';
  const edge = (w = 1.6) => `stroke="${INK}" stroke-opacity=".32" stroke-width="${w}" stroke-linejoin="round"`;
  // A solid block: lit top, mid left face, shaded right face, thin edge lines (no heavy outlines).
  const isoBox = (o, {x = 0, y = 0, z = 0, w, d, h, top = '#ffffff', left = '#dfe5ee', right = '#c3ccd9', r = 0} = {}) => {
    const p = (a, b, c) => iso(o, a, b, c);
    const T = [p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)];
    const L = [p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x, y + d, z)];
    const R = [p(x + w, y, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x + w, y, z)];
    return `<path d="${poly(L)}" fill="${left}" ${edge()}/><path d="${poly(R)}" fill="${right}" ${edge()}/><path d="${poly(T)}" fill="${top}" ${edge()}/>` +
      (r ? `<path d="M${f(T[0][0])} ${f(T[0][1])}L${f(T[1][0])} ${f(T[1][1])}" stroke="#ffffff" stroke-width="${r}" stroke-opacity=".8" stroke-linecap="round"/>` : '');
  };
  // A fine isometric floor grid (major and minor lines), fading towards the edges.
  const isoGrid = (o, {size = 600, step = 50, color = '#9aa7ba', opacity = .35} = {}) => {
    let d = '';
    for (let i = -size; i <= size; i += step) {
      const a = iso(o, i, -size), b = iso(o, i, size), c = iso(o, -size, i), e = iso(o, size, i);
      d += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}M${f(c[0])} ${f(c[1])}L${f(e[0])} ${f(e[1])}`;
    }
    return `<path d="${d}" stroke="${color}" stroke-width="1.2" opacity="${opacity}" fill="none"/>`;
  };
  // A cylinder (servers, capacitors, coins, towers) from an elliptical top and a shaded body.
  const isoCylinder = (o, {x = 0, y = 0, z = 0, r, h, top = '#ffffff', side = '#cdd5e0', band = null} = {}) => {
    const [cx, cy] = iso(o, x, y, z), rx = r * C * 1.15, ry = r * S * 1.15;
    return `<path d="M${f(cx - rx)} ${f(cy)}V${f(cy - h)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(cy - h)}V${f(cy)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(cy)}Z" fill="${side}" ${edge()}/>` +
      (band ? `<path d="M${f(cx - rx)} ${f(cy - h * .35)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(cy - h * .35)}" fill="none" stroke="${band}" stroke-width="${f(h * .08)}"/>` : '') +
      `<ellipse cx="${f(cx)}" cy="${f(cy - h)}" rx="${f(rx)}" ry="${f(ry)}" fill="${top}" ${edge()}/>`;
  };
  // A trace that can draw itself: pathLength=1 + stroke-dash driven by the --draw channel (motion.trace / ctx.motion.stroke).
  // `under` keeps a faint always-visible groove so the route reads before the signal arrives.
  const trace = (pts, {color = '#2e6bff', width = 6, under = '#c7cfdb', round = 14} = {}) => {
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
      if (!c || !round) { d += `L${f(b[0])} ${f(b[1])}`; continue; }
      const k1 = Math.min(round / Math.hypot(b[0] - a[0], b[1] - a[1]), .5), k2 = Math.min(round / Math.hypot(c[0] - b[0], c[1] - b[1]), .5);
      d += `L${f(b[0] - (b[0] - a[0]) * k1)} ${f(b[1] - (b[1] - a[1]) * k1)}Q${f(b[0])} ${f(b[1])} ${f(b[0] + (c[0] - b[0]) * k2)} ${f(b[1] + (c[1] - b[1]) * k2)}`;
    }
    return (under ? `<path d="${d}" fill="none" stroke="${under}" stroke-width="${width + 4}" stroke-linecap="round" stroke-linejoin="round"/>` : '') +
      `<path d="${d}" pathLength="1" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))"/>`;
  };
  // A data packet: a rounded capsule with a specular highlight (a unit of information in transit).
  const packet = (w = 90, h = 44, color = '#2e6bff') => `<rect x="2" y="2" width="${w}" height="${h}" rx="${h / 2}" fill="${color}"/>` +
    `<rect x="${f(h * .35)}" y="${f(h * .22)}" width="${f(w * .45)}" height="${f(h * .18)}" rx="${f(h * .09)}" fill="#ffffff" opacity=".55"/>`;
  // Emissive accent whose strength follows the --glow channel.
  const glowDot = (cx, cy, r, color = '#2e6bff') => `<circle cx="${cx}" cy="${cy}" r="${r * 2.6}" fill="${color}" opacity=".18" filter="url(#tk-bloom)" style="opacity:calc(.22 * var(--glow, 1))"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/><circle cx="${f(cx - r * .3)}" cy="${f(cy - r * .3)}" r="${f(r * .3)}" fill="#ffffff" opacity=".7"/>`;
  // A device panel (phone, monitor, dashboard surface) with bezel, glass sheen and content slot.
  const device = (w, h, {bezel = 18, r = 34, body = '#1b2740', glass = '#0f1a2e', content = ''} = {}) =>
    `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="${body}"/><rect x="${bezel}" y="${bezel}" width="${w - 2 * bezel}" height="${h - 2 * bezel}" rx="${Math.max(4, r - bezel)}" fill="${glass}"/>` +
    `<g transform="translate(${bezel} ${bezel})">${content}</g>` +
    `<path d="M${bezel} ${bezel + 2}L${f(w * .62)} ${bezel + 2}L${f(w * .32)} ${f(h * .55)}L${bezel} ${f(h * .55)}Z" fill="#ffffff" opacity=".05"/>`;
  // Seamless studio sweep: wall gradient into a floor with a soft horizon and a faint dot grid. Fills a w×h plate.
  const studio = (w, h, {floor = .58, wall = ['#f6f8fb', '#e7ecf2'], ground = ['#e3e8ef', '#d3dae4'], dots = '#aab5c6', id = 'tk-studio'} = {}) => {
    const y = h * floor;
    let grid = '';
    for (let j = 0; j < 9; j++) {
      const yy = y + (h - y) * (j / 9) ** 1.6 + 8, n = 18;
      for (let i = 0; i <= n; i++) grid += `<circle cx="${f(w / 2 + (i - n / 2) * (w / n) * (1 + j * .18))}" cy="${f(yy)}" r="${f(1.4 + j * .25)}"/>`;
    }
    return `<defs><linearGradient id="${id}-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall[0]}"/><stop offset="1" stop-color="${wall[1]}"/></linearGradient>` +
      `<linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ground[0]}"/><stop offset="1" stop-color="${ground[1]}"/></linearGradient>` +
      `<radialGradient id="${id}-l" cx=".3" cy=".1" r=".8"><stop offset="0" stop-color="#ffffff" stop-opacity=".7"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#${id}-w)"/><rect y="${f(y)}" width="${w}" height="${f(h - y)}" fill="url(#${id}-g)"/>` +
      `<rect y="${f(y - 30)}" width="${w}" height="60" fill="#ffffff" opacity=".35" filter="url(#tk-soft)"/>` +
      `<g fill="${dots}" opacity=".45">${grid}</g><rect width="${w}" height="${h}" fill="url(#${id}-l)"/>`;
  };
  // Soft contact shadow under an object (ambient occlusion on the floor).
  const contact = (cx, cy, rx, ry, opacity = .22) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${INK}" opacity="${opacity}" filter="url(#tk-soft)"/>`;
  // Annotation leader: a thin line ending in a ring, for callout labels.
  const leader = (pts, {color = '#4a5872', width = 2.5} = {}) => `<path d="M${pts.map(p => p.map(f).join(' ')).join('L')}" fill="none" stroke="${color}" stroke-width="${width}"/>` +
    `<circle cx="${f(pts[0][0])}" cy="${f(pts[0][1])}" r="7" fill="#ffffff" stroke="${color}" stroke-width="${width}"/>`;

  // ---------- P018.3 richness (optional): product-studio lighting, materials, translucency, emissive light ----------
  // Reference characteristics (P018.1 audit, 3D Explainer / X-Ray / Exploded View): a dark graded studio with a key-light
  // pool and vignette, solid objects with lit/shaded faces and specular rims, brushed metal, translucent shells that show
  // the mechanism inside, emissive parts with soft halos and light beams. Gradients instead of blur filters where possible
  // (cheaper per frame). Nothing is applied automatically.
  const hex = c => { const v = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16)); };
  const mix = (a, b, t) => '#' + hex(a).map((x, i) => Math.round(x + (hex(b)[i] - x) * t).toString(16).padStart(2, '0')).join('');
  // Dark studio plate: graded back wall, floor, a key-light pool on the floor at `pool` (fractions), soft horizon, vignette.
  const darkStudio = (w, h, {id, floor = .62, wall = ['#1d2638', '#0c111b'], ground = ['#141b28', '#070a10'], pool = [.5, .72], poolColor = '#7fa6e0', poolStrength = .32} = {}) => {
    if (!id) fail('darkStudio needs a unique id');
    const y = h * floor;
    return `<defs><linearGradient id="${id}-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall[0]}"/><stop offset="1" stop-color="${wall[1]}"/></linearGradient>` +
      `<linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ground[0]}"/><stop offset="1" stop-color="${ground[1]}"/></linearGradient>` +
      `<radialGradient id="${id}-p" cx="${pool[0]}" cy="${pool[1]}" r=".42" gradientTransform="translate(${pool[0]} ${pool[1]}) scale(1 .45) translate(${-pool[0]} ${-pool[1]})">` +
      `<stop offset="0" stop-color="${poolColor}" stop-opacity="${poolStrength}"/><stop offset="1" stop-color="${poolColor}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="${id}-k" cx=".5" cy="-.05" r=".75"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".22"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="${id}-v" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".55"/></radialGradient>` +
      `<linearGradient id="${id}-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb8e0" stop-opacity="0"/><stop offset=".5" stop-color="#9fb8e0" stop-opacity=".16"/><stop offset="1" stop-color="#9fb8e0" stop-opacity="0"/></linearGradient></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#${id}-w)"/><rect y="${f(y)}" width="${w}" height="${f(h - y)}" fill="url(#${id}-g)"/>` +
      `<rect y="${f(y - 40)}" width="${w}" height="80" fill="url(#${id}-hz)"/><rect width="${w}" height="${h}" fill="url(#${id}-p)"/>` +
      `<rect width="${w}" height="${h}" fill="url(#${id}-k)"/><rect width="${w}" height="${h}" fill="url(#${id}-v)"/>`;
  };
  // A lit solid: isoBox faces from one base colour (key light from the upper left: top lightest, right face darkest), a
  // sheen gradient on the top, optional brushed texture, and specular rims on the edges facing the light.
  const litBox = (o, spec, {base = '#8a96a8', id, metal = false, texture = null, rim = .85} = {}) => {
    if (!id) fail('litBox needs a unique id');
    const {x = 0, y = 0, z = 0, w, d, h} = spec, p = (a, b, c) => iso(o, a, b, c);
    const T = [p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)];
    const L = [p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x, y + d, z)];
    const R = [p(x + w, y, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x + w, y, z)];
    const top = mix(base, '#ffffff', metal ? .45 : .35), left = mix(base, '#ffffff', .08), right = mix(base, '#000000', metal ? .45 : .32);
    const line = (a, b, op, wd) => `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="#ffffff" stroke-opacity="${op}" stroke-width="${wd}" stroke-linecap="round"/>`;
    return `<defs><linearGradient id="${id}-s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="${metal ? .5 : .3}"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/>` +
      `<stop offset=".8" stop-color="#ffffff" stop-opacity="${metal ? .18 : 0}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${left}"/><stop offset="1" stop-color="${mix(left, '#000000', .25)}"/></linearGradient>` +
      `<linearGradient id="${id}-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${right}"/><stop offset="1" stop-color="${mix(right, '#000000', .3)}"/></linearGradient></defs>` +
      `<path d="${poly(L)}" fill="url(#${id}-l)"/><path d="${poly(R)}" fill="url(#${id}-r)"/><path d="${poly(T)}" fill="${top}"/><path d="${poly(T)}" fill="url(#${id}-s)"/>` +
      (texture ? `<path d="${poly(L)}" fill="url(#${texture})"/><path d="${poly(R)}" fill="url(#${texture})"/><path d="${poly(T)}" fill="url(#${texture})"/>` : '') +
      (rim ? line(T[3], T[2], rim, 2.4) + line(T[2], T[1], rim * .55, 2) + line(T[2], L[2], rim * .45, 1.6) : '');
  };
  // A translucent shell (X-ray / cutaway housing): back edges dim, tinted faces, bright front edges with a fresnel rim.
  // Draw the mechanism between `glassBack` and `glassFront` so it reads as inside.
  const glassFaces = (o, {x = 0, y = 0, z = 0, w, d, h}) => {
    const p = (a, b, c) => iso(o, a, b, c);
    return {T: [p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)], B: [p(x, y, z), p(x + w, y, z), p(x + w, y + d, z), p(x, y + d, z)],
      L: [p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x, y + d, z)], R: [p(x + w, y, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x + w, y, z)]};
  };
  const glassBack = (o, spec, {tint = '#7fb7ff'} = {}) => {
    const {T, B} = glassFaces(o, spec);
    return `<path d="M${f(T[0][0])} ${f(T[0][1])}L${f(B[0][0])} ${f(B[0][1])}L${f(B[1][0])} ${f(B[1][1])}M${f(B[0][0])} ${f(B[0][1])}L${f(B[3][0])} ${f(B[3][1])}" fill="none" stroke="${tint}" stroke-opacity=".35" stroke-width="1.6"/>` +
      `<path d="${poly(B)}" fill="${tint}" opacity=".07"/>`;
  };
  const glassFront = (o, spec, {tint = '#7fb7ff', opacity = .14} = {}) => {
    const {T, L, R} = glassFaces(o, spec);
    const e = `fill="none" stroke="#e6f1ff" stroke-linejoin="round"`;
    return `<path d="${poly(L)}" fill="${tint}" opacity="${opacity}"/><path d="${poly(R)}" fill="${tint}" opacity="${f(opacity * 1.4)}"/><path d="${poly(T)}" fill="${tint}" opacity="${f(opacity * .8)}"/>` +
      `<path d="${poly(L)}" ${e} stroke-opacity=".55" stroke-width="2"/><path d="${poly(R)}" ${e} stroke-opacity=".4" stroke-width="2"/><path d="${poly(T)}" ${e} stroke-opacity=".75" stroke-width="2.4"/>`;
  };
  // Soft emissive halo from a radial gradient (no blur filter). `--glow` (motion.pulse) scales it when style uses calc.
  const halo = (cx, cy, r, {id, color = '#4da3ff', strength = .55, channel = false} = {}) => {
    if (!id) fail('halo needs a unique id');
    return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${strength}"/><stop offset=".45" stop-color="${color}" stop-opacity="${f(strength * .35)}"/>` +
      `<stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${id})"${channel ? ' style="opacity:var(--glow, 1)"' : ''}/>`;
  };
  // Volumetric beam: a widening quad from (x1,y1) to (x2,y2), fading along its length.
  const beam = ([x1, y1], [x2, y2], w1, w2, {id, color = '#bfe0ff', strength = .35} = {}) => {
    if (!id) fail('beam needs a unique id');
    const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    const pts = [[x1 + c * w1 / 2, y1 + s * w1 / 2], [x2 + c * w2 / 2, y2 + s * w2 / 2], [x2 - c * w2 / 2, y2 - s * w2 / 2], [x1 - c * w1 / 2, y1 - s * w1 / 2]];
    return `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"><stop offset="0" stop-color="${color}" stop-opacity="${strength}"/>` +
      `<stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${poly(pts)}" fill="url(#${id})"/>`;
  };
  // A flat spiral coil lying in the iso floor plane (inductive coils, springs seen from above, speaker voice coils):
  // a dark under-stroke plus a bright metallic top stroke; pathLength=1 so motion.trace can wind it on.
  const isoSpiral = (o, {r0, r1, turns = 6, z = 0, color = '#d9894a', shine = '#ffd1a1', width = 7, steps = 48} = {}) => {
    let d = '';
    const n = Math.round(turns * steps);
    for (let i = 0; i <= n; i++) { const a = i / steps * Math.PI * 2, r = r0 + (r1 - r0) * i / n, pt = iso(o, Math.cos(a) * r, Math.sin(a) * r, z); d += (i ? 'L' : 'M') + pt.map(f).join(' '); }
    return `<path d="${d}" fill="none" stroke="${mix(color, '#000000', .45)}" stroke-width="${width + 3}" stroke-linejoin="round"/>` +
      `<path d="${d}" pathLength="1" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))"/>` +
      `<path d="${d}" fill="none" stroke="${shine}" stroke-width="${f(width * .3)}" stroke-opacity=".55" stroke-linejoin="round" transform="translate(-1 -1.5)"/>`;
  };
  // Baked brushed-metal / speckle textures as <pattern> defs (shared/texture.js).
  const textures = (prefix, {tile = 240, seed = 5} = {}) => {
    const T = globalThis.vcTexture ?? fail('textures need shared/texture.js');
    return `<defs>${T.pattern(`${prefix}-brushed`, T.bake({kind: 'brushed', seed, tint: [255, 255, 255], alpha: [0, .14], contrast: 2}), tile)}` +
      `${T.pattern(`${prefix}-speckle`, T.bake({kind: 'speckle', seed: seed + 1, tint: [0, 0, 0], alpha: [0, .16], contrast: 2.2}), tile * .5)}</defs>`;
  };

  const LABEL_STYLES = ['callout', 'chip', 'readout', 'plain'];
  const css = `
    .label-callout .piece-label { font:650 32px/1.5 var(--vc-font); color:var(--ink); background:#ffffffee; padding:6px 20px 6px 40px;
      border-radius:999px; box-shadow:0 10px 24px #13203a1f, inset 0 0 0 1.5px #c7cfdb; position:relative }
    .label-callout .piece-label::before { content:""; position:absolute; left:16px; top:50%; width:12px; height:12px; margin-top:-6px;
      border-radius:50%; background:var(--label-accent, var(--signal)) }
    .label-chip .piece-label { font:700 32px/1.5 var(--vc-font); color:#ffffff; background:var(--label-accent, var(--signal)); padding:6px 22px;
      border-radius:999px; box-shadow:0 10px 22px #13203a26 }
    .label-readout .piece-label { font:600 34px/1.5 var(--mono); color:var(--label-accent, #7fb0ff); background:#13203a; padding:8px 22px;
      border-radius:12px; box-shadow:0 12px 26px #13203a33; font-variant-numeric:tabular-nums }
    .label-plain .piece-label { font:750 40px/1.45 var(--vc-font); color:var(--label-accent, var(--ink)) }
  `;

  // ---------- motion helpers (bound to ctx; `at` is seconds or a resolved-plan cue id) ----------
  function motion(ctx) {
    const {key, N, track, show, showHide, stroke, glow} = ctx.motion;
    const when = (at, id) => typeof at === 'string' ? ctx.motion.speechCue(at, id) : num(at, 'time');
    return {
      when,
      // Precise entrance: rises a little from below and settles without overshoot (machined, not bouncy).
      rise: (id, at, dist = .025, dur = .5, rest = N) => { const t = when(at, id); track(id, [key(t, [0, dist, 0, .985, 0]), key(t + dur, rest, 'out')]); return t; },
      // Scale-in from a point (screens, nodes powering on).
      power: (id, at, dur = .4) => { const t = when(at, id); track(id, [key(t, [0, 0, 0, .86, 0]), key(t + dur, N, 'out')]); return t; },
      // Draw a trace (paths using pathLength=1) from 0 to 1, optionally retracting later.
      trace: (id, at, dur = .8, off) => {
        const t = when(at, id);
        show(id, t, [0, 0, 0, 1, 0], .05);
        stroke(id, [key(t, [0]), key(t + dur, [1], 'out'), ...(off !== undefined ? [key(when(off), [1]), key(when(off) + .4, [0])] : [])]);
        return t;
      },
      // Emissive pulse on the --glow channel (indicator lights, active nodes).
      pulse: (id, at, hold = 1, rise = .25, fall = .5) => { const t = when(at, id); glow(id, [key(t, [0]), key(t + rise, [1], 'out'), key(t + rise + hold, [1]), key(t + rise + hold + fall, [.25])]); return t; },
      // Labels fade up into place (and optionally leave).
      label: (id, at, off) => { const t = when(at, id); off === undefined ? show(id, t, [0, .01, 0, .96, 0], .3) : showHide(id, t, [0, .01, 0, .96, 0], when(off), .25); return t; },
      // Travel through stage-fraction offsets [[dx,dy], ...] relative to the object's base position over [t, t+dur],
      // at constant speed along the polyline (packets moving along a route).
      travel: (id, at, dur, pts, {fadeIn = .12, fadeOut = .15} = {}) => {
        const t = when(at, id), seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), total = seg.reduce((a, b) => a + b, 0) || 1;
        let acc = 0;
        const keys = [key(t - .001, [pts[0][0], pts[0][1], 0, 1, 0], 'linear'), key(t + fadeIn * dur, [...pts[0], 0, 1, 1], 'linear')];
        pts.forEach((p, i) => { if (i) { acc += seg[i - 1]; keys.push(key(t + fadeIn * dur + (1 - fadeIn - fadeOut) * dur * acc / total, [p[0], p[1], 0, 1, 1], 'linear')); } });
        keys.push(key(t + dur, [...pts.at(-1), 0, 1, 0], 'linear'));
        track(id, keys); return t;
      },
      // Camera keys at the resolved plan's camera moments (one [cx,cy,zoom,ease?] per moment).
      planCamera: (shotId, views) => {
        const shot = ctx.plan?.shots.find(s => s.id === shotId) ?? fail(`planCamera: shot ${shotId} is not in the resolved plan (--plan)`);
        const moments = shot.camera ?? [];
        if (!Array.isArray(views) || views.length !== moments.length) fail(`planCamera: shot ${shotId} has ${moments.length} planned camera keys; give exactly one view for each`);
        const keys = moments.map((m, i) => key(m.seconds, views[i].slice(0, 3), views[i][3] ?? 'smooth'));
        return !keys.length || keys[0][0] > shot.start.seconds + 1e-9 ? [key(shot.start.seconds, keys[0]?.[1] ?? [0, 0, 1]), ...keys] : keys;
      },
      // P018.3: continuous camera travel through a shot. views: [[t, cx, cy, zoom, ease?], ...] (t in seconds or a cue id).
      cameraTravel: (shotId, views) => {
        const s = ctx.shot(shotId), ks = views.map(([t, cx, cy, z, e]) => key(when(t), [cx, cy, z], e ?? 'smooth'));
        return [key(s.start, ks[0][1]), ...ks.filter(k => k[0] > s.start + 1e-6 && k[0] < s.end - 1e-6), key(s.end, ks.at(-1)[1], 'linear')];
      },
      // Exploded view: parts separate along their own offsets [dx, dy] (stage fractions) and stay apart; optional regroup.
      explode: (parts, at, {dur = .7, stagger = .06, back} = {}) => {
        const t = when(at, parts[0][0]);
        parts.forEach(([id, [dx, dy]], i) => {
          const a = t + i * stagger;
          track(id, [key(a, N), key(a + dur, [dx, dy, 0, 1, 1], 'out'), ...(back !== undefined ? [key(when(back), [dx, dy, 0, 1, 1]), key(when(back) + dur, N, 'smooth')] : [])]);
        });
        return t;
      },
    };
  }

  // P023.6 raster layer: a pre-rendered image (for example a static Blender product layer) as symbol markup that fills the
  // symbol's view box exactly. href is a data: URI carried by the topic (verified, original artwork only). Render the
  // layers with an orthographic camera when the engine must rotate parts in 2D (rotations then stay physically exact).
  const raster = (href, w, h) => `<image href="${href}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`;
  globalThis.techKit = {art: {raster, iso, isoBox, isoGrid, isoCylinder, trace, packet, glowDot, device, studio, contact, leader, poly,
    mix, darkStudio, litBox, glassBack, glassFront, halo, beam, isoSpiral, textures}, css, LABEL_STYLES, motion};
})();
