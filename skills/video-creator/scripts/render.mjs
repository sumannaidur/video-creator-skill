// Video Creator core renderer: style-agnostic checkpointed frame rendering, encoding and media validation.
// Packaged from experiments/E10/p013.1/render.mjs (P014.3A). The visual style is a pluggable backend (references/rendering.md).
//
// node scripts/render.mjs --topic <topic module> --timeline <timeline.json> --out <dir> [options]
//   --project <dir>        base for relative --topic/--timeline/--out and the timeline audio path (default: current folder)
//   --style <name>         backend in scripts/styles/<name>/backend.mjs (default: paper-explainer); or --backend <file.mjs>
//   --locale <bcp47>       document language for shaping/captions (default: from the topic, else und)
//   --font <css family>    caption/label font family (default: backend default)
//   --name <file.mp4>      output name (default: video.mp4)
//   --width/--height <px>  layout canvas (default 1080×1920; use 1920×1080 for horizontal); --scale <0–1> output scale
//   --fps <n> (30) --quality <1–100> (95) --crf <0–51> (18)
//   --keys-only            checks and keyframes only; --stop-after <n> simulate interruption (exit 75)
//   --plan <resolved-plan.json>  verified resolved creative plan (project-relative); shot bounds and speech cues come from it
//   --preflight <preflight.json>  refuse to render unless that preflight passed for exactly this configuration
//   --captions <captions.json>  caption artifact from scripts/captions.py (timing, text, burn-in, line limit); --no-captions hides captions
//   --options <json>       topic options; --chrome <path> browser; --clean-frames delete checkpoint after validated MP4
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { appendFile, mkdir, open, readFile, readdir, rename, rm, stat, statfs, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RENDER_PLAN, checkCueUse, loadRenderPlan } from './lib/resolved-plan.mjs';
import { CAPTIONS, HIDDEN, loadCaptions } from './lib/captions.mjs';

export const INTERRUPTED = 75, LOCKED = 3;
const here = dirname(fileURLToPath(import.meta.url));
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const die = (message, code = 'usage') => { throw Object.assign(new Error(message), {usage: code === 'usage', code}); };

export function parseArgs(argv) {
  const flags = new Set(['keys-only', 'clean-frames', 'no-captions']);
  const args = {name: 'video.mp4', width: 1080, height: 1920, scale: 1, fps: 30, quality: 95, crf: 18, style: 'paper-explainer'};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--')) die(`Unexpected argument ${argv[i]}`);
    if (flags.has(key)) { args[key] = true; continue; }
    if (i + 1 >= argv.length) die(`Missing value for --${key}`);
    args[key] = argv[++i];
  }
  const known = ['topic', 'timeline', 'out', 'project', 'style', 'backend', 'locale', 'font', 'name', 'width', 'height', 'scale', 'fps',
    'quality', 'crf', 'keys-only', 'stop-after', 'options', 'chrome', 'clean-frames', 'plan', 'preflight', 'captions', 'no-captions'];
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
  if (args.locale !== undefined && !/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(args.locale)) die('--locale must be a BCP 47 tag');
  if (args.style && !/^[a-z0-9-]+$/.test(args.style)) die('--style must be a lowercase style name');
  args.project = resolve(args.project ?? '.');
  const at = p => isAbsolute(p) ? p : resolve(args.project, p);
  args.topic = at(args.topic); args.timeline = at(args.timeline); args.out = at(args.out);
  if (!/\.(m?js)$/.test(args.topic) || !existsSync(args.topic)) die(`Topic module not found: ${args.topic}`);
  if (!existsSync(args.timeline)) die(`Timeline not found: ${args.timeline}`);
  if (args.preflight !== undefined) { args.preflight = at(args.preflight); if (!existsSync(args.preflight)) die(`Preflight result not found: ${args.preflight}`); }
  if (args.captions !== undefined) { if (args['no-captions']) die('--captions and --no-captions are exclusive'); args.captions = at(args.captions); if (!existsSync(args.captions)) die(`Caption artifact not found: ${args.captions}`); }
  if (args.plan !== undefined) { args.plan = at(args.plan); if (!existsSync(args.plan)) die(`Resolved plan not found: ${args.plan}`); }
  if (args.options !== undefined) { try { args.options = JSON.parse(args.options); } catch { die('--options must be JSON'); } }
  return args;
}

