"""E27 focused check: chain-drive mechanical accuracy on the real X-Ray page (shared shot core + X-Ray kit + E27 topic).
At every frame (30 fps): rear sprocket angle = 3 x chainring angle (48/16), same sense; wheel angle = sprocket angle;
chain travel (--draw) = r1 x chainring angle in radians. At the end: chainring 360 deg, sprocket and wheel 1080 deg.
Geometry: the chain loop is an even whole number of pitches; pitch radii follow p / (2 sin(pi / z)).
python -I experiments/E27/test_mechanism.py
"""
import glob, json, math, subprocess, sys
from pathlib import Path

E = Path(__file__).resolve().parent
S = E.parents[1] / "skills/video-creator/scripts"
P = Path(sorted(glob.glob(str(E / "work/projects/*/")))[0])
probe = r"""
const [S, P, topic] = process.argv.slice(1);
const fs = await import('node:fs'), path = await import('node:path'), url = await import('node:url');
const {launch} = await import(url.pathToFileURL(path.join(S, 'lib/chrome.mjs')).href);
const {loadRenderPlan} = await import(url.pathToFileURL(path.join(S, 'lib/resolved-plan.mjs')).href);
const rd = f => fs.readFileSync(f, 'utf8'), st = path.join(S, 'styles');
const tlf = path.join(P, 'narration/narration.timeline.json'), tl = JSON.parse(rd(tlf));
const plan = await loadRenderPlan({planFile: path.join(P, 'plan/resolved-plan.json'), project: P, timelineFile: tlf, timeline: tl});
const page = await launch({width: 1080, height: 1920, browserArgs: ['--disable-gpu']});
try {
  await page.call('Page.navigate', {url: url.pathToFileURL(path.join(st, 'x-ray-explainer/host.html')).href});
  for (let i = 0; i < 50 && !(await page.evaluate('document.readyState==="complete"').catch(() => false)); i++) await new Promise(r => setTimeout(r, 100));
  const src = ['shared/presentation.js', 'shared/texture.js', 'shared/motion.js', 'tech-explainer/engine.js', 'x-ray-explainer/kit.js'].map(f => rd(path.join(st, f))).join('\n');
  const out = await page.evaluate(`(() => { ${src}
    ${rd(topic)}
    const info = installTechShots({timeline: ${JSON.stringify(tl)}, topic: globalThis.xrayTopic, locale: 'en-IN', plan: ${JSON.stringify(plan)}});
    const rot = id => { const m = /rotate\\(([-0-9.e]+)deg\\)/.exec(document.getElementById(id).style.transform); return m ? +m[1] : 0; };
    const rows = [];
    for (let f = 0; f / 30 <= info.duration; f++) { techShots.renderAt(f / 30);
      rows.push([+(f / 30).toFixed(3), rot('o-ring'), rot('o-sprk'), rot('o-wheel'), +(document.getElementById('o-chain').style.getPropertyValue('--draw') || 0)]); }
    techShots.renderAt(info.duration - 1e-3);
    rows.push([info.duration, rot('o-ring'), rot('o-sprk'), rot('o-wheel'), +(document.getElementById('o-chain').style.getPropertyValue('--draw') || 0)]);
    const A = xrayKit.art, p = 12.7 * 1.2, r1 = A.sprocket(48, p).r, r2 = A.sprocket(16, p).r, VH = Math.round(1000 * innerHeight / innerWidth);
    const L = A.chainLoop([700, VH * .5], r1, [205, VH * .5], r2, p);
    return {rows, r1, r2, p, links: L.links, lenOverP: L.length / p};
  })()`);
  console.log(JSON.stringify(out));
} finally { await page.close(); }
"""
d = subprocess.run(["node", "--input-type=module", "-e", probe, str(S), str(P), str(E / "topics/bike-xr-topic.js")], capture_output=True, text=True, encoding="utf-8")
try:
    r = json.loads(d.stdout.strip().splitlines()[-1])
except Exception:
    print("FAIL probe", (d.stdout + d.stderr)[-800:]); sys.exit(1)
rows, res = r["rows"], []


def check(name, ok, **kw):
    res.append(ok); print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(kw)[:300])


ratio_err = max(abs(s - 3 * c) / max(1, abs(s)) for _, c, s, w, ch in rows)   # relative: the browser serialises transforms to ~6 significant digits
wheel_err = max(abs(w - s) for _, c, s, w, ch in rows)
chain_err = max(abs(ch * r["r1"] * 2 * math.pi - r["r1"] * math.radians(c)) for _, c, s, w, ch in rows)   # --draw = travel / one-revolution travel
last = rows[-1]
check("sprocket = 3 x chainring at every frame (same sense)", ratio_err < 1e-5, max_rel_err=ratio_err, frames=len(rows))
check("wheel turns with the sprocket", wheel_err < 1e-6, max_err_deg=wheel_err)
check("chain travel = r1 x chainring angle (rad)", chain_err < .05, max_err_units=chain_err)
check("one pedal turn = three wheel turns at the end", abs(last[1] - 360) < 1e-6 and abs(last[2] - 1080) < 1e-6, ring=last[1], sprocket=last[2])
check("pitch radii follow p / (2 sin(pi/z))", abs(r["r1"] - r["p"] / (2 * math.sin(math.pi / 48))) < 1e-9 and abs(r["r2"] - r["p"] / (2 * math.sin(math.pi / 16))) < 1e-9, r1=r["r1"], r2=r["r2"])
check("chain loop is an even whole number of links", r["links"] % 2 == 0 and abs(r["lenOverP"] - r["links"]) < 1e-6, links=r["links"], len_over_p=r["lenOverP"])
print(f"{sum(res)}/{len(res)} passed")
sys.exit(0 if all(res) else 1)
