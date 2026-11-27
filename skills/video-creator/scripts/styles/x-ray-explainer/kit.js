// X-Ray Explainer kit (browser script, loaded after the shared shot core by backend.mjs). Style implementation #7 (P017.6).
// Opaque shells that an X-ray window sees through, glass shells, hatched section planes, inspection brackets, technical
// materials with selective illumination, and mechanically consistent parts (gears from module × teeth, meshing spins in
// the true ratio). Registers the `sweep` transition (a scanner beam) via globalThis.vcShotStyle.
// Everything here is ILLUSTRATIVE: it imitates no medical or industrial imaging modality, and every video using it must
// show the `disclaimer` label (see the style reference).
(() => {
  const {f} = globalThis.techShotArt;
  const fail = m => { throw new Error('xrayKit: ' + m); };
  const num = (x, what) => (typeof x === 'number' && Number.isFinite(x)) ? x : fail(`${what} must be a number`);
  const C = {field: '#08151d', glass: '#7fd8ff', glassFill: '#7fd8ff14', steel: '#8c9aa6', brass: '#c9a24b', copper: '#c46a3c', cut: '#ffb547', ink: '#e9f6ff', dim: '#4d6573'};

  // Rounded-rectangle path (housings, casings).
  const rounded = (x, y, w, h, r) => `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
  // Machined metal: a vertical gradient, a top highlight and a thin dark edge. `id` must be unique in the topic.
  const metal = (d, id, base = C.steel) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/>` +
    `<stop offset=".18" stop-color="${base}"/><stop offset="1" stop-color="#1c2a33"/></linearGradient></defs><path d="${d}" fill="${base}"/><path d="${d}" fill="url(#${id})"/>` +
    `<path d="${d}" fill="none" stroke="#0b141a" stroke-width="3"/>`;
  // Glass shell: almost-clear fill with a bright rim (the X-ray look of a casing).
  const glass = (d, {rim = C.glass, width = 4} = {}) => `<path d="${d}" fill="${C.glassFill}"/><path d="${d}" fill="none" stroke="${rim}" stroke-width="${width}" stroke-opacity=".9"/>` +
    `<path d="${d}" fill="none" stroke="${rim}" stroke-width="${width * 4}" stroke-opacity=".08"/>`;
  // Section plane: the cut face of a part, hatched in the cut colour (even-odd, so an outer path plus an inner path
  // hatches only the wall between them). `id` must be unique in the topic.
  const section = (d, id, {color = C.cut, gap = 12} = {}) => `<defs><pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="${gap}" height="${gap}" fill="${color}22"/><path d="M0 0V${gap}" stroke="${color}" stroke-width="3"/></pattern></defs><path d="${d}" fill="url(#${id})" fill-rule="evenodd" stroke="${color}" stroke-width="3"/>`;
  // (Centred art such as gears and brackets must be wrapped in a translate inside a zero-origin symbol view box:
  // the engine's <use> places a symbol's viewport at 0,0.)
  // Involute-free spur gear outline centred at (0, 0): pitch radius = module × teeth / 2 (so meshing pairs at
  // centre distance m(z1 + z2)/2 are dimensionally consistent). Returns {body, r, outer}.
  const gear = (z, m, {fill = C.brass, id = 'g' + z, hub = .28, holes = 4} = {}) => {
    if (!Number.isInteger(z) || z < 6) fail('gear teeth must be an integer ≥ 6');
    const r = m * z / 2, ra = r + m, rf = r - 1.25 * m, pts = [];
    for (let i = 0; i < z; i++) {
      const a = i / z * Math.PI * 2, s = Math.PI / z;
      for (const [rr, da] of [[rf, -s * .55], [ra, -s * .28], [ra, s * .28], [rf, s * .55]]) pts.push([Math.cos(a + da) * rr, Math.sin(a + da) * rr]);
    }
    const d = 'M' + pts.map(p => p.map(f).join(' ')).join('L') + 'Z';
    const body = metal(d, id, fill) + `<circle r="${f(r * hub)}" fill="#14202a" stroke="${C.glass}" stroke-opacity=".6" stroke-width="3"/>` +
      Array.from({length: holes}, (_, i) => { const a = i / holes * Math.PI * 2 + .4; return `<circle cx="${f(Math.cos(a) * r * .58)}" cy="${f(Math.sin(a) * r * .58)}" r="${f(r * .12)}" fill="#14202a"/>`; }).join('') +
      `<path d="M${f(r * .72)} 0H${f(rf)}" stroke="#ffffff" stroke-opacity=".5" stroke-width="3"/>`;
    return {body, r, outer: ra};
  };
  // ---------- P023.7 chain drives (mechanically exact; centred art in zero-origin view boxes as above) ----------
  // Sprocket for a roller chain of pitch p: pitch radius r = p / (2 sin(π/z)); teeth sit between roller seats.
  // `phase` (radians) puts a roller seat (tooth gap) at that angle. Returns {body, r}.
  const sprocket = (z, p, {fill = C.steel, id = 'sp' + z, phase = -Math.PI / 2, holes = 5, roller = .32} = {}) => {
    if (!Number.isInteger(z) || z < 8) fail('sprocket teeth must be an integer ≥ 8');
    const r = p / (2 * Math.sin(Math.PI / z)), rr = p * roller, ra = r + p * .32, rf = r - rr, pts = [];
    for (let i = 0; i < z; i++) {
      const a = phase + (i + .5) / z * Math.PI * 2, s = Math.PI / z;      // tooth centred between two seats
      for (const [rad, da] of [[rf, -s * .78], [ra * .97, -s * .22], [ra, 0], [ra * .97, s * .22], [rf, s * .78]]) pts.push([Math.cos(a + da) * rad, Math.sin(a + da) * rad]);
    }
    const d = 'M' + pts.map(q => q.map(f).join(' ')).join('L') + 'Z';
    const body = metal(d, id, fill) + `<circle r="${f(r * .3)}" fill="#14202a" stroke="${C.glass}" stroke-opacity=".6" stroke-width="3"/>` +
      Array.from({length: holes}, (_, i) => { const a = i / holes * Math.PI * 2; return `<path d="M${f(Math.cos(a - .32) * r * .42)} ${f(Math.sin(a - .32) * r * .42)}L${f(Math.cos(a - .2) * r * .78)} ${f(Math.sin(a - .2) * r * .78)}A${f(r * .78)} ${f(r * .78)} 0 0 1 ${f(Math.cos(a + .2) * r * .78)} ${f(Math.sin(a + .2) * r * .78)}L${f(Math.cos(a + .32) * r * .42)} ${f(Math.sin(a + .32) * r * .42)}Z" fill="#14202a" opacity=".9"/>`; }).join('');
    return {body, r};
  };
  // Open chain loop around two sprockets (c1 = driver, c2 = driven; both turn clockwise in screen space). The centre
  // distance along c1 → c2 is adjusted (bisection, ≤ ±p/2) so the loop is a whole number of links: a real chain.
  // Returns {d, length, links, c2, run, markup(offsetVar, travel)}: rollers and plates move along the path by stroke-dashoffset;
  // the engine clamps --draw to [0, 1], so pass the total travel (art units) and drive --draw 0 → 1 (chainDrive does).
  const chainLoop = ([x1, y1], r1, [x2, y2], r2, p, {plate = '#9aa8b4', roller = '#dfe8ee'} = {}) => {
    const geo = d => { const ux = (x2 - x1) / Math.hypot(x2 - x1, y2 - y1), uy = (y2 - y1) / Math.hypot(x2 - x1, y2 - y1), c2 = [x1 + ux * d, y1 + uy * d];
      const sphi = (r1 - r2) / d, cphi = Math.sqrt(1 - sphi * sphi), nx = -uy, ny = ux;            // n: left of c1 → c2 (screen "up" when c2 is to the left)
      const m = s => [s * nx * cphi + ux * sphi * -1, s * ny * cphi + uy * sphi * -1];               // outward normals of the two runs
      const [mt, mb] = [m(-1), m(1)], T1t = [x1 + r1 * mt[0], y1 + r1 * mt[1]], T2t = [c2[0] + r2 * mt[0], c2[1] + r2 * mt[1]], T1b = [x1 + r1 * mb[0], y1 + r1 * mb[1]], T2b = [c2[0] + r2 * mb[0], c2[1] + r2 * mb[1]];
      const phi = Math.asin(sphi), run = d * cphi, length = 2 * run + r1 * (Math.PI + 2 * phi) + r2 * (Math.PI - 2 * phi);
      return {c2, T1t, T2t, T1b, T2b, phi, run, length}; };
    const base = Math.hypot(x2 - x1, y2 - y1), raw = geo(base).length / p, n = 2 * Math.round(raw / 2);   // even link count (no half-link)
    let lo = base - 2 * p, hi = base + 2 * p;
    for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; (geo(mid).length < n * p) ? lo = mid : hi = mid; }
    const g = geo((lo + hi) / 2);
    // path in the chain's direction of travel for clockwise sprockets: top run c2 → c1, around c1, bottom run c1 → c2, around c2
    const P = q => q.map(f).join(' ');
    const d = `M${P(g.T2t)}L${P(g.T1t)}A${f(r1)} ${f(r1)} 0 1 1 ${P(g.T1b)}L${P(g.T2b)}A${f(r2)} ${f(r2)} 0 0 1 ${P(g.T2t)}`;
    const markup = (offsetVar = '--draw', travel = 1) => `<path d="${d}" fill="none" stroke="#0b141a" stroke-width="${f(p * .78)}" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${plate}" stroke-width="${f(p * .62)}" stroke-dasharray="${f(p * .72)} ${f(p * .28)}" style="stroke-dashoffset:calc(var(${offsetVar}, 0) * ${-travel}px)"/>` +
      `<path d="${d}" fill="none" stroke="${roller}" stroke-width="${f(p * .42)}" stroke-linecap="round" stroke-dasharray="0 ${f(p)}" style="stroke-dashoffset:calc(var(${offsetVar}, 0) * ${-travel}px - ${f(p * .86)}px)"/>`;
    return {d, length: g.length, links: n, c2: g.c2, run: g.run, phi: g.phi, markup};
  };

  // Inspection brackets around a w×h box centred at (0, 0) (four corners, no full frame).
  const brackets = (w, h, {color = C.glass, len = .22, width = 5} = {}) => {
    const x = w / 2, y = h / 2, lx = w * len, ly = h * len;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => `<path d="M${f(sx * x)} ${f(sy * (y - ly))}V${f(sy * y)}H${f(sx * (x - lx))}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="square"/>`).join('');
  };
  // Dashed alignment / axis line (exploded views, shafts).
  const axis = (x0, y0, x1, y1, {color = C.glass} = {}) => `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${color}" stroke-opacity=".7" stroke-width="3" stroke-dasharray="18 10 4 10"/>`;
  // Light table field: deep field with a soft central illumination and a fine reference grid.
  const field = (w, h, {grid = 60} = {}) => `<defs><radialGradient id="xr-light" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#14323f"/><stop offset="1" stop-color="${C.field}"/></radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#xr-light)"/><g stroke="${C.glass}" stroke-opacity=".06" stroke-width="1.5">` +
    Array.from({length: Math.ceil(w / grid) + 1}, (_, i) => `<path d="M${i * grid} 0V${h}"/>`).join('') + Array.from({length: Math.ceil(h / grid) + 1}, (_, i) => `<path d="M0 ${i * grid}H${w}"/>`).join('') + `</g>`;

  // X-ray window CSS for an opaque object: a hole whose centre travels from (x0, y0) to (x1, y1) (% of the object's box) as
  // the object's --draw goes 0 → 1, and whose radius opens over the first part of the travel. Returns CSS for topic.css.
  const windowCss = (id, {x0, y0, x1, y1, r}) => `#${id} .piece-art { -webkit-mask-image: radial-gradient(circle calc(${num(r, 'r')}px * min(1, var(--draw, 0) * 6)) at calc(${x0}% + ${x1 - x0}% * var(--draw, 0)) calc(${y0}% + ${y1 - y0}% * var(--draw, 0)), transparent 97%, #000 100%);
      mask-image: radial-gradient(circle calc(${r}px * min(1, var(--draw, 0) * 6)) at calc(${x0}% + ${x1 - x0}% * var(--draw, 0)) calc(${y0}% + ${y1 - y0}% * var(--draw, 0)), transparent 97%, #000 100%) }`;
  // Selective illumination: dimmed until lit through the --glow channel.
  const litCss = id => `#${id} .piece-art { filter: brightness(calc(.42 + var(--glow, 0) * .78)) saturate(calc(.5 + var(--glow, 0) * .6)) }`;

  const LABEL_STYLES = ['callout', 'spec', 'amber', 'disclaimer'];
  const css = `
    .piece-label { font:650 34px/1.5 var(--vc-font); color:${C.ink} }
    .label-callout .piece-label { padding:6px 20px; border:3px solid var(--label-accent, ${C.glass}); border-radius:6px; background:#08151dcc; box-shadow:0 0 22px #7fd8ff33 }
    .label-spec .piece-label { font:600 28px/1.5 var(--vc-font); color:var(--label-accent, ${C.glass}); padding:2px 10px; border-left:4px solid var(--label-accent, ${C.glass}); background:#08151daa }
    .label-amber .piece-label { padding:6px 20px; border-radius:6px; color:#1b1206; background:var(--label-accent, ${C.cut}) }
    .label-disclaimer .piece-label { font:500 22px/1.5 var(--vc-font); color:#9fb6c3; font-style:italic }
  `;

  // ---------- transition: sweep — a scanner beam passes down the frame; the next shot is revealed behind it ----------
  const setup = (stage) => {
    const o = document.createElement('div');
    o.className = 'xr-sweep';
    o.innerHTML = '<div class="xr-cover"></div><div class="xr-beam"></div>';
    stage.append(o);
    return {sweep: o};
  };
  const sweep = ({tr, k, before, overlays}) => {
    const o = overlays?.sweep;
    if (!o) return;
    if (!tr) { o.style.visibility = 'hidden'; return; }
    o.style.visibility = 'visible';
    const [cover, beam] = o.children;
    // before the cut the beam descends and darkens what it has passed; after it, it keeps descending and uncovers the next shot
    const y = before ? k * 100 : (1 - k) * 100;
    Object.assign(cover.style, before ? {top: '0%', height: `${y.toFixed(2)}%`} : {top: `${y.toFixed(2)}%`, height: `${(100 - y).toFixed(2)}%`});
    beam.style.top = `${y.toFixed(2)}%`;
  };
  globalThis.vcShotStyle = {labelStyles: LABEL_STYLES, setup, transitions: {sweep: {defaults: {lead: .45, tail: .45}, needsSymbol: false, render: sweep}}};

  function motion(ctx) {
    const {key, N, track, show, showHide, stroke, glow, ambient} = ctx.motion;
    const when = (at, id) => typeof at === 'string' ? ctx.motion.speechCue(at, id) : num(at, 'time');
    return {
      when,
      // X-ray window travel (pair with windowCss on the same object).
      scan: (id, at, dur = 1.2) => { const t = when(at, id); stroke(id, [key(t, [0]), key(t + dur, [1], 'smooth')]); return t; },
      // Light a part up (selective illumination, pair with litCss), and optionally dim it again.
      illuminate: (id, at, off) => { const t = when(at, id); glow(id, [key(t, [0]), key(t + .3, [1], 'out'), ...(off !== undefined ? [key(when(off), [1]), key(when(off) + .3, [0])] : [])]); return t; },
      // Meshing spur gears: spins in the true ratio and opposite senses (ω2 = −ω1 · z1 / z2), degrees per second for gear 1.
      mesh: ([id1, z1], [id2, z2], deg) => { ambient(id1, {spin: deg}); ambient(id2, {spin: -deg * z1 / z2}); return deg * z1 / z2; },
      // Chain drive (exact): driver turns `deg` degrees over [t0, t1] with `curve`; the driven sprocket turns deg·z1/z2 the
      // same way at every instant (same curve), and the chain travels r1·θ1 (units of the art) along its loop. --draw carries
      // travel / total (0 → 1); build the chain with markup(var, total) where total = r1 · |deg| in radians.
      chainDrive: ([id1, z1], [id2, z2], chainId, r1, t0, t1, deg, curve = 'inOut', extra = []) => {
        const k = z1 / z2, rot = (id, a) => track(id, [key(t0, N), key(t1, [0, 0, a, 1, 1], curve)]);
        rot(id1, deg); rot(id2, deg * k); for (const e of extra) rot(e, deg * k);
        stroke(chainId, [key(t0, [0]), key(t1, [1], curve)]); return {driven: deg * k, travel: r1 * deg * Math.PI / 180};
      },
      // Exploded view: a part slides out along [dx, dy] (stage fractions) and stays.
      explode: (id, at, [dx, dy], dur = .6) => { const t = when(at, id); track(id, [key(t, N), key(t + dur, [dx, dy, 0, 1, 1], 'out')]); return t; },
      // Inspection marker or part appearing (brackets snap in).
      inspect: (id, at, dur = .3) => { const t = when(at, id); track(id, [key(t, [0, 0, 0, 1.15, 0]), key(t + dur, N, 'out')]); return t; },
      label: (id, at, off) => { const t = when(at, id); off === undefined ? show(id, t, [0, .01, 0, .96, 0], .25) : showHide(id, t, [0, .01, 0, .96, 0], when(off), .2); return t; },
      planCamera: (shotId, views) => {
        const shot = ctx.plan?.shots.find(s => s.id === shotId) ?? fail(`planCamera: shot ${shotId} is not in the resolved plan (--plan)`);
        const moments = shot.camera ?? [];
        if (!Array.isArray(views) || views.length !== moments.length) fail(`planCamera: shot ${shotId} has ${moments.length} planned camera keys; give exactly one view for each`);
        const keys = moments.map((m, i) => key(m.seconds, views[i].slice(0, 3), views[i][3] ?? 'smooth'));
        return !keys.length || keys[0][0] > shot.start.seconds + 1e-9 ? [key(shot.start.seconds, keys[0]?.[1] ?? [0, 0, 1]), ...keys] : keys;
      },
    };
  }

  globalThis.xrayKit = {art: {rounded, metal, glass, section, gear, sprocket, chainLoop, brackets, axis, field}, windowCss, litCss, COLORS: C, css, LABEL_STYLES, motion};
})();