export async function loadBackend(args) {
  const file = args.backend ? resolve(args.project, args.backend) : join(here, 'styles', args.style, 'backend.mjs');
  if (!existsSync(file)) die(`Style "${args.style}" has no rendering backend (${file}). Unsupported styles are reported, never substituted.`, 'unsupported-style');
  const {backend} = await import(pathToFileURL(file).href);
  for (const key of ['name', 'sources', 'open']) if (!backend?.[key]) die(`Backend ${file} does not implement "${key}"`, 'invalid-backend');
  return {backend, file};
}

// Single writer per checkpoint directory: an exclusive lock file holding the owner's PID.
export async function acquireLock(dir) {
  await mkdir(dir, {recursive: true});
  const file = join(dir, 'render.lock');
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await open(file, 'wx');
      await handle.writeFile(JSON.stringify({pid: process.pid, started: new Date().toISOString()}));
      await handle.close();
      return async () => rm(file, {force: true});
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = await readFile(file, 'utf8').then(JSON.parse).catch(() => ({}));
      let alive = false;
      try { process.kill(owner.pid, 0); alive = true; } catch (e) { alive = e.code === 'EPERM'; }
      if (alive) die(`Checkpoint ${dir} is locked by running process ${owner.pid}; refusing concurrent render`, 'locked');
      await rm(file, {force: true}); // stale lock from a process that no longer exists
    }
  }
  die(`Could not acquire lock ${file}`, 'locked');
}

const isJpeg = b => b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b.at(-2) === 0xff && b.at(-1) === 0xd9;
const frameName = i => String(i).padStart(6, '0') + '.jpg';

// frames/manifest.json identifies the configuration; frames/frames.jsonl logs frames written atomically and checked.
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
    const data = await readFile(join(dir, frameName(i))).catch(() => null);
    const entry = log.get(i);
    if (!data) { stats.missing++; todo.push(i); continue; }
    if (!entry || entry.sha256 !== hash(data) || !isJpeg(data)) { stats.corrupt++; todo.push(i); continue; }
    valid.set(i, entry); bytes += data.length; stats.reused++;
  }
  const logFile = join(dir, 'frames.jsonl');
  await writeFile(logFile + '.tmp', [...valid.values()].map(e => JSON.stringify(e) + '\n').join(''));
  await rename(logFile + '.tmp', logFile);
  return {stats, valid, todo, averageBytes: valid.size ? bytes / valid.size : null};
}

export async function ensureSpace(dir, needed) {
  const fs = await statfs(dir);
  const free = fs.bavail * fs.bsize;
  if (free < needed) throw Object.assign(new Error(`Insufficient storage in ${dir}: ${(free / 2 ** 20).toFixed(0)} MiB free, ~${(needed / 2 ** 20).toFixed(0)} MiB needed`), {code: 'storage'});
  return free;
}

// Inputs (hashed files) and settings that define a rendering configuration; shared by render and preflight.
// Caption contract for a backend: from the artifact, hidden with --no-captions, or null (legacy phrase captions).
export async function captionsFor({args, backend, timeline}) {
  if (!args.captions && !args['no-captions']) return null;
  if (!backend.captions?.includes(CAPTIONS)) die(`Backend ${backend.name} does not declare support for ${CAPTIONS}`, 'captions-unsupported');
  return args.captions ? loadCaptions({file: args.captions, project: args.project, timelineFile: args.timeline, timeline}) : HIDDEN;
}

