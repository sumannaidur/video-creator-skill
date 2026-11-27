// E17 (P018.5) topic: "How does the human heart pump blood?" in Telugu, Paper Explainer, full-bleed.
// One consistent paper heart (frontal view: the heart's right side is on the viewer's left) is the stage for the
// whole loop; cells travel along anatomical paths; every speech moment comes from the resolved plan's cue ids.
(() => {
  const {sym, f, rnd, blob} = globalThis.paperShotArt;
  const K = globalThis.paperKit, A = K.art;
  const W = 1000;
  let VH = 1778;
  const lit = A.light({dir: [.6, .8]});
  const C = (d, fill, o = {}) => A.cut(d, {fill, lit, depth: 6, rim: .45, ...o});
  const RED = '#c9413a', RED_D = '#8e2a2a', BLUE = '#4f72ad', BLUE_D = '#344f80', MUSCLE = '#a8343a', FAT = '#e9cd84', PAPER = '#f4ecdc', INK = '#2b2622';
  const T = {atria: 'కర్ణికలు', ventricles: 'జఠరికలు', ra: 'కుడి కర్ణిక', rv: 'కుడి జఠరిక', la: 'ఎడమ కర్ణిక', lv: 'ఎడమ జఠరిక', lungs: 'ఊపిరితిత్తులు', o2: 'ఆక్సిజన్',
    valve: 'కవాటం', lub: 'లబ్', dub: 'డబ్', spark: 'విద్యుత్ సంకేతం', rate: '60–100 / నిమిషం', note: 'సరళీకృత చిత్రం · రంగులు బోధన కోసం'};

  // ---------- shared drawing helpers ----------
  // a paper tube along a path: dark edge, body colour, soft highlight on the lit side
  const tube = (d, w, fill, o = {}) => `<path d="${d}" fill="none" stroke="${A.mix(fill, '#000000', .35)}" stroke-width="${w + 8}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="${o.shine ?? .28}" stroke-width="${f(w * .22)}" stroke-linecap="round" transform="translate(${f(-w * .18)} ${f(-w * .12)})"/>`;
  const shadowTube = (d, w) => `<path d="${d}" fill="none" stroke="${lit.shade}" stroke-opacity=".22" stroke-width="${w + 6}" stroke-linecap="round" transform="translate(9 12)"/>`;

  // ---------- the heart (viewBox 0 0 1000 1100) ----------
  const HEART = 'M300 330C210 370 182 520 220 640C270 790 430 900 612 975C705 900 812 772 832 612C852 470 812 360 722 330C652 302 586 322 545 362C485 322 382 300 300 330Z';
  const V = {
    aorta: 'M592 520C582 400 560 270 560 214C560 120 704 96 764 168C804 220 804 300 792 362',
    branches: ['M600 150L588 40', 'M662 122L672 18', 'M724 140L756 38'],
    svc: 'M332 54L334 372', ivc: 'M300 1085L312 770',
    trunk: 'M472 560C472 420 484 330 522 276', rpa: 'M522 284C440 246 300 244 130 254', lpa: 'M522 284C602 236 760 234 905 244',
    pv1: 'M915 404L742 422', pv2: 'M915 482L742 472',
  };
  const vesselsBack = () => shadowTube(V.aorta, 92) + tube(V.rpa, 58, BLUE) + tube(V.lpa, 58, BLUE) + V.branches.map(d => tube(d, 34, RED)).join('') + tube(V.aorta, 92, RED) +
    tube(V.pv1, 40, RED) + tube(V.pv2, 40, RED) + tube(V.svc, 80, BLUE) + tube(V.ivc, 80, BLUE);
  const vesselsFront = () => tube(V.trunk, 82, BLUE);
  const coronaries = () => {
    const groove = 'M548 372C560 520 590 760 612 968';
    let s = `<path d="${groove}" fill="none" stroke="${FAT}" stroke-width="34" stroke-linecap="round" opacity=".9"/><path d="M300 600C380 560 470 560 548 560" fill="none" stroke="${FAT}" stroke-width="22" opacity=".8"/>`;
    s += `<path d="${groove}" fill="none" stroke="#e0583f" stroke-width="9" stroke-linecap="round"/><path d="M556 380C570 520 600 760 620 960" fill="none" stroke="#5c7fb8" stroke-width="7" stroke-linecap="round"/>`;
    for (let i = 0; i < 9; i++) {
      const y = 430 + i * 60, x = 552 + (y - 372) * .11, side = i % 2 ? 1 : -1, len = 70 + rnd(i + 3) * 70;
      s += `<path d="M${f(x)} ${f(y)}q${f(side * len * .5)} ${f(10 + rnd(i) * 20)} ${f(side * len)} ${f(30 + rnd(i + 9) * 40)}" fill="none" stroke="${i % 3 ? '#e0583f' : '#5c7fb8'}" stroke-width="${f(5 - i * .25)}" stroke-linecap="round" opacity=".9"/>`;
    }
    return s;
  };
  const heartExterior = () => vesselsBack() +
    A.gouache(HEART, {fill: MUSCLE, id: 'hx-hg', lit, strength: .42, texture: 'hx-gouache'}) + `<path d="${HEART}" fill="url(#hx-speckle)" opacity=".5"/>` +
    C('M268 360C214 352 196 410 232 446C254 468 292 458 304 432Z', '#b9474a', {depth: 4}) + C('M690 352C744 338 772 388 742 420C722 440 694 432 686 410Z', '#b9474a', {depth: 4}) +
    coronaries() + vesselsFront() +
    `<path d="M360 360C330 430 320 520 340 600" stroke="#ffffff" stroke-opacity=".22" stroke-width="16" fill="none" stroke-linecap="round"/>`;
  const CAV = {
    ra: 'M252 362C220 424 230 520 300 548L442 548C472 472 452 382 402 352C352 332 292 334 252 362Z',
    rv: 'M272 604L470 604C496 700 518 798 552 872C448 818 330 722 272 604Z',
    la: 'M562 384C602 344 702 344 752 384C792 434 772 522 722 548L602 548C562 504 548 432 562 384Z',
    lv: 'M604 604L728 604C738 702 700 816 624 892C604 800 592 700 604 604Z',
  };
  const valveLeaflets = (x0, x1, y) => `<path d="M${x0} ${y}Q${f(x0 + (x1 - x0) * .25)} ${y + 44} ${f((x0 + x1) / 2 - 6)} ${y + 30}" fill="none" stroke="#f6e7d2" stroke-width="11" stroke-linecap="round"/>` +
    `<path d="M${x1} ${y}Q${f(x1 - (x1 - x0) * .25)} ${y + 44} ${f((x0 + x1) / 2 + 6)} ${y + 30}" fill="none" stroke="#f6e7d2" stroke-width="11" stroke-linecap="round"/>` +
    [.3, .5, .7].map(k => `<path d="M${f(x0 + (x1 - x0) * k)} ${y + 34}L${f(x0 + (x1 - x0) * (k * .8 + .1))} ${y + 150}" stroke="#f6e7d2" stroke-width="3" opacity=".85"/>`).join('') +
    `<path d="M${f(x0 + (x1 - x0) * .2)} ${y + 170}q20 -40 40 0z" fill="#8e2a2a"/><path d="M${f(x0 + (x1 - x0) * .62)} ${y + 170}q20 -40 40 0z" fill="#8e2a2a"/>`;
  const semilunar = (x, y) => `<path d="M${x - 34} ${y}q17 22 34 0q17 22 34 0" fill="none" stroke="#f6e7d2" stroke-width="8" stroke-linecap="round"/>`;
  const trabeculae = (seed, x0, x1, y0, y1) => Array.from({length: 14}, (_, i) => {
    const y = y0 + (y1 - y0) * (i + .5) / 14, x = rnd(seed + i) > .5 ? x0 : x1;
    return `<path d="M${f(x)} ${f(y)}q${f(x === x0 ? 18 : -18)} 6 ${f(x === x0 ? 30 : -30)} 2" stroke="${RED_D}" stroke-width="5" stroke-linecap="round" opacity=".55"/>`;
  }).join('');
  const heartSection = () => vesselsBack() +
    C(HEART, MUSCLE, {depth: 8, texture: 'hx-gouache'}) + `<path d="${HEART}" fill="url(#hx-speckle)" opacity=".45"/>` +
    `<path d="${HEART}" fill="none" stroke="#7d2328" stroke-width="10"/>` +
    A.gouache(CAV.ra, {fill: '#7f9fd3', id: 'hx-ra', lit, strength: .3}) + A.gouache(CAV.rv, {fill: '#6d8fc7', id: 'hx-rv', lit, strength: .3}) +
    A.gouache(CAV.la, {fill: '#de6a5c', id: 'hx-la', lit, strength: .3}) + A.gouache(CAV.lv, {fill: '#d65a50', id: 'hx-lv', lit, strength: .3}) +
    trabeculae(3, 300, 470, 640, 820) + trabeculae(9, 612, 722, 640, 840) +
    valveLeaflets(290, 440, 556) + valveLeaflets(606, 726, 556) + semilunar(478, 560) + semilunar(594, 552) +
    `<path d="M530 372L538 600L596 960" stroke="#7d2328" stroke-width="6" opacity=".35" fill="none"/>` +
    tube(V.trunk, 82, BLUE, {shine: .2}) + `<path d="M472 552C472 430 482 336 518 286" stroke="#8fb0e2" stroke-width="40" fill="none" stroke-linecap="round" opacity=".55"/>` +
    // SA node: a small node high in the right atrium near the superior vena cava
    `<circle cx="330" cy="366" r="13" fill="#f2c94c" stroke="#8a5a12" stroke-width="3"/>`;
  const H = {x: 50, y: 46, w: 96};
  const hx = sx => H.x + (sx - 500) * H.w / 1000, hy = sy => H.y + (sy - 550) * (H.w / 100) * 1000 / VH * 100 / 1000;
  const HP = (sx, sy) => [hx(sx), hy(sy)];

  // ---------- blood cell (biconcave disc), backdrops ----------
  const cell = color => `<ellipse cx="22" cy="15" rx="20" ry="13" fill="${A.mix(color, '#000000', .3)}"/><ellipse cx="21" cy="13" rx="19" ry="12" fill="${color}"/>` +
    `<ellipse cx="21" cy="13" rx="9" ry="5" fill="${A.mix(color, '#000000', .25)}"/><path d="M8 9q8 -6 20 -4" stroke="#ffffff" stroke-opacity=".45" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  const backdrop = (id, a, b, glow = '#ff9a7a', fold = '#6e1f28') => A.sky(W, VH, {id, top: a, bottom: b}) +
    // soft glowing depth: large radial pools of light behind the subject
    `<defs><radialGradient id="${id}-g"><stop offset="0" stop-color="${glow}" stop-opacity=".42"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="${W * .5}" cy="${f(VH * .45)}" rx="${W * .62}" ry="${f(VH * .3)}" fill="url(#${id}-g)"/><circle cx="${W * .15}" cy="${f(VH * .18)}" r="220" fill="url(#${id}-g)" opacity=".6"/>` +
    `<circle cx="${W * .86}" cy="${f(VH * .74)}" r="260" fill="url(#${id}-g)" opacity=".5"/>` +
    // out-of-focus cells drifting deep in the background
    Array.from({length: 16}, (_, i) => { const x = rnd(i + 70) * W, y = rnd(i + 90) * VH, r = 16 + rnd(i + 110) * 46;
      return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .66)}" fill="${glow}" opacity="${f(.08 + rnd(i + 130) * .12)}" transform="rotate(${f(rnd(i) * 180)} ${f(x)} ${f(y)})"/>`; }).join('') +
    // layered tissue folds framing the left and right edges (cut paper, lit from the upper left)
    [0, 1, 2].map(k => C(`M0 0H${120 - k * 30}C${200 - k * 40} ${f(VH * .3)} ${60 + k * 20} ${f(VH * .55)} ${150 - k * 30} ${VH}H0Z`, A.mix(fold, '#000000', k * .18), {depth: 8, rim: .35, texture: 'hx-gouache'}) +
      C(`M${W} 0H${880 + k * 30}C${800 + k * 40} ${f(VH * .35)} ${940 - k * 20} ${f(VH * .6)} ${850 + k * 30} ${VH}H${W}Z`, A.mix(fold, '#000000', k * .18), {depth: 8, rim: .35, texture: 'hx-gouache'})).join('') +
    `<rect width="${W}" height="${VH}" fill="url(#hx-paper)" opacity=".6"/><rect width="${W}" height="${VH}" fill="url(#hx-vig)"/>`;

  // ---------- opening: rooftop at sunrise ----------
  const MAN = A.figure({skin: '#a8714e', hair: '#1f1a17', shirt: '#f2e6d0', vest: '#c0533c', trousers: '#3a4458', cap: null, scarf: null});
  const dawn = () => A.sky(W, VH, {id: 'hx-dawn', top: '#f0b48c', bottom: '#fbe6c2', sun: {x: 760, y: VH * .3, r: 80, color: '#f5b04a', halo: '#ffe2a6'}}) +
    `<rect width="${W}" height="${VH}" fill="url(#hx-paper)"/>` +
    C(A.ridge(W, VH * .46, VH, {seed: 4, amp: 90, n: 6}), '#d9a98b', {depth: 5, rim: .25}) + A.haze(W, VH * .38, VH * .2, {id: 'hx-hz', color: '#f9dcc0', opacity: .55});
  const skyline = () => {
    const base = VH * .6;
    return [[20, 150, 360, '#c98b6d'], [180, 130, 300, '#b97a63'], [320, 170, 420, '#d39a7a'], [500, 140, 330, '#c4876b'], [650, 160, 380, '#b77b66'], [820, 170, 300, '#cf9476']]
      .map(([x, w, h, c], i) => A.facade(x, base, w, h, {seed: 20 + i, wall: c, trim: '#f3dcc4', glass: '#6b5a6e', roof: '#8c4a3e', shutter: i % 2 ? '#7a8f9e' : null, lit, chimney: i % 3 === 0})).join('') +
      A.haze(W, VH * .38, VH * .25, {id: 'hx-hz2', color: '#f7d7bb', opacity: .35});
  };
  const roof = () => {
    const y = VH * .78;
    return A.masonry(0, y, W, VH - y, {seed: 5, brick: [60, 26], colors: ['#b4664a', '#a85a40', '#bf7052', '#9c5139'], lit}) +
      C(`M0 ${f(y + 120)}H${W}V${VH}H0Z`, '#8a6f5c', {depth: 6, texture: 'hx-paper'}) +
      [[110, '#5c8a4f'], [880, '#4f7a46']].map(([x, c]) => C(`M${x - 44} ${f(y + 30)}L${x + 44} ${f(y + 30)}L${x + 32} ${f(y + 110)}H${x - 32}Z`, '#b5603f', {depth: 5}) + A.foliage(x, y - 90, 70, {seed: x, colors: ['#3f6b3c', c, '#86ad5d'], lit, height: 110})).join('') +
      Array.from({length: 11}, (_, i) => `<circle cx="${60 + i * 88}" cy="${f(VH * .52 + Math.sin(i * .9) * 30 + i * 8)}" r="9" fill="#ffe6a3"/>`).join('') +
      `<path d="M0 ${f(VH * .52)}${Array.from({length: 12}, (_, i) => `L${i * 88} ${f(VH * .52 + Math.sin(i * .9) * 30 + i * 8 - 8)}`).join('')}" stroke="#3b2f2a" stroke-width="2" fill="none" opacity=".6"/>`;
  };
  const ecg = () => { const y = VH * .2; let d = `M0 ${f(y)}`; for (let i = 0; i < 4; i++) { const x = i * 260; d += `L${x + 90} ${f(y)}L${x + 110} ${f(y - 20)}L${x + 130} ${f(y)}L${x + 150} ${f(y)}L${x + 165} ${f(y + 30)}L${x + 182} ${f(y - 120)}L${x + 200} ${f(y + 50)}L${x + 216} ${f(y)}L${x + 260} ${f(y)}`; }
    return `<path d="${d}" fill="none" stroke="#fff6e6" stroke-width="14" stroke-linejoin="round" opacity=".6"/><path d="${d}" fill="none" stroke="#c9413a" stroke-width="7" stroke-linejoin="round"/>`; };
  const chestWindow = () => `<circle cx="100" cy="100" r="92" fill="#5a1f24"/><circle cx="100" cy="100" r="92" fill="url(#hx-glowr)"/>` +
    `<circle cx="100" cy="100" r="92" fill="none" stroke="#f4ecdc" stroke-width="10" stroke-dasharray="6 4"/><circle cx="100" cy="100" r="98" fill="none" stroke="#2b2622" stroke-width="3" opacity=".5"/>`;
  const glowDefs = () => `<defs><radialGradient id="hx-glowr"><stop offset="0" stop-color="#ff8a6a" stop-opacity=".75"/><stop offset="1" stop-color="#ff8a6a" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="hx-vig" cx=".5" cy=".45" r=".8"><stop offset=".6" stop-color="#3b1d14" stop-opacity="0"/><stop offset="1" stop-color="#3b1d14" stop-opacity=".35"/></radialGradient>` +
    `<radialGradient id="hx-spark"><stop offset="0" stop-color="#fff7c2" stop-opacity="1"/><stop offset=".4" stop-color="#f2c94c" stop-opacity=".7"/><stop offset="1" stop-color="#f2c94c" stop-opacity="0"/></radialGradient></defs>`;

  // ---------- lungs (viewBox 0 0 1000 1100) ----------
  const bronchi = (x, y, a, len, w, depth, seed) => {
    if (depth === 0 || len < 14) return '';
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    return `<path d="M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}" stroke="#f7d9cf" stroke-width="${f(w)}" stroke-linecap="round"/>` +
      bronchi(x2, y2, a - .45 - rnd(seed) * .2, len * .74, w * .7, depth - 1, seed + 1) + bronchi(x2, y2, a + .45 + rnd(seed + 7) * .2, len * .74, w * .7, depth - 1, seed + 3);
  };
  const lungs = () => {
    const R = 'M440 300C360 280 250 330 190 450C130 580 120 760 150 900C170 980 260 1010 360 990C430 975 470 930 470 860L470 360C470 330 462 306 440 300Z';
    const L = 'M560 300C640 280 750 330 810 450C870 580 880 760 850 900C830 980 740 1010 640 990C600 980 575 955 572 920C620 880 640 820 610 780C580 760 560 760 555 740L540 360C540 330 545 306 560 300Z';
    return A.gouache(R, {fill: '#e4a19b', id: 'hx-lr', lit, strength: .35, texture: 'hx-gouache'}) + A.gouache(L, {fill: '#e4a19b', id: 'hx-ll', lit, strength: .35, texture: 'hx-gouache'}) +
      `<path d="${R}" fill="url(#hx-speckle)" opacity=".5"/><path d="${L}" fill="url(#hx-speckle)" opacity=".5"/>` +
      // fissures: three lobes on the right lung, two on the left
      `<path d="M190 560C280 540 380 560 468 600" stroke="#b56d6a" stroke-width="5" fill="none"/><path d="M160 760C260 720 380 700 468 690" stroke="#b56d6a" stroke-width="5" fill="none"/>` +
      `<path d="M830 520C740 560 640 640 560 720" stroke="#b56d6a" stroke-width="5" fill="none"/>` +
      `<path d="M470 40V300" stroke="#f2cfc3" stroke-width="64" stroke-linecap="round"/>` + Array.from({length: 9}, (_, i) => `<path d="M440 ${60 + i * 26}H500" stroke="#d8aea2" stroke-width="7" stroke-linecap="round"/>`).join('') +
      bronchi(470, 300, Math.PI * .72, 120, 34, 6, 3) + bronchi(470, 300, Math.PI * .28, 120, 34, 6, 11);
  };
  const lungVessels = () => {
    const pa = ['M500 760C420 700 360 620 300 560', 'M500 760C580 700 640 620 700 560'], pv = ['M330 700C400 760 450 800 500 830', 'M680 700C610 760 560 800 520 830'];
    return pa.map(d => tube(d, 26, BLUE)).join('') + pv.map(d => tube(d, 26, RED)).join('');
  };
  const alveoli = () => `<circle cx="200" cy="200" r="190" fill="#fbe9e2"/>` +
    Array.from({length: 22}, (_, i) => { const a = i * 2.4, r = 40 + (i % 5) * 26, x = 200 + Math.cos(a) * r * .9, y = 200 + Math.sin(a) * r * .9;
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(30 + rnd(i) * 14)}" fill="#f3c2bb" stroke="#d98f88" stroke-width="3"/><path d="M${f(x - 20)} ${f(y - 8)}q20 -14 38 2" stroke="#ffffff" stroke-opacity=".5" stroke-width="3" fill="none"/>`; }).join('') +
    `<path d="M20 230C110 180 290 260 380 200" stroke="#5c7fb8" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M20 250C110 200 290 280 380 220" stroke="#d8453c" stroke-width="12" fill="none" stroke-linecap="round" opacity=".85"/>` +
    `<circle cx="200" cy="200" r="190" fill="none" stroke="#2b2622" stroke-width="10"/><circle cx="200" cy="200" r="198" fill="none" stroke="#f4ecdc" stroke-width="6"/>`;
  const o2 = () => `<circle cx="20" cy="20" r="18" fill="#bfe3f0" stroke="#5aa2c0" stroke-width="3"/><text x="20" y="27" text-anchor="middle" font-size="18" font-weight="700" fill="#2e6f8c" font-family="Segoe UI">O₂</text>`;

  // ---------- body map (viewBox 0 0 600 1600) ----------
  const BODY = 'M300 40C350 40 384 80 384 136C384 190 352 226 322 236L322 262C392 270 444 300 460 360L520 700C526 730 500 744 486 720L420 420L414 780L440 1500C442 1540 396 1546 392 1506L330 900L300 900L270 900L208 1506C204 1546 158 1540 160 1500L186 780L180 420L114 720C100 744 74 730 80 700L140 360C156 300 208 270 278 262L278 236C248 226 216 190 216 136C216 80 250 40 300 40Z';
  const arteriesUp = 'M300 470C300 400 300 330 300 270M300 300C290 220 286 150 300 90M300 300C320 220 326 150 312 90M300 330C360 330 420 360 440 420L480 640M300 330C240 330 180 360 160 420L120 640';
  const arteriesDown = 'M300 470L300 860M300 860C280 1000 250 1200 220 1480M300 860C320 1000 350 1200 380 1480M300 640C330 650 360 700 362 760M300 640C270 650 240 700 238 760';
  const body = () => `<path d="${BODY}" fill="#ff8a6a" opacity=".18" transform="translate(300 800) scale(1.05) translate(-300 -800)"/>` +
    C(BODY, '#f3dcc0', {depth: 9, texture: 'hx-paper'}) + `<path d="${BODY}" fill="none" stroke="#c8a07e" stroke-width="4"/>` +
    // lungs, ribs and a liver silhouette as quiet context inside the torso
    `<path d="M236 380C210 420 204 520 220 580C240 600 270 590 282 560L284 400C276 380 252 372 236 380Z" fill="#e7b7ad" opacity=".55"/>` +
    `<path d="M364 380C390 420 396 520 380 580C360 600 330 590 318 560L316 400C324 380 348 372 364 380Z" fill="#e7b7ad" opacity=".55"/>` +
    Array.from({length: 5}, (_, i) => `<path d="M${226 + i * 2} ${400 + i * 34}Q300 ${386 + i * 34} ${374 - i * 2} ${400 + i * 34}" stroke="#d9b99a" stroke-width="5" fill="none" opacity=".7"/>`).join('') +
    `<path d="M230 620C260 600 330 600 360 630C340 670 270 676 236 660Z" fill="#b97a5e" opacity=".45"/>` +
    `<path d="${arteriesUp}" fill="none" stroke="#9eb4d6" stroke-width="7" opacity=".45" transform="translate(14 0)"/><path d="${arteriesDown}" fill="none" stroke="#9eb4d6" stroke-width="7" opacity=".45" transform="translate(14 0)"/>`;
  const artery = d => `<path d="${d}" fill="none" stroke="#8e2a2a" stroke-width="14" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${RED}" stroke-width="9" stroke-linecap="round"/>`;

  // ---------- valve close-up (viewBox 0 0 1000 700) ----------
  const vessel = () => C('M0 120H1000V230C800 210 200 210 0 230Z', '#d98f88', {depth: 6, texture: 'hx-gouache'}) + C('M0 470C200 490 800 490 1000 470V580H0Z', '#d98f88', {depth: 6, texture: 'hx-gouache'}) +
    `<rect y="225" width="1000" height="250" fill="#5a1f24"/><rect y="225" width="1000" height="250" fill="url(#hx-glowr)" opacity=".4"/>` +
    Array.from({length: 12}, (_, i) => `<path d="M${i * 90} 150q40 20 80 0M${i * 90 + 40} 560q40 -20 80 0" stroke="#b56d6a" stroke-width="4" fill="none" opacity=".7"/>`).join('');
  const leaflet = up => up ? C('M10 0C40 20 60 80 54 150C40 170 20 160 12 140C6 100 4 40 10 0Z', '#f4dcc8', {depth: 4, rim: .6}) : C('M10 160C40 140 60 80 54 10C40 -10 20 0 12 20C6 60 4 120 10 160Z', '#f4dcc8', {depth: 4, rim: .6});
  const rings = () => [60, 110, 160].map((r, i) => `<circle cx="200" cy="200" r="${r}" fill="none" stroke="#f2c94c" stroke-width="${10 - i * 3}" opacity="${1 - i * .25}"/>`).join('');
  const wave = top => top ? `<path d="M240 330C320 300 420 300 520 340C600 300 700 300 780 340" stroke="#f2c94c" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="24 14"/>`
    : `<path d="M280 620C360 700 460 760 560 840M560 620C620 700 660 760 620 880" stroke="#f2c94c" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="24 14"/>`;
  const star = () => `<circle cx="60" cy="60" r="58" fill="url(#hx-spark)"/><path d="M60 8L70 48L110 60L70 72L60 112L50 72L10 60L50 48Z" fill="#fff1a8" stroke="#c9961c" stroke-width="3"/>`;

  globalThis.paperTopic = {
    shots: [
      {id: 'pulse', scene: 'x-pulse', accent: '#c9413a', transition: {type: 'dissolve', symbol: 'x-dissolve-heart', lead: .4, tail: .5, zoom: .22}},
      {id: 'heart', scene: 'x-heart', accent: '#a8343a'},
      {id: 'right', scene: 'x-right', accent: '#4f72ad', transition: {type: 'dissolve', symbol: 'x-dissolve-lungs', lead: .35, tail: .45, zoom: .15}},
      {id: 'lungs', scene: 'x-lungs', accent: '#2e6f8c', transition: {type: 'dissolve', symbol: 'x-dissolve-body', lead: .35, tail: .45, zoom: .15}},
      {id: 'body', scene: 'x-body', accent: '#c9413a', transition: {type: 'sheet', symbol: 'x-dissolve-valve'}},
      {id: 'valves', scene: 'x-valves', accent: '#8e2a2a', transition: {type: 'dissolve', symbol: 'x-dissolve-heart', lead: .3, tail: .4, zoom: .12}},
      {id: 'lubdub', scene: 'x-lubdub', accent: '#c9961c'},
      {id: 'spark', scene: 'x-spark', accent: '#c9961c'},
    ],
    css: K.css + ` .piece-art { filter:none }
      #d-lub .piece-label, #d-dub .piece-label { font:900 100px/1.5 var(--vc-font); color:#2b2622; background:#f4ecdc; padding:6px 40px; border-radius:18px 10px 22px 8px; box-shadow:0 10px 0 -3px #2b262233, 0 20px 40px #2b262233 }
      #d-dub .piece-label { color:#8e2a2a }
      #p-rate .piece-label { font:800 40px/1.3 var(--vc-font) }
      .piece[id$="-note"] .piece-label { font:600 22px/1.3 var(--vc-font); background:#f4ecdcd9; color:#5a4a40; box-shadow:none; padding:2px 12px; border-radius:6px }`,
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}, hook: {text: 'గుండె రక్తాన్ని ఎలా పంపుతుంది?', highlight: 'గుండె', until: 2.6}},
    symbols: () => {
      const r = document.querySelector('.story-stage').getBoundingClientRect();
      VH = Math.round(W * r.height / r.width);
      const vb = `0 0 ${W} ${VH}`, hb = '0 0 1000 1100';
      const bgHeart = backdrop('hx-bg1', '#6a2029', '#2c0d13'), bgLungs = backdrop('hx-bg2', '#27404c', '#0f1d25', '#8fd0e6', '#1f3540'),
        bgBody = backdrop('hx-bg3', '#3b1c2a', '#140a12', '#ff8a6a', '#3a1424'), bgValve = backdrop('hx-bg4', '#5a1a24', '#24090f', '#ff9a7a', '#5a1820');
      // dissolve overlays: the next scene's backdrop with its hero, so each transition lands on the subject it reveals
      const heartAt = (s, ext = true) => `<g transform="translate(${f(W * (H.x / 100) - 480)} ${f(VH * H.y / 100 - 550 * .96)}) scale(.96)">${ext ? s : s}</g>`;
      return A.textures('hx', {tile: 300, seed: 31}) + glowDefs() + [
        sym('x-bg-heart', vb, bgHeart), sym('x-bg-lungs', vb, bgLungs), sym('x-bg-body', vb, bgBody), sym('x-bg-valve', vb, bgValve),
        sym('x-heart-ext', hb, heartExterior()), sym('x-heart-sec', hb, heartSection()),
        sym('x-cell-r', '0 0 44 30', cell('#d8453c')), sym('x-cell-b', '0 0 44 30', cell('#5b7fc0')),
        sym('x-dawn', vb, dawn()), sym('x-skyline', vb, skyline()), sym('x-roof', vb, roof()), sym('x-ecg', vb, ecg()), sym('x-window', '0 0 200 200', chestWindow()),
        sym('x-man-body', MAN.viewBox, MAN.body), sym('x-man-head', MAN.viewBox, MAN.head), sym('x-man-arm', MAN.viewBox, MAN.arm), sym('x-man-blink', MAN.viewBox, MAN.blink),
        sym('x-lungs', hb, lungs()), sym('x-lung-vessels', hb, lungVessels()), sym('x-alveoli', '0 0 400 400', alveoli()), sym('x-o2', '0 0 40 40', o2()),
        sym('x-body', '0 0 600 1600', body()), sym('x-art-up', '0 0 600 1600', artery(arteriesUp)), sym('x-art-down', '0 0 600 1600', artery(arteriesDown)),
        sym('x-vessel', '0 0 1000 700', vessel()), sym('x-leaf-up', '0 0 70 170', leaflet(true)), sym('x-leaf-down', '0 0 70 170', leaflet(false)),
        sym('x-rings', '0 0 400 400', rings()), sym('x-wave-a', hb, wave(true)), sym('x-wave-v', hb, wave(false)), sym('x-star', '0 0 120 120', star()),
        sym('x-dissolve-heart', vb, bgHeart + heartAt(heartExterior())), sym('x-dissolve-lungs', vb, bgLungs), sym('x-dissolve-body', vb, bgBody), sym('x-dissolve-valve', vb, bgValve),
      ].join('');
    },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const label = (id, x, y, w, text, style = 'chip', extra = {}) => P(id, null, x, y, w, 5, {label: text, labelStyle: style, ...extra});
      const note = id => label(`${id}-note`, 50, 13, 66, T.note, 'plain');
      // heart beat: a lub-dub double pulse every `period` seconds (scale only), optionally with an appear time
      const beat = (id, t0, t1, {period = .9, amp = .035, from = null} = {}) => {
        const ks = from === null ? [] : [key(t0 - .001, [0, 0, 0, 1, 0]), key(from, [0, 0, 0, 1, 0]), key(from + .3, N, 'out')];
        const start = from === null ? t0 : from + .3;
        if (from === null) ks.push(key(t0, N));
        for (let t = start; t < t1; t += period) ks.push(key(t + .08, [0, 0, 0, 1 + amp, 1], 'out'), key(t + .2, N), key(t + .32, [0, 0, 0, 1 + amp * .6, 1], 'out'), key(t + .46, N));
        track(id, ks);
      };
      // cells travelling at constant speed along a polyline of stage % points; each object starts at pts[0]
      const cells = (prefix, n, art, pts, w = 5.2) => Array.from({length: n}, (_, i) => P(`${prefix}${i}`, art, pts[0][0], pts[0][1], w, 4, {flat: true}));
      const flow = (prefix, n, pts, t0, dur, stagger) => {
        const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], (p[1] - pts[i][1]) * VH / W)), total = seg.reduce((a, b) => a + b, 0);
        for (let i = 0; i < n; i++) {
          const t = t0 + i * stagger, rel = p => [(p[0] - pts[0][0]) / 100, (p[1] - pts[0][1]) / 100];
          let acc = 0;
          const ks = [key(t - .001, [0, 0, 0, .7, 0], 'linear'), key(t + .15, [0, 0, 0, 1, 1], 'linear')];
          pts.forEach((p, k) => { if (k) { acc += seg[k - 1]; ks.push(key(t + .15 + dur * acc / total, [...rel(p), (i * 37) % 60 - 30, 1, k === pts.length - 1 ? 0 : 1], 'linear')); } });
          if (i === 0 && t0 > 0) ks.unshift(key(0, [0, 0, 0, .7, 0]));
          track(`${prefix}${i}`, ks.sort((a, b) => a[0] - b[0]));
        }
      };
      const heartObj = (id, art, extra = {}) => P(id, art, H.x, H.y, H.w, 2, {flat: true, ...extra});
      // drifting out-of-focus cells near the camera (parallax layer 5) and mid-depth (layer 1)
      const floaters = (prefix, n, seed) => Array.from({length: n}, (_, i) => {
        const id = `${prefix}-f${i}`, near = i % 3 === 0;
        ambient(id, {drift: [.01 + rnd(seed + i) * .015, 5 + rnd(seed + 20 + i) * 4, rnd(seed + 40 + i) * 6], bob: [.008, 4 + rnd(seed + 60 + i) * 3, rnd(seed + 80 + i) * 6], sway: [12, 6, i]});
        const ex = near ? (i % 2 ? 6 + rnd(seed + 100 + i) * 12 : 82 + rnd(seed + 100 + i) * 12) : 8 + rnd(seed + 100 + i) * 84;
        return P(id, i % 2 ? 'x-cell-r' : 'x-cell-b', ex, 6 + rnd(seed + 120 + i) * 70, near ? 9 + rnd(seed + i) * 4 : 3 + rnd(seed + i) * 2, near ? 5 : 1, {flat: true});
      });
      const scenes = {};

      // 1. pulse: rooftop at sunrise, ECG across the sky, the heart beating in a chest window
      const manX = 42, manW = 40, manY = 61;
      scenes['x-pulse'] = {objects: [plate('p-sky', 'x-dawn', 0), plate('p-city', 'x-skyline', 1, 'exact'), plate('p-ecg', 'x-ecg', 2, 'exact'), plate('p-roof', 'x-roof', 3, 'exact'),
        ...['body', 'head', 'arm', 'blink'].map(p => P(`p-man-${p}`, `x-man-${p}`, manX, manY, manW, 4, {flat: true, ...(p === 'arm' ? {origin: MAN.origin.arm} : p === 'head' ? {origin: MAN.origin.head} : {})})),
        P('p-window', 'x-window', manX + .6, manY - 6.5, 11, 5, {flat: true}), P('p-heart', 'x-heart-ext', manX + .6, manY - 6.6, 9, 5, {flat: true}),
        label('p-rate', 54, 30, 44, T.rate, 'chip')]};
      const ecgAt = kit.draw('p-ecg', 'ecg', 1.4, 'rightward');
      kit.label('p-rate', 'rate', cue('ecg') + 1.4);
      kit.pose('p-man-arm', [[S('pulse').start, 0], [cue('rate') - .3, 0], [cue('rate') + .2, -62, 'out'], [S('pulse').end - .6, -62], [S('pulse').end, -20]]);
      kit.pose('p-man-head', [[S('pulse').start, 0], [cue('rate') + .4, 2], [ecgAt + .2, -6], [S('pulse').end, -4]]);
      kit.blink('p-man-blink', [1.1, 3.4, 5.6, 7.4].filter(t => t < S('pulse').end - .2));
      beat('p-heart', S('pulse').start, S('pulse').end + .5, {period: .85, amp: .06});
      track('p-window', [key(S('pulse').start, N), ...Array.from({length: 12}, (_, i) => [key(S('pulse').start + i * .85 + .08, [0, 0, 0, 1.02, 1], 'out'), key(S('pulse').start + i * .85 + .3, N)]).flat()].filter(k => k[0] < S('pulse').end + .5));

      // 2. heart: the exterior turns into the cross-section on "four"; atria and ventricles are tagged
      scenes['x-heart'] = {objects: [plate('h-bg', 'x-bg-heart', 0), ...floaters('h', 7, 3), heartObj('h-ext', 'x-heart-ext'), heartObj('h-sec', 'x-heart-sec'), note('h'),
        label('h-atria', 50, hy(250), 34, T.atria, 'accent', {accent: '#4f72ad'}), label('h-vent', 50, hy(1010), 34, T.ventricles, 'accent', {accent: '#8e2a2a'})]};
      const open = cue('open');
      beat('h-ext', S('heart').start, open + .5);
      track('h-sec', [key(S('heart').start, [0, 0, 0, 1, 0]), key(open, [0, 0, 0, 1.02, 0]), key(open + .6, N, 'out'),
        ...Array.from({length: 12}, (_, i) => open + .9 + i * .9).filter(t => t < S('heart').end + .5).flatMap(t => [key(t + .08, [0, 0, 0, 1.03, 1], 'out'), key(t + .22, N)])]);
      motion.speechCue('open', 'h-sec');
      track('h-ext', [key(S('heart').start, N), key(open, N), key(open + .5, [0, 0, 0, 1.02, 0], 'in')]);
      kit.label('h-atria', 'atria'); kit.label('h-vent', 'ventricles'); kit.label('h-note', open + .4);

      // 3. right side: blue cells from the venae cavae into the right atrium, down to the right ventricle, up the trunk
      const RPATH = [HP(334, 90), HP(334, 330), HP(350, 470), HP(368, 600), HP(400, 720), HP(460, 640), HP(476, 470), HP(500, 320), HP(430, 260), HP(200, 254)];
      const IPATH = [HP(304, 1060), HP(312, 780), HP(330, 560), HP(380, 680), HP(440, 720), HP(470, 560), HP(510, 300), HP(640, 250), HP(880, 244)];
      scenes['x-right'] = {objects: [plate('r-bg', 'x-bg-heart', 0), ...floaters('r', 6, 7), heartObj('r-sec', 'x-heart-sec'), ...cells('r-c', 7, 'x-cell-b', RPATH), ...cells('r-i', 6, 'x-cell-b', IPATH),
        label('r-ra', 27, hy(450), 26, T.ra, 'accent', {accent: '#4f72ad'}), label('r-rv', 30, hy(770), 26, T.rv, 'accent', {accent: '#4f72ad'})]};
      beat('r-sec', S('right').start, S('right').end + .5);
      flow('r-c', 7, RPATH, cue('blue-in'), 4.2, .42); flow('r-i', 6, IPATH, cue('blue-in') + .1, 4.0, .5);
      motion.speechCue('blue-in', 'r-c0');
      kit.label('r-ra', 'ra', S('right').end - .9); kit.label('r-rv', 'rv', S('right').end - .9);

      // 4. lungs: blue cells in, oxygen at the air sacs (magnified), red cells back to the heart's left atrium
      const LH = {x: 50, y: 44, w: 92}, lx = sx => LH.x + (sx - 500) * LH.w / 1000, ly = sy => LH.y + (sy - 550) * (LH.w / 100) * 1000 / VH * 100 / 1000;
      const L_IN = [[lx(500), ly(760)], [lx(420), ly(700)], [lx(300), ly(560)]], L_OUT = [[lx(330), ly(700)], [lx(420), ly(780)], [lx(500), ly(830)], [lx(500), ly(900)]];
      scenes['x-lungs'] = {objects: [plate('l-bg', 'x-bg-lungs', 0), P('l-lungs', 'x-lungs', LH.x, LH.y, LH.w, 2, {flat: true}), P('l-vessels', 'x-lung-vessels', LH.x, LH.y, LH.w, 2, {flat: true}),
        P('l-heart', 'x-heart-ext', lx(500), ly(900), 26, 3, {flat: true}), ...cells('l-b', 5, 'x-cell-b', L_IN, 2.6), ...cells('l-r', 5, 'x-cell-r', L_OUT, 2.6),
        P('l-mag', 'x-alveoli', 74, 22, 40, 4, {flat: true}), ...Array.from({length: 4}, (_, i) => P(`l-o${i}`, 'x-o2', 64 + i * 6, 14, 4.4, 5, {flat: true})),
        P('l-mb', 'x-cell-b', 66, 24, 6, 5, {flat: true}), P('l-mr', 'x-cell-r', 80, 24, 6, 5, {flat: true}),
        label('l-tag', 35, 12, 36, T.lungs, 'chip'), label('l-o2tag', 74, 36, 30, T.o2, 'accent', {accent: '#2e6f8c'}), label('l-la', 50, ly(1010), 30, T.la, 'accent', {accent: '#c9413a'})]};
      kit.settle('l-lungs', S('lungs').start + .05, [0, .02, 0, .97, 0], .6);
      ambient('l-lungs', {breathe: [.012, 3, 0]});
      beat('l-heart', S('lungs').start, S('lungs').end + .5, {period: .85, amp: .05});
      kit.label('l-tag', S('lungs').start + .4, cue('o2') - .2);
      flow('l-b', 5, L_IN, S('lungs').start + .2, 1.4, .35);
      const ox = kit.settle('l-mag', 'o2', [0, 0, -6, .6, 0], .5);
      [0, 1, 2, 3].forEach(i => track(`l-o${i}`, [key(0, [0, 0, 0, .6, 0]), key(ox + .3 + i * .15, [0, 0, 0, .6, 0]), key(ox + .6 + i * .15, [0, .05, 0, 1, 1], 'out'), key(ox + 1.5 + i * .15, [.06, .09, 0, .7, 0], 'in')]));
      track('l-mb', [key(0, [0, 0, 0, 1, 0]), key(ox + .3, [0, 0, 0, 1, 0]), key(ox + .5, N), key(ox + 1.4, [.07, 0, 0, 1, 1]), key(ox + 1.7, [.08, 0, 0, 1, 0])]);
      track('l-mr', [key(0, [0, 0, 0, 1, 0]), key(ox + 1.4, [-.07, 0, 0, 1, 0]), key(ox + 1.7, [-.06, 0, 0, 1, 1]), key(S('lungs').end, [.02, 0, 0, 1, 1])]);
      kit.label('l-o2tag', ox + .9);
      flow('l-r', 5, L_OUT, cue('back'), 1.6, .35);
      motion.speechCue('back', 'l-r0');
      kit.label('l-la', cue('la'));
      motion.speechCue('la', 'l-la');

      // 5. body: the left ventricle squeezes; arteries draw to the head, then to the toes; red cells ride them
      const BW = 50, BX = 50, BY = 50, bx = sx => BX + (sx - 300) * BW / 600, by = sy => BY + (sy - 800) * (BW / 100) * 1000 / VH * 100 / 1000 * (W / 1000);
      const UP = [[bx(300), by(470)], [bx(300), by(300)], [bx(296), by(150)], [bx(300), by(92)]], DOWN = [[bx(300), by(470)], [bx(300), by(860)], [bx(260), by(1150)], [bx(222), by(1470)]];
      scenes['x-body'] = {objects: [plate('b-bg', 'x-bg-body', 0), P('b-body', 'x-body', BX, BY, BW, 2, {flat: true}), P('b-up', 'x-art-up', BX, BY, BW, 3, {flat: true}),
        P('b-down', 'x-art-down', BX, BY, BW, 3, {flat: true}), P('b-heart', 'x-heart-ext', bx(312), by(470), 19, 4, {flat: true}),
        ...cells('b-cu', 5, 'x-cell-r', UP, 3.4), ...cells('b-cd', 6, 'x-cell-r', DOWN, 3.4),
        label('b-lv', 68, by(400), 28, T.lv, 'accent', {accent: '#c9413a'})]};
      const sq = cue('squeeze');
      track('b-heart', [key(S('body').start, [0, 0, 0, 1.4, 1]), key(S('body').start + .6, N, 'out'), key(sq, N), key(sq + .12, [0, 0, 0, .86, 1], 'out'), key(sq + .4, [0, 0, 0, 1.04, 1]), key(sq + .6, N),
        ...Array.from({length: 8}, (_, i) => sq + 1 + i * .85).filter(t => t < S('body').end + .5).flatMap(t => [key(t + .08, [0, 0, 0, 1.05, 1], 'out'), key(t + .22, N)])]);
      kit.label('b-lv', sq);
      motion.speechCue('squeeze', 'b-lv');
      kit.draw('b-up', 'head', .8, 'up'); kit.draw('b-down', 'toes', .9, 'down');
      flow('b-cu', 5, UP, cue('head'), 1.2, .3); flow('b-cd', 6, DOWN, cue('toes'), 1.5, .3);

      // 6. valves: two paper door leaflets swing open with the flow, then shut against a returning cell
      const VLV = {x: 50, y: 46, w: 100}, vy = sy => VLV.y + (sy - 350) * (VLV.w / 100) / VH * 100;
      const FWD = [[6, vy(350)], [50, vy(350)], [96, vy(350)]];
      scenes['x-valves'] = {objects: [plate('v-bg', 'x-bg-valve', 0), ...floaters('v', 8, 19), P('v-vessel', 'x-vessel', VLV.x, VLV.y, VLV.w, 1, {flat: true}),
        P('v-lt', 'x-leaf-up', 50, vy(290), 10, 3, {flat: true, origin: '15% 0%'}), P('v-lb', 'x-leaf-down', 50, vy(410), 10, 3, {flat: true, origin: '15% 100%'}),
        ...cells('v-c', 6, 'x-cell-r', FWD, 8), P('v-back', 'x-cell-r', 70, vy(350), 8, 2, {flat: true}),
        label('v-tag', 50, vy(80), 30, T.valve, 'accent', {accent: '#8e2a2a'}), label('v-x', 62, vy(350), 8, '✕', 'chip')]};
      const vo = cue('vopen'), vs = cue('stop');
      kit.pose('v-lt', [[S('valves').start, 0], [vo - .2, 0], [vo + .3, -62, 'out'], [vs - .3, -62], [vs, 0, 'in']]);
      kit.pose('v-lb', [[S('valves').start, 0], [vo - .2, 0], [vo + .3, 62, 'out'], [vs - .3, 62], [vs, 0, 'in']]);
      kit.label('v-tag', S('valves').start + .3);
      flow('v-c', 6, FWD, vo, 1.6, .22);
      motion.speechCue('vopen', 'v-c0');
      track('v-back', [key(0, [0, 0, 0, 1, 0]), key(vs - .2, [0, 0, 0, 1, 0]), key(vs - .1, N), key(vs + .3, [-.13, 0, 0, 1, 1], 'in'), key(vs + .45, [-.11, 0, 0, 1, 1], 'out'), key(vs + 1.4, [-.1, 0, 0, 1, 1])]);
      motion.speechCue('stop', 'v-x');
      track('v-x', [key(0, [0, 0, 0, .6, 0]), key(vs + .25, [0, 0, 0, .6, 0]), key(vs + .45, N, 'out')]);

      // 7. lub-dub: the heart again; the valves snap shut with sound rings and cut-paper words
      scenes['x-lubdub'] = {objects: [plate('d-bg', 'x-bg-heart', 0), ...floaters('d', 6, 11), heartObj('d-sec', 'x-heart-sec'), P('d-r1', 'x-rings', hx(370), hy(580), 26, 3, {flat: true}),
        P('d-r2', 'x-rings', hx(560), hy(560), 26, 3, {flat: true}), label('d-lub', 36, 31, 26, T.lub, 'plain'), label('d-dub', 64, 31, 26, T.dub, 'plain')]};
      const lub = cue('lub'), dub = cue('dub');
      beat('d-sec', S('lubdub').start, S('lubdub').end + .5, {period: .9, amp: .04});
      kit.settle('d-lub', 'lub', [0, .02, -8, 1.4, 0], .25); kit.settle('d-dub', 'dub', [0, .02, 8, 1.4, 0], .25);
      track('d-r1', [key(0, [0, 0, 0, .3, 0]), key(lub, [0, 0, 0, .3, 0]), key(lub + .05, [0, 0, 0, .4, 1]), key(lub + .6, [0, 0, 0, 1.3, 0], 'out')]);
      track('d-r2', [key(0, [0, 0, 0, .3, 0]), key(dub, [0, 0, 0, .3, 0]), key(dub + .05, [0, 0, 0, .4, 1]), key(dub + .6, [0, 0, 0, 1.3, 0], 'out')]);

      // 8. spark: the SA node fires; the wave crosses the atria, then the ventricles; the beat goes on
      scenes['x-spark'] = {objects: [plate('s-bg', 'x-bg-heart', 0), ...floaters('s', 6, 13), heartObj('s-sec', 'x-heart-sec'), P('s-wa', 'x-wave-a', H.x, H.y, H.w, 3, {flat: true}), P('s-wv', 'x-wave-v', H.x, H.y, H.w, 3, {flat: true}),
        P('s-star', 'x-star', hx(330), hy(366), 14, 4, {flat: true}), label('s-tag', hx(240), hy(150), 40, T.spark, 'chip')]};
      const sp = cue('spark');
      beat('s-sec', S('spark').start, S('spark').end + .5, {period: .9, amp: .04});
      track('s-star', [key(0, [0, 0, 0, .3, 0]), key(sp, [0, 0, 0, .3, 0]), key(sp + .15, [0, 0, 20, 1.3, 1], 'out'), key(sp + .5, [0, 0, 40, 1, 1]), ...Array.from({length: 6}, (_, i) => sp + 1 + i * .9).filter(t => t < S('spark').end).flatMap(t => [key(t, [0, 0, 40, 1, 1]), key(t + .1, [0, 0, 60, 1.25, 1], 'out'), key(t + .3, [0, 0, 80, 1, 1])])]);
      motion.speechCue('spark', 's-star');
      kit.label('s-tag', sp + .3);
      kit.draw('s-wa', sp + .4, .5, 'rightward'); kit.draw('s-wv', cue('wave'), .7, 'down');

      // cameras: always travelling; matched pushes into each next subject
      const chest = [manX / 100 - .5 + .006, (manY - 6.6) / 100 - .5];
      const cameras = {
        pulse: kit.travel('pulse', [[S('pulse').start, 0, .04, 1.06], [cue('rate'), .02, .02, 1.1], [cue('ecg'), -.02, -.02, 1.12], [S('pulse').end, chest[0], chest[1], 2.6, 'in']]),
        heart: kit.travel('heart', [[S('heart').start, 0, .02, 1.25, 'out'], [open, 0, 0, 1.08], [S('heart').end, 0, -.01, 1.12]]),
        right: kit.travel('right', [[S('right').start, -.06, .06, 1.2], [cue('ra'), -.08, 0, 1.25], [cue('rv'), -.04, .06, 1.22], [S('right').end, 0, -.12, 1.3]]),
        lungs: kit.travel('lungs', [[S('lungs').start, 0, -.06, 1.12, 'out'], [ox, .08, -.08, 1.12], [cue('back'), 0, .08, 1.12], [S('lungs').end, 0, .12, 1.2]]),
        body: kit.travel('body', [[S('body').start, 0, -.06, 1.25, 'out'], [cue('head'), 0, -.05, 1.1], [cue('toes'), 0, .05, 1.06], [S('body').end, 0, 0, 1.02]]),
        valves: kit.travel('valves', [[S('valves').start, -.05, 0, 1.15], [vo, 0, 0, 1.1], [vs, .06, 0, 1.18], [S('valves').end, .04, 0, 1.14]]),
        lubdub: kit.travel('lubdub', [[S('lubdub').start, 0, .08, 1.15], [cue('lub'), 0, .06, 1.32], [S('lubdub').end, 0, .05, 1.38]]),
        spark: kit.travel('spark', [[S('spark').start, -.12, -.1, 1.45], [sp + .3, -.12, -.1, 1.45], [cue('wave'), 0, 0, 1.08], [S('spark').end, 0, 0, 1.0, 'out']]),
      };
      return {scenes, cameras, checks: {keyframes: [['hook', 1.0], ['window-push', S('pulse').end - .5], ['cross-section', cue('ventricles') + .6], ['right-side', cue('rv') + .5],
        ['lungs-oxygen', ox + 1.2], ['body-arteries', cue('toes') + .9], ['valves', vo + .6], ['lub-dub', dub + .45], ['spark', cue('wave') + .7]]}};
    },
  };
})();
