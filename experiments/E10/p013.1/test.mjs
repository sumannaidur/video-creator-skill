// P013.1 focused tests. From the repository root:
//   node experiments/E10/p013.1/test.mjs [--work <dir>]            engine + checkpoint tests (~3 min, 270×480 renders)
//   node experiments/E10/p013.1/test.mjs --tree-regression          Full HD tree render compared with P012.2 (~2 min)
import { renderFixture } from '../../E05/render.mjs';
import { ensureSpace } from './render.mjs';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, rm, truncate, writeFile, appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const timelinePath = resolve(root, 'experiments/E04/native-timing/outputs/sample-B-candidate.timeline.json');
const argv = process.argv.slice(2);
const work = resolve(argv.includes('--work') ? argv[argv.indexOf('--work') + 1] : join(tmpdir(), 'p013.1-tests'));
const results = [];
const check = (name, ok, detail = {}) => {
  results.push({name, ok: Boolean(ok), ...detail});
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${Object.keys(detail).length ? ' ' + JSON.stringify(detail) : ''}`);
};
const node = list => spawnSync(process.execPath, [join(here, 'render.mjs'), ...list], {encoding: 'utf8', windowsHide: true, cwd: root});
const close = (a, b) => Math.abs(a - b) < 1e-6;

if (argv.includes('--tree-regression')) {
  const out = join(here, 'tree-regression');
  const run = node(['--topic', join(here, 'topics/trees.js'), '--timeline', timelinePath, '--out', out,
    '--name', 'trees-v2-1080x1920.mp4', '--scale', '1', '--fps', '30', '--quality', '95', '--crf', '18', '--clean-frames']);
  check('tree Full HD render', run.status === 0, {stdout: run.stdout.trim(), stderr: run.stderr.trim().slice(-400)});
  const now = JSON.parse(await readFile(join(out, 'trees-v2-1080x1920-evidence.json'), 'utf8'));
  const base = JSON.parse(await readFile(join(here, '../p012.2/full-evidence.json'), 'utf8'));
  check('same cuts', now.shots.slice(0, -1).every((s, i) => close(s.end, base.cuts[i])), {cuts: now.shots.map(s => s.end)});
  check('same cue checks', JSON.stringify(now.cueChecks) === JSON.stringify(base.cueChecks));
  const props = e => ({v: ['codec_name', 'profile', 'width', 'height', 'pix_fmt', 'r_frame_rate', 'nb_read_frames', 'duration'].map(k => e.media.video[k]),
    a: ['codec_name', 'sample_rate', 'channels', 'duration'].map(k => e.media.audio[k]), onset: e.media.speechOnset.offsetSeconds});
  check('same media properties', JSON.stringify(props(now)) === JSON.stringify(props(base)), props(now));
  const keys = await readdir(join(out, 'keyframes'));
  const sameKeys = [];
  for (const k of keys.filter(k => k.startsWith('key-'))) {
    const [a, b] = await Promise.all([readFile(join(out, 'keyframes', k)), readFile(join(here, '../p012.2', k))]);
    sameKeys.push(a.equals(b));
  }
  check('keyframes byte-identical to P012.2', sameKeys.length === 10 && sameKeys.every(Boolean), {compared: sameKeys.length});
  const md5 = file => spawnSync('ffmpeg', ['-hide_banner', '-v', 'error', '-i', file, '-map', '0:v', '-f', 'framemd5', '-'], {encoding: 'utf8', maxBuffer: 2 ** 26})
    .stdout.split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split(',').at(-1).trim());
  const [m1, m2] = [md5(join(out, 'trees-v2-1080x1920.mp4')), md5(join(here, '../p012.2/trees-v2-1080x1920.mp4'))];
  const sameFrames = m1.filter((x, i) => x === m2[i]).length;
  let ssim = null;
  if (sameFrames !== m2.length) ssim = Number(spawnSync('ffmpeg', ['-hide_banner', '-i', join(out, 'trees-v2-1080x1920.mp4'), '-i', join(here, '../p012.2/trees-v2-1080x1920.mp4'),
    '-lavfi', 'ssim', '-f', 'null', '-'], {encoding: 'utf8'}).stderr.match(/All:([\d.]+)/)?.[1]);
  check('decoded video matches P012.2', sameFrames === m2.length || ssim > .999, {identicalFrames: `${sameFrames}/${m2.length}`, ssim});
  await writeFile(join(here, 'tree-regression/regression-results.json'), JSON.stringify(results, null, 2) + '\n');
  process.exit(results.every(r => r.ok) ? 0 : 1);
}

await rm(work, {recursive: true, force: true});
await mkdir(work, {recursive: true});
const timeline = JSON.parse(await readFile(timelinePath, 'utf8'));
const [engine, cards] = await Promise.all([readFile(join(here, 'paper-shots.js'), 'utf8'), readFile(join(here, 'topics/test-cards.js'), 'utf8')]);

// ---------- engine tests in one browser ----------
await renderFixture({
  fixture: pathToFileURL(resolve(root, 'experiments/E06/paper-explainer/story.html')),
  sizes: [['canvas', 1080, 1920]],
  browserArgs: ['--disable-gpu'],
  async capture({ call }) {
    const evaluate = async expression => {
      const reply = await call('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      if (reply.exceptionDetails) return {error: reply.exceptionDetails.exception?.description ?? 'error'};
      return reply.result.value;
    };
    const fresh = async (setup, tl = timeline) => {
      await call('Page.navigate', {url: pathToFileURL(resolve(root, 'experiments/E06/paper-explainer/story.html')).href});
      for (let i = 0; i < 50; i++) {
        if (await evaluate('document.readyState==="complete" && typeof renderPaperScene==="function" ? document.fonts.ready.then(()=>true) : null') === true) break;
        await delay(100);
      }
      return evaluate(`(() => { ${engine}\n${setup}\n return installPaperShots({timeline: ${JSON.stringify(tl)}, topic: globalThis.paperTopic}); })()`);
    };
    const withShots = shots => `globalThis.paperTopicOptions = ${JSON.stringify({shots})};\n${cards}`;
    const probe = times => evaluate(`(${JSON.stringify(times)}).map(t => { const s = paperShots.renderAt(t);
      const d = document.querySelector('.shot-overlay'), p = document.querySelector('.shot-paper');
      return {t, shot: s.shot, transition: s.transition, label: document.querySelector('.piece-label')?.textContent,
        dissolve: Number(d.style.opacity), sheet: p.style.visibility}; })`);

    // Variable shot counts, default pause-midpoint cuts.
    const [p1, p2, p3] = (await fresh(withShots([{id: 'all', scene: 'card-0', phrases: [0, 2]}]))).phrases;
    const one = await evaluate('paperShots.shots');
    check('one shot spanning three phrases', one.length === 1 && one[0].start === 0 && close(one[0].end, 8.925));
    const three = await fresh(cards);
    check('default: one shot per phrase, pause-midpoint cuts', three.shots.length === 3 &&
      close(three.shots[1].start, (p1.end + p2.start) / 2) && close(three.shots[2].start, (p2.end + p3.start) / 2),
      {starts: three.shots.map(s => s.start)});
    const two = await fresh(withShots([{id: 'intro', scene: 'card-0', phrases: [0, 1]}, {id: 'outro', scene: 'card-1', phrases: [2, 2]}]));
    check('two shots: multiple phrases per shot', two.shots.length === 2 && close(two.shots[1].start, (p2.end + p3.start) / 2));

    // Five shots with explicit boundaries, two shots inside one phrase, and both transition types.
    const five = [
      {id: 's1', scene: 'card-0', phrases: [0, 0], transition: {type: 'dissolve', symbol: 'tc-tiles'}},
      {id: 's2', scene: 'card-1', phrases: [1, 1]},
      {id: 's3', scene: 'card-2', phrases: [1, 1], start: {phrase: 1, offset: 1.3}, transition: {type: 'sheet', half: .2}},
      {id: 's4', scene: 'card-3', phrases: [2, 2], transition: {type: 'dissolve', symbol: 'tc-tiles', lead: .1, tail: .15, zoom: .1}},
      {id: 's5', scene: 'card-4', start: 7.2},
    ];
    const r5 = await fresh(withShots(five));
    const starts = r5.shots.map(s => s.start);
    const expected = [0, (p1.end + p2.start) / 2, p2.start + 1.3, (p2.end + p3.start) / 2, 7.2];
    check('five shots: explicit and default boundaries', starts.every((s, i) => close(s, expected[i])), {starts});
    const edges = await probe(r5.shots.flatMap(s => [s.start + .26, s.end - .26]));
    check('renderAt selects the right shot and scene', edges.every((e, i) => e.shot === r5.shots[i >> 1].id && e.label === r5.shots[i >> 1].id), {edges: edges.map(e => e.shot)});
    const tr = await probe([r5.shots[0].end, r5.shots[2].end, r5.shots[3].end, (r5.shots[1].start + r5.shots[1].end) / 2]);
    check('configurable transitions active at their boundaries', tr[0].transition === 'dissolve' && tr[0].dissolve > .99 && tr[1].transition === 'sheet' &&
      tr[1].sheet === 'visible' && tr[2].transition === 'dissolve' && tr[3].transition === null && tr[3].dissolve === 0 && tr[3].sheet === 'hidden',
      {at: tr.map(x => [x.shot, x.transition])});

    // Invalid input rejection.
    const bad = [
      ['empty shot list', withShots([]), 'non-empty'],
      ['duplicate shot ids', withShots([{id: 'a', scene: 'card-0', phrases: [0, 0]}, {id: 'a', scene: 'card-1', phrases: [1, 2]}]), 'unique'],
      ['first shot not at zero', withShots([{id: 'a', scene: 'card-0', phrases: [0, 2], start: .5}]), 'first shot must start at 0'],
      ['boundaries not increasing', withShots([{id: 'a', scene: 'card-0', phrases: [0, 0]}, {id: 'b', scene: 'card-1', start: 3}, {id: 'c', scene: 'card-2', start: 2}]), 'not increasing'],
      ['phrase index out of range', withShots([{id: 'a', scene: 'card-0', phrases: [0, 5]}]), 'out of range'],
      ['ambiguous cut inside a phrase', withShots([{id: 'a', scene: 'card-0', phrases: [0, 1]}, {id: 'b', scene: 'card-1', phrases: [1, 2]}]), 'shares a phrase'],
      ['boundary needs phrases or start', withShots([{id: 'a', scene: 'card-0', phrases: [0, 0]}, {id: 'b', scene: 'card-1'}]), 'explicit start'],
      ['shot too short', withShots([{id: 'a', scene: 'card-0', phrases: [0, 0]}, {id: 'b', scene: 'card-1', start: 1}, {id: 'c', scene: 'card-2', start: 1.1}]), 'shorter than'],
      ['boundary after narration', withShots([{id: 'a', scene: 'card-0', phrases: [0, 0]}, {id: 'b', scene: 'card-1', start: 9.5}]), 'outside'],
      ['unknown transition type', withShots([{id: 'a', scene: 'card-0', phrases: [0, 0], transition: {type: 'spin'}}, {id: 'b', scene: 'card-1', phrases: [1, 2]}]), 'unknown transition type'],
      ['transition on last shot', withShots([{id: 'a', scene: 'card-0', phrases: [0, 2], transition: {type: 'sheet'}}]), 'last shot'],
      ['dissolve without symbol', withShots([{id: 'a', scene: 'card-0', phrases: [0, 0], transition: {type: 'dissolve'}}, {id: 'b', scene: 'card-1', phrases: [1, 2]}]), 'needs a symbol'],
      ['transition window too long', withShots([{id: 'a', scene: 'card-0', phrases: [0, 0], transition: {type: 'sheet', half: 3}}, {id: 'b', scene: 'card-1', phrases: [1, 2]}]), 'does not fit'],
      ['missing transition symbol', withShots([{id: 'a', scene: 'card-0', phrases: [0, 0], transition: {type: 'dissolve', symbol: 'nope'}}, {id: 'b', scene: 'card-1', phrases: [1, 2]}]), 'missing transition symbol'],
      ['unknown scene', `${cards}\n globalThis.paperTopic.shots[2].scene = 'nowhere';`, 'unknown scene'],
      ['track for unknown object', inline(`motion.track('ghost', [motion.key(0, [0,0,0,1,1])]);`), 'unknown object ghost'],
      ['camera keys out of order', inline('', `cameras: {only: [motion.key(2, [0,0,1]), motion.key(1, [0,0,1])]}`), 'camera keys'],
      ['missing artwork symbol', inline('', '', 'tc-missing'), 'missing symbol'],
    ];
    for (const [name, setup, message] of bad) {
      const r = await fresh(setup);
      check(`rejects ${name}`, r?.error?.includes(message), {error: r?.error?.split('\n')[0]});
    }
    const noPhrases = await fresh(cards, {...timeline, records: timeline.records.filter(r => r.kind !== 'phrase')});
    check('rejects timeline without phrases', noPhrases?.error?.includes('no phrase records'), {error: noPhrases?.error?.split('\n')[0]});
  },
});

function inline(extra, ret = '', art = 'tc-card') {
  return `${cards}
  globalThis.paperTopic = {shots: [{id: 'only', scene: 'x', phrases: [0, 2]}], symbols: globalThis.paperTopic.symbols,
    build({P, motion}) { ${extra} return {scenes: {x: {objects: [P('a', '${art}', 50, 50, 40, 3)]}}, ${ret}}; }};`;
}

// ---------- renderer and checkpoint tests (270×480, 10 fps) ----------
const base = ['--topic', join(here, 'topics/test-cards.js'), '--timeline', timelinePath, '--scale', '.25', '--fps', '10', '--quality', '80', '--crf', '28'];
const usage = [
  ['missing --topic', ['--timeline', timelinePath, '--out', join(work, 'x')], '--topic is required'],
  ['invalid fps', [...base, '--out', join(work, 'x'), '--fps', '0'], 'Invalid --fps'],
  ['odd output size', [...base, '--out', join(work, 'x'), '--scale', '.33'], 'even whole pixels'],
  ['unknown option', [...base, '--out', join(work, 'x'), '--resolution', '4k'], 'Unknown option'],
  ['missing topic file', [...base, '--out', join(work, 'x'), '--topic', join(work, 'none.js')], 'Topic module not found'],
];
const tampered = join(work, 'tampered.timeline.json');
await writeFile(tampered, JSON.stringify({...timeline, audio: {...timeline.audio, sha256: '0'.repeat(64)}}));
usage.push(['audio hash mismatch', [...base, '--out', join(work, 'x'), '--timeline', tampered], 'does not match']);
for (const [name, list, message] of usage) {
  const r = node(list);
  check(`CLI rejects ${name}`, r.status === 2 && r.stderr.includes(message), {status: r.status, stderr: r.stderr.trim().split('\n')[0]});
}
const badShots = node([...base, '--out', join(work, 'x'), '--keys-only', '--options', JSON.stringify({shots: [{id: 'a', scene: 'card-0', phrases: [0, 0], start: 1}]})]);
check('CLI reports invalid topic input', badShots.status === 1 && badShots.stderr.includes('first shot must start at 0'), {stderr: badShots.stderr.trim().split('\n')[0]});

const out = join(work, 'cards');
const frames = join(out, 'frames');
const stats = r => r && r.status !== 0 ? {failed: r.status, stderr: r.stderr.trim().split('\n').slice(-3).join(' | ')} : JSON.parse(spawnSync(process.execPath, ['-e', `console.log(JSON.stringify(require(${JSON.stringify(join(out, 'video-evidence.json'))}).checkpoint))`], {encoding: 'utf8'}).stdout);
const listFrames = async () => (await readdir(frames)).filter(f => /^\d{6}\.jpg$/.test(f));

const interrupted = node([...base, '--out', out, '--stop-after', '30']);
const kept = await listFrames();
check('interruption preserves written frames', interrupted.status === 75 && kept.length === 30, {status: interrupted.status, frames: kept.length});
await writeFile(join(frames, '000030.jpg.tmp'), 'partial');
await appendFile(join(frames, 'frames.jsonl'), '{"i":30,"sha2');
const resumed = node([...base, '--out', out]);
let s = stats(resumed);
check('resume reuses valid frames and renders the rest', resumed.status === 0 && s.reused === 30 && s.rendered === 60 && s.strayTemp === 1, {s, stdout: resumed.stdout.trim()});
// Resumed output versus an uninterrupted render of the same configuration.
const straight = join(work, 'cards-straight');
const uninterrupted = node([...base, '--out', straight]);
const diffs = [];
for (const f of await listFrames()) {
  const [a, b] = await Promise.all([readFile(join(frames, f)), readFile(join(straight, 'frames', f))]);
  if (!a.equals(b)) diffs.push([f, Number(spawnSync('ffmpeg', ['-hide_banner', '-i', join(frames, f), '-i', join(straight, 'frames', f), '-lavfi', 'ssim', '-f', 'null', '-'],
    {encoding: 'utf8'}).stderr.match(/All:([\d.]+)/)?.[1])]);
}
check('resumed frames match an uninterrupted render', uninterrupted.status === 0 && diffs.every(([, ssim]) => ssim >= .999),
  {differingFrames: diffs.length, minSsim: diffs.length ? Math.min(...diffs.map(d => d[1])) : 1, frames: diffs.map(d => d[0]).slice(0, 5)});
const again = node([...base, '--out', out]);
s = stats(again);
check('complete checkpoint re-encodes without rendering', again.status === 0 && s.reused === 90 && s.rendered === 0, {s});

await truncate(join(frames, '000010.jpg'), 500);
await rm(join(frames, '000040.jpg'));
await copyFile(join(frames, '000051.jpg'), join(frames, '000050.jpg'));
const repaired = node([...base, '--out', out]);
s = stats(repaired);
check('corrupt and missing frames are detected and re-rendered', repaired.status === 0 && s.corrupt === 2 && s.missing === 1 && s.rendered === 3 && s.reused === 87, {s});

const changed = node([...base, '--out', out, '--quality', '70']);
s = stats(changed);
check('changed configuration invalidates stale frames', changed.status === 0 && s.invalidated === 90 && s.rendered === 90 && s.reused === 0, {s});
const changedTopic = node([...base, '--out', out, '--quality', '70', '--options', JSON.stringify({shots: [{id: 'solo', scene: 'card-0', phrases: [0, 2]}]})]);
s = stats(changedTopic);
check('changed topic options invalidate stale frames', changedTopic.status === 0 && s.invalidated === 90 && s.rendered === 90, {s});

let storageError = '';
try { await ensureSpace(work, 2 ** 60); } catch (error) { storageError = error.message; }
check('storage check refuses an impossible requirement', storageError.includes('Insufficient storage'), {error: storageError});

await writeFile(join(here, 'test-results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(`${results.filter(r => r.ok).length}/${results.length} passed`);
process.exit(results.every(r => r.ok) ? 0 : 1);
