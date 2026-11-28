// Browser integration: geometry changes and is independent of seek history.
import assert from 'node:assert/strict';
import {backend} from '../styles/paper-explainer/backend.mjs';
const timeline={audio:{sample_rate:1000,sample_count:4000},records:[
  {kind:'phrase',start:0,end:2000,label:'First view.'},
  {kind:'phrase',start:2000,end:4000,label:'Second view.'}]};
const topicSource = `globalThis.paperTopic={
  presentation:{mode:'full-bleed'},
  shots:[{id:'one',scene:'one',start:0},{id:'two',scene:'two',start:2}],
  build(ctx){
    const draw=t=>'<rect width="160" height="90" fill="#243344"/>'+
      '<circle cx="'+(20+t*30)+'" cy="45" r="10" fill="#ffcc77"/>';
    return {scenes:{
      one:{objects:[ctx.dynamic('moving','0 0 160 90',draw,50,50,100,0,{plate:'exact',flat:true})]},
      two:{objects:[ctx.dynamic('other','0 0 160 90',draw,50,50,100,0,{plate:'exact',flat:true})]}}};
  }};`;
const options={timeline,topicSource,captions:{schema:'video-creator.captions',version:1,visible:false,cues:[]}};
const session=await backend.open({width:480,height:270,locale:'en-IN'});
try {
  await session.install(options);
  const capture=async t=>{
    assert.deepEqual((await session.inspect(t)).findings,[]);
    assert.deepEqual((await session.seek(t)).outside,[]);
    return session.capture({format:'png',scale:1});
  };
  const a=await capture(.25), b=await capture(1.25);
  assert.notDeepEqual(a,b);
  assert.deepEqual(await capture(.25),a);
  await capture(2.5);
  assert.deepEqual(await capture(.25),a);
}finally{await session.close();}
for(const [from,to,expected] of [
  ["'0 0 160 90',draw","'0 0 -160 90',draw",/invalid dynamic object/],
  ["const draw=t=>","const draw=t=>null; const unused=t=>",/expected SVG string/],
  ["const draw=t=>","const draw=t=>'x'.repeat(65537); const unused=t=>",/expected SVG string/]
]){
  const s=await backend.open({width:480,height:270,locale:'en-IN'});
  try{await assert.rejects(s.install({...options,topicSource:topicSource.replace(from,to)}),expected);}
  finally{await s.close();}
}
console.log('Paper dynamic geometry: passed');
