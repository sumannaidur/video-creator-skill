// E28 / P023.8 Documentary study (unseen topic, en-IN, full-bleed): "The first powered flight, 17 December 1903".
// One authentic public-domain photograph (John T. Daniels; Library of Congress ppprs.00626; Wikimedia Commons), verified
// through the asset manifest. Facts from the photo's catalogue description: 120 ft in 12 s at Kill Devil Hills; Orville at
// the controls lying prone on the lower wing; Wilbur ran alongside. No synthetic imagery is shown as part of the photo:
// annotation rings and leaders are graphic overlays, and the photo is credited on screen.
(() => {
  const {sym} = globalThis.techShotArt;
  const D = globalThis.docKit, A = D.art;
  const PW = 1920, PH = 1245, ASPECT = PW / PH, ORV = [1000, 596], WIL = [1745, 640], FLYER = [1065, 545];
  let VW = 1000, VH = 1778, G;

  globalThis.documentaryTopic = {
    shots: [{id: 'wide', scene: 'ff'}, {id: 'orville', scene: 'ff'}, {id: 'wilbur', scene: 'ff'}],
    get css() { return D.css + D.treatmentCss('o-photo', 'archival') + ' #o-pins .piece-art { filter:none }'; },
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: ctx => { VH = Math.round(1000 / ctx.aspect); G = {photoAspect: ASPECT, stageAspect: ctx.aspect, base: D.cover(ASPECT, ctx.aspect)};
      return [sym('ff-photo', `0 0 ${PW} ${PH}`, A.photo('first-flight', PW, PH)),
        sym('ff-pin-orv', `0 0 ${PW} ${PH}`, A.ring(...ORV, 62)), sym('ff-pin-wil', `0 0 ${PW} ${PH}`, A.ring(...WIL, 70)),
        sym('ff-grade', `0 0 ${VW} ${VH}`, A.vignette(VW, VH, .6) + A.grain(VW, VH, .16))].join(''); },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, N, track} = motion;
      const kit = D.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const u = ([x, y]) => [x / PW, y / PH];
      const v = {wide: D.focus(G, u(FLYER), 1.0), wide2: D.focus(G, u(FLYER), 1.08), orv: D.focus(G, u(ORV), 1.9), wil: D.focus(G, u(WIL), 1.6), back: D.focus(G, [.62, .5], 1.0)};
      const objs = [P('o-photo', 'ff-photo', 50, 50, 100, 0, {flat: true, docAsset: 'first-flight'}), P('o-pin-orv', 'ff-pin-orv', 50, 50, 100, 1, {flat: true}), P('o-pin-wil', 'ff-pin-wil', 50, 50, 100, 1, {flat: true}),
        plate('o-grade', 'ff-grade', 2, 'exact'),
        P('l-date', null, 50, ctx.safe.top + 4, 60, 5, {label: '17 December 1903', labelStyle: 'date'}),
        P('l-orv', null, 50, 58, 70, 5, {label: 'Orville Wright, at the controls', labelStyle: 'lower-third'}),
        P('l-wil', null, 50, 60, 50, 5, {label: 'Wilbur Wright', labelStyle: 'lower-third'}),
        P('l-cred', null, 50, ctx.safe.captionTop - 3, 84, 5, {label: 'Photo: ' + D.credit('first-flight'), labelStyle: 'provenance'})];
      const s1 = S('wide').start, s2 = S('orville').start, s3 = S('wilbur').start, end = S('wilbur').end;
      // camera on the photograph (the same keys drive the pinned annotation layer, so marks stay on the people)
      const keys = [key(s1, v.wide), key(s2 - .2, v.wide2, 'linear'), key(s2 + .9, v.orv, 'inOut'), key(s3 - .2, [v.orv[0], v.orv[1], 0, v.orv[3] * 1.03, 1], 'linear'),
        key(s3 + .9, v.wil, 'inOut'), key(end - 1.2, [v.wil[0], v.wil[1], 0, v.wil[3] * 1.03, 1], 'linear'), key(end, v.back, 'inOut')];
      track('o-photo', keys);
      const dt = motion.speechCue('december', 'l-date'); kit.label('l-date', dt, s2);
      kit.label('l-cred', s1 + .3);
      const ov = motion.speechCue('orville', 'l-orv'); kit.lowerThird('l-orv', ov + .1, s3 - .1);
      const wl = motion.speechCue('wilbur', 'l-wil'); kit.lowerThird('l-wil', wl + .1, end - .9);
      // pinned rings follow the photo exactly (sampled every frame from its keys) and appear only while their person is named
      const pin = (id, on, off) => { const M = globalThis.vcMotion, ks = [];
        for (let f = Math.ceil(s1 * 30); f / 30 <= end + 1e-9; f++) { const t = f / 30, v = [...M.sample(keys, t)];
          v[4] = Math.min(1, Math.max(0, (t - on) / .3)) * Math.min(1, Math.max(0, (off - t) / .3)); ks.push(key(t, v, 'hold')); }
        track(id, ks); };
      pin('o-pin-orv', ov, s3); pin('o-pin-wil', wl, end - .8);
      return {scenes: {ff: {objects: objs}}, cameras: {wide: [key(s1, [0, 0, 1]), key(S('wide').end, [0, 0, 1])], orville: [key(s2, [0, 0, 1]), key(S('orville').end, [0, 0, 1])], wilbur: [key(s3, [0, 0, 1]), key(end, [0, 0, 1])]},
        checks: {keyframes: [['wide', dt + .6], ['orville', ov + 1.0], ['wilbur', wl + 1.0]]}};
    },
  };
})();
