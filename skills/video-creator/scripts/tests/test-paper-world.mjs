import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const sandbox = {paperShotArt: {f: n => String(Number(n.toFixed(4)))}};
vm.runInNewContext(readFileSync(new URL('../styles/paper-explainer/kit.js', import.meta.url), 'utf8'), sandbox);
const ground = sandbox.paperKit.art.groundPlane;
const g = ground({cx: 500, horizon: 200, focal: 400, eyeHeight: 2});
const p = g.project(1, 4);
assert.equal(p.x, 600);
assert.equal(p.y, 400);
assert.equal(p.scale, 100);
assert.equal(g.project(1, 8).scale, 50);
assert.equal(g.project(1, 8).y, 300);
assert.equal(g.project(1, 4, 2).y, 200);
assert.equal(g.polygon([[-1,4],[1,4],[1,8],[-1,8]]), 'M400 400L600 400L550 300L450 300Z');
assert.equal(g.upright(1,4,'<path/>'), '<g transform="translate(600 400) scale(100)"><path/></g>');
assert.throws(() => g.project(1,0), /near plane/);
assert.throws(() => g.project(NaN,4), /number/);
assert.throws(() => ground({cx:0,horizon:0,focal:0,eyeHeight:2}), /positive/);
assert.throws(() => g.polygon([[0,4],[1,4]]), /3..256/);
assert.throws(() => g.polygon([[0,4],[1,4],[1,4,2]]), /footprint/);
assert.throws(() => g.upright(1,4,null), /markup/);
assert.equal(g.polygon([[-1,4],[1,4],[1,8],[-1,8]]), g.polygon([[-1,4],[1,4],[1,8],[-1,8]]));
const shadow = g.shadow(0,4,{radius:.25,height:1,direction:[1,.5]});
assert.equal(shadow, g.shadow(0,4,{radius:.25,height:1,direction:[1,.5]}));
assert.equal((shadow.match(/<path /g)||[]).length,4);
assert.ok(!/filter|NaN|Infinity/.test(shadow));
assert.notEqual(shadow,g.shadow(0,4,{radius:.25,height:1,direction:[-1,.5]}));
assert.notEqual(shadow,g.shadow(0,8,{radius:.25,height:1,direction:[1,.5]}));
assert.equal((g.shadow(0,4,{height:0}).match(/<path /g)||[]).length,4);
assert.throws(()=>g.shadow(0,4,{direction:[0,0]}),/nonzero/);
assert.throws(()=>g.shadow(0,4,{radius:-1}),/range/);
assert.throws(()=>g.shadow(0,4,{opacity:2}),/range/);
assert.throws(()=>g.shadow(0,4,{color:'bad'}),/color/);
assert.throws(()=>g.shadow(0,.2,{radius:1}),/near plane/);
const camera = sandbox.paperKit.art.worldCamera;
const settings = {cx:500,horizon:200,focal:400,eyeHeight:2};
const w = camera(settings);
assert.equal(w.project(1,4).x,g.project(1,4).x);
assert.equal(w.polygon([[-1,4],[1,4],[1,8],[-1,8]]),g.polygon([[-1,4],[1,4],[1,8],[-1,8]]));
assert.equal(w.shadow(0,4),g.shadow(0,4));
const side = camera({...settings,x:-4,z:0,yaw:90});
const close = (a,b)=>assert.ok(Math.abs(a-b)<1e-8);
close(side.project(0,0).x,500);
close(side.project(0,0).y,400);
close(side.project(0,1).x,400);
close(side.depth(0,0),4);
assert.equal(side.face([[0,-1,0],[0,1,0],[0,1,2],[0,-1,2]]),'M600 400L400 400L400 200L600 200Z');
const reverse = camera({...settings,z:8,yaw:180});
close(reverse.project(1,4).x,400);
assert.throws(()=>reverse.project(0,9),/near plane/);
assert.throws(()=>side.face([[0,0],[0,1,1],[0,2,1]]),/face point/);
assert.throws(()=>camera({...settings,yaw:Infinity}),/number/);
assert.throws(()=>side.shadow(0,0,{direction:[0,0]}),/nonzero/);
// A world-space light along +x becomes positive camera depth when facing +x.
const expected = g.shadow(0,4,{direction:[0,1]});
assert.equal(side.shadow(0,0,{direction:[1,0]}),expected);
console.log('Paper world projection, shadows and alternate camera views: passed');

