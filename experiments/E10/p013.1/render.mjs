// P013.1 generic Paper Explainer renderer with checkpointed frames.
// node experiments/E10/p013.1/render.mjs --topic <topic.js> --timeline <timeline.json> --out <dir> [options]
//   --name <file.mp4>       output name (default: video.mp4)
//   --width/--height <px>   layout canvas (default 1080×1920); --scale <0–1> output scale (default 1)
//   --fps <n>               frame rate (default 30); --quality <1–100> frame JPEG quality (default 95); --crf <0–51> (default 18)
//   --keys-only             render checks and keyframes only, no frames or MP4
//   --stop-after <n>        stop after rendering n new frames (exit 75), for recovery tests
//   --options <json>        JSON assigned to globalThis.paperTopicOptions before the topic loads
//   --clean-frames          delete the frame checkpoint after a fully validated MP4
//   --chrome <path>         Chromium executable
import { renderFixture } from '../../E05/render.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { appendFile, mkdir, readFile, readdir, rename, rm, stat, statfs, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export const INTERRUPTED = 75;
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const story = resolve(root, 'experiments/E06/paper-explainer');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const die = message => { const error = new Error(message); error.usage = true; throw error; };

function parseArgs(argv) {
  const flags = new Set(['keys-only', 'clean-frames']);
  const args = {name: 'video.mp4', width: 1080, height: 1920, scale: 1, fps: 30, quality: 95, crf: 18};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--')) die(`Unexpected argument ${argv[i]}`);
    if (flags.has(key)) { args[key] = true; continue; }
    if (i + 1 >= argv.length) die(`Missing value for --${key}`);
    args[key] = argv[++i];
  }
  const known = ['topic', 'timeline', 'out', 'name', 'width', 'height', 'scale', 'fps', 'quality', 'crf', 'keys-only', 'stop-after', 'options', 'chrome', 'clean-frames'];
  for (const key of Object.keys(args)) if (!known.includes(key)) die(`Unknown option --${key}`);
  for (const key of ['topic', 'timeline', 'out']) if (!args[key]) die(`--${key} is required`);
  const num = (key, ok) => { const v = Number(args[key]); if (!Number.isFinite(v) || !ok(v)) die(`Invalid --${key}: ${args[key]}`); args[key] = v; };
  num('width', v => Number.isInteger(v) && v >= 64 && v <= 4096);
  num('height', v => Number.isInteger(v) && v >= 64 && v <= 4096);
  num('scale', v => v > 0 && v <= 1);
  num('fps', v => Number.isInteger(v) && v >= 1 && v <= 60);
  num('quality', v => Number.isInteger(v) && v >= 1 && v <= 100);
  num('crf', v => Number.isInteger(v) && v >= 0 && v <= 51);
  if (args['stop-after'] !== undefined) num('stop-after', v => Number.isInteger(v) && v >= 1);
  args.output = [args.width * args.scale, args.height * args.scale];
  if (!args.output.every(v => Number.isInteger(v) && v % 2 === 0)) die(`Output ${args.output.join('×')} must be even whole pixels`);
  if (!/^[\w.-]+\.mp4$/.test(args.name)) die('--name must be a plain .mp4 file name');
  args.topic = resolve(args.topic); args.timeline = resolve(args.timeline); args.out = resolve(args.out);
  if (!args.topic.endsWith('.js') || !existsSync(args.topic)) die(`Topic module not found: ${args.topic}`);
  if (!existsSync(args.timeline)) die(`Timeline not found: ${args.timeline}`);
  if (args.options !== undefined) { try { args.options = JSON.parse(args.options); } catch { die('--options must be JSON'); } }
  return args;
}

const isJpeg = b => b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b.at(-2) === 0xff && b.at(-1) === 0xd9;
const frameName = i => String(i).padStart(6, '0') + '.jpg';

