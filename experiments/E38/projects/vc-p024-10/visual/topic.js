(() => {
  const {sym} = globalThis.techShotArt;
  const K = globalThis.dataKit;
  const values = [18.33, 28.30, 34.45, 43.57, 52.21, 64.84, 72.99];
  const years = values.map((_, i) => 1951 + 10 * i);
  const pieces = ['first', 'decades', 'last'];
  const cues = ['below-cue', 'two-thirds-cue', 'final-cue'];
  const vb = '0 0 1000 1778';
  const colour = {paper:'#f5f2e8', ink:'#162d30', muted:'#456168', rule:'#ccd4c9', early:'#507b81', late:'#397872', hot:'#9c4729'};
  const x = 242, width = 630, top = 553, row = 87;
  const txt = (s,X,Y,sz,fill=colour.ink,more='') =>
    `<text x="${X}" y="${Y}" font-size="${sz}" fill="${fill}" ${more}>${s}</text>`;
  const box = (X,Y,w,h,fill,more='') => `<rect x="${X}" y="${Y}" width="${w}" height="${h}" fill="${fill}" ${more}/>`;
  const line = (x1,y1,x2,y2,stroke,more='') => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${stroke}" ${more}/>`;
  const font = s => `<g font-family="Segoe UI, sans-serif">${s}</g>`;
  function frame() {
    return box(0,0,1000,1778,colour.paper) + font(
      txt('INDIA  /  CENSUS SERIES',100,193,23,colour.hot,'font-weight="700" letter-spacing="4"') +
      txt('Literacy rose',100,276,78,colour.ink,'font-weight="750"') +
      txt('across six decades',100,350,65,colour.ink,'font-weight="750"') +
      line(100,390,900,390,colour.ink,'stroke-width="2"') +
      txt('Reported share of eligible population',100,451,29,colour.muted) +
      [0,25,50,75,100].map(t => {
        const X=x+width*t/100;
        return txt(t+'%',X,506,23,colour.muted,'text-anchor="middle"') + line(X,523,X,1152,colour.rule,'stroke-width="2"');
      }).join('') +
      years.map((y,i) => txt(y + (i===3||i===4?'*':''),100,top+i*row+29,31,colour.ink,'font-weight="650"')).join('') +
      line(100,top+3*row-23,900,top+3*row-23,colour.muted,'stroke-dasharray="5 7" stroke-width="2"') +
      txt('1951–71: ages 5+   /   1981–2011: ages 7+',100,1218,27,colour.ink,'font-weight="650"') +
      txt('* 1981 excludes Assam. 1991 excludes Jammu and Kashmir.',100,1260,22,colour.muted) +
      txt('Source: Census Commissioner via RBI Handbook, Table 6.',100,1298,22,colour.muted)
    );
  }
  function bar(i) {
    const y=top+i*row, value=values[i], length=width*value/100, k=i===0||i===5||i===6;
    const fill=k?colour.hot:i<3?colour.early:colour.late;
    return box(x,y,length,36,fill,`data-year="${years[i]}" data-value="${value}"`) +
      txt(value.toFixed(2)+'%',x+length+12,y+27,k?30:26,fill,k?'font-weight="750"':'font-weight="600"');
  }
  globalThis.dataStoryTopic = {
    shots:[{id:'series',scene:'series',accent:'#9c4729'}],css:K.css,
    symbols() {
      return sym('literacy-frame',vb,frame()) +
        [[0],[1,2,3,4,5],[6]].map((set,i) => sym('chart-'+pieces[i],vb,font(set.map(bar).join('')))).join('');
    },
    build(ctx) {
      const m=K.motion(ctx);
      const objects=[ctx.plate('paper','literacy-frame',0,'exact'), ...pieces.map(id=>({...ctx.plate(id,'chart-'+id,2,'exact'),dataMark:true}))];
      const keyframes=pieces.map((id,i)=>[id,m.label(id,cues[i])+.57]);
      return {scenes:{series:{objects}},checks:{keyframes}};
    },
  };
})();
