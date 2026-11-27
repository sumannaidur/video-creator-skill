import { renderFixture } from '../../E05/render.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import './story-scenes.js';

const output = new URL('p009/', import.meta.url);
await mkdir(output, { recursive: true });
await renderFixture({
  chrome: process.argv[2],
  fixture: new URL('story.html', import.meta.url),
  output,
  selector: '[data-text]:not([hidden])',
  scenes: Object.keys(globalThis.paperScenes),
});

function luminance(hex) {
  const channels = hex.match(/../g).map(x => parseInt(x,16)/255)
    .map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
  return channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
}
const contrast = [['252A30','F4EFE4'],['252A30','DAD6CC'],['252A30','FFF9EE'],['F4EFE4','252A30']]
  .map(([foreground, background]) => {
    const pair = [luminance(foreground), luminance(background)].sort((a,b) => b-a);
    return {foreground,background,ratio:(pair[0]+.05)/(pair[1]+.05)};
  });
const file = new URL('render-evidence.json', output);
const evidence = JSON.parse(await readFile(file,'utf8'));
evidence.contrast = { minimum:4.5, pairs:contrast };
evidence.scenes = Object.fromEntries(Object.entries(globalThis.paperScenes).map(([id,scene]) =>
  [id, {locale:scene.locale, objects:scene.objects.length, relationships:scene.relationships.length, cues:scene.cues.length}]));
await writeFile(file,JSON.stringify(evidence,null,2)+'\n');
if (contrast.some(({ratio})=>ratio<4.5)) throw new Error('Text contrast below 4.5:1');