// Checkpoint: frames/manifest.json identifies the render configuration; frames/frames.jsonl is an
// append-only log of frames that were written atomically and passed the per-frame checks.
async function openCheckpoint(dir, manifest, total) {
  await mkdir(dir, {recursive: true});
  const stats = {reused: 0, missing: 0, corrupt: 0, invalidated: 0, strayTemp: 0};
  const files = await readdir(dir);
  for (const file of files.filter(f => /^\d{6}\.jpg\.tmp$/.test(f))) { await rm(join(dir, file)); stats.strayTemp++; }
  const previous = await readFile(join(dir, 'manifest.json'), 'utf8').then(JSON.parse).catch(() => null);
  if (previous?.configHash !== manifest.configHash) {
    const stale = files.filter(f => /^\d{6}\.jpg$/.test(f));
    for (const file of stale) await rm(join(dir, file));
    await rm(join(dir, 'frames.jsonl'), {force: true});
    stats.invalidated = stale.length;
  }
  await writeFile(join(dir, 'manifest.json.tmp'), JSON.stringify(manifest, null, 2) + '\n');
  await rename(join(dir, 'manifest.json.tmp'), join(dir, 'manifest.json'));
  const log = new Map();
  for (const line of (await readFile(join(dir, 'frames.jsonl'), 'utf8').catch(() => '')).split('\n')) {
    try { const entry = JSON.parse(line); if (Number.isInteger(entry.i)) log.set(entry.i, entry); } catch { /* torn final line */ }
  }
  const valid = new Map(), todo = [];
  let bytes = 0;
  for (let i = 0; i < total; i++) {
    const file = join(dir, frameName(i));
    const data = await readFile(file).catch(() => null);
    const entry = log.get(i);
    if (!data) { stats.missing++; todo.push(i); continue; }
    if (!entry || entry.sha256 !== hash(data) || !isJpeg(data)) { stats.corrupt++; todo.push(i); continue; }
    valid.set(i, entry); bytes += data.length; stats.reused++;
  }
  // Compact the log to verified entries; this also removes a torn final line left by an interruption.
  const logFile = join(dir, 'frames.jsonl');
  await writeFile(logFile + '.tmp', [...valid.values()].map(e => JSON.stringify(e) + '\n').join(''));
  await rename(logFile + '.tmp', logFile);
  return {stats, valid, todo, averageBytes: valid.size ? bytes / valid.size : null};
}

export async function ensureSpace(dir, needed) {
  const fs = await statfs(dir);
  const free = fs.bavail * fs.bsize;
  if (free < needed) throw new Error(`Insufficient storage in ${dir}: ${(free / 2 ** 20).toFixed(0)} MiB free, ~${(needed / 2 ** 20).toFixed(0)} MiB needed`);
  return free;
}

