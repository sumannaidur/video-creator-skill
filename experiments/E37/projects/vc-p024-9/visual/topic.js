(() => {
  const K = globalThis.fsKit;
  const {sym} = globalThis.techShotArt;
  const A = K.art;
  const sea = '#101d32', violet = '#7569bc', mint = '#5cbcae', gold = '#ffc678';
  const cell = 'M35 187C36 142 52 122 94 97C132 72 136 31 199 31C240 34 269 52 283 84C303 116 353 111 367 156C386 213 346 237 323 265C302 297 296 340 247 353C204 368 167 351 145 323C119 294 72 303 54 270C39 244 31 218 35 187Z';
  const marker = '<path d="M-18 22Q-34 0-14-19Q0-30 12-18L27-4L14 17L2 10L-5 26Z" fill="#ffc678" stroke="#ffe2a9" stroke-width="4"/>';
  const antibody = '<path d="M0 30V0M0 1L-21-21M0 1L21-21" stroke="#9fe6d9" stroke-width="10" stroke-linecap="round" fill="none"/>';
  const mot = (s,x,y,angle=0,scale=1) => `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${s}</g>`;
  const nucleus = 'M103 167C113 112 170 87 228 117C274 136 277 179 262 219C252 252 216 274 175 255C131 237 91 218 103 167Z';
  const vb = '0 0 400 400';
  const cellArt = colour => A.litForm(cell,colour,{depth:18,rimWidth:5}) +
    `<path d="${nucleus}" fill="#172944" opacity=".72"/><path d="M133 174q23-38 59-39m-31 100q39 13 66-17" fill="none" stroke="#d0e9fa" stroke-width="5" opacity=".42"/>` +
    [[80,190,7],[105,250,5],[265,95,6],[290,223,9],[261,291,5],[316,178,7],[180,294,4]].map(([x,y,r]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="#d2f1eb" opacity=".53"/><ellipse cx="${x+7}" cy="${y+7}" rx="${r+4}" ry="${r+2}" fill="none" stroke="#142641" opacity=".38"/>`).join('');
  const field = (tone, p) => {
    const bodies = Array.from({length:18}, (_,i) => {
      const x=(i*211+37)%1000,y=210+(i*307)%1160,r=25+(i*13)%65;
      return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.56}" transform="rotate(${i*33} ${x} ${y})" stroke="${tone}" stroke-width="3" fill="${tone}" fill-opacity=".13" opacity=".43"/>`;
    }).join('');
    return `<rect width="1000" height="1778" fill="${sea}"/><path d="${p}" fill="${tone}" opacity=".17"/>${bodies}`;
  };
  const shots = [
    {id:'exposure',scene:'exposure',accent:gold},
    {id:'recognition',scene:'recognition',accent:'#9fe6d9'},
    {id:'memory',scene:'memory',accent:'#a9e8dd'},
  ];
  globalThis.flatScienceTopic = {
    shots, css: K.css,
    symbols() {
      const page = '0 0 1000 1778';
      const membrane = cellArt(violet) + mot(marker,297,92,20,.76) + mot(marker,366,165,68,.77) + mot(marker,303,287,137,.72);
      return [
        sym('field-cold',page,field('#6666ac','M0 580C250 152 628 965 1000 328V1203C669 1555 323 820 0 1270Z')),
        sym('field-warm',page,field('#45837f','M0 410C385 129 639 978 1000 626V1320C610 1580 239 784 0 1050Z')),
        sym('cell-violet',vb,membrane), sym('cell-memory',vb,cellArt(mint)),
        sym('marker-close','0 0 180 180',mot(marker,90,90,-15,2.35)),
        sym('matching',vb,mot(antibody,325,64,135,.84)+mot(antibody,389,146,87,.84)+mot(antibody,322,313,-44,.78)),
        sym('recall-cloud',vb,mot(antibody,93,113,-42,1.12)+mot(antibody,194,222,-14,1.24)+mot(antibody,268,279,24,1.06)+mot(antibody,287,106,32,.84)),
      ].join('');
    },
    build(ctx) {
      const m=K.motion(ctx);
      const item=(id,art,x,y,w,z)=>ctx.P(id,art,x,y,w,z,{flat:true});
      const label=(id,text,x,y,w,accent)=>ctx.P(id,null,x,y,w,5,{label:text,labelStyle:'key',accent});
      const scenes={
        exposure:{objects:[
          ctx.plate('exposure-bg','field-cold',0),
          item('first-cell','cell-memory',62,49,62,2),
          item('free-marker','marker-close',32,35,43,3),
          label('antigen-word','యాంటిజెన్',35,26,43,gold),
        ]},
        recognition:{objects:[
          ctx.plate('recognition-bg','field-cold',0),
          item('match-cell','cell-violet',43,46,75,2),
          item('bound','matching',43,46,75,3),
          label('bound-word','యాంటీబాడీలు',64,66,52,'#5cc5bb'),
        ]},
        memory:{objects:[
          ctx.plate('recall-bg','field-warm',0),
          item('returning','cell-violet',69,33,46,2),
          item('memory-one','cell-memory',32,52,45,2),
          item('memory-two','cell-memory',53,59,28,2),
          item('recall','recall-cloud',60,43,66,3),
          label('memory-word','జ్ఞాపక కణాలు',38,69,51,'#5cc5bb'),
        ]},
      };
      const a=m.grow('free-marker','antigen-cue',.5);
      const b=m.grow('bound','binding-cue',.5);
      const c=m.grow('recall','recall-cue',.5);
      return {scenes,checks:{keyframes:[['exposure',Math.min(a+.56,ctx.shot('exposure').end-.04)],['recognition',b+.62],['memory',c+.64]]}};
    },
  };
})();
