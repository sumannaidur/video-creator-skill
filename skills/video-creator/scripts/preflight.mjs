// Video Creator visual preflight: inspects every output frame time of the full timeline (including intermediate frames,
// camera moves and transitions) with geometry and visibility checks, without capturing images. Technical validation only:
// it never scores or judges artwork.
//
// node scripts/preflight.mjs <same options as render.mjs> --out <dir>
//   Writes <out>/preflight.json (machine-readable) and <out>/preflight.md (summary). Exit 0 passed, 1 failed,
//   6 incomplete (a required check is unsupported by the backend), 2 usage.
// Then render with `--preflight <out>/preflight.json`: the renderer refuses failed, incomplete or stale results.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { captionsFor, configuration, presentationFor, loadBackend, parseArgs, preflightBinding } from './render.mjs';
import { RENDER_PLAN, checkCueUse, loadRenderPlan } from './lib/resolved-plan.mjs';

export const INCOMPLETE = 6;
// Checks every backend is asked about. A backend that does not perform one gets it reported as unsupported, never passed.
export const STANDARD_BACKEND_CHECKS = ['safe-area', 'text-clipping', 'required-object-bounds', 'invalid-transform', 'visibility-requirement'];
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
const EPS = 1e-6;

async function writeAtomic(file, text) { await writeFile(file + '.tmp', text); await rename(file + '.tmp', file); }

