// Render and inspect the fixture with an isolated Chrome DevTools session.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export async function renderFixture({
  chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  fixture = new URL('typography.html', import.meta.url),
  output = new URL('.', import.meta.url),
  selector = '.specimen,.caption,.latin,.fallback',
  scenes = [null],
  sizes = [['vertical',1080,1920], ['horizontal',1920,1080]],
  capture,
  browserArgs = [],
} = {}) {
const profile = await mkdtemp(join(tmpdir(), 'e05-chrome-'));
const browser = spawn(chrome, ['--headless', '--remote-debugging-port=0', '--no-first-run',
  '--no-default-browser-check', '--disable-background-networking', '--user-data-dir=' + profile,
  ...browserArgs, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
  let port;
  for (let attempt = 0; attempt < 100 && !port; attempt++) {
    port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '')).split('\n')[0];
    if (!port) await delay(100);
  }
  if (!port) throw new Error('Chrome DevTools did not start');
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(5000) }).then(r => r.json());
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await once(ws, 'open');
  let id = 0;
  function call(method, params = {}) {
    const request = ++id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { ws.removeEventListener('message', receive); reject(new Error(method + ' timed out')); }, 12000);
      function receive(event) {
        const message = JSON.parse(event.data);
        if (message.id !== request) return;
        clearTimeout(timer);
        ws.removeEventListener('message', receive);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      }
      ws.addEventListener('message', receive);
      ws.send(JSON.stringify({ id: request, method, params }));
    });
  }
  const version = await call('Browser.getVersion');
  await call('DOM.enable');
  await call('CSS.enable');
  await call('Page.enable');
  const evidence = { browser: version.product, profile: 'temporary isolated profile', layouts: [] };
  for (const scene of scenes) {
  for (const [name, width, height] of sizes) {
    await call('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:false});
    const url = new URL(fixture);
    if (scene) url.searchParams.set('scene',scene);
    await call('Page.navigate', {url:url.href});
    if (capture) {
      await capture({call,width,height,name});
      continue;
    }
    let layout;
    for (let attempt = 0; attempt < 30 && !layout; attempt++) {
      const probe = await call('Runtime.evaluate', {awaitPromise:true,returnByValue:true,expression:`
        (async () => {
          if (document.readyState !== "complete" || location.href !== ${JSON.stringify(url.href)}) return null;
          await document.fonts.ready;
          const safe=document.querySelector("[data-safe]")?.getBoundingClientRect();
          const required=[...document.querySelectorAll("[data-required]")];
          const safeFailures=required.filter(el=>{
            const r=el.getBoundingClientRect();
            return !safe || !r.width || !r.height || r.left<safe.left-1 || r.right>safe.right+1 || r.top<safe.top-1 || r.bottom>safe.bottom+1;
          }).map(el=>el.getAttribute("data-required"));
          const missingAssets=[...document.images].filter(img=>!img.complete||!img.naturalWidth).length
            + [...document.querySelectorAll("use")].filter(el=>{
              const ref=el.getAttribute("href");
              return !ref?.startsWith("#") || !document.getElementById(ref.slice(1)) || !el.getBBox().width;
            }).length;
          return {viewport:[innerWidth,innerHeight], document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
            safeArea:safe?.toJSON(), safeFailures, missingAssets,
            blocks:[...document.querySelectorAll(${JSON.stringify(selector)})].map(el => {
              const box=el.getBoundingClientRect(), range=document.createRange();
              range.selectNodeContents(el);
              const rects=[...range.getClientRects()].filter(r=>r.width>0);
              const lines=[];
              for(const r of rects) {
                const mid=(r.top+r.bottom)/2;
                if(!lines.some(y=>Math.abs(y-mid)<15)) lines.push(mid);
              }
              const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
              const segments=new Intl.Segmenter(el.lang || "en",{granularity:"grapheme"});
              let splitGraphemes=0;
              for(let node=walker.nextNode();node;node=walker.nextNode()) {
                for(const {index,segment} of segments.segment(node.data)) {
                  if (!segment.trim()) continue;
                  range.setStart(node,index);
                  range.setEnd(node,index+segment.length);
                  const parts=[...range.getClientRects()].filter(r=>r.width>0);
                  if(parts.some(r=>Math.abs(r.top-parts[0].top)>15)) splitGraphemes++;
                }
              }
              return {text:el.textContent, lang:el.lang, className:el.className, lines:lines.length,
                splitGraphemes,
                overflow:rects.some(r=>r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1),
                outsideViewport:box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight};
            })};
        })()`});
      layout = probe.result.value;
      if (!layout) await delay(100);
    }
    if (!layout) throw new Error('Fixture did not finish loading');
    const { root } = await call('DOM.getDocument');
    const { nodeIds } = await call('DOM.querySelectorAll', {nodeId:root.nodeId,selector});
    for (const [i,nodeId] of nodeIds.entries()) {
      layout.blocks[i].fonts = (await call('CSS.getPlatformFontsForNode',{nodeId})).fonts;
    }
    const shot = await call('Page.captureScreenshot',{format:'png',fromSurface:true});
    const png = Buffer.from(shot.data,'base64');
    layout.png = [png.readUInt32BE(16), png.readUInt32BE(20)];
    if (layout.png[0] !== width || layout.png[1] !== height) throw new Error('Unexpected PNG dimensions');
    await writeFile(new URL((scene ? scene+'-' : '')+name+'.png',output),png);
    evidence.layouts.push({name,...(scene ? {scene} : {}),...layout});
  }
  }
  if (!capture) await writeFile(new URL('render-evidence.json',output),JSON.stringify(evidence,null,2)+'\n');
  if (evidence.layouts.some(({ viewport, document, blocks, safeFailures, missingAssets }) =>
    document.some((size,i) => size !== viewport[i]) || safeFailures.length || missingAssets ||
    blocks.some(block => block.overflow || block.outsideViewport || block.splitGraphemes || !block.fonts.length))) {
    throw new Error('Layout or font checks failed; see render-evidence.json');
  }
} finally {
  ws?.close();
  browser.kill();
}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await renderFixture({chrome:process.argv[2]});
}
