// Resolved creative plan → renderer timing contract (style- and language-independent).
// Reads plan/resolved-plan.json written by scripts/plan.py, checks it against the project ledger, the narration timeline
// and its audio, and returns `video-creator.render-plan` v1, which any rendering backend may consume:
//   {schema, version, sample_rate, sample_count, duration,
//    shots: [{id, start: {sample, seconds}, end: {sample, seconds}, cues: [cue ids], camera: [{sample, seconds, intent}]}],
//    cues:  {<cue id>: {id, shot, object, action, sample, seconds, timing_source}}}
// Times stay integer samples; `seconds` is derived once here as sample / sample_rate (exact, unrounded).
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

export const RENDER_PLAN = 'video-creator.render-plan/1';
const CUE_ID = /^[a-z0-9][a-z0-9._-]*$/;
const sha = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const fail = (code, message) => { throw Object.assign(new Error(message), {code}); };
const isSample = x => Number.isInteger(x) && x >= 0;

export async function loadRenderPlan({planFile, project, timelineFile, timeline}) {
  let resolved, ledger;
  try { resolved = JSON.parse(await readFile(planFile, 'utf8')); } catch { fail('invalid-plan', `Resolved plan is not readable JSON: ${planFile}`); }
  try { ledger = JSON.parse(await readFile(resolve(project, 'project.json'), 'utf8')); }
  catch { fail('plan-not-verified', `--plan needs the project ledger (project.json) in --project ${project}`); }
  const rel = p => relative(project, p).split('\\').join('/');
  if (isAbsolute(rel(planFile)) || rel(planFile).startsWith('..')) fail('plan-not-verified', 'the resolved plan must live inside --project');

  // 1. The plan is the verified output of the completed creative-plan stage, byte for byte.
  const planHash = await sha(planFile);
  const stage = ledger.stages?.['creative-plan'];
  const recorded = stage?.outputs?.find(o => o.path === rel(planFile));
  if (stage?.state !== 'completed' || !recorded) fail('plan-not-verified', `${rel(planFile)} is not an output of the completed creative-plan stage (state: ${stage?.state}); run plan.py resolve`);
  if (recorded.sha256 !== planHash) fail('stale-plan', `${rel(planFile)} changed after the creative-plan stage completed`);

  // 2. It was resolved against exactly this narration, which is still the verified narration output.
  const r = resolved.resolution ?? fail('invalid-plan', 'resolved plan has no resolution block; run plan.py resolve');
  if (resolved.schema !== 'video-creator.creative-plan' || resolved.version !== 1) fail('invalid-plan', 'unsupported creative-plan schema or version');
  const timelineHash = await sha(timelineFile);
  if (r.timeline_sha256 !== timelineHash) fail('stale-plan', `the plan was resolved against another narration timeline (plan ${String(r.timeline_sha256).slice(0, 12)}, --timeline ${timelineHash.slice(0, 12)}); re-resolve the plan`);
  if (r.audio_sha256 !== timeline.audio.sha256 || r.sample_rate !== timeline.audio.sample_rate || r.sample_count !== timeline.audio.sample_count)
    fail('stale-plan', 'the plan was resolved against different narration audio');
  const narration = ledger.stages?.narration;
  const tlOut = narration?.outputs?.find(o => o.path === rel(timelineFile));
  if (narration?.state !== 'completed' || !tlOut || tlOut.sha256 !== timelineHash)
    fail('stale-plan', 'the narration timeline is not the verified output of the completed narration stage');

  // 3. Shot boundaries tile the narration exactly; cues are addressable, unique and inside their shot.
  const rate = r.sample_rate, count = r.sample_count, at = sample => ({sample, seconds: sample / rate});
  const shots = [], cues = {};
  const list = Array.isArray(resolved.shots) && resolved.shots.length ? resolved.shots : fail('invalid-plan', 'resolved plan has no shots');
  list.forEach((s, i) => {
    const start = s.start?.sample, end = s.end?.sample;
    if (!s.id || !isSample(start) || !isSample(end)) fail('invalid-plan', `shot ${i}: id and integer sample bounds required`);
    if ((i === 0 && start !== 0) || (i > 0 && start !== list[i - 1].end.sample) || end <= start || (i === list.length - 1 && end !== count))
      fail('conflicting-shot-boundaries', `shot ${s.id}: boundaries ${start}-${end} do not tile the narration (0-${count})`);
    const ids = [];
    for (const c of s.cues ?? []) {
      if (c.id === undefined) continue; // only cues with an id are addressable by topic modules
      if (!CUE_ID.test(c.id) || cues[c.id]) fail('invalid-plan', `cue id ${JSON.stringify(c.id)} must be unique and match ${CUE_ID}`);
      const sample = c.at?.sample;
      if (!isSample(sample) || sample < start || sample > end) fail('invalid-plan', `cue ${c.id}: sample ${sample} outside shot ${s.id}`);
      cues[c.id] = {id: c.id, shot: s.id, object: c.object, action: c.action, ...at(sample), timing_source: c.at.timing_source ?? null};
      ids.push(c.id);
    }
    // Camera moments are timing only; the intent is the agent's note, never turned into a camera move here.
    const camera = (s.camera ?? []).map((k, j) => {
      const sample = k.at?.sample;
      if (!isSample(sample) || sample < start || sample > end || (j && sample < s.camera[j - 1].at.sample)) fail('invalid-plan', `shot ${s.id} camera[${j}]: sample ${sample} outside the shot or out of order`);
      return {...at(sample), intent: k.intent ?? null};
    });
    shots.push({id: s.id, start: at(start), end: at(end), cues: ids, camera});
  });
  return {schema: 'video-creator.render-plan', version: 1, sample_rate: rate, sample_count: count, duration: count / rate, shots, cues,
    source: {path: rel(planFile), sha256: planHash, timeline_sha256: timelineHash, timing_status: r.timing_status}};
}

// After a backend installed the topic: every addressable cue must have been consumed, and nothing unknown referenced.
export function checkCueUse(plan, used) {
  const known = new Set(Object.keys(plan.cues)), seen = new Set(used ?? []);
  const unknown = [...seen].filter(id => !known.has(id));
  if (unknown.length) fail('unknown-cue', `topic referenced cue ids not in the resolved plan: ${unknown.join(', ')}`);
  const missing = [...known].filter(id => !seen.has(id));
  if (missing.length) fail('missing-cue', `resolved plan cues not used by the topic: ${missing.join(', ')}`);
}
