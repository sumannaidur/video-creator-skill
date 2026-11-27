// E29 focused check: ball-bearing geometry and kinematics, evaluated on the real 3D kit and the E29 topic (Node VM; no GPU).
// node experiments/E29/test_bearing.mjs
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import url from 'node:url';
const here = path.dirname(url.fileURLToPath(import.meta.url)), S = path.join(here, '../../skills/video-creator/scripts/styles');
const g = {document: {}, Math, console}; g.globalThis = g;
vm.runInNewContext(fs.readFileSync(path.join(S, '3d-explainer/kit.js'), 'utf8'), g);
vm.runInNewContext(fs.readFileSync(path.join(here, 'topics/bearing-3d-topic.js'), 'utf8'), g);
const {KC, KBR, G} = g.E29, RP = 3.35 / 2, RB = .794 / 2, RG = .41, res = [];
const check = (name, ok, info = {}) => { res.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(info)); };
// rolling without slip, outer ring fixed (wi = 1): ball centre speed = wc*RP; outer contact at rest; inner contact speed = wi*(RP - RB)
const wi = 1, wc = KC * wi, wb = KBR * wi;                                          // wb: ball spin relative to the cage
const vOuter = (0 - wc) * (RP + RB) - wb * RB;                                      // cage frame: ring surface vs ball surface at the outer contact
const vInner = (wi - wc) * (RP - RB) + wb * RB;                                     // cage frame at the inner contact
check('cage speed = (1 - Dw/dm)/2 of the shaft (pure rolling)', Math.abs(KC - (1 - G) / 2) < 1e-12 && Math.abs(G - .794 / 3.35) < 1e-12, {KC: +KC.toFixed(4)});
check('no slip at the outer raceway', Math.abs(vOuter) < 1e-12, {slip: vOuter});
check('no slip at the inner raceway', Math.abs(vInner) < 1e-12, {slip: vInner});
// geometry: profile clearances (ball circle vs ring cross-sections in the r-y plane), raceway conformity, cage clearance
const outer = [[1.98, -.35], [2.35, -.35], [2.35, .35], [1.98, .35]], inner = [[1.0, -.35], [1.37, -.35], [1.37, .35], [1.0, .35]];
const inGroove = (r, y, sign) => Math.abs(y) <= .274 && (sign > 0 ? r >= 1.98 - 1e-9 && r < RP + Math.sqrt(RG * RG - y * y) : r <= 1.37 + 1e-9 && r > RP - Math.sqrt(RG * RG - y * y));
const insideRing = (r, y, box, sign) => r > box[0][0] && r < box[1][0] && y > box[0][1] && y < box[2][1] && !inGroove(r, y, sign);
let minGap = Infinity, hits = 0;
for (let k = 0; k < 3600; k++) { const a = k / 3600 * Math.PI * 2, r = RP + Math.cos(a) * RB, y = Math.sin(a) * RB;
  if (insideRing(r, y, outer, 1) || insideRing(r, y, inner, -1)) hits++; }
minGap = RG - RB;
check('balls never intersect either ring (profile sampled at 0.1 deg)', hits === 0, {hits});
check('raceway conformity RG/Dw = 0.516 (typical 0.51-0.53), radial clearance > 0', Math.abs(RG / .794 - .516) < .002 && minGap > 0, {conformity: +(RG / .794).toFixed(3), clearance: +minGap.toFixed(3)});
check('cage plates clear the balls', .405 > RB, {cage: .405, ballR: RB});
// lathe mesh: closed sweep has no caps, partial sweep returns section caps; normals unit length
const m = g.k3d.mesh, full = m.lathe([[1, -.1], [1.2, -.1], [1.2, .1], [1, .1]], 24), cut = m.lathe([[1, -.1], [1.2, -.1], [1.2, .1], [1, .1]], 24, {from: 0, to: Math.PI});
let bad = 0; for (let i = 0; i < cut.data.length; i += 6) { const l = Math.hypot(cut.data[i + 3], cut.data[i + 4], cut.data[i + 5]); if (Math.abs(l - 1) > 1e-6) bad++; }
check('lathe: full sweep without caps, cutaway with section caps, unit normals', !full.caps && !!cut.caps && bad === 0, {badNormals: bad});
console.log(`${res.filter(Boolean).length}/${res.length} passed`); process.exit(res.every(Boolean) ? 0 : 1);
