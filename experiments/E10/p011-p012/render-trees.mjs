// P011–P012: render the tree-cooling Paper Explainer scene against Kokoro Hindi Sample B.
// Usage (repository root):
//   node experiments/E10/p011-p012/render-trees.mjs preview [chrome.exe]   540×960, 15 fps review copy
//   node experiments/E10/p011-p012/render-trees.mjs full    [chrome.exe]   1080×1920, 30 fps H.264/AAC
import { renderFixture } from '../../E05/render.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const mode = process.argv[2] ?? 'preview';
const profiles = {
  preview: {fps:15, scale:.5, quality:88, crf:23, name:'trees-preview.mp4'},
  full: {fps:30, scale:1, quality:95, crf:18, name:'trees-1080x1920.mp4'},
};
const profile = profiles[mode];
if (!profile) throw new Error('Mode must be preview or full');
const out = new URL('.', import.meta.url);
const root = new URL('../../../', import.meta.url);
const timelineFile = new URL('experiments/E04/native-timing/outputs/sample-B-candidate.timeline.json', root);
const timeline = JSON.parse(await readFile(timelineFile, 'utf8'));
const audioFile = new URL(timeline.audio.path, root);
const audio = await readFile(audioFile);
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
if (hash(audio) !== timeline.audio.sha256) throw new Error('Sample B audio does not match its timeline hash');
const trees = await readFile(new URL('trees.js', import.meta.url), 'utf8');
const [width, height] = [1080, 1920];
const elapsed = performance.now();
const evidence = {mode, fps:profile.fps, canvas:[width,height], output:[width*profile.scale,height*profile.scale],
  audio:{path:timeline.audio.path, sha256:timeline.audio.sha256, timingStatus:timeline.validation},
  keyframes:[]};

await renderFixture({
  chrome: process.argv[3],
  fixture: new URL('../../E06/paper-explainer/story.html', import.meta.url),
  sizes: [['vertical', width, height]],
  browserArgs: ['--disable-gpu'],
  async capture({ call }) {
    const evaluate = async expression => {
      const reply = await call('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
      if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception?.description || 'Browser evaluation failed');
      return reply.result.value;
    };
    let ready;
    for (let tries = 0; tries < 50 && !ready; tries++) {
      ready = await evaluate('document.readyState==="complete" && typeof installPaperMotion==="function" ? document.fonts.ready.then(()=>true) : null');
      if (!ready) await delay(100);
    }
    if (!ready) throw new Error('Story fixture did not load');
    evidence.captions = await evaluate(`(() => { ${trees}\n return installTrees(${JSON.stringify(timeline)}); })()`);
    const seconds = await evaluate('paperMotion.duration');
    const seek = t => evaluate(`(() => {
      const state=paperMotion.renderAt(${t});
      const safe=document.querySelector('[data-safe]').getBoundingClientRect();
      const bounds=[...document.querySelectorAll('.piece,[data-required="title"],footer')].map(el=>{
        const r=el.getBoundingClientRect();
        return {id:el.id||el.dataset.required,x:r.x,y:r.y,width:r.width,height:r.height,
                opacity:Number(getComputedStyle(el).opacity)};
      });
      const outside=bounds.filter(r=>r.opacity>.005 && (r.x<safe.x-1||r.y<safe.y-1||
        r.x+r.width>safe.right+1||r.y+r.height>safe.bottom+1)).map(r=>r.id);
      for(const el of document.querySelectorAll('[data-text]:not([hidden])')) {
        const r=el.getBoundingClientRect(), range=document.createRange();
        range.selectNodeContents(el);
        if([...range.getClientRects()].some(q=>q.width && (q.left<r.left-2||q.right>r.right+2||
          q.top<r.top-2||q.bottom>r.bottom+2))) outside.push('text:'+el.textContent);
      }
      if(document.documentElement.scrollWidth!==innerWidth||document.documentElement.scrollHeight!==innerHeight) outside.push('viewport');
      return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({...state,bounds,outside}))));
    })()`);
    const screenshot = async (format='png', scale=1) => Buffer.from((await call('Page.captureScreenshot', {
      format, fromSurface:true, ...(format==='jpeg' ? {quality:profile.quality} : {}),
      clip:{x:0, y:0, width, height, scale},
    })).data, 'base64');

    // Keyframes on either side of each provisional phrase onset.
    const [shade, vapor, air] = evidence.captions.map(c => c.start);
    const keys = [['start',0],['shade-before',shade-.02],['shade',shade+.9],['vapor-before',vapor-.02],
      ['vapor',vapor+2],['air-before',air-.02],['air',air+1.6],['end',seconds]];
    for (const [name, t] of keys) {
      const state = await seek(t);
      if (state.outside.length) throw new Error(`Bounds at ${t}: ${state.outside.join(', ')}`);
      const png = await screenshot();
      if (png.readUInt32BE(16)!==width || png.readUInt32BE(20)!==height) throw new Error('Unexpected PNG size');
      if (mode === 'full') await writeFile(new URL(name+'.png', out), png);
      evidence.keyframes.push({name, ...state, sha256:hash(png)});
    }
    const frame = name => evidence.keyframes.find(k => k.name===name);
    const object = (name, id) => frame(name).bounds.find(b => b.id===id);
    // Each cue object must be hidden just before its phrase and visible after it.
    evidence.cueChecks = [['shade','shade-patch'],['vapor','water-vapor'],['air','cool-air']].map(([cue,id]) => ({
      cue, id, before:object(cue+'-before',id).opacity, after:object(cue,id).opacity,
      caption:frame(cue).captionId,
    }));
    if (evidence.cueChecks.some(c => c.before > .01 || c.after < .99)) throw new Error('Cue timing check failed: '+JSON.stringify(evidence.cueChecks));
    const replay = await seek(shade+.9);
    const replayPng = await screenshot();
    evidence.repeatability = {seconds:shade+.9, sameFrame:hash(replayPng)===frame('shade').sha256,
      sameState:JSON.stringify(replay.bounds)===JSON.stringify(frame('shade').bounds)};
    if (!evidence.repeatability.sameState) throw new Error('Seek repeatability failed');

    const frames = Math.ceil(seconds*profile.fps);
    const file = fileURLToPath(new URL(profile.name, out));
    const ffmpeg = spawn('ffmpeg', ['-hide_banner','-loglevel','error','-y',
      '-f','image2pipe','-framerate',String(profile.fps),'-vcodec','mjpeg','-i','-',
      '-i',fileURLToPath(audioFile),'-map','0:v','-map','1:a',
      '-vf','scale=in_range=pc:out_range=tv,format=yuv420p','-c:v','libx264','-preset','medium',
      '-crf',String(profile.crf),'-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',
      '-r',String(profile.fps),'-c:a','aac','-b:a','160k','-ar','48000','-af','apad','-shortest',
      '-movflags','+faststart',file], {stdio:['pipe','ignore','inherit'], windowsHide:true});
    const finished = once(ffmpeg, 'exit');
    const captionsSeen = new Set();
    try {
      for (let i = 0; i < frames; i++) {
        const state = await seek(i/profile.fps);
        if (state.outside.length) throw new Error(`Frame ${i} bounds: ${state.outside.join(', ')}`);
        if (state.captionId) captionsSeen.add(state.captionId);
        const jpeg = await screenshot('jpeg', profile.scale);
        await new Promise((ok, fail) => ffmpeg.stdin.write(jpeg, error => error ? fail(error) : ok()));
      }
    } finally {
      ffmpeg.stdin.end();
      const [code] = await finished;
      if (code !== 0) throw new Error('FFmpeg encoding failed: '+code);
    }
    Object.assign(evidence, {file:profile.name, frames, seconds, boundsChecked:frames+evidence.keyframes.length,
      captionsSeen:[...captionsSeen]});
  },
});

