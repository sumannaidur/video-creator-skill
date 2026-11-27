function renderPaperScene(id) {
  const params = new URLSearchParams(location.search);
  const scene = Object.hasOwn(paperScenes, id) ? paperScenes[id] : null;
  if (!scene) throw new Error('Unknown scene: ' + id);
  const stage = document.querySelector('.story-stage');
  stage.replaceChildren();
  const ns = 'http://www.w3.org/2000/svg';
  const svg = (name, attrs) => {
    const node = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };
  const ids = [...scene.objects, ...scene.relationships].map(x => x.id);
  if (new Set(ids).size !== ids.length || ids.some(x => !/^[a-z][a-z0-9-]*$/.test(x))) {
    throw new Error('Scene requires unique stable IDs');
  }
  const objects = new Map(scene.objects.map(node => [node.id, node]));
  const lines = svg('svg', { class:'route-layer', viewBox:'0 0 100 100', preserveAspectRatio:'none', 'aria-hidden':'true' });
  for (const { id, from, to, meaning, inset, dashed } of scene.relationships) {
    if (!objects.has(from) || !objects.has(to) || from === to || !meaning) throw new Error('Invalid relationship: ' + id);
    const a = objects.get(from).position, b = objects.get(to).position;
    const dx = b.x-a.x, dy = b.y-a.y, length = Math.hypot(dx,dy);
    if (length < 22) throw new Error('Relationship endpoints too close: ' + id);
    const u = dx/length, v = dy/length;
    const start = [a.x+u*10,a.y+v*10], end = [b.x-u*inset,b.y-v*inset];
    const control = [(start[0]+end[0])/2-v*4,(start[1]+end[1])/2+u*4];
    const group = svg('g', { id, 'data-object':id });
    const path = svg('path', { class:'route connector'+(dashed?' radio':''),
      d:`M${start.join(' ')} Q${control.join(' ')} ${end.join(' ')}` });
    const arm = side => [end[0]-u*2.6-v*side*1.55,end[1]-v*2.6+u*side*1.55].join(' ');
    const tip = svg('path', {class:'route connector',d:`M${arm(-1)} L${end.join(' ')} ${arm(1)}`});
    const title = svg('title', {});
    title.textContent = meaning;
    group.append(title,path,tip);
    lines.append(group);
  }
  stage.append(lines);
  for (const { id, art, position:{x,y,width}, layer, label } of scene.objects) {
    if (![x,y,width,layer].every(Number.isFinite) || x<0 || x>100 || y<0 || y>100 || width<=0 || width>100) {
      throw new Error('Invalid position: ' + id);
    }
    const node = document.createElement('div');
    node.id = id;
    node.dataset.object = id;
    node.dataset.required = id;
    node.className = 'piece piece--' + (art || 'annotation');
    Object.assign(node.style, {left:x+'%',top:y+'%',width:width+'%',zIndex:layer});
    if (art) {
      const symbol = document.getElementById(art);
      if (symbol?.localName !== 'symbol') throw new Error('Missing SVG symbol: ' + art);
      const image = svg('svg', {class:'piece-art',viewBox:symbol.getAttribute('viewBox'),'aria-hidden':'true'});
      image.append(svg('use', {href:'#'+art}));
      node.append(image);
    }
    if (label) {
      const text = document.createElement('span');
      text.className = 'piece-label';
      text.dataset.text = '';
      text.textContent = label;
      node.append(text);
    }
    stage.append(node);
  }
  if (scene.cues.some(cue => !ids.includes(cue.object) || !cue.when || !cue.action)) throw new Error('Invalid motion cue');
  document.documentElement.lang = scene.locale;
  document.querySelector('h1').textContent = scene.heading;
  document.querySelector('footer').textContent = scene.narrationCaption;
  if (params.get('debug') === '1') {
    const label = document.querySelector('.debug');
    label.hidden = false;
    label.textContent = id + ' · ' + scene.beat;
  }
}
renderPaperScene(new URLSearchParams(location.search).get('scene') || 'flights-hook');
