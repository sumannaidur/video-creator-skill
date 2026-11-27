// "The Apollo 11 Moon landing, 1969" (en-IN, Documentary, full-bleed). Four authentic public-domain NASA photographs from the
// verified asset manifest (assets/assets.json), shown unaltered except crop, grade and grain. Annotations (ring, rules,
// lower thirds) are graphic overlays. Every photo is credited on screen while visible. Dates shown: only the sourced
// launch (16 July) and splashdown (24 July). The landing call is shown as a quotation without a speaker name (the source
// does not attribute it).
(() => {
  const {sym} = globalThis.techShotArt;
  const D = globalThis.docKit, A = D.art;
  const PH = {launch: [1280, 1600], eagle: [2480, 2229], aldrin: [1920, 1932], bootprint: [1280, 1291]};
  const REFLECT = [983, 162];                                                    // Armstrong reflected in Aldrin's visor (photo px)
  let VW = 1000, VH = 1778, G = {};

  globalThis.documentaryTopic = {
    shots: [{id: 'launch', scene: 'ap-launch', transition: {type: 'dip'}}, {id: 'eagle', scene: 'ap-eagle', transition: {type: 'dip'}},
      {id: 'visor', scene: 'ap-visor', transition: {type: 'dip'}}, {id: 'boot', scene: 'ap-boot'}],
    get css() { return D.css + ['o-launch', 'o-eagle', 'o-aldrin', 'o-boot'].map(id => D.treatmentCss(id, 'cinematic')).join(' ') + ' #o-ring .piece-art { filter:none }'; },
    presentation: {mode: 'full-bleed', captions: {position: 'lower', emphasis: 'word'}},
    symbols: ctx => {
      VH = Math.round(1000 / ctx.aspect);
      for (const [id, [w, h]] of Object.entries(PH)) G[id] = {photoAspect: w / h, stageAspect: ctx.aspect, base: D.cover(w / h, ctx.aspect)};
      return [...Object.entries(PH).map(([id, [w, h]]) => sym(`ap-${id}`, `0 0 ${w} ${h}`, A.photo(id, w, h))),
        sym('ap-ring', `0 0 ${PH.aldrin[0]} ${PH.aldrin[1]}`, A.ring(...REFLECT, 34, {color: '#ffd27a', width: 3})),
        sym('ap-grade', `0 0 ${VW} ${VH}`, A.vignette(VW, VH, .55) + A.grain(VW, VH, .12))].join('');
    },
    build(ctx) {
      const {P, plate, motion} = ctx;
      const {key, track} = motion;
      const kit = D.motion(ctx), S = ctx.shot, cue = ctx.cue;
      const F = (id, uv, s) => D.focus(G[id], uv, s);
      const photo = (oid, id) => P(oid, `ap-${id}`, 50, 50, 100, 0, {flat: true, docAsset: id});
      const cred = (sid, id) => P(`l-cred-${sid}`, null, 50, ctx.safe.captionTop - 3, 84, 5, {label: 'Photo: ' + D.credit(id), labelStyle: 'provenance'});
      const grade = sid => plate(`o-grade-${sid}`, 'ap-grade', 2, 'exact');
      const top = ctx.safe.top;
      const scenes = {
        'ap-launch': {objects: [photo('o-launch', 'launch'), grade('launch'), cred('launch', 'launch'),
          P('l-date', null, 50, top + 4, 60, 5, {label: '16 July 1969', labelStyle: 'date'})]},
        'ap-eagle': {objects: [photo('o-eagle', 'eagle'), grade('eagle'), cred('eagle', 'eagle'),
          P('l-eagle', null, 50, 64, 80, 5, {label: 'Lunar Module Eagle, seen from Columbia', labelStyle: 'lower-third'}),
          P('l-quote', null, 50, top + 8, 84, 5, {label: '“Houston, Tranquility Base here. The Eagle has landed.”', labelStyle: 'quote'})]},
        'ap-visor': {objects: [photo('o-aldrin', 'aldrin'), P('o-ring', 'ap-ring', 50, 50, 100, 1, {flat: true}), grade('visor'), cred('visor', 'aldrin'),
          P('l-aldrin', null, 50, 64, 80, 5, {label: 'Buzz Aldrin, photographed by Neil Armstrong', labelStyle: 'lower-third'})]},
        'ap-boot': {objects: [photo('o-boot', 'bootprint'), grade('boot'), cred('boot', 'bootprint'),
          P('l-boot', null, 50, 60, 70, 5, {label: 'Aldrin’s bootprint · soil study', labelStyle: 'lower-third'}),
          P('l-home', null, 50, top + 4, 70, 5, {label: 'Splashdown · 24 July 1969', labelStyle: 'date'})]}};
      const [sl, se, sv, sb] = ['launch', 'eagle', 'visor', 'boot'].map(S), end = sb.end;
      // launch: slow push up the Saturn V from the pad
      track('o-launch', [key(sl.start, F('launch', [.47, .62], 1.0)), key(sl.end + .5, F('launch', [.47, .42], 1.14), 'linear')]);
      kit.label('l-date', 'date', sl.end - .2); kit.label('l-cred-launch', sl.start + .3);
      // eagle: alone against black, a slow push; the landing call arrives as a quotation
      track('o-eagle', [key(se.start - .5, F('eagle', [.52, .5], 1.0)), key(se.end + .5, F('eagle', [.52, .48], 1.18), 'linear')]);
      kit.lowerThird('l-eagle', 'eagle', cue('quote') - .3); kit.label('l-quote', 'quote', se.end - .3); kit.label('l-cred-eagle', se.start + .3);
      // visor: full figure, then the camera pushes into the visor on "visor" to find the photographer reflected
      const vk = [key(sv.start - .5, F('aldrin', [.53, .42], 1.0)), key(cue('visor') - 1.6, F('aldrin', [.53, .38], 1.06), 'linear'),
        key(cue('visor') - .4, F('aldrin', [REFLECT[0] / 1920, REFLECT[1] / 1932], 2.8), 'inOut'), key(sv.end + .5, F('aldrin', [REFLECT[0] / 1920, REFLECT[1] / 1932], 2.95), 'linear')];
      track('o-aldrin', vk);
      kit.lowerThird('l-aldrin', 'aldrin', cue('visor') - 1.7); kit.label('l-cred-visor', sv.start + .3);
      const on = motion.speechCue('visor', 'o-ring'), M = globalThis.vcMotion, rk = [];      // ring pinned to the photo, sampled per frame
      for (let f = Math.ceil((sv.start - .5) * 30); f / 30 <= sv.end + .5 + 1e-9; f++) { const t = f / 30, v = [...M.sample(vk, t)];
        v[4] = Math.min(1, Math.max(0, (t - on) / .3)); rk.push(key(t, v, 'hold')); }
      track('o-ring', rk);
      // boot: start close on the print, ease back to show the soil around it
      track('o-boot', [key(sb.start - .5, F('bootprint', [.55, .64], 1.35)), key(end, F('bootprint', [.52, .55], 1.08), 'inOut')]);
      kit.lowerThird('l-boot', 'boot', cue('home') - .5); kit.label('l-home', 'home'); kit.label('l-cred-boot', sb.start + .3);
      const still = s => [key(s.start, [0, 0, 1]), key(s.end, [0, 0, 1])];
      return {scenes, cameras: {launch: still(sl), eagle: still(se), visor: still(sv), boot: still(sb)},
        checks: {keyframes: [['eagle-quote', cue('quote') + 1.4], ['visor', on + .5], ['bootprint', cue('boot') + 1.0]]}};
    },
  };
})();
