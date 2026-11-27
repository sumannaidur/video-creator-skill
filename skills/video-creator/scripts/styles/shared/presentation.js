// Shared opt-in presentation modes for the shot engines (P018.2). Browser script, evaluated before a shot engine.
//
// A topic opts in with `topic.presentation`; without it (or with mode 'framed') nothing here runs and the style's
// original framed stage and caption panel render exactly as before.
//
//   presentation: {
//     mode: 'full-bleed',                       // artwork fills the whole frame; no framed stage, no caption panel
//     captions: {position: 'lower' | 'middle' | 'upper', emphasis: 'word' | 'none'},   // defaults: lower, word
//     hook: {text, highlight, until},           // optional opening headline written by the agent (not narration)
//   }
//   topic.shots[i].captionPosition overrides the caption position for one shot (keep the hero clear).
//
// Captions keep the caption contract's text and timing: cue text is never rewritten; whole whitespace-separated words
// never break (compounds stay intact); active-word emphasis uses only measured word times carried by the contract
// (`cue.words`); a cue without them is shown without emphasis. Emphasis may change colour, background and shadow only,
// never metrics, so a cue's layout is identical in every frame (checked by preflight). Typography, colours and
// positions belong to each style's stylesheet (html[data-presentation="full-bleed"] rules); this file sets geometry only.
// Deterministic: every visual state is a pure function of the requested time.
(() => {
  const MODES = ['framed', 'full-bleed'], POSITIONS = ['lower', 'middle', 'upper'], EMPHASIS = ['word', 'none'];
  const HOOK_OUT = .35, CAPTION_IN = .14;
  const fail = message => { throw new Error('Presentation: ' + message); };
  const isNum = x => typeof x === 'number' && Number.isFinite(x);
  const clamp = v => Math.max(0, Math.min(1, v));
  const smooth = p => p * p * (3 - 2 * p);
  const BOUNDARY = /[\s.,;:!?।॥"'“”‘’()\[\]{}\-–—]/u;

  // Whitespace-separated tokens with their character offsets (the caption contract's text is split, never changed).
  const tokens = text => { const out = []; let i = 0; for (const part of text.split(/(\s+)/)) { if (part) out.push({text: part, from: i, to: i + part.length, space: /^\s+$/.test(part)}); i += part.length; } return out; };

  const BASE_CSS = `
    html[data-presentation="full-bleed"], html[data-presentation="full-bleed"] body { overflow:hidden }
    html[data-presentation="full-bleed"] .story-frame { padding:0; min-height:0; height:100vh; box-sizing:border-box; position:relative }
    html[data-presentation="full-bleed"] .story-safe { position:absolute; inset:0; height:auto; min-height:0; display:block; gap:0 }
    html[data-presentation="full-bleed"] .story-body { position:absolute; inset:0; height:auto; min-height:0; display:block }
    html[data-presentation="full-bleed"] .story-stage { position:absolute; inset:0; width:auto; height:auto; min-height:0; max-height:none;
      border-radius:0; box-shadow:none; margin:0 }
    html[data-presentation="full-bleed"] .vc-safe { position:absolute; visibility:hidden; pointer-events:none;
      top:var(--safe-top); bottom:var(--safe-bottom); left:var(--safe-x); right:var(--safe-x) }
    html[data-presentation="full-bleed"] footer.story-caption { position:absolute; z-index:60; margin:0; min-height:0; max-width:none; width:auto;
      left:calc(var(--safe-x) + var(--cap-inset)); right:calc(var(--safe-x) + var(--cap-inset));
      height:calc(var(--caption-max-lines, 2) * var(--cap-lh) * var(--cap-size) + 2 * var(--cap-pad-y));
      padding:0; border:0; border-radius:0; background:none; box-shadow:none; overflow:visible; transform:none;
      display:grid; justify-items:center; align-items:end; text-align:center; text-wrap:balance;
      font-size:var(--cap-size); line-height:var(--cap-lh) }
    html[data-presentation="full-bleed"] footer.story-caption::before, html[data-presentation="full-bleed"] footer.story-caption::after { display:none }
    html[data-presentation="full-bleed"] footer.story-caption[data-position="lower"] { top:auto; bottom:calc(var(--safe-bottom) + var(--cap-lower)) }
    html[data-presentation="full-bleed"] footer.story-caption[data-position="upper"] { bottom:auto; top:calc(var(--safe-top) + var(--cap-upper)); align-items:start }
    html[data-presentation="full-bleed"] footer.story-caption[data-position="middle"] { bottom:auto;
      top:calc(50% - (var(--caption-max-lines, 2) * var(--cap-lh) * var(--cap-size) + 2 * var(--cap-pad-y)) / 2); align-items:center }
    html[data-presentation="full-bleed"] footer .ct { display:block; box-sizing:border-box; max-width:100%; padding:var(--cap-pad-y) var(--cap-pad-x) }
    html[data-presentation="full-bleed"] footer .cw, .vc-hook .w { white-space:nowrap }
    .vc-hook { position:absolute; z-index:61; top:calc(var(--safe-top) + var(--hook-top)); left:calc(var(--safe-x) + var(--hook-inset));
      right:calc(var(--safe-x) + var(--hook-inset)); text-align:center; text-wrap:balance; pointer-events:none; transform-origin:50% 0 }
    .vc-hook-text { display:inline }
    :root { --safe-top:7vh; --safe-bottom:15vh; --safe-x:6.5vw; --cap-inset:0px; --cap-lower:0px; --cap-upper:0px;
      --cap-size:48px; --cap-lh:1.34; --cap-pad-y:12px; --cap-pad-x:24px; --hook-top:0px; --hook-inset:0px }
    @media (orientation: landscape) { :root { --safe-top:6vh; --safe-bottom:9vh; --safe-x:5vw; --cap-size:40px } }
  `;

  // `preferred` is the project's presentation preference ('framed' | 'full-bleed' | null). A topic without its own spec follows
  // it (full-bleed with default captions, no hook); a topic whose spec names a different mode is refused explicitly.
  function install({topic, captions, shots, duration, locale, preferred = null}) {
    if (preferred !== null && !MODES.includes(preferred)) fail(`[presentation-unsupported] preference must be one of ${MODES}`);
    if (preferred && topic?.presentation?.mode && topic.presentation.mode !== preferred) fail(`[presentation-mismatch] the topic asks for ${topic.presentation.mode} but the project preference is ${preferred}`);
    const spec = topic?.presentation ?? (preferred === 'full-bleed' ? {mode: 'full-bleed'} : null);
    if (spec === undefined || spec === null || spec?.mode === 'framed') return null;
    if (typeof spec !== 'object' || !MODES.includes(spec.mode)) fail(`mode must be one of ${MODES}`);
    const cap = {position: 'lower', emphasis: 'word', ...(spec.captions ?? {})};
    if (!POSITIONS.includes(cap.position)) fail(`captions.position must be one of ${POSITIONS}`);
    if (!EMPHASIS.includes(cap.emphasis)) fail(`captions.emphasis must be one of ${EMPHASIS}`);
    const positions = {};
    for (const s of shots) {
      if (s.captionPosition !== undefined && !POSITIONS.includes(s.captionPosition)) fail(`shot ${s.id}: captionPosition must be one of ${POSITIONS}`);
      positions[s.id] = s.captionPosition ?? cap.position;
    }
    let hook = null;
    if (spec.hook !== undefined) {
      const h = spec.hook;
      if (typeof h?.text !== 'string' || !h.text.trim()) fail('hook.text must be a non-empty string');
      const until = h.until ?? Math.min(shots[0].end, 4);
      if (!isNum(until) || until < .8 || until > duration) fail('hook.until must be seconds between 0.8 and the narration duration');
      let at = -1;
      if (h.highlight !== undefined) {
        if (typeof h.highlight !== 'string' || !h.highlight.trim()) fail('hook.highlight must be a non-empty string');
        at = h.text.indexOf(h.highlight);
        const end = at + h.highlight.length;
        if (at < 0) fail('hook.highlight must be part of hook.text');
        // Whole words only: a highlight that starts or ends inside a word would split its graphemes or compound.
        if ((at > 0 && !BOUNDARY.test(h.text[at - 1])) || (end < h.text.length && !BOUNDARY.test(h.text[end]))) fail('hook.highlight must cover whole words');
      }
      hook = {text: h.text, highlight: at < 0 ? null : [at, at + h.highlight.length], until};
    }

    const root = document.documentElement, frame = document.querySelector('.story-frame'), footer = document.querySelector('footer');
    root.dataset.presentation = 'full-bleed';
    footer.dataset.position = cap.position;
    const style = document.createElement('style');
    style.dataset.vc = 'presentation';
    style.textContent = BASE_CSS;
    document.head.prepend(style);   // first, so every style sheet (and engine CSS) can refine it; layout rules win on specificity
    // The text-safe area replaces the framed layout's safe container: captions, hook and labels must stay inside it.
    document.querySelector('[data-safe]')?.removeAttribute('data-safe');
    const safe = document.createElement('div');
    safe.className = 'vc-safe'; safe.dataset.safe = ''; safe.setAttribute('aria-hidden', 'true');
    frame.append(safe);
    let hookEl = null;
    if (hook) {
      hookEl = document.createElement('div');
      hookEl.className = 'vc-hook'; hookEl.id = 'vc-hook';
      if (locale) hookEl.lang = locale;
      const text = document.createElement('span');
      text.className = 'vc-hook-text'; text.dataset.text = '';
      const [a, b] = hook.highlight ?? [-1, -1];
      for (const tk of tokens(hook.text)) {
        if (tk.space) { text.append(document.createTextNode(' ')); continue; }
        const w = document.createElement('span');
        w.className = 'w' + (a >= 0 && tk.from < b && tk.to > a ? ' vc-hook-key' : '');
        w.textContent = tk.text; text.append(w);
      }
      hookEl.append(text);
      frame.append(hookEl);
    }

    const emphasisCues = captions.filter(c => Array.isArray(c.words) && c.words.length).length;
    let built = null, shown = null;
    const ctl = {
      mode: 'full-bleed',
      summary: {mode: 'full-bleed', captionPosition: cap.position, shotPositions: positions, emphasis: cap.emphasis,
        emphasisCues, captionCues: captions.length,
        hook: hook ? {text: hook.text, until: hook.until, key: [...hookEl.querySelectorAll('.vc-hook-key')].map(x => x.textContent).join(' ') || null} : null},
      // Text-safe area and the top of the lower caption band, in stage percent (for topic layout: ctx.safe).
      safe() {
        const st = document.querySelector('.story-stage').getBoundingClientRect(), s = safe.getBoundingClientRect();
        const lower = footer.dataset.position; footer.dataset.position = 'lower';
        const fb = footer.getBoundingClientRect(); footer.dataset.position = lower;
        const x = v => +((v - st.left) / st.width * 100).toFixed(2), y = v => +((v - st.top) / st.height * 100).toFixed(2);
        return {left: x(s.left), right: x(s.right), top: y(s.top), bottom: y(s.bottom), captionTop: y(fb.top)};
      },
      // Called by the engine whenever a shot's scene is (re)built; the scene view resets the footer.
      setup() { built = null; },
      render(t, current) {
        const id = current ? String(current.id) : '';
        if (built !== id || footer.dataset.cid !== id) {
          built = id; footer.dataset.cid = id; footer.style.transform = '';
          // A caption keeps the position and accent of the shot it starts in for its whole life, so a cue that runs
          // across a shot boundary never jumps (stable layout).
          if (current) {
            const home = shots.findLast(s => s.start <= current.start + 1e-9) ?? shots[0];
            footer.dataset.position = positions[home.id] ?? cap.position;
            if (home.accent) footer.style.setProperty('--accent', home.accent); else footer.style.removeProperty('--accent');
          }
          const line = document.createElement('span'); line.className = 'ct';
          line.replaceChildren(...(current ? tokens(current.text) : []).map(tk => {
            if (tk.space) return document.createTextNode(' ');
            const span = document.createElement('span'); span.className = 'cw'; span.textContent = tk.text;
            span.dataset.from = tk.from; span.dataset.to = tk.to; return span;
          }));
          footer.replaceChildren(line);
          shown = null;
        }
        footer.style.opacity = current ? '1' : '0';
        const line = footer.firstElementChild;
        if (line) line.style.opacity = current ? String(+smooth(clamp((t - current.start) / CAPTION_IN)).toFixed(4)) : '0';
        // Active word: the latest measured word that has started (held through short gaps, so it never flickers).
        let activeWord = null;
        if (current && cap.emphasis === 'word' && current.words?.length) for (const w of current.words) if (w.at <= t + 1e-9) activeWord = w;
        const key = activeWord ? `${activeWord.from}:${activeWord.to}` : '';
        if (key !== shown && line) {
          shown = key;
          for (const span of line.children) {
            const from = +span.dataset.from, to = +span.dataset.to;
            span.classList.toggle('is-active', Boolean(activeWord) && from < activeWord.to && to > activeWord.from);
            span.classList.toggle('is-spoken', Boolean(activeWord) && to <= activeWord.from);
          }
        }
        if (hookEl) {
          const out = smooth(clamp((t - (hook.until - HOOK_OUT)) / HOOK_OUT));
          hookEl.style.opacity = String(+(1 - out).toFixed(4));
          hookEl.style.transform = `scale(${(1 - .03 * out).toFixed(4)})`;
          hookEl.style.visibility = out >= 1 ? 'hidden' : 'visible';
        }
        return {captionWord: activeWord ? current.text.slice(activeWord.from, activeWord.to) : null,
          ...(hookEl ? {hook: {opacity: +hookEl.style.opacity, visible: hookEl.style.visibility !== 'hidden'}} : {})};
      },
      // Preflight additions (geometry from the browser's own layout): the stage covers the frame, the hook stays in the
      // text-safe area and clear of visible labels, the caption clears visible labels, and a cue's text box never moves.
      inspect({add, box, rect, inside, shown: visible, transition}) {
        const stage = box(document.querySelector('.story-stage')), safeBox = box(safe);
        if (stage.left > .5 || stage.top > .5 || stage.right < innerWidth - .5 || stage.bottom < innerHeight - .5)
          add('safe-area', 'stage', {reason: 'full-bleed stage does not cover the frame', box: rect(stage)});
        const labels = [...document.querySelectorAll('.piece-label')].filter(visible).map(el => ({id: el.parentElement.id, r: box(el)}));
        const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
        if (hookEl && visible(hookEl)) {
          const r = box(hookEl.firstElementChild);
          if (!inside(r, safeBox, 1)) add('safe-area', 'hook', {reason: 'hook outside the text-safe area', box: rect(r), safe: rect(safeBox)});
          for (const l of labels) if (hit(r, l.r)) add('caption-layout', 'hook', {reason: 'hook overlaps a visible label', label: l.id});
        }
        const line = footer.firstElementChild;
        if (line && visible(footer) && Number(line.style.opacity) > .5) {
          const r = box(line);
          if (!transition) for (const l of labels) if (hit(r, l.r)) add('caption-layout', 'caption ' + footer.dataset.cid, {reason: 'caption overlaps a visible label', label: l.id});
          const seen = globalThis.__vcCaptionBoxes ??= new Map(), k = footer.dataset.cid + '|' + innerWidth + 'x' + innerHeight, was = seen.get(k);
          if (!was) seen.set(k, rect(r));
          else if (['x', 'y', 'w', 'h'].some(p => Math.abs(was[p] - rect(r)[p]) > 1)) add('caption-layout', 'caption ' + footer.dataset.cid, {reason: 'caption box moved or resized within its cue', first: was, now: rect(r)});
        }
      },
    };
    globalThis.vcPresentation.active = ctl;
    return ctl;
  }

  globalThis.vcPresentation = {install, active: null, MODES, POSITIONS};
})();
