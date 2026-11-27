(() => {
  const {sym} = globalThis.techShotArt;
  const K = globalThis.wbKit;
  const A = K.art;
  const ink = '#233048', teal = '#08796f', red = '#9b382e';
  const vb = '0 0 1000 1778';
  const heading = (text, x, y, size = 48, color = ink) => A.letter(text, x, y, {size, color, anchor: 'start', caps: false});
  const loop = (x, y, rx, ry, seed) => A.loop(x, y, rx, ry, {seed, turns: 1});
  const coin = (x, y, rx, seed, color = ink) => [
    {d: loop(x, y, rx, rx * .28, seed), color, width: 7},
    ...A.brush([[x-rx,y],[x-rx+4,y+18],[x-22,y+29],[x+35,y+26],[x+rx-1,y+14],[x+rx,y]], {seed, width: 6, color}),
    ...[-.62,-.34,-.05,.22,.49].map((f,i) => ({d:`M${x+rx*f} ${y+14}l${i%2?2:-1} 11`, width: 3, color})),
  ];
  const money = (x, y) => [
    ...A.brush([[x-84,y-44],[x+78,y-48],[x+85,y+38],[x-78,y+43],[x-84,y-44]], {seed:19,width:11}),
    'M108 356q23 0 22-19m138 13q-22 1-23-16m-130 67q17 1 16 18m137-16q-21 0-21 15',
    heading('₹', x-17, y+16, 48, teal),
  ];
  const groups = [
    [...money(185,377),heading('शुरुआत', 325, 333, 52),heading('₹100',325,405,72),heading('हर साल 10%   •   उदाहरण',325,462,34,teal)],
    [...A.brush([[180,472],[210,510],[260,532],[294,572]],{seed:9,width:12,color:teal}),
      'M264 562l31 14-4-33',...coin(204,671,69,16,teal),
      heading('पहला साल',325,625,49),heading('₹100 + ₹10',325,701,61),heading('= ₹110',325,772,62,teal)],
    [...A.brush([[612,795],[660,827],[653,868],[624,900]],{seed:31,width:13,color:teal}),
      {d:'M628 868l-7 39 37-17',color:teal},
      ...coin(198,1035,67,8,teal),...coin(204,1008,66,12,teal),...coin(209,979,65,22,red),
      heading('दूसरा साल',325,949,49),heading('₹110 + ₹11',325,1025,61),heading('= ₹121',325,1099,64,teal),
      heading('₹1 पिछले ब्याज पर',325,1170,51,red),
      ...A.brush([[326,1190],[471,1194],[566,1188],[733,1192]],{seed:21,width:11,color:red}),
    ],
  ];
  const entries = [
    ['principal', 'saved-cue'], ['first-year', 'balance-cue'], ['second-year','compound-cue'],
  ];
  globalThis.whiteboardTopic = {
    shots: [{id:'board', scene:'board', accent:'#9b382e'}],
    css: K.css,
    symbols() {
      return groups.map((strokes,i) => sym('ink-' + entries[i][0], vb, A.ink(strokes, {color:ink,seed:i+15}))).join('');
    },
    build(ctx) {
      const kit = K.motion(ctx);
      const objects = entries.map(([id]) => ctx.plate(id,'ink-' + id,2,'exact'));
      const names = ['principal','first-year','second-year'];
      const keyframes = entries.map(([id,cue],i) => {
        const t = kit.draw(id,cue,.78);
        return [names[i], Math.min(t+.98,ctx.shot('board').end-.08)];
      });
      return {scenes:{board:{objects}}, checks:{keyframes}};
    },
  };
})();
