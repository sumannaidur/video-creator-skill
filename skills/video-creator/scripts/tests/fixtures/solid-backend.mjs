// Test-only rendering backend with no browser: solid-colour frames from FFmpeg. It proves the core renderer
// (checkpointing, encoding, validation) works with a different backend without core changes. Not a style.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frame = (width, height, codec) => {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=0x427361:s=${width}x${height}`,
    '-frames:v', '1', '-c:v', codec, '-f', 'image2pipe', '-'], {windowsHide: true, maxBuffer: 2 ** 26});
  if (result.status !== 0) throw new Error('ffmpeg could not draw a test frame');
  return result.stdout;
};

export const backend = {
  name: 'solid-test',
  sources: [fileURLToPath(import.meta.url)],
  settings: {},
  plans: ['video-creator.render-plan/1'],
  async open({width, height}) {
    let captions = [], cache = {}, shotOf = () => 'solid';
    return {
      version: 'solid-test/1',
      close: async () => {},
      async install({timeline, plan}) {
        const rate = timeline.audio.sample_rate, duration = timeline.audio.sample_count / rate;
        const phrases = timeline.records.filter(r => r.kind === 'phrase').sort((a, b) => a.start - b.start)
          .map(r => ({start: r.start / rate, end: r.end / rate, text: r.label}));
        captions = phrases.map((p, i) => ({id: i + 1, start: p.start, end: i + 1 < phrases.length ? phrases[i + 1].start : duration, text: p.text}));
        // With a resolved plan, shots come from it and every cue is consumed (a backend with no notion of objects).
        const shots = plan ? plan.shots.map(s => ({id: s.id, scene: 'solid', start: s.start.seconds, end: s.end.seconds, transition: null}))
          : [{id: 'solid', scene: 'solid', start: 0, end: duration, transition: null}];
        shotOf = t => plan ? shots.findLast(s => s.start <= t)?.id ?? shots[0].id : 'solid';
        return {duration, phrases, captions, cues: [], shots, ...(plan ? {planCuesUsed: Object.keys(plan.cues)} : {}),
          checks: {keyframes: [['middle', duration / 2]], repeatAt: duration / 2, absentAfter: []}};
      },
      seek: async t => ({t, shot: shotOf(t), captionId: (captions.find(c => t >= c.start && t < c.end) ?? (t > 0 ? captions.at(-1) : null))?.id ?? null,
        transition: null, labels: [], opacity: {}, outside: []}),
      capture: async ({format = 'png', scale = 1}) => {
        const w = Math.round(width * scale), h = Math.round(height * scale), key = `${format}${w}x${h}`;
        return cache[key] ??= frame(w, h, format === 'jpeg' ? 'mjpeg' : 'png');
      },
    };
  },
};
