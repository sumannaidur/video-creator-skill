// Caption artifact (captions/captions.json from scripts/captions.py) → renderer caption contract (style-independent).
// Contract `video-creator.captions/1` passed to backends: {visible, locale, max_lines, cues: [{id, start, end, text, words?}]}
// where seconds are sample / sample_rate, computed once here. Text is passed through unchanged.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

export const CAPTIONS = 'video-creator.captions/1';
export const HIDDEN = {schema: 'video-creator.captions', version: 1, visible: false, locale: null, max_lines: null, cues: []};
const sha = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const fail = (code, message) => { throw Object.assign(new Error(message), {code}); };

export async function loadCaptions({file, project, timelineFile, timeline}) {
  let doc;
  try { doc = JSON.parse(await readFile(file, 'utf8')); } catch { fail('invalid-captions', `Caption artifact is not readable JSON: ${file}`); }
  if (doc.schema !== 'video-creator.captions' || doc.version !== 1) fail('invalid-captions', 'unsupported caption schema or version');
  const n = doc.narration ?? {}, timelineHash = await sha(timelineFile);
  if (n.timeline_sha256 !== timelineHash || n.audio_sha256 !== timeline.audio.sha256 || n.sample_rate !== timeline.audio.sample_rate || n.sample_count !== timeline.audio.sample_count)
    fail('stale-captions', 'captions were built from a different narration timeline or audio; run captions.py build again');
  const ledger = await readFile(resolve(project, 'project.json'), 'utf8').then(JSON.parse).catch(() => null);
  if (ledger) {
    const rel = relative(project, timelineFile).split('\\').join('/');
    const out = ledger.stages?.narration?.outputs?.find(o => o.path === rel);
    if (ledger.stages?.narration?.state !== 'completed' || out?.sha256 !== timelineHash) fail('stale-captions', 'the narration timeline is not the verified output of the completed narration stage');
  }
  const rate = n.sample_rate, count = n.sample_count;
  let prev = 0;
  for (const c of doc.cues ?? []) {
    if (!Number.isInteger(c.start_sample) || !Number.isInteger(c.end_sample) || !(c.start_sample >= 0 && c.start_sample < c.end_sample && c.end_sample <= count))
      fail('invalid-captions', `cue ${c.id}: invalid sample range ${c.start_sample}-${c.end_sample}`);
    if (c.start_sample < prev) fail('invalid-captions', `cue ${c.id} overlaps the previous cue`);
    if (typeof c.text !== 'string' || !c.text.trim()) fail('invalid-captions', `cue ${c.id}: empty text`);
    prev = c.end_sample;
  }
  const visible = Boolean(doc.config?.enabled && doc.config?.burn_in);
  return {schema: 'video-creator.captions', version: 1, visible, locale: doc.locale ?? null, max_lines: doc.config?.max_lines ?? null,
    cues: visible ? doc.cues.map(c => ({id: c.id, start: c.start_sample / rate, end: c.end_sample / rate, text: c.text, ...wordsOf(c, timeline, rate)})) : []};
}

// Optional `words` per cue (P018.2, for active-word emphasis): [{at, from, to}] = a word's measured start in seconds and
// its character range inside the cue text, taken from the verified timeline's own word records. Only words with a
// measured start are listed; a cue whose text cannot be located exactly in the timeline text gets no words (never guessed).
function wordsOf(cue, timeline, rate) {
  const ref = cue.text_ref, field = ref?.field ?? 'speech', text = timeline?.text?.[field];
  if (!ref || typeof text !== 'string' || !Number.isInteger(ref.start) || text.slice(ref.start, ref.end) !== cue.text) return {};
  const words = (timeline.records ?? []).filter(r => r.kind === 'word' && Number.isInteger(r.start) && r.text_ref && (r.text_ref.field ?? 'speech') === field
    && r.text_ref.start >= ref.start && r.text_ref.end <= ref.end && r.text_ref.end > r.text_ref.start)
    .sort((a, b) => a.text_ref.start - b.text_ref.start)
    .map(r => ({at: r.start / rate, from: r.text_ref.start - ref.start, to: r.text_ref.end - ref.start}));
  return words.length ? {words} : {};
}
