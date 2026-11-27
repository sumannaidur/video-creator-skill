// Inject this authored topic into the existing P009/P010 Paper Explainer view.
function installTrees(timeline) {
  const defs = document.querySelector('body > svg');
  defs.insertAdjacentHTML('beforeend', `
    <symbol id="tree-sun" viewBox="0 0 160 160">
      <path d="m80 7 11 29 28-17-2 32 34-2-17 28 22 18-30 12 9 31-31-7-15 24-15-25-34 8 9-30L9 96l23-21-16-27 33 3-4-31 26 16Z" fill="#DAB357"/>
      <path d="M78 38c28-2 46 22 44 45-2 26-21 44-45 43-27-1-45-23-43-48 1-22 19-38 44-40Z" fill="#f0cf77" stroke="#252A30" stroke-width="3"/>
    </symbol>
    <symbol id="tree-cutout" viewBox="0 0 320 390">
      <path d="m144 370 12-134-30-49 16-8 27 35 18-51 16 9-20 64 10 132-19 4-12-8Z" fill="#bf5942" stroke="#252A30" stroke-width="3"/>
      <path d="M34 173q-22-34 3-66l17-19q-8-34 27-53l30 1 21-20q32-24 63-2l19 17 29-1q34 16 36 43l19 29q24 28 11 61l-15 23-11 27-38 10-22 13-31-3-21 12-38-8-24 2-28-15-27-8-14-26Z" fill="#427361" stroke="#252A30" stroke-width="3"/>
      <path d="M46 134q-6-23 20-32l30 6 17-29 32 2 18-22 29 11 21 21 36-4q33 14 39 41l-22 2-24 22-25-5-24 17-22-10-28 11-20-11-37 9-23-15Z" fill="#81a68a"/>
      <g fill="#d0dbac"><path d="M87 132q8-23 32-23-5 22-32 23ZM148 104q5-24 24-30 3 26-24 30ZM197 135q9-22 33-21-10 23-33 21ZM111 178q11-23 37-16-14 21-37 16ZM232 188q12-20 36-15-11 20-36 15Z"/></g>
    </symbol>
    <symbol id="tree-shade" viewBox="0 0 330 96">
      <path d="m8 49 28-18 40-7 30-10 43 5 34-7 24 8 41-3 35 14 35 12 4 17-31 14-42 5-39 9-34-5-33 8-26-10-47-2-27-10-23-8Z" fill="#aebcaf" stroke="#427361" stroke-width="2"/>
      <path d="m57 57 29-12m9 21 42-19m8 22 45-20m11 22 38-14m8 13 22-7" stroke="#427361" stroke-width="3" stroke-linecap="round" opacity=".5"/>
    </symbol>
    <symbol id="tree-rays" viewBox="0 0 100 150">
      <path d="M10 12q18 44 32 113m-11-9 11 9 5-16M41 5l42 111m-13-7 13 7 3-15" fill="none" stroke="#bc851f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </symbol>
    <symbol id="tree-vapor" viewBox="0 0 150 94">
      <path d="M15 68q-10-18 11-28 6-19 28-17 9-19 32-15 21 3 26 19 20-4 28 13 11 24-15 31l-25 9-35-4-20 4Z" fill="#f9fcf1" stroke="#427361" stroke-width="2.5"/>
      <path d="M48 61q16-17 31 0m-17-19q14-15 25 2m8 13q11-15 22-2" fill="none" stroke="#59758D" stroke-width="3" stroke-linecap="round"/>
    </symbol>
    <symbol id="tree-drop" viewBox="0 0 40 63"><path d="M19 5C14 19 4 28 4 42a16 16 0 1 0 32 0C36 29 24 17 19 5Z" fill="#8cb4c6" stroke="#252A30" stroke-width="2"/><path d="M12 43q1 8 7 9" fill="none" stroke="#fff9ee" stroke-width="3" stroke-linecap="round"/></symbol>
    <symbol id="tree-air" viewBox="0 0 260 112">
      <path d="M7 39Q67-1 133 33t114-14m-16-2 16 2-2 15M19 72q61-36 111-3t118-11m-16-3 16 3-4 16M45 96q41-20 80-7t68 7" fill="none" stroke="#427361" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </symbol>`);
  const style = document.createElement('style');
  style.textContent = `
    .story-frame { --x:72px; --y:96px }
    .story-safe { height:calc(100vh - 2 * var(--y)); min-height:0; gap:22px; grid-template-rows:minmax(0,1fr) 182px }
    .story-body { height:100%; min-height:0; grid-template-rows:auto minmax(0,1fr); gap:12px }
    .story-body .story-title { font:700 82px/1.26 "Nirmala UI","Segoe UI",sans-serif; letter-spacing:normal; max-width:none;
      padding-block:8px; text-wrap:balance }
    .story-stage { min-height:0; height:100% }
    .story-caption { align-self:center; width:100%; padding:16px 21px; min-height:142px; max-width:none;
      font-family:"Nirmala UI","Segoe UI",sans-serif; font-size:44px; line-height:1.36;
      display:grid; place-items:center; text-wrap:balance }
    .piece-label { font:700 39px/1.45 "Nirmala UI","Segoe UI",sans-serif }
    .piece--tree-air .piece-label,.piece--tree-shade .piece-label,.piece--tree-vapor .piece-label { background:#fff9ee; border-radius:8px; padding-inline:15px }
    .piece--tree-rays .piece-art,.piece--tree-air .piece-art { filter:none }
  `;
  document.head.append(style);
  const part = (id,art,x,y,width,layer,label) => ({id,art,position:{x,y,width},layer,label});
  paperScenes['tree-cooling'] = {
    locale:'hi-IN',topic:'पेड़ों की छाया और ठंडक',beat:'mechanism',
    heading:'पेड़ हवा को कैसे ठंडा करते हैं?',narrationCaption:'',
    objects:[
      part('tree-paper','ground',51,49,91,0),
      part('sun-cutout','tree-sun',18,18,22,3,'धूप'),
      part('sun-rays','tree-rays',27,37,13,1),
      part('shade-patch','tree-shade',48,75,78,1,'छाया'),
      part('street-tree','tree-cutout',48,48,50,3),
      part('water-drop-a','tree-drop',60,31,6,4),
      part('water-drop-b','tree-drop',63,26,5,4),
      part('water-drop-c','tree-drop',66,21.5,4,4),
      part('water-vapor','tree-vapor',80,11,31,2,'जलवाष्प'),
      part('cool-air','tree-air',73,61,43,4,'आसपास की हवा'),
    ],
    relationships:[],
    cues:[
      {object:'shade-patch',when:'पहला वाक्य',action:'expand'},
      {object:'water-vapor',when:'दूसरा वाक्य',action:'reveal'},
      {object:'cool-air',when:'तीसरा वाक्य',action:'sweep'},
    ],
  };
  const duration = timeline.audio.sample_count/timeline.audio.sample_rate;
  const phrases = timeline.records.filter(r=>r.kind==='phrase').sort((a,b)=>a.start-b.start);
  if (phrases.length!==3) throw new Error('Tree scene expects three provisional phrases');
  // Hold each caption across the short inter-phrase pause instead of blinking off.
  const captions = phrases.map((r,i)=>({
    id:i+1,start:r.start/timeline.audio.sample_rate,
    end:i+1<phrases.length ? phrases[i+1].start/timeline.audio.sample_rate : duration,text:r.label,
  }));
  const [shade,vapor,air] = captions.map(c=>c.start);
  const motion = (id,start,duration,from,to=[0,0,0,1,1]) =>
    ({id,start,end:start+duration,from,to,curve:'smooth'});
  installPaperMotion({
    duration,
    scenes:[{id:'tree-cooling',start:0,captions,draws:[],
      tracks:[
        motion('sun-rays',shade,.72,[-.08,-.07,-8,.75,0]),
        motion('shade-patch',shade,.62,[0,-.018,-3,.44,0]),
        motion('water-drop-a',vapor,.75,[-.065,.14,-14,.78,0]),
        motion('water-drop-b',vapor+.36,.85,[-.10,.20,10,.65,0]),
        motion('water-drop-c',vapor+.72,.95,[-.12,.22,8,.64,0]),
        motion('water-vapor',vapor+1.2,.63,[-.08,.03,-4,.67,0]),
        motion('cool-air',air,1.6,[.12,.04,9,.70,0]),
      ],
      camera:{start:shade,end:duration,from:[-.008,.004,.98],to:[-.015,.01,1.015],curve:'smooth'},
    }],
  });
  return captions;
}