// Presentation mode from the project's resolved configuration (preferences.py key `presentation`): null when the project
// does not set it (legacy projects keep their exact configuration). A style must declare the mode in styles/registry.json.
export async function presentationFor({args, backend}) {
  let mode = null;
  try { mode = JSON.parse(await readFile(resolve(args.project, 'project.json'), 'utf8'))?.config?.effective?.presentation ?? null; } catch { mode = null; }
  if (mode === null || mode === 'auto') return null;   // auto: the topic decides (framed unless it authors full-bleed)
  if (mode === 'framed') return mode;
  if (mode !== 'full-bleed') die(`Unknown presentation mode in project configuration: ${mode}`, 'presentation-unsupported');
  const registry = JSON.parse(await readFile(new URL('./styles/registry.json', import.meta.url), 'utf8'));
  if (!(registry[backend.name]?.presentations ?? ['framed']).includes(mode)) die(`Style ${backend.name} does not support the ${mode} presentation`, 'presentation-unsupported');
  return mode;
}

export async function configuration({args, backend, audioFile, presentation = null}) {
  const sources = {renderer: fileURLToPath(import.meta.url), topic: args.topic, timeline: args.timeline, audio: audioFile,
    ...(args.plan ? {plan: args.plan, 'plan-loader': fileURLToPath(new URL('./lib/resolved-plan.mjs', import.meta.url))} : {}),
    ...(args.captions ? {captions: args.captions, 'captions-loader': fileURLToPath(new URL('./lib/captions.mjs', import.meta.url))} : {}),
    ...Object.fromEntries(backend.sources.map(f => ['backend:' + basename(f), f]))};
  const inputs = {};
  for (const [key, f] of Object.entries(sources)) inputs[key] = {path: f, sha256: hash(await readFile(f))};
  const settings = {style: backend.name, width: args.width, height: args.height, scale: args.scale, fps: args.fps, quality: args.quality,
    options: args.options ?? null, locale: args.locale ?? null, font: args.font ?? null, ...backend.settings,
    ...(args.captions ? {captions: 'artifact'} : args['no-captions'] ? {captions: 'off'} : {}), ...(presentation ? {presentation} : {})};
  return {inputs, settings};
}

// What a preflight result is bound to: every input hash, the geometry-relevant settings and the browser build.
// Output scale and JPEG quality only change capture, not layout, so they are excluded.
export const preflightBinding = ({inputs, settings, browser}) => hash(JSON.stringify({
  inputs: Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.sha256])), settings: {...settings, scale: null, quality: null}, browser}));

