// Time is seconds. Each track has an explicit start/end state and no clock.
function installPaperMotion(plan) {
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = {
    linear: p => p,
    out: p => 1 - (1-p)**3,
    smooth: p => p*p*(3-2*p),
  };
  const progress = (time,start,end,curve='out') => ease[curve](clamp((time-start)/(end-start)));
  const tween = (time, {start,end,from,to,curve}) => {
    const p = progress(time,start,end,curve);
    return from.map((x,i)=>x+(to[i]-x)*p);
  };
  // x/y are fractions of the stage. Rotation is degrees.
  const neutral = [0,0,0,1,1];
  const enter = (id,start,from,duration=.42) => ({id,start,end:start+duration,from,to:neutral});
  const stagger = (ids,start,step,from) => ids.map((id,i)=>enter(id,start+i*step,from));
  const scenes = plan?.scenes ?? [
    {id:'flights-hook', start:0,
      tracks:[enter('boarding-ticket',0,[.01,.11,8,.90,.6],.64),
              enter('departing-aircraft',.08,[0,0,11,.68,1],1.36),
              enter('fare-question',1.12,[0,.04,-22,.70,0],.45)],
      follow:{id:'departing-aircraft',start:.08,end:1.44,d:'M42 57 Q45 49 48 39'},
      draws:[['question-points-to-fare',1.23,1.78]],
      camera:{start:.1,end:1.8,from:[-.012,.014,.97],to:[.014,-.012,1.035],curve:'smooth'},
      caption:[.31,2.72]},
    {id:'flights-mechanism', start:2.8,
      tracks:[enter('operating-flight',.04,[0,.055,-8,.83,.3]),
        ...stagger(['fuel-supply','flight-crew','aircraft-upkeep','airport-services'],.35,.48,[0,.06,8,.77,0])],
      draws:[['fuel-to-flight',.57,1],['crew-to-flight',1.05,1.48],
             ['upkeep-to-flight',1.53,1.96],['airport-to-flight',2.01,2.44]],
      camera:{start:0,end:2.7,from:[0,.01,.97],to:[-.012,0,1.02],curve:'smooth'},
      caption:[.20,3.33]},
    {id:'flights-closing', start:6.2,
      tracks:[...stagger(['date-tab-a','date-tab-b'],.08,.18,[0,-.06,-11,.80,0]),
              ...stagger(['fare-ticket-a','fare-ticket-b'],.69,.26,[0,.095,11,.81,0])],
      draws:[['one-date-to-fare',.55,1.10],['other-date-to-fare',.80,1.35]],
      camera:{start:0,end:1.65,from:[.012,-.01,.98],to:[0,0,1.02],curve:'smooth'},
      caption:[.82,9]},
  ];
  const duration = plan?.duration ?? 9;
  const stage = document.querySelector('.story-stage');
  const caption = document.querySelector('footer');
  const wipe = document.createElement('div');
  wipe.setAttribute('aria-hidden','true');
  Object.assign(wipe.style,{position:'fixed',inset:'0',background:'var(--paper)',zIndex:20,
    pointerEvents:'none',boxShadow:'0 0 28px #252a302a'});
  document.body.append(wipe);
  let active, width, height, route;

  function setup(scene) {
    stage.style.transform = '';
    caption.style.opacity = '';
    renderPaperScene(scene.id);
    width = stage.offsetWidth;
    height = stage.offsetHeight;
    for (const [id] of scene.draws) {
      const [line] = document.getElementById(id).querySelectorAll('path');
      line.setAttribute('pathLength','1');
      // Keep dash lengths in stage coordinates for the normalized reveal.
      line.style.vectorEffect = 'none';
      line.style.strokeWidth = '.36';
    }
    route = null;
    if (scene.follow) {
      route = document.createElementNS('http://www.w3.org/2000/svg','path');
      route.setAttribute('d',scene.follow.d);
    }
    active = scene;
  }

  function renderAt(seconds) {
    if (!Number.isFinite(seconds)) throw new TypeError('Explicit seconds required');
    const t = Math.max(0,Math.min(duration,seconds));
    const scene = scenes.findLast(item=>item.start<=t);
    if (scene!==active || stage.offsetWidth!==width || stage.offsetHeight!==height) setup(scene);
    const local = t-scene.start;
    const [cx,cy,zoom] = tween(local,scene.camera);
    stage.style.transform = `translate(${cx*width}px,${cy*height}px) scale(${zoom})`;
    for (const object of paperScenes[scene.id].objects) {
      const track = scene.tracks.find(item=>item.id===object.id);
      const value = track ? tween(local,track) : [...neutral];
      if (scene.follow?.id===object.id) {
        const p = progress(local,scene.follow.start,scene.follow.end,'smooth');
        const xy = route.getPointAtLength(route.getTotalLength()*p);
        value[0] += (xy.x-object.position.x)/100;
        value[1] += (xy.y-object.position.y)/100;
      }
      // Backing paper drifts opposite the camera, creating depth.
      const depth = object.layer===0 ? -.55 : 0;
      const node = document.getElementById(object.id);
      node.style.transform = `translate(-50%,-50%) translate(${(value[0]+cx*depth)*width}px,${(value[1]+cy*depth)*height}px) rotate(${value[2]}deg) scale(${value[3]})`;
      node.style.opacity = String(value[4]*(object.layer===0?.66:object.id==='route-ghost'?.23:1));
    }
    for (const [id,start,end] of scene.draws) {
      const p = progress(local,start,end,'smooth');
      const [line,tip] = document.getElementById(id).querySelectorAll('path');
      line.style.opacity = String(p>0 ? 1 : 0);
      line.style.strokeDasharray = p===1 ? 'none' : '1 1';
      line.style.strokeDashoffset = String(1-p);
      tip.style.opacity = String(progress(local,end-.10,end,'linear'));
    }
    let activeCaption = null;
    if (scene.captions) {
      activeCaption = scene.captions.find(item=>local>=item.start &&
        local<item.end) ?? null;
      caption.textContent = activeCaption?.text ?? '';
      caption.style.opacity = activeCaption ? '1' : '0';
    } else {
      const [on,off] = scene.caption;
      caption.style.opacity = String(progress(local,on,on+.14,'linear')*(1-progress(local,off-.14,off,'linear')));
    }
    const cut = scenes.slice(1).find(item=>Math.abs(t-item.start)<.17);
    wipe.style.visibility = cut ? 'visible' : 'hidden';
    wipe.style.transform = cut ? `translateX(${(t-cut.start)/.17*100}%)` : 'translateX(-100%)';
    return {t,scene:scene.id,caption:Number(caption.style.opacity),captionId:activeCaption?.id ?? null,
            camera:[cx,cy,zoom],transition:Boolean(cut)};
  }
  globalThis.paperMotion = {duration,renderAt};
  renderAt(0);
}
if (new URLSearchParams(location.search).get('motion') === '1') {
  installPaperMotion(globalThis.paperMotionPlan);
}
