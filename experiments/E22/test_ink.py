"""E22 focused check: board-ink lettering legibility (P023.2B). Drives the real Whiteboard page (host, stylesheet,
presentation, texture, motion, shot core, kit) with the E22 topic and resolved plan, samples every frame at 30 fps, and
for each written ink word (text[data-ink-text]) that is visible and at least 60% inside the viewport asserts:
  - on-screen glyph size >= its data-min-px (font size times the element's screen scale), at 1080x1920
  - it is not under the visible caption (the caption would hide it)
Intentional camera crops (less than 100% in view) are allowed and reported. Label and caption safeguards are untouched:
the usual preflight still runs separately.
python -I experiments/E22/test_ink.py
"""
import glob
import json
import subprocess
import sys
from pathlib import Path

E22 = Path(__file__).resolve().parent
S = E22.parents[1] / "skills/video-creator/scripts"
P = Path(sorted(glob.glob(str(E22 / "work/projects/*/")))[0])
probe = r"""
const [S, P, topicFile] = process.argv.slice(1);
const fs = await import('node:fs'), path = await import('node:path'), url = await import('node:url');
const {launch} = await import(url.pathToFileURL(path.join(S, 'lib/chrome.mjs')).href);
const {loadRenderPlan} = await import(url.pathToFileURL(path.join(S, 'lib/resolved-plan.mjs')).href);
const {loadCaptions} = await import(url.pathToFileURL(path.join(S, 'lib/captions.mjs')).href);
const rd = f => fs.readFileSync(f, 'utf8'), st = path.join(S, 'styles');
const tlf = path.join(P, 'narration/narration.timeline.json'), tl = JSON.parse(rd(tlf));
const plan = await loadRenderPlan({planFile: path.join(P, 'plan/resolved-plan.json'), project: P, timelineFile: tlf, timeline: tl});
const captions = await loadCaptions({file: path.join(P, 'captions/captions.json'), project: P, timelineFile: tlf, timeline: tl});
const page = await launch({width: 1080, height: 1920, browserArgs: ['--disable-gpu']});
try {
  await page.call('Page.navigate', {url: url.pathToFileURL(path.join(st, 'whiteboard/host.html')).href});
  for (let i = 0; i < 50 && !(await page.evaluate('document.readyState==="complete"').catch(() => false)); i++) await new Promise(r => setTimeout(r, 100));
  const src = ['shared/presentation.js', 'shared/texture.js', 'shared/motion.js', 'tech-explainer/engine.js', 'whiteboard/kit.js'].map(f => rd(path.join(st, f))).join('\n');
  const out = await page.evaluate(`(async () => { ${src}
    ${rd(topicFile)}
    const info = installTechShots({timeline: ${JSON.stringify(tl)}, topic: globalThis.whiteboardTopic, locale: 'en-IN', plan: ${JSON.stringify(plan)}, captions: ${JSON.stringify(captions)}});
    await document.fonts.ready;
    const vis = el => { for (let n = el; n && n !== document.body; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity <= .5) return false; } return true; };
    const W = innerWidth, H = innerHeight, rows = [], ctx2 = document.createElement('canvas').getContext('2d'), hand = getComputedStyle(document.documentElement).getPropertyValue('--hand') || 'cursive';
    for (let f = 0; f / 30 < info.duration; f++) {
      techShots.renderAt(f / 30);
      const foot = document.querySelector('footer'), fr = foot.getBoundingClientRect(), capOn = vis(foot) && fr.height > 0 && +foot.firstElementChild?.style.opacity > .5;
      // ink text lives in <symbol>s drawn through <use>: measure it through each piece's own svg transform
      for (const host of document.querySelectorAll('.piece')) {
        if (!vis(host)) continue;
        const sv = host.querySelector('svg.piece-art'), use = sv?.querySelector('use'), sym = use && document.querySelector(use.getAttribute('href'));
        if (!sym) continue;
        const draw = parseFloat(host.style.getPropertyValue('--draw') || '1'), ctm = sv.getScreenCTM();
        for (const el of sym.querySelectorAll('text[data-ink-text]')) {
          const w = /var\\(--draw, 1\\) - ([0-9.]+)\\) \\/ ([0-9.]+)/.exec(el.getAttribute('style')), prog = w ? Math.max(0, Math.min(1, (draw - +w[1]) / +w[2])) : 1;
          if (prog < .99) continue;                                   // still being written
          const size = parseFloat(/font:700 ([0-9.]+)px/.exec(el.getAttribute('style'))[1]), caps = /uppercase/.test(el.getAttribute('style'));
          ctx2.font = '700 ' + size + 'px ' + hand; const tw = ctx2.measureText(caps ? el.textContent.toUpperCase() : el.textContent).width * 1.02;
          const x = +el.getAttribute('x'), y = +el.getAttribute('y'), anc = el.getAttribute('text-anchor'), x0 = anc === 'middle' ? x - tw / 2 : anc === 'end' ? x - tw : x;
          const pts = [[x0, y - size * .8], [x0 + tw, y - size * .8], [x0, y + size * .25], [x0 + tw, y + size * .25]].map(([a, b]) => new DOMPoint(a, b).matrixTransform(ctm));
          const r = {left: Math.min(...pts.map(q => q.x)), right: Math.max(...pts.map(q => q.x)), top: Math.min(...pts.map(q => q.y)), bottom: Math.max(...pts.map(q => q.y))};
          const ix = Math.max(0, Math.min(r.right, W) - Math.max(r.left, 0)), iy = Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0)), inView = ix * iy / ((r.right - r.left) * (r.bottom - r.top));
          const px = size * Math.hypot(ctm.a, ctm.b);
          const under = capOn && r.left < fr.right && fr.left < r.right && r.top < fr.bottom && fr.top < r.bottom;
          rows.push({t: +(f / 30).toFixed(3), text: el.textContent, inView: +inView.toFixed(3), px: +px.toFixed(1), min: +el.dataset.minPx, under});
        }
      }
    }
    return {rows, duration: info.duration};
  })()`);
  console.log(JSON.stringify(out));
} finally { await page.close(); }
"""
d = subprocess.run(["node", "--input-type=module", "-e", probe, str(S), str(P), str(E22 / "topics/heat-wb-topic.js")], capture_output=True, text=True, encoding="utf-8")
try:
    r = json.loads(d.stdout.strip().splitlines()[-1])
except Exception:
    print("FAIL probe", (d.stdout + d.stderr)[-800:]); sys.exit(1)
rows, res = r["rows"], []


def check(name, ok, **kw):
    res.append(ok); print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(kw, ensure_ascii=False)[:400])


words = sorted({x["text"] for x in rows})
inview = [x for x in rows if x["inView"] >= .6]
small = [x for x in inview if x["px"] < x["min"]]
under = [x for x in inview if x["under"]]
cropped = sorted({x["text"] for x in rows if 0 < x["inView"] < 1})
check("every ink word is written on screen at some point", set(words) == {"bakes", "stores heat", "cooler"}, words=words)
check("legible: on-screen size >= min px wherever >= 60% in view", not small, worst=min(inview, key=lambda x: x["px"] - x["min"]) if inview else None, failures=small[:3])
check("never under a visible caption while in view", not under, failures=under[:3])
print("INFO intentional crops (allowed):", cropped, f"| samples={len(rows)} frames={round(r['duration'] * 30)}")
print(f"{sum(res)}/{len(res)} passed")
sys.exit(0 if all(res) else 1)
