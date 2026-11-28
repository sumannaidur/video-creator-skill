// P014.3A focused package tests; self-contained since P026.4. A synthetic silent timeline (3 phrases, ~9 s) is generated
// in the work folder. The P013.6 pixel regression needs the source repository's experiments/E10 fixtures: it runs when they
// exist and is reported SKIPPED (never passed) otherwise, e.g. from an extracted release package.
//   node skills/video-creator/scripts/tests/test-package.mjs [--repo <repository root>] [--work <scratch dir>]
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2), opt = (k, d) => argv.includes(k) ? resolve(argv[argv.indexOf(k) + 1]) : d;
const repo = opt('--repo', resolve(pkg, '../..')), work = opt('--work', join(tmpdir(), 'vc-p014-tests'));
const timelineB = 'narration/narration.timeline.json';
const results = [];
// The verdict is written last: a check's details may carry a process exit 'status'.
const check = (name, ok, detail = {}) => { results.push({name, ...detail, status: ok ? 'passed' : 'failed'}); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${JSON.stringify(detail)}`); };
const skip = (name, reason) => { results.push({name, status: 'skipped', reason}); console.log(`SKIP ${name} (${reason})`); };
const fixture = join(work, 'fixture-project');
const render = (renderer, list, project = fixture) => spawnSync(process.execPath, [renderer, '--project', project, ...list], {encoding: 'utf8', windowsHide: true, cwd: project});
const json = async f => JSON.parse(await readFile(f, 'utf8'));
const ssim = (a, b) => Number(spawnSync('ffmpeg', ['-hide_banner', '-i', a, '-i', b, '-lavfi', 'ssim', '-f', 'null', '-'], {encoding: 'utf8'}).stderr.match(/All:([\d.]+)/)?.[1]);

await rm(work, {recursive: true, force: true});
await mkdir(work, {recursive: true});

// Synthetic silent narration (24 kHz mono, 9 s) with three phrases and sample-exact word records.
{
  const RATE = 24000, total = 9 * RATE, phrases = [['Cards slide into place.', .2, 2.6], ['Each one turns to show a colour.', 3.0, 5.8], ['Then they settle in a row.', 6.2, 8.6]];
  const pcm = Buffer.alloc(total * 2), head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + pcm.length, 4); head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22);
  head.writeUInt32LE(RATE, 24); head.writeUInt32LE(RATE * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(pcm.length, 40);
  const wav = Buffer.concat([head, pcm]);
  await mkdir(join(fixture, 'narration'), {recursive: true});
  await writeFile(join(fixture, 'narration', 'narration.wav'), wav);
  let text = ''; const records = [];
  phrases.forEach(([phrase, t0, t1], i) => {
    if (text) text += ' ';
    const base = text.length, toks = phrase.split(' '), span = (t1 - t0) / toks.length;
    toks.forEach((tok, k) => { const lo = text.length; text += tok + (k + 1 < toks.length ? ' ' : '');
      records.push({kind: 'word', label: tok, start: Math.round((t0 + k * span) * RATE), end: Math.round((t0 + (k + .9) * span) * RATE), source: 'forced_alignment', segment: `s${i + 1}`, text_ref: {field: 'speech', start: lo, end: lo + tok.length}}); });
    records.push({kind: 'phrase', label: phrase, start: Math.round(t0 * RATE), end: Math.round((t0 + (toks.length - .1) * span) * RATE), source: 'forced_alignment', segment: `s${i + 1}`, text_ref: {field: 'speech', start: base, end: text.length}});
  });
  records.sort((a, b) => (a.kind !== 'word') - (b.kind !== 'word') || a.start - b.start);
  await writeFile(join(fixture, timelineB), JSON.stringify({version: 1, unit: 'sample', locale: 'en-IN', validation: 'unreviewed', run_id: 'synthetic-package',
    timing: {method: 'forced_alignment', provider: 'synthetic-test'}, audio: {path: 'narration/narration.wav', sha256: createHash('sha256').update(wav).digest('hex'), sample_rate: RATE, sample_count: total},
    text: {display: text, speech: text}, records}, null, 2));
}

// 1. No runtime dependency on experiments/: static scan, then run a copy of the package from outside the repository.
const scripts = [];
for (const f of await readdir(join(pkg, 'scripts'), {recursive: true})) if (/\.(m?js|html|css)$/.test(f) && !f.includes('tests')) scripts.push(f);
const refs = [];
for (const f of scripts) if (/experiments[\\/]|E0\d|E10/.test((await readFile(join(pkg, 'scripts', f), 'utf8')).replace(/\/\/.*$/gm, ''))) refs.push(f);
check('no experiments/ references in packaged runtime code', refs.length === 0, {files: scripts.length, refs});
const copy = join(work, 'installed', 'video-creator');
await cp(pkg, copy, {recursive: true});
const renderer = join(copy, 'scripts', 'render.mjs');
const cards = join(copy, 'scripts', 'tests', 'fixtures', 'cards-topic.js');

// 2. Regression: the complete flight topic reproduces the P013.6 Full HD keyframes (same canvas and scale). Repository only.
let r;
// Every input the regression needs must exist; several are git-ignored media, absent from clones and CI (P026.6B).
const p013 = 'experiments/E10/p013-flights', p013Missing = [];
for (const f of ['topic-opening.js', 'narration-DK.timeline.json']) if (!existsSync(join(repo, p013, f))) p013Missing.push(`${p013}/${f}`);
if (!p013Missing.length) {
  const audio = (await json(join(repo, p013, 'narration-DK.timeline.json')).catch(() => ({})))?.audio?.path;
  if (!audio || !existsSync(join(repo, audio))) p013Missing.push(audio || `${p013}/narration-DK.timeline.json audio.path`);
  const refs = existsSync(join(repo, p013, 'fullhd/keyframes')) ? (await readdir(join(repo, p013, 'fullhd/keyframes'))).filter(f => f.startsWith('key-')).length : 0;
  if (refs !== 23) p013Missing.push(`${p013}/fullhd/keyframes (23 reference keyframes; found ${refs})`);
}
if (p013Missing.length) skip('flights regression from installed copy: 45 cues, 23 keyframes match P013.6', `fixtures unavailable: ${p013Missing.join(', ')}`);
else {
r = render(renderer, ['--topic', 'experiments/E10/p013-flights/topic-opening.js', '--timeline', 'experiments/E10/p013-flights/narration-DK.timeline.json',
  '--out', join(work, 'flights'), '--keys-only'], repo);
const keys = (await readdir(join(repo, 'experiments/E10/p013-flights/fullhd/keyframes'))).filter(f => f.startsWith('key-'));
let same = 0, worst = 1;
for (const k of keys) {
  const [a, b] = [join(repo, 'experiments/E10/p013-flights/fullhd/keyframes', k), join(work, 'flights/keyframes', k)];
  if ((await readFile(a)).equals(await readFile(b).catch(() => Buffer.alloc(0)))) same++; else worst = Math.min(worst, ssim(a, b) || 0);
}
const fl = await json(join(work, 'flights/keys-evidence.json')).catch(() => ({cueChecks: []}));
check('flights regression from installed copy: 45 cues, 23 keyframes match P013.6', r.status === 0 && fl.cueChecks.length === 45 && keys.length === 23 && (same === 23 || worst >= .999),
  {status: r.status, identical: `${same}/${keys.length}`, worstSsim: same === keys.length ? 1 : worst, err: r.stderr.trim().slice(-200)});
}

// 3. Smoke render (vertical, small) with interruption and resume.
const base = ['--topic', cards, '--timeline', timelineB, '--out', join(work, 'cards'), '--scale', '.25', '--fps', '10', '--quality', '80', '--crf', '28'];
const stopped = render(renderer, [...base, '--stop-after', '25']);
r = render(renderer, base);
const ev = await json(join(work, 'cards/video-evidence.json')).catch(() => ({checkpoint: {}}));
check('smoke render: interrupted then resumed to a validated MP4', stopped.status === 75 && r.status === 0 && ev.checkpoint.reused === 25 && ev.failures?.length === 0,
  {stoppedStatus: stopped.status, status: r.status, checkpoint: ev.checkpoint, video: ev.media && [ev.media.video.width, ev.media.video.height, ev.media.video.nb_read_frames]});

// 4. Horizontal canvas.
r = render(renderer, ['--topic', cards, '--timeline', timelineB, '--out', join(work, 'horizontal'), '--width', '1920', '--height', '1080', '--scale', '.25', '--keys-only']);
check('horizontal 1920×1080 keyframes pass layout checks', r.status === 0, {out: (r.stdout + r.stderr).trim().slice(-200)});

// 5. Single writer: a live lock refuses; a stale lock is recovered.
await mkdir(join(work, 'locked'), {recursive: true});
await writeFile(join(work, 'locked', 'render.lock'), JSON.stringify({pid: process.pid}));
r = render(renderer, ['--topic', cards, '--timeline', timelineB, '--out', join(work, 'locked'), '--scale', '.25', '--keys-only']);
check('concurrent render refused while lock owner is alive', r.status === 3 && /locked/.test(r.stderr), {status: r.status, err: r.stderr.trim()});
await writeFile(join(work, 'locked', 'render.lock'), JSON.stringify({pid: 2147480000}));
r = render(renderer, ['--topic', cards, '--timeline', timelineB, '--out', join(work, 'locked'), '--scale', '.25', '--keys-only']);
const lockGone = await readFile(join(work, 'locked', 'render.lock')).then(() => false, () => true);
check('stale lock recovered and released after the run', r.status === 0 && lockGone, {status: r.status});

// 6. Language is configuration, not code: locale and font switch with the same renderer and engine.
r = render(renderer, ['--topic', cards, '--timeline', timelineB, '--out', join(work, 'en'), '--scale', '.25', '--keys-only', '--locale', 'en-IN', '--font', '"Segoe UI", sans-serif']);
const en = await json(join(work, 'en/keys-evidence.json')).catch(() => ({}));
check('locale and font selected by options only', r.status === 0 && en.presentation?.lang === 'en-IN' && /Segoe UI/.test(en.presentation?.captionFont),
  {presentation: en.presentation});

// 7. Backend boundary: a non-browser backend runs through the unchanged core to a validated MP4.
r = render(renderer, ['--topic', cards, '--timeline', timelineB, '--out', join(work, 'solid'), '--backend', join(copy, 'scripts/tests/fixtures/solid-backend.mjs'),
  '--width', '640', '--height', '360', '--fps', '5', '--quality', '80', '--crf', '30']);
const so = await json(join(work, 'solid/video-evidence.json')).catch(() => ({}));
check('alternative backend renders through the same core', r.status === 0 && so.failures?.length === 0 && so.settings?.style === 'solid-test',
  {status: r.status, frames: so.frames, err: r.stderr.trim().slice(-200)});

// 8. Unsupported style is reported, not substituted.
r = render(renderer, ['--topic', cards, '--timeline', timelineB, '--out', join(work, 'x'), '--style', 'claymation', '--keys-only']);
check('unsupported style fails explicitly', r.status === 1 && /unsupported-style/.test(r.stderr), {status: r.status, err: r.stderr.trim()});

await writeFile(join(work, 'test-results.json'), JSON.stringify({repo: relative(pkg, repo), results}, null, 2) + '\n');
const count = st => results.filter(x => x.status === st).length;
console.log(`${count('passed')} passed, ${count('failed')} failed, ${count('skipped')} skipped`);
process.exit(count('failed') ? 1 : 0);
