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

const twoBoneIK=sandbox.paperKit.art.twoBoneIK;
for(const bend of [-1,1]){
  for(const target of [[12,10],[-12,10],[0,-10],[0,29],[0,1]]){
    const s=twoBoneIK({target,lengths:[15,14],bend});
    assert.ok(s.reachable);
    xy(s.endpoint,target);
    assert.ok(s.error<1e-8);
    const [a,b]=s.angles.map(v=>v*Math.PI/180);
    close(Math.hypot(-15*Math.sin(a),15*Math.cos(a)),15);
    close(Math.hypot(-14*Math.sin(a+b),14*Math.cos(a+b)),14);
    assert.ok(b*bend>=0);
  }
  const far=twoBoneIK({target:[0,40],lengths:[15,14],bend});
  assert.equal(far.reachable,false);close(far.error,11);
  const inside=twoBoneIK({target:[0,0],lengths:[14,15],bend});
  assert.equal(inside.reachable,false);close(inside.error,1);
  const folded=twoBoneIK({target:[0,0],lengths:[15,15],bend});
  assert.equal(folded.reachable,true);close(folded.error,0);
}
for(const side of ['left','right']) for(const limb of ['arm','leg']) for(const bend of [-1,1]){
  const base={pelvis:{offset:[120,230],angle:37,scale:1.8},torso:{angle:-22},head:{angle:12}};
  const upper=side+(limb==='arm'?'-upper-arm':'-thigh');
  const lower=side+(limb==='arm'?'-forearm':'-shin');
  const end=limb==='arm'?'wrist':'ankle';
  const origin=actor.evaluate(base).point(upper,[0,0]);
  for(const phase of [0,1,2,3,4,5,1]){
    const target=[origin[0]+30*Math.cos(phase),origin[1]+30*Math.sin(phase)];
    const s=actor.solve(base,{side,limb,target,bend});
    assert.ok(s.reachable);xy(s.endpoint,target);
    xy(actor.evaluate(s.pose).anchor(lower,end),target);
    assert.equal(s.pose.head.angle,12);
    assert.equal(JSON.stringify(s),JSON.stringify(actor.solve(base,{side,limb,target,bend})));
    assert.equal(Object.hasOwn(base,upper),false);
  }
  const far=actor.solve(base,{side,limb,target:[origin[0]+1000,origin[1]],bend});
  assert.equal(far.reachable,false);
  close(distance(origin,far.endpoint),1.8*(limb==='arm'?29.5:44));
}
assert.throws(()=>twoBoneIK({target:[0,1],lengths:[0,1]}),/positive/);
assert.throws(()=>twoBoneIK({target:[NaN,1],lengths:[1,1]}),/number/);
assert.throws(()=>twoBoneIK({target:[0,1],lengths:[1,1],bend:0}),/bend/);
assert.throws(()=>actor.solve({}, {side:'middle',limb:'arm',target:[0,0]}),/side or limb/);
console.log('Paper two-bone IK and character contact targets: passed');

const walkCycle=sandbox.paperKit.art.walkCycle;
for(const direction of [-1,1]){
  const walk=walkCycle(actor,{origin:[30,150],direction,scale:1.5});
  const initial=walk.at(0),later=walk.at(walk.period);
  close(later.root[0]-initial.root[0],direction*walk.stride);
  const prev={};
  for(let i=0;i<=480;i++){
    const s=walk.at(i*walk.period/240);
    assert.ok(s.feet.left.planted||s.feet.right.planted);
    const p=actor.evaluate(s.pose);
    for(const side of ['left','right']){
      const foot=s.feet[side];
      assert.ok(foot.reachable);
      assert.ok(foot.error<1e-8);
      assert.ok(foot.sole[1]<=150+1e-8);
      if(foot.planted){
        close(foot.sole[1],150);
        if(prev[side]?.planted) xy(foot.sole,prev[side].sole);
      }
      close(distance(p.point(side+'-thigh',[0,0]),p.anchor(side+'-thigh','knee')),33);
      prev[side]=foot;
    }
  }
  const s=JSON.stringify(walk.at(.87));
  walk.at(9);
  assert.equal(JSON.stringify(walk.at(.87)),s);
  // Position and velocity continuity of the foot at swing/stance boundaries.
  for(const t of [.62*walk.period,walk.period]){
    const e=1e-5,a=walk.at(t-e).feet.left.sole,b=walk.at(t).feet.left.sole,c=walk.at(t+e).feet.left.sole;
    assert.ok(distance(a,b)/e<.01);
    assert.ok(distance(b,c)/e<.01);
  }
}
assert.throws(()=>walkCycle(actor,{stride:1000}),/reach/);
assert.throws(()=>walkCycle(actor,{stance:.4}),/invalid/);
assert.throws(()=>walkCycle(actor,{period:0}),/invalid/);
assert.throws(()=>walkCycle(actor).at(NaN),/number/);
console.log('Paper procedural walking and planted feet: passed');

