// P014.10 "Why does the sky appear blue?" (hi-IN): original cut-paper topic module for the Paper Explainer backend.
// All artwork is original inline SVG made for this video. Shot bounds and every speech moment come from
// plan/resolved-plan.json (render with --plan); no speech timestamps are typed here.
(() => {
  const {f, rnd, blob, sym} = globalThis.paperShotArt;
  const {art, css} = globalThis.paperKit;
  const INK = '#252A30', PAPER = '#fff9ee';
  const RAINBOW = ['#d94a3a', '#ec8a2e', '#f2c94c', '#4f9a5a', '#2f6fb6', '#3c4a9e', '#7a4fb0'];
  const BLUE = '#2f6fb6', BLUE2 = '#5d9bd6', RED = '#BF5942', VIOLET = '#7a4fb0';

  // ---------- topic art helpers ----------
  const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) =>
    `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  // Short paper dashes radiating from (cx, cy): the scattered-light motif.
  const burst = (seed, cx, cy, n, r0, r1, colors, width = 9, spread = 1) => Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 * spread + rnd(seed + i) * .5, ra = r0 + rnd(seed + 40 + i) * 18, rb = r1 - rnd(seed + 80 + i) * (r1 - r0) * .35;
    return `<path d="M${f(cx + Math.cos(a) * ra)} ${f(cy + Math.sin(a) * ra)}L${f(cx + Math.cos(a) * rb)} ${f(cy + Math.sin(a) * rb)}" stroke="${colors[i % colors.length]}" stroke-width="${width}" stroke-linecap="round"/>`;
  }).join('');
  // Scattered flecks over a box (blue light coming from everywhere).
  const flecks = (seed, n, x, y, w, h, colors, len = 22, width = 7) => Array.from({length: n}, (_, i) => {
    const px = x + rnd(seed + i) * w, py = y + rnd(seed + 300 + i) * h, a = rnd(seed + 600 + i) * Math.PI;
    return `<path d="M${f(px)} ${f(py)}l${f(Math.cos(a) * len)} ${f(Math.sin(a) * len)}" stroke="${colors[i % colors.length]}" stroke-width="${width}" stroke-linecap="round" opacity="${f(.65 + rnd(seed + 900 + i) * .35)}"/>`;
  }).join('');
  const wave = (x0, x1, y, amp, len, color, width) => {
    let d = `M${x0} ${y}`;
    for (let x = x0 + 4; x <= x1; x += 4) d += `L${x} ${f(y + Math.sin((x - x0) / len * Math.PI * 2) * amp)}`;
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const molecule = (cx, cy, r, seed, fill = '#eef4f8') => `<path d="${blob(cx + 5, cy + 7, r, r, 10, .06, seed)}" fill="#9fb3c4"/>` +
    `<path d="${blob(cx, cy, r, r, 10, .06, seed + 2)}" fill="${fill}" stroke="${INK}" stroke-width="3"/><circle cx="${f(cx - r * .35)}" cy="${f(cy - r * .35)}" r="${f(r * .22)}" fill="#fff" opacity=".8"/>`;
  const sunArt = (core, rim, glow) => `<circle cx="150" cy="150" r="138" fill="${glow}" opacity=".35"/><circle cx="150" cy="150" r="104" fill="${glow}" opacity=".45"/>` +
    `<path d="${blob(154, 156, 76, 76, 16, .04, 3)}" fill="${rim}"/><path d="${blob(150, 150, 74, 74, 16, .04, 5)}" fill="${core}" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M108 128Q126 96 160 92" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"/>`;
  const rays = color => Array.from({length: 12}, (_, i) => {
    const a = i / 12 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    return `<path d="M${f(150 + c * 92)} ${f(150 + s * 92)}L${f(150 + c * 140 - s * 9)} ${f(150 + s * 140 + c * 9)}L${f(150 + c * 140 + s * 9)} ${f(150 + s * 140 - c * 9)}Z" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  }).join('');
  // Child seen from behind (kurta, dark hair). Shared frame 0 0 220 380 so the arms are separate, animatable parts.
  const KID = '0 0 220 380';
  const kidBody = `<path d="M70 360L78 262H142L150 360Z" fill="#59758D" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M62 266Q60 170 110 150Q160 170 158 266Z" fill="${RED}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M80 200Q110 214 140 200" fill="none" stroke="#9c4434" stroke-width="5"/>` +
    `<path d="M96 152Q110 142 124 152L120 162H100Z" fill="#c98f6a" stroke="${INK}" stroke-width="3"/>` +
    `<path d="${blob(110, 104, 46, 50, 14, .05, 21)}" fill="#2b2420" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M76 92Q92 70 120 66" fill="none" stroke="#4a3d35" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M88 360h20M112 360h20" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`;
  const kidArmDown = `<path d="M150 178Q172 222 168 262" fill="none" stroke="${RED}" stroke-width="22" stroke-linecap="round"/><circle cx="168" cy="268" r="11" fill="#c98f6a" stroke="${INK}" stroke-width="3"/>`;
  const kidArmUp = `<path d="M146 176Q176 132 196 70" fill="none" stroke="${RED}" stroke-width="22" stroke-linecap="round"/><circle cx="198" cy="60" r="11" fill="#c98f6a" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M198 50l6 -26" stroke="#c98f6a" stroke-width="7" stroke-linecap="round"/>`;
  const question = `<path d="${blob(100, 104, 86, 78, 16, .1, 8)}" fill="${PAPER}" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M74 82Q76 46 104 46Q134 48 132 76Q130 96 106 104Q100 108 100 124" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><circle cx="100" cy="150" r="9" fill="${INK}"/>`;
  const skyNoon = `<defs>${grad('sk-g-noon', [[0, '#2a64ad'], [.45, '#4f8fd0'], [.75, '#8fc0e6'], [1, '#d5e8f2']])}</defs>` +
    `<rect width="1000" height="1600" fill="url(#sk-g-noon)"/>${art.fibres(11, 70, 0, 0, 1000, 1200, '#ffffff', .18)}`;
  const skyDusk = `<defs>${grad('sk-g-dusk', [[0, '#3a3f7a'], [.35, '#a0567a'], [.62, '#ec8a4a'], [.85, '#f6c46a'], [1, '#f8e2b0']])}</defs>` +
    `<rect width="1000" height="1600" fill="url(#sk-g-dusk)"/>${art.fibres(13, 70, 0, 0, 1000, 1200, '#fff3d6', .2)}`;
  const town = (tone, window, seed) => `<path d="M0 1210V1090h70v-40h60v70h50v-110h90v60h40v-90l30-40 30 40v90h60v-60h80v120h40v-70h70v-50h60v80h60v-120h50l20-60 20 60h40v150h70v-80h60V1210Z" fill="${tone}"/>` +
    Array.from({length: 26}, (_, i) => `<rect x="${f(20 + rnd(seed + i) * 950)}" y="${f(1060 + rnd(seed + 50 + i) * 120)}" width="12" height="16" fill="${window}" opacity=".7"/>`).join('') +
    `<path d="M0 1215Q250 1180 500 1205T1000 1195V1240H0Z" fill="${tone}" opacity=".7"/>`;
  const rooftop = (wall, floor, cap) => `<path d="M0 1268H1000V1600H0Z" fill="${floor}"/>${art.fibres(41, 60, 0, 1280, 1000, 300, '#b9a888', .45)}` +
    `<path d="M0 1262L1000 1252V1296L0 1306Z" fill="#a8977a" opacity=".6"/>` +
    `<path d="M0 1188H1000V1262H0Z" fill="${wall}" stroke="${INK}" stroke-width="4"/><path d="M-6 1176H1006V1196H-6Z" fill="${cap}" stroke="${INK}" stroke-width="4"/>` +
    Array.from({length: 9}, (_, i) => `<path d="M${50 + i * 115} 1206v40" stroke="#a8977a" stroke-width="5" opacity=".7"/>`).join('') +
    // water tank on a stand
    `<path d="M92 1176V1120M232 1176V1120" stroke="${INK}" stroke-width="10"/><path d="M80 1128H244V1112H80Z" fill="#6c7176" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M96 1112V950Q162 924 228 950V1112Q162 1130 96 1112Z" fill="#30343a" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M96 990Q162 1010 228 990M96 1040Q162 1060 228 1040" fill="none" stroke="#4b5058" stroke-width="5"/><path d="M118 950Q162 934 206 950" fill="none" stroke="#5c626b" stroke-width="6"/>` +
    `<path d="M150 935h24v-14h-24Z" fill="#4b5058" stroke="${INK}" stroke-width="3"/>` +
    // tulsi pot
    `<path d="M800 1176L812 1110H900L912 1176Z" fill="#c26a3e" stroke="${INK}" stroke-width="4"/><path d="M806 1112H906V1094H806Z" fill="#d98756" stroke="${INK}" stroke-width="3"/>` +
    Array.from({length: 9}, (_, i) => `<path d="M856 1094Q${830 + i * 7} ${1050 - (i % 3) * 18} ${808 + i * 11} ${1022 - (i % 4) * 14}" fill="none" stroke="#3f7a4f" stroke-width="6" stroke-linecap="round"/><circle cx="${808 + i * 11}" cy="${1022 - (i % 4) * 14}" r="9" fill="#5a9a62" stroke="${INK}" stroke-width="2"/>`).join('');
  const clothes = `<path d="M244 1000Q600 1060 980 1004" fill="none" stroke="${INK}" stroke-width="3"/><path d="M980 1000V1176" stroke="${INK}" stroke-width="8"/>` +
    `<path d="M380 1026l70 6-8 120-58 -8Z" fill="#e8873a" stroke="${INK}" stroke-width="3"/><path d="M386 1050l60 5M384 1080l58 5" stroke="#c96b25" stroke-width="4"/>` +
    `<path d="M520 1036h90l12 30-18 4v80h-66v-80l-18-4Z" fill="#8fb0bf" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M680 1030l64-2 4 70-30 12-34-10Z" fill="#DAB357" stroke="${INK}" stroke-width="3"/>`;
  const cloud = seed => art.layered(150, 80, 120, 42, {seed, fill: '#fbfaf5', under: '#c9dcea', edge: '#b8cad8', depth: [6, 10], n: 14, amp: .16});
  const dashFrame = (x0, y0, x1, y1, color, w = 6) => `<path d="M${x0} ${y0}L${x1} ${y1}" stroke="${color}" stroke-width="${w}" stroke-dasharray="14 12" stroke-linecap="round"/>`;

  globalThis.paperTopic = {
    shots: [
      {id: 'rooftop', scene: 'sk-rooftop', accent: '#2f6fb6', transition: {type: 'dissolve', symbol: 'sk-t-rainbow', lead: .14, tail: .26, zoom: .22}},
      {id: 'prism', scene: 'sk-prism', accent: '#DAB357', transition: {type: 'sheet', symbol: 'sk-t-air', half: .22}},
      {id: 'air', scene: 'sk-air', accent: '#5d9bd6'},
      {id: 'waves', scene: 'sk-waves', accent: '#2f6fb6', transition: {type: 'sheet', symbol: 'sk-t-flecks', half: .22}},
      {id: 'whole-sky', scene: 'sk-whole', accent: '#2f6fb6', transition: {type: 'dissolve', symbol: 'sk-t-violet', lead: .14, tail: .26, zoom: .2}},
      {id: 'violet', scene: 'sk-violet', accent: '#7a4fb0', transition: {type: 'sheet', symbol: 'sk-t-warm', half: .22}},
      {id: 'sunset', scene: 'sk-sunset', accent: '#ec8a2e', transition: {type: 'dissolve', symbol: 'sk-t-warm-tiles', lead: .14, tail: .26, zoom: .2}},
      {id: 'dusk', scene: 'sk-dusk', accent: '#BF5942'},
    ],
    css: css + `
      #r-tag-white .piece-label, #p-tag-beam .piece-label { border-left-color:#DAB357 }
      #w-tag-blue .piece-label { color:${BLUE} } #w-tag-red .piece-label { color:${RED} }
      #v-tag-violet .piece-label { color:${VIOLET} } #v-tag-blue .piece-label { color:${BLUE} }
      .label-chip .piece-label { font-size:36px; padding:4px 18px }`,
    symbols: () => [
      // shared
      sym('sk-sky-noon', '0 0 1000 1600', skyNoon),
      sym('sk-sky-dusk', '0 0 1000 1600', skyDusk),
      sym('sk-town', '0 0 1000 1600', town('#8ea6bd', '#d8e6f0', 7)),
      sym('sk-town-dusk', '0 0 1000 1600', town('#5b4a63', '#f6c46a', 7)),
      sym('sk-roof', '0 0 1000 1600', rooftop('#efe4cf', '#d9ccb2', '#f6efe1')),
      sym('sk-roof-dusk', '0 0 1000 1600', rooftop('#d8b89a', '#b99a80', '#e6c9a8')),
      sym('sk-clothes', '0 0 1000 1600', clothes),
      sym('sk-cloud-a', '0 0 300 160', cloud(31)), sym('sk-cloud-b', '0 0 300 160', cloud(47)),
      sym('sk-sun', '0 0 300 300', sunArt('#fff6d8', '#f2d98a', '#fff1b8')),
      sym('sk-sun-rays', '0 0 300 300', rays('#fffbea')),
      sym('sk-sun-dusk', '0 0 300 300', sunArt('#f39a4a', '#d9643a', '#f6b36a')),
      art.parts('sk-kid', KID, {body: kidBody, down: kidArmDown, up: kidArmUp}),
      sym('sk-q', '0 0 200 200', question),
      // prism room
      sym('sk-room', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#222b40"/>${art.fibres(5, 90, 0, 0, 1000, 1600, '#3a4560', .6)}` +
        `<path d="M30 250H150V470H30Z" fill="#f6e6b0" stroke="${INK}" stroke-width="5"/><path d="M30 360H150M90 250V470" stroke="#c9a85a" stroke-width="6"/>` +
        `<path d="M0 1240H1000V1600H0Z" fill="#7a5638"/><path d="M0 1240H1000V1262H0Z" fill="#9a7048"/>${art.fibres(9, 50, 0, 1270, 1000, 300, '#5e412a', .6)}`),
      sym('sk-beam', '0 0 1000 1600', `<defs>${grad('sk-g-beam', [[0, '#fffdf2', .95], [1, '#fff6d8', .85]], 1, 0)}</defs>` +
        `<path d="M140 330L150 392L462 880L470 820Z" fill="url(#sk-g-beam)" stroke="#e9dcae" stroke-width="2"/>`),
      sym('sk-beam-hidden', '0 0 1000 1600', RAINBOW.map((c, i) => `<path d="M${144 + i * 1.3} ${342 + i * 7}L${463 + i * 1} ${830 + i * 7}" stroke="${c}" stroke-width="3.5" opacity=".75"/>`).join('')),
      sym('sk-prism', '0 0 300 280', `<path d="M150 18L284 258H16Z" fill="#cfe6ee" opacity=".9" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
        `<path d="M150 18L150 258L16 258Z" fill="#e8f4f7" opacity=".85"/><path d="M150 18L284 258H150Z" fill="#a9cfdc" opacity=".8"/>` +
        `<path d="M150 18L284 258H16Z" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M120 90L70 190" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/>`),
      sym('sk-fan', '0 0 1000 1600', RAINBOW.map((c, i) => {
        const y0 = 838 + i * 7, y1a = 700 + i * 72, y1b = y1a + 62;
        return `<path d="M538 ${y0}L1000 ${y1a}L1000 ${y1b}L538 ${y0 + 7}Z" fill="${c}" opacity=".92"/>`;
      }).join('') + `<path d="M538 838L1000 700" stroke="#fff" stroke-width="3" opacity=".5"/>`),
      // air
      sym('sk-air', '0 0 1000 1600', `<defs>${grad('sk-g-air', [[0, '#9cc6e8'], [1, '#dcecf6']])}</defs><rect width="1000" height="1600" fill="url(#sk-g-air)"/>${art.fibres(17, 80, 0, 0, 1000, 1600, '#ffffff', .25)}`),
      sym('sk-air-beam', '0 0 1000 1600', `<path d="M0 160L0 250L470 820L520 770Z" fill="#fffdf2" opacity=".9"/>${RAINBOW.map((c, i) => `<path d="M0 ${180 + i * 10}L${480 + i * 4} ${790 + i * 4}" stroke="${c}" stroke-width="2.5" opacity=".45"/>`).join('')}`),
      sym('sk-dots', '0 0 1000 1600', Array.from({length: 34}, (_, i) => {
        const x = 60 + rnd(70 + i) * 880, y = 120 + rnd(170 + i) * 1360;
        return Math.hypot(x - 500, y - 800) < 170 ? '' : molecule(x, y, 13 + rnd(270 + i) * 9, 400 + i);
      }).join('')),
      sym('sk-mol', '0 0 200 200', molecule(100, 100, 52, 9, '#f4f8fb')),
      sym('sk-burst', '0 0 1000 1600', burst(3, 500, 800, 26, 90, 300, [BLUE, BLUE2, BLUE, '#3c4a9e', BLUE2, BLUE, '#4f9a5a', BLUE, BLUE2, RED], 12)),
      // waves
      sym('sk-lanes', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#f4efe4"/>${art.fibres(23, 80, 0, 0, 1000, 1600)}` +
        `<path d="${blob(500, 560, 520, 190, 18, .03, 4)}" fill="#dbe8f4"/><path d="${blob(500, 1080, 520, 190, 18, .03, 6)}" fill="#f4ddd4"/>` +
        `${molecule(600, 560, 34, 12)}${molecule(600, 1080, 34, 14)}`),
      sym('sk-wave-blue', '0 0 1000 1600', wave(40, 566, 560, 58, 82, BLUE, 14)),
      sym('sk-wave-red', '0 0 1000 1600', wave(40, 980, 1080, 70, 300, RED, 14)),
      sym('sk-splinter', '0 0 1000 1600', burst(9, 600, 560, 22, 60, 240, [BLUE, BLUE2, '#3c4a9e'], 11) +
        `<path d="M600 1080l64 -34M600 1080l-40 -58" stroke="${RED}" stroke-width="8" stroke-linecap="round" opacity=".55"/>`),
      // whole sky
      sym('sk-flecks', '0 0 1000 1600', flecks(5, 90, 20, 40, 960, 1000, [BLUE, BLUE2, '#3c4a9e', '#7fb2e0'], 26, 8)),
      sym('sk-to-eyes', '0 0 1000 1600', [[60, 120], [260, 60], [520, 80], [800, 110], [960, 330], [930, 640], [60, 520], [140, 860], [720, 800]]
        .map(([x, y]) => dashFrame(x, y, 400, 1010, BLUE, 7)).join('') + `<circle cx="400" cy="1010" r="16" fill="${BLUE2}" opacity=".6"/>`),
      sym('sk-glow', '0 0 1000 1600', `<defs><radialGradient id="sk-g-glow" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#7fb2e0" stop-opacity=".55"/><stop offset="1" stop-color="#2a64ad" stop-opacity="0"/></radialGradient></defs><rect width="1000" height="1150" fill="url(#sk-g-glow)"/>`),
      // violet
      sym('sk-desk', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#f1ebf3"/>${art.fibres(29, 90, 0, 0, 1000, 1600, '#d9cfe0', .55)}`),
      sym('sk-burst-blue', '0 0 400 400', molecule(200, 200, 30, 33) + burst(5, 200, 200, 12, 50, 150, [BLUE, BLUE2], 10)),
      sym('sk-burst-violet', '0 0 400 400', molecule(200, 200, 30, 35) + burst(7, 200, 200, 18, 50, 185, [VIOLET, '#9a74cc'], 10)),
      sym('sk-strip', '0 0 760 150', (() => {
        const w = [118, 112, 116, 120, 132, 98, 44]; let x = 20; // illustrative widths only: a thin violet band
        return `<path d="M12 22H748V128H12Z" fill="#fffdf6" stroke="${INK}" stroke-width="5"/>` + w.map((ww, i) => { const s = `<rect x="${x}" y="30" width="${ww}" height="90" fill="${RAINBOW[i]}"/>`; x += ww; return s; }).join('') +
          `<path d="M712 30v90" stroke="${INK}" stroke-width="2" opacity=".4"/>`;
      })()),
      sym('sk-ring', '0 0 200 200', art.ring(200, 200, {color: INK, width: 8, dash: '22 12'})),
      sym('sk-eye', '0 0 440 240', `<path d="M20 120Q220 -30 420 120Q220 270 20 120Z" fill="#fffdf6" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>` +
        `<circle cx="220" cy="120" r="72" fill="#5b4334" stroke="${INK}" stroke-width="5"/><circle cx="220" cy="120" r="34" fill="${INK}"/><circle cx="196" cy="96" r="14" fill="#fff"/>` +
        `<path d="M40 104Q220 -10 400 104" fill="none" stroke="${INK}" stroke-width="4" opacity=".35"/>`),
      sym('sk-iris-blue', '0 0 440 240', `<circle cx="220" cy="120" r="78" fill="${BLUE2}" opacity=".55"/><circle cx="220" cy="120" r="100" fill="none" stroke="${BLUE}" stroke-width="8" opacity=".55"/>`),
      // sunset
      sym('sk-space', '0 0 1000 1600', `<defs>${grad('sk-g-space', [[0, '#1f2547'], [.55, '#3a3f7a'], [1, '#8f6a8a']])}</defs><rect width="1000" height="1600" fill="url(#sk-g-space)"/>` +
        Array.from({length: 40}, (_, i) => `<circle cx="${f(rnd(i + 5) * 1000)}" cy="${f(rnd(i + 55) * 700)}" r="${f(1.5 + rnd(i + 99) * 2.5)}" fill="#fff" opacity=".7"/>`).join('')),
      sym('sk-earth', '0 0 1000 1600', `<circle cx="500" cy="2700" r="1720" fill="#9cc6e8" opacity=".55"/><circle cx="500" cy="2700" r="1660" fill="#bcdcf2" opacity=".5"/>` +
        `<circle cx="500" cy="2700" r="1600" fill="#4f8a62" stroke="${INK}" stroke-width="6"/><path d="${blob(330, 1260, 220, 70, 14, .1, 3)}" fill="#6aa26f"/><path d="${blob(760, 1330, 180, 60, 12, .1, 9)}" fill="#3f7a4f"/>` +
        `<path d="M470 1100h60v-40l-30-26-30 26Z" fill="#f6efe1" stroke="${INK}" stroke-width="4"/><path d="M492 1100v-22h16v22" fill="${RED}"/>`),
      sym('sk-short', '0 0 1000 1600', dashFrame(500, 300, 500, 1030, '#fff6d8', 8)),
      sym('sk-long', '0 0 1000 1600', `<defs>${grad('sk-g-path', [[0, '#fff6d8'], [.55, '#f6c46a'], [1, '#ec6a3a']], 1, 0)}</defs>` +
        `<path d="M150 975Q330 1010 488 1056" fill="none" stroke="url(#sk-g-path)" stroke-width="18" stroke-linecap="round"/>`),
      sym('sk-path-flecks', '0 0 1000 1600', flecks(21, 26, 170, 860, 300, 120, [BLUE, BLUE2, '#7fb2e0'], 20, 7)),
      sym('sk-dusk-tint', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#f08a3a" opacity=".22"/><circle cx="780" cy="830" r="420" fill="#ffd38a" opacity=".22"/>`),
      // transitions
      sym('sk-t-rainbow', '0 0 1000 1600', art.tileTexture(19, RAINBOW)),
      sym('sk-t-air', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#bcdcf2"/>${Array.from({length: 26}, (_, i) => molecule(rnd(i + 7) * 1000, rnd(i + 77) * 1600, 18, 500 + i)).join('')}`),
      sym('sk-t-flecks', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#4f8fd0"/>${flecks(77, 120, 0, 0, 1000, 1600, ['#fff', '#cfe3f3', '#2a64ad'], 28, 9)}`),
      sym('sk-t-violet', '0 0 1000 1600', art.tileTexture(23, [BLUE, VIOLET, BLUE2, '#9a74cc', '#3c4a9e'])),
      sym('sk-t-warm', '0 0 1000 1600', `${skyDusk.replace(/sk-g-dusk/g, 'sk-g-dusk2')}${flecks(9, 60, 0, 0, 1000, 1600, ['#fff3d6', '#f6c46a'], 26, 8)}`),
      sym('sk-t-warm-tiles', '0 0 1000 1600', art.tileTexture(29, ['#ec8a4a', '#f6c46a', '#a0567a', '#d9643a'])),
    ].join(''),

    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, show, reveal, ambient} = motion;
      const kit = globalThis.paperKit.motion(ctx);
      const at = id => ctx.cue(id), S = id => ctx.shot(id);
      const fade = (id, t, d = .4) => track(id, [key(t, [0, 0, 0, 1, 0]), key(t + d, N, 'out')]);
      const hideAt = (id, t, d = .3) => track(id, [key(t, N), key(t + d, [0, 0, 0, 1, 0])]);
      const kid = (p, x, y, w, layer, armUp) => [P(`${p}-body`, 'sk-kid-body', x, y, w, layer, {required: true}), P(`${p}-down`, 'sk-kid-down', x, y, w, layer),
        P(`${p}-up`, 'sk-kid-up', x, y, w, layer, {origin: '66% 47%'})];
      const label = (id, x, y, w, text, style = 'tag', extra = {}) => P(id, null, x, y, w, 5, {label: text, labelStyle: style, ...extra});

      // 1. rooftop (hook)
      const rt = S('rooftop');
      const scenes = {};
      scenes['sk-rooftop'] = {objects: [plate('r-sky', 'sk-sky-noon', 0), P('r-cloud-a', 'sk-cloud-a', 22, 22, 34, 1), P('r-cloud-b', 'sk-cloud-b', 74, 34, 28, 1),
        P('r-sun', 'sk-sun', 74, 17, 26, 2, {required: true}), P('r-rays', 'sk-sun-rays', 74, 17, 26, 2), plate('r-town', 'sk-town', 1),
        plate('r-roof', 'sk-roof', 3), plate('r-clothes', 'sk-clothes', 3, 'exact'), ...kid('r-kid', 40, 66, 24, 4),
        P('r-q', 'sk-q', 40, 33, 22, 4, {required: true}), label('r-tag-white', 70, 31, 36, 'सफ़ेद रोशनी', 'accent', {accent: '#DAB357'})]};
      ambient('r-cloud-a', {drift: [.012, 9, 0]}); ambient('r-cloud-b', {drift: [.01, 11, 2]}); ambient('r-clothes', {sway: [.5, 3.2, 1]});
      const up = kit.when('kid-up', 'r-kid-up');
      hideAt('r-kid-down', up - .05, .2);
      track('r-kid-up', [key(up, [0, 0, 55, 1, 0]), key(up + .12, [0, 0, 40, 1, 1]), key(up + .5, N, 'out')]);
      kit.settle('r-q', 'sky-question', [0, .04, -14, .4, 0], .4);
      ambient('r-q', {bob: [.006, 2.4, 0]});
      kit.settle('r-rays', 'sun-white', [0, 0, -30, .7, 0], .5);
      ambient('r-rays', {spin: 6});
      kit.label('r-tag-white', at('sun-white') + .35);

      // 2. prism (context)
      scenes['sk-prism'] = {objects: [plate('p-room', 'sk-room', 0), plate('p-beam', 'sk-beam', 2, 'exact'), plate('p-hidden', 'sk-beam-hidden', 2, 'exact'),
        plate('p-fan', 'sk-fan', 2, 'exact'), P('p-prism', 'sk-prism', 50, 54, 26, 3, {required: true}),
        label('p-tag-beam', 26, 38, 34, 'सफ़ेद रोशनी', 'accent', {accent: '#DAB357'}), label('p-tag-prism', 50, 66, 24, 'प्रिज़्म', 'tag'),
        label('p-tag-fan', 80, 84, 30, 'सारे रंग', 'chip')]};
      const beamAt = kit.when('beam-in', 'p-beam');
      show('p-beam', beamAt, [0, 0, 0, 1, 0], .05); reveal('p-beam', beamAt, beamAt + .7, 'diag', 0, 1);
      kit.label('p-tag-beam', beamAt + .45);
      kit.pulse('p-hidden', 'colours-hidden', 1.4, .3, .6);
      kit.settle('p-prism', 'prism-in', [0, .05, 8, .8, 0], .45);
      kit.label('p-tag-prism', at('prism-in') + .3);
      const fanAt = kit.when('fan-out', 'p-fan');
      show('p-fan', fanAt, [0, 0, 0, 1, 0], .05); reveal('p-fan', fanAt, fanAt + .8, 'rightward', .52, 1);
      kit.label('p-tag-fan', fanAt + .6);

      // 3. air (mechanism)
      scenes['sk-air'] = {objects: [plate('a-sky', 'sk-air', 0), plate('a-beam', 'sk-air-beam', 2, 'exact'), plate('a-dots', 'sk-dots', 2, 'exact'),
        plate('a-burst', 'sk-burst', 3, 'exact'), P('a-mol', 'sk-mol', 50, 50, 14, 3, {required: true}),
        label('a-tag-mol', 50, 63, 46, 'हवा के नन्हे अणु', 'tag'), label('a-tag-all', 50, 22, 30, 'चारों तरफ़', 'plain')]};
      const hit = at('air-hit'); // the beam leads; the struck molecule appears on «टकराती»
      show('a-beam', hit - .5, [0, 0, 0, 1, 0], .05); reveal('a-beam', hit - .5, hit + .2, 'diag', 0, 1);
      kit.settle('a-mol', 'air-hit', [0, 0, 0, .6, 0], .3);
      kit.settle('a-dots', 'molecules-in', [0, 0, 0, .94, 0], .4);
      ambient('a-dots', {breathe: [.01, 3, 0]});
      kit.label('a-tag-mol', at('molecules-in') + .3);
      kit.settle('a-burst', 'scatter-burst', [0, 0, 0, .35, 0], .45);
      ambient('a-burst', {spin: 4});
      kit.label('a-tag-all', at('scatter-burst') + .35);

      // 4. waves (mechanism, contrast of blue and red)
      scenes['sk-waves'] = {objects: [plate('w-lanes', 'sk-lanes', 0), plate('w-blue', 'sk-wave-blue', 2, 'exact'), plate('w-red', 'sk-wave-red', 2, 'exact'),
        plate('w-splinter', 'sk-splinter', 3, 'exact'), label('w-tag-blue', 20, 27, 22, 'नीला', 'plain'), label('w-tag-red', 20, 59, 22, 'लाल', 'plain'),
        label('w-tag-more', 70, 18, 30, 'ज़्यादा बिखरता', 'chip')]};
      const bw = kit.when('blue-wave', 'w-blue');
      show('w-blue', bw, [0, 0, 0, 1, 0], .05); reveal('w-blue', bw, bw + 1.1, 'rightward', 0, 1);
      kit.label('w-tag-blue', bw + .2);
      const rw = kit.when('red-wave', 'w-red');
      show('w-red', rw, [0, 0, 0, 1, 0], .05); reveal('w-red', rw, rw + 1.3, 'rightward', 0, 1);
      kit.label('w-tag-red', rw + .2);
      kit.settle('w-splinter', 'blue-splinters', [0, 0, 0, .4, 0], .45);
      kit.label('w-tag-more', at('blue-splinters') + .35);

      // 5. whole sky (example: back on the rooftop)
      scenes['sk-whole'] = {objects: [plate('ws-sky', 'sk-sky-noon', 0), P('ws-cloud', 'sk-cloud-b', 26, 30, 28, 1), plate('ws-town', 'sk-town', 1),
        plate('ws-glow', 'sk-glow', 1, 'exact'), plate('ws-flecks', 'sk-flecks', 2, 'exact'), plate('ws-roof', 'sk-roof', 3), plate('ws-clothes', 'sk-clothes', 3, 'exact'),
        plate('ws-arrows', 'sk-to-eyes', 3, 'exact'), ...kid('ws-kid', 40, 66, 24, 4), label('ws-tag', 62, 12, 42, 'पूरे आसमान से', 'accent', {accent: BLUE})]};
      hideAt('ws-kid-down', S('whole-sky').start, .01);
      ambient('ws-clothes', {sway: [.5, 3.2, 1]}); ambient('ws-cloud', {drift: [.01, 10, 1]});
      const fl = kit.when('flecks-in', 'ws-flecks');
      show('ws-flecks', fl, [0, -.01, 0, 1, 0], .5); reveal('ws-flecks', fl, fl + 1.2, 'down', 0, 1);
      ambient('ws-flecks', {bob: [.004, 2.8, 0]});
      kit.label('ws-tag', fl + 1.2);
      const eyes = kit.when('to-eyes', 'ws-arrows');
      show('ws-arrows', eyes, [0, 0, 0, 1, 0], .05); reveal('ws-arrows', eyes, eyes + .7, 'down', 0, 1);
      kit.settle('ws-glow', 'sky-glow', [0, 0, 0, 1, 0], .6);

      // 6. violet (contrast)
      scenes['sk-violet'] = {objects: [plate('v-desk', 'sk-desk', 0), P('v-blue', 'sk-burst-blue', 27, 21, 34, 3), P('v-burst', 'sk-burst-violet', 72, 21, 40, 3),
        P('v-strip', 'sk-strip', 50, 50, 80, 3, {required: true}), P('v-ring', 'sk-ring', 83, 50, 16, 4, {flat: true}),
        P('v-eye', 'sk-eye', 50, 78, 56, 3, {required: true}), P('v-iris', 'sk-iris-blue', 50, 78, 56, 4, {flat: true}),
        label('v-tag-blue', 27, 35, 20, 'नीला', 'plain'), label('v-tag-violet', 72, 37, 22, 'बैंगनी', 'plain'), label('v-tag-less', 50, 61, 30, 'धूप में कम', 'chip')]};
      const vs = S('violet').start;
      kit.settle('v-blue', vs + .25, [0, .02, 0, .6, 0], .45); kit.label('v-tag-blue', vs + .45);
      ambient('v-blue', {spin: 3});
      const vAt = kit.settle('v-burst', 'violet-scatter', [0, .02, 0, .5, 0], .45);
      ambient('v-burst', {spin: -4});
      kit.label('v-tag-violet', vAt + .3);
      const less = at('violet-less');
      show('v-strip', less - .8, [0, 0, 0, 1, 0], .05); reveal('v-strip', less - .8, less - .1, 'rightward', 0, 1);
      kit.ring('v-ring', 'violet-less');
      kit.label('v-tag-less', less + .3);
      const eyeAt = kit.settle('v-eye', at('eye-blue') - .55, [0, .03, 0, .9, 0], .45);
      kit.pulse('v-iris', 'eye-blue', 99, .35, .1);

      // 7. sunset (resolution: long path)
      scenes['sk-sunset'] = {objects: [plate('e-space', 'sk-space', 0), plate('e-earth', 'sk-earth', 2, 'exact'), plate('e-short', 'sk-short', 2, 'exact'),
        plate('e-path', 'sk-long', 3, 'exact'), plate('e-flecks', 'sk-path-flecks', 3, 'exact'), P('e-sun', 'sk-sun-dusk', 13, 60, 16, 3, {required: true}),
        label('e-tag', 30, 73, 34, 'लंबा रास्ता', 'accent', {accent: '#ec8a2e'})]};
      const st = S('sunset').start, low = at('sun-low');
      track('e-sun', [key(st, [.37, -.42, 0, 1, 1]), key(low - .2, [.33, -.36, 0, 1, 1]), key(low + 1.2, N, 'smooth')]);
      track('e-short', [key(st + .2, [0, 0, 0, 1, 0]), key(st + .6, N), key(low, N), key(low + .5, [0, 0, 0, 1, 0])]);
      const lp = kit.when('long-path', 'e-path');
      show('e-path', lp, [0, 0, 0, 1, 0], .05); reveal('e-path', lp, lp + 1.2, 'rightward', .12, .52);
      kit.label('e-tag', lp + .5);
      kit.settle('e-flecks', 'blue-away', [0, .02, 0, 1, 0], .7);
      ambient('e-flecks', {bob: [.006, 2.2, 0]});

      // 8. dusk (payoff: the same rooftop, orange sky)
      scenes['sk-dusk'] = {objects: [plate('d-sky', 'sk-sky-dusk', 0), P('d-sun', 'sk-sun-dusk', 78, 56, 22, 1, {required: true}), plate('d-town', 'sk-town-dusk', 1),
        plate('d-roof', 'sk-roof-dusk', 3), plate('d-clothes', 'sk-clothes', 3, 'exact'), ...kid('d-kid', 40, 66, 24, 4), plate('d-glow', 'sk-dusk-tint', 4, 'exact')]};
      hideAt('d-kid-down', S('dusk').start, .01);
      kit.settle('d-sun', 'dusk-red', [0, -.03, 0, .85, 0], .45);
      kit.settle('d-glow', 'dusk-glow', [0, 0, 0, 1, 0], .6);
      ambient('d-clothes', {sway: [.5, 3.2, 1]});

      // Camera: the plan's moments (timing) with this video's own framing.
      const cam = (id, startView, views, endView) => {
        const keys = kit.planCamera(id, views), s = S(id);
        return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0), ...(endView ? [key(s.end, endView, 'out')] : [])];
      };
      const cameras = {
        rooftop: cam('rooftop', [0, .045, 1.08], [[0, -.03, 1.1, 'smooth']], [0, -.035, 1.12]),
        prism: cam('prism', [0, -.02, 1.0], [[.02, .02, 1.1, 'smooth']], [.05, .02, 1.12]),
        air: cam('air', [0, 0, 1.0], [[0, 0, 1.12, 'smooth']], [0, 0, 1.06]),
        waves: [key(S('waves').start, [0, 0, 1.05]), key(S('waves').end, [0, 0, 1], 'out')],
        'whole-sky': cam('whole-sky', [0, .04, 1.1], [[0, -.02, 1.0, 'smooth']], [0, -.02, 1.02]),
        violet: [key(S('violet').start, [0, -.01, 1.03]), key(S('violet').end, [0, .01, 1.0], 'out')],
        sunset: cam('sunset', [0, .06, 1.08], [[-.08, .09, 1.25, 'smooth']], [-.08, .09, 1.27]),
        dusk: cam('dusk', [0, .02, 1.04], [[0, 0, 1.0, 'out']], [0, 0, 1.0]),
      };
      const k = (name, t) => [name, t];
      return {scenes, cameras, checks: {keyframes: [
        k('rooftop-question', at('sky-question') + .7), k('rooftop-sun', at('sun-white') + .8), k('prism-beam', at('colours-hidden') + .5),
        k('prism-fan', at('fan-out') + 1.0), k('air-burst', at('scatter-burst') + .7), k('waves', at('blue-splinters') + .8),
        k('whole-sky-eyes', at('to-eyes') + .9), k('whole-sky-glow', at('sky-glow') + .8), k('violet-strip', at('violet-less') + .8),
        k('violet-eye', at('eye-blue') + 1.0), k('sunset-path', at('long-path') + 1.3), k('sunset-flecks', at('blue-away') + .7),
        k('dusk', at('dusk-glow') + .7)]}};
    },
  };
})();
