import { renderFixture } from '../../E05/render.mjs';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const fps = 12;
const out = new URL('.',import.meta.url);
const elapsed = performance.now();
const evidence = {fps, canvas:[1920,1080], preview:[1280,720], audio:'silent motion test', keyframes:[]};
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
await renderFixture({
  chrome:process.argv[2],
  fixture:new URL('../../E06/paper-explainer/story.html?motion=1',import.meta.url),
  sizes:[['horizontal',1920,1080]],
  browserArgs:['--disable-gpu'],
  async capture({ call,width,height }) {
    const evaluate = async expression => {
      const reply = await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception?.description || 'Browser evaluation failed');
      return reply.result.value;
    };
    let seconds;
    for (let tries=0;tries<50&&!seconds;tries++) {
      seconds = await evaluate('document.readyState==="complete" && globalThis.paperMotion ? document.fonts.ready.then(() => paperMotion.duration) : null');
      if (!seconds) await delay(100);
    }
    if (!seconds) throw new Error('Motion fixture did not load');
    const seek = t => evaluate(`(() => {
      const state=paperMotion.renderAt(${t});
      const safe=document.querySelector('[data-safe]').getBoundingClientRect();
      const objects=[...document.querySelectorAll('.piece,[data-required="title"],footer')];
      const bounds=objects.map(el=>{
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
    const screenshot = async (format='png',scale=1) => Buffer.from((await call('Page.captureScreenshot',{
      format,fromSurface:true,...(format==='jpeg'?{quality:91}:{}),
      clip:{x:0,y:0,width,height,scale},
    })).data,'base64');
    for (const [name,t] of [['start',0],['lift',.82],['wipe',2.8],['reveal',4.18],['end',9]]) {
      const state=await seek(t);
      const png=await screenshot();
      if (state.outside.length) throw new Error(`Bounds at ${t}: ${state.outside.join(', ')}`);
      if (png.readUInt32BE(16)!==width||png.readUInt32BE(20)!==height) throw new Error('Unexpected PNG size');
      await writeFile(new URL(name+'.png',out),png);
      evidence.keyframes.push({name,...state,sha256:hash(png)});
    }
    const replay=await seek(.82);
    const first=evidence.keyframes.find(frame=>frame.name==='lift');
    const replayPng=await screenshot();
    evidence.repeatability = {seconds:.82, sameFrame:hash(replayPng)===first.sha256,
      sameState:JSON.stringify(replay.bounds)===JSON.stringify(first.bounds)};
    if (!evidence.repeatability.sameFrame||!evidence.repeatability.sameState) {
      await writeFile(new URL('repeatability-failure.png',out),replayPng);
      throw new Error('Seek repeatability failed: '+JSON.stringify(evidence.repeatability));
    }
    const before=evidence.keyframes[0].bounds.find(r=>r.id==='departing-aircraft');
    const midway=first.bounds.find(r=>r.id===before.id);
    evidence.planeDisplacementPixels=Math.hypot(midway.x-before.x,midway.y-before.y);
    if (evidence.planeDisplacementPixels<40) throw new Error('Plane movement not evident');

    const frames=Math.round(seconds*fps);
    const ffmpeg=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),
      '-vcodec','mjpeg','-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','19',
      '-pix_fmt','yuv420p','-movflags','+faststart',fileURLToPath(new URL('flight-motion.mp4',out))],
      {stdio:['pipe','ignore','inherit'],windowsHide:true});
    const finished=once(ffmpeg,'exit');
    try {
      for (let i=0;i<frames;i++) {
        const state=await seek(i/fps);
        if (state.outside.length) throw new Error(`Frame ${i} bounds: ${state.outside.join(', ')}`);
        const frame=await screenshot('jpeg',2/3);
        await new Promise((ok,fail)=>ffmpeg.stdin.write(frame,error=>error?fail(error):ok()));
      }
    } finally {
      ffmpeg.stdin.end();
      const [code]=await finished;
      if (code!==0) throw new Error('FFmpeg encoding failed: '+code);
    }
    evidence.frames=frames;
    evidence.seconds=seconds;
    evidence.boundsChecked=frames+evidence.keyframes.length;
  },
});
evidence.renderWallSeconds=(performance.now()-elapsed)/1000;
await writeFile(new URL('motion-evidence.json',out),JSON.stringify(evidence,null,2)+'\n');
