// P012.2 Paper Explainer V2: 30 fps H.264/AAC from a 1080×1920 canvas.
// Usage (repository root): node experiments/E10/p012.2/render-shots.mjs full|preview [chrome.exe]
import { renderFixture } from '../../E05/render.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const mode = process.argv[2] ?? 'full';
const profile = {full: {scale: 1, quality: 95, crf: 18, name: 'trees-v2-1080x1920.mp4'},
  preview: {scale: .5, quality: 90, crf: 21, name: 'trees-v2-preview.mp4'}}[mode];
if (!profile) throw new Error('Mode must be full or preview');
const fps = 30, {scale, quality, crf, name} = profile;
const out = new URL('.', import.meta.url);
const root = new URL('../../../', import.meta.url);
const timeline = JSON.parse(await readFile(new URL('experiments/E04/native-timing/outputs/sample-B-candidate.timeline.json', root), 'utf8'));
const audioFile = new URL(timeline.audio.path, root);
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
if (hash(await readFile(audioFile)) !== timeline.audio.sha256) throw new Error('Sample B audio does not match its timeline hash');
const shots = await readFile(new URL('shots.js', import.meta.url), 'utf8');
const [width, height] = [1080, 1920];
const elapsed = performance.now();
const evidence = {mode, fps, canvas: [width, height], output: [width * scale, height * scale],
  audio: {path: timeline.audio.path, sha256: timeline.audio.sha256, timingStatus: timeline.validation}, keyframes: []};