const baseContact={pelvis:{offset:[200,300],scale:1.7,angle:19},torso:{angle:-12},head:{angle:8}};
for(const side of ['left','right']) for(const limb of ['arm','leg']){
  const id=side+(limb==='arm'?'-hand':'-foot'),anchor=limb==='arm'?'grip':'sole';
  const upper=side+(limb==='arm'?'-upper-arm':'-thigh');
  const o=actor.evaluate(baseContact).point(upper,[0,0]);
  for(const angle of [-170,0,75,180]){
    const target=[o[0]+12,o[1]+25];
    const s=actor.contact(baseContact,{side,limb,target,angle,bend:1});
    assert.ok(s.reachable);xy(s.endpoint,target);close(s.angleError,0);
    xy(actor.evaluate(s.pose).anchor(id,anchor),target);
    const attachment=actor.attachment(s.pose,{side,limb,point:[3,-4],angle:27});
    const [a,b,c,d,e,f]=attachment.matrix;
    xy([a*3+c*(-4)+e,b*3+d*(-4)+f],target);
    close(Math.hypot(a,b),1.7);
    assert.equal(attachment.group('<path/>'),actor.attachment(s.pose,{side,limb,point:[3,-4],angle:27}).group('<path/>'));
  }
  const target=[o[0]+15,o[1]+20],start=actor.evaluate(baseContact).anchor(id,anchor);
  const zero=actor.contact(baseContact,{side,limb,target,angle:30,weight:0});
  assert.equal(zero.pose,baseContact);xy(zero.endpoint,start);
  const half=actor.contact(baseContact,{side,limb,target,angle:30,weight:.5});
  assert.ok(half.reachable);xy(half.endpoint,[(start[0]+target[0])/2,(start[1]+target[1])/2]);
  const far=actor.contact(baseContact,{side,limb,target:[10000,10000],angle:0});
  assert.equal(far.reachable,false);assert.ok(far.error>100);
}
let both=baseContact;
for(const side of ['left','right']){
  const o=actor.evaluate(both).point(side+'-upper-arm',[0,0]);
  both=actor.contact(both,{side,limb:'arm',target:[o[0],o[1]+30],angle:0}).pose;
}
for(const side of ['left','right']){
  const p=actor.evaluate(both),o=p.point(side+'-upper-arm',[0,0]);
  xy(p.anchor(side+'-hand','grip'),[o[0],o[1]+30]);
}
assert.throws(()=>actor.contact({}, {side:'left',limb:'arm',target:[0,0],angle:0,weight:2}),/weight/);
assert.throws(()=>actor.contact({}, {side:'left',limb:'arm',target:[0,0],angle:NaN}),/number/);
assert.throws(()=>actor.attachment({}, {side:'left',point:[NaN,0]}),/number/);
console.log('Paper oriented character contacts and attachments: passed');

const characterPerformance=sandbox.paperKit.art.characterPerformance;
const expressionKeys=[[0,0],[2,1],[4,-1,'linear']];
const perf=characterPerformance({tracks:{smile:expressionKeys,gazeX:[[0,-1],[2,1]],mouthOpen:[[0,0],[2,.8]],lidRight:[[0,.2]]},
  blinks:[{t:1,close:.1,hold:.05,open:.15},{t:1.1,side:'left',close:.1,hold:0,open:.1}],
  gestures:{head:[[0,0],[2,20]],'left-upper-arm':[[0,0],[2,-30]]}});
