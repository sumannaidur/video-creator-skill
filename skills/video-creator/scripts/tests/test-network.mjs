// P026.2: rendered pages are network-isolated. Positive: a file:// page with a local image and a data: image loads and
// evaluates normally. Negative: fetch() to a remote host, and an <img> to an IP literal (TEST-NET-2, never routed), are
// failed inside the browser and the next evaluate() throws [network-blocked]. No request leaves the machine.
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch } from '../lib/chrome.mjs';

const dir = await mkdtemp(join(tmpdir(), 'vc-net-'));
const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
await writeFile(join(dir, 'local.png'), png1x1);
await writeFile(join(dir, 'page.html'), `<!doctype html><img id="a" src="local.png"><img id="b" src="data:image/png;base64,${png1x1.toString('base64')}">`);
const fresh = async () => {
  const page = await launch({width: 320, height: 240, browserArgs: ['--disable-gpu']});
  await page.call('Page.navigate', {url: pathToFileURL(join(dir, 'page.html')).href});
  for (let i = 0; i < 50 && await page.evaluate('document.readyState') !== 'complete'; i++) await new Promise(r => setTimeout(r, 100));
  return page;
};
try {
  // positive: local file and data: images decode; nothing blocked
  let page = await fresh();
  assert.deepEqual(await page.evaluate(`[...document.images].map(i => i.complete && i.naturalWidth)`), [1, 1]);
  assert.equal(page.blocked.length, 0);
  await page.close();

  // negative 1: fetch() to a remote host
  page = await fresh();
  await assert.rejects(page.evaluate(`fetch('https://example.com/asset.png?token=SECRET').then(() => 'loaded', () => 'failed')`), e => e.code === 'network-blocked' && !/SECRET/.test(e.message) && /example\.com\/asset\.png/.test(e.message));
  await page.close();

  // negative 2: an image from an IP literal; the failure surfaces on the next evaluate
  page = await fresh();
  await page.evaluate(`new Promise(r => { const i = new Image(); i.onload = i.onerror = () => r(0); i.src = 'http://198.51.100.7/remote.png'; document.body.append(i); })`).catch(e => e);
  await assert.rejects(page.evaluate('1'), e => e.code === 'network-blocked' && /198\.51\.100\.7/.test(e.message));
  assert.ok(page.blocked.length >= 1);
  await page.close();
  console.log('Network isolation fixtures passed.');
} finally {
  await rm(dir, {recursive: true, force: true});
}
