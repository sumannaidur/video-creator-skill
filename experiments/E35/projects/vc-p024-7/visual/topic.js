(() => {
  const {sym} = globalThis.techShotArt;
  const K = globalThis.techKit;
  const n = 21, unit = 12, border = 4, size = (n + 2 * border) * unit;
  const corners = [[0, 0], [14, 0], [0, 14]];
  const tags = Array.from({length: n}, () => Array(n).fill('data'));
  const dots = Array.from({length: n}, () => Array(n).fill(0));
  for (const [left, top] of corners) {
    for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
      if (left + x < 0 || left + x >= n || top + y < 0 || top + y >= n) continue;
      tags[top + y][left + x] = x < 0 || y < 0 || x > 6 || y > 6 ? 'separator' : 'finder';
      const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
      dots[top + y][left + x] = Number(ring <= 1 || ring === 3);
    }
  }
  for (let i = 8; i <= 12; i++) {
    tags[6][i] = tags[i][6] = 'timing';
    dots[6][i] = dots[i][6] = Number(i % 2 === 0);
  }
  // Leave format cells neutral. The fixed dark module still has its standard location.
  for (let i = 0; i < n; i++) {
    if (i <= 8 && i !== 6 || i >= 13) tags[8][i] = 'format';
    if (i <= 8 && i !== 6 || i >= 14) tags[i][8] = 'format';
  }
  tags[13][8] = 'fixed';
  dots[13][8] = 1;
  const at = i => (i + border) * unit;
  const example = (x, y) => ((x * 7 + y * 11 + x * y * 3) % 13) < 6;
  const rect = (x, y, w, h, fill, more = '') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${more}/>`;
  function grid() {
    let out = rect(0, 0, size, size, '#f4f8fc', 'rx="4"');
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const tag = tags[y][x];
      if (tag === 'format') out += rect(at(x), at(y), unit, unit, '#ccd6e2');
      else if (dots[y][x] || tag === 'data' && example(x, y)) out += rect(at(x), at(y), unit, unit, '#233448');
    }
    return out;
  }
  const outline = ([x, y]) => rect(at(x) - 3, at(y) - 3, 90, 90, '#1ec6d323', 'stroke="#008895" stroke-width="5" rx="7"');
  const timing = rect(at(8), at(6), 5 * unit, unit, '#ec9b3d4d', 'stroke="#c26713" stroke-width="2"') +
    rect(at(6), at(8), unit, 5 * unit, '#ec9b3d4d', 'stroke="#c26713" stroke-width="2"');
  const vb = '0 0 1000 1778';
  const moduleBox = `0 0 ${size} ${size}`;
  const shots = [
    {id: 'label', scene: 'label', accent: '#7de4ec'},
    {id: 'locate', scene: 'locate', accent: '#67d3e4'},
    {id: 'read', scene: 'read', accent: '#9be4ed'},
  ];
  function words(x, y, text, size = 24, color = '#b8dce4') {
    return `<text x="${x}" y="${y}" font-family="Segoe UI, sans-serif" font-weight="600" font-size="${size}" fill="${color}">${text}</text>`;
  }
  globalThis.techTopic = {
    shots,
    symbols() {
      const studio = K.art.studio(1000, 1778, {id: 'qr-studio', wall: ['#0c1524', '#17283a'], ground: ['#17283a', '#0a1322'], dots: '#375065'});
      const product = `<defs>
        <linearGradient id="qr-metal" x2="1" y2="1"><stop stop-color="#dbecf2"/><stop offset=".42" stop-color="#647f94"/><stop offset=".71" stop-color="#384b61"/><stop offset="1" stop-color="#a0b7c6"/></linearGradient>
        <linearGradient id="qr-glass" x2="1" y2="1"><stop stop-color="#31536a"/><stop offset=".48" stop-color="#101b2b"/><stop offset="1" stop-color="#07101b"/></linearGradient>
        </defs><ellipse cx="420" cy="575" rx="335" ry="45" fill="#030810" opacity=".64"/>
        <g transform="translate(100 28) matrix(1 .18 -.30 .91 75 0)">
          <rect x="5" y="25" width="634" height="500" rx="34" fill="#233449" stroke="#4c667e" stroke-width="6"/>
          <rect x="0" y="0" width="634" height="500" rx="34" fill="url(#qr-metal)" stroke="#c0d7e2" stroke-width="2"/>
          <rect x="13" y="13" width="608" height="474" rx="27" fill="url(#qr-glass)" stroke="#526e83"/>
          <path d="M45 27H579 Q603 27 606 48 M26 68V435" stroke="#b3d6de" stroke-width="2" opacity=".38" fill="none"/>
          <g transform="translate(112 53)">${grid()}</g>
          <path d="M491 88h67m-67 19h52m-52 291h64" stroke="#658b9c" stroke-width="4"/>
          <circle cx="543" cy="435" r="6" fill="#63ebe5"/>
          ${words(126, 452, 'STRUCTURE SAMPLE', 19)}
        </g>`;
      const data = `<path d="M${at(20) + 6} ${at(20) + 6}h-12l12 -12h-12l12 -12h-12l12 -12h-12l12 -12h-12" fill="none" stroke="#058c9b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        ${rect(at(11), at(10), 3 * unit, 3 * unit, '#d47c57', 'stroke="#a54636" stroke-width="3"')}
        <path d="M183 167l25 25m0 -25l-25 25" stroke="#fff1da" stroke-width="3"/>`;
      return [
        sym('studio', vb, studio), sym('product', '0 0 850 650', product),
        sym('module-grid', moduleBox, grid()),
        sym('finders', moduleBox, corners.map(outline).join('')), sym('timing', moduleBox, timing),
        sym('data-trace', moduleBox, data),
      ].join('');
    },
    build(ctx) {
      const {P, plate} = ctx;
      const KMotion = K.motion(ctx);
      const part = (id, art, x, y, w, z) => P(id, art, x, y, w, z, {flat: true});
      const label = (id, text, x, y, w) => P(id, null, x, y, w, 5, {label: text, labelStyle: 'callout'});
      const scenes = {
        label: {objects: [
          plate('bg-label', 'studio', 0), part('reader', 'product', 49, 50, 91, 2),
          label('module-label', 'LIGHT / DARK MODULES', 49, 69, 75),
        ]},
        locate: {objects: [
          plate('bg-locate', 'studio', 0), part('grid-locate', 'module-grid', 50, 47, 82, 2),
          part('finder-mark', 'finders', 50, 47, 82, 3), part('timing-mark', 'timing', 50, 47, 82, 4),
          label('locate-label', 'FINDERS + TIMING MARKS', 50, 69, 76),
        ]},
        read: {objects: [
          plate('bg-read', 'studio', 0), part('grid-read', 'module-grid', 50, 46, 78, 2),
          part('read-mark', 'data-trace', 50, 46, 78, 3),
          label('read-label', 'ILLUSTRATIVE GRID', 50, 68, 72),
        ]},
      };
      const a = KMotion.label('module-label', 'modules-cue');
      KMotion.label('finder-mark', 'finders-cue');
      const c = KMotion.label('timing-mark', 'timing-cue');
      const d = KMotion.label('read-mark', 'repair-cue');
      return {scenes, checks: {keyframes: [['product', a + .65], ['structure', c + .62], ['recovery', d + .62]]}};
    },
  };
})();