export async function preflight(argv) {
  const started = performance.now();
  const args = parseArgs(argv);
  const timeline = JSON.parse(await readFile(args.timeline, 'utf8'));
  const audioFile = resolve(args.project, timeline?.audio?.path ?? '');
  if (!existsSync(audioFile) || sha(await readFile(audioFile)) !== timeline.audio.sha256) throw Object.assign(new Error('Timeline audio missing or not matching its SHA-256'), {code: 'stale-narration'});
  const {backend} = await loadBackend(args);
  const plan = args.plan ? await loadRenderPlan({planFile: args.plan, project: args.project, timelineFile: args.timeline, timeline}) : null;
  if (plan && !backend.plans?.includes(RENDER_PLAN)) throw Object.assign(new Error(`Backend ${backend.name} does not declare ${RENDER_PLAN}`), {code: 'plan-unsupported'});
  const captions = await captionsFor({args, backend, timeline});
  const presentation = await presentationFor({args, backend});
  const {inputs, settings} = await configuration({args, backend, audioFile, presentation});
  const declared = backend.preflight?.checks ?? [];
  const checks = {}, defects = [], open = new Map(), exempt = {transition: 0, decorativeOffStage: 0};
  const mark = (name, status, extra = {}) => { checks[name] = {status, ...extra}; };

  const session = await backend.open({chrome: args.chrome, width: args.width, height: args.height, locale: args.locale, font: args.font});
  let installed, browser = session.version, frames = 0, transitionFrames = 0, cameraRange = [Infinity, -Infinity];
  try {
    installed = await session.install({timeline, topicSource: await readFile(args.topic, 'utf8'), topicOptions: args.options, ...(plan ? {plan} : {}), ...(captions ? {captions} : {}), ...(presentation ? {presentation} : {})});
    if (plan) checkCueUse(plan, installed.planCuesUsed);
    const fps = args.fps, total = Math.ceil(installed.duration * fps);
    const record = (frame, t, shot, f) => {
      const key = `${f.type}|${f.object}|${shot}`, last = open.get(key);
      if (last && last.lastFrame === frame - 1) { last.lastFrame = frame; last.endSeconds = t; last.frames++; return; }
      const d = {type: f.type, object: f.object, shot, firstFrame: frame, lastFrame: frame, seconds: t, endSeconds: t, frames: 1, evidence: f.evidence};
      defects.push(d); open.set(key, d);
    };

    // 1. Every frame at the output cadence (intermediate frames included), geometry only.
    if (typeof session.inspect === 'function') {
      for (let i = 0; i < total; i++) {
        const t = i / fps, r = await session.inspect(t);
        frames++;
        if (r.transition) transitionFrames++;
        if (Number.isFinite(r.zoom)) cameraRange = [Math.min(cameraRange[0], r.zoom), Math.max(cameraRange[1], r.zoom)];
        for (const k of Object.keys(exempt)) exempt[k] += r.exempt?.[k] ?? 0;
        for (const f of r.findings ?? []) record(i, t, r.shot, f);
      }
    }
    for (const name of new Set([...STANDARD_BACKEND_CHECKS, ...declared])) {
      if (typeof session.inspect !== 'function' || !declared.includes(name)) { mark(name, 'unsupported', {scope: 'backend', reason: `backend ${backend.name} does not perform this check`}); continue; }
      const n = defects.filter(d => d.type === name).length;
      mark(name, n ? 'failed' : 'passed', {scope: 'backend', defects: n});
    }
    mark('frame-cadence', frames === total ? 'passed' : (typeof session.inspect === 'function' ? 'failed' : 'unsupported'), {scope: 'core', inspected: frames, expected: total, fps});

    // 2. Cue visibility at the declared moments (same rule as the renderer).
    const cueDefects = [];
    for (const c of installed.cues ?? []) {
      const before = (await session.seek(c.at - .02)).opacity?.[c.id], after = (await session.seek(c.at + .6)).opacity?.[c.id];
      if (before === undefined || after === undefined) { cueDefects.push(null); continue; }
      if (before > .01 || after < .5) cueDefects.push({type: 'cue-visibility', object: c.id, shot: null, seconds: c.at, firstFrame: Math.round(c.at * fps), evidence: {cue: c.cue ?? null, before, after}});
    }
    if (cueDefects.includes(null)) mark('cue-visibility', 'unsupported', {scope: 'core', reason: 'backend seek() reports no object opacity'});
    else { defects.push(...cueDefects); mark('cue-visibility', cueDefects.length ? 'failed' : 'passed', {scope: 'core', cues: (installed.cues ?? []).length, defects: cueDefects.length}); }

    // 3. Speech cues and camera moments against the resolved plan (sample-derived seconds, exact).
    if (!plan) { mark('speech-cue-timing', 'not-applicable', {scope: 'core', reason: 'no --plan'}); mark('camera-timing', 'not-applicable', {scope: 'core', reason: 'no --plan'}); }
    else {
      const bad = [];
      for (const c of (installed.cues ?? []).filter(c => c.cue)) {
        const p = plan.cues[c.cue];
        if (!p || Math.abs(c.at - p.seconds) > EPS) bad.push({type: 'speech-cue-timing', object: c.id, shot: p?.shot ?? null, seconds: c.at, firstFrame: Math.round(c.at * fps), evidence: {cue: c.cue, planned: p?.seconds ?? null, actual: c.at}});
      }
      defects.push(...bad);
      mark('speech-cue-timing', bad.length ? 'failed' : 'passed', {scope: 'core', cues: Object.keys(plan.cues).length, defects: bad.length});
      const withCamera = plan.shots.filter(s => s.camera?.length);
      if (!withCamera.length) mark('camera-timing', 'not-applicable', {scope: 'core', reason: 'the plan declares no camera moments'});
      else if (!installed.shots?.every(s => Array.isArray(s.cameraTimes))) mark('camera-timing', 'unsupported', {scope: 'core', reason: 'backend install() reports no camera key times'});
      else {
        const missing = [];
        for (const s of withCamera) {
          const times = installed.shots.find(x => x.id === s.id)?.cameraTimes ?? [];
          for (const m of s.camera) if (!times.some(t => Math.abs(t - m.seconds) <= EPS))
            missing.push({type: 'camera-timing', object: 'camera', shot: s.id, seconds: m.seconds, firstFrame: Math.round(m.seconds * fps), evidence: {planned: m.seconds, intent: m.intent, keyTimes: times}});
        }
        defects.push(...missing);
        mark('camera-timing', missing.length ? 'failed' : 'passed', {scope: 'core', moments: withCamera.reduce((n, s) => n + s.camera.length, 0), defects: missing.length});
      }
    }
  } finally { await session.close(); }

  const statuses = Object.values(checks).map(c => c.status);
  const status = statuses.includes('failed') ? 'failed' : statuses.includes('unsupported') ? 'incomplete' : 'passed';
  const result = {
    schema: 'video-creator.preflight', version: 1, status, passed: status === 'passed',
    scope: 'technical geometry, visibility and timing checks only; not an assessment of artistic quality',
    binding: {sha256: preflightBinding({inputs, settings, browser}), topic: inputs.topic.sha256, timeline: inputs.timeline.sha256,
      plan: inputs.plan?.sha256 ?? null, backend: backend.name, browser, settings: {...settings, scale: null, quality: null}},
    frames: {inspected: frames, fps: args.fps, duration: installed.duration, transitionFrames, cameraZoomRange: frames ? cameraRange : null},
    exempt, checks, defects: defects.sort((a, b) => a.seconds - b.seconds),
    wallSeconds: Math.round((performance.now() - started) / 100) / 10,
  };
  await mkdir(args.out, {recursive: true});
  await writeAtomic(join(args.out, 'preflight.json'), JSON.stringify(result, null, 2) + '\n');
  const lines = [`# Visual preflight: ${status.toUpperCase()}`, '', `${frames} frames at ${args.fps} fps inspected in ${result.wallSeconds} s (${transitionFrames} in transitions). Technical checks only; this is not an artistic review.`, '',
    '| Check | Status | Detail |', '|---|---|---|',
    ...Object.entries(checks).map(([k, c]) => `| ${k} | ${c.status} | ${c.reason ?? (c.defects !== undefined ? `${c.defects} defect(s)` : '')} |`), '',
    defects.length ? '## Defects' : 'No defects found.', '',
    ...defects.map(d => `- **${d.type}** ${d.object} in shot ${d.shot ?? '-'}: frame ${d.firstFrame}${d.lastFrame !== undefined && d.lastFrame !== d.firstFrame ? `-${d.lastFrame}` : ''} at ${d.seconds.toFixed(3)} s; ${JSON.stringify(d.evidence)}`),
    '', `Exempt (not defects): ${exempt.transition} required-object frames during transitions, ${exempt.decorativeOffStage} undeclared art objects outside the stage.`];
  await writeAtomic(join(args.out, 'preflight.md'), lines.join('\n') + '\n');
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const r = await preflight(process.argv.slice(2));
    console.log(`preflight ${r.status}: ${r.frames.inspected} frames, ${r.defects.length} defect(s), ${Object.values(r.checks).filter(c => c.status === 'unsupported').length} unsupported check(s); ${r.wallSeconds} s`);
    process.exit(r.status === 'passed' ? 0 : r.status === 'incomplete' ? INCOMPLETE : 1);
  } catch (error) {
    console.error((error.usage ? 'Usage error: ' : typeof error.code === 'string' ? `[${error.code}] ` : '') + error.message);
    process.exit(error.usage ? 2 : 1);
  }
}