export async function render(argv) {
  const args = parseArgs(argv);
  const elapsed = performance.now();
  const timelineText = await readFile(args.timeline, 'utf8');
  let timeline;
  try { timeline = JSON.parse(timelineText); } catch { die('Timeline is not valid JSON'); }
  const audioFile = resolve(root, timeline?.audio?.path ?? '');
  if (!timeline?.audio?.path || !existsSync(audioFile)) die('Timeline audio file not found');
  if (hash(await readFile(audioFile)) !== timeline.audio.sha256) die('Audio does not match the timeline SHA-256');
  const engine = await readFile(join(here, 'paper-shots.js'), 'utf8');
  const topic = await readFile(args.topic, 'utf8');
  await mkdir(args.out, {recursive: true});
  // Every file that can change a frame's pixels or timing.
  const sources = {engine: join(here, 'paper-shots.js'), topic: args.topic, timeline: args.timeline, audio: audioFile,
    capture: resolve(root, 'experiments/E05/render.mjs'), renderer: fileURLToPath(import.meta.url),
    ...Object.fromEntries(['story.html', 'paper.css', 'story.css', 'story-scenes.js', 'story-view.js', 'story-motion.js'].map(f => [f, join(story, f)]))};
  const inputs = {};
  for (const [key, file] of Object.entries(sources)) inputs[key] = {path: file.slice(root.length + 1).replaceAll('\\', '/'), sha256: hash(await readFile(file))};
  const settings = {width: args.width, height: args.height, scale: args.scale, fps: args.fps, quality: args.quality,
    options: args.options ?? null, browserArgs: ['--disable-gpu'], deviceScaleFactor: 1};
  const evidence = {name: args.name, settings, inputs, output: args.output, keyframes: []};
  const framesDir = join(args.out, 'frames');
  const fps = args.fps, scale = args.scale, [width, height] = [args.width, args.height];

  await renderFixture({
    chrome: args.chrome,
    fixture: pathToFileURL(join(story, 'story.html')),
    sizes: [['canvas', width, height]],
    browserArgs: settings.browserArgs,
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
      evidence.browser = (await call('Browser.getVersion')).product;
      Object.assign(evidence, await evaluate(`(() => { ${engine}
        globalThis.paperTopicOptions = ${JSON.stringify(args.options ?? null)} ?? undefined;
        ${topic}
        return installPaperShots({timeline: ${JSON.stringify(timeline)}, topic: globalThis.paperTopic}); })()`));
      const seconds = evidence.duration;
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
        for(const el of document.querySelectorAll('.piece.plate.cover')) if(!inside(stage,box(el),.5)) outside.push('plate-gap:'+el.id);
        if(document.documentElement.scrollWidth!==innerWidth||document.documentElement.scrollHeight!==innerHeight) outside.push('viewport');
        for(const {id,after} of paperShots.checks.absentAfter) {
          const el=document.getElementById(id);
          if(${t}>after && el && Number(el.style.opacity)>.005) outside.push('present-after:'+id);
        }
        const opacity=Object.fromEntries([...document.querySelectorAll('.piece')].map(el=>[el.id,Number(el.style.opacity)]));
        return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({...state,labels,opacity,outside}))));
      })()`);
      const shot = async (format = 'png') => Buffer.from((await call('Page.captureScreenshot', {
        format, fromSurface: true, ...(format === 'jpeg' ? {quality: args.quality} : {}), clip: {x: 0, y: 0, width, height, scale},
      })).data, 'base64');

      evidence.cueChecks = [];
      for (const c of evidence.cues) {
        const before = (await seek(c.at - .02)).opacity[c.id] ?? 0;
        const after = (await seek(c.at + .6)).opacity[c.id] ?? 0;
        const phraseStart = evidence.phrases[c.phrase - 1].start;
        evidence.cueChecks.push({...c, phraseStart, before, after});
        if (before > .01 || after < .5 || c.at < phraseStart) throw new Error('Cue check failed: ' + JSON.stringify(evidence.cueChecks.at(-1)));
      }
      const keyDir = join(args.out, 'keyframes');
      await mkdir(keyDir, {recursive: true});
      const pngs = {};
      for (const [name, t] of evidence.checks.keyframes) {
        const state = await seek(t);
        if (state.outside.length) throw new Error(`Bounds at ${t}: ${state.outside.join(', ')}`);
        const png = await shot();
        pngs[name] = png;
        await writeFile(join(keyDir, `key-${evidence.keyframes.length + 1}-${name}.png`), png);
        evidence.keyframes.push({name, t, shot: state.shot, captionId: state.captionId, transition: state.transition, labels: state.labels, sha256: hash(png)});
      }
      const at = evidence.checks.repeatAt;
      // Nonsequential re-seek. When the time is a keyframe, compare against that capture (the keyframes end at a
      // later shot); otherwise capture it, then visit the end and the start before capturing again.
      const known = evidence.keyframes.find(k => k.t === at);
      let first, firstPng;
      if (known) { first = known; firstPng = pngs[known.name]; await seek(seconds); }
      else { first = await seek(at); firstPng = await shot(); await seek(seconds); await seek(0); }
      const again = await seek(at), againPng = await shot();
      evidence.repeatability = {seconds: at, sameFrame: hash(firstPng) === hash(againPng), sameLabels: JSON.stringify(first.labels) === JSON.stringify(again.labels)};
      if (!evidence.repeatability.sameLabels) throw new Error('Seek repeatability failed');
      if (!evidence.repeatability.sameFrame) {
        const a = join(keyDir, 'repeat-a.png'), b = join(keyDir, 'repeat-b.png');
        await writeFile(a, firstPng); await writeFile(b, againPng);
        const ssim = spawnSync('ffmpeg', ['-hide_banner', '-i', a, '-i', b, '-lavfi', 'ssim', '-f', 'null', '-'], {encoding: 'utf8', windowsHide: true}).stderr;
        evidence.repeatability.ssim = Number(ssim.match(/All:([\d.]+)/)?.[1]);
        if (!(evidence.repeatability.ssim > .999)) throw new Error('Seek repeatability SSIM too low: ' + evidence.repeatability.ssim);
        await rm(a); await rm(b);
      }
      if (args['keys-only']) return;

      const total = Math.ceil(seconds * fps);
      evidence.frames = total;
      const configHash = hash(JSON.stringify({inputs, settings, browser: evidence.browser, total}));
      const manifest = {version: 1, configHash, created: new Date().toISOString(), frames: total, settings, browser: evidence.browser, inputs};
      const checkpoint = await openCheckpoint(framesDir, manifest, total);
      evidence.checkpoint = {...checkpoint.stats, configHash, rendered: 0};
      // Size estimate from existing frames, else a conservative 0.5 byte per output pixel. No sample capture:
      // an extra capture would change raster history and make frame 0 differ from an uninterrupted render.
      const estimate = checkpoint.averageBytes ?? args.output[0] * args.output[1] * .5;
      evidence.checkpoint.freeBytesBefore = await ensureSpace(args.out, Math.ceil(checkpoint.todo.length * (estimate ?? 0) * 1.5 + total * (estimate ?? 0) * .2 + 64 * 2 ** 20));
      const log = join(framesDir, 'frames.jsonl');
      for (const i of checkpoint.todo) {
        if (args['stop-after'] !== undefined && evidence.checkpoint.rendered >= args['stop-after']) {
          const error = new Error(`Stopped after ${evidence.checkpoint.rendered} new frames (simulated interruption)`);
          error.code = INTERRUPTED; throw error;
        }
        const state = await seek(i / fps);
        if (state.outside.length) throw new Error(`Frame ${i} bounds: ${state.outside.join(', ')}`);
        const jpeg = await shot('jpeg');
        const file = join(framesDir, frameName(i));
        await writeFile(file + '.tmp', jpeg);
        await rename(file + '.tmp', file);
        const entry = {i, sha256: hash(jpeg), bytes: jpeg.length, shot: state.shot, caption: state.captionId, transition: state.transition};
        await appendFile(log, JSON.stringify(entry) + '\n');
        checkpoint.valid.set(i, entry);
        evidence.checkpoint.rendered++;
      }
      const entries = [...checkpoint.valid.values()];
      evidence.shotsSeen = [...new Set(entries.map(e => e.shot))];
      evidence.captionsSeen = [...new Set(entries.map(e => e.caption).filter(Boolean))];
      evidence.transitionsSeen = [...new Set(entries.map(e => e.transition).filter(Boolean))];
    },
  });
  if (args['keys-only']) {
    evidence.renderWallSeconds = (performance.now() - elapsed) / 1000;
    await writeFile(join(args.out, 'keys-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    return evidence;
  }

  // Encode only from a complete, verified frame set.
  const recheck = await openCheckpoint(framesDir, JSON.parse(await readFile(join(framesDir, 'manifest.json'), 'utf8')), evidence.frames);
  if (recheck.todo.length) throw new Error(`Frames incomplete or corrupt before encoding: ${recheck.todo.slice(0, 10).join(', ')}`);
  const file = join(args.out, args.name), partial = file.replace(/\.mp4$/, '.partial.mp4');
  const run = (cmd, list) => {
    const result = spawnSync(cmd, list, {encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 2 ** 20});
    if (result.status !== 0) throw new Error(cmd + ' failed: ' + result.stderr.slice(-2000));
    return result.stdout + result.stderr;
  };
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(fps), '-start_number', '0',
    '-i', join(framesDir, '%06d.jpg'), '-i', audioFile, '-map', '0:v', '-map', '1:a',
    '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(args.crf),
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-af', 'apad', '-shortest', '-movflags', '+faststart', partial]);
  await rename(partial, file);

  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_entries',
    'stream=codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_read_frames,sample_rate,channels,start_time,duration:format=duration',
    '-of', 'json', file]));
  const decode = run('ffmpeg', ['-hide_banner', '-v', 'error', '-i', file, '-f', 'null', '-']).trim();
  const onset = source => Number(run('ffmpeg', ['-hide_banner', '-i', source, '-af', 'silencedetect=noise=-40dB:d=0.2', '-f', 'null', '-'])
    .match(/silence_end: ([\d.]+)/)?.[1]);
  const [video, sound] = ['video', 'audio'].map(type => probe.streams.find(s => s.codec_type === type));
  evidence.media = {video, audio: sound, container: probe.format, decodeErrors: decode || null,
    speechOnset: {sourceWav: onset(audioFile), mp4: onset(file)}, bytes: (await stat(file)).size};
  evidence.media.speechOnset.offsetSeconds = evidence.media.speechOnset.mp4 - evidence.media.speechOnset.sourceWav;
  evidence.renderWallSeconds = (performance.now() - elapsed) / 1000;
  const failures = [];
  if (video?.codec_name !== 'h264' || sound?.codec_name !== 'aac') failures.push('codecs');
  if (video?.pix_fmt !== 'yuv420p') failures.push('pixel format');
  if (video?.width !== args.output[0] || video?.height !== args.output[1]) failures.push('dimensions');
  if (video?.r_frame_rate !== `${fps}/1` || Number(video?.nb_read_frames) !== evidence.frames) failures.push('frames');
  if (Math.abs(Number(video?.duration) - Number(sound?.duration)) > 1 / fps + .03) failures.push('stream duration');
  if (decode) failures.push('decode');
  if (!(Math.abs(evidence.media.speechOnset.offsetSeconds) <= .03)) failures.push('audio onset');
  const expectedTransitions = new Set(evidence.shots.filter(s => s.transition).map(s => s.transition.type));
  if (evidence.shotsSeen.length !== evidence.shots.length || evidence.captionsSeen.length !== evidence.captions.length ||
    evidence.transitionsSeen.length !== expectedTransitions.size) failures.push('coverage');
  evidence.failures = failures;
  await writeFile(join(args.out, basename(args.name, '.mp4') + '-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  if (failures.length) throw new Error('Media checks failed: ' + failures.join(', '));
  if (args['clean-frames']) await rm(framesDir, {recursive: true});
  return evidence;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const evidence = await render(process.argv.slice(2));
    const c = evidence.checkpoint;
    console.log(evidence.media
      ? `${evidence.name}: ${evidence.frames} frames, ${Number(evidence.media.container.duration).toFixed(3)} s; reused ${c.reused}, rendered ${c.rendered}, corrupt ${c.corrupt}, missing ${c.missing}, invalidated ${c.invalidated}; ${evidence.renderWallSeconds.toFixed(1)} s wall`
      : `keyframes only: ${evidence.keyframes.length} keyframes, ${evidence.cueChecks.length} cue checks passed`);
  } catch (error) {
    console.error((error.usage ? 'Usage error: ' : '') + error.message);
    process.exit(error.code === INTERRUPTED ? INTERRUPTED : error.usage ? 2 : 1);
  }
}
