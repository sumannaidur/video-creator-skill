// P013.3B.1–3B.4 flight explainer — opening (0–7.65 s, D), Scene 02 fuel (7.65–15.875 s, E), Scene 03 operations (15.875–26.575 s, F), Scene 04 pricing (26.575–31.9 s, G), Scene 05 cabin fares (31.9–41.875 s, H), Scene 06 holiday demand (41.875–51.45 s, I), Scene 07 shared journey (51.45–58.45 s, J), Scene 08 conclusion (58.45–68.8 s, K).
// Topic module for the P013.1 engine (experiments/E10/p013.1/paper-shots.js). All artwork is original inline SVG.
// All narration segments D–K are covered.
(() => {
  const {f, rnd, blob, sym} = globalThis.paperShotArt;
  const INK = '#252A30';
  const tufts = (seed, count, y0, hMin, hMax, colors, x0 = 0, x1 = 1000) => Array.from({length: count}, (_, i) => {
    const x = x0 + (i + rnd(seed + i)) * (x1 - x0) / count, h = hMin + (hMax - hMin) * rnd(seed + 40 + i), lean = (rnd(seed + 80 + i) - .5) * 50;
    return `<path d="M${f(x - 6)} ${y0}Q${f(x + lean * .4)} ${f(y0 - h * .6)} ${f(x + lean)} ${f(y0 - h)}Q${f(x + lean * .4 + 4)} ${f(y0 - h * .55)} ${f(x + 7)} ${y0}Z" fill="${colors[i % colors.length]}"/>`;
  }).join('');
  // Paper fibre hatching for flat areas (subtle, deterministic).
  const hatch = (seed, n, x0, y0, w, h, color, op = .35) => Array.from({length: n}, (_, i) => {
    const x = x0 + rnd(seed + i) * w, y = y0 + rnd(seed + 100 + i) * h, l = 18 + rnd(seed + 200 + i) * 34;
    return `<path d="M${f(x)} ${f(y)}l${f(l)} ${f(-l * .12)}" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="${op}"/>`;
  }).join('');
  const cloud = seed => `<path d="${blob(158, 92, 132, 44, 14, .16, seed)}" fill="#d4dde0"/>
    <path d="${blob(150, 80, 128, 46, 16, .18, seed + 3)}" fill="#fbfaf5" stroke="#c4ced2" stroke-width="2"/>
    <path d="${blob(118, 66, 70, 30, 12, .2, seed + 7)}" fill="#ffffff" opacity=".9"/>`;
  const ticket = (band, seed) => `
    <path d="M16 10H444Q450 10 450 16V84A20 20 0 0 0 450 126V194Q450 200 444 200H16Q10 200 10 194V126A20 20 0 0 0 10 84V16Q10 10 16 10Z" fill="#fff9ee" stroke="${INK}" stroke-width="3"/>
    <path d="M12 12H448V54H12Z" fill="${band}"/>
    <path d="M40 33l26-4 10-12 6 1-5 11 15-2 6-6 4 1-3 8 4 7-4 1-6-5-15-1 5 11-6 1-10-12-26-3Z" fill="#fff9ee"/>
    <path d="M330 62V192" stroke="${INK}" stroke-width="2.5" stroke-dasharray="7 7"/>
    <path d="M348 126h4M357 126h7M369 126h3M377 126h8M390 126h3M398 126h6M409 126h3M417 126h8" stroke="${INK}" stroke-width="44" transform="translate(0 34) scale(1 .5)"/>
    <path d="M350 76h70M350 94h46" stroke="#cbbfa8" stroke-width="8" stroke-linecap="round"/>
    <path d="M30 76h120M30 192h90" stroke="#ddd3bf" stroke-width="7" stroke-linecap="round"/>
    ${hatch(seed, 26, 20, 60, 300, 130, '#d8cdb6', .5)}`;

  const PLANE_X = 48, PLANE_Y = 56, PLANE_W = 64;
  // Scene 05 seat map (index = column * 6 + row). Pre-booked seats exist before the scene; NEW_BOOKINGS fill on «बिकती».
  const PRE_BOOKED = [1, 8, 15, 22, 27, 33], NEW_BOOKINGS = [3, 10, 14, 19, 24, 29, 31, 6], BOOKED = [...PRE_BOOKED, ...NEW_BOOKINGS]; // shared frame for every aircraft part (viewBox 0 0 640 260)

  globalThis.paperTopic = {
    shots: [
      {id: 'opening', scene: 'flights-opening', phrases: [0, 1], accent: '#DAB357',
        transition: {type: 'sheet', symbol: 'fes-wipe', half: .22}},
      {id: 'fuel', scene: 'flights-fuel', phrases: [2, 4], start: 7.65, accent: '#59758D',
        transition: {type: 'sheet', symbol: 'fos-wipe', half: .2}},
      {id: 'operations', scene: 'flights-operations', phrases: [5, 7], start: 15.875, accent: '#BF5942',
        transition: {type: 'sheet', symbol: 'fps-board', half: .2}},
      {id: 'pricing', scene: 'flights-pricing', phrases: [8, 8], start: 26.575, accent: '#DAB357',
        transition: {type: 'dissolve', symbol: 'fcs-seats', lead: .12, tail: .25, zoom: .3}},
      {id: 'cabin', scene: 'flights-cabin', phrases: [9, 11], start: 31.9, accent: '#427361',
        transition: {type: 'dissolve', symbol: 'fds-tiles', lead: .12, tail: .25, zoom: .2}},
      {id: 'holiday', scene: 'flights-holiday', phrases: [12, 14], start: 41.875, accent: '#e8873a',
        transition: {type: 'sheet', symbol: 'fjs-sky-sheet', half: .2}},
      {id: 'journey', scene: 'flights-journey', phrases: [15, 15], start: 51.45, accent: '#59758D',
        transition: {type: 'sheet', symbol: 'fps-board', half: .2}},
      {id: 'answer', scene: 'flights-answer', phrases: [16, 18], start: 58.45, accent: '#DAB357'},
    ],
    css: `
      #fl-price-low .piece-label, #fl-price-high .piece-label { background:transparent; box-shadow:none; padding:0 4px;
        font:800 66px/1.45 "Nirmala UI","Segoe UI",sans-serif; color:${INK}; letter-spacing:.01em }
      #fe-fuel-label .piece-label { font-size:46px; padding:6px 24px; border-left:10px solid #c98f2c }
      #fp-price .piece-label { background:transparent; box-shadow:none; padding:0 6px; font:800 84px/1.4 "Nirmala UI","Segoe UI",sans-serif; color:${INK} }
      #fp-not-alone .piece-label { font-size:44px; padding:8px 26px; border-left:10px solid #BF5942 }
      #fc-label-fares .piece-label { font-size:36px; padding:6px 22px; border-left:10px solid #DAB357 }
      #fc-price-low .piece-label, #fc-price-mid .piece-label, #fc-price-high .piece-label { font-size:42px; font-weight:800 }
      #fc-label-sold .piece-label { font-size:34px; color:#fff9ee; background:#BF5942 }
      #fd-price-old .piece-label, #fd-price-new .piece-label { background:transparent; box-shadow:none; padding:0 4px; font:800 50px/1.4 "Nirmala UI","Segoe UI",sans-serif; color:${INK} }
      #fd-label-limited .piece-label { border-left:10px solid #BF5942 }
      #fd-label-example .piece-label { font-size:28px; padding:2px 14px; background:#252A30; color:#fff9ee }
      #fj-price-a .piece-label, #fj-price-b .piece-label { background:transparent; box-shadow:none; padding:0 4px; font:800 50px/1.4 "Nirmala UI","Segoe UI",sans-serif; color:${INK} }
      #fj-tag-a .piece-label, #fj-tag-b .piece-label { background:transparent; box-shadow:none; padding:0 6px; font:700 22px/1.4 "Nirmala UI","Segoe UI",sans-serif; color:#fff9ee }
      #fj-label-journey .piece-label { border-left:10px solid #59758D }
      #fk-price-q .piece-label, #fk-price-final .piece-label { background:transparent; box-shadow:none; padding:0 6px; font:800 60px/1.4 "Nirmala UI","Segoe UI",sans-serif; color:${INK} }
      #fk-label-example .piece-label { font-size:26px; padding:2px 14px; background:#252A30; color:#fff9ee }
      #fk-label-0 .piece-label, #fk-label-1 .piece-label, #fk-label-2 .piece-label, #fk-label-3 .piece-label { font-size:34px; padding:2px 12px; box-shadow:none; background:transparent }
      #fl-tag-low .piece-label, #fl-tag-high .piece-label { background:transparent; box-shadow:none; padding:0 6px;
        font:700 27px/1.4 "Nirmala UI","Segoe UI",sans-serif; color:#fff9ee }`,
    symbols: () => [
      sym('fls-sky', '0 0 1000 1600', `
        <defs><linearGradient id="fl-g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c6d3"/><stop offset=".5" stop-color="#f3dcb4"/><stop offset="1" stop-color="#f2e7d2"/></linearGradient></defs>
        <rect width="1000" height="1600" fill="url(#fl-g-sky)"/>
        <circle cx="210" cy="430" r="320" fill="#fff1c9" opacity=".55"/>
        <path d="M0 360Q250 330 500 352T1000 340V420Q760 400 500 418T0 430Z" fill="#c3d6dc" opacity=".45"/>
        <path d="M0 520Q300 490 560 512T1000 500V560Q700 545 480 566T0 575Z" fill="#f6e6c6" opacity=".6"/>
        <circle cx="210" cy="430" r="68" fill="#f5c766"/><circle cx="210" cy="430" r="68" fill="none" stroke="#e2a84a" stroke-width="3" opacity=".6"/>`),
      sym('fls-far', '0 0 1000 1600', `
        <path d="M520 1000V860h40v-34h38v60h30v-96h52v70h34v-46h46v80h40v-120h26l12-40 12 40h20v150h44v-62h40v92h46V1000Z" fill="#c8cfd2"/>
        <path d="M0 1010Q120 900 260 930T520 900T780 935T1000 905V1040H0Z" fill="#c6cfb3"/>
        <path d="M0 1040Q200 975 420 1000T1000 985V1060H0Z" fill="#b2c19c"/>
        ${hatch(5, 30, 0, 930, 1000, 110, '#9fb08a', .35)}`),
      sym('fls-cloud-a', '0 0 300 150', cloud(11)),
      sym('fls-cloud-b', '0 0 300 150', cloud(29)),
      sym('fls-airport', '0 0 1000 1600', `
        <path d="M0 1002Q500 986 1000 1000V1600H0Z" fill="#d9d0bd"/>
        ${hatch(61, 60, 0, 1010, 1000, 100, '#c4b89f', .45)}
        <path d="M0 1060H1000V1124H0Z" fill="#a9bf8f"/>${tufts(3, 40, 1118, 8, 22, ['#8fab78', '#9cb683'])}
        <path d="M0 1266H1000V1600H0Z" fill="#9db586"/>
        <path d="M0 1124L1000 1116V1260L0 1268Z" fill="#6c7176" stroke="#474b51" stroke-width="3"/>
        ${hatch(91, 50, 0, 1130, 1000, 125, '#5c6166', .6)}
        <path d="M0 1132L1000 1124M0 1258L1000 1250" stroke="#efe7d6" stroke-width="5"/>
        ${Array.from({length: 9}, (_, i) => `<path d="M${150 + i * 105} ${1191 - i * .8}h58" stroke="#f4efe4" stroke-width="9" stroke-linecap="round"/>`).join('')}
        ${Array.from({length: 6}, (_, i) => `<path d="M${22 + i * 16} 1142v100" stroke="#f4efe4" stroke-width="8"/>`).join('')}
        ${Array.from({length: 13}, (_, i) => `<circle cx="${40 + i * 78}" cy="${1123 - i * .6}" r="5" fill="#f2c95c" stroke="${INK}" stroke-width="1.5"/><circle cx="${40 + i * 78}" cy="${1262 - i * .6}" r="5" fill="#f2c95c" stroke="${INK}" stroke-width="1.5"/>`).join('')}

        <path d="M110 860V650H160V860Z" fill="#efe9dd" stroke="${INK}" stroke-width="3"/>
        <path d="M122 680V850M148 680V850" stroke="#d3cab8" stroke-width="3"/>
        <path d="M70 650L90 580H180L200 650Z" fill="#8fb0bf" stroke="${INK}" stroke-width="3"/>
        <path d="M100 590V646M135 590V646M170 590V646" stroke="#6f8f9e" stroke-width="3"/>
        <path d="M80 580H190L178 562H92Z" fill="#59758D" stroke="${INK}" stroke-width="2.5"/>
        <path d="M135 562V520" stroke="${INK}" stroke-width="3"/><circle cx="135" cy="516" r="6" fill="#BF5942"/>
        <path d="M40 1000V836H600V1000Z" fill="#a9c0cc" stroke="${INK}" stroke-width="3"/>
        ${Array.from({length: 14}, (_, i) => `<path d="M${80 + i * 38} 842V978" stroke="#7d98a6" stroke-width="3"/>`).join('')}
        <path d="M40 905H600" stroke="#7d98a6" stroke-width="3"/>
        <path d="M60 842l40 136M220 842l40 136M380 842l40 136" stroke="#d7e4ea" stroke-width="10" opacity=".55"/>
        <path d="M40 978H600V1000H40Z" fill="#BF5942" stroke="${INK}" stroke-width="2.5"/>
        <path d="M14 846Q150 760 310 818T620 806L628 836Q470 828 310 846T18 872Z" fill="#efe9dd" stroke="${INK}" stroke-width="3"/>
        <path d="M60 850Q180 790 310 832" fill="none" stroke="#d3cab8" stroke-width="5"/>
        <path d="M600 930L690 958V986L600 962Z" fill="#d6ccbb" stroke="${INK}" stroke-width="2.5"/>
        <path d="M680 1032h70v22h-70Z" fill="#DAB357" stroke="${INK}" stroke-width="2.5"/><circle cx="694" cy="1058" r="8" fill="${INK}"/><circle cx="736" cy="1058" r="8" fill="${INK}"/>
        <path d="M770 1040h50v16h-50ZM830 1040h50v16h-50Z" fill="#e8e0cf" stroke="${INK}" stroke-width="2"/>`),
      sym('fls-plane-wing-far', '0 0 640 260', `<path d="M296 112L372 34H416L374 118Z" fill="#b8c4cb" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`),
      sym('fls-plane-body', '0 0 640 260', `
        <path d="M70 102L24 20H72L140 100Z" fill="#BF5942" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M42 34L64 34M50 50L74 50" stroke="#e7a08e" stroke-width="5" stroke-linecap="round"/>
        <path d="M60 126L6 108H30L110 124Z" fill="#d9cfc0" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M44 120Q44 98 74 96H540Q600 98 630 128Q602 154 540 158H74Q44 156 44 134Z" fill="#fbf8f1" stroke="${INK}" stroke-width="3.5"/>
        <path d="M60 140H560Q596 140 618 136Q596 154 540 158H74Q52 156 48 146Z" fill="#e8e1d2"/>
        <path d="M50 130H600" stroke="#427361" stroke-width="7"/>
        ${Array.from({length: 18}, (_, i) => `<circle cx="${150 + i * 21}" cy="114" r="5.5" fill="#59758D"/>`).join('')}
        <path d="M566 108Q590 106 608 118L586 122Q572 116 566 108Z" fill="#59758D" stroke="${INK}" stroke-width="2"/>
        <path d="M124 104h14v26h-14ZM500 104h14v26h-14Z" fill="none" stroke="#b9ae9a" stroke-width="2.5"/>
        ${hatch(41, 14, 90, 100, 460, 40, '#ddd4c2', .5)}`),
      sym('fls-plane-wing', '0 0 640 260', `<path d="M250 140L172 240H226L366 150Z" fill="#ece6da" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M200 222L316 156" stroke="#c9bfad" stroke-width="4"/>`),
      sym('fls-plane-engine', '0 0 640 260', `<path d="M270 160l14 18" stroke="${INK}" stroke-width="6"/>
        <path d="M218 178H300Q316 178 316 196Q316 214 300 214H218Q206 214 206 196Q206 178 218 178Z" fill="#cfd7db" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="308" cy="196" rx="8" ry="15" fill="${INK}"/><path d="M226 186H286" stroke="#eef2f3" stroke-width="5" stroke-linecap="round"/>`),
      sym('fls-plane-gear', '0 0 640 260', `<path d="M556 156V198M300 156V200M318 156V200" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="556" cy="208" r="12" fill="${INK}"/><circle cx="298" cy="212" r="13" fill="${INK}"/><circle cx="322" cy="212" r="13" fill="${INK}"/>
        <circle cx="556" cy="208" r="4" fill="#9aa3a9"/><circle cx="298" cy="212" r="4" fill="#9aa3a9"/><circle cx="322" cy="212" r="4" fill="#9aa3a9"/>`),
      sym('fls-plane-trail', '0 0 640 260', `<g fill="none" stroke-linecap="round">
        <path d="M30 112Q-80 104-200 116" stroke="#fff9ee" stroke-width="10"/><path d="M20 140Q-110 136-250 152" stroke="#DAB357" stroke-width="8"/>
        <path d="M60 170Q-40 170-150 186" stroke="#fff9ee" stroke-width="7"/></g>
        <path d="M600 92l10-26 6 26 26 8-26 6-6 26-10-26-26-6Z" fill="#fff6d8" stroke="#DAB357" stroke-width="2"/>`),
      sym('fls-plane-shadow', '0 0 400 60', `<defs><filter id="fl-soft" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="7"/></filter></defs>
        <ellipse cx="200" cy="30" rx="180" ry="16" fill="#2c3035" opacity=".35" filter="url(#fl-soft)"/>`),
      sym('fls-ticket-low', '0 0 460 210', ticket('#427361', 300)),
      sym('fls-ticket-high', '0 0 460 210', ticket('#BF5942', 500)),
      sym('fls-fg', '0 0 1000 1600', `${tufts(17, 30, 1600, 50, 120, ['#3f6b4c', '#5f8a5a', '#4d7a52'])}
        <path d="M40 1600V1450M960 1600V1430" stroke="#5c6166" stroke-width="10"/><circle cx="40" cy="1444" r="14" fill="#f2c95c" stroke="${INK}" stroke-width="3"/>
        <circle cx="960" cy="1424" r="14" fill="#f2c95c" stroke="${INK}" stroke-width="3"/>`),
      // ---------- Scene 02: apron, tanker and conceptual wing fuel-tank cutaway ----------
      sym('fes-wipe', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#efe6d2"/>
        ${hatch(701, 90, 0, 0, 1000, 1600, '#d9ccb1', .5)}
        <path d="M-20 1180Q500 1060 1020 1150M-20 520Q500 420 1020 500" fill="none" stroke="#DAB357" stroke-width="14" opacity=".55"/>
        <path d="M120 300h760M120 340h760M120 1300h760M120 1340h760" stroke="#d1c3a6" stroke-width="5" stroke-dasharray="40 26"/>`),
      sym('fes-terminal', '0 0 1000 1600', `<path d="M0 470H1000V990H0Z" fill="#a9c0cc"/>
        ${Array.from({length: 21}, (_, i) => `<path d="M${i * 50} 470V990" stroke="#7d98a6" stroke-width="3"/>`).join('')}
        <path d="M0 700H1000M0 860H1000" stroke="#7d98a6" stroke-width="3"/>
        <path d="M60 480l60 500M330 480l60 500M620 480l60 500M880 480l60 500" stroke="#d7e4ea" stroke-width="16" opacity=".45"/>
        <path d="M0 418H1000V476H0Z" fill="#efe9dd" stroke="${INK}" stroke-width="3"/><path d="M0 446H1000" stroke="#d3cab8" stroke-width="4"/>
        <path d="M0 960H1000V992H0Z" fill="#BF5942" stroke="${INK}" stroke-width="2.5"/>
        <path d="M760 960L800 820H850L840 960ZM120 960L150 860H190L185 960Z" fill="#c9d2d6" opacity=".9"/>`),
      sym('fes-apron', '0 0 1000 1600', `<path d="M0 985H1000V1600H0Z" fill="#d3cab6"/>
        ${hatch(733, 110, 0, 990, 1000, 610, '#bdb199', .5)}
        <path d="M0 1120H1000M0 1330H1000M260 985V1600M620 985V1600" stroke="#c2b69d" stroke-width="3"/>
        <path d="M-10 1310Q480 1236 1010 1282" fill="none" stroke="#DAB357" stroke-width="13"/>
        <path d="M60 1390H300" stroke="#f4efe4" stroke-width="12"/>
        <ellipse cx="520" cy="1012" rx="430" ry="20" fill="#3b3f45" opacity=".22"/>
        <path d="M0 690H150V790H0Z" fill="#d6ccbb" stroke="${INK}" stroke-width="3"/>
        ${Array.from({length: 4}, (_, i) => `<path d="M${14 + i * 34} 714h22v28h-22Z" fill="#8fb0bf" stroke="${INK}" stroke-width="2"/>`).join('')}
        <path d="M150 680H185V800H150Z" fill="#c9bfad" stroke="${INK}" stroke-width="3"/>
        <path d="M60 790V985M110 790V985" stroke="#5c6166" stroke-width="12"/><path d="M40 975h90v14h-90Z" fill="#5c6166"/>
        ${[[300, 1180], [880, 1210], [230, 1440]].map(([x, y]) => `<path d="M${x - 18} ${y}L${x} ${y - 48}L${x + 18} ${y}Z" fill="#d9773f" stroke="${INK}" stroke-width="2.5"/><path d="M${x - 10} ${y - 20}h20" stroke="#fff9ee" stroke-width="6"/>`).join('')}`),
      sym('fes-spot', '0 0 600 300', `<defs><radialGradient id="fes-g-spot"><stop offset="0" stop-color="#fff6d6" stop-opacity=".95"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient></defs>
        <ellipse cx="300" cy="150" rx="300" ry="150" fill="url(#fes-g-spot)"/>`),
      sym('fes-plane', '0 0 1000 380', `
        <path d="M520 142L604 64H646L606 142Z" fill="#b8c4cb" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M842 138L928 12H984L962 122Z" fill="#BF5942" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M886 36h46M876 60h48" stroke="#e7a08e" stroke-width="7" stroke-linecap="round"/>
        <path d="M34 202Q36 150 130 140H800Q900 132 986 112L994 150Q962 212 862 262H130Q40 256 34 202Z" fill="#fbf8f1" stroke="${INK}" stroke-width="4"/>
        <path d="M60 226Q120 252 140 252H860Q930 236 970 200L986 162Q960 222 862 262H130Q70 258 50 236Z" fill="#e8e1d2"/>
        <path d="M58 212H900" stroke="#427361" stroke-width="10"/>
        ${Array.from({length: 23}, (_, i) => `<circle cx="${190 + i * 26}" cy="180" r="7" fill="#59758D"/>`).join('')}
        <path d="M54 186Q70 166 110 164L104 186Z" fill="#59758D" stroke="${INK}" stroke-width="2.5"/>
        <path d="M160 156h20v40h-20ZM760 156h20v40h-20Z" fill="none" stroke="#b9ae9a" stroke-width="3"/>
        <path d="M960 160L1000 150L996 170L950 188Z" fill="#d9cfc0" stroke="${INK}" stroke-width="2.5"/>
        ${hatch(811, 24, 120, 145, 760, 60, '#ddd4c2', .5)}
        <path d="M130 262V330M470 262V336M500 262V336M760 262V336" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        ${[[130, 344], [470, 350], [500, 350], [760, 350]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="${INK}"/><circle cx="${x}" cy="${y}" r="7" fill="#9aa3a9"/>`).join('')}`),
      sym('fes-wing', '0 0 1000 380', `<path d="M400 236H640L870 352L796 364Z" fill="#ece6da" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M470 246L820 354M560 246L846 350" stroke="#d3c9b6" stroke-width="4"/>
        <path d="M470 262l24 30" stroke="${INK}" stroke-width="8"/>
        <path d="M420 290H560Q580 290 580 314Q580 338 560 338H420Q404 338 404 314Q404 290 420 290Z" fill="#cfd7db" stroke="${INK}" stroke-width="3.5"/>
        <ellipse cx="406" cy="314" rx="10" ry="22" fill="${INK}"/><path d="M430 300H548" stroke="#eef2f3" stroke-width="6" stroke-linecap="round"/>`),
      sym('fes-cutaway', '0 0 1000 380', `<path d="M590 250L640 250L824 344L780 350Z" fill="#33373c"/>
        <path d="M612 250l-6 6 8 6-6 8 10 8-6 10 12 6M640 252l8 10-6 8 12 6-4 10 14 8" fill="none" stroke="#fff9ee" stroke-width="5" stroke-linejoin="round"/>
        ${Array.from({length: 6}, (_, i) => `<path d="M${612 + i * 32} ${254 + i * 16}l${30 - i * 2} 2" stroke="#8a8f94" stroke-width="4"/>`).join('')}
        <path d="M590 250L640 250L824 344L780 350Z" fill="none" stroke="#fff9ee" stroke-width="6" stroke-dasharray="14 8"/>`),
      sym('fes-fuel', '0 0 1000 380', `<path d="M596 254L636 254L816 343L782 347Z" fill="#c98f2c"/>
        <path d="M600 258L632 258L700 292" fill="none" stroke="#f2cf7a" stroke-width="6" stroke-linecap="round"/>`),
      sym('fes-tanker', '0 0 420 200', `<path d="M120 52Q120 40 134 40H396Q410 40 410 54V152Q410 164 396 164H134Q120 164 120 152Z" fill="#ece4d2" stroke="${INK}" stroke-width="3.5"/>
        <path d="M122 96H408V114H122Z" fill="#DAB357"/><path d="M160 46v112M250 46v112M340 46v112" stroke="#d3c7ad" stroke-width="4"/>
        <path d="M12 168V96Q12 66 44 62H118V168Z" fill="#59758D" stroke="${INK}" stroke-width="3.5"/>
        <path d="M24 100Q26 78 46 76H96V112H24Z" fill="#cfe0e8" stroke="${INK}" stroke-width="2.5"/>
        <path d="M8 164H414V184H8Z" fill="#3b3f45"/><path d="M372 120l14 14-14 14-14-14Z" fill="#BF5942" stroke="${INK}" stroke-width="2"/>
        <path d="M138 40V20H178V40" fill="none" stroke="${INK}" stroke-width="4"/>
        ${[70, 210, 340].map(x => `<circle cx="${x}" cy="184" r="20" fill="${INK}"/><circle cx="${x}" cy="184" r="7" fill="#9aa3a9"/>`).join('')}
        ${hatch(907, 16, 130, 50, 270, 100, '#d6cbb2', .5)}`),
      sym('fes-hose', '0 0 1000 1600', `<path d="M650 1100Q606 990 652 888" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
        <path d="M650 1100Q606 990 652 888" fill="none" stroke="#6f7378" stroke-width="8" stroke-linecap="round"/>
        <path d="M634 1092h34v14h-34Z" fill="#5c6166" stroke="${INK}" stroke-width="2.5"/>
        <path d="M642 878l22 10-8 14-22-10Z" fill="#DAB357" stroke="${INK}" stroke-width="2.5"/>`),
      sym('fes-chev', '0 0 40 40', `<path d="M8 28L20 12L32 28" fill="none" stroke="#f2b33d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`),
      sym('fes-coin', '0 0 64 64', `<circle cx="32" cy="32" r="28" fill="#DAB357" stroke="${INK}" stroke-width="3"/><circle cx="32" cy="32" r="20" fill="none" stroke="#b8902f" stroke-width="3"/>
        <text x="32" y="44" text-anchor="middle" font-family="Nirmala UI, Segoe UI, sans-serif" font-size="32" font-weight="800" fill="${INK}">₹</text>`),
      sym('fes-fg', '0 0 1000 1600', `<path d="M70 1600L110 1470L150 1600Z" fill="#d9773f" stroke="${INK}" stroke-width="3"/><path d="M92 1530h36" stroke="#fff9ee" stroke-width="10"/>
        <path d="M860 1600V1500H990V1600Z" fill="#c9bfad" stroke="${INK}" stroke-width="3"/><path d="M880 1520h90v20h-90Z" fill="#DAB357" stroke="${INK}" stroke-width="2"/>`),
      // ---------- Scene 03: connected operations diorama (crew, hangar, lease office, terminal) ----------
      sym('fos-wipe', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#efe6d2"/>${hatch(951, 90, 0, 0, 1000, 1600, '#d9ccb1', .5)}
        <path d="M0 800H1000M500 0V1600" stroke="#d1c3a6" stroke-width="6" stroke-dasharray="30 20"/>
        <path d="M-20 1000Q500 900 1020 980" fill="none" stroke="#DAB357" stroke-width="12" opacity=".5"/>`),
      sym('fos-ops', '0 0 1000 1600', `
        <path d="M0 700H1000V1600H0Z" fill="#d3cab6"/>${hatch(977, 140, 0, 705, 1000, 895, '#bdb199', .5)}
        <path d="M0 260H470V700H0Z" fill="#efe9dd" stroke="${INK}" stroke-width="3.5"/><path d="M0 236H486V272H0Z" fill="#59758D" stroke="${INK}" stroke-width="3"/>
        ${[0, 1, 2, 3].flatMap(c => [0, 1].map(r => `<path d="M${40 + c * 108} ${310 + r * 120}h70v80h-70Z" fill="#a9c0cc" stroke="${INK}" stroke-width="2.5"/>`)).join('')}
        <path d="M200 580h80v120h-80Z" fill="#8fb0bf" stroke="${INK}" stroke-width="3"/><path d="M190 560h100v14H190Z" fill="#DAB357" stroke="${INK}" stroke-width="2"/>
        <path d="M520 700V330Q760 110 1000 330V700Z" fill="#c9c2b4" stroke="${INK}" stroke-width="3.5"/>
        <path d="M556 700V356Q760 180 964 356V700Z" fill="#3d4248"/>
        <path d="M600 330Q760 200 920 330M640 300V700M760 250V700M880 300V700" fill="none" stroke="#4d535a" stroke-width="6"/>
        <ellipse cx="760" cy="690" rx="200" ry="18" fill="#5a6068"/>
        <path d="M590 380H980L990 412H582Z" fill="#ece6da" stroke="${INK}" stroke-width="3"/>
        <path d="M600 700l40-130h60l40 130M620 640h100M610 670h120" fill="#b5835a" stroke="${INK}" stroke-width="3"/>
        <path d="M860 840h90v50h-90Z" fill="#BF5942" stroke="${INK}" stroke-width="3"/><path d="M880 840v-14h50v14" fill="none" stroke="${INK}" stroke-width="4"/>
        ${Array.from({length: 12}, (_, i) => `<path d="M${30 + i * 82} 945h46v40h-46Z" fill="#f4efe4" opacity=".85"/>`).join('')}
        <path d="M-10 1180Q500 1120 1010 1170" fill="none" stroke="#DAB357" stroke-width="12"/>
        <path d="M40 1000H560V1500H40Z" fill="#e7dcc6" stroke="${INK}" stroke-width="3.5"/>
        <path d="M40 1000H560V1030H40Z" fill="#c9bfad"/><path d="M120 1040H480V1130H120Z" fill="#a9c0cc" stroke="${INK}" stroke-width="2.5"/><path d="M300 1040V1130" stroke="${INK}" stroke-width="2.5"/>
        <path d="M70 1380H540V1412H70Z" fill="#b5835a" stroke="${INK}" stroke-width="3"/><path d="M100 1412V1490M510 1412V1490" stroke="${INK}" stroke-width="8"/>
        <path d="M470 1340l12-40h30l12 40Z" fill="#DAB357" stroke="${INK}" stroke-width="2.5"/><path d="M497 1300V1380" stroke="${INK}" stroke-width="4"/>
        <path d="M580 980H1000V1200H580Z" fill="#a9c0cc" stroke="${INK}" stroke-width="3.5"/>
        ${Array.from({length: 9}, (_, i) => `<path d="M${620 + i * 44} 986V1194" stroke="#7d98a6" stroke-width="3"/>`).join('')}
        <path d="M570 952H1000V984H570Z" fill="#efe9dd" stroke="${INK}" stroke-width="3"/><path d="M640 930h120v22H640Z" fill="#DAB357" stroke="${INK}" stroke-width="2.5"/>
        <path d="M930 860L968 760H1000V980H930Z" fill="#BF5942" stroke="${INK}" stroke-width="3"/>
        <path d="M575 1180H665V1300H575Z" fill="#59758D" stroke="${INK}" stroke-width="3"/><path d="M590 1196h60v34h-60Z" fill="#cfe0e8" stroke="${INK}" stroke-width="2"/><path d="M592 1242h56" stroke="${INK}" stroke-width="5"/>
        <path d="M440 1420H1000V1600H440Z" fill="#6c7176" stroke="#474b51" stroke-width="3"/>${hatch(991, 30, 450, 1430, 540, 160, '#5c6166', .6)}
        <path d="M470 1530H1000" stroke="#f4efe4" stroke-width="8" stroke-dasharray="50 40"/>`),
      ...[['pilot', '#2f4157', '#2f4157', 'pilot'], ['crew-a', '#BF5942', '#3b3f45', 'crew'], ['crew-b', '#BF5942', '#3b3f45', 'crew-case'],
          ['ground', '#59758D', '#3b3f45', 'ground'], ['mechanic', '#59758D', '#2f4157', 'mechanic']].map(([id, body, legs, kind], k) => {
        const skin = ['#a8704f', '#c98f6b', '#8d5a3c', '#b77d58', '#9c6646'][k];
        const hat = kind === 'pilot' ? `<path d="M32 52Q60 28 88 52L92 60H28Z" fill="#2f4157" stroke="${INK}" stroke-width="3"/><path d="M26 60H94" stroke="${INK}" stroke-width="5"/><circle cx="60" cy="46" r="5" fill="#DAB357"/>`
          : kind === 'ground' ? `<path d="M34 58Q36 30 60 30Q84 30 86 58Z" fill="#f2c95c" stroke="${INK}" stroke-width="3"/>`
          : kind === 'mechanic' ? `<path d="M34 56Q40 34 64 34Q84 36 86 56H96V62H34Z" fill="#59758D" stroke="${INK}" stroke-width="3"/>`
          : `<path d="M34 66Q34 38 60 38Q86 38 86 66Q80 52 60 52Q40 52 34 66Z" fill="#3b2a22"/><circle cx="60" cy="40" r="10" fill="#3b2a22"/>`;
        const extra = kind === 'pilot' ? `<path d="M30 116h18M72 116h18" stroke="#DAB357" stroke-width="5"/><path d="M60 110V200" stroke="#fff9ee" stroke-width="3"/><path d="M54 112l6 18 6-18" fill="#DAB357"/>`
          : kind.startsWith('crew') ? `<path d="M46 106L60 132L74 106Z" fill="#DAB357" stroke="${INK}" stroke-width="2"/>` + (kind === 'crew-case' ? `<path d="M100 210h18v66h-18Z" fill="#59758D" stroke="${INK}" stroke-width="2.5"/><path d="M104 210V180h10V210" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="104" cy="282" r="4" fill="${INK}"/><circle cx="114" cy="282" r="4" fill="${INK}"/>` : '')
          : kind === 'ground' ? `<path d="M34 112H86L90 200H30Z" fill="#e8873a" stroke="${INK}" stroke-width="2.5"/><path d="M33 140H87M32 168H88" stroke="#fff9ee" stroke-width="6"/><path d="M14 150L2 96M106 150L118 96" stroke="#e8873a" stroke-width="9" stroke-linecap="round"/>`
          : `<path d="M44 130h32v20H44Z" fill="#DAB357" stroke="${INK}" stroke-width="2"/>`;
        return sym(`fos-${id}`, '0 0 120 300', `
          <path d="M42 200V282M74 200V282" stroke="${legs}" stroke-width="16" stroke-linecap="round"/>
          <ellipse cx="40" cy="288" rx="13" ry="6" fill="${INK}"/><ellipse cx="78" cy="288" rx="13" ry="6" fill="${INK}"/>
          <path d="M30 110Q60 96 90 110L96 210H24Z" fill="${body}" stroke="${INK}" stroke-width="3"/>
          <path d="M30 116L16 196M90 116L104 196" stroke="${body}" stroke-width="15" stroke-linecap="round"/>
          <circle cx="15" cy="200" r="8" fill="${skin}"/><circle cx="105" cy="200" r="8" fill="${skin}"/>
          <path d="M52 92h16v16H52Z" fill="${skin}"/>
          <circle cx="60" cy="70" r="26" fill="${skin}" stroke="${INK}" stroke-width="3"/>${extra}${hat}`);
      }),
      sym('fos-envelope', '0 0 160 110', `<path d="M6 10H154V104H6Z" fill="#fff9ee" stroke="${INK}" stroke-width="3"/><path d="M6 10L80 66L154 10" fill="none" stroke="${INK}" stroke-width="3"/>
        <circle cx="80" cy="66" r="20" fill="#DAB357" stroke="${INK}" stroke-width="2.5"/>
        <text x="80" y="77" text-anchor="middle" font-family="Nirmala UI, Segoe UI, sans-serif" font-size="28" font-weight="800" fill="${INK}">₹</text>`),
      sym('fos-engine', '0 0 400 240', `<path d="M190 0H232L226 72H196Z" fill="#b8c4cb" stroke="${INK}" stroke-width="3"/>
        <path d="M40 70H330Q382 70 382 130Q382 190 330 190H40Q18 190 18 130Q18 70 40 70Z" fill="#cfd7db" stroke="${INK}" stroke-width="3.5"/>
        <ellipse cx="34" cy="130" rx="16" ry="56" fill="${INK}"/><path d="M34 84V176M22 110L46 150M46 110L22 150" stroke="#6f7378" stroke-width="3"/>
        <path d="M116 76H306V132H116Z" fill="#4a4f55"/><path d="M130 92H290M130 112H250" stroke="#BF5942" stroke-width="8" stroke-linecap="round"/>
        <circle cx="270" cy="112" r="12" fill="#DAB357" stroke="${INK}" stroke-width="2"/><path d="M150 120h40v8h-40Z" fill="#9aa3a9"/>
        <path d="M60 150H340" stroke="#eef2f3" stroke-width="6" stroke-linecap="round"/>`),
      sym('fos-cowl', '0 0 400 240', `<path d="M112 70H310V134H112Z" fill="#dfe5e8" stroke="${INK}" stroke-width="3"/>
        ${Array.from({length: 8}, (_, i) => `<circle cx="${124 + i * 25}" cy="78" r="3" fill="#9aa3a9"/><circle cx="${124 + i * 25}" cy="126" r="3" fill="#9aa3a9"/>`).join('')}`),
      sym('fos-wrench', '0 0 90 34', `<path d="M14 17H62" stroke="#9aa3a9" stroke-width="10" stroke-linecap="round"/><path d="M62 6a12 12 0 1 0 16 22l-8-8 2-6 6-2 8 8A12 12 0 0 0 62 6Z" fill="#9aa3a9" stroke="${INK}" stroke-width="2.5"/>`),
      sym('fos-doc', '0 0 260 330', `<path d="M10 10H210L250 50V320H10Z" fill="#fff9ee" stroke="${INK}" stroke-width="3"/><path d="M210 10V50H250" fill="#e8dfcc" stroke="${INK}" stroke-width="3"/>
        <path d="M12 12H208V66H12Z" fill="#59758D"/><path d="M40 40l24-4 8-10 5 1-4 9 13-2 5-5 3 1-2 7 3 6-3 1-5-4-13-1 4 9-5 1-8-10-24-3Z" fill="#fff9ee"/>
        <circle cx="150" cy="38" r="9" fill="none" stroke="#fff9ee" stroke-width="4"/><path d="M159 38h26M178 38v8M185 38v6" stroke="#fff9ee" stroke-width="4"/>
        ${Array.from({length: 7}, (_, i) => `<path d="M30 ${92 + i * 22}H${i % 3 === 2 ? 160 : 220}" stroke="#cbbfa8" stroke-width="7" stroke-linecap="round"/>`).join('')}
        <path d="M120 284H230" stroke="${INK}" stroke-width="2.5"/>`),
      sym('fos-sign', '0 0 260 330', `<path d="M126 276q10-24 18-4t14-2 10-14 6 10 14-8 8 6 18-4" fill="none" stroke="#2f4157" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`),
      sym('fos-stamp-mark', '0 0 260 330', `<g transform="rotate(-12 70 270)" opacity=".85"><circle cx="70" cy="270" r="34" fill="none" stroke="#BF5942" stroke-width="5"/>
        <circle cx="70" cy="270" r="26" fill="none" stroke="#BF5942" stroke-width="2"/><path d="M54 272l10 10 22-24" fill="none" stroke="#BF5942" stroke-width="6" stroke-linecap="round"/></g>`),
      sym('fos-stamp', '0 0 80 120', `<circle cx="40" cy="22" r="18" fill="#b5835a" stroke="${INK}" stroke-width="3"/><path d="M33 38h14v40H33Z" fill="#b5835a" stroke="${INK}" stroke-width="3"/>
        <path d="M10 78H70V100H10Z" fill="#8f3f2e" stroke="${INK}" stroke-width="3"/><path d="M14 100H66V110H14Z" fill="#BF5942"/>`),
      sym('fos-bridge', '0 0 300 120', `<path d="M10 30H250V90H10Z" fill="#d6ccbb" stroke="${INK}" stroke-width="3"/>
        ${Array.from({length: 5}, (_, i) => `<path d="M${30 + i * 44} 44h24v24h-24Z" fill="#8fb0bf" stroke="${INK}" stroke-width="2"/>`).join('')}
        <path d="M250 20H292V100H250Z" fill="#c9bfad" stroke="${INK}" stroke-width="3"/><path d="M120 90V118M200 90V118" stroke="${INK}" stroke-width="7"/>`),
      sym('fos-lights', '0 0 500 60', Array.from({length: 9}, (_, i) => `<circle cx="${28 + i * 56}" cy="30" r="22" fill="#ffe9a8" opacity=".55"/><circle cx="${28 + i * 56}" cy="30" r="9" fill="#f2c95c" stroke="${INK}" stroke-width="2"/>`).join('')),
      sym('fos-receipt', '0 0 120 225', `<path d="M6 4H114V212L102 222 90 212 78 222 66 212 54 222 42 212 30 222 18 212 6 222Z" fill="#fff9ee" stroke="${INK}" stroke-width="2.5"/>
        <path d="M40 24l16-3 6-7 4 1-3 6 9-1 4-4 2 1-2 5 2 4-2 1-4-3-9-1 3 6-4 1-6-7-16-2Z" fill="#59758D"/>
        ${[0, 1, 2, 3].map(i => `<text x="16" y="${70 + i * 30}" font-family="Nirmala UI, Segoe UI, sans-serif" font-size="18" font-weight="700" fill="${INK}">₹</text><path d="M34 ${64 + i * 30}H${96 - (i % 2) * 18}" stroke="#cbbfa8" stroke-width="6" stroke-linecap="round"/>`).join('')}
        <path d="M14 192H106" stroke="${INK}" stroke-width="3"/><path d="M34 206H100" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`),
      // ---------- Scene 04: expenses gather around one ticket, but the price is not theirs alone ----------
      sym('fps-board', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#e3d2b2"/>${hatch(1201, 160, 0, 0, 1000, 1600, '#cdb995', .55)}
        <path d="M0 400H1000M0 800H1000M0 1200H1000M250 0V1600M500 0V1600M750 0V1600" stroke="#d6c4a2" stroke-width="3"/>
        <path d="M40 60l90 10-6 34-90-10ZM880 1500l90 12-6 34-90-12Z" fill="#f3ead6" opacity=".85"/>`),
      sym('fps-threads', '0 0 1000 1600', `<g fill="none" stroke="#BF5942" stroke-width="5" stroke-dasharray="14 10" stroke-linecap="round">
        <path d="M200 1010Q230 820 300 660"/><path d="M440 1120Q420 880 430 664"/><path d="M700 1040Q660 840 610 664"/>
        <path d="M300 1300Q330 960 360 664"/><path d="M620 1340Q560 980 520 664"/></g>
        ${[[300, 660], [430, 664], [610, 664], [360, 664], [520, 664]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#BF5942" stroke="${INK}" stroke-width="2"/>`).join('')}`),
      sym('fps-thread-q', '0 0 1000 1600', `<path d="M850 712Q880 680 800 664" fill="none" stroke="${INK}" stroke-width="5" stroke-dasharray="4 10" stroke-linecap="round"/>
        <circle cx="800" cy="664" r="9" fill="#DAB357" stroke="${INK}" stroke-width="2"/>`),
      sym('fps-ring', '0 0 400 200', `<ellipse cx="200" cy="100" rx="186" ry="82" fill="none" stroke="#DAB357" stroke-width="10" stroke-dasharray="40 14" stroke-linecap="round"/>`),
      sym('fps-question', '0 0 160 220', `<path d="M38 70Q36 18 84 16Q132 16 130 64Q128 98 96 112Q84 120 84 142V152H56V134Q56 100 84 88Q102 80 102 64Q102 44 82 44Q64 44 64 70Z" fill="#DAB357" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="70" cy="190" r="18" fill="#DAB357" stroke="${INK}" stroke-width="4"/>
        <path d="M54 30Q70 22 90 26" fill="none" stroke="#f6dd9b" stroke-width="6" stroke-linecap="round"/>`),
      sym('fps-window', '0 0 140 190', `<rect x="8" y="8" width="124" height="174" rx="58" fill="#efe9dd" stroke="${INK}" stroke-width="4"/>
        <clipPath id="fps-win-clip"><rect x="24" y="26" width="92" height="138" rx="44"/></clipPath>
        <g clip-path="url(#fps-win-clip)"><rect x="20" y="20" width="100" height="150" fill="#e8dfcc"/>
        ${[0, 1, 2].map(r => [0, 1].map(c => `<path d="M${30 + c * 46} ${44 + r * 42}h36v34h-36Z" fill="#59758D" stroke="${INK}" stroke-width="2"/><path d="M${34 + c * 46} ${40 + r * 42}h28v10h-28Z" fill="#fff9ee"/>`).join('')).join('')}</g>
        <rect x="24" y="26" width="92" height="138" rx="44" fill="none" stroke="#c9bfad" stroke-width="4"/>`),
      // ---------- Scene 05: top-down paper cabin (one seat class) and a separate example fare rack ----------
      sym('fcs-seats', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#e8dfcc"/>
        ${Array.from({length: 12}, (_, r) => Array.from({length: 7}, (_, c) => `<g transform="translate(${c * 150 - 20 + (r % 2) * 75} ${r * 140 - 30})"><path d="M10 10h90v28H10Z" fill="#fff9ee" stroke="${INK}" stroke-width="3"/><path d="M14 38h82v70H14Z" fill="#59758D" stroke="${INK}" stroke-width="3"/></g>`).join('')).join('')}`),
      sym('fcs-board', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#d9e1e4"/>${hatch(1301, 120, 0, 0, 1000, 1600, '#c3ced3', .5)}`),
      sym('fcs-fuselage', '0 0 1000 1600', `
        <path d="M180 1090V300Q180 60 500 50Q820 60 820 300V1090Z" fill="#dfe5e8" stroke="${INK}" stroke-width="5"/>
        <path d="M214 1080V310Q214 96 500 86Q786 96 786 310V1080Z" fill="#efe6d2" stroke="#c9bfad" stroke-width="3"/>
        ${hatch(1311, 50, 220, 120, 560, 950, '#d9ccb1', .5)}
        <path d="M470 230H530V1080H470Z" fill="#c9bfad"/><path d="M470 230V1080M530 230V1080" stroke="#b5a98f" stroke-width="3"/>
        <path d="M240 180Q500 110 760 180V222H240Z" fill="#e3d6bd" stroke="${INK}" stroke-width="3"/><path d="M300 190v28M380 186v32M620 186v32M700 190v28" stroke="#c9bfad" stroke-width="4"/>
        ${[0, 1, 2, 3, 4, 5, 6].map(i => `<ellipse cx="197" cy="${260 + i * 120}" rx="8" ry="22" fill="#8fb0bf" stroke="${INK}" stroke-width="2"/><ellipse cx="803" cy="${260 + i * 120}" rx="8" ry="22" fill="#8fb0bf" stroke="${INK}" stroke-width="2"/>`).join('')}
        <path d="M214 1000H786" stroke="#BF5942" stroke-width="6" stroke-dasharray="20 14"/>`),
      sym('fcs-seat', '0 0 70 80', `<path d="M6 6H64V22H6Z" fill="#fff9ee" stroke="${INK}" stroke-width="2.5"/><path d="M8 22H62V72H8Z" fill="#59758D" stroke="${INK}" stroke-width="2.5"/>
        <path d="M2 30H8V70H2ZM62 30H68V70H62Z" fill="#3d4f63" stroke="${INK}" stroke-width="2"/><path d="M16 36H54" stroke="#7d93aa" stroke-width="4" stroke-linecap="round"/>`),
      sym('fcs-pax', '0 0 70 80', `<ellipse cx="35" cy="56" rx="24" ry="14" fill="#BF5942" stroke="${INK}" stroke-width="2.5"/><circle cx="35" cy="38" r="14" fill="#3b2a22" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="56" cy="16" r="10" fill="#427361" stroke="#fff9ee" stroke-width="2.5"/><path d="M51 16l4 4 7-8" fill="none" stroke="#fff9ee" stroke-width="3" stroke-linecap="round"/>`),
      sym('fcs-seat-glow', '0 0 1000 1600', [270, 340, 410, 590, 660, 730].flatMap(x => [0, 1, 2, 3, 4, 5].map(r => [x, 300 + r * 120])).map(([x, y]) => `<rect x="${x - 38}" y="${y - 44}" width="76" height="88" rx="14" fill="none" stroke="#DAB357" stroke-width="6"/>`).join('')),
      sym('fcs-avail', '0 0 1000 1600', [270, 340, 410, 590, 660, 730].flatMap(x => [0, 1, 2, 3, 4, 5].map(r => [x, 300 + r * 120])).filter((_, i) => !BOOKED.includes(i)).map(([x, y]) => `<rect x="${x - 36}" y="${y - 42}" width="72" height="84" rx="14" fill="#9fd1a5" fill-opacity=".25" stroke="#427361" stroke-width="5"/>`).join('')),
      sym('fcs-rack', '0 0 1000 1600', `<path d="M80 1150H920V1440H80Z" fill="#f3ead6" stroke="${INK}" stroke-width="4"/>
        ${[[230, '#427361'], [500, '#59758D'], [770, '#BF5942']].map(([x, c]) => `<path d="M${x - 115} 1170H${x + 115}V1420H${x - 115}Z" fill="#fff9ee" stroke="${INK}" stroke-width="3"/><path d="M${x - 115} 1170H${x + 115}V1192H${x - 115}Z" fill="${c}"/>`).join('')}
        ${hatch(1321, 30, 90, 1160, 820, 270, '#d8cdb6', .5)}`),
      sym('fcs-ticket-mid', '0 0 460 210', ticket('#59758D', 700)),
      sym('fcs-sold', '0 0 220 120', `<rect x="10" y="10" width="200" height="100" rx="16" fill="none" stroke="#BF5942" stroke-width="7" stroke-dasharray="22 12"/>
        <path d="M40 30L180 90M180 30L40 90" stroke="#BF5942" stroke-width="7" stroke-linecap="round" opacity=".7"/>`),
      // ---------- Scene 06: festive departures hall, growing queue, limited seats ----------
      sym('fds-tiles', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#BF5942"/>
        ${Array.from({length: 70}, (_, i) => { const x = rnd(i + 1400) * 1000, y = rnd(i + 1500) * 1600, r = 26 + rnd(i + 1600) * 30;
          return i % 3 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${i % 2 ? '#e8873a' : '#DAB357'}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .35)}" fill="#c0612b"/>`
            : `<path d="M${f(x - r)} ${f(y)}Q${f(x)} ${f(y + r * 1.2)} ${f(x + r)} ${f(y)}Z" fill="#f2c95c" stroke="${INK}" stroke-width="2"/>`; }).join('')}`),
      sym('fds-terminal', '0 0 1000 1600', `<path d="M0 0H1000V760H0Z" fill="#efe6d2"/>
        <path d="M0 60H1000V300H0Z" fill="#a9c0cc" stroke="${INK}" stroke-width="3"/>${Array.from({length: 11}, (_, i) => `<path d="M${i * 100} 60V300" stroke="#7d98a6" stroke-width="4"/>`).join('')}
        <path d="M40 70l50 220M420 70l50 220M780 70l50 220" stroke="#d7e4ea" stroke-width="16" opacity=".45"/>
        <path d="M0 40H1000V62H0ZM0 298H1000V318H0Z" fill="#d6ccbb" stroke="${INK}" stroke-width="2.5"/>
        ${[0, 1].map(k => `<path d="M${k * 500} 330Q${k * 500 + 250} ${420 - k * 10} ${k * 500 + 500} 330" fill="none" stroke="#5f8a5a" stroke-width="4"/>` +
          Array.from({length: 13}, (_, i) => { const t = i / 12, x = k * 500 + t * 500, y = 330 + 4 * (85 - k * 5) * t * (1 - t); return `<circle cx="${f(x)}" cy="${f(y)}" r="13" fill="${i % 2 ? '#e8873a' : '#DAB357'}" stroke="#b55a26" stroke-width="2"/>`; }).join('')).join('')}
        ${[140, 380, 620, 860].map(x => `<path d="M${x} 318V372" stroke="${INK}" stroke-width="2"/><path d="M${x - 22} 372H${x + 22}L${x + 16} 410Q${x} 420 ${x - 16} 410Z" fill="#f2c95c" stroke="${INK}" stroke-width="2.5"/><path d="M${x - 10} 384h20" stroke="#BF5942" stroke-width="5"/>`).join('')}
        <path d="M560 430H940V700H560Z" fill="#2f4157" stroke="${INK}" stroke-width="3.5"/>
        ${Array.from({length: 6}, (_, i) => `<path d="M584 ${470 + i * 38}h${150 - (i % 3) * 30}M800 ${470 + i * 38}h${100 - (i % 2) * 30}" stroke="#DAB357" stroke-width="12" opacity="${i % 2 ? .6 : .9}"/>`).join('')}
        <path d="M600 444l24-4 8-10 5 1-4 9 13-2 5-5 3 1-2 7 3 6-3 1-5-4-13-1 4 9-5 1-8-10-24-3Z" fill="#fff9ee" transform="translate(0 -2)"/>
        <path d="M0 760H1000V1600H0Z" fill="#d9cfbb"/>${hatch(1701, 120, 0, 770, 1000, 830, '#c4b89f', .5)}
        <path d="M0 900H1000M0 1080H1000M200 760V1600M500 760V1600M800 760V1600" stroke="#cbbfa6" stroke-width="3"/>
        <path d="M900 760V560H1000V760Z" fill="#8fb0bf" stroke="${INK}" stroke-width="3"/><path d="M890 530H1000V560H890Z" fill="#DAB357" stroke="${INK}" stroke-width="2.5"/>`),
      sym('fds-calendar', '0 0 340 360', `<path d="M10 20H330V350H10Z" fill="#fff9ee" stroke="${INK}" stroke-width="3.5"/><path d="M10 20H330V80H10Z" fill="#BF5942"/>
        <path d="M80 6v30M260 6v30" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M40 50h120" stroke="#fff9ee" stroke-width="10" stroke-linecap="round"/>
        ${Array.from({length: 35}, (_, i) => `<path d="M${26 + (i % 7) * 42} ${96 + Math.floor(i / 7) * 50}h38v44h-38Z" fill="#f6efe0" stroke="#d8cdb6" stroke-width="2"/><path d="M${32 + (i % 7) * 42} ${106 + Math.floor(i / 7) * 50}h12" stroke="#b9ae9a" stroke-width="4"/>`).join('')}`),
      sym('fds-holiday', '0 0 340 360', `${[2, 3, 4, 5].map(c => `<path d="M${26 + c * 42} 196h38v44h-38Z" fill="#DAB357" stroke="${INK}" stroke-width="2.5"/><circle cx="${45 + c * 42}" cy="${222}" r="8" fill="#e8873a"/>`).join('')}
        <rect x="104" y="188" width="180" height="60" rx="26" fill="none" stroke="#BF5942" stroke-width="6"/>
        <path d="M110 250Q194 300 278 250" fill="none" stroke="#5f8a5a" stroke-width="4"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="${120 + i * 38}" cy="${262 + (i === 2 ? 14 : i % 2 ? 10 : 0)}" r="9" fill="${i % 2 ? '#e8873a' : '#DAB357'}"/>`).join('')}`),
      ...[['a', '#427361', '#3b3f45', '#a8704f', 'roll'], ['b', '#DAB357', '#2f4157', '#c98f6b', 'back'], ['c', '#59758D', '#5c4b3b', '#8d5a3c', 'roll'], ['d', '#BF5942', '#3b3f45', '#b77d58', 'duffel']]
        .map(([id, body, legs, skin, bag]) => sym(`fds-traveler-${id}`, '0 0 140 300', `
          <path d="M42 200V282M74 200V282" stroke="${legs}" stroke-width="16" stroke-linecap="round"/>
          <ellipse cx="40" cy="288" rx="13" ry="6" fill="${INK}"/><ellipse cx="78" cy="288" rx="13" ry="6" fill="${INK}"/>
          ${bag === 'back' ? `<path d="M84 112h26v70H84Z" fill="#59758D" stroke="${INK}" stroke-width="2.5"/>` : ''}
          <path d="M30 110Q60 96 90 110L96 210H24Z" fill="${body}" stroke="${INK}" stroke-width="3"/>
          <path d="M30 116L16 196M90 116L104 196" stroke="${body}" stroke-width="15" stroke-linecap="round"/>
          <circle cx="15" cy="200" r="8" fill="${skin}"/><circle cx="105" cy="200" r="8" fill="${skin}"/><path d="M52 92h16v16H52Z" fill="${skin}"/>
          <circle cx="60" cy="70" r="26" fill="${skin}" stroke="${INK}" stroke-width="3"/><path d="M34 66Q34 40 60 40Q86 40 86 66Q80 54 60 54Q40 54 34 66Z" fill="#3b2a22"/>
          ${bag === 'roll' ? `<path d="M110 200h28v80h-28Z" fill="#BF5942" stroke="${INK}" stroke-width="2.5"/><path d="M114 200V166h18V200" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="114" cy="286" r="4" fill="${INK}"/><circle cx="134" cy="286" r="4" fill="${INK}"/>` : ''}
          ${bag === 'duffel' ? `<path d="M2 196Q4 176 30 176H88Q114 176 114 196V226H2Z" fill="#427361" stroke="${INK}" stroke-width="2.5"/>` : ''}`)),
      sym('fds-arrow', '0 0 80 120', `<path d="M40 6L74 48H54V114H26V48H6Z" fill="#e8873a" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`),
      sym('fds-capacity', '0 0 1000 1600', `<path d="M110 1170H890V1470H110Z" fill="#fff9ee" stroke="${INK}" stroke-width="4"/>${hatch(1801, 30, 120, 1180, 760, 280, '#e0d6c2', .5)}
        <path d="M200 1240H820Q860 1240 872 1328Q860 1416 820 1416H200Q150 1416 140 1328Q150 1240 200 1240Z" fill="#efe6d2" stroke="${INK}" stroke-width="3.5"/>
        <path d="M140 1328H180" stroke="${INK}" stroke-width="3"/><path d="M780 1240L840 1190H870L830 1240ZM780 1416L840 1460H870L830 1416Z" fill="#dfe5e8" stroke="${INK}" stroke-width="3"/>`),
      sym('fds-free', '0 0 1000 1600', [1290, 1365].map(y => `<rect x="697" y="${y - 42}" width="76" height="84" rx="14" fill="#9fd1a5" fill-opacity=".3" stroke="#427361" stroke-width="6"/>`).join('')),
      // ---------- Scene 07: side-view cabin, two passengers in identical seats, two example fares ----------
      sym('fjs-sky-sheet', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#b9d0db"/>
        ${[[200, 300, 3], [700, 520, 9], [350, 900, 15], [780, 1180, 21], [240, 1400, 27]].map(([x, y, sd]) => `<path d="${blob(x, y, 170, 60, 14, .16, sd)}" fill="#fbfaf5" opacity=".9"/>`).join('')}`),
      sym('fjs-sky', '0 0 1000 1600', `<defs><linearGradient id="fjs-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb4c8"/><stop offset="1" stop-color="#d8e6ec"/></linearGradient></defs>
        <rect width="1000" height="1600" fill="url(#fjs-g)"/>`),
      sym('fjs-wall', '0 0 1000 1600', `
        <path fill-rule="evenodd" fill="#e6dfd0" d="M0 0H1000V1600H0Z ${[250, 500, 750].map(x => `M${x - 66} 590A66 96 0 1 0 ${x + 66} 590A66 96 0 1 0 ${x - 66} 590Z`).join(' ')}"/>
        ${hatch(1901, 70, 0, 420, 1000, 700, '#d6cdb9', .5)}
        <path d="M0 0H1000V150Q500 120 0 150Z" fill="#efe9dd" stroke="${INK}" stroke-width="3"/>
        <path d="M0 160H1000V400Q500 430 0 400Z" fill="#f3ede2" stroke="${INK}" stroke-width="4"/>
        <path d="M330 168V408M670 168V408" stroke="${INK}" stroke-width="3"/><path d="M40 370H960" stroke="#d3cab8" stroke-width="5"/>
        ${[165, 500, 835].map(x => `<path d="M${x - 50} 260h100" stroke="#c9bfad" stroke-width="10" stroke-linecap="round"/>`).join('')}
        <path d="M0 412Q500 446 1000 412V430Q500 462 0 430Z" fill="#f2c95c" opacity=".55"/>
        ${[250, 500, 750].map(x => `<ellipse cx="${x}" cy="590" rx="66" ry="96" fill="none" stroke="#efe9dd" stroke-width="22"/><ellipse cx="${x}" cy="590" rx="78" ry="108" fill="none" stroke="${INK}" stroke-width="3"/><ellipse cx="${x}" cy="590" rx="56" ry="86" fill="none" stroke="#c9bfad" stroke-width="3"/>`).join('')}
        <path d="M0 1030H1000V1060H0Z" fill="#d3cab8"/><path d="M0 1180H1000V1600H0Z" fill="#59758D"/>${hatch(1911, 60, 0, 1190, 1000, 400, '#4a6278', .7)}
        <path d="M0 1180H1000" stroke="${INK}" stroke-width="4"/>`),
      sym('fjs-sign', '0 0 120 60', `<rect x="6" y="6" width="108" height="48" rx="10" fill="#3b3f45" stroke="${INK}" stroke-width="3"/>
        <circle cx="40" cy="30" r="14" fill="#f2c95c"/><path d="M68 22h30M68 38h22" stroke="#f2c95c" stroke-width="6" stroke-linecap="round"/>`),
      sym('fjs-seat', '0 0 260 400', `<path d="M60 30Q60 10 84 10H140Q160 10 160 34V270H60Z" fill="#59758D" stroke="${INK}" stroke-width="3.5"/>
        <path d="M70 30h80v36H70Z" fill="#fff9ee" stroke="${INK}" stroke-width="2.5"/><path d="M76 110v130M146 110v130" stroke="#4a6278" stroke-width="5"/>
        <path d="M60 250H236Q250 250 250 266V296H60Z" fill="#59758D" stroke="${INK}" stroke-width="3.5"/>
        <path d="M120 230H230" stroke="#3d4f63" stroke-width="12" stroke-linecap="round"/>
        <path d="M90 296L80 392M220 296L230 392M80 392H240" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`),
      ...[['a', '#427361', '#3b3f45', '#a8704f', '#3b2a22'], ['b', '#BF5942', '#2f4157', '#c98f6b', '#5c3d2e']].map(([id, top, legs, skin, hair]) => sym(`fjs-sitter-${id}`, '0 0 260 400', `
        <path d="M150 250H232L236 372" fill="none" stroke="${legs}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
        <ellipse cx="246" cy="378" rx="20" ry="9" fill="${INK}"/>
        <path d="M100 120Q130 104 160 118L170 262H96Z" fill="${top}" stroke="${INK}" stroke-width="3"/>
        <path d="M150 140L176 214L216 220" fill="none" stroke="${top}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><circle cx="220" cy="220" r="10" fill="${skin}"/>
        <path d="M124 100h16v20h-16Z" fill="${skin}"/><circle cx="134" cy="76" r="30" fill="${skin}" stroke="${INK}" stroke-width="3"/>
        <path d="M104 74Q104 42 134 42Q164 42 162 66Q148 56 130 60Q112 62 106 84Z" fill="${hair}"/>`)),
      sym('fjs-link', '0 0 1000 1600', `<path d="M310 440Q500 330 690 440" fill="none" stroke="#59758D" stroke-width="6" stroke-dasharray="16 12" stroke-linecap="round"/>
        <g transform="translate(470 352) rotate(-4)"><path d="M0 22l38-6 14-18 8 2-7 16 22-3 8-8 6 2-4 11 6 10-6 2-9-8-22-2 7 16-8 2-14-18-38-4Z" fill="#59758D" stroke="${INK}" stroke-width="2"/></g>`),
      // ---------- Scene 08: the «?» from Scene 04 resolves into four factors tied to one ticket ----------
      sym('fks-tag', '0 0 360 220', `<path d="M40 30H320L350 70V200H10V70Z" fill="#fff9ee" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
        <circle cx="180" cy="52" r="12" fill="#e3d2b2" stroke="${INK}" stroke-width="3"/><path d="M10 186H350" stroke="#d8cdb6" stroke-width="6"/>
        ${hatch(2001, 20, 20, 80, 320, 100, '#e0d6c2', .5)}`),
      ...[[270, 800, '#BF5942'], [730, 800, '#e8873a'], [270, 1184, '#427361'], [730, 1184, '#59758D']].map(([, , c], i) => sym(`fks-tag-band-${i}`, '0 0 360 220', `<path d="M40 30H320L350 70H10Z" fill="${c}"/><circle cx="180" cy="52" r="12" fill="#e3d2b2" stroke="${INK}" stroke-width="3"/>`)),
      ...[0, 1, 2, 3].map(i => { const [x, y] = [[270, 800, '#BF5942'], [730, 800, '#e8873a'], [270, 1184, '#427361'], [730, 1184, '#59758D']][i], from = [[330, 512], [670, 512], [400, 512], [600, 512]][i];
        const ctrl = [[260, 600], [740, 600], [90, 860], [910, 860]][i];
        return sym(`fks-thread-${i}`, '0 0 1000 1600', `<path d="M${from[0]} ${from[1]}Q${ctrl[0]} ${ctrl[1]} ${x} ${y - 58}" fill="none" stroke="#BF5942" stroke-width="5" stroke-dasharray="14 10" stroke-linecap="round"/>
          <circle cx="${from[0]}" cy="${from[1]}" r="9" fill="#BF5942" stroke="${INK}" stroke-width="2"/>`); }),
      sym('fks-clock', '0 0 100 100', `<circle cx="50" cy="50" r="44" fill="#fff9ee" stroke="${INK}" stroke-width="4"/>${Array.from({length: 12}, (_, i) => `<path d="M50 12v${i % 3 ? 5 : 9}" stroke="${INK}" stroke-width="3" transform="rotate(${i * 30} 50 50)"/>`).join('')}
        <path d="M50 50V28" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`),
      sym('fks-hand', '0 0 100 100', `<path d="M50 50L72 50" stroke="#BF5942" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="5" fill="${INK}"/>`),
    ].join(''),
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, cue, ambient, reveal, show, showHide} = motion;
      const [p1, p2] = ctx.phrases;
      // Aircraft path: roll on the runway, lift off, emphasis on «फ्लाइट», keep climbing.
      const emphasis = cue('fl-plane-trail', 0, 3.05 - p1.start);
      const path = [[0, -.2, .133, 0, .9], [1.2, -.12, .133, 0, .9], [2.4, -.03, .085, -7, .93], [emphasis, .02, .02, -10, .97],
        [emphasis + .25, .03, 0, -11, 1.04], [emphasis + .6, .045, -.03, -11, .98], [7.65, .1, -.3, -12, .82]];
      const at = t => { const i = path.findIndex(k => k[0] >= t), a = path[i - 1], b = path[i], u = (t - a[0]) / (b[0] - a[0]);
        return a.slice(1).map((v, k) => v + (b[k + 1] - v) * u); };
      const plane = (extra = () => 1) => path.map(([t, x, y, r, s], i) => key(t, [x, y, r, s, extra(t)], i === 4 ? 'out' : 'smooth'));
      const parts = ['fl-plane-wing-far', 'fl-plane-body', 'fl-plane-wing', 'fl-plane-engine', 'fl-plane-gear'];
      for (const id of parts) track(id, plane());
      // Gear retracts after lift-off; trail appears with the emphasis cue.
      track('fl-plane-gear', [...plane().filter(k => k[0] <= 2.4), key(2.75, [...at(2.75), 0])]);
      // Hidden through the cue, then in over 0.15 s (the shared path has no key between 2.4 s and the cue).
      track('fl-plane-trail', [...plane(t => t <= emphasis ? 0 : t < emphasis + .5 ? 1 : .65), ...[]].flatMap(k => k[0] === emphasis
        ? [k, key(emphasis + .15, [...at(emphasis + .15), 1])] : [k]));
      track('fl-plane-shadow', [key(0, [-.2, 0, 0, 1, 1]), key(1.2, [-.12, 0, 0, 1, 1]), key(2.4, [-.03, .004, 0, .7, .5]), key(3.2, [.02, .008, 0, .45, 0])]);
      for (const id of [...parts, 'fl-plane-trail']) ambient(id, {bob: [.003, 2.2, 0]});
      // Tickets land on the miniature at «सस्ती» and «महंगी»; prices fade in once each ticket settles.
      const low = cue('fl-ticket-low', 0, 4.375 - p1.start), high = cue('fl-ticket-high', 1, 6.0 - p2.start);
      const land = (id, at, rest, from) => track(id, [key(at, from), key(at + .45, rest, 'out')]);
      land('fl-ticket-low', low, [0, 0, -3, 1, 1], [-.04, .18, -16, .9, 0]);
      land('fl-ticket-high', high, [0, 0, 3, 1, 1], [.05, .2, 18, .9, 0]);
      for (const [id, at, rot] of [['fl-price-low', low, -3], ['fl-tag-low', low, -3], ['fl-price-high', high, 3], ['fl-tag-high', high, 3]])
        track(id, [key(at + .3, [0, .006, rot, .94, 0]), key(at + .6, [0, 0, rot, 1, 1], 'out')]);
      ambient('fl-cloud-a', {drift: [.012, 7, 0]});
      ambient('fl-cloud-b', {drift: [.01, 6, 2]});
      ambient('fl-cloud-c', {drift: [.008, 8, 4]});
      const scene = {locale: 'hi-IN', topic: 'फ्लाइट की टिकट इतनी महंगी क्यों?', beat: 'hook', objects: [
        plate('fl-sky', 'fls-sky', 0),
        P('fl-cloud-a', 'fls-cloud-a', 24, 17, 34, 1, {flat: true}), P('fl-cloud-c', 'fls-cloud-b', 58, 9, 22, 1, {flat: true}),
        plate('fl-far', 'fls-far', 1),
        P('fl-cloud-b', 'fls-cloud-b', 80, 27, 28, 1, {flat: true}),
        plate('fl-airport', 'fls-airport', 2, 'exact'),
        P('fl-plane-shadow', 'fls-plane-shadow', PLANE_X, 75.6, 40, 2, {flat: true}),
        P('fl-plane-trail', 'fls-plane-trail', PLANE_X, PLANE_Y, PLANE_W, 3, {flat: true}),
        P('fl-plane-wing-far', 'fls-plane-wing-far', PLANE_X, PLANE_Y, PLANE_W, 3),
        P('fl-plane-gear', 'fls-plane-gear', PLANE_X, PLANE_Y, PLANE_W, 3, {flat: true}),
        P('fl-plane-body', 'fls-plane-body', PLANE_X, PLANE_Y, PLANE_W, 3),
        P('fl-plane-engine', 'fls-plane-engine', PLANE_X, PLANE_Y, PLANE_W, 3),
        P('fl-plane-wing', 'fls-plane-wing', PLANE_X, PLANE_Y, PLANE_W, 3),
        P('fl-ticket-low', 'fls-ticket-low', 31, 82, 46, 4),
        P('fl-tag-low', null, 31, 77.4, 30, 4, {label: 'उदाहरण कीमत'}),
        P('fl-price-low', null, 25, 84.8, 30, 4, {label: '₹3,000'}),
        P('fl-ticket-high', 'fls-ticket-high', 69, 69, 48, 4),
        P('fl-tag-high', null, 69, 64.2, 30, 4, {label: 'उदाहरण कीमत'}),
        P('fl-price-high', null, 62.7, 71.9, 30, 4, {label: '₹9,000'}),
        plate('fl-fg', 'fls-fg', 5),
      ]};

      // ---------- Scene 02: fuel (phrases P03–P05) ----------
      const [, , p3, p4, p5] = ctx.phrases;
      const cut = ctx.shots[1].start;
      const planeAt = cue('fe-spot', 3, 9.275 - p4.start);      // «विमान»
      const costAt = cue('fe-coin-0', 3, 11.175 - p4.start);    // «खर्च»
      const fuelAt = cue('fe-cutaway', 4, 12.3 - p5.start);     // «सबसे»: begin fuel-system focus
      const fuelWord = cue('fe-fuel-label', 4, 14.875 - p5.start); // «ईंधन»
      track('fe-spot', [key(planeAt, [0, 0, 0, .85, 0]), key(planeAt + .35, [0, 0, 0, 1, 1], 'out'), key(fuelAt, [0, 0, 0, 1, 1]), key(fuelAt + .5, [0, 0, 0, 1.1, .3])]);
      const parked = [key(cut, [0, 0, 0, 1, 1]), key(planeAt, [0, 0, 0, 1, 1]), key(planeAt + .2, [0, -.006, 0, 1.025, 1], 'out'), key(planeAt + .55, [0, 0, 0, 1, 1])];
      for (const id of ['fe-plane', 'fe-wing']) track(id, parked);
      // Tanker drives in from the right and parks under the wing; the hose connects and fuel chevrons flow upward.
      track('fe-tanker', [key(cut, [.5, 0, 0, 1, 1]), key(cut + 1.4, [0, 0, 0, 1, 1], 'out')]);
      ambient('fe-tanker', {bob: [.0015, .35, 0]});
      const hoseAt = cut + 1.9;
      track('fe-hose', [key(hoseAt, [0, 0, 0, 1, 0]), key(hoseAt + .1, N)]);
      reveal('fe-hose', hoseAt, hoseAt + .6, 'up');
      const chevrons = [];
      for (let i = 0; i < 4; i++) {
        const keys = [], period = 1.2;
        for (let t0 = hoseAt + .7 + i * period / 4; t0 + period < ctx.duration; t0 += period)
          keys.push(key(t0, [0, 0, -20, .8, 0]), key(t0 + .15, [-.008, -.016, -8, 1, 1]), key(t0 + period - .15, [-.004, -.112, 10, 1, 1]), key(t0 + period - .01, [0, -.122, 12, .9, 0]));
        track(`fe-chev-${i}`, keys);
        chevrons.push(P(`fe-chev-${i}`, 'fes-chev', 64.8, 68.2, 4, 3, {flat: true}));
      }
      // Cost motif: three ₹ tokens rise from the fuselage on «खर्च» (symbolic; no amounts).
      const coins = [0, 1, 2].map(i => motion.emit(`fe-coin-${i}`, 'fes-coin', [34 + i * 11, 41 - (i % 2) * 2], 6.4, 4, (i - 1) * .02, -.09, costAt + i * .18, 1.7, 1));
      // Fuel-system focus: paper cutaway opens in the wing, fuel fills the tank, label on «ईंधन».
      track('fe-cutaway', [key(fuelAt, [0, 0, 0, 1, 0]), key(fuelAt + .1, N)]);
      reveal('fe-cutaway', fuelAt, fuelAt + .8, 'rightward');
      track('fe-fuel', [key(fuelAt + .7, [0, 0, 0, 1, 0]), key(fuelAt + .8, N)]);
      reveal('fe-fuel', fuelAt + .8, fuelWord + .4, 'up', .15, .9);
      ambient('fe-fuel', {flicker: [.12, .8, 0]});
      track('fe-fuel-label', [key(fuelWord, [0, .01, 0, .8, 0]), key(fuelWord + .3, [0, 0, 0, 1.08, 1], 'out'), key(fuelWord + .6, N)]);
      const fuelScene = {locale: 'hi-IN', topic: 'फ्लाइट की टिकट इतनी महंगी क्यों?', beat: 'mechanism', objects: [
        plate('fe-sky', 'fls-sky', 0), plate('fe-terminal', 'fes-terminal', 1), plate('fe-apron', 'fes-apron', 2, 'exact'),
        P('fe-spot', 'fes-spot', 50, 50, 100, 2, {flat: true}),
        P('fe-plane', 'fes-plane', 50, 51.25, 100, 3),
        P('fe-wing', 'fes-wing', 50, 51.25, 100, 3),
        P('fe-cutaway', 'fes-cutaway', 50, 51.25, 100, 3, {flat: true}),
        P('fe-fuel', 'fes-fuel', 50, 51.25, 100, 3, {flat: true}),
        P('fe-tanker', 'fes-tanker', 70, 73, 40, 3),
        plate('fe-hose', 'fes-hose', 3, 'exact'), ...chevrons, ...coins,
        P('fe-fuel-label', null, 74, 49.5, 24, 4, {label: 'ईंधन'}),
        plate('fe-fg', 'fes-fg', 5),
      ]};

      // ---------- Scene 03: operations (phrases P06–P08), one connected diorama with camera reframing ----------
      const [p6, p7, p8] = ctx.phrases.slice(5, 8);
      const ops = ctx.shots[2].start;
      const pilotAt = cue('fo-pilot', 5, 17.45 - p6.start);      // «पायलट»
      const staffAt = cue('fo-crew-a', 5, 18.7 - p6.start);      // «कर्मचारियों»
      const payAt = cue('fo-envelope', 5, 19.6 - p6.start);      // «सैलरी»
      const careAt = cue('fo-mechanic', 6, 20.975 - p7.start);   // «देखभाल»
      const leaseAt = cue('fo-doc', 7, 22.175 - p8.start);       // «किराए»
      const portAt = cue('fo-lights', 7, 24.175 - p8.start);     // «एयरपोर्ट»
      const feeAt = cue('fo-receipt', 7, 25.025 - p8.start);     // «फीस»
      const enter = [0, .015, 0, .92, 0];
      track('fo-pilot', [key(pilotAt, [-.04, 0, 0, .96, 0]), key(pilotAt + .45, N, 'out')]);
      show('fo-crew-a', staffAt, [-.03, 0, 0, .96, 0], .4);
      show('fo-crew-b', staffAt + .15, [-.03, 0, 0, .96, 0], .4);
      show('fo-ground', staffAt + .3, [.03, 0, 0, .96, 0], .4);
      for (const id of ['fo-pilot', 'fo-crew-a', 'fo-crew-b', 'fo-ground', 'fo-mechanic']) ambient(id, {bob: [.0015, .9, id.length]});
      track('fo-envelope', [key(payAt, [0, .02, -12, .6, 0]), key(payAt + .35, [0, 0, 0, 1.06, 1], 'out'), key(payAt + .55, N)]);
      const payCoins = [0, 1, 2].map(i => motion.emit(`fo-coin-${i}`, 'fes-coin', [25 + i * 6, 22], 5.2, 4, (i - 1) * .015, -.06, payAt + .15 + i * .14, 1.3, 1));
      showHide('fo-label-pilot', pilotAt + .15, enter, 20.45, .25);
      showHide('fo-label-staff', staffAt + .2, enter, 20.45, .25);
      showHide('fo-label-pay', payAt + .2, enter, 20.45, .25);
      show('fo-mechanic', careAt, [.02, 0, 0, .95, 0], .4);
      track('fo-cowl', [key(careAt, N), key(careAt + .45, [-.004, -.03, -10, 1, 1], 'out')]);
      track('fo-wrench', [key(careAt + .2, [0, 0, 0, .8, 0]), key(careAt + .4, N)]);
      ambient('fo-wrench', {sway: [22, .55, 0]});
      showHide('fo-label-care', careAt + .2, enter, 21.7, .25);
      track('fo-doc', [key(leaseAt, [0, .03, -6, .9, 0]), key(leaseAt + .45, N, 'out')]);
      track('fo-sign', [key(leaseAt + .5, [0, 0, 0, 1, 0]), key(leaseAt + .55, N)]);
      reveal('fo-sign', leaseAt + .5, leaseAt + 1.05, 'rightward');
      track('fo-stamp', [key(leaseAt + .9, [0, -.05, 0, 1, 0]), key(leaseAt + 1.1, [0, -.04, 0, 1, 1]), key(leaseAt + 1.25, [0, 0, 0, 1, 1], 'in'),
        key(leaseAt + 1.5, [0, -.035, 0, 1, 1], 'out'), key(leaseAt + 1.75, [0, -.04, 0, 1, 0])]);
      track('fo-stamp-mark', [key(leaseAt + 1.24, [0, 0, 0, 1, 0]), key(leaseAt + 1.27, N)]);
      showHide('fo-label-lease', leaseAt + .25, enter, 23.75, .25);
      track('fo-lights', [key(portAt, [0, 0, 0, 1, 0]), key(portAt + .1, N)]);
      reveal('fo-lights', portAt, portAt + .65, 'rightward');
      ambient('fo-lights', {flicker: [.15, 1.3, 0]});
      track('fo-bridge', [key(portAt, [.07, 0, 0, 1, 1]), key(portAt + .7, N, 'out')]);
      track('fo-receipt', [key(feeAt, [0, 0, 0, 1, 0]), key(feeAt + .05, N)]);
      reveal('fo-receipt', feeAt, feeAt + .7, 'down');
      show('fo-label-fee', feeAt + .2, enter, .3);
      const opsScene = {locale: 'hi-IN', topic: 'फ्लाइट की टिकट इतनी महंगी क्यों?', beat: 'mechanism', objects: [
        plate('fo-sky', 'fls-sky', 0), plate('fo-ops', 'fos-ops', 2, 'exact'),
        P('fo-engine', 'fos-engine', 76, 33, 40, 3), P('fo-cowl', 'fos-cowl', 76, 33, 40, 3, {flat: true, origin: '28% 29%'}),
        P('fo-mechanic', 'fos-mechanic', 64, 47.5, 10, 3), P('fo-wrench', 'fos-wrench', 70, 45.5, 6, 3, {flat: true, origin: '15% 50%'}),
        P('fo-pilot', 'fos-pilot', 18, 47.5, 10, 3), P('fo-crew-a', 'fos-crew-a', 31, 47.8, 10, 3),
        P('fo-crew-b', 'fos-crew-b', 42, 47.8, 10, 3), P('fo-ground', 'fos-ground', 53, 48.1, 10, 3),
        P('fo-envelope', 'fos-envelope', 31, 24, 12, 3), ...payCoins,
        P('fo-doc', 'fos-doc', 30, 76, 26, 3), P('fo-sign', 'fos-sign', 30, 76, 26, 3, {flat: true}),
        P('fo-stamp-mark', 'fos-stamp-mark', 30, 76, 26, 3, {flat: true}), P('fo-stamp', 'fos-stamp', 22.3, 81.8, 7, 4),
        P('fo-bridge', 'fos-bridge', 80, 70.5, 30, 3), P('fo-lights', 'fos-lights', 72, 92, 50, 3, {flat: true}),
        P('fo-receipt', 'fos-receipt', 62, 84.5, 12, 3),
        P('fo-label-pilot', null, 18, 36.5, 20, 5, {label: 'पायलट'}), P('fo-label-staff', null, 42, 36.5, 24, 5, {label: 'कर्मचारी'}),
        P('fo-label-pay', null, 31, 15.5, 20, 5, {label: 'सैलरी'}), P('fo-label-care', null, 78, 18, 22, 5, {label: 'देखभाल'}),
        P('fo-label-lease', null, 30, 64, 34, 5, {label: 'किराए पर विमान'}), P('fo-label-fee', null, 81, 78, 32, 5, {label: 'एयरपोर्ट फीस'}),
        plate('fo-fg', 'fes-fg', 5),
      ]};

      // ---------- Scene 04: pricing transition (phrase P09) ----------
      const p9 = ctx.phrases[8];
      const pricing = ctx.shots[3].start;
      const ticketAt = cue('fp-ticket', 8, 27.725 - p9.start);   // «टिकट»
      const priceAt = cue('fp-price', 8, 28.4 - p9.start);       // «कीमत»
      const costsAt = cue('fp-threads', 8, 29.65 - p9.start);    // «खर्चों»
      const notAt = cue('fp-question', 8, 30.625 - p9.start);    // «नहीं»
      const push = 31.25;
      // Previously introduced expense artwork gathers onto the board (fuel, salary, maintenance, leasing, airport).
      const items = [['fp-fuel', 'fes-tanker', 20, 68, 26, [-.35, .05]], ['fp-pay', 'fos-envelope', 44, 74, 15, [0, .3]],
        ['fp-care', 'fos-engine', 70, 70, 28, [.35, .05]], ['fp-lease', 'fos-doc', 30, 86, 14, [-.3, .2]], ['fp-port', 'fos-receipt', 62, 88, 9, [.3, .2]]];
      items.forEach(([id], i) => {
        const [dx, dy] = items[i][5], start = pricing + .1 + i * .13;
        track(id, [key(start, [dx, dy, (i % 2 ? 1 : -1) * 14, .9, 0]), key(start + .6, N, 'out'), key(costsAt, N),
          key(costsAt + .2, [0, -.006, 0, 1.08, 1], 'out'), key(costsAt + .45, N), key(notAt, N), key(notAt + .3, [0, 0, 0, .96, .55])]);
      });
      // A boarding pass unfolds downward; its price is shown only as «₹ ?» (no figures).
      track('fp-ticket', [key(ticketAt, [0, -.01, 0, 1, 0]), key(ticketAt + .05, N), key(notAt, N), key(notAt + .25, [0, 0, -1.5, 1, 1])]);
      reveal('fp-ticket', ticketAt, ticketAt + .55, 'down');
      track('fp-price', [key(priceAt, [0, .01, 0, .8, 0]), key(priceAt + .25, [0, 0, 0, 1.1, 1], 'out'), key(priceAt + .5, N), key(push, N), key(push + .12, [0, 0, 0, .96, 0])]);
      track('fp-ring', [key(priceAt + .05, [0, 0, 0, 1, 0]), key(priceAt + .1, N), key(push, N), key(push + .12, [0, 0, 0, 1, 0])]);
      reveal('fp-ring', priceAt + .05, priceAt + .55, 'rightward');
      track('fp-threads', [key(costsAt, [0, 0, 0, 1, 0]), key(costsAt + .05, N), key(notAt, N), key(notAt + .3, [0, 0, 0, 1, .35])]);
      reveal('fp-threads', costsAt, costsAt + .6, 'up');
      // «नहीं»: a separate, unexplained factor joins the ticket — expenses are only part of the story.
      track('fp-question', [key(notAt, [.05, .03, 25, .6, 0]), key(notAt + .4, [0, 0, -6, 1.05, 1], 'out'), key(notAt + .65, [0, 0, 0, 1, 1])]);
      ambient('fp-question', {sway: [4, 1.6, 0]});
      track('fp-thread-q', [key(notAt + .3, [0, 0, 0, 1, 0]), key(notAt + .35, N)]);
      reveal('fp-thread-q', notAt + .3, notAt + .7, 'up');
      showHide('fp-not-alone', notAt + .2, [0, .015, 0, .92, 0], push, .25);
      // Hand-off: an aircraft window opens on the ticket stub and the camera pushes through it toward the cabin.
      track('fp-window', [key(30.95, [0, 0, 0, .6, 0]), key(31.2, [0, 0, 0, 1.05, 1], 'out'), key(31.35, N)]);
      const pricingScene = {locale: 'hi-IN', topic: 'फ्लाइट की टिकट इतनी महंगी क्यों?', beat: 'turn', objects: [
        plate('fp-board', 'fps-board', 0), plate('fp-threads', 'fps-threads', 2, 'exact'), plate('fp-thread-q', 'fps-thread-q', 2, 'exact'),
        ...items.map(([id, art, x, y, w]) => P(id, art, x, y, w, 3)),
        P('fp-ticket', 'fls-ticket-high', 50, 30, 80, 3), P('fp-ring', 'fps-ring', 39.6, 34.9, 34, 3, {flat: true}),
        P('fp-window', 'fps-window', 76.1, 34.9, 12, 3),
        P('fp-question', 'fps-question', 86, 50, 14, 4, {origin: '50% 90%'}),
        P('fp-price', null, 39.6, 34.9, 34, 4, {label: '₹ ?'}),
        P('fp-not-alone', null, 50, 52, 50, 5, {label: 'सिर्फ खर्च नहीं'}),
      ]};

      // ---------- Scene 05: cabin and example fare inventory (phrases P10–P12) ----------
      const [p10, p11, p12] = ctx.phrases.slice(9, 12);
      const cabin = ctx.shots[4].start;
      const cabinAt = cue('fc-seat-0', 9, 32.575 - p10.start);    // «एयरलाइंस»
      const faresAt = cue('fc-rack', 9, 33.325 - p10.start);      // «अलग-अलग»
      const seatsAt = cue('fc-seat-glow', 9, 34.8 - p10.start);   // «सीटें»
      const cheapAt = cue('fc-ring-low', 10, 36.925 - p11.start); // «सस्ती»
      const sellAt = cue('fc-pax-new-0', 10, 37.775 - p11.start); // «बिकती»
      const dearAt = cue('fc-ring-high', 11, 38.925 - p12.start); // «महंगी»
      const availAt = cue('fc-avail', 11, 40.0 - p12.start);      // «उपलब्ध»
      const seatXY = [270, 340, 410, 590, 660, 730].flatMap(x => [0, 1, 2, 3, 4, 5].map(r => [x, 300 + r * 120]));
      const pct = ([x, y]) => [x / 10, y / 16];
      const seats = seatXY.map((xy, i) => {
        const at = cabinAt + (i % 6) * .07 + Math.floor(i / 6) * .03;
        track(`fc-seat-${i}`, [key(at, [0, .01, 0, .7, 0]), key(at + .3, N, 'out')]);
        return P(`fc-seat-${i}`, 'fcs-seat', ...pct(xy), 6.6, 3);
      });
      const pax = [...PRE_BOOKED.map((i, k) => [`fc-pax-pre-${k}`, i, cabinAt + .45 + k * .05]),
        ...NEW_BOOKINGS.map((i, k) => [`fc-pax-new-${k}`, i, sellAt + k * .14])].map(([id, i, at]) => {
        track(id, [key(at, [0, -.01, 0, 1.3, 0]), key(at + .25, N, 'out')]);
        return P(id, 'fcs-pax', ...pct(seatXY[i]), 6.6, 4, {flat: true});
      });
      track('fc-seat-glow', [key(seatsAt, [0, 0, 0, 1, 0]), key(seatsAt + .25, N), key(seatsAt + 1.1, N), key(seatsAt + 1.5, [0, 0, 0, 1, 0])]);
      // Example fare inventory: three stacks, kept apart from the (single-class) seats. No order of increase is shown.
      track('fc-rack', [key(faresAt, [0, .02, 0, 1, 0]), key(faresAt + .35, N, 'out')]);
      const stacks = [['low', 'fls-ticket-low', 230], ['mid', 'fcs-ticket-mid', 500], ['high', 'fls-ticket-high', 770]];
      const tickets = stacks.flatMap(([name, art, x], s) => [0, 1, 2].map(k => {
        const id = `fc-${name}-${k}`, at = faresAt + .2 + s * .12 + k * .06, xy = [x, 1290 - k * 14];
        if (name === 'low') {
          // Lower-priced inventory leaves the rack into seats as bookings happen.
          const target = seatXY[NEW_BOOKINGS[k * 2]], go = sellAt + k * .28;
          track(id, [key(at, [0, .02, 0, .9, 0]), key(at + .3, N, 'out'), key(go, N),
            key(go + .5, [(target[0] - xy[0]) / 1000, (target[1] - xy[1]) / 1600, 20, .35, .9], 'in'), key(go + .58, [(target[0] - xy[0]) / 1000, (target[1] - xy[1]) / 1600, 20, .3, 0])]);
        } else {
          track(id, [key(at, [0, .02, 0, .9, 0]), key(at + .3, N, 'out'), key(availAt, N), key(availAt + .2, [0, -.004, 0, 1.06, 1], 'out'), key(availAt + .45, N)]);
        }
        return P(id, art, ...pct(xy), 18, 3);
      }));
      const lab = (id, at, x, y, w, label, off) => { off ? showHide(id, at, [0, .012, 0, .92, 0], off, .25) : show(id, at, [0, .012, 0, .92, 0], .3); return P(id, null, x, y, w, 5, {label}); };
      const labels = [lab('fc-label-fares', faresAt + .1, 50, 70, 40, 'उदाहरण किराए'),
        lab('fc-price-low', faresAt + .35, 23, 86, 22, '₹3,000'), lab('fc-price-mid', faresAt + .47, 50, 86, 22, '₹6,000'),
        lab('fc-price-high', faresAt + .59, 77, 86, 22, '₹9,000'), lab('fc-label-sold', dearAt - .4, 23, 79, 22, 'बिक गए')];
      const ring = (id, at, off) => { track(id, [key(at, [0, 0, 0, 1, 0]), key(at + .05, N), ...(off ? [key(off, N), key(off + .2, [0, 0, 0, 1, 0])] : [])]); reveal(id, at, at + .45, 'rightward'); };
      ring('fc-ring-low', cheapAt, dearAt - .5);
      ring('fc-ring-high', dearAt); ring('fc-ring-high-b', dearAt + .1);
      track('fc-sold', [key(dearAt - .45, [0, 0, -8, 1.4, 0]), key(dearAt - .25, [0, 0, -8, 1, 1], 'in')]);
      track('fc-avail', [key(availAt, [0, 0, 0, 1, 0]), key(availAt + .3, N)]);
      ambient('fc-avail', {flicker: [.25, 1.1, 0]});
      const cabinScene = {locale: 'hi-IN', topic: 'फ्लाइट की टिकट इतनी महंगी क्यों?', beat: 'mechanism', objects: [
        plate('fc-board', 'fcs-board', 0), plate('fc-fuselage', 'fcs-fuselage', 2, 'exact'), plate('fc-rack', 'fcs-rack', 2, 'exact'),
        ...seats, plate('fc-seat-glow', 'fcs-seat-glow', 3, 'exact'), plate('fc-avail', 'fcs-avail', 3, 'exact'), ...pax, ...tickets,
        P('fc-ring-low', 'fps-ring', 23, 80, 26, 4, {flat: true}), P('fc-ring-high', 'fps-ring', 50, 80, 26, 4, {flat: true}),
        P('fc-ring-high-b', 'fps-ring', 77, 80, 26, 4, {flat: true}), P('fc-sold', 'fcs-sold', 23, 80.5, 20, 4, {flat: true}), ...labels,
      ]};

      // ---------- Scene 06: holiday demand vs limited seats (phrases P13–P15) ----------
      const [p13, p14, p15] = ctx.phrases.slice(12, 15);
      const holiday = ctx.shots[5].start;
      const festAt = cue('fd-calendar', 12, 42.525 - p13.start);    // «त्योहारों»
      const leaveAt = cue('fd-holiday', 12, 43.425 - p13.start);    // «छुट्टियों»
      const arriveAt = cue('fd-pax-0', 12, 44.65 - p13.start);      // «यात्रियों»
      const demandAt = cue('fd-demand', 12, 45.375 - p13.start);    // «मांग»
      const capAt = cue('fd-capacity', 13, 47.025 - p14.start);     // «सीटें»
      const limitAt = cue('fd-free', 13, 47.5 - p14.start);         // «सीमित»
      const fareAt = cue('fd-ticket', 14, 49.45 - p15.start);       // «कीमत»
      const riseAt = cue('fd-price-new', 14, 50.075 - p15.start);   // «बढ़»
      track('fd-calendar', [key(festAt, [0, -.02, -6, .8, 0]), key(festAt + .4, N, 'out')]);
      track('fd-holiday', [key(leaveAt, [0, 0, 0, 1, 0]), key(leaveAt + .05, N)]);
      reveal('fd-holiday', leaveAt, leaveAt + .5, 'rightward');
      showHide('fd-label-holiday', leaveAt + .2, [0, .012, 0, .92, 0], 46.6, .25);
      // Travellers keep arriving: a first group on «यात्रियों», then a longer queue as demand grows.
      const queue = [880, 800, 720, 640, 560, 480, 400, 320, 240, 160];
      const travellers = queue.map((x, i) => {
        const at = i < 4 ? arriveAt + i * .18 : demandAt + (i - 4) * .2;
        track(`fd-pax-${i}`, [key(at, [-.22, 0, 0, 1, 0]), key(at + .12, [-.19, 0, 0, 1, 1]), key(at + .8, N, 'out')]);
        ambient(`fd-pax-${i}`, {bob: [.002, .7, i]});
        return P(`fd-pax-${i}`, `fds-traveler-${'abcd'[i % 4]}`, ...pct([x, 950]), 10, 3);
      });
      track('fd-demand', [key(demandAt, [0, .03, 0, .7, 0]), key(demandAt + .35, [0, -.008, 0, 1.08, 1], 'out'), key(demandAt + .6, N), key(46.75, N), key(46.95, [0, 0, 0, 1, 0])]);
      ambient('fd-demand', {bob: [.004, .8, 0]});
      showHide('fd-label-demand', demandAt + .15, [0, .012, 0, .92, 0], 46.6, .25);
      // Capacity: one illustrative cabin with a fixed number of seats; most fill, two stay free.
      track('fd-capacity', [key(capAt, [0, .02, 0, 1, 0]), key(capAt + .35, N, 'out')]);
      const capSeats = [], capPax = [];
      [0, 1].forEach(r => [0, 1, 2, 3, 4, 5].forEach(c => {
        const i = r * 6 + c, xy = [260 + c * 95, 1290 + r * 75], at = capAt + .15 + c * .04 + r * .03;
        track(`fd-seat-${i}`, [key(at, [0, .01, 0, .7, 0]), key(at + .25, N, 'out')]);
        capSeats.push(P(`fd-seat-${i}`, 'fcs-seat', ...pct(xy), 6.6, 3));
        if (c < 5) {
          const on = capAt + .45 + (c * 2 + r) * .03;
          track(`fd-taken-${i}`, [key(on, [0, -.008, 0, 1.25, 0]), key(on + .2, N, 'out')]);
          capPax.push(P(`fd-taken-${i}`, 'fcs-pax', ...pct(xy), 6.6, 4, {flat: true}));
        }
      }));
      track('fd-free', [key(limitAt, [0, 0, 0, 1, 0]), key(limitAt + .3, N)]);
      ambient('fd-free', {flicker: [.3, .9, 0]});
      show('fd-label-limited', limitAt + .1, [0, .012, 0, .92, 0], .3);
      // Price motif: an example fare that may rise (labelled as an example; no rule implied).
      track('fd-ticket', [key(fareAt, [.04, .02, 8, .85, 0]), key(fareAt + .4, [0, 0, -3, 1, 1], 'out')]);
      show('fd-label-example', fareAt + .2, [0, .01, 0, .9, 0], .3);
      track('fd-price-old', [key(fareAt + .25, [0, .006, -3, .9, 0]), key(fareAt + .5, [0, 0, -3, 1, 1], 'out'), key(riseAt, [0, 0, -3, 1, 1]), key(riseAt + .25, [0, .02, -3, .9, 0])]);
      track('fd-price-new', [key(riseAt, [0, -.02, -3, .9, 0]), key(riseAt + .3, [0, 0, -3, 1.08, 1], 'out'), key(riseAt + .55, [0, 0, -3, 1, 1])]);
      track('fd-up', [key(riseAt + .1, [0, .02, 0, .8, 0]), key(riseAt + .45, N, 'out')]);
      const holidayScene = {locale: 'hi-IN', topic: 'फ्लाइट की टिकट इतनी महंगी क्यों?', beat: 'mechanism', objects: [
        plate('fd-board', 'fcs-board', 0), plate('fd-terminal', 'fds-terminal', 2, 'exact'),
        P('fd-calendar', 'fds-calendar', 25, 32, 34, 3), P('fd-holiday', 'fds-holiday', 25, 32, 34, 3, {flat: true}),
        ...travellers, P('fd-demand', 'fds-arrow', 6, 50, 8, 4),
        plate('fd-capacity', 'fds-capacity', 3, 'exact'), ...capSeats, plate('fd-free', 'fds-free', 3, 'exact'), ...capPax,
        P('fd-ticket', 'fls-ticket-high', 76, 36, 26, 4), P('fd-up', 'fds-arrow', 58, 37.6, 5, 4),
        P('fd-label-holiday', null, 25, 46, 44, 5, {label: 'त्योहार और छुट्टियाँ'}),
        P('fd-label-demand', null, 22, 50.5, 26, 5, {label: 'मांग बढ़ी'}),
        P('fd-label-limited', null, 50, 74.8, 32, 5, {label: 'सीमित सीटें'}),
        P('fd-label-example', null, 76, 32, 22, 5, {label: 'उदाहरण'}),
        P('fd-price-old', null, 72.6, 37.6, 22, 5, {label: '₹6,000'}), P('fd-price-new', null, 72.6, 37.6, 22, 5, {label: '₹9,000'}),
      ]};

      // ---------- Scene 07: two passengers, one journey (phrase P16) ----------
      const p16 = ctx.phrases[15];
      const journey = ctx.shots[6].start;
      const cabinOn = cue('fj-sign-a', 15, 53.35 - p16.start);     // «विमान»
      const twoAt = cue('fj-pax-a', 15, 54.175 - p16.start);       // «दो»
      const ticketsAt = cue('fj-ticket-a', 15, 55.0 - p16.start);  // «अलग-अलग»
      const pricesAt = cue('fj-price-a', 15, 55.775 - p16.start);  // «कीमत»
      const tripAt = cue('fj-link', 15, 56.775 - p16.start);       // «सफर»
      // Clouds drift past the windows for the whole shot (visible only through the window openings).
      const clouds = [['fj-cloud-0', 'fls-cloud-a', 30, 36, .55, -.55], ['fj-cloud-1', 'fls-cloud-b', 70, 40, .2, -.9], ['fj-cloud-2', 'fls-cloud-a', 95, 34, .1, -1.1]]
        .map(([id, art, x, y, from, to]) => { track(id, [key(journey, [from, 0, 0, 1, 1]), key(58.45, [to, 0, 0, 1, 1], 'linear')]); return P(id, art, x, y, 30, 1, {flat: true}); });
      for (const id of ['fj-sign-a', 'fj-sign-b']) track(id, [key(cabinOn, [0, 0, 0, .8, 0]), key(cabinOn + .25, N, 'out')]);
      ambient('fj-sign-a', {flicker: [.2, 1.4, 0]}); ambient('fj-sign-b', {flicker: [.2, 1.4, 1]});
      // Two passengers settle into identical seats; the seats never change with the fare.
      track('fj-pax-a', [key(twoAt, [0, -.03, 0, 1, 0]), key(twoAt + .4, N, 'out')]);
      track('fj-pax-b', [key(twoAt + .2, [0, -.03, 0, 1, 0]), key(twoAt + .6, N, 'out')]);
      show('fj-label-seats', twoAt + .45, [0, .012, 0, .92, 0], .3);
      // Separate boarding passes (the Scene 01 artwork), then the example prices from Scene 01.
      track('fj-ticket-a', [key(ticketsAt, [0, .05, -14, .8, 0]), key(ticketsAt + .4, [0, 0, -3, 1, 1], 'out')]);
      track('fj-ticket-b', [key(ticketsAt + .2, [0, .05, 14, .8, 0]), key(ticketsAt + .6, [0, 0, 3, 1, 1], 'out')]);
      for (const [id, at, rot] of [['fj-tag-a', ticketsAt + .35, -3], ['fj-tag-b', ticketsAt + .55, 3]]) track(id, [key(at, [0, .006, rot, .94, 0]), key(at + .25, [0, 0, rot, 1, 1], 'out')]);
      for (const [id, at, rot] of [['fj-price-a', pricesAt, -3], ['fj-price-b', pricesAt + .2, 3]]) track(id, [key(at, [0, .008, rot, .9, 0]), key(at + .3, [0, 0, rot, 1.06, 1], 'out'), key(at + .5, [0, 0, rot, 1, 1])]);
      // «सफर»: one dashed route joins both passes — same flight, same journey.
      track('fj-link', [key(tripAt, [0, 0, 0, 1, 0]), key(tripAt + .05, N)]);
      reveal('fj-link', tripAt, tripAt + .6, 'rightward');
      show('fj-label-journey', tripAt + .3, [0, .012, 0, .92, 0], .3);
      const journeyScene = {locale: 'hi-IN', topic: 'फ्लाइट की टिकट इतनी महंगी क्यों?', beat: 'example', objects: [
        plate('fj-sky', 'fjs-sky', 0), ...clouds, plate('fj-wall', 'fjs-wall', 2, 'exact'),
        P('fj-sign-a', 'fjs-sign', 33, 27.6, 12, 3), P('fj-sign-b', 'fjs-sign', 67, 27.6, 12, 3),
        P('fj-seat-a', 'fjs-seat', 33, 61.25, 26, 3), P('fj-seat-b', 'fjs-seat', 67, 61.25, 26, 3),
        P('fj-pax-a', 'fjs-sitter-a', 33, 61.25, 26, 3), P('fj-pax-b', 'fjs-sitter-b', 67, 61.25, 26, 3),
        plate('fj-link', 'fjs-link', 3, 'exact'),
        P('fj-ticket-a', 'fls-ticket-low', 31, 30, 32, 4), P('fj-ticket-b', 'fls-ticket-high', 69, 30, 32, 4),
        P('fj-tag-a', null, 31, 26.8, 22, 4, {label: 'उदाहरण कीमत'}), P('fj-tag-b', null, 69, 26.8, 22, 4, {label: 'उदाहरण कीमत'}),
        P('fj-price-a', null, 26.8, 31.9, 22, 4, {label: '₹3,000'}), P('fj-price-b', null, 64.8, 31.9, 22, 4, {label: '₹9,000'}),
        P('fj-label-seats', null, 50, 79, 36, 5, {label: 'एक जैसी सीटें'}),
        P('fj-label-journey', null, 50, 18.5, 30, 5, {label: 'एक ही सफर'}),
      ]};

      // ---------- Scene 08: conclusion (phrases P17–P19) ----------
      const [p17, p18, p19] = ctx.phrases.slice(16, 19);
      const answer = ctx.shots[7].start;
      const behindAt = cue('fk-thread-0', 16, 61.35 - p17.start);   // «पीछे»
      const flyAt = cue('fk-tag-0', 16, 62.2 - p17.start);          // «उड़ान (का खर्च)»
      const notAt2 = cue('fk-question', 16, 63.1 - p17.start);      // «नहीं»
      const demandAt2 = cue('fk-tag-1', 17, 64.15 - p18.start);     // «मांग»
      const seatsAt2 = cue('fk-tag-2', 18, 65.5 - p19.start);       // «उपलब्धता»
      const timeAt = cue('fk-tag-3', 18, 66.725 - p19.start);       // «बुकिंग (का समय)»
      const endAt = cue('fk-price-final', 18, 67.85 - p19.start);   // «होता है»
      const tagXY = [[270, 800, '#BF5942'], [730, 800, '#e8873a'], [270, 1184, '#427361'], [730, 1184, '#59758D']];
      const tagAt = [flyAt, demandAt2, seatsAt2, timeAt];
      const tagLabels = ['उड़ान का खर्च', 'मांग', 'सीटों की उपलब्धता', 'बुकिंग का समय'];
      const answerObjects = [];
      // The ticket from Scene 04 returns with its unanswered price; on «पीछे» it rises to show the strings behind it.
      track('fk-ticket', [key(answer, N), key(behindAt, N), key(behindAt + .5, [0, -.02, -1.5, 1, 1], 'out'), key(endAt, [0, -.02, -1.5, 1, 1]),
        key(endAt + .3, [0, -.02, 0, 1.04, 1], 'out'), key(endAt + .55, [0, -.02, 0, 1, 1])]);
      track('fk-price-q', [key(answer + .2, [0, .01, 0, .9, 0]), key(answer + .5, N, 'out'), key(behindAt, N), key(behindAt + .5, [0, -.02, -1.5, 1, 1], 'out'),
        key(endAt, [0, -.02, -1.5, 1, 1]), key(endAt + .2, [0, -.01, -1.5, .9, 0])]);
      track('fk-price-final', [key(endAt + .1, [0, -.03, 0, .9, 0]), key(endAt + .4, [0, -.02, 0, 1.06, 1], 'out'), key(endAt + .6, [0, -.02, 0, 1, 1])]);
      track('fk-label-example', [key(endAt + .25, [0, -.015, 0, .9, 0]), key(endAt + .5, [0, -.02, 0, 1, 1], 'out')]);
      tagXY.forEach(([x, y], i) => {
        const at = tagAt[i], drop = [0, -.03, i % 2 ? 7 : -7, .9, 0];
        track(`fk-thread-${i}`, [key(i ? at - .15 : behindAt, [0, 0, 0, 1, 0]), key((i ? at - .15 : behindAt) + .05, N), key(endAt, N), key(endAt + .3, [0, 0, 0, 1, 1])]);
        reveal(`fk-thread-${i}`, i ? at - .15 : behindAt, (i ? at - .15 : behindAt) + .5, 'down');
        for (const id of [`fk-tag-${i}`, `fk-band-${i}`]) track(id, [key(at, drop), key(at + .4, N, 'out'), key(endAt, N), key(endAt + .25, [0, -.004, 0, 1.04, 1], 'out'), key(endAt + .5, N)]);
        ambient(`fk-tag-${i}`, {sway: [1.2, 2.6, i]}); ambient(`fk-band-${i}`, {sway: [1.2, 2.6, i]});
        answerObjects.push(P(`fk-tag-${i}`, 'fks-tag', x / 10, y / 16, 36, 3, {origin: '50% 24%'}), P(`fk-band-${i}`, `fks-tag-band-${i}`, x / 10, y / 16, 36, 3, {flat: true, origin: '50% 24%'}));
        show(`fk-label-${i}`, at + .3, [0, .01, 0, .92, 0], .3);
      });
      // Icons on each tag reuse earlier scenes: tanker (fuel), travellers (demand), seats (availability), calendar + clock (booking time).
      const icon = (id, art, x, y, w, i, extra = {}) => { show(id, tagAt[i] + .15, [0, -.01, 0, .8, 0], .35); return P(id, art, x, y, w, 4, extra); };
      answerObjects.push(
        icon('fk-i-tanker', 'fes-tanker', 27, 48.7, 17, 0),
        icon('fk-i-trav-a', 'fds-traveler-b', 67, 48.4, 6, 1), icon('fk-i-trav-b', 'fds-traveler-c', 73, 48.4, 6, 1), icon('fk-i-arrow', 'fds-arrow', 79, 48, 3.6, 1),
        icon('fk-i-seat-0', 'fcs-seat', 21.5, 72.6, 5, 2), icon('fk-i-seat-1', 'fcs-seat', 27, 72.6, 5, 2), icon('fk-i-seat-2', 'fcs-seat', 32.5, 72.6, 5, 2),
        icon('fk-i-pax-0', 'fcs-pax', 21.5, 72.6, 5, 2, {flat: true}), icon('fk-i-pax-1', 'fcs-pax', 27, 72.6, 5, 2, {flat: true}),
        icon('fk-i-cal', 'fds-calendar', 67, 72.4, 10, 3), icon('fk-i-clock', 'fks-clock', 79, 72.4, 9, 3), icon('fk-i-hand', 'fks-hand', 79, 72.4, 9, 3, {flat: true}));
      ambient('fk-i-hand', {spin: 220});
      // «नहीं»: the Scene 04 «?» swings back in at the empty tag position, then gives way to «मांग».
      track('fk-question', [key(notAt2, [.04, -.02, 20, .6, 0]), key(notAt2 + .35, [0, 0, -5, 1.05, 1], 'out'), key(demandAt2 - .15, N), key(demandAt2 + .1, [0, 0, 0, .2, 0], 'in')]);
      // Closing flourish: the opening aircraft crosses the top of the frame — same flight, two example fares.
      const fly = [key(endAt, [-.75, .02, -4, .9, 1]), key(68.8, [.75, -.03, -6, .9, 1], 'linear')];
      for (const id of ['fk-plane-wing-far', 'fk-plane-body', 'fk-plane-wing', 'fk-plane-engine']) track(id, fly);
      const answerScene = {locale: 'hi-IN', topic: 'फ्लाइट की टिकट इतनी महंगी क्यों?', beat: 'resolution', objects: [
        plate('fk-board', 'fps-board', 0), ...[0, 1, 2, 3].map(i => plate(`fk-thread-${i}`, `fks-thread-${i}`, 2, 'exact')), ...answerObjects,
        P('fk-question', 'fps-question', 73, 50, 14, 4, {origin: '50% 90%'}),
        P('fk-ticket', 'fcs-ticket-mid', 50, 22, 70, 3),
        ...['wing-far', 'body', 'wing', 'engine'].map(part => P(`fk-plane-${part}`, `fls-plane-${part}`, 50, 6.5, 32, 4)),
        P('fk-price-q', null, 40.9, 26.25, 40, 5, {label: '₹ ?'}),
        P('fk-price-final', null, 43, 26.25, 56, 5, {label: '₹3,000 या ₹9,000'}),
        P('fk-label-example', null, 60, 16.6, 20, 5, {label: 'उदाहरण'}),
        ...tagXY.map(([x, y], i) => P(`fk-label-${i}`, null, x / 10, (y + 64) / 16, 34, 5, {label: tagLabels[i]})),
      ]};
      return {
        scenes: {'flights-opening': scene, 'flights-fuel': fuelScene, 'flights-operations': opsScene, 'flights-pricing': pricingScene, 'flights-cabin': cabinScene, 'flights-holiday': holidayScene, 'flights-journey': journeyScene, 'flights-answer': answerScene},
        cameras: {opening: [key(0, [-.03, -.04, 1.15]), key(emphasis, [.01, -.05, 1.12]), key(low, [0, .05, 1.05]), key(7.65, [.01, .04, 1.04]),
          key(ctx.duration, [.02, .05, 1.04])],
          // Start close on the apron (continuing the downward wipe), settle wide, then push to the wing tank.
          fuel: [key(cut, [0, .05, 1.14]), key(cut + 1.1, [0, .02, 1.02], 'out'), key(fuelAt, [.01, .02, 1.04]),
            key(fuelAt + 1.4, [.07, .07, 1.6]), key(ctx.duration, [.07, .07, 1.66])],
          // Overview of the connected diorama, then reframe zone by zone as each cost is named.
          operations: [key(ops, [0, 0, 1.12]), key(ops + .7, [0, 0, 1.02], 'out'), key(pilotAt - .3, [0, 0, 1.02]),
            key(pilotAt, [-.2, -.2, 1.75]), key(20.45, [-.19, -.19, 1.75]), key(careAt - .1, [.2, -.2, 1.75]), key(21.85, [.19, -.19, 1.75]),
            key(leaseAt, [-.2, .2, 1.75]), key(23.95, [-.19, .19, 1.75]), key(portAt, [.2, .2, 1.75]), key(25.9, [.19, .2, 1.75]),
            key(26.575, [.1, .12, 1.4]), key(ctx.duration, [.1, .12, 1.4])],
          pricing: [key(pricing, [0, .04, 1.1]), key(pricing + .8, [0, 0, 1], 'out'), key(push, [.01, -.01, 1.03]),
            key(31.9, [.261, -.151, 2.4], 'in'), key(ctx.duration, [.261, -.151, 2.4])],
          // Arrive close on the seats (continuing the window push), pull back to the cabin and rack, then favour each in turn.
          cabin: [key(cabin, [0, -.16, 1.7]), key(cabinAt + .6, [0, -.1, 1.2], 'out'), key(faresAt + .4, [0, 0, 1], 'smooth'),
            key(seatsAt, [0, -.03, 1.05]), key(cheapAt - .3, [0, -.02, 1.04]), key(cheapAt + .2, [0, .06, 1.08]), key(dearAt, [0, .06, 1.08]),
            key(availAt, [0, .02, 1.03]), key(41.875, [0, .02, 1.02]), key(ctx.duration, [0, .02, 1.02])],
          // Calendar close-up, tilt down to the growing queue, then down again to the limited seats and the example fare.
          holiday: [key(holiday, [-.15, -.22, 1.6]), key(leaveAt + .6, [-.14, -.21, 1.6]), key(arriveAt - .2, [0, .02, 1.15]),
            key(demandAt + .3, [0, .01, 1.05]), key(46.8, [0, .01, 1.05]), key(capAt + .3, [0, .13, 1.35]), key(fareAt, [.02, .12, 1.35]),
            key(51.45, [.03, .12, 1.3]), key(ctx.duration, [.03, .12, 1.3])],
          // Start on the windows (continuing the rising sky sheet), pull back to reveal the cabin, settle on both passengers.
          journey: [key(journey, [0, -.08, 1.6]), key(cabinOn - .3, [0, -.06, 1.45]), key(cabinOn + .6, [0, 0, 1.1], 'out'),
            key(twoAt + .6, [0, .02, 1.06]), key(ticketsAt + .4, [0, 0, 1.05]), key(tripAt, [0, 0, 1.04]), key(58.45, [0, 0, 1.02]),
            key(ctx.duration, [0, 0, 1.02])],
          // Close on the unanswered price, pull back on «पीछे» to reveal the strings and tags, then settle wide for the answer.
          answer: [key(answer, [0, -.19, 1.7]), key(behindAt - .2, [0, -.18, 1.6]), key(behindAt + .9, [0, .02, 1.06], 'out'),
            key(endAt, [0, .02, 1.04]), key(ctx.duration, [0, 0, 1.0])]},
        checks: {keyframes: [['opening', .9], ['ticket-low', Math.min(low + .615, p2.start - .03)], ['ticket-high', high + .75],
          ['apron', planeAt + .45], ['refuelling', costAt + .55], ['fuel-cutaway', fuelWord + .7],
          ['personnel', 20.1], ['maintenance', 21.6], ['leasing', 23.7], ['airport-charges', 25.85],
          ['ticket-price', 29.05], ['not-only-costs', 31.15], ['cabin', 35.3], ['bookings', 38.55], ['remaining-fares', 40.7],
          ['holiday-period', 44.2], ['increasing-demand', 46.5], ['limited-availability', 50.9],
          ['two-fares', 56.5], ['shared-journey', 57.9], ['question-returns', 63.45], ['four-factors', 67.2], ['resolution', 68.55]], repeatAt: costAt + .55},
      };
    },
  };
})();
