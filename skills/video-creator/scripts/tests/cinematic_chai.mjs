// P028.2 opt-in visual benchmark. Node + Chromium only; no TTS or MP4.
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {backend} from '../styles/paper-explainer/backend.mjs';
const out=resolve(process.argv[2] ?? join(tmpdir(),'vc-chai-benchmark'));
await mkdir(out,{recursive:true});
const source=await readFile(new URL('./fixtures/cinematic-chai-topic.js',import.meta.url),'utf8');
const timeline={audio:{sample_rate:1000,sample_count:12000,sha256:'synthetic'},records:[
  {kind:'phrase',start:200,end:3500,label:'A roadside tea stall.'},
  {kind:'phrase',start:4200,end:7500,label:'The counter and the seller.'},
  {kind:'phrase',start:8200,end:11500,label:'A steaming glass of tea.'}]};
const s=await backend.open({width:540,height:960,locale:'en-IN'});
try {
  await s.install({timeline,topicSource:source});
  const shots=[], findings=[];
  for(let i=0;i<360;i++){
    const t=i/30, r=await s.inspect(t);
    if(r.findings.length) findings.push({t,findings:r.findings});
  }
  for(const [name,t] of [['wide',2],['medium',6],['detail',10]]){
    const state=await s.seek(t);
    const first=await s.capture({format:'png',scale:1});
    await writeFile(join(out,name+'.png'),first);
    await s.seek(0);await s.seek(t);
    const second=await s.capture({format:'png',scale:1});
    shots.push({name,shot:state.shot,repeatable:first.equals(second),outside:state.outside});
  }
  const passed=!findings.length&&shots.every(x=>x.name===x.shot&&x.repeatable&&!x.outside.length);
  const report={passed,synthetic:true,framesInspected:360,shots,findings,artisticReview:'pending'};
  await writeFile(join(out,'benchmark.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed,out,shots,findings:findings.length}));
  if(!passed)process.exitCode=1;
}finally{await s.close();}
