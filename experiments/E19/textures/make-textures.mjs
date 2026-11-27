// E19 (P022.1): renders the phone-screen and message-card textures with the Skill's own headless Chromium driver,
// so Telugu is shaped by the browser (Blender text objects are not used for Indic script). Original generic chat UI;
// no WhatsApp logo or trade dress (same guardrail as E18).
// Usage: node make-textures.mjs   (writes PNGs next to this file)
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const { launch } = await import(pathToFileURL(join(homedir(), '.claude/skills/video-creator/scripts/lib/chrome.mjs')).href);

const W = 720, H = 1556;
const FONT = `'Nirmala UI','Noto Sans Telugu',sans-serif`;
const base = `*{box-sizing:border-box;margin:0}body{width:${W}px;height:${H}px;font-family:${FONT};overflow:hidden}`;
const screen = ({typed, sent}) => `<!doctype html><meta charset="utf-8"><style>${base}
html{background:transparent}body{border-radius:58px;background:radial-gradient(120% 70% at 30% 20%,#17302c 0%,#0c1716 55%,#070d0d 100%);color:#e9f2ef;position:relative}
.top{height:150px;display:flex;align-items:center;gap:26px;padding:40px 40px 0;background:linear-gradient(#1d2e2c,#152321)}
.av{width:84px;height:84px;border-radius:50%;background:radial-gradient(circle at 50% 38%,#d4e4ea 0 22%,transparent 23%),radial-gradient(ellipse at 50% 100%,#d4e4ea 0 45%,#7f97a2 46%);}
.nm{font-size:44px;font-weight:600}.st{font-size:26px;color:#8fb3a8;margin-top:4px}
.chat{position:absolute;top:150px;bottom:150px;left:0;right:0;background-image:radial-gradient(circle,#ffffff0a 2px,transparent 3px);background-size:46px 46px}
.day{position:absolute;top:40px;left:50%;transform:translateX(-50%);font-size:24px;color:#9db;background:#ffffff12;padding:8px 20px;border-radius:18px}
.in{position:absolute;left:40px;top:150px;max-width:460px;background:#22302f;border-radius:8px 30px 30px 30px;padding:22px 30px;font-size:40px}
.bub{position:absolute;right:36px;bottom:60px;background:#1f7a52;border-radius:30px 8px 30px 30px;padding:26px 34px 18px;font-size:64px;font-weight:600;
  box-shadow:0 8px 24px #0006;opacity:${sent ? .38 : 0}}
.bub small{display:block;text-align:right;font-size:24px;color:#cfe;font-weight:400;margin-top:2px}
.bar{position:absolute;bottom:0;left:0;right:0;height:150px;display:flex;align-items:center;gap:20px;padding:0 28px 26px;background:#0f1918}
.field{flex:1;height:92px;border-radius:46px;background:#1f2b2a;display:flex;align-items:center;padding:0 36px;font-size:50px;font-weight:600}
.caret{width:4px;height:52px;background:#6fe0a6;margin-left:6px}
.send{width:96px;height:96px;border-radius:50%;background:#2fae6e;display:grid;place-items:center;box-shadow:0 0 ${typed ? 34 : 0}px #2fae6e}
.send svg{width:46px;height:46px}</style>
<div class="top"><div class="av"></div><div><div class="nm">ఫ్రెండ్</div><div class="st">ఆన్‌లైన్</div></div></div>
<div class="chat"><div class="day">ఈరోజు</div><div class="in">గుడ్ నైట్</div>
<div class="bub">హాయ్<small>9:41 ◷</small></div></div>
<div class="bar"><div class="field">${typed ? 'హాయ్<span class="caret"></span>' : ''}</div>
<div class="send"><svg viewBox="0 0 24 24"><path d="M3 20 21 12 3 4l2 7 9 1-9 1z" fill="#fff"/></svg></div></div>`;
const card = `<!doctype html><meta charset="utf-8"><style>${base.replace(`width:${W}px;height:${H}px`, 'width:640px;height:320px')}
body{background:transparent;display:grid;place-items:center}
.b{width:560px;height:240px;border-radius:120px;background:linear-gradient(160deg,#2fc07c,#1a7a4e);display:flex;align-items:center;justify-content:center;gap:24px;
  color:#fff;font-size:118px;font-weight:700;text-shadow:0 4px 10px #0005}
.t{font-size:40px;font-weight:400;opacity:.8;align-self:flex-end;margin-bottom:46px}</style><div class="b">హాయ్<span class="t">9:41</span></div>`;

const jobs = [['screen-typed.png', screen({typed: true, sent: false}), W, H, true],
  ['screen-sent.png', screen({typed: false, sent: true}), W, H, true],
  ['card.png', card, 640, 320, true]];
for (const [name, html, w, h, alpha] of jobs) {
  const page = await launch({width: w, height: h, browserArgs: ['--disable-gpu']});
  try {
    if (alpha) await page.call('Emulation.setDefaultBackgroundColorOverride', {color: {r: 0, g: 0, b: 0, a: 0}});
    await page.call('Page.navigate', {url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html)});
    await page.evaluate('new Promise(r=>{const go=()=>document.fonts.ready.then(()=>r(true)); document.readyState==="complete"?go():addEventListener("load",go)})');
    const shot = await page.call('Page.captureScreenshot', {format: 'png', clip: {x: 0, y: 0, width: w, height: h, scale: 1}});
    await writeFile(join(here, name), Buffer.from(shot.data, 'base64'));
    console.log('wrote', name);
  } finally { await page.close(); }
}