const free={pelvis:{offset:[20,30]},head:{angle:5},'right-shin':{angle:10}};
const p0=perf.at(0,free),p1=perf.at(1,free),p2=perf.at(2,free);
close(p0.face.smile,0);close(p1.face.smile,.5);close(p2.face.smile,1);
close(p1.face.gazeX,0);close(p2.face.mouthOpen,.8);
close(p1.pose.head.angle,15);close(p2.pose['left-upper-arm'].angle,-30);
assert.equal(p2.pose['right-shin'].angle,10);assert.equal(free.head.angle,5);
close(perf.at(1.05).face.lidLeft,.5);
close(perf.at(1.12).face.lidRight,1);
close(perf.at(1.2).face.lidLeft,1);
close(perf.at(1.31).face.lidRight,.2);
close(perf.at(3).face.smile,0);
close(perf.at(100).face.smile,-1);
close(perf.at(-1).face.gazeX,-1);
expressionKeys[1][1]=0;
close(perf.at(2).face.smile,1);
const recorded=JSON.stringify(perf.at(1.22,free));
perf.at(4,free);
assert.equal(JSON.stringify(perf.at(1.22,free)),recorded);
actor.evaluate(p2.pose);
assert.throws(()=>characterPerformance({tracks:{unknown:[[0,0]]}}),/unknown channel/);
assert.throws(()=>characterPerformance({tracks:{smile:[[0,2]]}}),/invalid key/);
assert.throws(()=>characterPerformance({tracks:{smile:[[1,0],[1,1]]}}),/invalid key/);
assert.throws(()=>characterPerformance({blinks:[{t:1,close:0}]}),/invalid blink/);
assert.throws(()=>characterPerformance({gestures:{'left-shin':[[0,0]]}}),/gesture joint/);
assert.throws(()=>perf.at(NaN),/number/);
console.log('Paper facial performance and gesture channels: passed');

const characterIdentity=sandbox.paperKit.art.characterIdentity;
const identityPalette={skin:'#c98d63',coat:'#335577'};
const identityFeatures=['Copper cap','Blue coat'];
const buildIdentity=({palette,dimensions},face)=>({
  torso:'<rect width="'+dimensions.shoulder+'" fill="'+palette.coat+'"/>',
  head:'<circle r="'+dimensions.head/2+'" fill="'+palette.skin+'"/><path d="M0 0L1 '+(face.smile??0)+'"/>'
});
const identityOrder=['torso','head'];
const identity=characterIdentity({id:'lock-keeper',height:100,palette:identityPalette,features:identityFeatures,
  appearances:{default:{build:buildIdentity,order:identityOrder},profile:{build:buildIdentity,order:['head','torso']}}});
const identityPose={pelvis:{offset:[100,200]},head:{angle:12}};
const neutralIdentity=identity.draw(identityPose);
const smilingIdentity=identity.draw(identityPose,{face:{smile:1}});
assert.notEqual(neutralIdentity,smilingIdentity);
assert.ok(neutralIdentity.includes('#c98d63')&&smilingIdentity.includes('#335577'));
const profileIdentity=identity.draw(identityPose,{appearance:'profile'});
assert.ok(profileIdentity.indexOf('<circle')<profileIdentity.indexOf('<rect'));
close(identity.actor.dimensions.head,14);
identityPalette.coat='#ffffff';identityFeatures[0]='changed';identityOrder.reverse();
assert.equal(identity.draw(identityPose),neutralIdentity);
assert.equal(identity.features[0],'Copper cap');
assert.equal(identity.draw(identityPose,{face:{smile:1}}),smilingIdentity);
assert.throws(()=>identity.draw(identityPose,{appearance:'missing'}),/unknown appearance/);
assert.throws(()=>characterIdentity({id:'bad id',palette:{coat:'#000000'},appearances:{default:{build:buildIdentity}}}),/invalid id/);
assert.throws(()=>characterIdentity({id:'valid',palette:{coat:'red'},appearances:{default:{build:buildIdentity}}}),/palette color/);
assert.throws(()=>characterIdentity({id:'valid',palette:{coat:'#000000'},appearances:{profile:{build:buildIdentity}}}),/default appearance/);
assert.throws(()=>characterIdentity({id:'valid',palette:{coat:'#000000'},appearances:{default:{build:buildIdentity,order:['head','head']}}}),/invalid order/);
console.log('Paper reusable character identity and appearance variants: passed');