await renderFixture({
  chrome: process.argv[3],
  fixture: new URL('../../E06/paper-explainer/story.html', import.meta.url),
  sizes: [['vertical', width, height]],
  browserArgs: ['--disable-gpu'],
  async capture({ call }) {
    const evaluate = async expression => {
      const reply = await call('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception?.description || 'Browser evaluation failed');
      return reply.result.value;
    };
    let ready;
    for (let tries = 0; tries < 50 && !ready; tries++) {
      ready = await evaluate('document.readyState==="complete" && typeof renderPaperScene==="function" ? document.fonts.ready.then(()=>true) : null');
      if (!ready) await delay(100);
    }
    if (!ready) throw new Error('Story fixture did not load');
    Object.assign(evidence, await evaluate(`(() => { ${shots}\n return installShots(${JSON.stringify(timeline)}); })()`));
    const seconds = await evaluate('paperShots.duration');
    const seek = t => evaluate(`(() => {
      const state=paperShots.renderAt(${t});
      const outside=[], box=el=>el.getBoundingClientRect();
      const safe=box(document.querySelector('[data-safe]')), stage=box(document.querySelector('.story-stage'));
      const inside=(r,b,m=1)=>r.left>=b.left-m&&r.top>=b.top-m&&r.right<=b.right+m&&r.bottom<=b.bottom+m;
      const shown=el=>{for(let n=el;n&&n!==document.body;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<=.005)return false}return true};
      if(!inside(stage,safe)) outside.push('stage');
      const footer=document.querySelector('footer');
      if(shown(footer)&&!inside(box(footer),safe)) outside.push('caption');
      const title=box(document.querySelector('h1'));
      if(title.width||title.height) outside.push('headline-visible');
      const labels=[];
      for(const el of document.querySelectorAll('[data-text]:not([hidden])')) {
        if(!shown(el)) continue;
        const r=box(el), range=document.createRange();
        range.selectNodeContents(el);
        if([...range.getClientRects()].some(q=>q.width&&(q.left<r.left-2||q.right>r.right+2||q.top<r.top-2||q.bottom>r.bottom+2))) outside.push('text-overflow:'+el.textContent);
        if(el.classList.contains('piece-label')) {
          labels.push({id:el.parentElement.id,x:r.x,y:r.y,width:r.width,height:r.height});
          if(!inside(r,stage,0)) outside.push('label-clipped:'+el.textContent);
        }
      }
      for(const el of document.querySelectorAll('.piece.plate')) if(el.id.endsWith('-sky')||el.id==='s2-bg') {
        if(!inside(stage,box(el),.5)) outside.push('plate-gap:'+el.id);
      }
      if(document.documentElement.scrollWidth!==innerWidth||document.documentElement.scrollHeight!==innerHeight) outside.push('viewport');
      const opacity=Object.fromEntries([...document.querySelectorAll('.piece')].map(el=>[el.id,Number(el.style.opacity)]));
      return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({...state,labels,opacity,outside}))));
    })()`);
    const shot = async (format = 'png', s = scale) => Buffer.from((await call('Page.captureScreenshot', {
      format, fromSurface: true, ...(format === 'jpeg' ? {quality} : {}), clip: {x: 0, y: 0, width, height, scale: s},
    })).data, 'base64');

    // Cue checks: each anchored object is hidden just before its cue and visible after it.
    evidence.cueChecks = [];
    for (const c of evidence.cues) {
      const before = (await seek(c.at - .02)).opacity[c.id] ?? 0;
      const after = (await seek(c.at + .6)).opacity[c.id] ?? 0;
      const phraseStart = evidence.phrases[c.phrase - 1].start;
      evidence.cueChecks.push({...c, phraseStart, before, after});
      if (before > .01 || after < .5 || c.at < phraseStart) throw new Error('Cue check failed: ' + JSON.stringify(evidence.cueChecks.at(-1)));
    }
    const [cut1, cut2] = evidence.cuts;
    const keys = [['opening', .45], ['shade', 1.55], ['leaf-dissolve', cut1 + .03], ['water', 2.9], ['vapour', 3.75],
      ['paper-wipe', cut2 - .05], ['paper-wipe-mid', cut2], ['street-heat', 5.45], ['cooling', 6.9], ['end', seconds]];
    const pngs = {};
    for (const [key, t] of keys) {
      const state = await seek(t);
      if (state.outside.length) throw new Error(`Bounds at ${t}: ${state.outside.join(', ')}`);
      const png = await shot();
      pngs[key] = png;
      if (mode === 'full') await writeFile(new URL(`key-${evidence.keyframes.length + 1}-${key}.png`, out), png);
      evidence.keyframes.push({name: key, t, shot: state.shot, captionId: state.captionId, transition: state.transition, labels: state.labels, sha256: hash(png)});
    }
    const replay = await seek(3.75);
    const replayPng = await shot();
    const first = evidence.keyframes.find(k => k.name === 'vapour');
    evidence.repeatability = {seconds: 3.75, sameFrame: hash(replayPng) === first.sha256,
      sameLabels: JSON.stringify(replay.labels) === JSON.stringify(first.labels)};
    if (!evidence.repeatability.sameLabels) throw new Error('Seek repeatability failed');
    if (!evidence.repeatability.sameFrame) {
      // Record the size of any raster difference instead of hiding it.
      const ref = fileURLToPath(new URL('repeatability-first.png', out)), again = fileURLToPath(new URL('repeatability-replay.png', out));
      await writeFile(ref, pngs.vapour);
      await writeFile(again, replayPng);
      const ssim = spawnSync('ffmpeg', ['-hide_banner', '-i', ref, '-i', again, '-lavfi', 'ssim', '-f', 'null', '-'], {encoding: 'utf8', windowsHide: true}).stderr;
      evidence.repeatability.ssim = Number(ssim.match(/All:([\d.]+)/)?.[1]);
      if (!(evidence.repeatability.ssim > .999)) throw new Error('Seek repeatability SSIM too low: ' + evidence.repeatability.ssim);
    }

    if (process.env.KEYS_ONLY) return;
    const frames = Math.ceil(seconds * fps);
    const ffmpeg = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', '-',
      '-i', fileURLToPath(audioFile), '-map', '0:v', '-map', '1:a',
      '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf),
      '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(fps),
      '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-af', 'apad', '-shortest', '-movflags', '+faststart',
      fileURLToPath(new URL(name, out))], {stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true});
    const finished = once(ffmpeg, 'exit');
    const seen = {shots: new Set(), captions: new Set(), transitions: new Set()};
    try {
      for (let i = 0; i < frames; i++) {
        const state = await seek(i / fps);
        if (state.outside.length) throw new Error(`Frame ${i} bounds: ${state.outside.join(', ')}`);
        if (i / fps > cut1 && state.opacity['q-tag'] !== undefined) throw new Error('Opening tag persisted');
        seen.shots.add(state.shot); if (state.captionId) seen.captions.add(state.captionId); if (state.transition) seen.transitions.add(state.transition);
        const jpeg = await shot('jpeg');
        await new Promise((ok, fail) => ffmpeg.stdin.write(jpeg, error => error ? fail(error) : ok()));
      }
    } finally {
      ffmpeg.stdin.end();
      const [code] = await finished;
      if (code !== 0) throw new Error('FFmpeg encoding failed: ' + code);
    }
    Object.assign(evidence, {file: name, frames, seconds, boundsChecked: frames + keys.length,
      shotsSeen: [...seen.shots], captionsSeen: [...seen.captions], transitionsSeen: [...seen.transitions]});
  },
});

