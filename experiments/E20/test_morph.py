"""E20 focused test: the Data Storytelling bars->total morph and camera moments (closes the assertions the legacy
`test_data_storytelling` bars-transition check cannot cover for the after topic). The legacy fixture and test are unchanged.

python -I experiments/E20/test_morph.py   (needs the after-data project from E20's harness run under work/after-data)

Drives the real Data Storytelling page (host, stylesheet, presentation, texture, motion, shot core, kit) with the after
topic and the project's resolved plan, then samples the engine's own per-object state:
  - camera moments: 2 planned camera keys per shot, no transition on either shot (the morph is the transition)
  - no data overshoot: every bar's --draw stays within [0, 1] at every frame (30 fps)
  - shared scale: during the rescale all four bars carry the same --draw at every frame
  - landing: at the end each bar's --draw is exactly 500/1200 and its translation equals the stacked position
    computed from the data (dx to the column, dy = -(sum of the bars below) on the 0-1200 scale), within 0.5 px
  - order and contiguity follow from dy = -cumulative sum * u2 and height = value * u2 (asserted via both values)
  - the counter's final value is the exact data sum (1200)
"""
import json
import glob
import subprocess
import sys
from pathlib import Path

E20 = Path(__file__).resolve().parent
S = E20.parents[1] / "skills/video-creator/scripts"
P = Path(sorted(glob.glob(str(E20 / "work/after-data/projects/*/")))[0])
probe = r"""
const [S, P] = process.argv.slice(1);
const fs = await import('node:fs'), path = await import('node:path'), url = await import('node:url');
const {launch} = await import(url.pathToFileURL(path.join(S, 'lib/chrome.mjs')).href);
const {loadRenderPlan} = await import(url.pathToFileURL(path.join(S, 'lib/resolved-plan.mjs')).href);
const rd = f => fs.readFileSync(f, 'utf8'), st = path.join(S, 'styles');
const tlf = path.join(P, 'narration/narration.timeline.json'), tl = JSON.parse(rd(tlf));
const plan = await loadRenderPlan({planFile: path.join(P, 'plan/resolved-plan.json'), project: P, timelineFile: tlf, timeline: tl});
const page = await launch({width: 1080, height: 1920, browserArgs: ['--disable-gpu']});
try {
  await page.call('Page.navigate', {url: url.pathToFileURL(path.join(st, 'data-storytelling/host.html')).href});
  for (let i = 0; i < 50 && !(await page.evaluate('document.readyState==="complete"').catch(() => false)); i++) await new Promise(r => setTimeout(r, 100));
  const src = ['shared/presentation.js', 'shared/texture.js', 'shared/motion.js', 'tech-explainer/engine.js', 'data-storytelling/kit.js'].map(f => rd(path.join(st, f))).join('\n');
  const out = await page.evaluate(`(() => { ${src}
    ${rd(path.join(P, 'ds-topic.js'))}
    const info = installTechShots({timeline: ${JSON.stringify(tl)}, topic: globalThis.dataStoryTopic, locale: 'kn-IN', plan: ${JSON.stringify(plan)}});
    const st = document.querySelector('.story-stage').getBoundingClientRect();
    const read = t => { techShots.renderAt(t); return [0, 1, 2, 3].map(i => { const el = document.getElementById('d-bar' + i), m = /translate\\(([-0-9.e]+)px, ([-0-9.e]+)px\\)/.exec(el.style.transform.split(') ').slice(1).join(') ') + ')');
      return {draw: +(el.style.getPropertyValue('--draw') || 0), dx: m ? +m[1] : null, dy: m ? +m[2] : null}; }); };
    const end = info.shots[1].end, samples = [];
    for (let f = 0; f / 30 < end; f++) samples.push([f / 30, read(f / 30)]);
    const last = read(end - 1e-3), cnt = document.getElementById('t-count');
    return {shots: info.shots.map(s => [s.id, s.cameraTimes.length, s.transition?.type ?? null]), stage: [st.width, st.height], samples, last, end,
      counter: cnt ? {to: getComputedStyle(cnt).getPropertyValue('--to').trim(), system: getComputedStyle(cnt).getPropertyValue('--system').trim()} : null};
  })()`);
  console.log(JSON.stringify(out));
} finally { await page.close(); }
"""
d = subprocess.run(["node", "--input-type=module", "-e", probe, str(S), str(P)], capture_output=True, text=True, encoding="utf-8")
try:
    r = json.loads(d.stdout.strip().splitlines()[-1])
except Exception:
    print("FAIL probe", (d.stdout + d.stderr)[-600:]); sys.exit(1)

DATA, TOTAL = [180, 420, 260, 340], 1200
W, H = r["stage"]
VW, VH = 1000, round(1000 / (W / H))
box = dict(x=150, y=VH * .38, w=760, h=VH * .37)
K, u2 = 500 / TOTAL, box["h"] / TOTAL
bx = lambda i: box["x"] + (i + .5) * box["w"] / 4
colX = box["x"] + box["w"] * .5
cum = lambda i: sum(DATA[:i])
exp = [((colX - bx(i)) / VW * W, -cum(i) * u2 / VH * H) for i in range(4)]
res = []


def check(name, ok, **kw):
    res.append(ok); print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(kw)[:300])


check("camera moments: 2 per shot; no wipe transition (the morph is the transition)", r["shots"] == [["chart", 2, None], ["total", 2, None]], shots=r["shots"])
draws = [b["draw"] for _, bars in r["samples"] for b in bars]
check("no data overshoot: every bar --draw within [0, 1] at 30 fps", min(draws) >= -1e-9 and max(draws) <= 1 + 1e-9, min=min(draws), max=max(draws), frames=len(r["samples"]))
full = next(t for t, bars in r["samples"] if all(b["draw"] >= 1 - 1e-9 for b in bars))   # build finished; rescale comes after
resc = [(t, [b["draw"] for b in bars]) for t, bars in r["samples"] if t > full and any(K + 1e-6 < b["draw"] < 1 - 1e-6 for b in bars)]
check("shared scale: during the rescale all bars have the same --draw", resc and all(max(v) - min(v) < 1e-9 for _, v in resc), frames=len(resc))
check("landing scale: every bar ends at 500/1200", all(abs(b["draw"] - K) < 1e-6 for b in r["last"]), draws=[b["draw"] for b in r["last"]])
err = [max(abs(b["dx"] - e[0]), abs(b["dy"] - e[1])) for b, e in zip(r["last"], exp)]
check("landing position: each bar at its stacked position from the data (<= 0.5 px)", max(err) <= .5, err_px=[round(x, 3) for x in err])
check("stack order and contiguity: dy = -cumulative sum on the 0-1200 scale, A at the bottom", [round(-b["dy"] / (u2 / VH * H)) for b in r["last"]] == [0, 180, 600, 860])
check("counter ends on the exact data sum in Kannada digits", r["counter"] and r["counter"]["to"] == str(TOTAL) and r["counter"]["system"] == "kannada", counter=r["counter"])
print(f"{sum(res)}/{len(res)} passed")
sys.exit(0 if all(res) else 1)
