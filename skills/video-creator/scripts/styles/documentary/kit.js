// Documentary kit (browser script, loaded after the shared shot core by backend.mjs). Style implementation #8 (P017.7).
// Verified photographs and footage (from globalThis.docAssets, injected by the backend after manifest verification),
// archival and cinematic treatments, original illustrated maps with routes drawing on, Ken Burns drift, footage playback,
// lower thirds and provenance labels, and the `dip` transition (registered via globalThis.vcShotStyle).
// Rule enforced at render time: a scene showing any asset whose authenticity is not "authentic" (reconstruction,
// illustration, procedural) must also show a `provenance` label, so reconstructed imagery is never passed off as evidence.
(() => {
  const {f} = globalThis.techShotArt;
  const fail = m => { throw new Error('docKit: ' + m); };
  const num = (x, what) => (typeof x === 'number' && Number.isFinite(x)) ? x : fail(`${what} must be a number`);
  const asset = id => globalThis.docAssets?.[id] ?? fail(`asset ${JSON.stringify(id)} is not in the verified manifest (--options assets)`);

  // A verified photograph filling a w×h box (cover crop by default).
  const photo = (id, w, h, {fit = 'slice'} = {}) => { const a = asset(id); if (a.media !== 'image') fail(`${id} is not an image`);
    return `<image href="${a.uris[0]}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid ${fit}"/>`; };
  // Verified footage as a frame sequence: frame i is shown while round(--draw · (n − 1)) = i (no blending, exact frames).
  const footage = (id, w, h) => { const a = asset(id); if (a.media !== 'frames') fail(`${id} is not a frame sequence`);
    const n = a.uris.length;
    return a.uris.map((u, i) => `<image href="${u}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" style="opacity:clamp(0, calc(1 - (max(var(--draw, 0) * ${n - 1} - ${i}, ${i} - var(--draw, 0) * ${n - 1}) - .5) * 1000), 1)"/>`).join(''); };
  // Original illustrated map pieces.
  const sea = (w, h, color = '#c9d6d3') => `<rect width="${w}" height="${h}" fill="${color}"/>` +
    Array.from({length: 14}, (_, i) => `<path d="M0 ${f(h * (i + .5) / 14)}H${w}" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>`).join('');
  const land = (d, {fill = '#e9e1cf', edge = '#8a7d63'} = {}) => `<path d="${d}" fill="${fill}" stroke="${edge}" stroke-width="3"/>` +
    `<path d="${d}" fill="none" stroke="${edge}" stroke-opacity=".25" stroke-width="12" transform="translate(4 6)"/>`;
  const route = (pts, {color = '#b3261e', width = 7, dash = '22 14'} = {}) => {
    const d = 'M' + pts.map(p => p.map(f).join(' ')).join('L');
    return `<path d="${d}" fill="none" stroke="#00000033" stroke-width="${width + 6}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))"/>` +
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))"/>`;
  };
  const place = (x, y, {r = 14, color = '#b3261e'} = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.2)}" fill="none" stroke="${color}" stroke-width="3"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${color}"/>`;
  const compass = (x, y, s = 60) => `<g transform="translate(${f(x)} ${f(y)})" stroke="#5f563f" stroke-width="3" fill="none"><circle r="${s * .55}"/><path d="M0 ${-s}L${s * .18} 0L0 ${s}L${-s * .18} 0Z" fill="#5f563f"/></g>`;
  // Film grain and vignette over a w×h plate (grain filter #doc-grain is defined in the host page).
  const grain = (w, h, opacity = .22) => `<rect width="${w}" height="${h}" filter="url(#doc-grain)" opacity="${opacity}"/>`;
  const vignette = (w, h, strength = .55) => `<defs><radialGradient id="doc-vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${strength}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#doc-vig)"/>`;
  // Treatments for an object's art: archival (aged print), cinematic (graded), map (paper map).
  const TREAT = {archival: 'sepia(.62) contrast(1.12) brightness(.94) saturate(.8)', cinematic: 'contrast(1.08) saturate(1.06) brightness(.97)', map: 'saturate(.9)'};
  const treatmentCss = (id, kind) => `#${id} .piece-art { filter:${TREAT[kind] ?? fail(`unknown treatment ${kind}`)} }`;
  // Credit line text for an asset (attribution · licence), for provenance labels.
  const credit = id => { const m = asset(id).meta; return `${m.attribution} · ${m.license}`; };

  const LABEL_STYLES = ['lower-third', 'date', 'provenance', 'quote'];
  const css = `
    .piece-label { font:600 34px/1.5 Georgia, "Nirmala UI", serif; color:#f3efe6 }
    .label-lower-third .piece-label { padding:10px 26px 10px 22px; background:#0b0b0bc0; border-left:6px solid var(--label-accent, #c9a96a); text-align:left }
    .label-date .piece-label { font:600 30px/1.5 "Nirmala UI", "Segoe UI", sans-serif; color:#c9a96a; padding:2px 12px; border-top:2px solid #c9a96a; border-bottom:2px solid #c9a96a }
    .label-provenance .piece-label { font:500 22px/1.5 "Nirmala UI", "Segoe UI", sans-serif; color:#e8e2d4; padding:4px 14px; background:#000000a8; border-radius:4px; border:1px solid #ffffff40 }
    .label-quote .piece-label { font:italic 500 44px/1.5 Georgia, "Nirmala UI", serif; color:#f3efe6; white-space:normal; width:auto }
  `;

  // Provenance rule check for the scene that has just been built (called by the engine at every shot setup).
  const checkProvenance = () => {
    const present = new Set([...document.querySelectorAll('.story-stage .piece')].map(n => n.id));
    for (const scene of Object.values(globalThis.techScenes ?? {})) {
      const objs = scene.objects.filter(o => present.has(o.id));
      if (!objs.length) continue;
      const needs = objs.filter(o => o.docAsset && asset(o.docAsset).meta.authenticity !== 'authentic');
      if (needs.length && !objs.some(o => o.labelStyle === 'provenance'))
        fail(`[missing-provenance-label] scene shows ${needs.map(o => o.docAsset).join(', ')} (not authentic) without a provenance label`);
    }
  };
  // ---------- transition: dip — fade through black, the narrative pause of documentary editing ----------
  const setup = (stage) => {
    checkProvenance();
    const o = document.createElement('div'); o.className = 'doc-dip'; stage.append(o); return {dip: o};
  };
  const dip = ({tr, k, overlays}) => { const o = overlays?.dip; if (o) o.style.opacity = tr ? String(k.toFixed(3)) : '0'; };
  globalThis.vcShotStyle = {labelStyles: LABEL_STYLES, setup, transitions: {dip: {defaults: {lead: .5, tail: .5}, needsSymbol: false, render: dip}}};

  function motion(ctx) {
    const {key, N, track, show, showHide, stroke, reveal} = ctx.motion;
    const when = (at, id) => typeof at === 'string' ? ctx.motion.speechCue(at, id) : num(at, 'time');
    return {
      when,
      // Ken Burns: a slow, continuous move between two framings [dx, dy, scale] over [t0, t1] (seconds).
      drift: (id, t0, t1, from, to) => { track(id, [key(num(t0, 't0'), [from[0], from[1], 0, from[2], 1]), key(num(t1, 't1'), [to[0], to[1], 0, to[2], 1], 'linear')]); },
      // Fade an image up (documentary cuts are slow and soft).
      fadeIn: (id, at, dur = .6) => { const t = when(at, id); show(id, t, [0, 0, 0, 1.02, 0], dur); return t; },
      // Play footage frames at the asset's own rate from `at` (cue or seconds); holds the last frame afterwards.
      roll: (id, at, assetId, {fadeIn = .25} = {}) => {
        const a = asset(assetId), t = when(at, id), dur = a.uris.length / num(a.fps ?? 0, `${assetId} fps`);
        show(id, t, [0, 0, 0, 1, 0], fadeIn); stroke(id, [key(t, [0]), key(t + dur, [1], 'linear')]); return t;
      },
      // Draw a map route along its path.
      route: (id, at, dur = 1.2) => { const t = when(at, id); show(id, t, [0, 0, 0, 1, 0], .05); stroke(id, [key(t, [0]), key(t + dur, [1], 'smooth')]); return t; },
      // A place marker pops in.
      mark: (id, at, dur = .35) => { const t = when(at, id); track(id, [key(t, [0, 0, 0, 1.6, 0]), key(t + dur, N, 'out')]); return t; },
      // Lower third: slides in from the left edge with a reveal, holds, optionally leaves.
      lowerThird: (id, at, off) => { const t = when(at, id); off === undefined ? show(id, t, [-.03, 0, 0, 1, 0], .45) : showHide(id, t, [-.03, 0, 0, 1, 0], when(off), .3); reveal(id, t, t + .45, 'rightward'); return t; },
      label: (id, at, off) => { const t = when(at, id); off === undefined ? show(id, t, [0, 0, 0, 1, 0], .4) : showHide(id, t, [0, 0, 0, 1, 0], when(off), .3); return t; },
      planCamera: (shotId, views) => {
        const shot = ctx.plan?.shots.find(s => s.id === shotId) ?? fail(`planCamera: shot ${shotId} is not in the resolved plan (--plan)`);
        const moments = shot.camera ?? [];
        if (!Array.isArray(views) || views.length !== moments.length) fail(`planCamera: shot ${shotId} has ${moments.length} planned camera keys; give exactly one view for each`);
        const keys = moments.map((m, i) => key(m.seconds, views[i].slice(0, 3), views[i][3] ?? 'smooth'));
        return !keys.length || keys[0][0] > shot.start.seconds + 1e-9 ? [key(shot.start.seconds, keys[0]?.[1] ?? [0, 0, 1]), ...keys] : keys;
      },
    };
  }

  globalThis.docKit = {art: {photo, footage, sea, land, route, place, compass, grain, vignette}, asset, credit, treatmentCss, css, LABEL_STYLES, motion};
})();