if (process.env.KEYS_ONLY) { console.log(JSON.stringify(evidence.cueChecks)); process.exit(0); }
const file = fileURLToPath(new URL(name, out));
const run = args => {
  const result = spawnSync(args[0], args.slice(1), {encoding: 'utf8', windowsHide: true});
  if (result.status !== 0) throw new Error(args[0] + ' failed: ' + result.stderr);
  return result.stdout + result.stderr;
};
const probe = JSON.parse(run(['ffprobe', '-v', 'error', '-count_frames', '-show_entries',
  'stream=codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_read_frames,sample_rate,channels,start_time,duration:format=duration',
  '-of', 'json', file]));
const decode = run(['ffmpeg', '-hide_banner', '-v', 'error', '-i', file, '-f', 'null', '-']).trim();
const onset = source => Number(run(['ffmpeg', '-hide_banner', '-i', source, '-af', 'silencedetect=noise=-40dB:d=0.2', '-f', 'null', '-'])
  .match(/silence_end: ([\d.]+)/)?.[1]);
const [video, sound] = ['video', 'audio'].map(type => probe.streams.find(s => s.codec_type === type));
evidence.media = {video, audio: sound, container: probe.format, decodeErrors: decode || null,
  speechOnset: {sourceWav: onset(fileURLToPath(audioFile)), mp4: onset(file)}};
evidence.media.speechOnset.offsetSeconds = evidence.media.speechOnset.mp4 - evidence.media.speechOnset.sourceWav;
evidence.renderWallSeconds = (performance.now() - elapsed) / 1000;
await writeFile(new URL(mode + '-evidence.json', out), JSON.stringify(evidence, null, 2) + '\n');
const failures = [];
if (video?.codec_name !== 'h264' || sound?.codec_name !== 'aac') failures.push('codecs');
if (video.pix_fmt !== 'yuv420p') failures.push('pixel format');
if (video.width !== evidence.output[0] || video.height !== evidence.output[1]) failures.push('dimensions');
if (video.r_frame_rate !== `${fps}/1` || Number(video.nb_read_frames) !== evidence.frames) failures.push('frames');
if (Math.abs(Number(video.duration) - Number(sound.duration)) > 1 / fps + .03) failures.push('stream duration');
if (decode) failures.push('decode');
if (!(Math.abs(evidence.media.speechOnset.offsetSeconds) <= .03)) failures.push('audio onset');
if (evidence.shotsSeen.length !== 3 || evidence.captionsSeen.length !== 3 || evidence.transitionsSeen.length !== 2) failures.push('coverage');
if (failures.length) throw new Error('Media checks failed: ' + failures.join(', '));
console.log(`${name}: ${evidence.frames} frames, ${Number(probe.format.duration).toFixed(3)} s, ${evidence.renderWallSeconds.toFixed(1)} s wall`);
