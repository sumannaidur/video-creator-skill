// Tech Explainer rendering backend (style implementation #2, P017.1): Chromium + inline SVG + the tech shot engine.
// Implements the renderer backend contract documented in references/rendering.md.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { findChrome, launch } from '../../lib/chrome.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const BROWSER_ARGS = ['--disable-gpu'];

// Shared shot-core backend factory (P017.2). Tech Explainer is its first user; another style passes its own folder,
// host page, kit, stylesheet and topic global, and reuses this engine, view and preflight inspection unchanged.
// `prepare({topicOptions})` (optional, async) returns script evaluated before the topic, e.g. verified media (P017.7).
export function createShotBackend({name, dir = here, host = 'host.html', kit = 'kit.js', styleFiles = ['tech.css'], topicGlobal = 'techTopic', label = 'Tech Explainer', prepare = null, browserArgs = BROWSER_ARGS} = {}) {
  const core = ['engine.js', 'view.js', 'backend.mjs', '../shared/presentation.js', '../shared/texture.js', '../../lib/chrome.mjs'].map(f => join(here, f));
  return {
  name,
  // Files whose contents can change pixels; hashed into the checkpoint configuration.
  sources: [...core, ...[kit, host, ...styleFiles, ...(dir === here ? [] : ['backend.mjs'])].map(f => join(dir, f))],
  settings: {browserArgs, deviceScaleFactor: 1},
  // Resolved-plan timing contracts this backend consumes (scripts/lib/resolved-plan.mjs).
  plans: ['video-creator.render-plan/1'],
  // Caption timing contracts this backend renders (scripts/lib/captions.mjs); the visual treatment is this style's own.
  captions: ['video-creator.captions/1'],
  // Geometry checks this backend's inspect(t) performs for scripts/preflight.mjs (Tech Explainer rules: the same geometry checks, applied to this style's own DOM).
  preflight: {checks: ['safe-area', 'text-clipping', 'required-object-bounds', 'invalid-transform', 'visibility-requirement', 'plate-coverage', 'viewport', 'caption-layout']},
  // Read-only requirement probe for doctor.py (does not launch the browser).
  requirements: [{name: 'chromium-browser', required: true, purpose: 'headless frame rendering'}],
  probe({chrome} = {}) {
    try { return {ok: true, browser: findChrome(chrome)}; } catch (error) { return {ok: false, code: error.code ?? 'missing-browser', reason: error.message}; }
  },
  async open({chrome, width, height, locale, font}) {
    const page = await launch({chrome, width, height, browserArgs});
    const {call, evaluate} = page;
    try {
      await call('Page.navigate', {url: pathToFileURL(join(dir, host)).href});
      let ready;
      for (let tries = 0; tries < 50 && !ready; tries++) {
        ready = await evaluate('document.readyState==="complete" && typeof renderTechScene==="function" ? document.fonts.ready.then(()=>true) : null').catch(() => null);
        if (!ready) await delay(100);
      }
      if (!ready) throw new Error(`${label} host page did not load`);
    } catch (error) { await page.close(); throw error; }
    const engine = await readFile(join(here, 'engine.js'), 'utf8'), kitSource = await readFile(join(dir, kit), 'utf8');
    const presentationSource = await readFile(join(here, '../shared/presentation.js'), 'utf8'), texture = await readFile(join(here, '../shared/texture.js'), 'utf8');
    return {
      version: page.version,
      close: page.close,
      async install({timeline, topicSource, topicOptions, plan, captions, presentation}) {
        const prelude = prepare ? await prepare({topicOptions}) : '';
        return evaluate(`(() => { ${presentationSource}
          ${texture}
          ${engine}
          ${kitSource}
          globalThis.techTopicOptions = ${JSON.stringify(topicOptions ?? null)} ?? undefined;
          ${prelude}
          ${topicSource}
          return installTechShots({timeline: ${JSON.stringify(timeline)}, topic: globalThis.${topicGlobal},
            locale: ${JSON.stringify(locale ?? null)}, font: ${JSON.stringify(font ?? null)}${plan ? `, plan: ${JSON.stringify(plan)}` : ''}${captions ? `, captions: ${JSON.stringify(captions)}` : ''}${presentation ? `, presentation: ${JSON.stringify(presentation)}` : ''}}); })()`);
      },
      describe: () => evaluate(`({presentation: document.documentElement.dataset.presentation ?? 'framed', lang: document.documentElement.lang, captionFont: getComputedStyle(document.querySelector('footer')).fontFamily,
        labelFont: getComputedStyle(document.documentElement).getPropertyValue('--vc-font').trim()})`),
      seek: t => evaluate(`(() => {
        const state=techShots.renderAt(${t});
        const outside=[], box=el=>el.getBoundingClientRect();
        const safe=box(document.querySelector('[data-safe]')), stage=box(document.querySelector('.story-stage'));
        const inside=(r,b,m=1)=>r.left>=b.left-m&&r.top>=b.top-m&&r.right<=b.right+m&&r.bottom<=b.bottom+m;
        const shown=el=>{for(let n=el;n&&n!==document.body;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<=.005)return false}return true};
        const fb=document.documentElement.dataset.presentation==='full-bleed', textBox=fb?safe:stage;
        if(!fb&&!inside(stage,safe)) outside.push('stage');
        const footer=document.querySelector('footer');
        if(shown(footer)&&!inside(box(footer),safe)) outside.push('caption');
        const hook=document.querySelector('#vc-hook .vc-hook-text');
        if(hook&&shown(hook)&&!inside(box(hook),safe)) outside.push('hook');
        const title=box(document.querySelector('h1'));
        if(title.width||title.height) outside.push('headline-visible');
        const labels=[];
        for(const el of document.querySelectorAll('[data-text]:not([hidden])')) {
          if(!shown(el)) continue;
          const r=box(el), range=document.createRange();
          range.selectNodeContents(el);
          if([...range.getClientRects()].some(q=>q.width&&(q.left<r.left-2||q.right>r.right+2||q.top<r.top-2||q.bottom>r.bottom+2))) outside.push('text-overflow:'+el.textContent);
          if(el.classList.contains('piece-label')) {
            labels.push({id:el.parentElement.id,x:r.x,y:r.y,width:r.width,height:r.height});
            if(!inside(r,textBox,0)) outside.push('label-clipped:'+el.textContent);
          }
        }
        for(const el of document.querySelectorAll('.piece.plate.cover')) if(!inside(stage,box(el),.5)) outside.push('plate-gap:'+el.id);
        if(document.documentElement.scrollWidth!==innerWidth||document.documentElement.scrollHeight!==innerHeight) outside.push('viewport');
        for(const {id,after} of techShots.checks.absentAfter) {
          const el=document.getElementById(id);
          if(${t}>after && el && Number(el.style.opacity)>.005) outside.push('present-after:'+id);
        }
        const opacity=Object.fromEntries([...document.querySelectorAll('.piece')].map(el=>[el.id,Number(el.style.opacity)]));
        return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({...state,labels,opacity,outside}))));
      })()`),
      // Preflight: structured geometry findings for time t without capturing pixels or waiting for paint.
      // Labels (text) must stay inside the stage; art objects only when the topic declares `required: true`.
      // Undeclared art may overflow (decorative bleed, off-screen entrances); required bounds are exempt during transitions.
      inspect: t => evaluate(`(() => {
        const state=techShots.renderAt(${t}), findings=[], exempt={transition:0, decorativeOffStage:0};
        const box=el=>el.getBoundingClientRect(), rect=r=>({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)});
        const safe=box(document.querySelector('[data-safe]')), stage=box(document.querySelector('.story-stage'));
        const inside=(r,b,m=1)=>r.left>=b.left-m&&r.top>=b.top-m&&r.right<=b.right+m&&r.bottom<=b.bottom+m;
        const shown=el=>{for(let n=el;n&&n!==document.body;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<=.005)return false}return true};
        const add=(type,object,evidence)=>findings.push({type,object,evidence});
        const fb=document.documentElement.dataset.presentation==='full-bleed', textBox=fb?safe:stage;
        if(!fb&&!inside(stage,safe)) add('safe-area','stage',{box:rect(stage),safe:rect(safe)});
        const footer=document.querySelector('footer');
        if(shown(footer)&&!inside(box(footer),safe)) add('safe-area','caption',{box:rect(box(footer)),safe:rect(safe)});
        // Caption layout from the browser's own shaping and font metrics: line count, text inside the card, whole graphemes
        // and whole words per line. Measured once per caption text/width/font and cached.
        const active=techShots.captions.find(c=>${t}>=c.start&&${t}<c.end);
        if(active&&document.documentElement.dataset.captions!=='off'&&!footer.textContent.trim()) add('caption-layout','caption '+active.id,{reason:'a caption is active but the card shows no text',text:active.text});
        if(shown(footer)&&footer.textContent.trim()) {
          const cs=getComputedStyle(footer), max=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--caption-max-lines'))||null;
          const cache=globalThis.__vcCaptionLayout??=new Map(), key=[footer.textContent,footer.clientWidth,cs.font,max].join('|');
          let m=cache.get(key);
          if(!m) {
            const fb=box(footer), k=fb.width/footer.offsetWidth, lh=(parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.5)*k;
            const inner={left:fb.left+(parseFloat(cs.borderLeftWidth)+parseFloat(cs.paddingLeft))*k-2, right:fb.right-(parseFloat(cs.borderRightWidth)+parseFloat(cs.paddingRight))*k+2,
              top:fb.top+parseFloat(cs.borderTopWidth)*k-2, bottom:fb.bottom-parseFloat(cs.borderBottomWidth)*k+2};
            const tops=[], line=y=>{let i=tops.findIndex(t=>Math.abs(t-y)<lh/2); if(i<0){tops.push(y); i=tops.length-1} return i};
            const seg=new Intl.Segmenter(footer.lang||document.documentElement.lang||undefined,{granularity:'grapheme'});
            m={problems:[]};
            const walker=document.createTreeWalker(footer,NodeFilter.SHOW_TEXT);
            for(let node=walker.nextNode(); node; node=walker.nextNode()) for(const g of seg.segment(node.data)) {
              if(!g.segment.trim()) continue;
              const range=document.createRange(); range.setStart(node,g.index); range.setEnd(node,g.index+g.segment.length);
              const rs=[...range.getClientRects()].filter(r=>r.width>0);
              if(!rs.length) continue;
              const ls=new Set(rs.map(r=>line(r.top)));
              if(ls.size>1) m.problems.push({reason:'grapheme split across lines',grapheme:g.segment});
              if(rs.some(r=>r.left<inner.left||r.right>inner.right||r.top<inner.top||r.bottom>inner.bottom)) m.problems.push({reason:'text outside the caption card',grapheme:g.segment,box:rect(rs[0]),card:rect(fb)});
            }
            for(const w of footer.querySelectorAll('.cw')) if(new Set([...w.getClientRects()].filter(r=>r.width>0).map(r=>line(r.top))).size>1) m.problems.push({reason:'word broken across lines',word:w.textContent});
            m.lines=tops.length;
            if(max&&m.lines>max) m.problems.push({reason:'more lines than allowed',lines:m.lines,maxLines:max});
            const strip=s=>[...s].filter(ch=>ch.trim()!=='').join(''), cur=techShots.captions.find(c=>String(c.id)===footer.dataset.cid);
            if(cur&&strip(cur.text)!==strip(footer.textContent)) m.problems.push({reason:'rendered text differs from the caption text'});
            cache.set(key,m);
          }
          for(const p of m.problems.slice(0,3)) add('caption-layout','caption '+(footer.dataset.cid||'legacy'),{...p,lines:m.lines,text:footer.textContent});
        }
        const title=box(document.querySelector('h1'));
        if(title.width||title.height) add('visibility-requirement','headline',{reason:'hidden headline is visible'});
        for(const el of document.querySelectorAll('[data-text]:not([hidden])')) {
          if(!shown(el)) continue;
          const r=box(el), range=document.createRange(), owner=el.parentElement.id||el.className;
          range.selectNodeContents(el);
          if([...range.getClientRects()].some(q=>q.width&&(q.left<r.left-2||q.right>r.right+2||q.top<r.top-2||q.bottom>r.bottom+2))) add('text-clipping',owner,{reason:'text overflows its box',text:el.textContent,box:rect(r)});
          if(el.classList.contains('piece-label')&&!inside(r,textBox,0)) add('text-clipping',owner,{reason:fb?'label outside the text-safe area':'label outside the stage',text:el.textContent,box:rect(r),stage:rect(textBox)});
        }
        const shot=techShots.shots.find(s=>s.id===state.shot), scene=globalThis.techScenes[shot.scene];
        for(const o of scene.objects) {
          const el=document.getElementById(o.id);
          if(!el||!shown(el)) continue;
          const r=box(el);
          if(inside(r,stage,1)) continue;
          if(!o.required) { if(!o.plate) exempt.decorativeOffStage++; continue; }
          if(state.transition) { exempt.transition++; continue; }
          add('required-object-bounds',o.id,{box:rect(r),stage:rect(stage)});
        }
        for(const el of document.querySelectorAll('.story-stage *, footer')) {
          const s=el.style, bad=/NaN|Infinity/.test(s.transform+s.opacity+s.clipPath)||(s.opacity!==''&&!(Number(s.opacity)>=0&&Number(s.opacity)<=1));
          if(bad) add('invalid-transform',el.id||el.className,{transform:s.transform,opacity:s.opacity});
        }
        const cam=document.querySelector('.shot-camera'), zoom=parseFloat((cam?.style.transform??'').split('scale(')[1]);
        if(cam&&!(zoom>0)) add('invalid-transform','camera',{transform:cam.style.transform});
        for(const el of document.querySelectorAll('.piece.plate.cover')) if(shown(el)&&!inside(stage,box(el),.5)) add('plate-coverage',el.id,{box:rect(box(el)),stage:rect(stage)});
        if(document.documentElement.scrollWidth!==innerWidth||document.documentElement.scrollHeight!==innerHeight) add('viewport','document',{scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]});
        for(const {id,after} of techShots.checks.absentAfter) {
          const el=document.getElementById(id);
          if(${t}>after&&el&&Number(el.style.opacity)>.005) add('visibility-requirement',id,{reason:'present after its declared exit',after});
        }
        if(fb) globalThis.vcPresentation.active.inspect({add, box, rect, inside, shown, transition:state.transition});
        return {shot:state.shot, transition:state.transition, findings, exempt, zoom};
      })()`),
      capture: async ({format = 'png', quality, scale}) => Buffer.from((await call('Page.captureScreenshot', {
        format, fromSurface: true, ...(format === 'jpeg' ? {quality} : {}), clip: {x: 0, y: 0, width, height, scale},
      })).data, 'base64'),
    };
  },
};
}

export const backend = createShotBackend({name: 'tech-explainer'});
