import { renderFixture } from '../../E05/render.mjs';
import { readFile, writeFile } from 'node:fs/promises';

await renderFixture({
  chrome: process.argv[2],
  fixture: new URL('preview.html', import.meta.url),
  output: new URL('.', import.meta.url),
  selector: '[data-text]',
  scenes: ['hook','mechanism','closing'],
});

// Contrast checks cover the authored solid text surfaces. Paper texture is
// checked conservatively at its darkest dot on the base paper color.
const colors = { ink:'#252A30', paper:'#F4EFE4', texturedPaper:'#e0dacb', card:'#FFF9EE', mustard:'#DAB357' };
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(x => parseInt(x,16)/255)
    .map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
  return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722;
}
const contrast = [['ink','paper'],['ink','texturedPaper'],['ink','card'],['ink','mustard'],['paper','ink']]
  .map(([text,background]) => {
    const values = [luminance(colors[text]), luminance(colors[background])].sort((a,b)=>b-a);
    return {text,background,ratio:(values[0]+.05)/(values[1]+.05)};
  });
const evidenceURL = new URL('render-evidence.json',import.meta.url);
const evidence = JSON.parse(await readFile(evidenceURL,'utf8'));
evidence.contrast = {colors,pairs:contrast,minimum:4.5};
await writeFile(evidenceURL,JSON.stringify(evidence,null,2)+'\n');
if (contrast.some(({ratio})=>ratio<4.5)) throw new Error('Text contrast below 4.5:1');
