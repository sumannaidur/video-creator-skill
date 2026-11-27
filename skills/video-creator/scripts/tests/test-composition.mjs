import assert from 'node:assert/strict';
import { launch } from '../lib/chrome.mjs';
import { inspectComposition } from '../lib/composition.mjs';

const page = await launch({width: 320, height: 240, browserArgs: ['--disable-gpu']});
try {
  const html = `<main class="story-stage" style="position:fixed;inset:0">
    <div id="subject" style="position:absolute;left:10px;top:50px;width:85px;height:55px;background:gray"></div>
    <div id="label" style="position:absolute;left:145px;top:55px">
      <span class="piece-label" style="display:block;color:black;background:white">संकेत</span>
    </div>
    <svg width="320" height="240"><path id="leader" d="M95 62H145" stroke="black"/></svg>
    <footer style="position:absolute;top:190px"><span class="ct">Caption</span></footer>
  </main>`;
  await page.evaluate(`document.body.innerHTML = ${JSON.stringify(html)}`);
  const spec = {regions:[{id:'subject'}], annotations:[{id:'label',target:'subject',leader:'leader'}]};
  const check = (declaration=spec,is3D=false) => page.evaluate(`(${inspectComposition})(${JSON.stringify(declaration)},${is3D})`);
  const expect = async (name, status, declaration=spec, is3D=false) => {
    const report = await check(declaration,is3D);
    assert.ok(report.findings.some(f => f.check === name && f.status === status), JSON.stringify(report));
  };
  assert.equal((await check()).status,'passed');
  assert.equal((await check({})).status,'not-declared');
  await expect('mesh-occlusion','unsupported',spec,true);
  await page.evaluate(`document.querySelector('#leader').setAttribute('d', 'M110 62H145')`);
  await expect('anchor','failed');
  await page.evaluate(`document.querySelector('#leader').setAttribute('d', 'M95 62H145');
    document.querySelector('.piece-label').style.color='#cccccc'`);
  await expect('contrast','failed');
  await page.evaluate(`document.querySelector('.piece-label').style.background='transparent'`);
  await expect('contrast','unsupported');
  await page.evaluate(`document.querySelector('.piece-label').style='display:block;color:black;background:white';
    document.querySelector('#subject').style.left='-20px';
    document.querySelector('footer').style.top='55px'`);
  await expect('crop','failed');
  await expect('overlap','failed');
  const allowed = {regions:spec.regions, allow:[
    {check:'crop',id:'subject',reason:'Deliberate close-up'},
    {check:'overlap',id:'subject',with:'@caption',reason:'Caption covers decorative edge'},
  ]};
  assert.equal((await check(allowed)).status,'passed');
  await expect('crop','allowed',allowed);
  await expect('overlap','allowed',allowed);
  await page.evaluate(`document.querySelector('#subject').style.display='none'`);
  await expect('visibility','failed',allowed);
  console.log('Composition browser fixtures passed.');
} finally {
  await page.close();
}
