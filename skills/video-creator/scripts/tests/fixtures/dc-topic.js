// P017.7 compact Documentary fixture (test only), Telugu. Media comes only from the verified asset manifest: an original
// procedural coast image and an original procedural wave-footage frame sequence, both marked on screen as synthetic.
// Shot 1: Ken Burns drift over the image with a lower third; `dip`; shot 2: an original illustrated map, the route
// drawing on, the harbour marked, the footage playing in an archival inset. Speech moments come from the resolved plan.
(() => {
  const {sym, f} = globalThis.techShotArt;
  const D = globalThis.docKit, {art} = D;
  const T = {coast: 'సాయంత్రపు తీరం', harbour: 'రేవు', synthetic: 'కృత్రిమ చిత్రం — నిజమైన ఫోటో/దృశ్యం కాదు'};
  let VW = 1000, VH = 1600, land = false, inset = {};
  const layout = ctx => { land = ctx.aspect > 1; VH = Math.round(1000 / ctx.aspect); inset = land ? {x: 200, y: VH * .32, w: 300} : {x: 250, y: VH * .3, w: 400}; };
  const pc = (x, y) => [x / VW * 100, y / VH * 100];
  const plate = (id, body) => sym(id, `0 0 ${VW} ${VH}`, body);
  const coastLine = () => `M0 0H${f(VW * .44)}Q${f(VW * .4)} ${f(VH * .2)} ${f(VW * .52)} ${f(VH * .34)}Q${f(VW * .64)} ${f(VH * .5)} ${f(VW * .5)} ${f(VH * .66)}Q${f(VW * .44)} ${f(VH * .78)} ${f(VW * .62)} ${f(VH)}H0Z`;
  const HARBOUR = () => [VW * .56, VH * .7];
  const routePts = () => [[VW * .92, VH * .08], [VW * .86, VH * .3], [VW * .74, VH * .46], [VW * .66, VH * .6], HARBOUR()];

  globalThis.documentaryTopic = {
    shots: [
      {id: 'coast', scene: 'dc-coast', accent: '#c9a96a', transition: {type: 'dip'}},
      {id: 'route', scene: 'dc-route', accent: '#b3261e'},
    ],
    get css() { return D.css + D.treatmentCss('a-photo', 'cinematic') + D.treatmentCss('b-film', 'archival'); },
    symbols: ctx => { layout(ctx); const iw = inset.w, ih = iw * .62; return [
      plate('dc-photo', art.photo('coast-photo', VW, VH)), plate('dc-grade', art.grain(VW, VH, .16) + art.vignette(VW, VH, .6)),
      plate('dc-map', art.sea(VW, VH) + art.land(coastLine()) + art.compass(VW * .14, VH * .9, 46)),
      plate('dc-route', art.route(routePts())), sym('dc-port', '0 0 80 80', art.place(40, 40, {r: 12})),
      sym('dc-film', `0 0 ${f(iw)} ${f(ih)}`, `<rect width="${f(iw)}" height="${f(ih)}" fill="#111"/>` + art.footage('waves', iw, ih) +
        `<rect x="2" y="2" width="${f(iw - 4)}" height="${f(ih - 4)}" fill="none" stroke="#f3efe6" stroke-width="6"/>` + art.grain(iw, ih, .3)),
    ].join(''); },
    build(ctx) {
      const {P, plate: pl, motion} = ctx;
      const {key} = motion;
      const kit = D.motion(ctx), S = id => ctx.shot(id), cue = id => ctx.cue(id);
      const L = (id, xy, w, text, style, extra = {}) => P(id, null, ...xy, w, 5, {label: text, labelStyle: style, ...extra});
      const provY = ctx.presentation === 'full-bleed' ? ctx.safe.top / 100 + .07 : null;   // P018.6: top of the text-safe area in full-bleed
      const fbLow = v => provY ? Math.min(v, ctx.safe.captionTop / 100 - .09) : v;   // lower-thirds stay above the caption band
      const prov = id => L(id, land ? pc(500, VH * (provY ?? .9)) : pc(500, VH * (provY ?? .91)), provY ? 80 : 90, T.synthetic, 'provenance');
      const scenes = {};
      scenes['dc-coast'] = {objects: [P('a-photo', 'dc-photo', 50, 50, 100, 0, {docAsset: 'coast-photo'}), pl('a-grade', 'dc-grade', 1, 'exact'),
        L('a-lower', land ? pc(250, VH * fbLow(.78)) : pc(330, VH * fbLow(.8)), land ? 40 : 64, T.coast, 'lower-third'),
        prov('a-prov')]};
      kit.drift('a-photo', S('coast').start, S('coast').end, [0, 0, 1.06], [-.025, -.01, 1.14]);
      kit.lowerThird('a-lower', 'coast', S('coast').end - .7);
      kit.label('a-prov', S('coast').start + .1);
      scenes['dc-route'] = {objects: [pl('b-map', 'dc-map', 0, 'exact'), pl('b-route', 'dc-route', 2, 'exact'), P('b-port', 'dc-port', ...pc(...HARBOUR()), 8, 3),
        P('b-film', 'dc-film', ...pc(inset.x, inset.y), inset.w / VW * 100, 4, {docAsset: 'waves'}),
        L('b-tag', (([x, y]) => [x, provY ? Math.min(y, ctx.safe.captionTop - 9) : y])(pc(HARBOUR()[0] - 30, HARBOUR()[1] + 70)), land ? 14 : 24, T.harbour, 'lower-third', {accent: '#b3261e'}),
        prov('b-prov')]};
      kit.roll('b-film', 'boats', 'waves');
      kit.route('b-route', 'route', 1.0);
      kit.mark('b-port', 'harbour'); kit.lowerThird('b-tag', cue('harbour') + .25);
      kit.label('b-prov', S('route').start + .1);
      const cam = (id, startView, views) => { const keys = kit.planCamera(id, views), s = S(id); return [key(s.start, startView), ...keys.slice(keys[0][0] === s.start && keys.length > views.length ? 1 : 0)]; };
      const cameras = {coast: cam('coast', [0, 0, 1.0], [[0, 0, 1.03, 'smooth']]), route: cam('route', [.02, -.02, 1.06], [[0, .02, 1.04, 'smooth']])};
      return {scenes, cameras, checks: {keyframes: [['coast', cue('coast') + .7], ['dip', S('coast').end - .05], ['boats', cue('boats') + .6], ['harbour', cue('harbour') + .6]]}};
    },
  };
})();
