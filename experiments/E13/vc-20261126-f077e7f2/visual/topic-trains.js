// P015.3 "How do trains stay on the tracks?" (te-IN): original cut-paper topic module for the Paper Explainer backend.
// All artwork is original inline SVG drawn for this video. Shot bounds and every speech moment come from
// plan/resolved-plan.json (render with --plan); no speech timestamps are typed here.
// Art direction (P015.1): one key light per scene, paper thickness via offset underlayers, 3-5 depth layers,
// every mechanism placed in a physical setting, a returning character that changes pose.
(() => {
  const {f, rnd, blob, sym} = globalThis.paperShotArt;
  const {art, css} = globalThis.paperKit;
  const INK = '#252A30', PAPER = '#fff9ee', TERRA = '#BF5942', MUSTARD = '#DAB357', SLATE = '#59758D';
  const STEEL = '#8b939b', STEEL_D = '#4d545c', STEEL_L = '#d7dce1', ORANGE = '#e8873a', BLUE = '#3f7fbf';

  // ---------- small helpers ----------
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const shade = (h, k = .72) => '#' + hex(h).map(c => Math.max(0, Math.min(255, Math.round(c * k))).toString(16).padStart(2, '0')).join('');
  const pts = a => 'M' + a.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
  const line = a => 'M' + a.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
  const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) =>
    `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  const radial = (id, stops, cx = .5, cy = .5, r = .5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) =>
    `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
  // A cut-paper shape: darker offset underlayer (paper thickness, key light from the upper left) + inked top sheet.
  const cut = (d, fill, {under, dx = 5, dy = 7, sw = 3.5, stroke = INK, op = 1} = {}) =>
    `<path d="${d}" fill="${under ?? shade(fill, .62)}" transform="translate(${dx} ${dy})" opacity="${op}"/>` +
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" opacity="${op}"/>`;
  const ridge = (y0, amp, seed, x0 = -60, x1 = 1060, step = 55) => {
    const a = [];
    for (let x = x0, i = 0; x <= x1; x += step, i++) a.push([x, y0 - amp * (.5 + .5 * Math.sin(i * .55 + seed)) - rnd(seed * 7 + i) * amp * .45]);
    return a;
  };
  const hillPath = (y0, amp, seed, bottom = 1700) => { const r = ridge(y0, amp, seed); return pts([...r, [1060, bottom], [-60, bottom]]); };
  const tuft = (x, y, s, c, seed) => Array.from({length: 6}, (_, i) => {
    const a = -1.9 + i * .38 + rnd(seed + i) * .2, l = s * (.7 + rnd(seed + 9 + i) * .5);
    return `<path d="M${f(x + (i - 2.5) * s * .08)} ${f(y)}Q${f(x + Math.cos(a) * l * .4)} ${f(y - l * .6)} ${f(x + Math.cos(a) * l)} ${f(y + Math.sin(a) * l)}" fill="none" stroke="${c}" stroke-width="${f(s * .09)}" stroke-linecap="round"/>`;
  }).join('');
  const stones = (seed, n, x, y, w, h, pal, r0 = 7, r1 = 15) => Array.from({length: n}, (_, i) => {
    const cx = x + rnd(seed + i) * w, cy = y + rnd(seed + 500 + i) * h, r = r0 + rnd(seed + 900 + i) * (r1 - r0);
    return `<path d="${blob(cx, cy, r, r * .72, 6, .28, seed + i)}" fill="${pal[i % pal.length]}"/>`;
  }).join('');
  const cloud = (cx, cy, s, seed, top = '#fbfaf5', under = '#b9c9d6') => [[0, 0, 1], [-.55, .12, .7], [.6, .1, .75], [-.15, -.28, .7], [.3, -.22, .6]]
    .map(([dx, dy, k], i) => art.layered(cx + dx * s * 1.4, cy + dy * s, s * k, s * k * .62, {seed: seed + i, fill: top, under, edge: shade(under, .9), depth: [5, 9], n: 13, amp: .14})).join('');
  const palm = (x, y, h, seed, lean = .18) => {
    const tx = x + h * lean, ty = y - h;
    const fronds = Array.from({length: 7}, (_, i) => {
      const a = -Math.PI + i * (Math.PI / 6) + (rnd(seed + i) - .5) * .25, l = h * (.36 + rnd(seed + 20 + i) * .12);
      const ex = tx + Math.cos(a) * l, ey = ty + Math.sin(a) * l * .55 + l * .25;
      return `<path d="M${f(tx)} ${f(ty)}Q${f((tx + ex) / 2)} ${f(Math.min(ty, ey) - l * .22)} ${f(ex)} ${f(ey)}Q${f((tx + ex) / 2 + 6)} ${f(Math.min(ty, ey) - l * .08)} ${f(tx)} ${f(ty + 6)}Z" fill="${i % 2 ? '#3f7a45' : '#4f8f50'}" stroke="${INK}" stroke-width="2"/>`;
    }).join('');
    return `<path d="M${x} ${y}Q${f(x + h * lean * .2)} ${f(y - h * .5)} ${f(tx)} ${f(ty)}" fill="none" stroke="#6b5440" stroke-width="${f(h * .06)}" stroke-linecap="round"/>` + fronds;
  };
  const arrow = (d, color, w = 12, head = 30) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 6}" stroke-linecap="round" opacity=".25" transform="translate(4 5)"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${head > 0 ? 'none' : 'none'}"/>`;
  const head = (x, y, ang, color, s = 34) => {
    const c = Math.cos(ang), si = Math.sin(ang);
    return cut(pts([[x + c * s, y + si * s], [x - si * s * .7, y + c * s * .7], [x + si * s * .7, y - c * s * .7]]), color, {sw: 3});
  };

  // ---------- hillside (hook, follow, payoff): a curving track seen from a fence ----------
  const P0 = [1080, 800], P1 = [560, 830], P2 = [-120, 1420];
  const B = u => [0, 1].map(k => (1 - u) ** 2 * P0[k] + 2 * u * (1 - u) * P1[k] + u * u * P2[k]);
  const T = u => { const t = [0, 1].map(k => 2 * (1 - u) * (P1[k] - P0[k]) + 2 * u * (P2[k] - P1[k])), l = Math.hypot(...t); return [t[0] / l, t[1] / l]; };
  const Nn = u => { const [tx, ty] = T(u); return [-ty, tx]; };   // points to the far (upper-left) side of the bend
  const TW = u => 22 + 300 * Math.max(0, u) ** 1.5;              // gauge in pixels (perspective)
  const at = (u, s, lift = 0) => { const [x, y] = B(u), [nx, ny] = Nn(u), w = TW(u); return [x + nx * s * w / 2, y + ny * s * w / 2 - lift * w]; };
  const span = (u0, u1, fn, n = 40) => Array.from({length: n + 1}, (_, i) => fn(u0 + (u1 - u0) * i / n));
  const trackArt = (dusk) => {
    const ballast = pts([...span(-.02, 1.08, u => at(u, 1.9)), ...span(1.08, -.02, u => at(u, -1.9))]);
    let sleepers = '';
    for (let u = .0; u < 1.08; u += .011 + .042 * u) {
      const [tx, ty] = T(u), w = TW(u), a = at(u, -1.45), b = at(u, 1.45), d = .11 * w;
      sleepers += `<path d="${pts([a, b, [b[0] + tx * d, b[1] + ty * d], [a[0] + tx * d, a[1] + ty * d]])}" fill="${dusk ? '#8c8590' : '#c2bbb0'}" stroke="${shade(dusk ? '#8c8590' : '#c2bbb0', .6)}" stroke-width="${f(Math.max(1, w * .008))}"/>`;
    }
    const rail = s => {
      const top = span(-.02, 1.08, u => at(u, s)), side = span(1.08, -.02, u => { const [x, y] = at(u, s); return [x, y + 2 + .05 * TW(u)]; });
      return `<path d="${pts([...top, ...side])}" fill="${dusk ? '#4f5059' : STEEL_D}"/><path d="${line(top)}" fill="none" stroke="${dusk ? '#f6c46a' : STEEL_L}" stroke-width="4" stroke-linecap="round"/>`;
    };
    return `<path d="${ballast}" fill="${dusk ? '#7d6f73' : '#a39a8c'}"/>` + `<path d="${pts([...span(-.02, 1.08, u => at(u, 1.9)), ...span(1.08, -.02, u => at(u, 1.6))])}" fill="${dusk ? '#5e5258' : '#8a8073'}"/>` +
      stones(31, 260, 0, 800, 1000, 800, dusk ? ['#6d6066', '#8e8086'] : ['#8f8578', '#b3a99b', '#7c7266'], 4, 9).replace(/<path /g, '<path clip-path="url(#tr-ballast-clip)" ') +
      `<clipPath id="tr-ballast-clip"><path d="${ballast}"/></clipPath>` + sleepers + rail(1) + rail(-1);
  };
  const railGlow = () => [1, -1].map(s => `<path d="${line(span(.05, 1.08, u => at(u, s)))}" fill="none" stroke="#ffd86a" stroke-width="14" stroke-linecap="round" opacity=".75"/>`).join('');
  // 2.5D train along the curve: side faces (near side), roofs and the locomotive's front face.
  const trainArt = (front, {dusk = false, lights = false} = {}) => {
    const H = u => 1.12 * TW(u), lift = .14;
    const nb = u => at(u, -1.25, lift), fb = u => at(u, 1.25, lift);
    const up = (p, u, k) => [p[0], p[1] - H(u) * k];
    const cars = [[front - .125, front, 'loco']];
    for (let i = 0; i < 4; i++) { const b = front - .14 - i * .155; if (b - .14 > -.05) cars.push([b - .14, b, 'coach']); }
    const body = dusk ? {loco: '#8f3e2e', coach: '#33506a', band: '#d9b98a', roof: '#6f6a70'} : {loco: '#c4532f', coach: '#3f6f8f', band: '#f3e3c3', roof: '#cfc8bb'};
    return cars.reverse().map(([u0, u1, kind]) => {
      const fill = body[kind];
      const side = pts([...span(u0, u1, nb, 16), ...span(u1, u0, u => up(nb(u), u, 1), 16)]);
      const roof = pts([...span(u0, u1, u => up(nb(u), u, 1), 16), ...span(u1, u0, u => up(fb(u), u, 1), 16)]);
      const band = (h0, h1, c, op = 1) => `<path d="${pts([...span(u0, u1, u => up(nb(u), u, h0), 16), ...span(u1, u0, u => up(nb(u), u, h1), 16)])}" fill="${c}" opacity="${op}"/>`;
      let win = '';
      const n = kind === 'loco' ? 2 : 6;
      for (let i = 0; i < n; i++) {
        const a = u0 + (u1 - u0) * (.08 + i * .86 / n), b = a + (u1 - u0) * .86 / n * .62;
        win += `<path d="${pts([up(nb(a), a, .5), up(nb(b), b, .5), up(nb(b), b, .76), up(nb(a), a, .76)])}" fill="${lights ? '#ffd36e' : '#2b3440'}" stroke="${INK}" stroke-width="2"/>`;
      }
      const wheels = [u0 + .02, u1 - .02].map(u => { const p = nb(u), r = TW(u) * .11; return `<circle cx="${f(p[0])}" cy="${f(p[1] + r * .4)}" r="${f(r)}" fill="#22262b"/>`; }).join('');
      let face = '';
      if (kind === 'loco') {
        const q = [nb(u1), fb(u1), up(fb(u1), u1, 1), up(nb(u1), u1, 1)];
        const mid = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
        const L = (k, h) => { const bot = mid(q[0], q[1], k), top = mid(q[3], q[2], k); return mid(bot, top, h); };
        face = cut(pts(q), shade(fill, 1.08), {sw: 3, dx: 0, dy: 0}) + `<path d="${pts([L(.1, .55), L(.9, .55), L(.88, .82), L(.12, .82)])}" fill="${lights ? '#f3d68a' : '#263240'}" stroke="${INK}" stroke-width="3"/>` +
          `<path d="${pts([L(0, .28), L(1, .28), L(1, .36), L(0, .36)])}" fill="${body.band}"/>` +
          [.22, .78].map(k => { const p = L(k, .16); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(TW(u1) * .07)}" fill="#fff3c4" stroke="${INK}" stroke-width="2"/>`; }).join('');
        if (lights) {
          const p = L(.5, .16);
          face += `<path d="M${f(p[0])} ${f(p[1])}L${f(p[0] - 330)} ${f(p[1] + 220)}L${f(p[0] - 120)} ${f(p[1] + 330)}Z" fill="#fff0b0" opacity=".35"/>`;
        }
      }
      return `<path d="${roof}" fill="${body.roof}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` + `<path d="${side}" fill="${shade(fill, .6)}" transform="translate(4 6)"/>` +
        `<path d="${side}" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` + band(.28, .36, body.band) + band(.0, .1, '#2a2e33', .85) + win + wheels + face;
    }).join('');
  };
  const skyArt = (id, stops, cloudTop, cloudUnder) => `<defs>${grad(id, stops)}</defs><rect width="1000" height="1600" fill="url(#${id})"/>` +
    art.fibres(11, 70, 0, 0, 1000, 900, '#ffffff', .16) + cloud(250, 250, 120, 3, cloudTop, cloudUnder) + cloud(760, 170, 95, 17, cloudTop, cloudUnder) + cloud(840, 430, 70, 29, cloudTop, cloudUnder) +
    [[420, 330], [452, 312], [480, 340]].map(([x, y]) => `<path d="M${x} ${y}q10 -10 20 0q10 -10 20 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`).join('');
  const farArt = (c1, c2, mist) => `<path d="${hillPath(690, 150, 1.3)}" fill="${c1}"/>${art.fibres(13, 40, 0, 560, 1000, 300, '#ffffff', .12)}` +
    `<path d="${hillPath(800, 120, 4.1)}" fill="${c2}"/><path d="M792 720Q800 790 790 860" fill="none" stroke="#f4fbff" stroke-width="9" opacity=".9"/>` +
    `<path d="M790 860q24 -14 46 2q-20 18 -46 -2" fill="${mist}" opacity=".9"/><path d="M0 820Q500 760 1000 830V900H0Z" fill="${mist}" opacity=".35"/>`;
  const midArt = (dusk) => {
    const g = dusk ? '#4f5f4a' : '#6f9a4f', t1 = dusk ? '#41553f' : '#4f8a4a', t2 = dusk ? '#4b6146' : '#5f9c57';
    let terr = '';
    for (let i = 0; i < 7; i++) {
      const y = 840 + i * 46;
      terr += `<path d="M${520 + i * 18} ${y}Q760 ${y - 60} 1060 ${y - 40}V${y + 30}Q760 ${y - 26} ${540 + i * 18} ${y + 34}Z" fill="${i % 2 ? t1 : t2}"/>` +
        Array.from({length: 14}, (_, k) => `<circle cx="${f(600 + i * 16 + k * 34)}" cy="${f(y + 4 - k * 2.4)}" r="9" fill="${shade(t1, 1.15)}"/>`).join('');
    }
    return `<path d="M-60 900Q300 820 620 860Q860 760 1060 760V1700H-60Z" fill="${g}"/>${art.fibres(19, 60, 0, 800, 1000, 800, dusk ? '#33402f' : '#557a3c', .45)}` + terr +
      palm(110, 960, 300, 4) + palm(200, 930, 240, 9, .1) + palm(40, 1000, 200, 13, -.12) +
      `<path d="M330 905h120v-60l-60-40-60 40Z" fill="${dusk ? '#c8a27e' : '#f2e5cc'}" stroke="${INK}" stroke-width="3"/><path d="M318 848L390 790L462 848" fill="none" stroke="${TERRA}" stroke-width="16" stroke-linejoin="round"/>` +
      `<rect x="372" y="862" width="30" height="43" fill="${SLATE}"/>`;
  };
  const fenceArt = (dusk) => {
    const wood = dusk ? '#7a5a44' : '#a87b52';
    return [600, 720, 840, 960].map((x, i) => cut(pts([[x, 1290 - i * 6], [x + 30, 1294 - i * 6], [x + 32, 1640], [x + 2, 1640]]), wood, {sw: 3})).join('') +
      cut(pts([[560, 1372], [1060, 1350], [1060, 1376], [560, 1398]]), shade(wood, 1.08), {sw: 3}) + cut(pts([[560, 1462], [1060, 1446], [1060, 1470], [560, 1488]]), shade(wood, 1.08), {sw: 3}) +
      Array.from({length: 9}, (_, i) => tuft(560 + i * 60, 1600, 60 + (i % 3) * 18, dusk ? '#3d5a36' : '#4f8a3f', 40 + i)).join('') +
      [[640, 1560, '#f2c94c'], [770, 1585, '#f2f2f2'], [900, 1550, '#e8873a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="11" fill="${c}" stroke="${INK}" stroke-width="2"/>`).join('');
  };
  const signalArt = (dusk) => `<path d="M80 600V1640" stroke="${INK}" stroke-width="22"/><path d="M80 600V1640" stroke="${dusk ? '#55595f' : '#7d848b'}" stroke-width="14"/>` +
    cut(pts([[30, 470], [130, 470], [130, 700], [30, 700]]), '#2a2e33', {sw: 3}) +
    [[80, 515, '#4a3a30'], [80, 585, '#4a4030'], [80, 655, '#57e08a']].map(([x, y, c], i) => `<circle cx="${x}" cy="${y}" r="24" fill="${c}" stroke="${INK}" stroke-width="3"/>` +
      (i === 2 ? `<circle cx="${x}" cy="${y}" r="52" fill="#57e08a" opacity=".22"/>` : '')).join('') +
    tuft(80, 1640, 110, dusk ? '#3d5a36' : '#4f8a3f', 7) + tuft(150, 1640, 80, dusk ? '#3d5a36' : '#5f9a48', 9);
  const bendArrow = () => {
    const p = span(.12, .78, u => at(u, 0, 1.75), 30);
    const [x, y] = p[p.length - 1], [px, py] = p[p.length - 3];
    return `<path d="${line(p)}" fill="none" stroke="${PAPER}" stroke-width="13" stroke-linecap="round" stroke-dasharray="26 18"/>` + head(x, y, Math.atan2(y - py, x - px), MUSTARD, 38);
  };

  // ---------- girl: jointed paper puppet, three-quarter view facing left (frame 0 0 300 520) ----------
  const GIRL = '0 0 300 520', SKIN = '#a8704c', HAIR = '#231b17';
  const girlBody = `<path d="M178 212Q200 260 196 330" fill="none" stroke="#efe9dc" stroke-width="26" stroke-linecap="round"/><circle cx="196" cy="336" r="12" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M128 400L122 492M168 400L172 492" stroke="${SKIN}" stroke-width="22" stroke-linecap="round"/><path d="M122 470V492M172 470V492" stroke="#f6f2e8" stroke-width="24"/>` +
    `<ellipse cx="114" cy="500" rx="24" ry="11" fill="#1d1d1f"/><ellipse cx="170" cy="500" rx="24" ry="11" fill="#1d1d1f"/>` +
    cut(pts([[98, 300], [204, 300], [228, 412], [72, 412]]), '#2f4a7a', {sw: 3.5}) + `<path d="M112 312L102 410M138 312L134 410M164 312L166 410M190 312L200 410" stroke="#24395f" stroke-width="3"/>` +
    cut(pts([[108, 198], [192, 198], [204, 308], [98, 308]]), '#f6f2e8', {sw: 3.5}) + cut(pts([[122, 232], [182, 232], [188, 308], [116, 308]]), '#2f4a7a', {sw: 3}) +
    `<path d="M126 196L146 222L170 196" fill="#fffdf6" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M136 176h24v26h-24Z" fill="${SKIN}"/>` +
    // braids and ribbons behind the head
    `<path d="M186 140Q214 200 206 270Q202 296 210 318" fill="none" stroke="${HAIR}" stroke-width="20" stroke-linecap="round"/><path d="M200 300l-16 22l26 -4l14 22l4 -30Z" fill="${TERRA}" stroke="${INK}" stroke-width="2"/>` +
    `<path d="${blob(148, 128, 58, 62, 16, .04, 5)}" fill="${HAIR}"/>` +
    `<path d="${blob(140, 140, 50, 56, 16, .03, 7)}" fill="${SKIN}" stroke="${INK}" stroke-width="3.5"/>` +
    `<path d="M92 118Q104 76 152 74Q190 76 196 120Q172 96 150 104Q122 92 92 118Z" fill="${HAIR}" stroke="${INK}" stroke-width="3"/>` +
    `<ellipse cx="184" cy="146" rx="9" ry="13" fill="${shade(SKIN, .85)}" stroke="${INK}" stroke-width="2.5"/>` +
    `<ellipse cx="114" cy="138" rx="7" ry="9" fill="${INK}"/><circle cx="112" cy="135" r="2.6" fill="#fff"/><ellipse cx="148" cy="139" rx="6" ry="8.5" fill="${INK}"/><circle cx="146" cy="136" r="2.4" fill="#fff"/>` +
    `<path d="M102 120q12 -8 24 -2M138 121q12 -7 22 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="M98 150q-8 8 2 12" fill="none" stroke="${shade(SKIN, .7)}" stroke-width="3" stroke-linecap="round"/><circle cx="160" cy="160" r="9" fill="#d9846a" opacity=".45"/>`;
  const girlMouthO = `<ellipse cx="118" cy="176" rx="7" ry="9" fill="#5a2420" stroke="${INK}" stroke-width="2"/>`;
  const girlSmile = `<path d="M104 170q14 14 30 2" fill="#fff6f0" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  const girlArmDown = `<path d="M118 214Q102 262 108 318" fill="none" stroke="#f6f2e8" stroke-width="26" stroke-linecap="round"/><path d="M108 300v22" stroke="${SKIN}" stroke-width="18" stroke-linecap="round"/>`;
  const girlArmPoint = `<path d="M118 214Q86 186 52 126" fill="none" stroke="#f6f2e8" stroke-width="26" stroke-linecap="round"/><path d="M56 134L36 98" stroke="${SKIN}" stroke-width="18" stroke-linecap="round"/><path d="M38 100L26 72" stroke="${SKIN}" stroke-width="8" stroke-linecap="round"/>`;
  const girlArmCone = `<path d="M118 214Q90 170 70 104" fill="none" stroke="#f6f2e8" stroke-width="26" stroke-linecap="round"/><circle cx="68" cy="96" r="13" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M50 84L68 140L86 84Z" fill="#d9a35a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M56 96l20 22M76 92l-16 26M64 86l16 20" stroke="#a8743a" stroke-width="2.5"/>` +
    `<path d="${blob(68, 70, 26, 22, 12, .1, 3)}" fill="#f4a3b8" stroke="${INK}" stroke-width="3"/><path d="M52 66q8 -12 22 -10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
  const question = `<path d="${blob(100, 104, 86, 78, 16, .1, 8)}" fill="${shade(PAPER, .8)}" transform="translate(6 8)"/><path d="${blob(100, 104, 86, 78, 16, .1, 8)}" fill="${PAPER}" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M74 82Q76 46 104 46Q134 48 132 76Q130 96 106 104Q100 108 100 124" fill="none" stroke="${TERRA}" stroke-width="13" stroke-linecap="round"/><circle cx="100" cy="150" r="9" fill="${TERRA}"/>`;
  const steering = `<circle cx="110" cy="110" r="92" fill="none" stroke="${shade('#3a3f45', .6)}" stroke-width="22" transform="translate(5 7)"/><circle cx="110" cy="110" r="92" fill="none" stroke="#3a3f45" stroke-width="22"/>` +
    `<circle cx="110" cy="110" r="92" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="110" cy="110" r="26" fill="${MUSTARD}" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M110 84V22M88 124L32 150M132 124L188 150" stroke="#3a3f45" stroke-width="16" stroke-linecap="round"/>`;
  const crossArt = `<path d="M30 30L190 190M190 30L30 190" stroke="${shade(TERRA, .6)}" stroke-width="30" stroke-linecap="round" transform="translate(4 6)"/><path d="M30 30L190 190M190 30L30 190" stroke="${TERRA}" stroke-width="30" stroke-linecap="round"/>`;

  // ---------- under the coach, at rail level (myth) ----------
  const WHEEL_C = [500, 880];
  const underBg = `<defs>${grad('tu-g-day', [[0, '#e7efe8'], [1, '#bcd3c0']])}</defs><rect width="1000" height="1600" fill="url(#tu-g-day)"/>` +
    `<path d="${hillPath(720, 70, 2.2)}" fill="#9fbf98"/><path d="${hillPath(800, 50, 5.7)}" fill="#86ad7a"/>` +
    Array.from({length: 7}, (_, i) => art.layered(80 + i * 150, 760 - (i % 2) * 30, 60, 46, {seed: 60 + i, fill: '#6f9a64', under: '#4f7a4a', depth: [4, 6], n: 12, amp: .2})).join('') +
    // coach body and underframe across the top (dark, framing)
    `<path d="M-40 0H1040V330H-40Z" fill="#3f6f8f"/><path d="M-40 250H1040V282H-40Z" fill="#f3e3c3"/>` + art.fibres(23, 40, 0, 0, 1000, 330, '#2e5672', .5) +
    `<path d="M-40 330H1040V420H-40Z" fill="#2c3136"/>` + Array.from({length: 12}, (_, i) => `<circle cx="${30 + i * 88}" cy="375" r="6" fill="#555c63"/>`).join('') +
    // bogie frame and springs behind the wheel
    cut(pts([[60, 470], [940, 470], [940, 540], [60, 540]]), '#3d434a', {sw: 3}) + cut(pts([[180, 420], [260, 420], [260, 470], [180, 470]]), '#30353b', {sw: 3}) + cut(pts([[740, 420], [820, 420], [820, 470], [740, 470]]), '#30353b', {sw: 3}) +
    [220, 780].map(x => `<path d="M${x - 34} 540${Array.from({length: 7}, (_, i) => `L${x + (i % 2 ? 34 : -34)} ${552 + i * 14}`).join('')}" fill="none" stroke="#c9a045" stroke-width="9" stroke-linejoin="round"/>`).join('') +
    `<path d="M120 640H880" stroke="#2c3136" stroke-width="16"/><path d="M160 600L300 700M840 600L700 700" stroke="#2c3136" stroke-width="10"/>`;
  const underGround = (storm) => {
    let sl = '';
    for (let i = -1; i < 6; i++) { const x = i * 250 + 40; sl += cut(pts([[x, 1290], [x + 170, 1290], [x + 182, 1372], [x - 12, 1372]]), storm ? '#9c958a' : '#c2bbb0', {sw: 3}) + `<path d="M${x + 60} 1278h50v22h-50Z" fill="#c9a045" stroke="${INK}" stroke-width="2"/>`; }
    return `<path d="M-60 1270H1060V1700H-60Z" fill="${storm ? '#6f675e' : '#9a9087'}"/>` + stones(77, 420, -40, 1280, 1080, 340, storm ? ['#5f574f', '#7c7369', '#4f4842'] : ['#8f8578', '#b3a99b', '#7c7266', '#c7bdb0'], 9, 18) + sl;
  };
  const railSide = `<path d="M-60 1200H1060V1238H-60Z" fill="${STEEL}" stroke="${INK}" stroke-width="3"/><path d="M-60 1203H1060" stroke="${STEEL_L}" stroke-width="5"/>` +
    `<path d="M-60 1238H1060V1286H-60Z" fill="${STEEL_D}"/><path d="M-60 1286H1060V1304H-60Z" fill="#5d646c" stroke="${INK}" stroke-width="3"/>`;
  const wheelSide = (spokes = true) => {
    const [cx, cy] = [350, 350];
    return `<circle cx="${cx + 8}" cy="${cy + 10}" r="330" fill="#2a2e33"/><circle cx="${cx}" cy="${cy}" r="330" fill="#545b63" stroke="${INK}" stroke-width="4"/>` +
      `<circle cx="${cx}" cy="${cy}" r="304" fill="#9aa2aa" stroke="${INK}" stroke-width="3"/><path d="M${cx - 230} ${cy - 200}A304 304 0 0 1 ${cx + 120} ${cy - 280}" fill="none" stroke="#e6eaee" stroke-width="10" stroke-linecap="round" opacity=".8"/>` +
      `<circle cx="${cx}" cy="${cy}" r="276" fill="#6d757d" stroke="${INK}" stroke-width="3"/>` +
      Array.from({length: 4}, (_, i) => `<circle cx="${cx}" cy="${cy}" r="${250 - i * 34}" fill="none" stroke="${i % 2 ? '#7c848c' : '#626a72'}" stroke-width="12"/>`).join('') +
      (spokes ? Array.from({length: 6}, (_, i) => { const a = i * Math.PI / 3; return `<circle cx="${f(cx + Math.cos(a) * 160)}" cy="${f(cy + Math.sin(a) * 160)}" r="26" fill="#3d434a" stroke="${INK}" stroke-width="3"/>`; }).join('') : '') +
      `<circle cx="${cx}" cy="${cy}" r="96" fill="#4b525a" stroke="${INK}" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="58" fill="${MUSTARD}" stroke="${INK}" stroke-width="4"/>` +
      Array.from({length: 6}, (_, i) => { const a = i * Math.PI / 3 + .5; return `<circle cx="${f(cx + Math.cos(a) * 38)}" cy="${f(cy + Math.sin(a) * 38)}" r="7" fill="${INK}"/>`; }).join('') +
      `<path d="M${cx - 60} ${cy - 250}L${cx - 30} ${cy - 250}" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`;
  };
  const lens = `<circle cx="210" cy="210" r="172" fill="${shade('#c9a045', .6)}" transform="translate(6 8)"/><circle cx="210" cy="210" r="150" fill="#f6f1e2" opacity=".93"/>` +
    `<circle cx="210" cy="210" r="160" fill="none" stroke="#c9a045" stroke-width="26"/><circle cx="210" cy="210" r="160" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="210" cy="210" r="173" fill="none" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M330 330L420 420" stroke="#6b4a2e" stroke-width="42" stroke-linecap="round"/><path d="M330 330L420 420" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M120 120Q150 90 190 84" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/>`;
  // Wheel cross-section (flange left = inner side) sitting on a rail head, exaggerated taper; drawn inside the lens.
  const profileMini = `<path d="M100 120V250L96 290L118 300L140 262L150 252L330 214V120Z" fill="#c7ced5" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="M100 250L96 290L118 300L140 262Z" fill="${TERRA}" opacity=".85"/><path d="M150 252L330 214" stroke="${ORANGE}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M172 262h96v26h-26v40h40v14h-124v-14h40v-40h-26Z" fill="${STEEL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;

  // ---------- along the track, wheelset seen from the front (axle, centre, guard) ----------
  const V = [500, 470], CONTACT = 1100, RAILX = [300, 700], WC = 820;
  const rx = (x0, y) => V[0] + (x0 - V[0]) * (y - V[1]) / (CONTACT - V[1]);   // perspective line through V
  const frontLand = (storm) => `<defs>${grad(storm ? 'tf-g-sky-s' : 'tf-g-sky', storm ? [[0, '#4b5563'], [.6, '#7d8794'], [1, '#a9b0b5']] : [[0, '#79a9d3'], [.7, '#c3dceb'], [1, '#efe9d4']])}</defs>` +
    `<rect width="1000" height="1600" fill="url(#${storm ? 'tf-g-sky-s' : 'tf-g-sky'})"/>` + (storm ? '' : cloud(220, 180, 80, 41) + cloud(780, 120, 64, 53)) +
    `<path d="${hillPath(470, 60, 3.3)}" fill="${storm ? '#56645e' : '#8fb0a0'}"/><path d="M-60 470H1060V1700H-60Z" fill="${storm ? '#53704a' : '#7aa356'}"/>` +
    Array.from({length: 14}, (_, i) => { const x0 = -900 + i * 200; return `<path d="M${f(V[0] + (x0 - V[0]) * .02)} 474L${x0} 1700" stroke="${storm ? '#476340' : '#6a9449'}" stroke-width="10"/>`; }).join('') +
    Array.from({length: 6}, (_, i) => art.layered(60 + i * 180 + (i % 2) * 40, 470, 44, 30, {seed: 90 + i, fill: storm ? '#3f5a3a' : '#5d8a50', under: storm ? '#2f472c' : '#476f3d', depth: [3, 4], n: 11, amp: .2})).join('');
  const frontTrack = (storm) => {
    const ballastL = rx(80, 1700), ballastR = rx(920, 1700);
    let sl = '';
    for (const d of [8, 5.6, 4.2, 3.3, 2.7, 2.25, 1.9, 1.62, 1.4, 1.22, 1.07, .95, .85, .76]) {
      const y = V[1] + (CONTACT - V[1]) / d * .93, h = 34 / d;
      sl += cut(pts([[rx(160, y), y], [rx(840, y), y], [rx(840, y + h), y + h], [rx(160, y + h), y + h]]), storm ? '#9c958a' : '#c2bbb0', {sw: Math.max(1, 3 / d), dx: 0, dy: Math.max(2, 9 / d)});
    }
    const railBand = x0 => { const w = y => 62 * (y - V[1]) / (CONTACT - V[1]); return `<path d="${pts([[rx(x0, 480) - 1, 480], [rx(x0, 480) + 1, 480], [rx(x0, 1700) + w(1700) / 2, 1700], [rx(x0, 1700) - w(1700) / 2, 1700]])}" fill="${STEEL_D}"/>` +
      `<path d="${pts([[rx(x0, 480), 480], [rx(x0, 1700) + w(1700) * .3, 1700], [rx(x0, 1700) - w(1700) * .3, 1700]])}" fill="${STEEL_L}" opacity=".9"/>`; };
    return `<path d="${pts([[V[0] - 4, V[1] + 4], [V[0] + 4, V[1] + 4], [ballastR, 1700], [ballastL, 1700]])}" fill="${storm ? '#7a7066' : '#a39a8c'}"/>` +
      stones(51, 380, 0, 900, 1000, 700, storm ? ['#62594f', '#857b70'] : ['#8f8578', '#b3a99b', '#7c7266'], 5, 12) + sl + railBand(RAILX[0]) + railBand(RAILX[1]);
  };
  // One wheel seen edge-on: tread slopes up towards the outer face (taper exaggerated); flange on the inner side.
  const wheelFront = (cx, {flangeHi = false} = {}) => {
    const dir = cx < 500 ? 1 : -1, xo = cx - dir * 46, xi = cx + dir * 30, xf = cx + dir * 56;
    const yc = WC, rOut = 262, rIn = 280, rF = 302;
    const tread = pts([[xo, yc - rOut], [xi, yc - rIn], [xi, yc + rIn], [xo, yc + rOut]]);
    const flange = pts([[xi, yc - rIn], [xi, yc - rF + 6], [xi + dir * 8, yc - rF], [xf, yc - rF + 14], [xf, yc + rF - 14], [xi + dir * 8, yc + rF], [xi, yc + rF - 6], [xi, yc + rIn]]);
    const bx0 = xo - dir * 30, bx1 = xo - dir * 96;
    const box = pts([[bx0, yc - 50], [bx1, yc - 50], [bx1, yc + 50], [bx0, yc + 50]]);
    // outer face of the wheel disc, seen slightly off-axis as a narrow ellipse: reads as a round wheel
    const face = `<ellipse cx="${xo}" cy="${yc}" rx="40" ry="${rOut}" fill="${shade('#6d757d', .62)}" transform="translate(${-dir * 5} 7)"/>` +
      `<ellipse cx="${xo}" cy="${yc}" rx="40" ry="${rOut}" fill="#6d757d" stroke="${INK}" stroke-width="3.5"/>` +
      [.84, .66, .5].map((k, i) => `<ellipse cx="${xo}" cy="${yc}" rx="${f(40 * k)}" ry="${f(rOut * k)}" fill="none" stroke="${i % 2 ? '#7c848c' : '#5c646c'}" stroke-width="7"/>`).join('') +
      `<ellipse cx="${xo}" cy="${yc}" rx="15" ry="70" fill="${MUSTARD}" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M${xo - dir * 10} ${yc - rOut + 30}Q${xo - dir * 30} ${yc} ${xo - dir * 10} ${yc + rOut - 30}" fill="none" stroke="#e6eaee" stroke-width="5" opacity=".6"/>`;
    return cut(box, '#3a4047', {sw: 3}) +
      `<path d="M${(bx0 + bx1) / 2} ${yc - 50}${Array.from({length: 6}, (_, i) => `L${(bx0 + bx1) / 2 + (i % 2 ? 24 : -24)} ${yc - 62 - i * 16}`).join('')}" fill="none" stroke="#c9a045" stroke-width="9" stroke-linejoin="round"/>` +
      cut(flange, flangeHi ? TERRA : '#5b636b', {sw: 3.5}) + cut(tread, '#9aa2aa', {sw: 3.5}) +
      `<path d="M${xi - dir * 10} ${yc - rIn + 26}V${yc + rIn - 26}" stroke="#c3c9cf" stroke-width="10" opacity=".7"/>` + face;
  };
  const axleArt = `<path d="M330 ${WC - 26}H670V${WC + 26}H330Z" fill="#7c848c" stroke="${INK}" stroke-width="3.5"/><path d="M330 ${WC - 14}H670" stroke="${STEEL_L}" stroke-width="7"/>` +
    `<path d="M330 ${WC + 26}H670V${WC + 34}H330Z" fill="#2a2e33" opacity=".5"/>`;
  const boltsArt = [336, 664].map(x => cut(pts(Array.from({length: 6}, (_, i) => [x + Math.cos(i * Math.PI / 3) * 40, WC + Math.sin(i * Math.PI / 3) * 40])), MUSTARD, {sw: 3}) +
    `<circle cx="${x}" cy="${WC}" r="13" fill="${INK}"/>`).join('');
  const bogieBeam = cut(pts([[120, WC - 210], [880, WC - 210], [880, WC - 160], [120, WC - 160]]), '#3d434a', {sw: 3}) +
    Array.from({length: 10}, (_, i) => `<circle cx="${160 + i * 76}" cy="${WC - 185}" r="6" fill="#6b737b"/>`).join('');
  const wheelsetArt = (hiLeft = false) => bogieBeam + axleArt + wheelFront(RAILX[0], {flangeHi: hiLeft}) + wheelFront(RAILX[1]) + boltsArt;
  const railHeads = RAILX.map(x => cut(pts([[x - 32, CONTACT], [x + 32, CONTACT], [x + 32, CONTACT + 34], [x + 12, CONTACT + 40], [x + 12, CONTACT + 96], [x + 58, CONTACT + 112], [x + 58, CONTACT + 126], [x - 58, CONTACT + 126], [x - 58, CONTACT + 112], [x - 12, CONTACT + 96], [x - 12, CONTACT + 40], [x - 32, CONTACT + 34]]), STEEL, {sw: 3.5}) +
    `<path d="M${x - 28} ${CONTACT + 4}H${x + 28}" stroke="${STEEL_L}" stroke-width="6"/>`).join('');
  const spinArrow = (color) => `<path d="M60 150A90 90 0 1 1 150 240" fill="none" stroke="${shade(color, .6)}" stroke-width="22" stroke-linecap="round" transform="translate(4 6)"/>` +
    `<path d="M60 150A90 90 0 1 1 150 240" fill="none" stroke="${color}" stroke-width="22" stroke-linecap="round"/>` + head(150, 240, Math.PI, color, 34);
  const sideArrow = (color, left = true) => {
    const d = left ? 'M300 60H60' : 'M60 60H300';
    return `<path d="${d}" stroke="${shade(color, .6)}" stroke-width="30" stroke-linecap="round" transform="translate(4 6)"/><path d="${d}" stroke="${color}" stroke-width="30" stroke-linecap="round"/>` +
      head(left ? 50 : 310, 60, left ? Math.PI : 0, color, 46);
  };
  const treadGlow = RAILX.map(x => { const dir = x < 500 ? 1 : -1, xo = x - dir * 46, xi = x + dir * 30; return `<path d="M${xo} ${WC + 262}L${xi} ${WC + 280}" stroke="${ORANGE}" stroke-width="16" stroke-linecap="round"/><path d="M${xo} ${WC - 262}L${xi} ${WC - 280}" stroke="${ORANGE}" stroke-width="16" stroke-linecap="round" opacity=".7"/>`; }).join('');
  const centreMark = (lit) => `<path d="M492 1190h16v90h-16Z" fill="${lit ? '#fff6c8' : '#f2efe6'}" stroke="${INK}" stroke-width="2.5"/>` + (lit ? `<ellipse cx="500" cy="1236" rx="70" ry="60" fill="#ffe27a" opacity=".35"/>` : '');
  const windArt = Array.from({length: 7}, (_, i) => {
    const y = 360 + i * 150 + rnd(i + 3) * 60, w = 340 + rnd(i + 8) * 260;
    return `<path d="M0 ${f(y)}C${f(w * .4)} ${f(y - 40)} ${f(w * .7)} ${f(y + 40)} ${f(w)} ${f(y - 10)}q40 -10 30 -40q-10 -24 -36 -10" fill="none" stroke="${i % 2 ? '#e9eef3' : '#cfd9e3'}" stroke-width="${f(10 + rnd(i) * 8)}" stroke-linecap="round"/>`;
  }).join('');
  const rainArt = `<rect width="1000" height="1600" fill="#2b3440" opacity=".28"/>` + Array.from({length: 120}, (_, i) => {
    const x = rnd(i + 11) * 1100 - 50, y = rnd(i + 211) * 1600;
    return `<path d="M${f(x)} ${f(y)}l-26 64" stroke="#dfe8f0" stroke-width="3" opacity=".55"/>`;
  }).join('');
  const shield = `<path d="M100 10L180 40V110Q180 170 100 210Q20 170 20 110V40Z" fill="${shade(TERRA, .6)}" transform="translate(5 7)"/><path d="M100 10L180 40V110Q180 170 100 210Q20 170 20 110V40Z" fill="${TERRA}" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M64 108l26 26l48 -56" fill="none" stroke="${PAPER}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`;

  // ---------- workshop (cone) ----------
  // Blueprint geometry: axle centreline y=600; wheel half-section from inner face x=260 to outer face x=760;
  // tread from (330,1010) inner to (760,905) outer (taper exaggerated); flange at the inner side.
  const TREAD = [[330, 1010], [760, 905]];
  const treadY = x => TREAD[0][1] + (x - TREAD[0][0]) * (TREAD[1][1] - TREAD[0][1]) / (TREAD[1][0] - TREAD[0][0]);
  const wallArt = `<rect width="1000" height="1600" fill="#e9dcc4"/>${art.fibres(61, 120, 0, 0, 1000, 1600, '#cdbd9f', .55)}` +
    // window with bars (upper left) and its light falling down-right as a vellum beam
    cut(pts([[40, 90], [380, 90], [380, 430], [40, 430]]), '#8a6a48', {sw: 4}) + `<path d="M64 112H356V408H64Z" fill="#cfe6ef"/>${cloud(160, 220, 40, 71)}` +
    `<path d="${hillPath(380, 30, 1.1).replace(/1700/g, '408')}" fill="#9fbf98" clip-path="url(#tw-win)"/><clipPath id="tw-win"><path d="M64 112H356V408H64Z"/></clipPath>` +
    [130, 210, 290].map(x => `<path d="M${x} 112V408" stroke="#5d4630" stroke-width="10"/>`).join('') + `<path d="M64 260H356" stroke="#5d4630" stroke-width="10"/>` +
    // pegboard with tools (upper right)
    cut(pts([[520, 80], [960, 80], [960, 430], [520, 430]]), '#c9a77a', {sw: 4}) +
    Array.from({length: 48}, (_, i) => `<circle cx="${545 + (i % 12) * 36}" cy="${105 + Math.floor(i / 12) * 90}" r="5" fill="#8a6a48"/>`).join('') +
    cut('M560 140h24v170h-24Z M548 300a24 24 0 1 0 48 0a24 24 0 1 0 -48 0Z', '#7c848c', {sw: 3}) +
    cut('M640 130h120v44h-46v190h-28v-190h-46Z', '#5d6670', {sw: 3}) + cut('M800 140l40 0l-10 200l-20 0Z', TERRA, {sw: 3}) +
    cut('M870 130q30 0 30 40l-10 160h-20l-10 -160q0 -40 10 -40Z', MUSTARD, {sw: 3}) +
    // hanging lamp and its glow
    `<path d="M460 0V120" stroke="${INK}" stroke-width="4"/>` + cut('M410 120H510L540 180H380Z', '#3f6f8f', {sw: 3}) + `<ellipse cx="460" cy="186" rx="40" ry="12" fill="#fff3c4"/>` +
    `<path d="M380 186L300 520H620L540 186Z" fill="#fff3c4" opacity=".22"/>`;
  const sunBeam = `<path d="M64 112L356 112L900 1180L420 1240Z" fill="#fff6d0" opacity=".18"/>`;
  const blueprint = `<path d="M96 488L912 476L920 1208L92 1218Z" fill="#1d3f61" transform="translate(8 10)"/><path d="M96 488L912 476L920 1208L92 1218Z" fill="#2f5f8f" stroke="${INK}" stroke-width="4"/>` +
    Array.from({length: 17}, (_, i) => `<path d="M${120 + i * 48} 500V1196" stroke="#5a86b3" stroke-width="2" opacity=".55"/>`).join('') +
    Array.from({length: 15}, (_, i) => `<path d="M106 ${520 + i * 46}H908" stroke="#5a86b3" stroke-width="2" opacity=".55"/>`).join('') +
    [[110, 470, -8], [870, 462, 6], [100, 1200, 5], [880, 1194, -7]].map(([x, y, r]) => `<rect x="${x - 40}" y="${y - 14}" width="80" height="28" fill="#e8d9a8" opacity=".9" transform="rotate(${r} ${x} ${y})"/>`).join('') +
    // drawing: centreline, half-section of the wheel, rail head
    `<path d="M130 600H890" stroke="#fff" stroke-width="3" stroke-dasharray="26 10 6 10" opacity=".85"/>` +
    `<path d="M260 600V1000L256 1070L292 1086L322 1036L330 1010L760 905V600Z" fill="#4f7fae" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>` +
    `<path d="M260 1000L256 1070L292 1086L322 1036L330 1010Z" fill="${TERRA}" opacity=".55"/>` +
    `<path d="M380 600V700Q510 760 640 700V600" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>` +
    `<path d="M420 990h136v34h-38v70h56v22h-172v-22h56v-70h-38Z" fill="#3f6f9f" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>`;
  const benchArt = `<path d="M-60 1258H1060V1330H-60Z" fill="#8a5d3a" stroke="${INK}" stroke-width="4"/>` + `<path d="M-60 1330H1060V1700H-60Z" fill="#6b4529"/>` +
    art.fibres(81, 60, 0, 1262, 1000, 60, '#6b4529', .6) + Array.from({length: 6}, (_, i) => `<path d="M${i * 190} 1258v72" stroke="#5c3b22" stroke-width="3"/>`).join('') +
    `<path d="M-60 1330H1060V1360H-60Z" fill="#2a1d14" opacity=".35"/>` +
    // chai glass with steam, a spanner, chalk and a toy engine
    `<path d="M780 1180h70l-8 80h-54Z" fill="#f3e8d0" opacity=".85" stroke="${INK}" stroke-width="3"/><path d="M784 1206h62l-6 54h-50Z" fill="#b5713a"/>` +
    `<path d="M800 1170q-14 -26 4 -48q16 -20 0 -44M830 1166q-12 -22 4 -40" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>` +
    cut('M120 1236l200 -10l8 16l-200 12Z M108 1226a22 22 0 1 0 30 32Z', '#7c848c', {sw: 3}) + cut('M420 1240h70v12h-70Z', '#f6f2e8', {sw: 2.5}) +
    cut('M560 1200h120v52h-120Z', TERRA, {sw: 3}) + cut('M640 1172h40v30h-40Z', '#2b3440', {sw: 3}) + `<circle cx="584" cy="1256" r="12" fill="${INK}"/><circle cx="656" cy="1256" r="12" fill="${INK}"/>`;
  const coneArt = (() => { // ice-cream cone lying with its axis horizontal: wide end left, tip right (0 0 640 300)
    const wide = [170, 150], tip = [620, 150];
    return `<path d="M170 40L620 150L170 260Z" fill="#a8743a" transform="translate(6 9)"/><path d="M170 40L620 150L170 260Z" fill="#d9a35a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
      Array.from({length: 7}, (_, i) => `<path d="M${200 + i * 60} ${48 + i * 14}L${260 + i * 60} ${252 - i * 14}" stroke="#a8743a" stroke-width="4"/><path d="M${200 + i * 60} ${252 - i * 14}L${260 + i * 60} ${48 + i * 14}" stroke="#a8743a" stroke-width="4"/>`).join('').replace(/NaN/g, '0') +
      `<ellipse cx="${wide[0]}" cy="${wide[1]}" rx="24" ry="110" fill="#c48a48" stroke="${INK}" stroke-width="4"/>` +
      `<path d="${blob(112, 150, 92, 104, 16, .08, 21)}" fill="#c9728a" transform="translate(5 8)"/><path d="${blob(112, 150, 92, 104, 16, .08, 21)}" fill="#f4a3b8" stroke="${INK}" stroke-width="5"/>` +
      `<path d="M60 96q22 -30 60 -32" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".7"/>` +
      `<path d="M150 236q4 26 -6 40" fill="none" stroke="#f4a3b8" stroke-width="12" stroke-linecap="round"/>` + `<circle cx="${tip[0] - 6}" cy="${tip[1]}" r="3" fill="${INK}"/>`;
  })();
  const slopeLine = `<path d="M${TREAD[0][0] + 6} ${TREAD[0][1] - 8}L${TREAD[1][0] - 4} ${TREAD[1][1] - 8}" stroke="${ORANGE}" stroke-width="14" stroke-linecap="round" stroke-dasharray="30 14"/>` +
    head(TREAD[1][0] + 10, TREAD[1][1] - 10, Math.atan2(TREAD[1][1] - TREAD[0][1], TREAD[1][0] - TREAD[0][0]), ORANGE, 26);
  const radiusArrow = (x, color) => { const y1 = treadY(x) - 10; return `<path d="M${x} 612V${f(y1)}" stroke="${shade(color, .6)}" stroke-width="16" stroke-linecap="round" transform="translate(4 6)"/>` +
    `<path d="M${x} 612V${f(y1)}" stroke="${color}" stroke-width="16" stroke-linecap="round"/>` + head(x, y1 + 6, Math.PI / 2, color, 28) + head(x, 606, -Math.PI / 2, color, 28); };

  // ---------- bird's-eye bend (bend) ----------
  const CC = [1300, 950], R = 800, GA = 110;     // curve centre, centreline radius, half gauge
  const arcPt = (r, phi) => [CC[0] - r * Math.cos(phi), CC[1] + r * Math.sin(phi)];
  const arc = (r, a0, a1, n = 60) => Array.from({length: n + 1}, (_, i) => arcPt(r, a0 + (a1 - a0) * i / n));
  const D = Math.PI / 180;
  const groundTop = `<rect width="1000" height="1600" fill="#86ad5f"/>${art.fibres(91, 120, 0, 0, 1000, 1600, '#6f9a4f', .5)}` +
    // fields with furrows, a mud path, pond, huts and trees (key light upper left: shadows fall down-right)
    `<path d="M-60 -60H330L250 420H-60Z" fill="#d9b94a"/>` + Array.from({length: 12}, (_, i) => `<path d="M${-60 + i * 34} -60L${-80 + i * 28} 420" stroke="#c4a23a" stroke-width="6"/>`).join('') +
    `<path d="M-60 1180L300 1240L260 1700H-60Z" fill="#5f9a4f"/>` + Array.from({length: 10}, (_, i) => `<path d="M-60 ${1200 + i * 52}L${300 - i * 4} ${1250 + i * 50}" stroke="#4f8a43" stroke-width="7"/>`).join('') +
    `<path d="M1060 1240Q860 1300 760 1460T640 1700" fill="none" stroke="#c9b48a" stroke-width="54" stroke-linecap="round"/>` +
    `<path d="${blob(880, 250, 120, 80, 16, .1, 3)}" fill="#5b8fb8" stroke="${INK}" stroke-width="4"/><path d="M820 240q30 -14 60 0M860 280q26 -12 52 0" fill="none" stroke="#cfe3f0" stroke-width="5" stroke-linecap="round"/>` +
    [[860, 1440, 140, 96, 8], [940, 1290, 100, 80, -10]].map(([x, y, w, h, r]) => `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - w / 2 + 10}" y="${y - h / 2 + 14}" width="${w}" height="${h}" fill="#2a2e33" opacity=".3"/>` +
      `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" fill="${TERRA}" stroke="${INK}" stroke-width="4"/><path d="M${x - w / 2} ${y}H${x + w / 2}" stroke="${shade(TERRA, .7)}" stroke-width="6"/>` +
      Array.from({length: 6}, (_, k) => `<path d="M${x - w / 2 + 10 + k * w / 6} ${y - h / 2}v${h}" stroke="${shade(TERRA, .82)}" stroke-width="3"/>`).join('') + `</g>`).join('') +
    [[120, 600, 70], [90, 860, 56], [180, 1060, 64], [700, 120, 60], [960, 640, 70], [960, 900, 52], [80, 1420, 60]].map(([x, y, r], i) =>
      `<circle cx="${x + r * .35}" cy="${y + r * .45}" r="${r}" fill="#2a3a22" opacity=".35"/>` + art.layered(x, y, r, r * .95, {seed: 120 + i, fill: i % 2 ? '#4f8f50' : '#5f9c57', under: '#3a6b3d', depth: [5, 7], n: 14, amp: .18})).join('');
  const trackTop = () => {
    const a0 = -75 * D, a1 = 75 * D;
    let sl = '';
    for (let a = a0; a <= a1; a += 3.6 * D) {
      const p = [arcPt(R - 165, a - .9 * D), arcPt(R + 165, a - 1.1 * D), arcPt(R + 165, a + 1.1 * D), arcPt(R - 165, a + .9 * D)];
      sl += `<path d="${pts(p)}" fill="#c2bbb0" stroke="#8f887d" stroke-width="2"/>`;
    }
    const rail = r => `<path d="${line(arc(r, a0, a1))}" fill="none" stroke="${STEEL_D}" stroke-width="22"/><path d="${line(arc(r, a0, a1))}" fill="none" stroke="${STEEL_L}" stroke-width="8"/>`;
    return `<path d="${pts([...arc(R + 215, a0, a1), ...arc(R - 215, a1, a0)])}" fill="#a39a8c"/>` + stones(101, 500, 300, 0, 700, 1600, ['#8f8578', '#b3a99b', '#7c7266'], 4, 9)
      .replace(/<path /g, '<path clip-path="url(#tt-bal)" ') + `<clipPath id="tt-bal"><path d="${pts([...arc(R + 215, a0, a1), ...arc(R - 215, a1, a0)])}"/></clipPath>` +
      sl + rail(R + GA) + rail(R - GA);
  };
  const wheelTop = (x, glow) => { // a wheel from above: a thin slab along the track; flange towards the track centre
    const inner = x < 500 ? 1 : -1;
    return cut(pts([[x - 30, 800], [x + 30, 800], [x + 30, 1100], [x - 30, 1100]]), '#9aa2aa', {sw: 3.5}) +
      `<path d="M${x + inner * 30} 806V1094" stroke="${glow ? TERRA : '#5b636b'}" stroke-width="12"/>` +
      `<path d="M${x - inner * 22} 812V1088" stroke="#e6eaee" stroke-width="7" opacity=".8"/>`;
  };
  const wheelsetTop = `<path d="M${R + GA - R + 500 - 2 * GA} 935H${500 + GA}V965H${500 - GA}Z" fill="#7c848c"/>` +
    cut(pts([[500 - GA - 70, 932], [500 + GA + 70, 932], [500 + GA + 70, 968], [500 - GA - 70, 968]]), '#7c848c', {sw: 3}) +
    wheelTop(500 - GA) + wheelTop(500 + GA) +
    [500 - GA - 70, 500 + GA + 70].map(x => cut(pts([[x - 26, 920], [x + 26, 920], [x + 26, 980], [x - 26, 980]]), '#3a4047', {sw: 3})).join('');
  const fatGlow = `<rect x="${500 - GA - 54}" y="780" width="108" height="340" rx="40" fill="${ORANGE}" opacity=".38"/><rect x="${500 - GA - 54}" y="780" width="108" height="340" rx="40" fill="none" stroke="${ORANGE}" stroke-width="7" stroke-dasharray="20 10"/>`;
  const tape = (r, a1, color) => { // paper measuring tape along an arc from the wheelset (phi = 0) up the bend
    const p = arc(r, 0, -a1, 50);
    let ticks = '';
    for (let a = 0; a < a1; a += 2.2 * D) { const q = arcPt(r - 13, -a), s = arcPt(r + 4, -a); ticks += `<path d="M${f(q[0])} ${f(q[1])}L${f(s[0])} ${f(s[1])}" stroke="${INK}" stroke-width="3"/>`; }
    return `<path d="${line(p)}" fill="none" stroke="${shade(color, .6)}" stroke-width="34" stroke-linecap="butt" transform="translate(5 7)"/><path d="${line(p)}" fill="none" stroke="${color}" stroke-width="34"/>` + ticks;
  };
  const LONG = tape(R + GA + 52, 40 * D, ORANGE), SHORT = tape(R - GA - 52, 40 * D, BLUE);
  const outArrow = sideArrow(MUSTARD, true);

  globalThis.paperTopic = {
    shots: [
      {id: 'curve', scene: 'tr-hill', accent: TERRA, transition: {type: 'dissolve', symbol: 'tx-t-steel', lead: .14, tail: .26, zoom: .22}},
      {id: 'myth', scene: 'tr-under', accent: TERRA, transition: {type: 'sheet', symbol: 'tx-s-front', half: .22}},
      {id: 'axle', scene: 'tr-axle', accent: MUSTARD, transition: {type: 'dissolve', symbol: 'tx-t-blue', lead: .14, tail: .26, zoom: .2}},
      {id: 'cone', scene: 'tr-cone', accent: ORANGE, transition: {type: 'sheet', symbol: 'tx-s-blueprint', half: .22}},
      {id: 'centre', scene: 'tr-centre', accent: '#4f9a5a', transition: {type: 'dissolve', symbol: 'tx-t-field', lead: .14, tail: .26, zoom: .2}},
      {id: 'bend', scene: 'tr-bend', accent: ORANGE, transition: {type: 'dissolve', symbol: 'tx-t-rail', lead: .14, tail: .26, zoom: .2}},
      {id: 'follow', scene: 'tr-follow', accent: MUSTARD, transition: {type: 'sheet', symbol: 'tx-s-storm', half: .22}},
      {id: 'guard', scene: 'tr-guard', accent: TERRA, transition: {type: 'dissolve', symbol: 'tx-t-dusk', lead: .14, tail: .26, zoom: .2}},
      {id: 'payoff', scene: 'tr-payoff', accent: '#ec8a2e'},
    ],
    css: css + `
      .piece-label { line-height:1.55 }
      .label-chip .piece-label { font-size:40px; padding:6px 20px }
      .label-plain .piece-label { font-size:44px; font-weight:800; text-shadow:0 2px 0 rgba(255,255,255,.65) }
      #k-tag-fat .piece-label, #b-tag-long .piece-label { color:#b5541c } #k-tag-thin .piece-label, #b-tag-short .piece-label { color:#2a5f99 }`,
    symbols: () => [
      // hillside
      sym('tr-sky', '0 0 1000 1600', skyArt('tr-g-sky', [[0, '#6e9fc8'], [.45, '#b4d2e3'], [.62, '#e9ecdc'], [1, '#f1ead2']], '#fbfaf5', '#aebfcc')),
      sym('tr-sky-dusk', '0 0 1000 1600', skyArt('tr-g-dusk', [[0, '#343a70'], [.35, '#9a5a80'], [.55, '#ec8a4a'], [.75, '#f6c46a'], [1, '#f8e2b0']], '#f3b48a', '#8a5a78')),
      sym('tr-far', '0 0 1000 1600', farArt('#94b6b8', '#78a08c', '#f1f6f4')),
      sym('tr-far-dusk', '0 0 1000 1600', farArt('#8a6f8e', '#6c5a78', '#e8b9a0')),
      sym('tr-mid', '0 0 1000 1600', midArt(false)), sym('tr-mid-dusk', '0 0 1000 1600', midArt(true)),
      sym('tr-track', '0 0 1000 1600', trackArt(false)), sym('tr-track-dusk', '0 0 1000 1600', trackArt(true)),
      sym('tr-train', '0 0 1000 1600', trainArt(.66)), sym('tr-train-far', '0 0 1000 1600', trainArt(.98)),
      sym('tr-train-dusk', '0 0 1000 1600', trainArt(.5, {dusk: true})), sym('tr-train-lights', '0 0 1000 1600', trainArt(.5, {dusk: true, lights: true})),
      sym('tr-glow', '0 0 1000 1600', railGlow()), sym('tr-bend-arrow', '0 0 1000 1600', bendArrow()),
      sym('tr-fence', '0 0 1000 1600', fenceArt(false)), sym('tr-fence-dusk', '0 0 1000 1600', fenceArt(true)),
      sym('tr-signal', '0 0 1000 1600', signalArt(false)), sym('tr-signal-dusk', '0 0 1000 1600', signalArt(true)),
      sym('tr-dusk-tint', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#f08a3a" opacity=".14"/><circle cx="820" cy="760" r="520" fill="#ffd38a" opacity=".16"/>`),
      art.parts('tr-girl', GIRL, {body: girlBody, mo: girlMouthO, ms: girlSmile, ad: girlArmDown, ap: girlArmPoint, ac: girlArmCone}),
      sym('tr-q', '0 0 200 200', question), sym('tr-steer', '0 0 220 220', steering), sym('tr-cross', '0 0 220 220', crossArt),
      // under the coach
      sym('tu-bg', '0 0 1000 1600', underBg), sym('tu-ground', '0 0 1000 1600', underGround(false)), sym('tu-rail', '0 0 1000 1600', railSide),
      sym('tu-wheel', '0 0 700 700', wheelSide()),
      sym('tu-flange-hl', '0 0 700 700', `<circle cx="350" cy="350" r="318" fill="none" stroke="${TERRA}" stroke-width="18" stroke-dasharray="44 16"/>`),
      sym('tu-lens', '0 0 440 440', lens), sym('tu-profile', '0 0 420 420', profileMini),
      sym('tu-connector', '0 0 1000 1600', art.connector([[290, 560], [250, 690], [205, 820]], {dash: '14 10', sag: 20, width: 5})),
      // along the track
      sym('tf-land', '0 0 1000 1600', frontLand(false)), sym('tf-land-storm', '0 0 1000 1600', frontLand(true)),
      sym('tf-track', '0 0 1000 1600', frontTrack(false)), sym('tf-track-storm', '0 0 1000 1600', frontTrack(true)),
      sym('tf-rails', '0 0 1000 1600', railHeads),
      sym('tf-wheel-l', '0 0 1000 1600', bogieBeam + wheelFront(RAILX[0])), sym('tf-wheel-r', '0 0 1000 1600', wheelFront(RAILX[1])),
      sym('tf-axle', '0 0 1000 1600', axleArt), sym('tf-bolts', '0 0 1000 1600', boltsArt),
      sym('tf-set', '0 0 1000 1600', wheelsetArt(false)), sym('tf-set-hi', '0 0 1000 1600', wheelsetArt(true)),
      sym('tf-spin', '0 0 300 300', spinArrow(MUSTARD)), sym('tf-left', '0 0 360 120', sideArrow(MUSTARD, true)), sym('tf-right', '0 0 360 120', sideArrow('#4f9a5a', false)),
      sym('tf-push', '0 0 360 120', sideArrow(TERRA, false)),
      sym('tf-tread-glow', '0 0 1000 1600', treadGlow), sym('tf-mark', '0 0 1000 1600', centreMark(false)), sym('tf-mark-lit', '0 0 1000 1600', centreMark(true)),
      sym('tf-wind', '0 0 1000 1600', windArt), sym('tf-rain', '0 0 1000 1600', rainArt), sym('tf-shield', '0 0 200 220', shield),
      sym('tf-catch', '0 0 1000 1600', `<ellipse cx="${RAILX[0] + 40}" cy="${CONTACT + 10}" rx="70" ry="54" fill="#ffd36e" opacity=".55"/><ellipse cx="${RAILX[0] + 40}" cy="${CONTACT + 10}" rx="70" ry="54" fill="none" stroke="${TERRA}" stroke-width="8" stroke-dasharray="18 10"/>`),
      // workshop
      sym('tw-wall', '0 0 1000 1600', wallArt), sym('tw-beam', '0 0 1000 1600', sunBeam), sym('tw-print', '0 0 1000 1600', blueprint), sym('tw-bench', '0 0 1000 1600', benchArt),
      sym('tw-cone', '0 0 640 300', coneArt), sym('tw-slope', '0 0 1000 1600', slopeLine),
      sym('tw-fat', '0 0 1000 1600', radiusArrow(372, ORANGE)), sym('tw-thin', '0 0 1000 1600', radiusArrow(720, BLUE)),
      // bird's-eye bend
      sym('tt-ground', '0 0 1000 1600', groundTop), sym('tt-track', '0 0 1000 1600', trackTop()), sym('tt-set', '0 0 1000 1600', wheelsetTop),
      sym('tt-fat', '0 0 1000 1600', fatGlow), sym('tt-long', '0 0 1000 1600', LONG), sym('tt-short', '0 0 1000 1600', SHORT), sym('tt-out', '0 0 360 120', outArrow),
      // transitions
      sym('tx-t-steel', '0 0 1000 1600', art.tileTexture(19, [STEEL, '#a39a8c', STEEL_D, '#c2bbb0', '#7c7266'])),
      sym('tx-s-front', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#f4efe4"/>${art.fibres(7, 90, 0, 0, 1000, 1600)}<path d="M500 420L180 1500M500 420L820 1500" stroke="${STEEL_D}" stroke-width="26"/>` +
        Array.from({length: 8}, (_, i) => { const y = 480 + i * i * 17; return `<path d="M${f(500 - (y - 420) * .42)} ${y}H${f(500 + (y - 420) * .42)}" stroke="#a39a8c" stroke-width="${8 + i * 3}"/>`; }).join('')),
      sym('tx-t-blue', '0 0 1000 1600', art.tileTexture(23, ['#2f5f8f', '#4f7fae', '#1d3f61', '#e9dcc4'])),
      sym('tx-s-blueprint', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#2f5f8f"/>` + Array.from({length: 21}, (_, i) => `<path d="M${i * 50} 0V1600M0 ${i * 80}H1000" stroke="#5a86b3" stroke-width="2"/>`).join('')),
      sym('tx-t-field', '0 0 1000 1600', art.tileTexture(29, ['#86ad5f', '#d9b94a', '#5f9a4f', '#4f8f50'])),
      sym('tx-t-rail', '0 0 1000 1600', art.tileTexture(31, [STEEL, ORANGE, BLUE, '#a39a8c'])),
      sym('tx-s-storm', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#5b6672"/>${windArt}`),
      sym('tx-t-dusk', '0 0 1000 1600', art.tileTexture(37, ['#ec8a4a', '#f6c46a', '#9a5a80', '#343a70'])),
    ].join(''),

    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, show, reveal, ambient} = motion;
      const kit = globalThis.paperKit.motion(ctx);
      const cue = id => ctx.cue(id), S = id => ctx.shot(id);
      const hideAt = (id, t, d = .2) => track(id, [key(t - d, N), key(t, [0, 0, 0, 1, 0])]);
      const label = (id, x, y, w, text, style = 'tag', extra = {}) => P(id, null, x, y, w, 5, {label: text, labelStyle: style, ...extra});
      const girl = (p, x, y, w, layer, arms) => [P(`${p}-body`, 'tr-girl-body', x, y, w, layer, {required: true}),
        ...arms.map(a => P(`${p}-${a}`, `tr-girl-${a}`, x, y, w, layer, {origin: '39% 41%'}))];
      const scenes = {};
      const hill = (p, dusk) => [plate(`${p}-sky`, dusk ? 'tr-sky-dusk' : 'tr-sky', 0), plate(`${p}-far`, dusk ? 'tr-far-dusk' : 'tr-far', 1),
        plate(`${p}-mid`, dusk ? 'tr-mid-dusk' : 'tr-mid', 2), plate(`${p}-track`, dusk ? 'tr-track-dusk' : 'tr-track', 3, 'exact')];

      // 1. curve (hook): a heavy train swings round the hillside bend; a girl at the fence wonders
      scenes['tr-hill'] = {objects: [...hill('c', false), plate('c-train', 'tr-train', 3, 'exact'), plate('c-bend', 'tr-bend-arrow', 4, 'exact'),
        P('c-steer', 'tr-steer', 30, 46, 20, 4), P('c-cross', 'tr-cross', 30, 46, 20, 4, {flat: true}),
        ...girl('c-girl', 78, 77.5, 25.5, 4, ['ad', 'ap', 'mo']), plate('c-fence', 'tr-fence', 5, 'exact'), plate('c-signal', 'tr-signal', 5, 'exact'),
        P('c-q', 'tr-q', 70, 54, 16, 5, {required: true})]};
      const c0 = S('curve').start, c1 = S('curve').end;
      track('c-train', [key(c0, [.075, -.04, 0, 1, 1]), key(c1, [0, 0, 0, 1, 1], 'linear')]);
      ambient('c-far', {drift: [.004, 9, 0]}); ambient('c-sky', {drift: [.006, 14, 1]});
      const bendAt = kit.when('train-bend', 'c-bend');
      show('c-bend', bendAt, [0, 0, 0, 1, 0], .05); reveal('c-bend', bendAt, bendAt + .9, 'leftward');
      track('c-bend', [key(bendAt, [0, 0, 0, 1, 0]), key(bendAt + .05, N), key(cue('no-steer') - .3, N), key(cue('no-steer'), [0, 0, 0, 1, 0])]);
      const st = kit.settle('c-steer', 'no-steer', [0, .03, -60, .5, 0], .5);
      ambient('c-steer', {sway: [6, 1.6, 0]});
      kit.settle('c-cross', 'steer-x', [0, 0, 0, 1.4, 0], .3);
      const fadeOut = cue('girl-q') - .9;
      track('c-steer', [key(st, [0, .03, -60, .5, 0]), key(st + .5, N, 'out'), key(fadeOut, N), key(fadeOut + .4, [0, -.02, 20, .7, 0])]);
      track('c-cross', [key(cue('steer-x'), [0, 0, 0, 1.4, 0]), key(cue('steer-x') + .3, N, 'out'), key(fadeOut, N), key(fadeOut + .4, [0, -.02, 20, .7, 0])]);
      const q = cue('girl-q');
      hideAt('c-girl-ad', q, .15);
      track('c-girl-ap', [key(c0, [0, 0, 0, 1, 0]), key(q - .15, [0, 0, 0, 1, 0]), key(q - .05, [0, 0, 30, 1, 1]), key(q + .35, N, 'out')]);
      ambient('c-girl-body', {breathe: [.006, 2.6, 0]});
      kit.settle('c-q', 'girl-q', [0, .04, -14, .4, 0], .4);
      ambient('c-q', {bob: [.006, 2.4, 0]});

      // 2. myth: rail level beside the coach, the big wheel rolling
      scenes['tr-under'] = {objects: [plate('m-bg', 'tu-bg', 0), plate('m-ground', 'tu-ground', 2), P('m-wheel', 'tu-wheel', 50, 58.2, 62, 2),
        P('m-flange-ring', 'tu-flange-hl', 50, 58.2, 62, 2, {flat: true}), plate('m-rail', 'tu-rail', 3, 'exact'),
        plate('m-conn', 'tu-connector', 4, 'exact'), label('m-tag-flange', 24, 33, 22, 'అంచు', 'chip'),
        P('m-lens', 'tu-lens', 57, 72, 40, 4, {required: true}), P('m-profile', 'tu-profile', 52.6, 68, 36, 5, {flat: true, required: true})]};
      ambient('m-wheel', {spin: 38}); ambient('m-flange-ring', {spin: 38});
      const m0 = S('myth').start, m1 = S('myth').end;
      track('m-ground', [key(m0, [.04, 0, 0, 1, 1]), key(m1, [-.04, 0, 0, 1, 1], 'linear')]);
      track('m-bg', [key(m0, [.01, 0, 0, 1, 1]), key(m1, [-.01, 0, 0, 1, 1], 'linear')]);
      const fl = kit.when('flange-ring', 'm-flange-ring');
      track('m-flange-ring', [key(fl, [0, 0, 0, .9, 0]), key(fl + .35, N, 'out'), key(cue('secret-lens') - .4, N), key(cue('secret-lens'), [0, 0, 0, 1, .25])]);
      kit.draw('m-conn', fl + .3, .4, 'up'); track('m-conn', [key(fl + .3, N), key(cue('secret-lens') - .4, N), key(cue('secret-lens'), [0, 0, 0, 1, 0])]);
      kit.label('m-tag-flange', fl + .5, cue('secret-lens') - .3);
      kit.settle('m-lens', 'secret-lens', [.1, .04, 20, .8, 0], .6);
      ambient('m-lens', {bob: [.004, 2.2, 0]});
      kit.draw('m-profile', 'shape-trace', .7, 'rightward');
      ambient('m-profile', {bob: [.004, 2.2, 0]});

      // 3. axle: looking along the track at the wheelset
      scenes['tr-axle'] = {objects: [plate('x-land', 'tf-land', 0), plate('x-track', 'tf-track', 1, 'exact'), plate('x-rails', 'tf-rails', 2, 'exact'),
        plate('x-left', 'tf-wheel-l', 3, 'exact'), plate('x-right', 'tf-wheel-r', 3, 'exact'), plate('x-axle', 'tf-axle', 3, 'exact'), plate('x-bolts', 'tf-bolts', 4, 'exact'),
        P('x-spin', 'tf-spin', 30, 24, 18, 4), P('x-spin2', 'tf-spin', 70, 24, 18, 4), label('x-tag-axle', 50, 60, 24, 'ఇరుసు', 'chip')]};
      const x0 = S('axle').start;
      kit.settle('x-left', x0, [-.05, .02, 0, 1, 0], .45);
      kit.settle('x-right', 'two-wheels', [.06, .02, 0, 1, 0], .55);
      const ax = kit.when('axle-in', 'x-axle');
      show('x-axle', ax, [0, 0, 0, 1, 0], .05); reveal('x-axle', ax, ax + .6, 'rightward', .32, .68);
      kit.label('x-tag-axle', ax + .5);
      kit.settle('x-bolts', 'clamped', [0, 0, 0, 1.25, 0], .3);
      const tt = kit.settle('x-spin', 'turn-together', [0, 0, -40, .6, 0], .4);
      kit.settle('x-spin2', tt, [0, 0, -40, .6, 0], .4);
      ambient('x-spin', {spin: 160}); ambient('x-spin2', {spin: 160});

      // 4. cone: a workshop blueprint of the wheel, an ice-cream cone laid on the tread
      scenes['tr-cone'] = {objects: [plate('k-wall', 'tw-wall', 0), plate('k-print', 'tw-print', 1, 'exact'), plate('k-bench', 'tw-bench', 3),
        P('k-cone', 'tw-cone', 50, 52.5, 64, 2, {required: true}), plate('k-slope', 'tw-slope', 3, 'exact'), plate('k-fat', 'tw-fat', 4, 'exact'), plate('k-thin', 'tw-thin', 4, 'exact'),
        plate('k-beam', 'tw-beam', 4, 'exact'), label('k-tag-fat', 22, 47, 22, 'లావుగా', 'chip'), label('k-tag-thin', 76, 41, 20, 'సన్నగా', 'chip')]};
      ambient('k-beam', {flicker: [.25, 5, 0]});
      kit.settle('k-cone', 'cone-in', [-.1, .3, -40, .6, 0], .7, [0, 0, 0, 1, .82]);
      kit.draw('k-slope', 'slope-line', .8, 'rightward');
      const fa = kit.when('fat-side', 'k-fat');
      show('k-fat', fa, [0, 0, 0, 1, 0], .05); reveal('k-fat', fa, fa + .5, 'down'); kit.label('k-tag-fat', fa + .3);
      const th = kit.when('thin-side', 'k-thin');
      show('k-thin', th, [0, 0, 0, 1, 0], .05); reveal('k-thin', th, th + .4, 'down'); kit.label('k-tag-thin', th + .25);

      // 5. centre: the wheelset drifts and glides back to the chalk centre mark
      scenes['tr-centre'] = {objects: [plate('n-land', 'tf-land', 0), plate('n-track', 'tf-track', 1, 'exact'), plate('n-mark0', 'tf-mark', 2, 'exact'), plate('n-mark', 'tf-mark-lit', 2, 'exact'),
        plate('n-rails', 'tf-rails', 2, 'exact'), plate('n-set', 'tf-set', 3, 'exact'), plate('n-slope', 'tf-tread-glow', 4, 'exact'),
        P('n-drift', 'tf-left', 50, 30, 30, 5), P('n-back', 'tf-right', 50, 30, 30, 5), label('n-tag', 50, 86, 30, 'మధ్యలోకి', 'chip')]};
      const dr = cue('drift'), back = cue('to-middle');
      const setKeys = [key(S('centre').start, N), key(dr - .1, N), key(dr + .55, [-.045, 0, -.6, 1, 1], 'out'), key(back - .1, [-.045, 0, -.6, 1, 1]),
        key(back + .8, [.006, 0, .15, 1, 1], 'out'), key(back + 1.4, N, 'smooth')];
      track('n-set', setKeys);
      kit.when('slope-acts', 'n-slope');
      track('n-slope', [key(dr - .1, [0, 0, 0, 1, 0]), key(cue('slope-acts'), [-.045, 0, -.6, 1, 0]), key(cue('slope-acts') + .3, [-.045, 0, -.6, 1, 1]),
        key(back - .1, [-.045, 0, -.6, 1, 1]), key(back + .8, [.006, 0, .15, 1, 1], 'out'), key(back + 1.4, [0, 0, 0, 1, .6], 'smooth')]);
      kit.when('drift', 'n-drift'); track('n-drift', [key(dr, [.05, 0, 0, .8, 0]), key(dr + .4, N, 'out'), key(back - .3, N), key(back, [0, 0, 0, .9, 0])]);
      kit.settle('n-back', 'to-middle', [-.05, 0, 0, .8, 0], .4);
      kit.pulse('n-mark', 'settled', 99, .35, .1);
      kit.label('n-tag', cue('settled') + .2);

      // 6. bend: bird's-eye view of the wheelset on a curve
      scenes['tr-bend'] = {objects: [plate('b-ground', 'tt-ground', 0), plate('b-track', 'tt-track', 1), plate('b-set', 'tt-set', 3),
        plate('b-fat', 'tt-fat', 4), plate('b-long', 'tt-long', 2), plate('b-short', 'tt-short', 2), P('b-out', 'tt-out', 22, 50, 24, 5),
        label('b-tag-fat', 22, 66, 26, 'లావైన భాగం', 'chip'), label('b-tag-long', 27, 20, 30, 'ఎక్కువ దూరం', 'plain'), label('b-tag-short', 76, 28, 30, 'తక్కువ దూరం', 'plain')]};
      const so = cue('shift-out');
      track('b-set', [key(S('bend').start, N), key(so, N), key(so + .6, [-.022, 0, 0, 1, 1], 'out')]);
      kit.when('shift-out', 'b-out');
      track('b-out', [key(so, [.05, 0, 0, .8, 0]), key(so + .4, N, 'out'), key(cue('outer-fat') - .4, N), key(cue('outer-fat'), [0, 0, 0, .9, 0])]);
      const of = kit.when('outer-fat', 'b-fat');
      track('b-fat', [key(of, [-.022, 0, 0, 1, 0]), key(of + .35, [-.022, 0, 0, 1, 1]), key(cue('long-tape') - .2, [-.022, 0, 0, 1, 1]), key(cue('long-tape') + .4, [-.022, 0, 0, 1, .45])]);
      kit.label('b-tag-fat', of + .3, cue('long-tape') - .4);
      const lt = kit.when('long-tape', 'b-long');
      show('b-long', lt, [0, 0, 0, 1, 0], .05); reveal('b-long', lt, lt + 1.4, 'up', .38, 1);
      kit.label('b-tag-long', lt + 1.0, ctx.plan.shots.find(s => s.id === 'bend').camera[1].seconds - .25);
      const sh = kit.when('short-tape', 'b-short');
      show('b-short', sh, [0, 0, 0, 1, 0], .05); reveal('b-short', sh, sh + 1.1, 'up', .62, 1);
      kit.label('b-tag-short', sh + .8);

      // 7. follow: back on the hillside, the train glides round the bend
      scenes['tr-follow'] = {objects: [...hill('f', false), plate('f-train', 'tr-train-far', 3, 'exact'), plate('f-glow', 'tr-glow', 3, 'exact'),
        ...girl('f-girl', 78, 77.5, 25.5, 4, ['ad', 'ms']), plate('f-fence', 'tr-fence', 5, 'exact'), plate('f-signal', 'tr-signal', 5, 'exact')]};
      const f0 = S('follow').start, f1 = S('follow').end;
      track('f-train', [key(f0, [.06, -.03, 0, 1, 1]), key(f1, [-.02, .015, 0, 1, 1], 'linear')]);
      const fo = kit.when('follows', 'f-glow');
      show('f-glow', fo, [0, 0, 0, 1, 0], .05); reveal('f-glow', fo, fo + .8, 'leftward');
      ambient('f-girl-body', {breathe: [.006, 2.6, 0]});

      // 8. guard: a gust shoves the wheelset; the flange catches it
      scenes['tr-guard'] = {objects: [plate('g-land', 'tf-land-storm', 0), plate('g-track', 'tf-track-storm', 1, 'exact'), plate('g-rails', 'tf-rails', 2, 'exact'),
        plate('g-set', 'tf-set', 3, 'exact'), plate('g-set-hi', 'tf-set-hi', 3, 'exact'), plate('g-catch', 'tf-catch', 4, 'exact'), plate('g-rain', 'tf-rain', 4),
        plate('g-wind', 'tf-wind', 5, 'exact'), P('g-push', 'tf-push', 50, 26, 30, 5), P('g-shield', 'tf-shield', 22, 54, 15, 5), label('g-tag', 22, 41, 20, 'రక్షణ', 'chip')]};
      ambient('g-rain', {bob: [.012, .5, 0]});
      const gu = kit.when('gust', 'g-wind');
      track('g-wind', [key(gu, [-.3, 0, 0, 1, 0]), key(gu + .5, [0, 0, 0, 1, 1], 'out'), key(gu + 2.4, [.12, 0, 0, 1, .7]), key(gu + 3.2, [.25, 0, 0, 1, 0])]);
      const sv = kit.when('shove', 'g-push');
      kit.settle('g-push', sv, [-.06, 0, 0, .8, 0], .35);
      const setMove = (op) => [key(S('guard').start, [0, 0, 0, 1, op]), key(sv, [0, 0, 0, 1, op]), key(sv + .45, [.034, 0, .5, 1, op], 'out'), key(sv + .7, [.03, 0, .3, 1, op])];
      track('g-set', setMove(1));
      const fc = kit.when('flange-catch', 'g-shield');
      track('g-set-hi', [...setMove(0), key(fc - .2, [.03, 0, .3, 1, 0]), key(fc + .1, [.03, 0, .3, 1, 1])]);
      track('g-catch', [key(fc - .2, [.03, 0, 0, 1, 0]), key(fc + .1, [.03, 0, 0, 1, 1])]);
      kit.settle('g-shield', 'flange-catch', [0, .03, -20, .5, 0], .45);
      kit.label('g-tag', fc + .3);

      // 9. payoff: the same hillside at dusk; the girl smiles and holds up an ice-cream cone
      scenes['tr-payoff'] = {objects: [...hill('p', true), plate('p-train0', 'tr-train-dusk', 3, 'exact'), plate('p-train', 'tr-train-lights', 3, 'exact'),
        plate('p-tint', 'tr-dusk-tint', 4), ...girl('p-girl', 78, 77.5, 25.5, 4, ['ad', 'ac', 'ms']), plate('p-fence', 'tr-fence-dusk', 5, 'exact'), plate('p-signal', 'tr-signal-dusk', 5, 'exact')]};
      const p0 = S('payoff').start, p1 = S('payoff').end;
      const trainMove = op => [key(p0, [.03, -.015, 0, 1, op]), key(p1, [-.01, .005, 0, 1, op], 'linear')];
      track('p-train0', trainMove(1));
      const dt = kit.when('dusk-train', 'p-train');
      track('p-train', [...trainMove(0).slice(0, 1), key(dt, [.03 - .04 * (dt - p0) / (p1 - p0), -.015 + .02 * (dt - p0) / (p1 - p0), 0, 1, 0]), key(dt + .35, [.03 - .04 * (dt + .35 - p0) / (p1 - p0), -.015 + .02 * (dt + .35 - p0) / (p1 - p0), 0, 1, 1]), key(p1, [-.01, .005, 0, 1, 1], 'linear')]);
      const cu = kit.when('cone-up', 'p-girl-ac');
      hideAt('p-girl-ad', cu, .12);
      track('p-girl-ac', [key(p0, [0, 0, 0, 1, 0]), key(cu, [0, 0, 25, 1, 0]), key(cu + .08, [0, 0, 25, 1, 1]), key(cu + .4, N, 'out')]);
      ambient('p-girl-body', {breathe: [.006, 2.6, 0]});

      // Camera: the plan's moments (timing) with this video's own framing.
      const cam = (id, startView, views, endView) => {
        const keys = kit.planCamera(id, views), s = S(id);
        return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0), ...(endView ? [key(s.end, endView, 'out')] : [])];
      };
      const cameras = {
        curve: cam('curve', [.02, -.03, 1.06], [[0, .06, 1.16, 'smooth']], [-.01, .07, 1.18]),
        myth: cam('myth', [0, -.02, 1.02], [[.02, .09, 1.22, 'smooth']], [.02, .095, 1.24]),
        axle: cam('axle', [0, .03, 1.16], [[0, .015, 1.05, 'smooth']], [0, .015, 1.04]),
        cone: cam('cone', [0, -.03, 1.04], [[0, .04, 1.14, 'smooth']], [0, .045, 1.16]),
        centre: cam('centre', [0, .02, 1.06], [[0, .05, 1.14, 'smooth']], [0, .05, 1.15]),
        bend: cam('bend', [0, .06, 1.12], [[-.03, -.06, 1.08, 'smooth'], [.04, -.03, 1.1, 'smooth']], [.04, -.03, 1.1]),
        follow: cam('follow', [-.02, .05, 1.14], [[0, .01, 1.02, 'smooth']], [0, 0, 1.0]),
        guard: cam('guard', [0, .02, 1.06], [[-.13, .1, 1.38, 'smooth']], [-.14, .1, 1.4]),
        payoff: [key(S('payoff').start, [0, 0, 1.02]), key(S('payoff').end, [.03, .04, 1.08], 'smooth')],
      };
      const k = (name, t) => [name, t];
      return {scenes, cameras, checks: {keyframes: [
        k('curve-open', .6), k('curve-steer', cue('steer-x') + .6), k('curve-question', cue('girl-q') + .5),
        k('myth-flange', cue('flange-ring') + .9), k('myth-lens', cue('shape-trace') + .8),
        k('axle-spin', cue('turn-together') + .8), k('cone-cone', cue('slope-line') + 1.0), k('cone-arrows', cue('thin-side') + .5),
        k('centre-drift', cue('slope-acts') + .6), k('centre-settled', cue('settled') + .6),
        k('bend-fat', cue('outer-fat') + .8), k('bend-tapes', cue('short-tape') + 1.4),
        k('follow', cue('follows') + .9), k('guard-catch', cue('flange-catch') + .5), k('payoff', cue('cone-up') + .4)]}};
    },
  };
})();
