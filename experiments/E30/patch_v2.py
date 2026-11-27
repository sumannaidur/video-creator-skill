"""E30 v2 correction of the project's topic module (opening context, tooth craft, annotation markers, crop declaration)."""
import shutil
import sys

p = sys.argv[1]
shutil.copy(p, p.replace("topic.js", "topic-v1.js"))
s = open(p, encoding="utf-8").read()
R = [
    ("const slant = Math.hypot(r0 - r1, h), tilt = Math.atan2(h, r0 - r1) * 180 / Math.PI, tooth = mesh.box(slant, h * .22, Math.PI * (r0 + r1) / z * .5);",
     "const slant = Math.hypot(r0 - r1, h), tilt = Math.atan2(h, r0 - r1) * 180 / Math.PI, tw = Math.PI * (r0 + r1) / z * .55, th = h * .3;\n"
     "    const tooth = mesh.extrude([[-tw / 2, -th * .2], [tw / 2, -th * .2], [tw * .22, th], [-tw * .22, th]], slant);"),
    ("mt = M.mul(m, M.trs([(r0 + r1) / 2 * .95, h / 2, 0], [0, 0, tilt], [1, 1, 1]));",
     "mt = M.mul(M.mul(m, M.trs([(r0 + r1) / 2 * .95, h / 2, 0], [0, 0, tilt], [1, 1, 1])), M.trs([0, 0, 0], [0, 90, 0], [1, 1, 1]));"),
    ("const thC = t => OMEGA * t,", "const thAt = r => t => OMEGA * t + Dacc(t) * (r - RC) / W, WB = 3.3, thC = t => OMEGA * t,"),
    ("      node('df', {id: 'track-in', mesh: band(RC - W), material: MAT.track, pos: [-RC, -.79, 0], castShadow: false});",
     """      const arc = (r, w, a0, a1) => mesh.lathe([[r - w / 2, 0], [r + w / 2, 0], [r + w / 2, .01], [r - w / 2, .01]], 128, {from: a0, to: a1});
      const MK = {line: material('#e9edf1', {rough: .6}), kerb: material('#8d949c', {rough: .7}), verge: material('#33402f', {rough: .95})};
      node('df', {id: 'edge-in', mesh: arc(RC - 3.4, .12, -.9, .9), material: MK.line, pos: [-RC, -.793, 0], castShadow: false});
      node('df', {id: 'edge-out', mesh: arc(RC + 3.4, .12, -.9, .9), material: MK.line, pos: [-RC, -.793, 0], castShadow: false});
      for (let k = 0; k < 9; k++) node('df', {id: `dash${k}`, mesh: arc(RC + .05, .1, -.9 + k * .2, -.9 + k * .2 + .1), material: MK.line, pos: [-RC, -.792, 0], castShadow: false});
      node('df', {id: 'kerb', mesh: mesh.lathe([[RC + 3.6, 0], [RC + 3.85, 0], [RC + 3.85, .08], [RC + 3.6, .08]], 128, {from: -.9, to: .9}), material: MK.kerb, pos: [-RC, -.795, 0]});
      node('df', {id: 'verge', mesh: arc(RC + 7.9, 8, -.9, .9), material: MK.verge, pos: [-RC, -.794, 0], castShadow: false});
      node('df', {id: 'track-in', mesh: band(RC - W), material: MAT.track, pos: [-RC, -.79, 0], castShadow: false});"""),
    ("      // carrier (turns with the ring gear)",
     """      // ghosted car body (selective transparency shows the drivetrain inside) and front wheels steered at Ackermann angles
      const GHOST = material('#9fb6cc', {metal: .2, rough: .35, opacity: .22});
      for (const [id, sz, pos] of [['body-floor', [4.1, .18, 6.2], [0, -.05, 1.75]], ['body-lower', [4.3, .9, 6.0], [0, .45, 1.75]], ['body-cabin', [3.7, .8, 3.0], [0, 1.3, 1.55]], ['body-nose', [4.0, .55, 1.0], [0, .6, 4.45]]])
        node('df', {id, mesh: mesh.box(...sz), material: GHOST, pos, castShadow: false, proxy: 'p-car'});
      for (const [side, x, r] of [['fl', -W, Math.hypot(WB, RC - W)], ['fr', W, Math.hypot(WB, RC + W)]]) {
        const steer = Math.atan2(WB, RC + x) * 180 / Math.PI;                 // exact Ackermann: wheel axis points at the turn centre
        node('df', {id: `steer-${side}`, pos: [x, 0, WB], rot: [0, steer, 0]});
        node('df', {id: `fframe-${side}`, parent: `steer-${side}`, rot: [0, 0, -90]});
        node('df', {id: `fwheel-${side}`, parent: `fframe-${side}`, rot: t => [0, thAt(r)(t), 0]});
        node('df', {id: `ftyre-${side}`, parent: `fwheel-${side}`, mesh: TYRE, material: MAT.tyre});
        node('df', {id: `fhub-${side}`, parent: `fwheel-${side}`, mesh: HUB, material: MAT.rim});
      }
      // carrier (turns with the ring gear)"""),
    ("mesh: CASE, material: MAT.case, proxy: 'p-diff'});", "mesh: CASE, material: MAT.case, proxy: 'p-wide'});"),
    ("mesh: RING, material: MAT.gear, pos: [0, -.97, 0], proxy: 'p-diff',", "mesh: RING, material: MAT.gear, pos: [0, -.97, 0], proxy: 'p-wide',"),
    ("pos: [.8, 0, 0], rot: [0, 0, 90], proxy: 'p-diff'});", "pos: [.8, 0, 0], rot: [0, 0, 90], proxy: 'p-wide'});"),
    ("rot: t => [0, thPin(t), 0], proxy: 'p-diff'});", "rot: t => [0, thPin(t), 0], proxy: 'p-wide'});"),
    ("material: MAT.steel, rot: [180, 0, 0], proxy: 'p-diff'});", "material: MAT.steel, rot: [180, 0, 0], proxy: 'p-wide'});"),
    ("      // pinion and drive shaft",
     """      const DOT = mesh.sphere(.07, 16);
      node('df', {id: 'dot-ring', parent: 'frame', mesh: DOT, material: material('#ffc857', {emissive: '#ffc857'}), pos: [0, -1.02, -1.12], proxy: 'p-wide'});
      node('df', {id: 'dot-planet', parent: 'frame', mesh: DOT, material: material('#ff9a4a', {emissive: '#ff9a4a'}), pos: [.2, 0, -.62], proxy: 'p-diff'});
      // pinion and drive shaft"""),
    ("      const objs = [P('p-diff', null, 50, 50, 1, 4, {required: true}),", "      const objs = [P('p-diff', null, 50, 50, 1, 4, {required: true}), P('p-wide', null, 50, 50, 1, 4), P('p-car', null, 50, 50, 1, 4),"),
    ("      kit.appear('p-diff', 'diff', .6);", "      kit.appear('p-diff', 'diff', .6); kit.appear('p-wide', S('diff').start + .2, .6);"),
    ("[[S('corner').start, {az: 200, el: 58, dist: dist(3.4), target: [-.4, -.4, 0], fov}], [S('corner').end - .2, {az: 196, el: 50, dist: dist(3.0), target: [-.3, -.3, 0], fov}],",
     "[[S('corner').start, {az: 214, el: 46, dist: dist(4.6), target: [-.2, 0, 1.6], fov}], [S('corner').end - .2, {az: 206, el: 40, dist: dist(4.0), target: [-.1, 0, 1.0], fov}],"),
    ("'ring gear', 'spec', {accent: '#ffc857'}), L('l-planet', [50, top + 6], 50, 'planet gears', 'spec',",
     "'● ring gear', 'spec', {accent: '#ffc857'}), L('l-planet', [50, top + 6], 50, '● planet gears', 'spec',"),
]
for a, b in R:
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
open(p, "w", encoding="utf-8").write(s)
print("patched", len(R))