// Container, decode and audio-onset checks on the written file.
const file = fileURLToPath(new URL(evidence.file, out));
const run = args => {
  const result = spawnSync(args[0], args.slice(1), {encoding:'utf8', windowsHide:true});
  if (result.status !== 0) throw new Error(args[0]+' failed: '+result.stderr);
  return result.stdout + result.stderr;
};
const probe = JSON.parse(run(['ffprobe','-v','error','-count_frames','-show_entries',
  'stream=codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_read_frames,sample_rate,channels,start_time,duration:format=duration',
  '-of','json',file]));
const decode = run(['ffmpeg','-hide_banner','-v','error','-i',file,'-f','null','-']).trim();
const onset = source => {
  const text = run(['ffmpeg','-hide_banner','-i',source,'-af','silencedetect=noise=-40dB:d=0.2','-f','null','-']);
  return Number(text.match(/silence_end: ([\d.]+)/)?.[1]);
};
const [video, sound] = ['video','audio'].map(type => probe.streams.find(s => s.codec_type===type));
evidence.media = {video, audio:sound, container:probe.format, decodeErrors:decode || null,
  speechOnset:{sourceWav:onset(fileURLToPath(audioFile)), mp4:onset(file)}};
evidence.media.speechOnset.offsetSeconds = evidence.media.speechOnset.mp4 - evidence.media.speechOnset.sourceWav;
evidence.renderWallSeconds = (performance.now()-elapsed)/1000;
await writeFile(new URL(mode+'-evidence.json', out), JSON.stringify(evidence, null, 2)+'\n');
const failures = [];
if (video?.codec_name!=='h264' || sound?.codec_name!=='aac') failures.push('codecs');
if (video.pix_fmt!=='yuv420p') failures.push('pixel format');
if (video.width!==evidence.output[0] || video.height!==evidence.output[1]) failures.push('dimensions');
if (video.r_frame_rate!==`${profile.fps}/1` || Number(video.nb_read_frames)!==evidence.frames) failures.push('frames');
if (Math.abs(Number(video.duration)-Number(sound.duration)) > 1/profile.fps + .03) failures.push('stream duration');
if (decode) failures.push('decode');
if (!(Math.abs(evidence.media.speechOnset.offsetSeconds) <= .03)) failures.push('audio onset');
if (failures.length) throw new Error('Media checks failed: '+failures.join(', '));
console.log(`${evidence.file}: ${evidence.frames} frames, ${Number(evidence.media.container.duration).toFixed(3)} s, ${evidence.renderWallSeconds.toFixed(1)} s wall`);
