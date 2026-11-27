// P017.1 compact generic Tech Explainer fixture (test only): "a message travels as packets". Three shots, every speech
// moment from the resolved plan, composed for the stage's own aspect (portrait or landscape) via ctx.aspect.
(() => {
  const {f, sym} = globalThis.techShotArt;
  const {art, css} = globalThis.techKit;
  const SIGNAL = '#2e6bff', AMBER = '#ffb020', MINT = '#12b886', INK = '#13203a';
  let VW = 1000, VH = 1600, U = 1, land = false;
  const layout = ctx => { land = ctx.aspect > 1; VH = Math.round(1000 / ctx.aspect); U = Math.min(1, VH / 760); };
  const pc = (x, y) => [x / VW * 100, y / VH * 100];

  // Shot 1: a phone on a studio floor sends a message as packets.
  const phone = (w, h) => {
    const bubbles = [[40, 120, .7, SIGNAL], [w * .28, 210, .62, '#2a3a5c'], [40, 300, .5, SIGNAL]].map(([x, y, k, c]) =>
      `<rect x="${f(x)}" y="${y}" width="${f((w - 36) * k)}" height="64" rx="22" fill="${c}"/><rect x="${f(x + 22)}" y="${y + 24}" width="${f((w - 36) * k * .55)}" height="12" rx="6" fill="#ffffff" opacity=".8"/>`).join('');
    return `<path d="M${w} 30L${w + 24} 16V${h - 14}L${w} ${h}Z" fill="#0c1424"/>` + art.device(w, h, {content: bubbles});
  };
  const studioPlate = id => sym(id, `0 0 ${VW} ${VH}`, art.studio(VW, VH, {floor: land ? .64 : .6, id}));
  const pkt = sym('te-pkt', '0 0 94 48', art.packet(90, 44, SIGNAL));
  const pktAmber = sym('te-pkt-a', '0 0 94 48', art.packet(90, 44, AMBER));

  // Shot 2: routers on an isometric floor; the chosen route traces in cobalt.
  const netO = () => [VW / 2, VH * (land ? .42 : .45)];
  const NODES = {a: [-300, -40], b: [-80, -300], c: [-40, 40], d: [240, -120], e: [200, 260]};
  const node = k => art.iso(netO(), NODES[k][0] * U, NODES[k][1] * U, 70 * U);
  const routers = () => Object.entries(NODES).map(([k, [x, y]]) =>
    art.contact(...art.iso(netO(), x * U, y * U, 0), 80 * U, 30 * U, .18) +
    art.isoBox(netO(), {x: x * U - 50 * U, y: y * U - 50 * U, w: 100 * U, d: 100 * U, h: 70 * U, top: '#ffffff', left: '#dde3ec', right: '#c0cad8', r: 2}) +
    art.glowDot(...art.iso(netO(), x * U + 18 * U, y * U + 50 * U, 40 * U), 7 * U, k === 'b' || k === 'e' ? '#9aa7ba' : MINT)).join('');
  const links = () => [['a', 'b'], ['b', 'd'], ['a', 'c'], ['c', 'd'], ['c', 'e'], ['d', 'e']].map(([p, q]) =>
    `<path d="M${node(p).map(f).join(' ')}L${node(q).map(f).join(' ')}" stroke="#b8c2d1" stroke-width="${f(5 * U)}" stroke-linecap="round"/>`).join('');
  const route = () => art.trace([node('a'), node('c'), node('d')], {color: SIGNAL, width: 12 * U, under: null, round: 0});

  // Shot 3: a server stack receives and reassembles the message.
  const serverO = () => [VW * (land ? .38 : .5), VH * (land ? .78 : .66)];
  const server = () => art.contact(serverO()[0], serverO()[1], 170 * U, 60 * U) + [0, 1, 2, 3].map(i =>
    art.isoBox(serverO(), {x: -110 * U, y: -110 * U, z: i * 92 * U, w: 220 * U, d: 220 * U, h: 84 * U, top: '#ffffff', left: '#d9e0ea', right: '#b9c4d3', r: 2}) +
    [0, 1, 2].map(j => art.glowDot(...art.iso(serverO(), -110 * U + 40 * U + j * 34 * U, 110 * U, i * 92 * U + 42 * U), 6 * U, j === 0 ? MINT : SIGNAL)).join('')).join('');
  const message = (w, h) => `<rect x="0" y="0" width="${w}" height="${h}" rx="34" fill="#ffffff"/><rect x="0" y="0" width="${w}" height="${h}" rx="34" fill="none" stroke="#c7cfdb" stroke-width="3"/>` +
    `<rect x="36" y="${h / 2 - 14}" width="${w * .5}" height="28" rx="14" fill="${SIGNAL}"/><circle cx="${w - 60}" cy="${h / 2}" r="22" fill="${MINT}"/>` +
    `<path d="M${w - 72} ${h / 2}l9 9l17 -19" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;

  globalThis.techTopic = {
    shots: [
      {id: 'send', scene: 'te-send', accent: SIGNAL, transition: {type: 'focus'}},
      {id: 'route', scene: 'te-route', accent: MINT, transition: {type: 'iris', x: .5, y: .45}},
      {id: 'arrive', scene: 'te-arrive', accent: AMBER},
    ],
    css,
    symbols: ctx => { layout(ctx); return [
      studioPlate('te-studio-a'), studioPlate('te-studio-b'), studioPlate('te-studio-c'),
      sym('te-phone', '0 0 404 760', phone(380, 744)), pkt, pktAmber,
      sym('te-floor', `0 0 ${VW} ${VH}`, art.isoGrid(netO(), {size: 620 * U, step: 62 * U})),
      sym('te-links', `0 0 ${VW} ${VH}`, links()), sym('te-routers', `0 0 ${VW} ${VH}`, routers()), sym('te-route', `0 0 ${VW} ${VH}`, route()),
      sym('te-server', `0 0 ${VW} ${VH}`, server()), sym('te-message', '0 0 420 150', message(420, 150)),
      sym('te-lead', '0 0 300 120', art.leader([[20, 100], [140, 20], [290, 20]])),
    ].join(''); },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track, ambient} = motion;
      const kit = globalThis.techKit.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const label = (id, [x, y], w, text, style, extra = {}) => P(id, null, x, y, w, 5, {label: text, labelStyle: style, ...extra});
      const scenes = {};
      // 1. send
      const phoneAt = land ? pc(VW * .3, VH * .47) : pc(VW * .5, VH * .5), phoneW = land ? 13 : 38;
      scenes['te-send'] = {objects: [plate('s-bg', 'te-studio-a', 0), P('s-phone', 'te-phone', ...phoneAt, phoneW, 2, {required: true}),
        ...[0, 1, 2, 3].map(i => P(`s-pkt-${i}`, i === 2 ? 'te-pkt-a' : 'te-pkt', ...phoneAt, land ? 5 : 9, 3, {flat: false})),
        label('s-tag', land ? pc(VW * .68, VH * .32) : pc(VW * .5, VH * .13), land ? 24 : 40, 'packets', 'callout', {accent: SIGNAL})]};
      kit.power('s-phone', S('send').start, .5);
      const pk = kit.when('packets', 's-pkt-0');
      [0, 1, 2, 3].forEach(i => kit.travel(`s-pkt-${i}`, pk + i * .16, 1.2, land ? [[0, -.1], [.12 + i * .03, -.22], [.3, -.18 - i * .03]] : [[0, -.12], [.1 - i * .07, -.26], [.2 - i * .12, -.36]]));
      kit.label('s-tag', cue('phone') + .1);
      // 2. route
      const [ax, ay] = node('a'), [cx, cy] = node('c'), [dx, dy] = node('d');
      scenes['te-route'] = {objects: [plate('r-bg', 'te-studio-b', 0), plate('r-floor', 'te-floor', 1, 'exact'), plate('r-links', 'te-links', 2, 'exact'),
        plate('r-route', 'te-route', 2, 'exact'), plate('r-routers', 'te-routers', 3, 'exact'), P('r-pkt', 'te-pkt', ...pc(ax, ay - 30 * U), land ? 5 : 9, 4),
        label('r-tag', land ? pc(VW * .82, VH * .2) : pc(VW * .5, VH * .84), land ? 22 : 44, 'fastest path', 'chip', {accent: SIGNAL}),
        label('r-read', land ? pc(VW * .16, VH * .2) : pc(VW * .5, VH * .1), land ? 16 : 30, '3 hops', 'readout')]};
      kit.pulse('r-routers', cue('routers'), 1.2);
      kit.trace('r-route', 'path', .7);
      const p0 = cue('path');
      kit.travel('r-pkt', p0 + .1, 1.1, [[0, 0], [(cx - ax) / VW, (cy - ay) / VH], [(dx - ax) / VW, (dy - ay) / VH]]);
      kit.label('r-tag', p0 + .4); kit.label('r-read', S('route').start + .3);
      // 3. arrive
      const msgAt = land ? pc(VW * .68, VH * .45) : pc(VW * .5, VH * .24);
      scenes['te-arrive'] = {objects: [plate('a-bg', 'te-studio-c', 0), plate('a-server', 'te-server', 2, 'exact'), P('a-msg', 'te-message', ...msgAt, land ? 30 : 56, 4, {required: true}),
        label('a-tag', land ? pc(VW * .68, VH * .7) : pc(VW * .5, VH * .36), land ? 24 : 40, 'together', 'plain', {accent: INK})]};
      kit.rise('a-server', 'server', .03, .6);
      kit.rise('a-msg', 'together', .02, .45);
      kit.label('a-tag', cue('together') + .25);
      ambient('a-msg', {bob: [.003, 2.4, 0]});
      const cam = (id, startView, views, endView) => {
        const keys = kit.planCamera(id, views), s = S(id);
        return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0), ...(endView ? [key(s.end, endView, 'out')] : [])];
      };
      const cameras = {
        send: cam('send', [0, .02, 1.0], [[0, -.03, 1.1, 'smooth']], [0, -.035, 1.12]),
        route: [key(S('route').start, [0, .02, 1.12]), key(S('route').end, [0, 0, 1.02], 'out')],
        arrive: cam('arrive', [0, 0, 1.06], [[0, 0, 1.0, 'smooth']]),
      };
      return {scenes, cameras, checks: {keyframes: [['send-packets', pk + .7], ['route-trace', p0 + .75], ['arrive', cue('together') + .6]]}};
    },
  };
})();
