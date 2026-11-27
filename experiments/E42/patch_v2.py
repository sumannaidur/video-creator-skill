"""E42 P024.18A single correction: section inset (field path, eddies, conceptual heat, secondary glass warming), 3D flux
arrows, tight hook framing, static frame for the inset shots, larger tags. Blender layers and plan reused unchanged."""
import shutil
import sys

p = sys.argv[1]
shutil.copy(p, p.replace("topic-src.js", "topic-src-v1.js"))
s = open(p, encoding="utf-8").read()
INSET = r"""  // ---- section inset (true side section, schematic, not to scale): pan base on glass, coil turns, ferrite; field, eddies, heat
  const SY = {top: VH * .035, glass: VH * .168, base: VH * .154, coil: VH * .185, fer: VH * .2, bot: VH * .27};
  const secArt = () => `<rect x="40" y="${f(SY.top)}" width="920" height="${f(SY.bot - SY.top)}" rx="26" fill="#0b1018" fill-opacity=".86" stroke="#3a4a63" stroke-width="3"/>` +
    `<path d="M150 ${f(SY.base - 150)}Q158 ${f(SY.base - 10)} 200 ${f(SY.base)}H800Q842 ${f(SY.base - 10)} 850 ${f(SY.base - 150)}" fill="none" stroke="#b8c0ca" stroke-width="10" stroke-linecap="round"/>` +
    `<rect x="190" y="${f(SY.base)}" width="620" height="${f(SY.glass - SY.base)}" fill="#9aa3ad"/>` +
    `<rect x="80" y="${f(SY.glass)}" width="840" height="20" rx="4" fill="#1d2430" stroke="#566476" stroke-width="2"/>` +
    [...Array(12).keys()].flatMap(k => [500 - 34 - k * 21, 500 + 34 + k * 21]).map(x => `<circle cx="${f(x)}" cy="${f(SY.coil)}" r="8.5" fill="#c8733f" stroke="#7a3d1c" stroke-width="2"/>`).join('') +
    `<rect x="210" y="${f(SY.fer)}" width="260" height="13" rx="3" fill="#2a2d33"/><rect x="530" y="${f(SY.fer)}" width="260" height="13" rx="3" fill="#2a2d33"/>`;
  // one flux loop: up through the glass into the pan base, along the base, down outside the coil, back through the ferrite
  const loopPath = (xi, xo, s) => { const X = x => 500 + s * (x - 500), yb = SY.fer + 6, yt = (SY.base + SY.glass) / 2, r = 16, d = s * r;
    return `M${f(X(xi))} ${f(yb - r)}V${f(yt + r)}Q${f(X(xi))} ${f(yt)} ${f(X(xi) + d)} ${f(yt)}H${f(X(xo) - d)}Q${f(X(xo))} ${f(yt)} ${f(X(xo))} ${f(yt + r)}` +
      `V${f(yb - r)}Q${f(X(xo))} ${f(yb)} ${f(X(xo) - d)} ${f(yb)}H${f(X(xi) + d)}Q${f(X(xi))} ${f(yb)} ${f(X(xi))} ${f(yb - r)}`; };
  const secFieldArt = () => [0, 1, 2].flatMap(i => [1, -1].map(s => `<path d="${loopPath(520 + 26 * i, 770 + 30 * i, s)}" pathLength="1" fill="none" stroke="${FIELD}" stroke-width="${4 - i * .8}" stroke-linejoin="round" style="stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--draw, 1))"/>` +
      `<path d="M${f(500 + s * (520 + 26 * i - 500) - 9)} ${f(SY.coil + 2)}l9 -16l9 16Z" fill="${FIELD}"/>`)).join('');
  const secEddyArt = () => [...Array(10).keys()].map(k => { const x = 230 + k * 60, y = (SY.base + SY.glass) / 2;
    return `<circle cx="${x}" cy="${f(y)}" r="9" fill="#2a1408" stroke="${HOT}" stroke-width="3"/>` + (k % 2 ? `<circle cx="${x}" cy="${f(y)}" r="3" fill="${HOT}"/>` : `<path d="M${x - 5} ${f(y - 5)}l10 10M${x + 5} ${f(y - 5)}l-10 10" stroke="${HOT}" stroke-width="3"/>`); }).join('');
  const secHeatArt = () => `<defs><linearGradient id="hb-hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="${HOT}"/></linearGradient></defs>` +
    `<rect x="190" y="${f(SY.base)}" width="620" height="${f(SY.glass - SY.base)}" fill="url(#hb-hg)" opacity=".9"/>`;
  const secGlassWarmArt = () => `<defs><linearGradient id="hb-gw" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></linearGradient></defs>` +
    `<rect x="190" y="${f(SY.glass)}" width="620" height="20" fill="url(#hb-gw)"/>`;
  // 3D view: upward flux arrows rising through the glass into the pan base, placed on the projected base ellipse
  const fluxArt = () => { const ring = G.panBase, n = ring.length - 1, c = pt(G.panBaseCentre);
    return [.04, .3, .5, .7, .96].map(u => { const [x, y] = pt(ring[Math.round(n * (.5 + (u - .5) * .9) / 2 + n / 4)] ?? ring[0]); const X = c[0] + (x - c[0]) * .85, Y = c[1] + (y - c[1]) * .85;
      return `<path d="M${f(X)} ${f(Y + 70)}V${f(Y - 30)}" stroke="${FIELD}" stroke-width="5" stroke-linecap="round"/><path d="M${f(X - 11)} ${f(Y - 18)}L${f(X)} ${f(Y - 38)}L${f(X + 11)} ${f(Y - 18)}" fill="none" stroke="${FIELD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`; }).join(''); };

  globalThis.techTopic = {"""
