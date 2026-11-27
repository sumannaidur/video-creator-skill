// Shared motion primitives (P022.2). Browser script, evaluated before a shot engine; optional and additive.
//
// 1. Extra easing curves, merged into each engine's curve table. Existing curve names (linear, out, in, smooth) are
//    unchanged, so legacy topics render identically. Every curve maps 0 → 0 and 1 → 1 exactly, so keys still land on
//    their values (speech-cue timing and data values are preserved at key times).
//      inOut      cubic ease-in-out (natural acceleration and braking)
//      outQuart   fast start, long soft landing (launches, camera arrivals)
//      anticipate dips backwards (about 10%) before moving (wind-up)
//      overshoot  passes the target (about 10%) and returns (lively arrivals; never for data marks)
//      settle     damped spring: overshoots, then rings down to rest (follow-through, impacts)
//      hold       stays at the previous value until the key time (stepped or held poses)
// 2. Key builders for the engines' track format [t, [x, y, rot, scale, opacity], curve] (or any value arrays):
//      arrive(t, from, to, dur, {anticipate, curve})  optional wind-up, then a move into place
//      follow(keys, {lag, curve})     secondary motion: the same keys delayed by `lag`, landing with `curve`
//      stepped(keys, fps)             holds poses between samples at `fps` (cut-paper "on twos" feel); same end values
//      stagger(items, start, gap, fn) coordinated sequence: calls fn(item, t, i) at start + i*gap; returns the times
//      jitter(seed, i, amp)           deterministic small offset (hand-placed paper); pure function of its inputs
//      sample(keys, t)                the value of a key list at t (for composing builders)
// Deterministic: everything is a pure function of its arguments; no clocks or random state.
(() => {
  const clamp = v => Math.max(0, Math.min(1, v));
  const S1 = 1.70158, S2 = S1 * 1.525;
  const ease = {
    inOut: p => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2,
    outQuart: p => 1 - (1 - p) ** 4,
    anticipate: p => (S1 + 1) * p ** 3 - S1 * p ** 2,
    overshoot: p => 1 + (S1 + 1) * (p - 1) ** 3 + S1 * (p - 1) ** 2,
    settle: p => p >= 1 ? 1 : 1 - Math.exp(-6.5 * p) * Math.cos(2.6 * Math.PI * p) * (1 - p),
    hold: p => p >= 1 ? 1 : 0,
  };
  const base = {linear: p => p, out: p => 1 - (1 - p) ** 3, in: p => p ** 3, smooth: p => p * p * (3 - 2 * p)};
  const curve = name => ease[name] ?? base[name] ?? (() => { throw new Error('vcMotion: unknown curve ' + name); })();
  const sample = (keys, t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
      const [a, va] = keys[i - 1], [b, vb, c = 'smooth'] = keys[i];
      const p = curve(c)(clamp((t - a) / (b - a)));
      return va.map((x, k) => x + (vb[k] - x) * p);
    }
    return keys.at(-1)[1];
  };
  const r3 = v => Math.round(v * 1e6) / 1e6;
  // Wind-up then move. `anticipate` is the fraction of the move taken backwards first (0 = none) over `windup` seconds.
  const arrive = (t, from, to, dur, {anticipate = 0, windup = .18, curve: c = 'settle'} = {}) => {
    if (!anticipate) return [[t, from, 'smooth'], [t + dur, to, c]];
    const back = from.map((x, k) => x - (to[k] - x) * anticipate);
    return [[t, from, 'smooth'], [t + windup, back, 'inOut'], [t + windup + dur, to, c]];
  };
  const follow = (keys, {lag = .08, curve: c} = {}) => keys.map(([t, v, k], i) => [r3(t + lag), v, i && c ? c : k]);
  // Stepped timing: one held pose per 1/fps between the first and last key; the last key is kept exactly.
  const stepped = (keys, fps = 12) => {
    const t0 = keys[0][0], t1 = keys.at(-1)[0], dt = 1 / fps, out = [[t0, keys[0][1], 'smooth']];
    for (let t = t0 + dt; t < t1 - 1e-9; t += dt) out.push([r3(t), sample(keys, t), 'hold']);
    out.push([t1, keys.at(-1)[1], 'hold']);
    return out;
  };
  const stagger = (items, start, gap, fn) => items.map((it, i) => { const t = r3(start + i * gap); fn?.(it, t, i); return t; });
  const jitter = (seed, i, amp = 1) => { const x = Math.sin((seed * 31 + i) * 127.1 + 311.7) * 43758.5453; return (x - Math.floor(x) - .5) * 2 * amp; };
  globalThis.vcMotion = {ease, sample, arrive, follow, stepped, stagger, jitter, version: 1};
})();
