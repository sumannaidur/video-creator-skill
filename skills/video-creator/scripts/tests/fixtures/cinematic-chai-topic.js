// P028.2 original visual benchmark: one paper tea stall, three framings.
// Synthetic timing only; no external assets or factual claims. Portrait review fixture, not a topic template.
(() => {
  const {sym, rnd} = globalThis.paperShotArt;
  const A = globalThis.paperKit.art;
  const lit = A.light({dir: [.48,.87]});
  const cut = (d, fill, depth=5) => A.piece(d,{fill,lit,depth});
  const rect = (x,y,w,h,c,rx=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}"/>`;
  const line = (d,c,w=3,opacity=1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${opacity}"/>`;
  const vb = '0 0 1000 1778';
  const glass = () => cut('M12 12H88L78 118H22Z','#d5ba88',3) +
    '<path d="M19 40H81L75 108H25Z" fill="#b66b36"/><ellipse cx="50" cy="40" rx="31" ry="6" fill="#dba46a"/>' +
    '<ellipse cx="50" cy="12" rx="38" ry="9" fill="#e8d8b3" stroke="#8b7860" stroke-width="3"/>' +
    '<ellipse cx="50" cy="12" rx="29" ry="5" fill="#9d633a"/>' +
    [28,40,60,72].map(x=>line(`M${x} 47l${(50-x)*.2} 54`,'#f7e4b8',3,.48)).join('');
  const kettle = () => cut('M72 79Q10 15 90 19Q176 4 194 82L173 89Q153 32 91 40Q46 37 85 76Z','#51463a',5) +
    cut('M65 91Q93 61 141 77L174 109Q199 145 177 191Q153 221 91 215Q29 208 24 164Q20 120 65 91Z','#b89a61',6) +
    cut('M163 111Q218 115 237 65L257 60Q245 135 183 162Z','#ac8e56',4) +
    '<ellipse cx="111" cy="89" rx="47" ry="11" fill="#dbbe82"/><ellipse cx="111" cy="76" rx="13" ry="8" fill="#4e4030"/>' +
    line('M52 130Q40 172 68 190','#f4d79d',8,.7)+line('M48 198Q109 219 173 194','#6c573b',4,.5);
  globalThis.paperTopic = {
    shots:[{id:'wide',scene:'stall'},{id:'medium',scene:'stall',start:4},{id:'detail',scene:'stall',start:8}],
    presentation:{mode:'full-bleed',captions:{position:'lower',emphasis:'word'}},
    css: ' .piece-art { filter:none }',
    symbols() {
      const sky=A.sky(1000,1778,{id:'chai-sky-grad',top:'#b2c8bf',bottom:'#f0d9ac',sun:{x:174,y:246,r:62}});
      const street=rect(0,1010,1000,768,'#c0a37e') +
        A.facade(-80,1080,340,670,{seed:31,floors:2,cols:2,wall:'#d5b794',roof:'#94745e',chimney:false,lit})+
        A.facade(718,1090,365,730,{seed:32,floors:2,cols:2,wall:'#c6b49b',roof:'#8a7563',chimney:false,lit})+
        line('M0 1130Q520 1090 1000 1150','#e6d1ac',17)+
        Array.from({length:36},(_,i)=>{const x=rnd(i+20)*1000,y=1190+rnd(i+900)*570;return line(`M${x} ${y}l${18+rnd(i+70)*42} -3`,'#82694d',2,.28)}).join('')+
        A.foliage(848,480,115,{seed:8,height:450,lit});
      const wall=rect(135,520,730,725,'#dfbd85')+
        A.masonry(135,810,730,435,{seed:7,brick:[98,39],colors:['#c49b70','#caa37b','#b88d66'],coping:null,lit})+
        cut('M164 551H835V1045H164Z','#594b3c',8)+
        rect(185,580,630,450,'#77614b')+
        [670,830].map(y=>rect(195,y,610,16,'#493a2f')).join('')+
        [215,310,410,510,610,710].map((x,i)=>rect(x,590,65,75,['#b78954','#e1c99f','#a9724a'][i%3],8)+rect(x-3,584,71,13,'#594b3c',3)+rect(x+8,614,49,22,'#e7d4aa',2)).join('')+
        [225,280,335,390,445,500,555,610,665,720].map(x=>rect(x,770,42,55,'#b6a28a',3)+line(`M${x+4} 782h34`,'#e7d3b1',3)).join('')+
        cut('M100 475L900 475L960 632L40 632Z','#a54839',9)+
        Array.from({length:9},(_,i)=>{let x=100+i*89;return `<path d="M${x} 475h44l${(i-4)*7} 157h-49Z" fill="#e5c89a" opacity=".85"/>`}).join('')+
        cut('M40 632H960V675Q915 702 870 675Q825 702 780 675Q735 702 690 675Q645 702 600 675Q555 702 510 675Q465 702 420 675Q375 702 330 675Q285 702 240 675Q195 702 150 675Q95 702 40 675Z','#8e3f34',4)+
        rect(145,685,19,560,'#594737')+rect(836,685,19,560,'#594737');
      const counter=cut('M165 1135L805 1135L890 1195L110 1195Z','#d4a56a',7)+
        cut('M110 1195H890L862 1400H138Z','#8a6246',7)+
        Array.from({length:7},(_,i)=>line(`M${145+i*105} 1200l5 191`,'#513d30',4,.5)).join('')+
        line('M145 1230H852M145 1374H852','#d1a171',7,.7)+
        Array.from({length:35},(_,i)=>{let x=160+rnd(i+1200)*660,y=1210+rnd(i+1800)*170;return line(`M${x} ${y}q15 5 35 0`,'#d8b183',2,.35)}).join('');
      const person=cut('M337 927Q349 855 424 852L497 852Q561 869 578 942L595 1135H320Z','#507d75',6)+
        cut('M410 815H482V876Q446 905 410 876Z','#bc825c',4)+
        cut('M383 750Q382 688 446 685Q514 688 515 758L504 815Q450 861 399 817Z','#c99169',5)+
        cut('M382 760Q351 689 413 668Q480 644 519 698L524 742L487 709L460 722L424 700L397 756Z','#43382e',4)+
        '<ellipse cx="423" cy="769" rx="6" ry="7" fill="#3f342c"/><ellipse cx="477" cy="769" rx="6" ry="7" fill="#3f342c"/>'+
        line('M450 772l-7 21 12 2M430 813q21 9 40 -2','#83573f',4)+
        '<path d="M423 803q17-16 29-3q11-13 28 2q-14 13-28 3q-15 8-29-2" fill="#594035"/>'+
        cut('M362 903Q329 914 321 962L367 1067L403 1050L374 965Z','#507d75',4)+
        cut('M367 1067L431 1100Q452 1103 454 1088L400 1039Z','#c99169',4)+
        cut('M534 912Q561 915 573 963L556 1053L521 1044L526 965Z','#507d75',4)+
        cut('M556 1053L612 1084Q625 1100 608 1107L521 1062Z','#c99169',4)+
        line('M410 874L447 915L482 874M447 915V1124','#d0d0a8',4,.65)+
        [960,1000,1040].map(y=>`<circle cx="448" cy="${y}" r="4" fill="#d2c299"/>`).join('');
      const foreground=cut('M0 1450Q94 1420 155 1490L121 1778H0Z','#71694e',6)+
        cut('M1000 1410Q917 1380 874 1500L930 1778H1000Z','#6d694e',6)+
        A.foliage(22,1480,85,{seed:17,height:300,lit})+
        A.foliage(988,1505,80,{seed:19,height:285,lit});
      return [sym('chai-sky',vb,sky),sym('chai-street',vb,street),sym('chai-stall',vb,wall),
        sym('chai-person',vb,person),sym('chai-counter',vb,counter),sym('chai-foreground',vb,foreground),
        sym('chai-glass','0 0 100 130',glass()),sym('chai-kettle','0 0 270 235',kettle()),
        sym('chai-steam','0 0 100 130',line('M32 122Q9 90 37 65T35 12M64 120Q90 84 59 55T68 8','#fff5db',8,.48)),
        sym('chai-shadow','0 0 120 36','<ellipse cx="60" cy="18" rx="58" ry="13" fill="#47362a" opacity=".35"/>')].join('');
    },
    build(ctx) {
      const {P,plate,motion}=ctx, {key,ambient}=motion;
      // Full-frame artwork is authored in one portrait world; only the camera changes.
      const objects=[plate('sky-plate','chai-sky',0),plate('street-plate','chai-street',1,'exact'),
        plate('stall-plate','chai-stall',2,'exact'),plate('seller','chai-person',3,'exact'),
        plate('counter-plate','chai-counter',3,'exact'),
        P('kettle-shadow','chai-shadow',65,65.8,25,4,{flat:true}),
        P('kettle','chai-kettle',65,60.5,29,4,{flat:true}),
        P('glass-shadow','chai-shadow',42,65.9,12,4,{flat:true}),
        P('glass','chai-glass',42,62,13,4,{flat:true}),
        P('steam','chai-steam',42,55.5,10,4,{flat:true}),
        plate('foreground-plate','chai-foreground',5,'exact')];
      ambient('steam',{drift:[.008,2.4,0],bob:[.008,2.8,1],flicker:[.3,2.1,0]});
      const cameras={wide:[key(0,[0,0,1]),key(4,[0,.015,1.05])],
        medium:[key(4,[0,.045,1.4]),key(8,[.01,.065,1.48])],
        detail:[key(8,[.02,.105,2.1]),key(12,[.045,.11,2.2])]};
      return {scenes:{stall:{objects}},cameras,checks:{keyframes:[['wide',2],['medium',6],['detail',10]],repeatAt:6}};
    }
  };
})();