R = [
    ("  globalThis.techTopic = {", INSET),
    ("    css: K.css,", "    css: K.css + ' #l-coil .piece-label, #l-glass .piece-label, #l-eddy .piece-label, #l-here .piece-label, #l-notglass .piece-label, #l-base .piece-label, #l-heatnote .piece-label { font-size:42px }',"),
    ("sym('hb-field', vb, fieldArt()),", "sym('hb-field', vb, secFieldArt()), sym('hb-sec', vb, secArt()), sym('hb-seceddy', vb, secEddyArt()), sym('hb-secheat', vb, secHeatArt()), sym('hb-glasswarm', vb, secGlassWarmArt()), sym('hb-flux', vb, fluxArt()),"),
    ("plate('o-eddy', 'hb-eddy', L, 'exact'), plate('o-shimmer', 'hb-shimmer', L, 'exact'),",
     "plate('o-eddy', 'hb-eddy', L, 'exact'), plate('o-shimmer', 'hb-shimmer', L, 'exact'), plate('o-flux', 'hb-flux', L, 'exact'),\n"
     "        plate('o-sec', 'hb-sec', L, 'exact'), plate('o-seceddy', 'hb-seceddy', L, 'exact'), plate('o-secheat', 'hb-secheat', L, 'exact'), plate('o-glasswarm', 'hb-glasswarm', L, 'exact'),\n"
     "        label('l-base', [.5, .07], 40, 'పాన్ అడుగు', 'callout', {accent: '#b8c0ca'}), label('l-heatnote', [.5, .245], 72, 'రంగు: వేడికి సంకేతం మాత్రమే', 'callout', {accent: HOT}),"),
    ("label('l-glass', [.5, Math.min(.74, front[1] + .03)], 26, T.glass, 'callout', {accent: '#9fb3d6'}),", "label('l-glass', [.17, .245], 26, T.glass, 'callout', {accent: '#9fb3d6'}),"),
    ("label('l-here', [.5, pb[1] - .07], 48, T.here, 'chip', {accent: '#c2410c'}),", "label('l-here', [.5, .07], 50, T.here, 'chip', {accent: '#c2410c'}),"),
    ("label('l-coil', [.5, Math.min(.74, front[1] + .03)], 44, T.coil,", "label('l-coil', [.5, Math.min(.74, front[1] + .03)], 50, T.coil,"),
    ("label('l-eddy', [.5, Math.min(.74, front[1] + .03)], 52, T.eddy,", "label('l-eddy', [.5, Math.min(.74, front[1] + .03)], 60, T.eddy,"),
    ("label('l-notglass', [.5, Math.min(.74, front[1] + .03)], 52, T.notglass,", "label('l-notglass', [.5, Math.min(.74, front[1] + .03)], 60, T.notglass,"),
    ("      kit.trace('o-field', 'field', 1.2, S('eddy').start + .6); kit.label('l-glass', 'glass', S('field').end - .2);",
     "      fade('o-sec', S('field').start + .1, .6); kit.label('l-base', S('field').start + .5, S('eddy').end - .3);\n"
     "      kit.trace('o-field', 'field', 1.2, S('eddy').start + .8); kit.label('l-glass', 'glass', S('field').end - .2);\n"
     "      fade('o-flux', cue('field') + .2, .5, S('eddy').start + .3);\n"
     "      fade('o-seceddy', cue('eddy'), .5); fade('o-secheat', cue('hot'), .9); fade('o-glasswarm', S('payoff').start + .6, 1.2); kit.label('l-heatnote', cue('hot') + .4, S('payoff').start - .2);"),
    ("kit.label('l-here', 'here');", "kit.label('l-here', 'here');"),
    ("      const cameras = {hook: kit.cameraTravel('hook', [[S('hook').start, 0, 0, 1.0], [S('hook').end, cx * .3, cy * .3, 1.05]]),",
     "      const cameras = {hook: kit.cameraTravel('hook', [[S('hook').start, cx, cy, 1.32], [S('hook').end, cx, cy, 1.38]]),"),
    ("        coil: kit.cameraTravel('coil', [[S('coil').start, cx * .3, cy * .3, 1.05], [S('coil').end, cx * .5, cy * .5, 1.1]]),",
     "        coil: kit.cameraTravel('coil', [[S('coil').start, cx, cy, 1.38], [S('coil').end, cx * .6, cy * .6, 1.18]]),"),
    ("        field: kit.cameraTravel('field', [[S('field').start, cx * .5, cy * .5, 1.1], [S('field').end, cx * .5, cy * .5, 1.12]]),",
     "        field: kit.cameraTravel('field', [[S('field').start, 0, 0, 1.0], [S('field').end, 0, 0, 1.0]]),"),
    ("        eddy: kit.cameraTravel('eddy', [[S('eddy').start, cx * .5, cy * .5, 1.12], [S('eddy').end, cx * .4, cy * .4, 1.08]]),",
     "        eddy: kit.cameraTravel('eddy', [[S('eddy').start, 0, 0, 1.0], [S('eddy').end, 0, 0, 1.0]]),"),
    ("        payoff: kit.cameraTravel('payoff', [[S('payoff').start, cx * .4, cy * .4, 1.08], [end, 0, 0, 1.02]])};",
     "        payoff: kit.cameraTravel('payoff', [[S('payoff').start, 0, 0, 1.0], [end, 0, 0, 1.0]])};"),
    ("field: {regions: [{id: 'o-field', box: box(pb)}]}, eddy: {regions: [{id: 'o-hot', box: box(pb)}], annotations: [{id: 'l-eddy', target: 'o-hot'}]}};",
     "field: {regions: [{id: 'o-base', box: box(pb)}, {id: 'o-sec', box: [.19, .154, .62, .016]}], annotations: [{id: 'l-glass', target: 'o-sec'}]},\n"
     "        eddy: {regions: [{id: 'o-hot', box: box(pb)}, {id: 'o-sec', box: [.19, .154, .62, .016]}], annotations: [{id: 'l-eddy', target: 'o-hot'}]}};"),
]
for a, b in R:
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
open(p, "w", encoding="utf-8").write(s)
print("patched", len(R))
