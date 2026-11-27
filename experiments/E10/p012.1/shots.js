// P012.1 three-shot tree-cooling scene for the P009 Paper Explainer view.
// Deterministic: every visual state is a pure function of the requested time in seconds.
function installShots(timeline) {
  const rate = timeline.audio.sample_rate;
  const duration = timeline.audio.sample_count / rate;
  const phrases = timeline.records.filter(r => r.kind === 'phrase').sort((a, b) => a.start - b.start)
    .map(r => ({start: r.start / rate, end: r.end / rate, text: r.label}));
  if (phrases.length !== 3) throw new Error('Tree shots expect three provisional phrases');
  const [p1, p2, p3] = phrases;
  const cut1 = (p1.end + p2.start) / 2, cut2 = (p2.end + p3.start) / 2;
  const captions = phrases.map((p, i) => ({id: i + 1, start: p.start, end: i < 2 ? phrases[i + 1].start : duration, text: p.text}));

  // ---------- deterministic art helpers (frame space 1000×1600) ----------
  const f = n => n.toFixed(1);
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const smooth = pts => {
    const n = pts.length;
    let d = `M${mid(pts[n - 1], pts[0]).map(f).join(' ')}`;
    for (let i = 0; i < n; i++) d += ` Q${pts[i].map(f).join(' ')} ${mid(pts[i], pts[(i + 1) % n]).map(f).join(' ')}`;
    return d + 'Z';
  };
  const blob = (cx, cy, rx, ry, n, amp, seed) => smooth(Array.from({length: n}, (_, i) => {
    const a = i / n * Math.PI * 2, k = 1 + amp * (i % 2 ? 1 : -.35) + amp * .7 * (rnd(seed + i) - .5);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  }));
  const leafShape = (x, y, len, w, rot, fill, rib) =>
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="M0 ${-len}C${w} ${-len * .45} ${w} ${len * .45} 0 ${len}C${-w} ${len * .45} ${-w} ${-len * .45} 0 ${-len}Z" fill="${fill}"/>` +
    (rib ? `<path d="M0 ${-len * .85}V${len * .85}" stroke="${rib}" stroke-width="${f(w * .12)}" stroke-linecap="round"/>` : '') + '</g>';
  const grass = (seed, count, y0, hMin, hMax, colors) => Array.from({length: count}, (_, i) => {
    const x = (i + rnd(seed + i)) * 1000 / count, h = hMin + (hMax - hMin) * rnd(seed + 50 + i), lean = (rnd(seed + 90 + i) - .5) * 70;
    return `<path d="M${f(x - 7)} ${y0}Q${f(x + lean * .4)} ${f(y0 - h * .6)} ${f(x + lean)} ${f(y0 - h)}Q${f(x + lean * .4 + 5)} ${f(y0 - h * .55)} ${f(x + 8)} ${y0}Z" fill="${colors[i % colors.length]}"/>`;
  }).join('');
  const tree = (x, base, h, rx, ry, seed) => {
    const top = base - h, cy = top - ry * .42;
    const flecks = Array.from({length: 22}, (_, i) => {
      const a = rnd(seed + 200 + i) * Math.PI * 2, r = Math.sqrt(rnd(seed + 300 + i)) * .78;
      return leafShape(x + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, 15 + 9 * rnd(seed + 400 + i), 8, rnd(seed + 500 + i) * 180,
        i % 3 ? '#d0dbac' : '#24463a');
    }).join('');
    return `<path d="M${x - 40} ${base}Q${x - 22} ${base - h * .5} ${x - 17} ${top}L${x + 17} ${top}Q${x + 24} ${base - h * .5} ${x + 44} ${base}Q${x + 2} ${base + 14} ${x - 40} ${base}Z" fill="#8b5a3c" stroke="#252A30" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M${x - 4} ${base - h * .62}Q${x - rx * .3} ${top - ry * .05} ${x - rx * .5} ${top - ry * .3}M${x + 6} ${base - h * .7}Q${x + rx * .25} ${top} ${x + rx * .45} ${top - ry * .28}" fill="none" stroke="#7a4d33" stroke-width="15" stroke-linecap="round"/>
      <path d="M${x - 8} ${base - 18}q-5-${h * .3} 0-${h * .55}M${x + 12} ${base - 30}q7-${h * .2} 2-${h * .4}" fill="none" stroke="#5e3a26" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      <path d="${blob(x + 12, cy + ry * .55, rx * .82, ry * .3, 16, .1, seed + 1)}" fill="#23443a" opacity=".55"/>
      <path d="${blob(x, cy, rx, ry, 26, .085, seed + 2)}" fill="#2f5747" stroke="#252A30" stroke-width="3.5"/>
      <path d="${blob(x - rx * .06, cy - ry * .08, rx * .86, ry * .8, 22, .1, seed + 3)}" fill="#427361"/>
      <path d="${blob(x - rx * .2, cy - ry * .26, rx * .56, ry * .46, 18, .12, seed + 4)}" fill="#6f9c76"/>
      <path d="${blob(x - rx * .32, cy - ry * .42, rx * .27, ry * .2, 12, .14, seed + 5)}" fill="#a6c48a"/>${flecks}`;
  };
  const sym = (id, viewBox, body) => `<symbol id="${id}" viewBox="${viewBox}">${body}</symbol>`;

  // ---------- leaf geometry (shot 2, leaf-local 900×1300) ----------
  const B = [170, 1180], C = [430, 610], T = [790, 110];
  const q = t => [0, 1].map(k => (1 - t) ** 2 * B[k] + 2 * t * (1 - t) * C[k] + t * t * T[k]);
  const normal = t => {
    const d = [0, 1].map(k => 2 * (1 - t) * (C[k] - B[k]) + 2 * t * (T[k] - C[k])), l = Math.hypot(...d);
    return [-d[1] / l, d[0] / l];
  };
  const half = t => 270 * Math.sin(Math.PI * Math.min(1, t ** .8)) + 6;
  const edge = (t, s, k = 1) => { const p = q(t), n = normal(t), w = half(t) * k * s; return [p[0] + n[0] * w, p[1] + n[1] * w]; };
  const ts = Array.from({length: 33}, (_, i) => i / 32);
  const leafOutline = smooth([...ts.map(t => edge(t, 1)), ...ts.slice(1, -1).reverse().map(t => edge(t, -1))]);
  const leafLight = smooth([...ts.map(t => edge(t, 1)), ...ts.slice(1, -1).reverse().map(t => q(t))]);
  const midrib = `M${B.join(' ')}Q${C.join(' ')} ${T.join(' ')}`;
  const veins = [];
  for (let t = .1; t < .86; t += .085) for (const s of [1, -1]) {
    const a = q(t), c = edge(t + .03, s, .45), e = edge(t + .1, s, .9);
    veins.push(`M${a.map(f).join(' ')}Q${c.map(f).join(' ')} ${e.map(f).join(' ')}`);
  }
  const stomataLocal = [];
  for (let t = .2; t < .8; t += .085) for (const s of [1, -1]) stomataLocal.push({t: t + .04, p: edge(t + .045, s, .5), s});
  // Leaf piece: centre (52%,52%) of a 1000×1600 frame, width 92% → scale 920/900.
  const leafScale = 920 / 900, leafOrigin = [520 - 450 * leafScale, 832 - 650 * leafScale];
  const leafToFrame = ([x, y]) => [leafOrigin[0] + x * leafScale, leafOrigin[1] + y * leafScale];

  const tilePlate = Array.from({length: 120}, (_, i) =>
    leafShape(rnd(i) * 1080 - 40, rnd(i + 999) * 1680 - 40, 70 + 80 * rnd(i + 2000), 40 + 30 * rnd(i + 3000), rnd(i + 4000) * 180,
      ['#2f5747', '#427361', '#5d8b6b', '#6f9c76', '#a6c48a'][i % 5], '#24463a')).join('');

  const defs = document.querySelector('body > svg');
  defs.insertAdjacentHTML('beforeend', `
  <defs>
    <filter id="sh-blur6" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="sh-blur24" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="24"/></filter>
    <linearGradient id="sh-sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9dfa6"/><stop offset=".55" stop-color="#f7ecd3"/><stop offset="1" stop-color="#efe6cf"/></linearGradient>
    <linearGradient id="sh-sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8d999"/><stop offset=".6" stop-color="#f6ead2"/><stop offset="1" stop-color="#efe5cd"/></linearGradient>
    <linearGradient id="sh-leaf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3f7a55"/><stop offset="1" stop-color="#78ac6e"/></linearGradient>
  </defs>
  ${sym('sh-sun', '0 0 200 200', `<circle cx="100" cy="100" r="98" fill="#fbe7a8" opacity=".55"/>
    <g transform="translate(20 20)"><path d="m80 7 11 29 28-17-2 32 34-2-17 28 22 18-30 12 9 31-31-7-15 24-15-25-34 8 9-30L9 96l23-21-16-27 33 3-4-31 26 16Z" fill="#DAB357"/></g>
    <circle cx="100" cy="100" r="47" fill="#f2c95c" stroke="#252A30" stroke-width="3"/><path d="M78 84q12-18 34-16" fill="none" stroke="#fdf0c4" stroke-width="7" stroke-linecap="round"/>`)}
  ${sym('sh-s1-sky', '0 0 1000 1600', `<rect width="1000" height="1600" fill="url(#sh-sky1)"/>
    <circle cx="170" cy="200" r="360" fill="#fff3cf" opacity=".55"/>
    <path d="M0 930Q120 860 260 900T520 880T780 860T1000 900V1600H0Z" fill="#cdd5b6"/>
    ${[120, 300, 760, 880].map((x, i) => `<path d="${blob(x, 905 - i % 2 * 25, 46, 34, 12, .12, 40 + i)}" fill="#a9bb93"/>`).join('')}
    <path d="M0 990Q160 930 330 975T640 960T1000 985V1600H0Z" fill="#b6c5a1"/>`)}
  ${sym('sh-s1-ground', '0 0 1000 1600', `<path d="M0 1075Q180 1035 380 1060T760 1050T1000 1065V1600H0Z" fill="#e6c88e" stroke="#c9a467" stroke-width="3"/>
    <ellipse cx="95" cy="1185" rx="150" ry="55" fill="#fff0bf" opacity=".7"/>
    ${Array.from({length: 26}, (_, i) => `<path d="M${f(rnd(i + 70) * 960)} ${f(1110 + rnd(i + 170) * 470)}q24-7 50 0" fill="none" stroke="#d1a866" stroke-width="4" stroke-linecap="round"/>`).join('')}
    ${grass(11, 46, 1080, 18, 46, ['#8fae7c', '#7c9d6d'])}`)}
  ${sym('sh-s1-beams', '0 0 1000 1600', `<g fill="#ffd977" opacity=".5">
    <path d="M150 215 190 190 465 470 330 560Z"/><path d="M185 230 215 200 600 395 520 455Z"/><path d="M135 215 165 225 150 1140 20 1130Z"/></g>
    <g fill="none" stroke="#e0a93c" stroke-width="5" stroke-linecap="round" stroke-dasharray="18 22" opacity=".75">
    <path d="M190 245 390 500"/><path d="M215 225 545 418"/><path d="M150 260 90 1100"/></g>`)}
  ${sym('sh-shade', '0 0 640 200', `<ellipse cx="320" cy="100" rx="300" ry="80" fill="#5d7c6d" opacity=".55" filter="url(#sh-blur6)"/>
    <ellipse cx="330" cy="98" rx="215" ry="52" fill="#466a5b" opacity=".45" filter="url(#sh-blur6)"/>
    ${[[190, 95, 26], [420, 82, 20], [300, 125, 16], [500, 112, 14]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .45}" fill="#e9cd94" opacity=".55"/>`).join('')}`)}
  ${sym('sh-s1-tree', '0 0 760 1100', tree(380, 1060, 470, 340, 290, 17))}
  ${sym('sh-s1-fg', '0 0 1000 1600', `${grass(31, 34, 1600, 70, 170, ['#3f6b4c', '#5f8a5a', '#4d7a52'])}
    ${leafShape(930, 1530, 120, 60, -35, '#2f5747', '#6f9c76')}${leafShape(60, 1560, 95, 48, 30, '#3f6b4c', '#81a68a')}`)}
  ${sym('sh-s2-bg', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#3e6a54"/>
    <g filter="url(#sh-blur24)">${Array.from({length: 18}, (_, i) => `<circle cx="${f(rnd(i + 600) * 1000)}" cy="${f(rnd(i + 700) * 1600)}" r="${f(90 + rnd(i + 800) * 150)}" fill="${['#5d8b6b', '#2e5243', '#7fa483'][i % 3]}"/>`).join('')}
    ${Array.from({length: 12}, (_, i) => `<circle cx="${f(300 + rnd(i + 900) * 700)}" cy="${f(rnd(i + 950) * 700)}" r="${f(26 + rnd(i + 990) * 40)}" fill="#f4dc94" opacity=".5"/>`).join('')}</g>`)}
  ${sym('sh-s2-leaf', '0 0 900 1300', `<path d="M170 1180Q140 1250 80 1300" fill="none" stroke="#5c7f45" stroke-width="22" stroke-linecap="round"/>
    <path d="${leafOutline}" fill="url(#sh-leaf)" stroke="#252A30" stroke-width="4" stroke-linejoin="round"/>
    <path d="${leafLight}" fill="#9cc585" opacity=".35"/>
    <path d="${veins.join('')}" fill="none" stroke="#cfe0a6" stroke-width="5" stroke-linecap="round" opacity=".85"/>
    <path d="${midrib}" fill="none" stroke="#e1ebbc" stroke-width="11" stroke-linecap="round"/>
    ${stomataLocal.map(({p, t}) => `<g transform="translate(${p.map(f).join(' ')}) rotate(${f(-58 + t * 10)})"><ellipse rx="16" ry="9" fill="#9cc585" stroke="#2f5747" stroke-width="3"/><ellipse rx="9" ry="3" fill="#24463a"/></g>`).join('')}`)}
  ${sym('sh-s2-water', '0 0 900 1300', `<path d="${midrib}${veins.join('')}" fill="none" stroke="#8cc3dc" stroke-width="6" stroke-linecap="round" stroke-dasharray="22 12"/>`)}
  ${sym('sh-s2-lens', '0 0 400 400', `<circle cx="200" cy="200" r="190" fill="#fff9ee" stroke="#252A30" stroke-width="4"/>
    <clipPath id="sh-lens-clip"><circle cx="200" cy="200" r="170"/></clipPath>
    <g clip-path="url(#sh-lens-clip)"><rect width="400" height="400" fill="#6aa36c"/>
    ${Array.from({length: 7}, (_, r) => Array.from({length: 6}, (_, c) => `<path d="${blob(40 + c * 66 + (r % 2) * 33, 30 + r * 56, 30, 25, 8, .06, r * 9 + c)}" fill="#7db37a" stroke="#4b8257" stroke-width="3"/>`).join('')).join('')}
    <path d="M200 140C150 140 128 175 130 212 132 250 160 275 196 270L196 150ZM204 140C250 140 272 175 270 212 268 250 240 275 204 270Z" fill="#a7d08c" stroke="#252A30" stroke-width="3.5"/>
    <ellipse cx="200" cy="208" rx="9" ry="46" fill="#1f3a2f"/></g>`)}
  ${sym('sh-s2-pointer', '0 0 1000 1600', `<path d="M560 520 478 646M640 545 486 650" fill="none" stroke="#fff9ee" stroke-width="5" stroke-dasharray="12 10" stroke-linecap="round"/>`)}
  ${sym('sh-mol', '0 0 60 50', `<path d="M17 17 30 29 43 17" stroke="#59758D" stroke-width="3"/><circle cx="30" cy="29" r="13" fill="#eef6f8" stroke="#59758D" stroke-width="2.5"/>
    <circle cx="13" cy="15" r="7" fill="#fff" stroke="#59758D" stroke-width="2"/><circle cx="47" cy="15" r="7" fill="#fff" stroke="#59758D" stroke-width="2"/>`)}
  ${sym('sh-s3-sky', '0 0 1000 1600', `<rect width="1000" height="1600" fill="url(#sh-sky3)"/>
    <circle cx="140" cy="150" r="320" fill="#fff3cf" opacity=".5"/>
    <path d="M230 1000V760h70v-40h60v70h55v-90h80v120h60V700h70v90h75v-60h90v80h55v-50h55V1000Z" fill="#ddd0b6"/>
    <path d="M300 1000V840h90v-30h70v60h90v-70h80v90h85v-40h85V1000Z" fill="#d2c3a5"/>`)}
  ${sym('sh-s3-street', '0 0 1000 1600', `<path d="M0 430h205v710H0Z" fill="#c2694c" stroke="#252A30" stroke-width="3.5"/>
    <path d="M0 418h222l-8 26H0Z" fill="#8f4a35"/>
    ${[[40, 500], [120, 500], [40, 650], [120, 650], [40, 800], [120, 800], [40, 950], [120, 950]].map(([x, y]) => `<path d="M${x} ${y}h52v88h-52Z" fill="${(x + y) % 3 ? '#f1d7a8' : '#59758D'}" stroke="#252A30" stroke-width="2.5"/>`).join('')}
    <path d="M0 1120Q300 1100 1000 1125V1600H0Z" fill="#e2c084" stroke="#c9a467" stroke-width="3"/>
    <path d="M0 1200H1000M0 1320H1000M0 1460H1000" stroke="#cfa96a" stroke-width="4"/>
    ${Array.from({length: 12}, (_, i) => `<path d="M${80 + i * 85 + (i % 2) * 30} ${1200 + (i % 3) * 120}v${i % 3 === 2 ? 140 : 120}" stroke="#cfa96a" stroke-width="4"/>`).join('')}
    <path d="M0 1120Q300 1100 460 1112V1600H0Z" fill="#fff1c4" opacity=".4"/>
    <path d="M500 1112Q760 1110 1000 1125V1175Q760 1160 500 1165Z" fill="#9db886"/>${grass(77, 18, 1130, 12, 30, ['#86a874'])}`)}
  ${sym('sh-s3-trees', '0 0 640 1000', tree(200, 980, 380, 200, 180, 3) + tree(460, 960, 420, 190, 200, 7))}
  ${sym('sh-bench', '0 0 220 110', `<path d="M10 30h200v18H10ZM14 58h192v14H14Z" fill="#b5835a" stroke="#252A30" stroke-width="3"/><path d="M30 48v58M190 48v58M40 72v34M180 72v34" stroke="#252A30" stroke-width="7" stroke-linecap="round"/>`)}
  ${sym('sh-heat', '0 0 60 220', `<path d="M30 210q-22-22 0-44t0-44 0-44 0-44 0-44" fill="none" stroke="#d98b3a" stroke-width="7" stroke-linecap="round"/>`)}
  ${sym('sh-cool', '0 0 560 240', `<g fill="none" stroke="#4f8a9a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
    <path d="M540 70Q420 30 300 72T40 64m26-26-26 26 30 20"/><path d="M520 150Q400 110 270 152T60 148m26-26-26 26 30 20"/><path d="M500 220Q380 190 250 220T110 214"/></g>`)}
  ${sym('sh-therm', '0 0 70 260', `<path d="M22 22a13 13 0 0 1 26 0v168a24 24 0 1 1-26 0Z" fill="#fff9ee" stroke="#252A30" stroke-width="3.5"/><path d="M50 50h10M50 90h10M50 130h10M50 170h10" stroke="#252A30" stroke-width="3"/>`)}
  ${sym('sh-therm-hot', '0 0 70 260', `<path d="M29 30h12v170H29Z" fill="#c9553c"/><circle cx="35" cy="210" r="17" fill="#c9553c"/>`)}
  ${sym('sh-therm-cool', '0 0 70 260', `<path d="M29 30h12v170H29Z" fill="#4f8a9a"/><circle cx="35" cy="210" r="17" fill="#4f8a9a"/>`)}
  ${sym('sh-s3-fg', '0 0 1000 1600', grass(55, 30, 1600, 60, 150, ['#3f6b4c', '#5f8a5a', '#4d7a52']) + leafShape(950, 1545, 110, 55, -30, '#2f5747', '#6f9c76'))}
  ${sym('sh-tiles', '0 0 1000 1600', `<rect width="1000" height="1600" fill="#2f5747"/>${tilePlate}`)}`);

  const style = document.createElement('style');
  style.textContent = `
    .story-frame { --x:56px; --y:80px }
    .story-safe { height:calc(100vh - 2 * var(--y)); min-height:0; gap:28px; grid-template-rows:minmax(0,1fr) auto }
    .story-body { display:block; height:100%; min-height:0 }
    .story-body .story-title { display:none }
    .story-stage { height:100%; min-height:0; overflow:hidden; border-radius:28px; background:#efe6cf;
      box-shadow:0 10px 0 -4px #252a301f, 0 22px 40px #252a3024; isolation:isolate }
    .shot-camera { position:absolute; inset:0; transform-origin:50% 50% }
    .piece.plate { height:100% }
    .piece.plate .piece-art { height:100% }
    .piece.flat .piece-art { filter:none }
    .shot-overlay { position:absolute; inset:0; pointer-events:none; z-index:30 }
    .shot-overlay svg { width:100%; height:100%; display:block }
    .shot-paper { position:absolute; inset:-60px 0; background:var(--paper); z-index:31; pointer-events:none;
      box-shadow:0 -10px 26px #252a3026, 0 10px 26px #252a3026; border-radius:46% 54% 50% 50% / 26px 30px 28px 22px }
    .shot-grain { position:absolute; inset:0; width:100%; height:100%; opacity:.16; mix-blend-mode:multiply; pointer-events:none; z-index:40 }
    .shot-vignette { position:absolute; inset:0; pointer-events:none; z-index:39; box-shadow:inset 0 0 110px #3b2c1730; border-radius:inherit }
    .piece-label { font:700 40px/1.45 "Nirmala UI","Segoe UI",sans-serif; background:#fff9ee; border-radius:12px 9px 14px 8px;
      padding:4px 18px; box-shadow:0 5px 0 -2px #252a3024, 0 10px 18px #252a301c; white-space:nowrap }
    .piece--annotation .piece-label { border:0; font-size:40px; font-weight:700; padding:4px 18px; background:#fff9ee }
    #q-tag .piece-label { font-size:46px; padding:8px 26px; border-left:10px solid var(--mustard) }
    footer.story-caption { align-self:end; width:100%; max-width:none; min-height:176px; margin:0; display:grid; place-items:center;
      padding:20px 34px; border-radius:24px 20px 26px 18px; background:#fff9ee; color:var(--ink);
      border-left:12px solid var(--forest); font:600 42px/1.5 "Nirmala UI","Segoe UI",sans-serif; text-align:center; text-wrap:balance;
      box-shadow:0 9px 0 -3px #252a301f, 0 18px 34px #252a3020 }
  `;
  document.head.append(style);

  // ---------- scenes ----------
  const P = (id, art, x, y, width, layer, extra = {}) => ({id, art, position: {x, y, width}, layer, label: extra.label ?? null, ...extra});
  const plate = (id, art, layer, mode = 'cover') => P(id, art, 50, 50, 100, layer, {plate: mode});
  const fx = ([x, y]) => [x / 10, y / 16];
  const particles = [], tracks = {};
  const key = (t, v, ease = 'smooth') => [t, v, ease];
  const rise = (id, [x, y], dx, dy, start, dur, scale) => {
    particles.push(P(id, 'sh-mol', x, y, 5.2, 4, {flat: true}));
    tracks[id] = [key(start, [0, 0, -10, scale * .45, 0]), key(start + dur * .25, [dx * .25, dy * .25, 0, scale * .85, .9], 'out'),
      key(start + dur * .7, [dx * .7, dy * .7, 8, scale, .5]), key(start + dur, [dx, dy, 14, scale * 1.15, 0])];
  };
  // Shot 2: water leaves leaf stomata as dispersing, fading molecules (symbolic invisible vapour).
  stomataLocal.forEach(({p}, i) => {
    if (i % 2 && i > 6) return;
    const [x, y] = fx(leafToFrame(p));
    rise('vap-leaf-' + i, [x, y], -.05 - .07 * rnd(i + 20), -.1 - .06 * rnd(i + 40), p2.start + 1.0 + (i % 9) * .15 + rnd(i) * .1, 1.5, .9);
  });
  for (let i = 0; i < 6; i++) rise('vap-lens-' + i, [70, 25.5], (rnd(i + 60) - .5) * .16, -.11 - .05 * rnd(i + 61), p2.start + 1.1 + i * .22, 1.4, 1.35);
  const shot2Particles = particles.splice(0);
  // Shot 3: the same symbol, smaller, leaving the canopies.
  for (let i = 0; i < 10; i++) rise('vap-tree-' + i, [62 + rnd(i + 80) * 28, 36 + rnd(i + 81) * 6], (rnd(i + 82) - .5) * .06, -.1 - .04 * rnd(i + 83),
    p3.start + .3 + (i % 5) * .7 + (i > 4 ? .35 : 0), 1.8, .8);
  const shot3Particles = particles.splice(0);

  paperScenes['tree-shot-shade'] = {locale: 'hi-IN', topic: 'पेड़ों की छाया और ठंडक', beat: 'hook', heading: '', narrationCaption: '',
    objects: [plate('s1-sky', 'sh-s1-sky', 0), P('s1-sun', 'sh-sun', 17, 12.5, 24, 1, {flat: true}), plate('s1-ground', 'sh-s1-ground', 1),
      plate('s1-beams', 'sh-s1-beams', 2, 'exact'), P('s1-shade', 'sh-shade', 60, 80.6, 64, 2, {flat: true}),
      P('s1-tree', 'sh-s1-tree', 56, 48.75, 76, 3, {origin: '50% 96%'}), plate('s1-fg', 'sh-s1-fg', 5),
      P('s1-sun-label', null, 31, 22, 20, 4, {label: 'धूप'}), P('s1-shade-label', null, 60, 82, 20, 4, {label: 'छाया'}),
      P('q-tag', null, 50, 6.5, 96, 4, {label: 'पेड़ हवा को कैसे ठंडा करते हैं?'})],
    relationships: [], cues: [{object: 's1-beams', when: 'धूप', action: 'reveal'}, {object: 's1-shade', when: 'रोकते', action: 'spread'}]};
  paperScenes['tree-shot-leaf'] = {locale: 'hi-IN', topic: 'पेड़ों की छाया और ठंडक', beat: 'mechanism', heading: '', narrationCaption: '',
    objects: [plate('s2-bg', 'sh-s2-bg', 0), P('s2-leaf', 'sh-s2-leaf', 52, 52, 92, 3, {origin: '12% 92%'}),
      P('s2-water', 'sh-s2-water', 52, 52, 92, 3, {origin: '12% 92%', flat: true}),
      plate('s2-pointer', 'sh-s2-pointer', 4, 'exact'), P('s2-lens', 'sh-s2-lens', 70, 24, 40, 4), ...shot2Particles,
      P('s2-water-label', null, 27, 66, 20, 5, {label: 'पानी'}), P('s2-vapour-label', null, 26, 21, 44, 5, {label: 'जलवाष्प (अदृश्य)'})],
    relationships: [], cues: [{object: 's2-water', when: 'पानी', action: 'flow'}, {object: 'vap-leaf-0', when: 'भाप', action: 'disperse'}]};
  paperScenes['tree-shot-street'] = {locale: 'hi-IN', topic: 'पेड़ों की छाया और ठंडक', beat: 'closing', heading: '', narrationCaption: '',
    objects: [plate('s3-sky', 'sh-s3-sky', 0), P('s3-sun', 'sh-sun', 14, 9, 20, 1, {flat: true}), plate('s3-street', 'sh-s3-street', 2, 'exact'),
      P('s3-shade', 'sh-shade', 70, 80.6, 62, 2, {flat: true}), P('s3-bench', 'sh-bench', 71, 76.5, 20, 3),
      P('s3-trees', 'sh-s3-trees', 70, 47.5, 64, 3, {origin: '50% 97%'}),
      ...[[8, 64], [18, 61], [28, 64], [13, 83], [29, 85]].map(([x, y], i) => P('s3-heat-' + i, 'sh-heat', x, y, 5, 4, {flat: true})),
      P('s3-therm-hot-back', 'sh-therm', 33, 47, 7, 4), P('s3-therm-hot', 'sh-therm-hot', 33, 47, 7, 4, {flat: true}),
      P('s3-therm-cool-back', 'sh-therm', 66, 61, 7, 4), P('s3-therm-cool', 'sh-therm-cool', 66, 61, 7, 4, {flat: true}),
      P('s3-cool', 'sh-cool', 47, 72, 50, 4, {flat: true}), ...shot3Particles, plate('s3-fg', 'sh-s3-fg', 5),
      P('s3-hot-label', null, 19, 50, 24, 5, {label: 'गर्म हवा'}), P('s3-cool-label', null, 42, 63.5, 24, 5, {label: 'ठंडी हवा'})],
    relationships: [], cues: [{object: 's3-cool', when: 'हवा', action: 'flow'}, {object: 's3-therm-cool', when: 'ठंडी', action: 'drop'}]};

  // ---------- motion ----------
  const N = [0, 0, 0, 1, 1];
  const show = (id, at, from, dur = .4) => { tracks[id] = [key(at, from), key(at + dur, N, 'out')]; };
  const showHide = (id, at, from, off, dur = .3) => { tracks[id] = [key(at, from), key(at + dur, N, 'out'), key(off, N), key(off + .12, [0, 0, 0, .96, 0])]; };
  const cues = [];
  const cue = (id, phrase, offset) => { const at = phrases[phrase].start + offset; cues.push({id, phrase: phrase + 1, at}); return at; };
  // Shot 1 — phrase 1 «पेड़ धूप रोकते हैं।»
  showHide('q-tag', 0, [0, -.02, 0, .96, 0], 1.0, .35);
  const beamsAt = cue('s1-beams', 0, .22);
  tracks['s1-beams'] = [key(beamsAt, [0, 0, 0, 1, 0]), key(beamsAt + .12, N)];
  const shadeAt = cue('s1-shade', 0, .55);
  tracks['s1-shade'] = [key(shadeAt, [0, -.01, 0, .35, 0]), key(shadeAt + .55, N, 'out')];
  showHide('s1-sun-label', beamsAt + .25, [0, .015, 0, .9, 0], 1.6, .2);
  showHide('s1-shade-label', shadeAt + .2, [0, .015, 0, .9, 0], 1.6, .2);
  // Shot 2 — phrase 2 «पत्तियों से पानी भाप बनकर निकलता है,»
  const waterAt = cue('s2-water', 1, .3);
  tracks['s2-water'] = [key(waterAt, [0, 0, 0, 1, 0]), key(waterAt + .1, N)];
  showHide('s2-water-label', waterAt + .45, [0, .015, 0, .9, 0], cut2 - .45, .25);
  show('s2-lens', cue('s2-lens', 1, .55), [0, .02, -6, .7, 0], .45);
  tracks['s2-pointer'] = [key(p2.start + .85, [0, 0, 0, 1, 0]), key(p2.start + 1.1, N)];
  cue('vap-leaf-0', 1, 1.0);
  show('s2-vapour-label', p2.start + 1.35, [0, .02, 0, .9, 0], .3);
  // Shot 3 — phrase 3 «तो आसपास की हवा ठंडी होने में भी मदद मिल सकती है।»
  show('s3-hot-label', p3.start + .3, [0, .015, 0, .9, 0], .3);
  const coolAt = cue('s3-cool', 2, .95);
  tracks['s3-cool'] = [key(coolAt, [.02, 0, 0, 1, 0]), key(coolAt + .2, [.01, 0, 0, 1, 1]), key(coolAt + 1.2, N)];
  const coldAt = cue('s3-cool-label', 2, 1.3);
  show('s3-cool-label', coldAt, [0, .015, 0, .9, 0], .3);
  const reveals = {
    's1-beams': [beamsAt, beamsAt + .5, 'diag'],
    's2-water': [waterAt, waterAt + .85, 'diag-up'],
    's3-cool': [coolAt, coolAt + 1.0, 'leftward'],
    's3-therm-hot': [cut2 + .15, cut2 + .9, 'up', .55, .9],
    's3-therm-cool': [coldAt, coldAt + 1.0, 'up', .9, .42],
  };
  const ambient = {
    's1-sun': {spin: 5}, 's3-sun': {spin: 5},
    's1-tree': {sway: [.45, 3.1, 0]}, 's3-trees': {sway: [.4, 3.4, 1]},
    's2-leaf': {sway: [.9, 2.7, 0]}, 's2-water': {sway: [.9, 2.7, 0]},
    's1-shade': {sway: [0, 1, 0], breathe: [.012, 3.1, 0]},
    's3-heat-0': {bob: [.006, 1.1, 0], flicker: [.45, .9, 0]}, 's3-heat-1': {bob: [.006, 1.3, 2], flicker: [.45, 1.1, 1]},
    's3-heat-2': {bob: [.006, 1.2, 4], flicker: [.45, 1.0, 2]},
    's3-heat-3': {bob: [.006, 1.15, 3], flicker: [.45, .95, 3]}, 's3-heat-4': {bob: [.006, 1.25, 5], flicker: [.45, 1.05, 4]}, 's3-cool': {drift: [.006, 1.6, 0]},
  };
  const shots = [
    {id: 'tree-shot-shade', start: 0, accent: '#DAB357',
      camera: [key(0, [0, .02, 1]), key(1.7, [.02, -.03, 1.07]), key(cut1, [-.02, -.12, 1.9], 'in')]},
    {id: 'tree-shot-leaf', start: cut1, accent: '#427361',
      camera: [key(cut1, [.05, -.06, 1.4]), key(cut1 + .5, [0, 0, 1], 'out'), key(3.7, [.03, -.03, 1.04]),
        key(cut2 - .25, [0, -.06, 1.07]), key(cut2, [0, -.12, 1.14], 'in')]},
    {id: 'tree-shot-street', start: cut2, accent: '#4f8a9a',
      camera: [key(cut2, [.02, -.1, 1.14]), key(cut2 + .8, [0, 0, 1], 'out'), key(duration, [.03, .01, 1.05])]},
  ];

  const ease = {linear: p => p, out: p => 1 - (1 - p) ** 3, in: p => p ** 3, smooth: p => p * p * (3 - 2 * p)};
  const clamp = v => Math.max(0, Math.min(1, v));
  const interp = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
      const [a, va] = keys[i - 1], [b, vb, curve] = keys[i];
      const p = ease[curve](clamp((t - a) / (b - a)));
      return va.map((x, k) => x + (vb[k] - x) * p);
    }
    return keys.at(-1)[1];
  };
  const wave = (t, [amp, period, phase]) => amp * Math.sin(2 * Math.PI * t / period + phase);
  const parallax = [.45, .7, 1, 1, 1, 1.2];
  const stage = document.querySelector('.story-stage');
  const caption = document.querySelector('footer');
  let active = -1, camera, overlayLeaf, overlayPaper, W, H;

  function setup(index) {
    renderPaperScene(shots[index].id);
    const scene = paperScenes[shots[index].id];
    camera = document.createElement('div');
    camera.className = 'shot-camera';
    camera.append(...stage.childNodes);
    overlayLeaf = document.createElement('div');
    overlayLeaf.className = 'shot-overlay';
    overlayLeaf.innerHTML = '<svg viewBox="0 0 1000 1600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><use href="#sh-tiles"/></svg>';
    overlayPaper = document.createElement('div');
    overlayPaper.className = 'shot-paper';
    const grain = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    grain.setAttribute('class', 'shot-grain');
    grain.innerHTML = '<rect width="100%" height="100%" filter="url(#fibers)"/>';
    const vignette = document.createElement('div');
    vignette.className = 'shot-vignette';
    stage.append(camera, vignette, grain, overlayLeaf, overlayPaper);
    for (const object of scene.objects) {
      const node = document.getElementById(object.id);
      if (object.plate) {
        node.classList.add('plate', 'flat');
        node.querySelector('svg').setAttribute('preserveAspectRatio', 'xMidYMid slice');
      }
      if (object.flat) node.classList.add('flat');
      if (object.origin) node.style.transformOrigin = object.origin;
    }
    caption.style.borderLeftColor = shots[index].accent;
    W = stage.offsetWidth; H = stage.offsetHeight;
    active = index;
  }

  function renderAt(seconds) {
    if (!Number.isFinite(seconds)) throw new TypeError('Explicit seconds required');
    const t = Math.max(0, Math.min(duration, seconds));
    const index = t < cut1 ? 0 : t < cut2 ? 1 : 2;
    if (index !== active || stage.offsetWidth !== W || stage.offsetHeight !== H) setup(index);
    const [cx, cy, zoom] = interp(shots[index].camera, t);
    camera.style.transform = `scale(${zoom}) translate(${-cx * W}px,${-cy * H}px)`;
    for (const object of paperScenes[shots[index].id].objects) {
      const v = [...(tracks[object.id] ? interp(tracks[object.id], t) : N)];
      const a = ambient[object.id] ?? {};
      if (a.sway) v[2] += wave(t, a.sway);
      if (a.spin) v[2] += a.spin * t;
      if (a.bob) v[1] += wave(t, a.bob);
      if (a.drift) v[0] += wave(t, a.drift);
      if (a.breathe) v[3] *= 1 + wave(t, a.breathe);
      if (a.flicker) v[4] *= 1 - a.flicker[0] * (.5 + .5 * Math.sin(2 * Math.PI * t / a.flicker[1] + a.flicker[2]));
      const p = parallax[object.layer];
      const base = object.plate === 'cover' ? 1.12 : 1;
      const node = document.getElementById(object.id);
      node.style.transform = `translate(-50%,-50%) translate(${(v[0] + cx * (1 - p)) * W}px,${(v[1] + cy * (1 - p)) * H}px) rotate(${v[2]}deg) scale(${v[3] * base})`;
      node.style.opacity = String(v[4]);
      const r = reveals[object.id];
      if (r) {
        const [start, end, dir, from = 0, to = 1] = r;
        const k = 100 * (1 - (from + (to - from) * ease.smooth(clamp((t - start) / (end - start)))));
        const inset = {diag: [0, k, k, 0], 'diag-up': [k, k, 0, 0], leftward: [0, 0, 0, k], up: [k, 0, 0, 0]}[dir];
        node.style.clipPath = `inset(${inset.map(x => x + '%').join(' ')})`;
      }
    }
    // Transition 1: push into the canopy, dissolve through leaves, land on one leaf.
    const leaf = t < cut1 ? clamp((t - (cut1 - .12)) / .12) : 1 - clamp((t - cut1) / .2);
    overlayLeaf.style.opacity = String(ease.smooth(leaf));
    overlayLeaf.style.transform = `scale(${1.25 - .25 * ease.smooth(leaf)})`;
    // Transition 2: a paper sheet travels upward with the rising vapour, revealing the street.
    const sheet = Math.abs(t - cut2) < .24 ? (t - cut2) / .24 : null;
    overlayPaper.style.visibility = sheet === null ? 'hidden' : 'visible';
    overlayPaper.style.transform = `translateY(${sheet === null ? 120 : -sheet * 112}%)`;
    const active_ = captions.find(c => t >= c.start && t < c.end) ?? (t >= duration ? captions.at(-1) : null);
    const enter = active_ ? ease.out(clamp((t - active_.start) / .18)) : 0;
    if (caption.textContent !== (active_?.text ?? '')) caption.textContent = active_?.text ?? '';
    caption.style.opacity = String(active_ ? (active_.id === 1 ? enter : Math.max(.35, enter)) : 0);
    caption.style.transform = `scale(${.97 + .03 * enter})`;
    return {t, shot: shots[index].id, captionId: active_?.id ?? null, camera: [cx, cy, zoom],
      transition: leaf > 0 ? 'leaf' : sheet !== null ? 'paper' : null};
  }
  globalThis.paperShots = {duration, cuts: [cut1, cut2], captions, cues, renderAt};
  renderAt(0);
  return {captions, cuts: [cut1, cut2], cues, phrases};
}