const rig2D=sandbox.paperKit.art.rig2D;
const rig=rig2D([
  {id:'tool',parent:'forearm',offset:[40,0],pivot:[5,0],anchors:{grip:[5,0]}},
  {id:'arm',offset:[100,50],pivot:[10,0],anchors:{elbow:[70,0]}},
  {id:'forearm',parent:'arm',offset:[70,0],anchors:{hand:[40,0]}}
]);
const xy=(a,b)=>{close(a[0],b[0]);close(a[1],b[1]);};
for(const angle of [-90,0,30,90,180,360]) {
  const pose={arm:{angle,scale:1.2},forearm:{angle:45}};
  const s=rig.evaluate(pose);
  xy(s.point('arm',[10,0]),[100,50]);
  xy(s.anchor('arm','elbow'),s.point('forearm',[0,0]));
  xy(s.anchor('forearm','hand'),s.anchor('tool','grip'));
  assert.equal(s.group('tool','<path/>'),rig.evaluate(pose).group('tool','<path/>'));
  assert.ok(!/NaN|Infinity/.test(s.group('tool','<path/>')));
}
const rightAngle=rig.evaluate({arm:{angle:90}});
xy(rightAngle.anchor('arm','elbow'),[100,110]);
xy(rightAngle.anchor('tool','grip'),[100,150]);
const m=rightAngle.matrix('arm');m[4]=999;
xy(rightAngle.point('arm',[10,0]),[100,50]);
assert.throws(()=>rig2D([{id:'a',parent:'b'}]),/unknown parent/);
assert.throws(()=>rig2D([{id:'a',parent:'b'},{id:'b',parent:'a'}]),/cyclic/);
assert.throws(()=>rig2D([{id:'a'},{id:'a'}]),/unique/);
assert.throws(()=>rig2D([{id:'a',pivot:[NaN,0]}]),/number/);
assert.throws(()=>rig.evaluate({tool:{scale:0}}),/positive/);
assert.throws(()=>rig.evaluate({unknown:{}}),/unknown pose/);
assert.throws(()=>rig.evaluate({arm:{angle:Infinity}}),/number/);
assert.throws(()=>rig.evaluate().anchor('arm','missing'),/unknown anchor/);
console.log('Paper 2D rig pivots, hierarchy and attachments: passed');

const cameraPath=sandbox.paperKit.art.cameraPath;
const path=cameraPath({cx:500,horizon:200,focal:400,keys:[
  {t:0,x:0,z:0,eyeHeight:2,yaw:350},
  {t:4,x:4,z:2,eyeHeight:4,yaw:370,ease:'linear'}
]});
close(path.poseAt(2).x,2);
close(path.poseAt(2).z,1);
close(path.poseAt(2).eyeHeight,3);
close(path.poseAt(2).yaw,360);
close(path.poseAt(-1).yaw,350);
close(path.poseAt(9).yaw,370);
const q=path.at(2).project(2,5);
close(q.x,500);close(q.y,500);
assert.equal(JSON.stringify(path.at(2).project(2,5)),JSON.stringify(q));
path.at(3).project(4,10);
assert.equal(JSON.stringify(path.at(2).project(2,5)),JSON.stringify(q));
const tracking=cameraPath({cx:500,horizon:200,focal:400,keys:[
  {t:0,x:0,z:-4,eyeHeight:2},
  {t:4,x:4,z:-4,eyeHeight:2,ease:'linear'}
],target:t=>[2*t,0]});
for(const t of [4,0,1,3,2,1]){
  const view=tracking.at(t),p=view.project(2*t,0,2);
  close(p.x,500);close(p.y,200);
}
const dolly=cameraPath({cx:500,horizon:200,focal:400,keys:[
  {t:0,x:0,z:0,eyeHeight:2},{t:4,x:0,z:2,eyeHeight:2}
]});
close(dolly.poseAt(1).z,.3125);
assert.ok(dolly.at(4).project(1,4).scale>dolly.at(0).project(1,4).scale);
const nearShift=dolly.at(4).project(1,4).x-dolly.at(0).project(1,4).x;
const farShift=dolly.at(4).project(1,12).x-dolly.at(0).project(1,12).x;
assert.ok(nearShift>farShift);
const config={cx:500,horizon:200,focal:400};
const k={t:0,x:0,z:0,eyeHeight:2};
assert.throws(()=>cameraPath({...config,keys:[k,k]}),/increasing/);
assert.throws(()=>cameraPath({...config,keys:[{...k,ease:'bad'}]}),/ease/);
assert.throws(()=>cameraPath({...config,keys:[{...k,eyeHeight:0}]}),/positive/);
assert.throws(()=>cameraPath({...config,keys:[k],target:()=>[0,0]}).at(0),/too close/);
assert.throws(()=>cameraPath({...config,keys:[k],target:()=>[NaN,2]}).at(0),/number/);
assert.throws(()=>path.at(Infinity),/number/);
console.log('Paper continuous camera paths and target tracking: passed');

