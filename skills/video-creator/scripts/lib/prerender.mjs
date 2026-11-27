// P024.14B: lightweight pre-render validation, run after the topic is installed and before anything is captured.
// It complements the engines' own refusals (layers, label styles, symbols, transition types) and the resolved-plan cue
// checks with what neither covers: duplicate DOM ids, the browser canvas, timing of cues, keyframes and transitions,
// shot continuity and project-relative recorded paths. Every finding names its check; nothing is repaired.
import { isAbsolute, relative, resolve } from 'node:path';

// Runs in the browser page (serialised by the backend). Duplicate ids make getElementById return the wrong element
// (for example an object id equal to its symbol id), so every id must be unique across the whole document.
export function inspectDom(width, height) {
  const seen = new Map(), findings = [];
  for (const el of document.querySelectorAll('[id]')) seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
  for (const [id, n] of seen) if (n > 1) findings.push({check: 'duplicate-id', id, reason: `id "${id}" is used by ${n} elements`});
  if (innerWidth !== width || innerHeight !== height) findings.push({check: 'dimensions', reason: `browser canvas ${innerWidth}×${innerHeight} is not the requested ${width}×${height}`});
  return findings;
}

const finite = v => typeof v === 'number' && Number.isFinite(v);

export function validateTiming(evidence) {
  const f = [], d = evidence.duration, eps = 1e-6;
  if (!finite(d) || d <= 0) return [{check: 'timing', reason: `narration duration ${d} is not positive`}];
  for (const c of evidence.cues ?? []) if (!finite(c.at) || c.at < 0 || c.at > d + eps) f.push({check: 'unresolved-cue', id: c.id, reason: `cue ${c.cue ?? ''} for ${c.id} at ${c.at} is outside 0–${d} s`});
  for (const [name, t] of evidence.checks?.keyframes ?? []) if (!finite(t) || t < 0 || t > d + eps) f.push({check: 'keyframe-time', id: name, reason: `keyframe ${name} at ${t} is outside 0–${d} s`});
  const shots = evidence.shots ?? [];
  shots.forEach((s, i) => {
    if (!finite(s.start) || !finite(s.end) || s.end <= s.start) f.push({check: 'shot-time', id: s.id, reason: `shot ${s.id} spans ${s.start}–${s.end}`});
    if (i && Math.abs(s.start - shots[i - 1].end) > 1e-3) f.push({check: 'shot-time', id: s.id, reason: `shot ${s.id} starts at ${s.start}, previous shot ends at ${shots[i - 1].end}`});
    const tr = s.transition;
    if (!tr) return;
    const next = shots[i + 1];
    if (!next) f.push({check: 'transition', id: s.id, reason: `last shot ${s.id} has a transition`});
    else if (!(tr.from >= s.start - eps && tr.to <= next.end + eps && tr.from <= tr.at && tr.at <= tr.to))
      f.push({check: 'transition', id: s.id, reason: `transition ${tr.type} ${tr.from}–${tr.to} does not fit between ${s.id} (${s.start}) and ${next.id} (${next.end})`});
  });
  if (shots.length && (Math.abs(shots[0].start) > 1e-3 || Math.abs(shots.at(-1).end - d) > .05))
    f.push({check: 'shot-time', reason: `shots cover ${shots[0].start}–${shots.at(-1).end}, narration is 0–${d} s`});
  return f;
}

// Paths the project records for itself must stay inside the project: the timeline's audio, and the narration timeline a
// resolved plan names. (Topic modules and asset manifests may live elsewhere, as test fixtures do.)
export function validatePaths({project, timeline, plan}) {
  const f = [], inside = p => { const r = relative(project, resolve(project, p)); return r && !r.startsWith('..') && !isAbsolute(r); };
  const audio = timeline?.audio?.path;
  if (typeof audio !== 'string' || isAbsolute(audio) || !inside(audio)) f.push({check: 'project-path', id: 'timeline.audio.path', reason: `audio path ${audio} must be relative and inside the project`});
  const named = plan?.narration?.timeline ?? plan?.source?.narration?.timeline;
  if (named !== undefined && (typeof named !== 'string' || isAbsolute(named) || !inside(named))) f.push({check: 'project-path', id: 'plan.narration.timeline', reason: `plan timeline ${named} must be relative and inside the project`});
  return f;
}