for(const direction of [-1,1]){
  const upright=walkCycle(actor,{origin:[30,150],direction,heightRatio:.97,stride:24,period:1.2,stop:{at:2.46,duration:.6,settle:.4}});
  const legacy=walkCycle(actor,{origin:[30,150],direction,stride:24,period:1.2});
  assert.ok(upright.at(.06).root[1]<legacy.at(.06).root[1]);
  const prev={};let previous;
  for(let i=0;i<=840;i++){
    const s=upright.at(i/240);
    assert.ok(s.feet.left.planted||s.feet.right.planted);
    for(const side of ['left','right']){
      const foot=s.feet[side];
      assert.ok(foot.reachable);assert.ok(foot.error<1e-8);
      assert.ok(foot.sole[1]<=150+1e-8);
      if(foot.planted&&prev[side]?.planted) xy(foot.sole,prev[side].sole);
      prev[side]=foot;
    }
    if(previous) assert.ok(distance(previous.root,s.root)<1);
    previous=s;
  }
  const stopped=upright.at(3.2),later=upright.at(10);
  assert.equal(stopped.speed,0);
  assert.ok(stopped.feet.left.planted&&stopped.feet.right.planted);
  xy(stopped.root,later.root);
  assert.equal(JSON.stringify(stopped),JSON.stringify(later));
  close(stopped.pose.torso.angle,0);
  for(const t of [2.16,2.76,3.16]){
    const e=1e-5,a=upright.at(t-e),b=upright.at(t),c=upright.at(t+e);
    assert.ok(Math.abs((b.root[0]-a.root[0])/e-(c.root[0]-b.root[0])/e)<.01);
    assert.ok(Math.abs((b.root[1]-a.root[1])/e-(c.root[1]-b.root[1])/e)<.05);
  }
  assert.equal(JSON.stringify(upright.at(.8)),JSON.stringify(upright.at(.8)));
}
assert.throws(()=>walkCycle(actor,{heightRatio:1}),/height ratio/);
assert.throws(()=>walkCycle(actor,{stop:{at:.4,duration:.2}}),/double support/);
console.log('Paper upright gait and planted-foot stopping transition: passed');

const limbContour=sandbox.paperKit.art.limbContour;
const straightContour=limbContour([[0,0],[0,20],[0,40]],{widths:[12,10,8],fill:'#314d50'});
assert.ok(straightContour.includes('M-6 0'));
assert.ok(straightContour.includes('L-4 40'));
assert.equal((straightContour.match(/<path /g)||[]).length,1);
for(const direction of [-1,1]){
  const points=[[0,0],[0,20],[direction*15,35]];
  const markup=limbContour(points,{widths:[12,10,8]});
  assert.ok(markup.includes('Q'));
  assert.ok(!/NaN|Infinity/.test(markup));
  assert.equal(markup,limbContour(points,{widths:[12,10,8]}));
}
const contourPose={pelvis:{offset:[30,40],scale:2},'left-thigh':{angle:-20},'left-shin':{angle:35}};
const contourRig=actor.evaluate(contourPose);
const contourPoints=[contourRig.point('left-thigh',[0,0]),contourRig.anchor('left-thigh','knee'),contourRig.anchor('left-shin','ankle')];
assert.ok(limbContour(contourPoints,{widths:[12,10,8]}).includes('<path'));
assert.throws(()=>limbContour([[0,0],[0,0],[0,20]],{widths:[1,1,1]}),/coincident/);
assert.throws(()=>limbContour([[0,0],[0,20],[0,0]],{widths:[1,1,1]}),/extreme fold/);
assert.throws(()=>limbContour([[0,0],[0,20],[0,40]],{widths:[1,0,1]}),/positive/);
console.log('Paper connected articulated limb contours: passed');