const continuous=cameraPath({cx:500,horizon:200,focal:400,interpolation:'continuous',keys:[
  {t:0,x:0,z:0,eyeHeight:2,yaw:350},
  {t:2,x:4,z:3,eyeHeight:3,yaw:360},
  {t:5,x:7,z:9,eyeHeight:4,yaw:380},
  {t:9,x:9,z:12,eyeHeight:3,yaw:390}
]});
const eps=1e-5;
for(const time of [2,5]){
  const a=continuous.poseAt(time-eps),b=continuous.poseAt(time),c=continuous.poseAt(time+eps);
  for(const name of ['x','z','eyeHeight','yaw']){
    const left=(b[name]-a[name])/eps,right=(c[name]-b[name])/eps;
    assert.ok(Math.abs(left-right)<.001,name+' velocity continuity');
  }
  assert.ok((c.x-a.x)/(2*eps)>.1,'nonzero intermediate velocity');
}
for(const [lo,hi] of [[0,2],[2,5],[5,9]]){
  const a=continuous.poseAt(lo),b=continuous.poseAt(hi);
  for(let i=0;i<=100;i++){
    const p=continuous.poseAt(lo+(hi-lo)*i/100);
    for(const name of ['x','z','eyeHeight','yaw'])
      assert.ok(p[name]>=Math.min(a[name],b[name])-1e-9&&p[name]<=Math.max(a[name],b[name])+1e-9,'no coordinate overshoot');
  }
}
close(continuous.poseAt(2).x,4);
close(continuous.poseAt(5).yaw,380);
assert.ok(continuous.poseAt(eps).x/eps<.001);
assert.ok((9-continuous.poseAt(9-eps).x)/eps<.001);
const saved=JSON.stringify(continuous.poseAt(3.2));
continuous.poseAt(8);
assert.equal(JSON.stringify(continuous.poseAt(3.2)),saved);
assert.throws(()=>cameraPath({...config,keys:[k],interpolation:'bad'}),/interpolation/);
const one=cameraPath({...config,keys:[k],interpolation:'continuous'});
close(one.poseAt(100).eyeHeight,2);
const two=cameraPath({...config,keys:[k,{...k,t:4,x:4}],interpolation:'continuous'});
close(two.poseAt(1).x,.625);
console.log('Paper continuous camera interpolation: passed');

const characterRig=sandbox.paperKit.art.characterRig;
const actor=characterRig({height:100});
assert.equal(actor.joints.length,16);
const neutral=actor.evaluate();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
close(distance(neutral.point('head',[0,0]),neutral.anchor('head','crown')),14);
for(const angle of [-90,0,35,90,180]){
  const pose={pelvis:{offset:[100,200],scale:2,angle:10},torso:{angle:angle/3},'left-upper-arm':{angle},'left-forearm':{angle:60},'right-thigh':{angle},'right-shin':{angle:-45}};
  const s=actor.evaluate(pose);
  for(const side of ['left','right']){
    xy(s.anchor(side+'-upper-arm','elbow'),s.point(side+'-forearm',[0,0]));
    xy(s.anchor(side+'-forearm','wrist'),s.point(side+'-hand',[0,0]));
    xy(s.anchor(side+'-thigh','knee'),s.point(side+'-shin',[0,0]));
    xy(s.anchor(side+'-shin','ankle'),s.point(side+'-foot',[0,0]));
    close(distance(s.point(side+'-upper-arm',[0,0]),s.anchor(side+'-upper-arm','elbow')),31);
    close(distance(s.point(side+'-shin',[0,0]),s.anchor(side+'-shin','ankle')),44);
  }
  xy(s.anchor('torso','neck'),s.point('neck',[0,0]));
  const parts={head:'<circle r="5"/>','left-hand':'<path/>'};
  const order=['left-hand','head'];
  const markup=actor.draw(pose,parts,order);
  assert.equal(markup,actor.draw(pose,parts,order));
  assert.ok(markup.indexOf('<path/>')<markup.indexOf('<circle'));
}
const modified=characterRig({height:100,proportions:{upperArm:.2}});
close(distance(modified.evaluate().point('left-upper-arm',[0,0]),modified.evaluate().anchor('left-upper-arm','elbow')),20);
assert.throws(()=>characterRig({height:0}),/positive/);
assert.throws(()=>characterRig({proportions:{thigh:NaN}}),/number/);
assert.throws(()=>characterRig({proportions:{tail:.2}}),/unknown/);
assert.throws(()=>actor.evaluate({'left-shin':{scale:2}}),/only permits/);
assert.throws(()=>actor.evaluate({unknown:{angle:1}}),/unknown/);
assert.throws(()=>actor.draw({}, {head:'<path/>'},['torso']),/omits/);
assert.throws(()=>actor.draw({}, {head:'<path/>'},['head','head']),/order/);
console.log('Paper articulated character anatomy: passed');
