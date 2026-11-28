// Headless Chromium driver over the DevTools protocol (Node 22+ built-in WebSocket; no dependencies).
// Ported from the tested experiments/E05/render.mjs launcher (same flags, isolated temporary profile, device scale 1).
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const CANDIDATES = [process.env.VC_CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];

export function findChrome(explicit) {
  const found = [explicit, ...CANDIDATES].find(path => path && existsSync(path));
  if (!found) throw Object.assign(new Error('No Chromium-family browser found; pass --chrome or set VC_CHROME'), {stage: 'render', code: 'missing-browser'});
  return found;
}

// Network isolation (P026.2): rendered pages may load only local content. Every page request passes through the DevTools
// Fetch domain: file:, data:, blob: and about: continue, anything else is failed before it leaves the browser and recorded.
// The next evaluate() then throws [network-blocked], so a render or preflight that needed a remote asset fails explicitly
// instead of rendering without it. Host-name resolution is also disabled (second layer, also covering non-HTTP schemes).
// The DevTools connection itself is made by Node to 127.0.0.1 and is not affected.
export const LOCAL_SCHEMES = /^(file|data|blob|about):/i;
const redactUrl = url => { try { const u = new URL(url); return `${u.protocol}//${u.host}${u.pathname}`; } catch { return String(url).split('?')[0]; } };

export async function launch({chrome, width, height, browserArgs = []}) {
  const profile = await mkdtemp(join(tmpdir(), 'vc-chrome-'));
  const browser = spawn(findChrome(chrome), ['--headless', '--remote-debugging-port=0', '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--user-data-dir=' + profile,
    '--host-resolver-rules=MAP * ~NOTFOUND', ...browserArgs, 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let ws;
  const close = async () => { ws?.close(); browser.kill(); await rm(profile, {recursive: true, force: true}).catch(() => {}); };
  try {
    let port;
    for (let attempt = 0; attempt < 100 && !port; attempt++) {
      port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '')).split('\n')[0];
      if (!port) await delay(100);
    }
    if (!port) throw new Error('Chrome DevTools did not start');
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`, {signal: AbortSignal.timeout(5000)}).then(r => r.json());
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await once(ws, 'open');
    let id = 0;
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const request = ++id;
      const timer = setTimeout(() => { ws.removeEventListener('message', receive); reject(new Error(method + ' timed out')); }, 12000);
      function receive(event) {
        const message = JSON.parse(event.data);
        if (message.id !== request) return;
        clearTimeout(timer);
        ws.removeEventListener('message', receive);
        message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
      }
      ws.addEventListener('message', receive);
      ws.send(JSON.stringify({id: request, method, params}));
    });
    const version = (await call('Browser.getVersion')).product;
    const blocked = [];
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method !== 'Fetch.requestPaused') return;
      const {requestId, request} = message.params;
      const allow = LOCAL_SCHEMES.test(request.url);
      if (!allow) blocked.push(redactUrl(request.url));
      ws.send(JSON.stringify({id: ++id, method: allow ? 'Fetch.continueRequest' : 'Fetch.failRequest', params: allow ? {requestId} : {requestId, errorReason: 'BlockedByClient'}}));
    });
    await call('Fetch.enable', {patterns: [{urlPattern: '*'}]});
    await call('DOM.enable'); await call('CSS.enable'); await call('Page.enable');
    await call('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false});
    const evaluate = async expression => {
      const reply = await call('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      if (blocked.length) throw Object.assign(new Error(`[network-blocked] the rendered page requested non-local resources, which are not allowed: ${[...new Set(blocked)].slice(0, 5).join(', ')}`), {code: 'network-blocked'});
      if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception?.description || 'Browser evaluation failed');
      return reply.result.value;
    };
    return {call, evaluate, version, close, blocked};
  } catch (error) { await close(); throw error; }
}
