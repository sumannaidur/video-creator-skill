// Paper Explainer shot engine (browser script, loaded by host.html via backend.mjs).
// Packaged from experiments/E10/p013.1/paper-shots.js (P014.3A). Topic artwork and shot data live in topic modules.
// Language-neutral: caption/label font comes from the --vc-font CSS variable and the locale from options.
// Deterministic: every visual state is a pure function of the requested time in seconds.
(() => {
  // ---------- seeded art helpers (topic art may use these; they impose no visual template) ----------
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
  const sym = (id, viewBox, body) => `<symbol id="${id}" viewBox="${viewBox}">${body}</symbol>`;
  globalThis.paperShotArt = {f, rnd, mid, smooth, blob, sym};

  // ---------- motion primitives ----------
  const N = [0, 0, 0, 1, 1];
  // P022.2: shared/motion.js (when loaded) adds curves (inOut, outQuart, anticipate, overshoot, settle, hold); the four
  // original curves are defined first and never replaced, so legacy topics render identically.
  const ease = {...(globalThis.vcMotion?.ease ?? {}), linear: p => p, out: p => 1 - (1 - p) ** 3, in: p => p ** 3, smooth: p => p * p * (3 - 2 * p)};
  const clamp = v => Math.max(0, Math.min(1, v));
  const key = (t, v, curve = 'smooth') => [t, v, curve];
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
  const insets = {diag: k => [0, k, k, 0], 'diag-up': k => [k, k, 0, 0], leftward: k => [0, 0, 0, k], up: k => [k, 0, 0, 0],
    rightward: k => [0, k, 0, 0], down: k => [0, 0, k, 0]};
  const transitionTypes = {
    dissolve: {defaults: {lead: .12, tail: .2, zoom: .25}, needsSymbol: true},
    sheet: {defaults: {half: .24}, needsSymbol: false},
  };
  const MIN_SHOT = .3;
  const fail = message => { throw new Error('Paper shots: ' + message); };
  const isNum = x => typeof x === 'number' && Number.isFinite(x);
  const ID = /^[a-z][a-z0-9-]*$/;

  function phrasesOf(timeline) {
    const audio = timeline?.audio;
    if (!audio || !(audio.sample_rate > 0) || !(audio.sample_count > 0)) fail('timeline audio sample_rate/sample_count required');
    if (!Array.isArray(timeline.records)) fail('timeline records required');
    const rate = audio.sample_rate, duration = audio.sample_count / rate;
    const phrases = timeline.records.filter(r => r.kind === 'phrase').sort((a, b) => a.start - b.start)
      .map(r => ({start: r.start / rate, end: r.end / rate, text: r.label}));
    if (!phrases.length) fail('timeline has no phrase records');
    phrases.forEach((p, i) => {
      if (!(p.start < p.end) || p.start < 0 || p.end > duration + 1e-9 || typeof p.text !== 'string' || !p.text.trim()) fail(`invalid phrase ${i}`);
      if (i && p.start < phrases[i - 1].end) fail(`phrases ${i - 1} and ${i} overlap`);
    });
    return {duration, phrases};
  }

  // Shot boundaries: explicit `start` (seconds, {phrase, offset} or {phraseEnd, offset}), or the default
  // midpoint of the pause between the previous shot's last phrase and this shot's first phrase.
  function resolveShots(specs, phrases, duration) {
    if (!Array.isArray(specs) || !specs.length) fail('topic.shots must be a non-empty array');
    const at = (s, where) => {
      if (isNum(s)) return s;
      const i = s?.phrase ?? s?.phraseEnd;
      if (!Number.isInteger(i) || !phrases[i]) fail(`${where}: start phrase index out of range`);
      const offset = s.offset ?? 0;
      if (!isNum(offset)) fail(`${where}: start offset must be a number`);
      return (s.phrase !== undefined ? phrases[i].start : phrases[i].end) + offset;
    };
    const seen = new Set();
    const shots = specs.map((spec, k) => {
      const where = `shot ${k}${spec?.id ? ` (${spec.id})` : ''}`;
      if (!ID.test(spec?.id ?? '') || seen.has(spec.id)) fail(`${where}: unique lowercase id required`);
      seen.add(spec.id);
      if (typeof spec.scene !== 'string' || !spec.scene) fail(`${where}: scene required`);
      let range = null;
      if (spec.phrases !== undefined) {
        const [a, b = a] = Array.isArray(spec.phrases) ? spec.phrases : [spec.phrases];
        if (![a, b].every(Number.isInteger) || a < 0 || b < a || b >= phrases.length) fail(`${where}: phrases out of range`);
        range = [a, b];
      }
      return {...spec, range, where};
    });
    shots.forEach((shot, k) => {
      if (k === 0) {
        shot.start = shot.start === undefined ? 0 : at(shot.start, shot.where);
        if (Math.abs(shot.start) > 1e-9) fail(`${shot.where}: first shot must start at 0`);
        shot.start = 0;
        return;
      }
      const prev = shots[k - 1];
      if (prev.range && shot.range && shot.range[0] < prev.range[0]) fail(`${shot.where}: phrases go backwards`);
      if (shot.start !== undefined) { shot.start = at(shot.start, shot.where); return; }
      if (!prev.range || !shot.range) fail(`${shot.where}: needs an explicit start or phrase ranges on both sides`);
      if (shot.range[0] <= prev.range[1]) fail(`${shot.where}: shares a phrase with the previous shot; give an explicit start`);
      shot.start = (phrases[prev.range[1]].end + phrases[shot.range[0]].start) / 2;
    });
    shots.forEach((shot, k) => {
      shot.end = k + 1 < shots.length ? shots[k + 1].start : duration;
      if (!isNum(shot.start) || shot.start < 0 || shot.end > duration + 1e-9) fail(`${shot.where}: boundary outside the narration`);
      if (shot.end - shot.start < MIN_SHOT) fail(`${shot.where}: shorter than ${MIN_SHOT} s or boundaries not increasing`);
    });
    // Transitions belong to the outgoing shot and straddle its end boundary.
    let lastEnd = 0;
    shots.forEach((shot, k) => {
      const spec = shot.transition;
      if (!spec) return;
      if (k === shots.length - 1) fail(`${shot.where}: last shot cannot have a transition`);
      const type = transitionTypes[spec.type] ?? fail(`${shot.where}: unknown transition type ${spec.type}`);
      const t = {...type.defaults, ...spec};
      if (type.needsSymbol && !t.symbol) fail(`${shot.where}: ${spec.type} transition needs a symbol`);
      const before = t.lead ?? t.half, after = t.tail ?? t.half;
      if (![before, after].every(x => isNum(x) && x > 0)) fail(`${shot.where}: transition timing must be positive`);
      const from = shot.end - before, to = shot.end + after;
      if (from < Math.max(shot.start, lastEnd) || to > shots[k + 1].end) fail(`${shot.where}: transition window does not fit its shots`);
      lastEnd = to;
      shot.transition = {...t, at: shot.end, from, to};
    });
    return shots.map(({where, ...shot}) => shot);
  }

  // With a resolved creative plan (video-creator.render-plan v1), shot boundaries and speech cues come from the plan:
  // topic.shots lists the same shot ids in order with their scene/transition only, and cue times are looked up by id.
  function planShots(specs, plan, duration) {
    if (Math.abs(plan.duration - duration) > 1e-9) fail('[stale-plan] plan duration differs from the timeline');
    const ids = (specs ?? []).map(s => s?.id), planned = plan.shots.map(s => s.id);
    if (JSON.stringify(ids) !== JSON.stringify(planned)) fail(`[conflicting-shot-boundaries] topic.shots ${JSON.stringify(ids)} must list the plan's shots ${JSON.stringify(planned)} in order`);
    return specs.map((spec, i) => {
      if (spec.start !== undefined || spec.phrases !== undefined) fail(`[conflicting-shot-boundaries] shot ${spec.id}: boundaries come from the resolved plan; remove start/phrases`);
      return {...spec, start: plan.shots[i].start.seconds};
    });
  }

  function installPaperShots({timeline, topic, locale, font, plan, captions: captionContract, presentation: preferred = null}) {
    if (!topic || typeof topic.build !== 'function') fail('topic.build(ctx) required');
    if (font) document.documentElement.style.setProperty('--vc-font', font);
    const {duration, phrases} = phrasesOf(timeline);
    const shots = resolveShots(plan ? planShots(topic.shots, plan, duration) : topic.shots, phrases, duration);
    const planCuesUsed = new Set();
    const speech = id => {
      const c = plan?.cues?.[id];
      if (!c) fail(plan ? `[unknown-cue] ${JSON.stringify(id)} is not a cue in the resolved plan` : `[unknown-cue] ${JSON.stringify(id)}: no resolved plan was given (--plan)`);
      planCuesUsed.add(id); return c;
    };
    // Captions: the caption artifact contract when given (possibly hidden), else the legacy phrase captions.
    const captions = captionContract ? captionContract.cues.map((c, i) => ({id: i + 1, cue: c.id, start: c.start, end: c.end, text: c.text, ...(c.words ? {words: c.words} : {})}))
      : phrases.map((p, i) => ({id: i + 1, start: p.start, end: i + 1 < phrases.length ? phrases[i + 1].start : duration, text: p.text}));
    if (captionContract) {
      for (const c of captions) if (!(isNum(c.start) && isNum(c.end) && c.start < c.end && c.end <= duration + 1e-9)) fail(`caption ${c.cue}: invalid time range`);
      document.documentElement.dataset.captions = captionContract.visible ? 'artifact' : 'off';
      if (captionContract.max_lines) document.documentElement.style.setProperty('--caption-max-lines', String(captionContract.max_lines));
      if (captionContract.locale) document.querySelector('footer').lang = captionContract.locale;
    }
    // Optional premium presentation (P018.2, shared/presentation.js): null unless the topic opts in; the framed layout is untouched.
    const pres = globalThis.vcPresentation?.install({topic, captions, shots, duration, locale, preferred}) ?? null;

    const tracks = {}, reveals = {}, ambient = {}, cues = [];
    const P = (id, art, x, y, width, layer, extra = {}) => ({id, art, position: {x, y, width}, layer, label: extra.label ?? null, ...extra});
    const plate = (id, art, layer, mode = 'cover') => P(id, art, 50, 50, 100, layer, {plate: mode});
    const motion = {
      key, N,
      track: (id, keys) => { tracks[id] = keys; },
      show: (id, at, from, dur = .4) => { tracks[id] = [key(at, from), key(at + dur, N, 'out')]; },
      showHide: (id, at, from, off, dur = .3) => { tracks[id] = [key(at, from), key(at + dur, N, 'out'), key(off, N), key(off + .12, [0, 0, 0, .96, 0])]; },
      reveal: (id, start, end, dir, from = 0, to = 1) => { reveals[id] = [start, end, dir, from, to]; },
      ambient: (id, spec) => { ambient[id] = spec; },
      cue: (id, phrase, offset) => {
        if (!phrases[phrase]) fail(`cue ${id}: phrase index out of range`);
        const at = phrases[phrase].start + offset; cues.push({id, phrase: phrase + 1, at}); return at;
      },
      // Resolved speech cue: returns its time in seconds and registers a visibility check on the object
      // (the plan's object id unless the topic names its own). Offsets are the topic's own animation lead/lag.
      speechCue: (cueId, objectId) => { const c = speech(cueId); cues.push({id: objectId ?? c.object, cue: cueId, at: c.seconds}); return c.seconds; },
      // A symbol that appears, drifts by (dx, dy) stage fractions, grows slightly and fades.
      emit: (id, art, [x, y], width, layer, dx, dy, start, dur, scale) => {
        tracks[id] = [key(start, [0, 0, -10, scale * .45, 0]), key(start + dur * .25, [dx * .25, dy * .25, 0, scale * .85, 1], 'out'),
          key(start + dur * .7, [dx * .7, dy * .7, 8, scale, .7]), key(start + dur, [dx, dy, 14, scale * 1.15, 0])];
        return P(id, art, x, y, width, layer, {flat: true});
      },
    };
    const byId = Object.fromEntries(shots.map(s => [s.id, {id: s.id, start: s.start, end: s.end, phrases: s.range}]));
    const ctx = {phrases, duration, shots: shots.map(s => byId[s.id]), shot: id => byId[id] ?? fail(`unknown shot ${id}`),
      plan: plan ? {shots: plan.shots, cues: plan.cues} : null, cue: id => speech(id).seconds,
      art: globalThis.paperShotArt, motion, P, plate};
    // P018.6: presentation facts for topic layout. Framed: the whole stage is text-safe (layouts are unchanged).
    ctx.presentation = pres ? 'full-bleed' : 'framed';
    ctx.safe = pres ? pres.safe() : {left: 0, top: 0, right: 100, bottom: 100, captionTop: 100};

    const defs = document.querySelector('body > svg');
    if (topic.symbols) defs.insertAdjacentHTML('beforeend', topic.symbols(ctx));
    const style = document.createElement('style');
    style.textContent = ENGINE_CSS + (topic.css ?? '');
    document.head.append(style);
    const built = topic.build(ctx) ?? fail('topic.build returned nothing');

    // ---------- validation of topic output ----------
    const scenes = built.scenes ?? fail('build must return scenes');
    const objectIds = new Set();
    for (const [id, scene] of Object.entries(scenes)) {
      if (!Array.isArray(scene.objects)) fail(`scene ${id}: objects required`);
      for (const o of scene.objects) {
        if (o.art && document.getElementById(o.art)?.localName !== 'symbol') fail(`scene ${id}: missing symbol ${o.art}`);
        if (o.plate && !['cover', 'exact'].includes(o.plate)) fail(`scene ${id}: plate mode must be cover or exact`);
        if (!Number.isInteger(o.layer) || o.layer < 0 || o.layer >= parallax.length) fail(`scene ${id}: object ${o.id} layer must be 0–5`);
        if (o.labelStyle !== undefined && !globalThis.paperKit?.LABEL_STYLES.includes(o.labelStyle)) fail(`scene ${id}: object ${o.id} labelStyle must be one of ${globalThis.paperKit?.LABEL_STYLES}`);
        objectIds.add(o.id);
      }
      globalThis.paperScenes[id] = {locale: locale || 'und', topic: '', beat: '', heading: '', narrationCaption: '', relationships: [], cues: [], ...scene};
    }
    for (const shot of shots) {
      if (!scenes[shot.scene]) fail(`shot ${shot.id}: unknown scene ${shot.scene}`);
      if (shot.transition?.symbol && document.getElementById(shot.transition.symbol)?.localName !== 'symbol') fail(`shot ${shot.id}: missing transition symbol ${shot.transition.symbol}`);
      const camera = built.cameras?.[shot.id] ?? [key(shot.start, [0, 0, 1])];
      if (!camera.length || camera.some((k, i) => !isNum(k[0]) || k[1]?.length !== 3 || !k[1].every(isNum) || !ease[k[2]] || (i && k[0] < camera[i - 1][0])))
        fail(`shot ${shot.id}: camera keys must be [t,[cx,cy,zoom],ease] in time order`);
      shot.camera = camera;
    }
    for (const [kind, map] of [['track', tracks], ['reveal', reveals], ['ambient', ambient]])
      for (const id of Object.keys(map)) if (!objectIds.has(id)) fail(`${kind} for unknown object ${id}`);
    for (const [id, keys] of Object.entries(tracks))
      if (keys.some((k, i) => !isNum(k[0]) || k[1]?.length !== 5 || !ease[k[2]] || (i && k[0] < keys[i - 1][0]))) fail(`track ${id}: keys must be [t,[x,y,rot,scale,opacity],ease] in time order`);
    for (const [id, r] of Object.entries(reveals)) if (!insets[r[2]] || !(r[1] > r[0])) fail(`reveal ${id}: bad direction or range`);
    for (const c of cues) if (!objectIds.has(c.id)) fail(`cue for unknown object ${c.id}`);

    const firstCue = cues.length ? Math.min(...cues.map(c => c.at)) + .6 : duration / 2;
    const checks = {
      keyframes: built.checks?.keyframes ?? [
        ...shots.map(s => [s.id, (s.start + s.end) / 2]),
        ...shots.filter(s => s.transition).map(s => [s.id + '-transition', s.transition.at]),
        ['end', duration]].sort((a, b) => a[1] - b[1]),
      repeatAt: built.checks?.repeatAt ?? Math.min(firstCue, duration),
      absentAfter: built.checks?.absentAfter ?? [],
    };

    // ---------- evaluation ----------
    const stage = document.querySelector('.story-stage');
    const caption = document.querySelector('footer');
    let active = -1, camera, overlayDissolve, overlayPaper, W, H;

    function setup(index) {
      const shot = shots[index];
      globalThis.renderPaperScene(shot.scene);
      camera = document.createElement('div');
      camera.className = 'shot-camera';
      camera.append(...stage.childNodes);
      overlayDissolve = document.createElement('div');
      overlayDissolve.className = 'shot-overlay';
      overlayDissolve.innerHTML = '<svg viewBox="0 0 1000 1600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><use/></svg>';
      overlayPaper = document.createElement('div');
      overlayPaper.className = 'shot-paper';
      overlayPaper.innerHTML = '<svg viewBox="0 0 1000 1600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><use/></svg>';
      const grain = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      grain.setAttribute('class', 'shot-grain');
      grain.innerHTML = '<rect width="100%" height="100%" filter="url(#fibers)"/>';
      const vignette = document.createElement('div');
      vignette.className = 'shot-vignette';
      stage.append(camera, vignette, grain, overlayDissolve, overlayPaper);
      for (const object of globalThis.paperScenes[shot.scene].objects) {
        const node = document.getElementById(object.id);
        if (object.plate) {
          node.classList.add('plate', 'flat', object.plate);
          node.querySelector('svg').setAttribute('preserveAspectRatio', 'xMidYMid slice');
        }
        if (object.flat) node.classList.add('flat');
        if (object.labelStyle) { // label treatments from kit.js (opt-in; CSS comes from paperKit.css)
          node.classList.add('label-' + object.labelStyle);
          if (object.accent) node.style.setProperty('--label-accent', object.accent);
        }
        if (object.origin) node.style.transformOrigin = object.origin;
      }
      if (shot.accent) caption.style.borderLeftColor = shot.accent;
      pres?.setup(shot);
      W = stage.offsetWidth; H = stage.offsetHeight;
      active = index;
    }
    const setSymbol = (overlay, symbol) => {
      const use = overlay.querySelector('use'), href = symbol ? '#' + symbol : '';
      if (use.getAttribute('href') !== href) symbol ? use.setAttribute('href', href) : use.removeAttribute('href');
    };

    function renderAt(seconds) {
      if (!isNum(seconds)) throw new TypeError('Explicit seconds required');
      const t = Math.max(0, Math.min(duration, seconds));
      let index = shots.findLastIndex(s => s.start <= t);
      if (index < 0) index = 0;
      if (index !== active || stage.offsetWidth !== W || stage.offsetHeight !== H) setup(index);
      const shot = shots[index];
      const [cx, cy, zoom] = interp(shot.camera, t);
      camera.style.transform = `scale(${zoom}) translate(${-cx * W}px,${-cy * H}px)`;
      for (const object of globalThis.paperScenes[shot.scene].objects) {
        const v = [...(tracks[object.id] ? interp(tracks[object.id], t) : N)];
        v[4] = Math.min(1, Math.max(0, v[4]));   // P022.2: overshoot/settle curves act on every channel; opacity stays in [0, 1] (CSS clamps it anyway)
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
          const [start, end, dir, from, to] = r;
          const k = 100 * (1 - (from + (to - from) * ease.smooth(clamp((t - start) / (end - start)))));
          node.style.clipPath = `inset(${insets[dir](k).map(x => x + '%').join(' ')})`;
        }
      }
      // Transitions straddle a boundary; the outgoing shot owns them. Windows never overlap (validated).
      const tr = shots.find(s => s.transition && t >= s.transition.from && t < s.transition.to)?.transition
        ?? shots.find(s => s.transition && Math.abs(t - s.transition.at) < s.transition.half)?.transition;
      let dissolve = 0, sheet = null;
      if (tr?.type === 'dissolve') dissolve = t < tr.at ? clamp((t - tr.from) / tr.lead) : 1 - clamp((t - tr.at) / tr.tail);
      if (tr?.type === 'sheet') sheet = (t - tr.at) / tr.half;
      if (tr?.type === 'dissolve') setSymbol(overlayDissolve, tr.symbol);
      overlayDissolve.style.opacity = String(ease.smooth(dissolve));
      overlayDissolve.style.transform = `scale(${1 + (tr?.zoom ?? .25) - (tr?.zoom ?? .25) * ease.smooth(dissolve)})`;
      if (tr?.type === 'sheet') setSymbol(overlayPaper, tr.symbol);
      overlayPaper.style.visibility = sheet === null ? 'hidden' : 'visible';
      overlayPaper.style.transform = `translateY(${sheet === null ? 120 : -sheet * 112}%)`;
      const current = captions.find(c => t >= c.start && t < c.end) ?? (t >= duration ? captions.at(-1) : null);
      const enter = current ? ease.out(clamp((t - current.start) / .18)) : 0;
      const presState = pres ? pres.render(t, current) : null;
      if (pres) { /* full-bleed captions and hook are drawn by the presentation module */ }
      else if (captionContract) { // whole words never break: each whitespace-separated token is one unbreakable span (compounds like अलग-अलग stay intact)
        const want = String(current?.id ?? '');
        if (caption.dataset.cid !== want) {
          caption.dataset.cid = want;
          // One inline container: the caption card is a grid, so loose spans would each become a grid row.
          const line = document.createElement('span'); line.className = 'ct';
          caption.replaceChildren(line);
          line.replaceChildren(...(current?.text ?? '').split(/(\s+)/).filter(Boolean).map(tok => {
            if (/^\s+$/.test(tok)) return document.createTextNode(' ');
            const span = document.createElement('span'); span.className = 'cw'; span.textContent = tok; return span;
          }));
        }
      } else if (caption.textContent !== (current?.text ?? '')) caption.textContent = current?.text ?? '';
      if (!pres) {
        caption.style.opacity = String(current ? (current.id === 1 ? enter : Math.max(.35, enter)) : 0);
        caption.style.transform = `scale(${.97 + .03 * enter})`;
      }
      return {t, shot: shot.id, captionId: current?.id ?? null, camera: [cx, cy, zoom],
        transition: dissolve > 0 ? 'dissolve' : sheet !== null ? 'sheet' : null, ...(presState ?? {})};
    }
    const summary = shots.map(s => ({id: s.id, scene: s.scene, start: s.start, end: s.end, phrases: s.range, cameraTimes: s.camera.map(k => k[0]),
      transition: s.transition ? {type: s.transition.type, at: s.transition.at, from: s.transition.from, to: s.transition.to} : null}));
    globalThis.paperShots = {duration, shots: summary, captions, cues, checks, renderAt};
    renderAt(0);
    return {duration, shots: summary, captions, cues, checks, phrases, ...(plan ? {planCuesUsed: [...planCuesUsed]} : {}), ...(pres ? {presentation: pres.summary} : {})};
  }

  const ENGINE_CSS = `
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
    footer .cw { white-space:nowrap }
    .shot-overlay { position:absolute; inset:0; pointer-events:none; z-index:30 }
    .shot-overlay svg { width:100%; height:100%; display:block }
    .shot-paper { position:absolute; inset:-60px 0; background:var(--paper); z-index:31; pointer-events:none; overflow:hidden;
      box-shadow:0 -10px 26px #252a3026, 0 10px 26px #252a3026; border-radius:46% 54% 50% 50% / 26px 30px 28px 22px }
    .shot-paper svg { width:100%; height:100%; display:block }
    .shot-grain { position:absolute; inset:0; width:100%; height:100%; opacity:.16; mix-blend-mode:multiply; pointer-events:none; z-index:40 }
    .shot-vignette { position:absolute; inset:0; pointer-events:none; z-index:39; box-shadow:inset 0 0 110px #3b2c1730; border-radius:inherit }
    .piece-label { font:700 40px/1.45 var(--vc-font); background:#fff9ee; border-radius:12px 9px 14px 8px;
      padding:4px 18px; box-shadow:0 5px 0 -2px #252a3024, 0 10px 18px #252a301c; white-space:nowrap }
    .piece--annotation .piece-label { border:0; font-size:40px; font-weight:700; padding:4px 18px; background:#fff9ee }
    footer.story-caption { align-self:end; width:100%; max-width:none; min-height:176px; margin:0; display:grid; place-items:center;
      padding:20px 34px; border-radius:24px 20px 26px 18px; background:#fff9ee; color:var(--ink);
      border-left:12px solid var(--forest); font:600 42px/1.5 var(--vc-font); text-align:center; text-wrap:balance;
      box-shadow:0 9px 0 -3px #252a301f, 0 18px 34px #252a3020 }
  `;
  globalThis.installPaperShots = installPaperShots;
  globalThis.resolvePaperShots = (timeline, specs) => { const {duration, phrases} = phrasesOf(timeline); return resolveShots(specs, phrases, duration); };
})();
