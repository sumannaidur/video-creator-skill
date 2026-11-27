(() => {
  const K = globalThis.paperKit;
  const A = K.art;
  const {sym, rnd} = globalThis.paperShotArt;
  const light = A.light({dir: [.55, .84]});
  const leaf = 'M246 598Q198 570 165 530L139 485L153 478L110 446L124 432L81 392L99 382L57 334L82 331L42 278L69 279L41 223L72 231L59 174L93 190L96 137L125 158L138 101L165 131L197 75L218 100L256 38L272 92L296 77L307 130L334 111L334 164L366 146L359 204L394 187L384 242L425 224L404 281L445 270L414 328L450 317L423 369L446 370L403 418L416 435L371 466L382 482L335 520Q291 551 246 598Z';
  const veins = [
    'M246 598Q232 407 254 88',
    'M240 521Q187 509 122 434 M239 467Q165 442 94 370 M241 414Q162 369 77 298 M242 357Q165 302 84 238 M245 302Q184 237 111 183 M250 248Q204 183 150 139',
    'M239 521Q320 498 383 434 M239 466Q334 434 418 367 M241 413Q333 365 422 305 M242 356Q330 291 402 250 M245 304Q320 233 371 193 M249 247Q300 186 337 153',
  ];
  const colours = {
    green: ['#375c3d', '#60844a', '#b4c584', '#738f54'],
    gold: ['#af652a', '#d8993e', '#f8db83', '#eab758'],
    red: ['#8d4038', '#bd5d46', '#efac79', '#d48059'],
  };
  function leafArt(id, [base, fold, pale, vein]) {
    let seed = 51;
    const fibres = () => rnd(seed++);
    let flecks = '';
    for (let i = 0; i < 130; i++) {
      const x = 44 + fibres() * 400, y = 62 + fibres() * 520;
      flecks += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${2 + fibres() * 5} -2" stroke="${i % 4 ? pale : '#412f26'}" opacity="${.08 + fibres() * .19}" stroke-width="1"/>`;
    }
    return `<defs><clipPath id="${id}-clip"><path d="${leaf}"/></clipPath></defs>
      <path d="M244 573Q244 633 206 672" fill="none" stroke="#6a4c32" stroke-width="15" stroke-linecap="round"/>
      ${A.cut(leaf, {fill: base, depth: 13, lit: light, texture: 'fall-paper', textureOpacity: .37})}
      <g clip-path="url(#${id}-clip)">
        <path d="M246 598Q222 418 256 38L480 40V630Z" fill="${fold}"/>
        <path d="M210 111Q172 224 99 244Q130 206 115 151L175 92Z" fill="${pale}" opacity=".22"/>
        <path d="M335 379Q398 340 461 341V539Q382 483 335 379Z" fill="${pale}" opacity=".22"/>
        <g fill="none" stroke="${vein}" stroke-linecap="round">
          ${veins.map((d,i) => `<path d="${d}" stroke-width="${i ? 3.5 : 9}"/>`).join('')}
        </g>${flecks}
      </g>`;
  }
  function woodland(id, autumn) {
    let seed = 32;
    const rng = () => rnd(seed++);
    const tones = autumn ? ['#795036','#aa683e','#bc7e43','#d29556'] : ['#314f44','#45644e','#5b7354','#778a5b'];
    let markup = A.sky(1000, 1778, {id, top: autumn ? '#b98c65' : '#91a5a2', bottom: '#f0d8a8', sun: {x: 675, y: 530, r: 190}});
    for (let plane = 0; plane < 3; plane++) {
      const y = 780 + plane * 185;
      markup += A.cut(A.ridge(1000, y, 1778, {seed: 4 + plane, amp: 82}), {fill: tones[3 - plane], depth: 10, lit: light, shadowOpacity: .15});
      markup += Array.from({length: 8}, (_, i) => {
        const x = i * 142 - 28 + rng() * 60;
        const h = 92 + rng() * 180;
        return `<path d="M${x} ${y + 155}q10 -${h / 2} 7 -${h}m-5 ${h * .45}l-38 -41m42 61l36 -67" fill="none" stroke="${tones[Math.max(0, 2 - plane)]}" stroke-width="${6 + plane * 4}" stroke-linecap="round" opacity=".64"/>`;
      }).join('');
    }
    return markup;
  }
  const macro = 'M0 0H1000V1778H0Z';
  const branch = 'M0 144C185 111 346 152 536 203C642 235 705 214 799 224L829 250C723 268 628 260 519 235C330 199 167 157 0 207Z';
  const designs = [
    {id: 'canopy', cue: 'gold-cue', accent: '#8b481a'},
    {id: 'peel', cue: 'yellow-cue', accent: '#955723'},
    {id: 'return', cue: 'red-cue', accent: '#932e32'},
  ];

  globalThis.paperTopic = {
    get shots() { return designs.map(d => ({id: d.id, scene: d.id, accent: d.accent})); },
    symbols() {
      const vb = '0 0 1000 1778';
      return A.textures('fall', {tile: 320, seed: 12}) +
        sym('summer-woods', vb, woodland('summer-sky', false)) +
        sym('autumn-woods', vb, woodland('autumn-sky', true)) +
        sym('branch', '0 0 850 300', A.cut(branch, {fill: '#60442e', lit: light, depth: 13, texture: 'fall-paper'}) +
          '<path d="M7 161Q278 123 500 218M42 180Q180 155 321 184" fill="none" stroke="#a37c49" stroke-width="5" opacity=".7"/>') +
        sym('macro-paper', vb, A.cut(macro, {fill: '#ebd6a8', texture: 'fall-paper', textureOpacity: .48, depth: 0}) +
          A.cut('M0 320L1000 150V1030L0 1210Z', {fill: '#f5e4bc', depth: 17, lit: light, texture: 'fall-paper'})) +
        sym('peel-tab', '0 0 500 680', A.cut('M50 278L69 279L41 223L72 231L59 174L93 190L96 137L125 158L138 101L165 131L197 75L218 100L256 38L272 92L296 77L300 110Q241 153 240 228Q160 206 50 278Z',
          {fill: '#6b8753', depth: 22, lit: light, texture: 'fall-paper'}) +
          '<path d="M50 278Q165 188 240 228Q217 193 252 159Q179 182 111 200Z" fill="#c4cd91"/>') +
        Object.entries(colours).map(([name, palette]) =>
          sym(`leaf-${name}`, '0 0 500 680', leafArt(`cut-${name}`, palette))).join('');
    },
    build(ctx) {
      const {P, plate} = ctx;
      const kit = K.motion(ctx);
      const piece = (id, symbol, x, y, w, z) => P(id, symbol, x, y, w, z, {flat: true});
      const scenes = {
        canopy: {objects: [
          plate('summer', 'summer-woods', 0), piece('branch-in', 'branch', 42, 31, 100, 1),
          piece('branch-green', 'leaf-green', 26, 32, 32, 2),
          piece('far-gold', 'leaf-gold', 77, 28, 23, 2),
          piece('hook-leaf', 'leaf-gold', 57, 51, 55, 3),
        ]},
        peel: {objects: [
          plate('paper-desk', 'macro-paper', 0), piece('gold-stock', 'leaf-gold', 50, 45, 65, 1),
          piece('green-cover', 'leaf-green', 50, 45, 65, 2),
          piece('lifted-fold', 'peel-tab', 50, 45, 65, 3),
        ]},
        return: {objects: [
          plate('autumn', 'autumn-woods', 0), piece('branch-out', 'branch', 41, 37, 100, 1),
          piece('fall-gold', 'leaf-gold', 25, 44, 45, 2),
          piece('fall-red', 'leaf-red', 63, 51, 55, 3),
          piece('lingering-green', 'leaf-green', 84, 28, 28, 2),
        ]},
      };
      const gold = kit.settle('hook-leaf', 'gold-cue', [0, .05, -9, .9, 0], .49);
      const yellow = kit.settle('lifted-fold', 'yellow-cue', [0, 0, 0, 1, 0], .48);
      const {key, track} = ctx.motion;
      track('green-cover', [key(yellow, [0, 0, 0, 1, 1]), key(yellow + .48, [-.32, -.13, -14, 1, 0], 'out')]);
      const red = kit.settle('fall-red', 'red-cue', [.08, -.08, 12, .93, 0], .52);
      return {scenes, checks: {keyframes: [['canopy', gold + .6], ['peel', yellow + .6], ['return', red + .67]]}};
    },
  };
})();
