// E18 topic: "What happens when we send a WhatsApp message?" (te-IN, Tech Explainer, full-bleed). Original artwork only:
// no WhatsApp logo or trade dress (generic chat UI; grey/blue ticks are a UI convention). One hero, the locked message
// capsule, travels through four consistently lit spaces: desk at night -> city network -> server hall -> bedside at dawn.
(() => {
  const {f, sym} = globalThis.techShotArt;
  const K = globalThis.techKit, A = K.art;
  const T = {lock: 'తాళం', key: 'తాళంచెవి', server: 'సర్వర్', cant: 'చదవలేదు', off: 'ఆఫ్', days: 'ముప్పై రోజులు', you: 'మీ దగ్గర', friend: 'ఫ్రెండ్ దగ్గర'};
  const FONT = '"Nirmala UI","Segoe UI",sans-serif';
  const GREEN = '#2fae6e', GREEN_D = '#1f6e4a', CYAN = '#6fd3ff', GOLD = '#e8b54a', BLUE_TICK = '#4fb6ff';
  let VW = 1000, VH = 1778, O = [500, 900];
  const pc = ([x, y]) => [x / VW * 100, y / VH * 100];
  // the isometric city is drawn at full size and shown through one shared scale (it would not fit the frame otherwise)
  const SC = .62, netG = body => `<g transform="translate(500 ${f(VH * .5)}) scale(${SC}) translate(-500 ${f(-VH * .5)})">${body}</g>`;
  const pcN = ([x, y]) => pc([500 + (x - 500) * SC, VH * .5 + (y - VH * .5) * SC]);
  const I = (x, y, z) => A.iso(O, x, y, z);
  const rnd = i => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

  // ---------- shared props ----------
  const phone = (id, caseA, caseB, {header = true} = {}) => {
    const g = `<defs><linearGradient id="${id}-c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${caseB}"/><stop offset=".12" stop-color="${caseA}"/><stop offset=".88" stop-color="${caseA}"/><stop offset="1" stop-color="${caseB}"/></linearGradient>` +
      `<linearGradient id="${id}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1c22"/><stop offset="1" stop-color="#0a1418"/></linearGradient></defs>`;
    const doodles = Array.from({length: 26}, (_, i) => `<circle cx="${f(40 + rnd(i) * 340)}" cy="${f(130 + rnd(i + 40) * 620)}" r="${f(4 + rnd(i + 80) * 8)}" fill="none" stroke="#ffffff" stroke-opacity=".05" stroke-width="3"/>`).join('');
    return g + `<rect x="0" y="0" width="420" height="860" rx="58" fill="url(#${id}-c)"/><rect x="8" y="8" width="404" height="844" rx="52" fill="#05080a"/>` +
      `<rect x="22" y="22" width="376" height="816" rx="40" fill="url(#${id}-s)"/>` + doodles +
      (header ? `<rect x="22" y="22" width="376" height="96" rx="40" fill="#1c2a31"/><rect x="22" y="70" width="376" height="48" fill="#1c2a31"/>` +
        `<circle cx="78" cy="80" r="24" fill="#5c7a8a"/><circle cx="78" cy="72" r="9" fill="#cfe3ea"/><path d="M62 96c4-12 28-12 32 0" fill="#cfe3ea"/>` +
        `<text x="116" y="88" font-family='${FONT}' font-size="26" font-weight="700" fill="#e9f1f4">ఫ్రెండ్</text><circle cx="362" cy="80" r="4" fill="#9fb4bd"/><circle cx="346" cy="80" r="4" fill="#9fb4bd"/>` : '') +
      `<rect x="38" y="770" width="292" height="56" rx="28" fill="#1f2d34"/><circle cx="366" cy="798" r="30" fill="${GREEN}"/>` +
      `<path d="M352 798l30-13-10 13 10 13z" fill="#ffffff"/><rect x="398" y="200" width="6" height="70" rx="3" fill="${caseB}"/><rect x="398" y="290" width="6" height="110" rx="3" fill="${caseB}"/>` +
      `<path d="M30 30L250 30L60 520L30 520Z" fill="#ffffff" opacity=".035"/><rect x="0" y="0" width="420" height="860" rx="58" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3"/>`;
  };
  const bubble = (fill, incoming = false) => `<path d="${incoming ? 'M18 0H250a16 16 0 0 1 16 16V84a16 16 0 0 1-16 16H34a16 16 0 0 1-16-16V22L0 0Z' : 'M16 0H248L266 0L248 22V84a16 16 0 0 1-16 16H16A16 16 0 0 1 0 84V16A16 16 0 0 1 16 0Z'}" fill="${fill}"/>` +
    `<text x="${incoming ? 44 : 26}" y="62" font-family='${FONT}' font-size="40" font-weight="600" fill="#f2f7f5">హాయ్</text><text x="${incoming ? 188 : 160}" y="88" font-family='${FONT}' font-size="18" fill="#cfe0d8" opacity=".8">9:41</text>`;
  const ticks = (n, color) => Array.from({length: n}, (_, i) => `<path d="M${4 + i * 16} 16l9 9l20 -20" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const tickChip = (n, color) => `<rect x="0" y="0" width="150" height="70" rx="35" fill="#0e1a20e6" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>` +
    `<g transform="translate(${n === 1 ? 52 : 36} 18) scale(1.3)">${ticks(n, color)}</g>`;
  const capsule = id => `<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfeaff" stop-opacity=".38"/><stop offset=".5" stop-color="#6fd3ff" stop-opacity=".14"/><stop offset="1" stop-color="#2a6f9a" stop-opacity=".32"/></linearGradient>` +
    `<radialGradient id="${id}-h"><stop offset="0" stop-color="${CYAN}" stop-opacity=".5"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="200" cy="120" rx="200" ry="120" fill="url(#${id}-h)"/>` +
    `<g transform="translate(66 70) scale(.85)">${bubble(GREEN_D)}</g>` +
    `<rect x="40" y="52" width="320" height="136" rx="68" fill="url(#${id}-g)" stroke="#dff6ff" stroke-opacity=".75" stroke-width="4"/>` +
    `<path d="M80 72Q200 56 320 72" stroke="#ffffff" stroke-opacity=".7" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  const lockBody = () => `<defs><linearGradient id="mx-lb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe29a"/><stop offset=".5" stop-color="${GOLD}"/><stop offset="1" stop-color="#9a6a1c"/></linearGradient></defs>` +
    `<rect x="14" y="52" width="92" height="66" rx="14" fill="url(#mx-lb)" stroke="#6b4a12" stroke-width="3"/><circle cx="60" cy="80" r="9" fill="#5a3b0c"/><path d="M56 84h8l3 20h-14z" fill="#5a3b0c"/>` +
    `<path d="M24 60h72" stroke="#fff5cf" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>`;
  const shackle = () => `<path d="M32 58V36a28 28 0 0 1 56 0V58" fill="none" stroke="#5c6670" stroke-width="16" stroke-linecap="round"/><path d="M32 58V36a28 28 0 0 1 56 0V58" fill="none" stroke="#c9d2da" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M38 40a22 22 0 0 1 16 -24" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`;
  const key = id => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".6" stop-color="${GOLD}"/><stop offset="1" stop-color="#8a5c14"/></linearGradient>` +
    `<radialGradient id="${id}-h"><stop offset="0" stop-color="#ffd166" stop-opacity=".55"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="90" cy="40" rx="100" ry="46" fill="url(#${id}-h)"/><circle cx="40" cy="40" r="30" fill="url(#${id})" stroke="#6b4a12" stroke-width="3"/><circle cx="40" cy="40" r="11" fill="#1a1006"/>` +
    `<rect x="64" y="33" width="118" height="14" rx="6" fill="url(#${id})" stroke="#6b4a12" stroke-width="2"/><path d="M150 46v18h10v-18M168 46v12h10v-12" fill="url(#${id})" stroke="#6b4a12" stroke-width="2"/>`;
  const redX = () => `<circle cx="60" cy="60" r="54" fill="#2a0b0e" opacity=".85"/><path d="M34 34L86 86M86 34L34 86" stroke="#ff4d5e" stroke-width="14" stroke-linecap="round"/><circle cx="60" cy="60" r="54" fill="none" stroke="#ff4d5e" stroke-width="5"/>`;
  const question = () => `<circle cx="50" cy="50" r="46" fill="#0e1a20e6" stroke="${CYAN}" stroke-width="4"/><text x="50" y="70" text-anchor="middle" font-family='${FONT}' font-size="58" font-weight="800" fill="${CYAN}">?</text>`;

  // ---------- desk at night ----------
  const desk = () => {
    const deskY = VH * .73;
    const win = `<rect x="560" y="${f(VH * .08)}" width="380" height="${f(VH * .3)}" rx="10" fill="#0a1424"/>` +
      Array.from({length: 9}, (_, i) => `<rect x="${f(570 + i * 42)}" y="${f(VH * (.25 - rnd(i) * .1))}" width="38" height="${f(VH * (.13 + rnd(i) * .1))}" fill="#142238"/>`).join('') +
      Array.from({length: 40}, (_, i) => `<circle cx="${f(572 + rnd(i + 3) * 360)}" cy="${f(VH * (.12 + rnd(i + 9) * .24))}" r="${f(3 + rnd(i + 5) * 9)}" fill="${['#ffd27a', '#7fb8ff', '#ff9a7a', '#ffe9b0'][i % 4]}" opacity="${f(.25 + rnd(i) * .45)}"/>`).join('') +
      `<rect x="560" y="${f(VH * .08)}" width="380" height="${f(VH * .3)}" rx="10" fill="none" stroke="#2b3a52" stroke-width="14"/><path d="M750 ${f(VH * .08)}V${f(VH * .38)}M560 ${f(VH * .23)}H940" stroke="#2b3a52" stroke-width="8"/>`;
    const wood = `<defs><linearGradient id="mx-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a26"/><stop offset="1" stop-color="#2a1a12"/></linearGradient></defs>` +
      `<rect y="${f(deskY)}" width="${VW}" height="${f(VH - deskY)}" fill="url(#mx-wood)"/><rect y="${f(deskY)}" width="${VW}" height="8" fill="#8a5c3c"/>` +
      Array.from({length: 14}, (_, i) => `<path d="M0 ${f(deskY + 30 + i * 26)}Q${f(300 + rnd(i) * 300)} ${f(deskY + 20 + i * 26)} ${VW} ${f(deskY + 34 + i * 26)}" stroke="#7a4e32" stroke-opacity=".35" stroke-width="3" fill="none"/>`).join('');
    const lamp = `<path d="M90 ${f(deskY)}L130 ${f(VH * .44)}L250 ${f(VH * .34)}" stroke="#20262e" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M215 ${f(VH * .315)}L320 ${f(VH * .33)}L300 ${f(VH * .385)}L195 ${f(VH * .365)}Z" fill="#2a323c"/><ellipse cx="60" cy="${f(deskY + 6)}" rx="70" ry="14" fill="#20262e"/>` +
      A.beam([258, VH * .37], [420, deskY + 40], 60, 520, {id: 'mx-lampbeam', color: '#ffd9a0', strength: .22}) + A.halo(430, deskY + 30, 300, {id: 'mx-pool', color: '#ffcf8a', strength: .35});
    const mug = `<rect x="800" y="${f(deskY - 130)}" width="110" height="130" rx="14" fill="#c9533f"/><path d="M910 ${f(deskY - 104)}q46 4 40 44q-6 30 -40 30" fill="none" stroke="#c9533f" stroke-width="16"/>` +
      `<ellipse cx="855" cy="${f(deskY - 130)}" rx="55" ry="12" fill="#3a1a12"/><path d="M812 ${f(deskY - 120)}V${f(deskY - 14)}" stroke="#ffffff" stroke-opacity=".22" stroke-width="10"/>`;
    const plant = `<path d="M40 ${f(deskY)}L60 ${f(deskY - 110)}H170L190 ${f(deskY)}Z" fill="#3c5a74"/>` +
      [[80, -200, -30], [120, -260, 10], [160, -210, 40], [100, -170, -60], [150, -160, 60]].map(([x, y, r], i) => `<ellipse cx="${x}" cy="${f(deskY + y)}" rx="24" ry="70" transform="rotate(${r} ${x} ${f(deskY + y)})" fill="${['#2f7a52', '#3f9a66', '#2a6a48'][i % 3]}"/>`).join('');
    return A.darkStudio(VW, VH, {id: 'mx-desk', floor: .73, pool: [.5, .8], poolColor: '#ffcf8a', poolStrength: .18}) + win + wood + lamp + mug + plant +
      `<path d="M370 ${f(deskY + 4)}L400 ${f(VH * .66)}H600L630 ${f(deskY + 4)}Z" fill="#1a2028"/>`;
  };
  // ---------- city network (iso) ----------
  const BLOCKS = [];
  const city = () => {
    let s = A.isoGrid(O, {size: 900, step: 110, color: '#2d5a9a', opacity: .45});
    let k = 0;
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
      if ((i + j) % 3 === 0 && Math.abs(i) + Math.abs(j) < 7) continue;   // open plazas and the routes
      const h = 40 + rnd(i * 13 + j * 7) * 220, id = `mx-b${++k}`, x = i * 110 - 40, y = j * 110 - 40;
      s += A.litBox(O, {x, y, z: 0, w: 80, d: 80, h}, {base: ['#26324a', '#2c3a56', '#1f2a40'][k % 3], id, rim: .4});
      for (let w = 0; w < 5; w++) if (rnd(k * 9 + w) > .45) {
        const wx = x + 10 + rnd(k + w) * 56, wz = 12 + rnd(k * 3 + w) * (h - 30);
        s += `<path d="${A.poly([I(wx, y + 80, wz), I(wx + 10, y + 80, wz), I(wx + 10, y + 80, wz + 8), I(wx, y + 80, wz + 8)])}" fill="${['#ffd27a', '#9fd0ff'][w % 2]}" opacity=".85"/>`;
      }
    }
    return s;
  };
  const NET = {phone: [-360, 330], tower: [330, -360], others: [[-300, -250], [250, 280], [-120, -380], [380, 60], [-420, 40]]};
  const routePts = () => [I(NET.phone[0], NET.phone[1], 20), I(-150, 330, 20), I(-150, -150, 20), I(330, -150, 20), I(NET.tower[0], NET.tower[1], 40)];
  const route = () => A.trace(routePts(), {color: '#7ff0c8', width: 10, under: '#1d3a52', round: 30});
  const tower = () => { const [x, y] = NET.tower; return A.halo(...I(x, y, 300), 260, {id: 'mx-tw-h', color: CYAN, strength: .35}) +
    A.litBox(O, {x: x - 60, y: y - 60, z: 0, w: 120, d: 120, h: 460}, {base: '#3a4a66', id: 'mx-tw', metal: true, texture: 'mx-brushed'}) +
    Array.from({length: 8}, (_, i) => `<path d="${A.poly([I(x - 50, y + 60, 40 + i * 52), I(x + 50, y + 60, 40 + i * 52), I(x + 50, y + 60, 48 + i * 52), I(x - 50, y + 60, 48 + i * 52)])}" fill="${CYAN}" opacity="${f(.4 + rnd(i) * .5)}"/>`).join('') +
    `<path d="M${f(I(x, y, 460)[0])} ${f(I(x, y, 460)[1])}v-90" stroke="#9fb4c8" stroke-width="6"/><circle cx="${f(I(x, y, 550)[0])}" cy="${f(I(x, y, 550)[1])}" r="10" fill="#ff5a6a"/>`; };
  const miniPhone = ([x, y], id, glow = GREEN) => A.halo(...I(x, y, 60), 90, {id: `${id}-h`, color: glow, strength: .5}) +
    A.litBox(O, {x: x - 22, y: y - 6, z: 0, w: 44, d: 12, h: 90}, {base: '#1c2430', id, rim: .7}) +
    `<path d="${A.poly([I(x - 18, y + 6, 8), I(x + 18, y + 6, 8), I(x + 18, y + 6, 84), I(x - 18, y + 6, 84)])}" fill="${glow}" opacity=".85"/>`;
  const otherRoutes = () => NET.others.map(([x, y], i) => A.trace([I(x, y, 20), I(x, 0, 20), I(NET.tower[0] - 40 * i, 0, 20), I(NET.tower[0], NET.tower[1], 40)], {color: ['#7ff0c8', '#ffd27a', '#9fd0ff'][i % 3], width: 6, under: null, round: 24})).join('');
  // ---------- server hall ----------
  const hall = () => {
    const H = [500, VH * .6];
    const J = (x, y, z) => A.iso(H, x, y, z);
    let s = A.darkStudio(VW, VH, {id: 'mx-hall', floor: .5, wall: ['#0d1422', '#080c14'], ground: ['#0e1626', '#070a12'], pool: [.5, .62], poolColor: CYAN, poolStrength: .22}) + A.isoGrid(H, {size: 700, step: 70, color: '#3a6aa0', opacity: .35});
    let k = 0;
    for (const row of [-420, -300]) for (let i = -5; i <= 5; i++) {
      const x = i * 80, y = row, id = `mx-r${++k}`;
      s += A.litBox(H, {x, y, z: 0, w: 64, d: 70, h: 330}, {base: '#262f3e', id, metal: true, texture: 'mx-brushed', rim: .35});
      for (let l = 0; l < 9; l++) { const [px, py] = J(x + 8 + (l % 3) * 18, y + 70, 30 + Math.floor(l / 3) * 90 + rnd(k + l) * 50); s += `<circle cx="${f(px)}" cy="${f(py)}" r="3.5" fill="${['#7ff0c8', CYAN, '#ffd27a'][l % 3]}" opacity="${f(.5 + rnd(k * 7 + l) * .5)}"/>`; }
    }
    s += A.isoCylinder(H, {r: 110, h: 60, top: '#2a3a52', side: '#141c2a', band: CYAN}) + A.beam([500, 0], J(0, 0, 70), 80, 300, {id: 'mx-hb', color: '#bfe6ff', strength: .2});
    return s;
  };
  const vault = () => { const H = [500, VH * .6]; return A.glassBack(H, {x: 220, y: 40, z: 40, w: 220, d: 160, h: 120}) + A.glassFront(H, {x: 220, y: 40, z: 40, w: 220, d: 160, h: 120}, {tint: '#9fd8ff', opacity: .14}) +
    A.litBox(H, {x: 220, y: 40, z: 0, w: 220, d: 160, h: 40}, {base: '#2a3346', id: 'mx-vb', metal: true}); };
  const scanner = () => `<rect x="0" y="40" width="120" height="16" rx="8" fill="#3a4556"/><circle cx="150" cy="48" r="46" fill="#1a2130" stroke="#5c6878" stroke-width="8"/>` +
    `<circle cx="150" cy="48" r="26" fill="#ff4d5e"/><circle cx="141" cy="40" r="8" fill="#ffd0d6"/>`;
  const scanBeam = () => `<defs><linearGradient id="mx-sb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff4d5e" stop-opacity=".55"/><stop offset="1" stop-color="#ff4d5e" stop-opacity="0"/></linearGradient></defs><path d="M0 50L400 0V100Z" fill="url(#mx-sb)"/>`;
  const exitRoute = () => { const H = [500, VH * .6]; const J = (x, y, z) => A.iso(H, x, y, z); return A.trace([J(0, 0, 70), J(0, 260, 30), J(380, 260, 30), J(380, 520, 30)], {color: '#7ff0c8', width: 10, under: null, round: 30}); };
  const inset = (content, ring = CYAN) => `<defs><clipPath id="mx-ic-${ring.slice(1)}"><circle cx="150" cy="150" r="140"/></clipPath></defs><circle cx="150" cy="150" r="146" fill="#060a10"/>` +
    `<g clip-path="url(#mx-ic-${ring.slice(1)})">${content}</g><circle cx="150" cy="150" r="144" fill="none" stroke="${ring}" stroke-width="8"/>`;
  const darkPhoneInset = () => inset(`<rect width="300" height="300" fill="#0a1020"/><circle cx="230" cy="70" r="30" fill="#e8eef8"/><circle cx="242" cy="62" r="26" fill="#0a1020"/>` +
    Array.from({length: 12}, (_, i) => `<circle cx="${f(rnd(i) * 300)}" cy="${f(rnd(i + 7) * 140)}" r="2" fill="#ffffff" opacity=".7"/>`).join('') +
    `<g transform="translate(95 90) scale(.26)">${phone('mx-ip', '#4a3a6a', '#2a2040', {header: false})}<rect x="22" y="22" width="376" height="816" rx="40" fill="#020304"/></g>`, '#8a7ab8');
  // ---------- bedside at dawn ----------
  const room = () => {
    const tY = VH * .72;
    return `<defs><linearGradient id="mx-rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a33"/><stop offset="1" stop-color="#0b0f1e"/></linearGradient></defs><rect width="${VW}" height="${VH}" fill="url(#mx-rw)"/>` +
      `<rect x="60" y="${f(VH * .08)}" width="360" height="${f(VH * .36)}" rx="12" fill="#101a36"/>` + Array.from({length: 26}, (_, i) => `<circle cx="${f(80 + rnd(i) * 320)}" cy="${f(VH * (.1 + rnd(i + 5) * .3))}" r="${f(1.5 + rnd(i + 2) * 2.5)}" fill="#ffffff" opacity="${f(.4 + rnd(i) * .5)}"/>`).join('') +
      `<circle cx="320" cy="${f(VH * .15)}" r="44" fill="#eef2fb"/><circle cx="338" cy="${f(VH * .14)}" r="40" fill="#101a36"/>` +
      `<rect x="60" y="${f(VH * .08)}" width="360" height="${f(VH * .36)}" rx="12" fill="none" stroke="#2a3456" stroke-width="16"/><path d="M240 ${f(VH * .08)}V${f(VH * .44)}" stroke="#2a3456" stroke-width="10"/>` +
      `<path d="M0 ${f(VH * .5)}C200 ${f(VH * .47)} 300 ${f(VH * .6)} 460 ${f(VH * .62)}L460 ${f(tY)}L0 ${f(tY)}Z" fill="#1c2242"/>` +   // the bed's edge and pillow mass
      `<rect y="${f(tY)}" width="${VW}" height="${f(VH - tY)}" fill="#2a1e1a"/><rect y="${f(tY)}" width="${VW}" height="10" fill="#4a362c"/>` +
      `<rect x="760" y="${f(tY - 210)}" width="40" height="210" fill="#3a3f4a"/><path d="M700 ${f(tY - 290)}H860L830 ${f(tY - 200)}H730Z" fill="#4a5060"/>` +
      `<rect x="80" y="${f(tY - 60)}" width="180" height="22" fill="#6a4a8a"/><rect x="90" y="${f(tY - 90)}" width="160" height="30" fill="#3a6a8a"/>` +
      `<path d="M370 ${f(tY + 4)}L400 ${f(VH * .65)}H600L630 ${f(tY + 4)}Z" fill="#1a1d28"/>`;
  };
  const dawn = () => `<defs><radialGradient id="mx-dawn" cx=".25" cy=".25" r=".9"><stop offset="0" stop-color="#ffb070" stop-opacity=".55"/><stop offset=".6" stop-color="#ff8a6a" stop-opacity=".12"/><stop offset="1" stop-color="#ff8a6a" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${VW}" height="${VH}" fill="url(#mx-dawn)"/>`;
  const srvInset = () => inset(`<rect width="300" height="300" fill="#0d1422"/>` + Array.from({length: 4}, (_, i) => `<rect x="${20 + i * 70}" y="40" width="54" height="220" rx="6" fill="#262f3e"/>` +
    Array.from({length: 6}, (_, l) => `<circle cx="${32 + i * 70 + (l % 2) * 20}" cy="${70 + l * 30}" r="4" fill="${CYAN}" opacity=".8"/>`).join('')).join(''));

  globalThis.techTopic = {
    shots: [
      {id: 'send', scene: 'm-desk', accent: GREEN},
      {id: 'lock', scene: 'm-desk', accent: GOLD, transition: {type: 'focus', lead: .3, tail: .35, blur: 16, zoom: .1}},
      {id: 'travel', scene: 'm-net', accent: '#7ff0c8', transition: {type: 'iris', lead: .35, tail: .4, x: .78, y: .3}},
      {id: 'server', scene: 'm-hall', accent: '#ff4d5e'},
      {id: 'wait', scene: 'm-hall', accent: '#8a7ab8', transition: {type: 'focus', lead: .3, tail: .35, blur: 14, zoom: .08}},
      {id: 'delivered', scene: 'm-room', accent: '#9fb4bd'},
      {id: 'unlock', scene: 'm-room', accent: BLUE_TICK, transition: {type: 'focus', lead: .3, tail: .35, blur: 14, zoom: .08}},
      {id: 'auto', scene: 'm-net', accent: BLUE_TICK},
    ],
    css: K.css + ` .piece-art { filter:none }
      html[data-presentation="full-bleed"] footer .ct { box-shadow: 0 16px 36px #0009, inset 0 1px 0 #ffffff2e, 0 0 0 1.5px #9fb8e04d }
      .vc-hook { color:#eef4ff; text-shadow:0 4px 24px #000c }`,
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}, hook: {text: 'మీ మెసేజ్ ఎలా ప్రయాణిస్తుంది?', highlight: 'మెసేజ్', until: 2.2}},
    symbols: ctx => {
      VH = Math.round(1000 / ctx.aspect); O = [500, VH * .5];
      const vb = `0 0 ${VW} ${VH}`;
      return A.textures('mx', {tile: 220, seed: 9}) + [
        sym('m-desk-bg', vb, desk()), sym('m-phone', '0 0 420 860', phone('mx-p1', '#3a4a5c', '#1c2430')), sym('m-phone-f', '0 0 420 860', phone('mx-p2', '#6a4a8a', '#3a2a52')),
        sym('m-typed', '0 0 300 60', `<text x="0" y="44" font-family='${FONT}' font-size="34" fill="#e9f1f4">హాయ్</text><rect x="86" y="14" width="3" height="36" fill="${GREEN}"/>`),
        sym('m-bubble', '0 0 270 104', bubble(GREEN_D)), sym('m-bubble-in', '0 0 270 104', bubble('#2a3942', true)),
        sym('m-t1', '0 0 150 70', tickChip(1, '#9fb4bd')), sym('m-t2', '0 0 150 70', tickChip(2, '#9fb4bd')), sym('m-t2b', '0 0 150 70', tickChip(2, BLUE_TICK)),
        sym('m-capsule', '0 0 400 240', capsule('mx-cap')), sym('m-lockbody', '0 0 120 120', lockBody()), sym('m-shackle', '0 0 120 120', shackle()),
        sym('m-key', '0 0 200 80', key('mx-k')), sym('m-x', '0 0 120 120', redX()), sym('m-q', '0 0 100 100', question()),
        sym('m-sendglow', '0 0 200 200', A.halo(100, 100, 100, {id: 'mx-sg', color: GREEN, strength: .8})),
        sym('m-steam', '0 0 60 160', '<path d="M30 150C10 110 50 90 30 50C20 30 30 15 34 6" stroke="#ffffff" stroke-opacity=".22" stroke-width="8" fill="none" stroke-linecap="round"/>'),
        sym('m-net-bg', vb, A.darkStudio(VW, VH, {id: 'mx-net0', floor: .2, wall: ['#0a1020', '#070b14'], ground: ['#0b1220', '#060910'], pool: [.5, .55], poolColor: '#3f7fd0', poolStrength: .2}) + netG(city())), sym('m-net-tower', vb, netG(tower())),
        sym('m-net-phones', vb, netG(miniPhone(NET.phone, 'mx-mp0') + NET.others.map((p, i) => miniPhone(p, `mx-mp${i + 1}`, ['#7ff0c8', '#ffd27a', '#9fd0ff'][i % 3])).join(''))),
        sym('m-route', vb, netG(route())), sym('m-routes', vb, netG(otherRoutes())),
        sym('m-hall-bg', vb, hall()), sym('m-vault', vb, vault()), sym('m-scanner', '0 0 200 100', scanner()), sym('m-scanbeam', '0 0 400 100', scanBeam()), sym('m-exit', vb, exitRoute()),
        sym('m-inset-off', '0 0 300 300', darkPhoneInset()), sym('m-room-bg', vb, room()), sym('m-dawn', vb, dawn()), sym('m-srv-inset', '0 0 300 300', srvInset()),
        sym('m-dark', '0 0 376 816', '<rect width="376" height="816" rx="40" fill="#020304"/>'),
        sym('m-beam-down', '0 0 300 1000', A.beam([150, 0], [150, 1000], 60, 260, {id: 'mx-bd', color: '#bfe6ff', strength: .3})),
      ].join('');
    },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient, reveal, show} = motion;
      const kit = K.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const label = (id, x, y, w, text, style = 'chip', extra = {}) => P(id, null, x, y, w, 5, {label: text, labelStyle: style, ...extra});
      const hide = [0, 0, 0, 1, 0];
      // phone geometry: symbol 420x860 placed at (PX, PY) % with width PW %
      const PX = 50, PY = 47, PW = 50, k = PW * 10 / 420, sx = x => PX + (x - 210) * k / 10, sy = y => PY + (y - 430) * k / VH * 100;
      const scenes = {};

      // ---- desk: send + lock ----
      scenes['m-desk'] = {objects: [plate('d-bg', 'm-desk-bg', 0), P('d-phone', 'm-phone', PX, PY, PW, 2, {flat: true}),
        P('d-typed', 'm-typed', sx(60 + 150), sy(798), 300 * k / 10, 3, {flat: true}), P('d-glow', 'm-sendglow', sx(366), sy(798), 200 * k / 10 * 1.4, 3, {flat: true}),
        P('d-bubble', 'm-bubble', sx(250), sy(640), 270 * k / 10, 3, {flat: true}), P('d-q', 'm-q', sx(330), sy(500), 9, 4, {flat: true}),
        P('d-steam1', 'm-steam', 84, 63, 4, 1, {flat: true}), P('d-steam2', 'm-steam', 87.5, 62, 3, 1, {flat: true}),
        P('d-capsule', 'm-capsule', sx(240), sy(620), 44, 4, {flat: true}), P('d-lock', 'm-lockbody', sx(240) + 1, sy(620) - 110 / VH * 100, 12, 5, {flat: true}), P('d-shackle', 'm-shackle', sx(240) + 1, sy(620) - 110 / VH * 100, 12, 5, {flat: true}),
        P('d-key1', 'm-key', 22, 30, 20, 5, {flat: true}), P('d-key2', 'm-key', 78, 30, 20, 5, {flat: true}),
        label('d-tlock', 50, 23, 30, T.lock, 'chip', {accent: '#b08420'}), label('d-tyou', 22, 36.5, 22, T.you, 'callout', {accent: GOLD}), label('d-tfriend', 78, 36.5, 26, T.friend, 'callout', {accent: GOLD})]};
      ambient('d-steam1', {drift: [.006, 3, 0], bob: [.004, 2.2, 0], flicker: [.5, 2.6, 0]}); ambient('d-steam2', {drift: [.005, 3.4, 1], bob: [.004, 2.6, 1], flicker: [.5, 3, 1]});
      const ty = cue('type'), sd = cue('send');
      show('d-typed', ty, hide, .05); reveal('d-typed', ty, ty + .5, 'rightward');
      track('d-typed', [key(0, hide), key(ty, hide), key(ty + .05, N), key(sd, N), key(sd + .15, hide)]);
      track('d-glow', [key(0, hide), key(sd - .05, hide), key(sd + .1, [0, 0, 0, 1.2, 1], 'out'), key(sd + .7, [0, 0, 0, 1.4, 0])]);
      track('d-bubble', [key(0, [0, .1, 0, .6, 0]), key(sd, [0, .1, 0, .6, 0]), key(sd + .45, N, 'out'), key(S('lock').start + .2, N)]);
      motion.speechCue('send', 'd-bubble');
      kit.label('d-q', 'mid', S('send').end - .3);
      const lk = cue('lock');
      track('d-capsule', [key(0, [0, 0, 0, .6, 0]), key(lk - .3, [0, 0, 0, .6, 0]), key(lk + .1, [0, 0, 0, 1, 1], 'out')]);
      track('d-lock', [key(0, [0, -.03, 0, .6, 0]), key(lk, [0, -.03, 0, .6, 0]), key(lk + .3, N, 'out')]);
      motion.speechCue('lock', 'd-lock');
      track('d-shackle', [key(0, [0, -.03, 0, .6, 0]), key(lk, [0, -.03, 0, .6, 0]), key(lk + .3, [0, -.012, 0, 1, 1], 'out'), key(lk + .55, N, 'in')]);
      kit.label('d-tlock', lk + .5, S('lock').end - .4);
      const ky = cue('key');
      track('d-key1', [key(0, [.1, .05, -30, .5, 0]), key(ky, [.1, .05, -30, .5, 0]), key(ky + .5, [0, 0, -12, 1, 1], 'out'), key(S('lock').end, [0, 0, -12, 1, 1])]);
      track('d-key2', [key(0, [-.1, .05, 30, .5, 0]), key(ky, [-.1, .05, 30, .5, 0]), key(ky + .5, [0, 0, 12, 1, 1], 'out'), key(cue('friendkey') + .2, [0, 0, 12, 1, 1]), key(cue('friendkey') + 1.0, [.18, -.12, 40, .6, 0], 'in')]);
      motion.speechCue('key', 'd-key1');
      kit.label('d-tyou', ky + .5, S('lock').end - .35); kit.label('d-tfriend', 'friendkey', cue('friendkey') + .8);
      ambient('d-capsule', {bob: [.004, 2.4, 0]});

      // ---- city network: travel + finale ----
      const R = routePts().map(pcN), rel = R.map(([x, y]) => [(x - R[0][0]) / 100, (y - R[0][1]) / 100]);
      const [tx, ty2] = pcN(I(NET.tower[0], NET.tower[1], 520));
      const others = NET.others.map(([x, y], i) => ({start: pcN(I(x, y, 20)), pts: [[x, y], [x, 0], [NET.tower[0] - 40 * i, 0], NET.tower].map(([a, b], j) => pcN(I(a, b, j === 3 ? 40 : 20)))}));
      scenes['m-net'] = {objects: [plate('n-bg', 'm-net-bg', 0), plate('n-routes', 'm-routes', 1, 'exact'), plate('n-route', 'm-route', 1, 'exact'), plate('n-phones', 'm-net-phones', 2, 'exact'),
        plate('n-tower', 'm-net-tower', 2, 'exact'), P('n-cap', 'm-capsule', ...R[0], 11, 4, {flat: true}),
        ...others.map((o, i) => P(`n-c${i}`, 'm-capsule', ...o.start, 8, 4, {flat: true})),
        P('n-tick', 'm-t1', R[0][0] + 6, R[0][1] - 12, 14, 5, {flat: true}), label('n-srv', tx, ty2 - 3, 22, T.server, 'chip', {accent: '#2b7fd6'}),
        P('n-blue', 'm-t2b', 50, 22, 20, 5, {flat: true})]};
      kit.trace('n-route', 'net', 1.1);
      track('n-routes', [key(0, hide), key(S('auto').start, hide), key(S('auto').start + .6, N)]);
      kit.travel('n-cap', cue('net') + .2, 2.4, rel);
      track('n-tick', [key(0, hide), key(cue('tick1'), [0, .01, 0, .8, 0]), key(cue('tick1') + .3, N, 'out'), key(S('travel').end, N), key(S('auto').start, hide)]);
      motion.speechCue('tick1', 'n-tick');
      kit.label('n-srv', 'server3', S('travel').end);
      others.forEach((o, i) => kit.travel(`n-c${i}`, cue('every') + i * .25, 2.2, o.pts.map(([x, y]) => [(x - o.start[0]) / 100, (y - o.start[1]) / 100])));
      track('n-blue', [key(0, hide), key(cue('auto'), [0, .01, 0, .8, 0]), key(cue('auto') + .35, N, 'out')]);
      motion.speechCue('auto', 'n-blue');
      motion.speechCue('every', 'n-c0');

      // ---- server hall: server + wait ----
      const HJ = (x, y, z) => pc(A.iso([500, VH * .6], x, y, z));
      const [cx, cy] = HJ(0, 0, 150), [vx, vy] = HJ(330, 120, 100);
      scenes['m-hall'] = {objects: [plate('h-bg', 'm-hall-bg', 0), plate('h-vault', 'm-vault', 2, 'exact'), plate('h-exit', 'm-exit', 2, 'exact'),
        P('h-cap', 'm-capsule', cx, cy, 38, 3, {flat: true}), P('h-lock', 'm-lockbody', cx + 1, cy - 95 / VH * 100, 10, 4, {flat: true}), P('h-shackle', 'm-shackle', cx + 1, cy - 95 / VH * 100, 10, 4, {flat: true}),
        P('h-scanner', 'm-scanner', 14, cy - 12, 22, 4, {flat: true}), P('h-beam', 'm-scanbeam', 32, cy - 9, 30, 3, {flat: true}), P('h-x', 'm-x', cx + 9, cy - 9, 10, 5, {flat: true}),
        label('h-cant', 50, cy - 20, 28, T.cant, 'chip', {accent: '#d63a4a'}), P('h-off', 'm-inset-off', 72, 22, 30, 5, {flat: true}), label('h-offt', 60, 13.5, 14, T.off, 'chip', {accent: '#8a7ab8'}),
        label('h-days', 72, 37, 34, T.days, 'readout', {accent: '#ffd27a'})]};
      ambient('h-cap', {bob: [.004, 2.2, 0]}); ambient('h-lock', {bob: [.004, 2.2, 0]}); ambient('h-shackle', {bob: [.004, 2.2, 0]});
      const ct = cue('cant');
      track('h-scanner', [key(S('server').start, [-.08, 0, 0, 1, 0]), key(S('server').start + .5, N, 'out')]);
      track('h-beam', [key(0, hide), key(ct - .5, hide), key(ct - .3, N), ...[0, 1, 2, 3].map(i => key(ct + i * .25, [0, 0, (i % 2 ? 5 : -5), 1, .9])), key(ct + 1.1, N), key(ct + 1.4, hide)]);
      track('h-x', [key(0, [0, 0, 0, .5, 0]), key(ct, [0, 0, 0, .5, 0]), key(ct + .25, N, 'out'), key(S('server').end - .3, N), key(S('server').end, hide)]);
      motion.speechCue('cant', 'h-x');
      kit.label('h-cant', 'wa', S('server').end - .2);
      kit.trace('h-exit', 'right', .9, S('server').end + .2);
      const mv = S('wait').start + .2, off = cue('off');
      for (const id of ['h-cap', 'h-lock', 'h-shackle']) track(id, [key(0, N), key(mv, N), key(mv + 1.1, [(vx - cx) / 100, (vy - cy) / 100, 0, .8, 1], 'smooth')]);
      track('h-off', [key(0, [0, 0, 0, .6, 0]), key(off, [0, 0, 0, .6, 0]), key(off + .35, N, 'out')]);
      motion.speechCue('off', 'h-off');
      kit.label('h-offt', off + .3, S('wait').end - .5); kit.label('h-days', 'days', S('wait').end - .35);

      // ---- bedside at dawn: delivered + unlock ----
      const FX = 50, FY = 45;
      scenes['m-room'] = {objects: [plate('r-bg', 'm-room-bg', 0), plate('r-dawn', 'm-dawn', 1, 'exact'), P('r-beam', 'm-beam-down', 50, 12, 30, 1, {flat: true}),
        P('r-phone', 'm-phone-f', FX, FY, PW, 2, {flat: true}), P('r-dark', 'm-dark', FX, FY, 376 * k / 10, 3, {flat: true}),
        P('r-cap', 'm-capsule', sx(220), sy(560), 44, 4, {flat: true}), P('r-lock', 'm-lockbody', sx(220) + 1, sy(560) - 110 / VH * 100, 12, 5, {flat: true}), P('r-shackle', 'm-shackle', sx(220) + 1, sy(560) - 110 / VH * 100, 12, 5, {flat: true}),
        P('r-key', 'm-key', 80, sy(560) - 110 / VH * 100, 20, 5, {flat: true}), P('r-bubble', 'm-bubble-in', sx(170), sy(560), 270 * k / 10, 3, {flat: true}),
        P('r-t2', 'm-t2', 50, 16, 20, 5, {flat: true}), P('r-t2b', 'm-t2b', 50, 16, 20, 5, {flat: true}), P('r-srv', 'm-srv-inset', 82, 20, 24, 5, {flat: true}), P('r-srvcap', 'm-capsule', 82, 20, 15, 5, {flat: true})]};
      const rc = cue('reach'), t2 = cue('tick2'), s6 = cue('srv6'), k7 = cue('key7'), op = cue('open'), bl = cue('blue');
      track('r-dawn', [key(0, hide), key(rc - .2, hide), key(rc + 1.6, N)]);
      track('r-beam', [key(0, hide), key(rc, hide), key(rc + .3, N, 'out'), key(rc + 1.6, N), key(rc + 2.2, hide)]);
      motion.speechCue('reach', 'r-beam');
      track('r-dark', [key(0, N), key(rc + .4, N), key(rc + .9, hide)]);
      for (const [id, dy] of [['r-cap', -.3], ['r-lock', -.3], ['r-shackle', -.3]]) track(id, [key(0, [0, dy, 0, .6, 0]), key(rc - .3, [0, dy, 0, .6, 0]), key(rc + .9, N, 'out'), key(op, N), key(op + .5, id === 'r-shackle' ? [0, -.02, 0, 1, 0] : [0, 0, 0, 1.15, 0])]);
      track('r-t2', [key(0, hide), key(t2, [0, .01, 0, .8, 0]), key(t2 + .3, N, 'out'), key(bl, N), key(bl + .3, hide)]);
      motion.speechCue('tick2', 'r-t2');
      track('r-srv', [key(0, [0, 0, 0, .7, 0]), key(s6, [0, 0, 0, .7, 0]), key(s6 + .3, N, 'out'), key(S('delivered').end - .2, N), key(S('delivered').end + .1, hide)]);
      motion.speechCue('srv6', 'r-srv');
      track('r-srvcap', [key(0, hide), key(s6, hide), key(s6 + .3, N), key(s6 + .7, N), key(s6 + 1.4, [0, 0, 20, .2, 0], 'in')]);
      track('r-key', [key(0, [.15, 0, 0, .7, 0]), key(k7, [.15, 0, 0, .7, 0]), key(k7 + .5, [-.08, .005, 0, .8, 1], 'out'), key(op, [-.105, .005, 90, .8, 1]), key(op + .4, [-.105, .005, 90, .8, 0])]);
      motion.speechCue('key7', 'r-key');
      track('r-bubble', [key(0, [0, .02, 0, .9, 0]), key(op, [0, .02, 0, .9, 0]), key(op + .4, N, 'out')]);
      motion.speechCue('open', 'r-bubble');
      track('r-t2b', [key(0, [0, 0, 0, .8, 0]), key(bl, [0, 0, 0, .8, 0]), key(bl + .3, [0, 0, 0, 1.1, 1], 'out'), key(bl + .6, N)]);
      motion.speechCue('blue', 'r-t2b');

      const cameras = {
        send: kit.cameraTravel('send', [[S('send').start, 0, .02, 1.0], [sd, .03, .1, 1.12], [S('send').end, 0, .06, 1.1]]),
        lock: kit.cameraTravel('lock', [[S('lock').start, 0, .06, 1.1], [lk, 0, .07, 1.16], [ky, 0, .02, 1.0], [S('lock').end, 0, .02, 1.04]]),
        travel: kit.cameraTravel('travel', [[S('travel').start, -.12, .12, 1.25, 'out'], [cue('net'), -.08, .08, 1.2], [cue('server3'), .1, -.1, 1.15], [S('travel').end, .14, -.14, 1.3, 'in']]),
        server: kit.cameraTravel('server', [[S('server').start, 0, .02, 1.12], [ct, -.02, -.02, 1.18], [S('server').end, .04, .02, 1.08]]),
        wait: kit.cameraTravel('wait', [[S('wait').start, .02, .02, 1.06], [off, .05, 0, 1.08], [S('wait').end, .06, 0, 1.1]]),
        delivered: kit.cameraTravel('delivered', [[S('delivered').start, 0, -.06, 1.1, 'out'], [rc, 0, -.02, 1.04], [S('delivered').end, 0, .02, 1.08]]),
        unlock: kit.cameraTravel('unlock', [[S('unlock').start, 0, .03, 1.1], [op, 0, .04, 1.2], [S('unlock').end, 0, 0, 1.05]]),
        auto: kit.cameraTravel('auto', [[S('auto').start, .1, -.1, 1.3, 'out'], [cue('every'), 0, 0, 1.05], [S('auto').end, 0, 0, 1.0]]),
      };
      return {scenes, cameras, checks: {keyframes: [['hook', 1.2], ['send', sd + .6], ['locked', ky + .8], ['travel', cue('tick1') + .5], ['cant-read', ct + .7],
        ['waiting', cue('days') + .7], ['delivered', t2 + .6], ['unlocked', bl + .7], ['every-message', cue('auto') + .6]]}};
    },
  };
})();