export async function render(argv) {
  const args = parseArgs(argv);
  const elapsed = performance.now();
  let timeline;
  try { timeline = JSON.parse(await readFile(args.timeline, 'utf8')); } catch { die('Timeline is not valid JSON'); }
  const audioFile = timeline?.audio?.path ? resolve(args.project, timeline.audio.path) : '';
  if (!audioFile || !existsSync(audioFile)) die(`Timeline audio not found relative to --project: ${timeline?.audio?.path}`);
  if (hash(await readFile(audioFile)) !== timeline.audio.sha256) die('Audio does not match the timeline SHA-256');
  const {backend, file: backendFile} = await loadBackend(args);
  // A resolved creative plan is validated (ledger, plan and narration hashes) before anything is rendered.
  const plan = args.plan ? await loadRenderPlan({planFile: args.plan, project: args.project, timelineFile: args.timeline, timeline}) : null;
  if (plan && !backend.plans?.includes(RENDER_PLAN)) die(`Backend ${backend.name} does not declare support for ${RENDER_PLAN}`, 'plan-unsupported');
  const captions = await captionsFor({args, backend, timeline});
  const topicSource = await readFile(args.topic, 'utf8');
  const release = await acquireLock(args.out);
  try {
    const presentation = await presentationFor({args, backend});
    const {inputs, settings} = await configuration({args, backend, audioFile, presentation});
    const evidence = {name: args.name, backend: backendFile, settings, inputs, output: args.output, keyframes: []};
    const framesDir = join(args.out, 'frames');
    const fps = args.fps, scale = args.scale;
    const session = await backend.open({chrome: args.chrome, width: args.width, height: args.height, locale: args.locale, font: args.font});
    try {
      evidence.browser = session.version;
      if (args.preflight) { // a failed, incomplete or stale preflight is never accepted as valid evidence
        let pre;
        try { pre = JSON.parse(await readFile(args.preflight, 'utf8')); } catch { die('Preflight result is not readable JSON', 'preflight-invalid'); }
        if (pre.schema !== 'video-creator.preflight' || pre.status !== 'passed' || pre.passed !== true) die(`Preflight status is ${pre.status}; fix the defects or unsupported checks and run preflight again`, 'preflight-failed');
        const binding = preflightBinding({inputs, settings, browser: session.version});
        if (pre.binding?.sha256 !== binding) die('Preflight was run for a different topic, plan, narration, backend or configuration; run preflight again', 'preflight-stale');
        evidence.preflight = {path: args.preflight, binding};
      }
      Object.assign(evidence, await session.install({timeline, topicSource, topicOptions: args.options, ...(plan ? {plan} : {}), ...(captions ? {captions} : {}), ...(presentation ? {presentation} : {})}));
      if (plan) { checkCueUse(plan, evidence.planCuesUsed); evidence.plan = plan.source; }
      if (session.describe) evidence.presentation = await session.describe();
      const seconds = evidence.duration, seek = t => session.seek(t);
      const shot = (format = 'png') => session.capture({format, quality: args.quality, scale});
      evidence.cueChecks = [];
      for (const c of evidence.cues) {
        const before = (await seek(c.at - .02)).opacity[c.id] ?? 0;
        const after = (await seek(c.at + .6)).opacity[c.id] ?? 0;
        const phraseStart = c.phrase ? evidence.phrases[c.phrase - 1].start : null; // speech cues from a plan carry no phrase index
        evidence.cueChecks.push({...c, phraseStart, before, after});
        if (before > .01 || after < .5 || (phraseStart !== null && c.at < phraseStart)) throw new Error('Cue check failed: ' + JSON.stringify(evidence.cueChecks.at(-1)));
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
      if (args['keys-only']) {
        evidence.renderWallSeconds = (performance.now() - elapsed) / 1000;
        await writeFile(join(args.out, 'keys-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
        return evidence;
      }
      const total = Math.ceil(seconds * fps);
      evidence.frames = total;
      const configHash = hash(JSON.stringify({inputs: Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.sha256])), settings, browser: evidence.browser, total}));
      const manifest = {version: 1, configHash, created: new Date().toISOString(), frames: total, settings, browser: evidence.browser, inputs};
      const checkpoint = await openCheckpoint(framesDir, manifest, total);
      evidence.checkpoint = {...checkpoint.stats, configHash, rendered: 0};
      // No sample capture for the estimate: an extra capture changes raster history (P013.1 regression lesson).
      const estimate = checkpoint.averageBytes ?? args.output[0] * args.output[1] * .5;
      evidence.checkpoint.freeBytesBefore = await ensureSpace(args.out, Math.ceil(checkpoint.todo.length * estimate * 1.5 + total * estimate * .2 + 64 * 2 ** 20));
      const log = join(framesDir, 'frames.jsonl');
      for (const i of checkpoint.todo) {
        if (args['stop-after'] !== undefined && evidence.checkpoint.rendered >= args['stop-after'])
          throw Object.assign(new Error(`Stopped after ${evidence.checkpoint.rendered} new frames (simulated interruption)`), {code: INTERRUPTED});
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
    } finally { await session.close(); }

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
  } finally { await release(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const evidence = await render(process.argv.slice(2));
    const c = evidence.checkpoint;
    console.log(evidence.media
      ? `${evidence.name}: ${evidence.frames} frames, ${Number(evidence.media.container.duration).toFixed(3)} s; reused ${c.reused}, rendered ${c.rendered}, corrupt ${c.corrupt}, missing ${c.missing}, invalidated ${c.invalidated}; ${evidence.renderWallSeconds.toFixed(1)} s wall`
      : `keyframes only: ${evidence.keyframes.length} keyframes, ${evidence.cueChecks.length} cue checks passed`);
  } catch (error) {
    console.error((error.usage ? 'Usage error: ' : error.code && typeof error.code === 'string' ? `[${error.code}] ` : '') + error.message);
    process.exit(error.code === INTERRUPTED ? INTERRUPTED : error.code === 'locked' ? LOCKED : error.usage ? 2 : 1);
  }
}
