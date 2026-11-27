// Runs in Chromium against an already-seeked keyframe. Boxes are screen-space proxies.
export function inspectComposition(spec, is3D = false) {
  const findings = [];
  const add = (status, check, id, reason) => findings.push({status, check, id, reason});
  const fail = (check, id, reason) => add('failed', check, id, reason);
  const unsupported = (check, id, reason) => add('unsupported', check, id, reason);
  const stage = document.querySelector('.story-stage').getBoundingClientRect();
  const frame = {left: Math.max(0, stage.left), top: Math.max(0, stage.top),
    right: Math.min(innerWidth, stage.right), bottom: Math.min(innerHeight, stage.bottom)};
  const visible = el => {
    if (!el) return false;
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) <= .005) return false;
    }
    return true;
  };
  const bounds = el => {
    if (!visible(el)) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : null;
  };
  const intersection = (a,b) => ({
    left: Math.max(a.left,b.left), right: Math.min(a.right,b.right),
    top: Math.max(a.top,b.top), bottom: Math.min(a.bottom,b.bottom),
  });
  const overlaps = (a,b) => b.right - b.left > 1 && b.bottom - b.top > 1 &&
    Math.min(a.right,b.right) - Math.max(a.left,b.left) > 1 &&
    Math.min(a.bottom,b.bottom) - Math.max(a.top,b.top) > 1;
  const errors = [];
  if (!spec || typeof spec !== 'object' || Array.isArray(spec) || Object.keys(spec).some(k => !['regions','annotations','allow'].includes(k))) {
    return {status: 'failed', findings: [{status:'failed', check:'declaration', reason:'Expected regions, annotations or allow in a keyframe object'}]};
  }
  for (const k of ['regions','annotations','allow']) if (spec[k] !== undefined && !Array.isArray(spec[k])) errors.push(k);
  if (errors.length) return {status:'failed', findings:errors.map(id => ({status:'failed', check:'declaration', id, reason:'Expected an array'}))};
  const regions = spec.regions ?? [];
  const annotations = spec.annotations ?? [];
  const allow = spec.allow ?? [];
  const permitted = new Set(['crop','overlap']);
  for (const e of allow) if (!e || !permitted.has(e.check) || !e.id ||
    (e.check === 'overlap' && !e.with) || typeof e.reason !== 'string' || !e.reason.trim()) {
    fail('declaration', e?.id, 'Exceptions need a check, matching IDs and a written reason');
  }
  const except = (check,id,other) => allow.find(e => e?.check === check && e.id === id && e.with === other && typeof e.reason === 'string' && e.reason.trim());
  const issue = (check,id,other,reason) => {
    const e = except(check,id,other);
    if (e) add('allowed',check,id,`${reason} (${e.reason})`);
    else fail(check,id,reason);
  };
  const labels = [...document.querySelectorAll('.piece-label, footer .ct, #vc-hook .vc-hook-text')].map(el => ({
    id: el.classList.contains('piece-label') ? el.parentElement.id : el.closest('footer') ? '@caption' : '@hook',
    box: bounds(el),
  })).filter(x => x.box);
  const byRegion = new Map();
  for (const r of regions) {
    if (!r || typeof r.id !== 'string' || !r.id || byRegion.has(r.id)) { fail('declaration',r?.id,'Expected a unique protected object ID'); continue; }
    byRegion.set(r.id, null);
    const obj = document.getElementById(r.id);
    const box = bounds(obj);
    if (!box) { fail('visibility',r.id,'Protected evidence has no visible bounds'); continue; }
    const part = r.box ?? [0,0,1,1];
    if (!Array.isArray(part) || part.length !== 4 || !part.every(v => Number.isFinite(v) && v >= 0) ||
      !part[2] || !part[3] || part[0]+part[2] > 1 || part[1]+part[3] > 1) {
      fail('declaration',r.id,'Region box must fit within [0,0,1,1]'); continue;
    }
    const [x,y,w,h] = part;
    const b = {left:box.left+x*box.width, top:box.top+y*box.height, right:box.left+(x+w)*box.width, bottom:box.top+(y+h)*box.height};
    const view = intersection(b,frame);
    if (view.right <= view.left || view.bottom <= view.top) fail('visibility',r.id,'Protected evidence is entirely outside the stage');
    else if (b.left < frame.left-1 || b.top < frame.top-1 || b.right > frame.right+1 || b.bottom > frame.bottom+1)
      issue('crop',r.id,undefined,'Protected evidence crosses the stage edge');
    for (const l of labels) if (overlaps(l.box,view)) issue('overlap',r.id,l.id,`Protected evidence overlaps ${l.id}`);
    byRegion.set(r.id, view);
    if (is3D) unsupported('mesh-occlusion',r.id,'Projected proxy geometry cannot detect occlusion or material visibility');
  }
  // Compare browser-computed opaque sRGB colours on the label itself.
  const luminance = colour => {
    const m = /^rgb\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)$/.exec(colour);
    if (!m) return null;
    return m.slice(1).map(Number).reduce((sum,v,i) => {
      v /= 255;
      return sum + [.2126,.7152,.0722][i] * (v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
    },0);
  };
  const seen = new Set();
  for (const a of annotations) {
    if (!a || typeof a.id !== 'string' || !a.id || seen.has(a.id) || !byRegion.has(a.target)) {
      fail('declaration',a?.id,'Annotation needs a unique label ID and a declared target'); continue;
    }
    seen.add(a.id);
    const label = document.getElementById(a.id)?.querySelector('.piece-label');
    const labelBox = bounds(label), target = byRegion.get(a.target);
    if (!labelBox || !overlaps(labelBox,frame)) { fail('visibility',a.id,'Annotation label is missing, hidden or outside the stage'); continue; }
    if (target && !overlaps(labelBox,target)) {
      const leader = typeof a.leader === 'string' ? document.getElementById(a.leader) : null;
      if (a.leader === undefined) unsupported('anchor',a.id,'Declare a visible SVG line or path to verify both endpoints');
      else if (!leader) fail('anchor',a.id,'Declared leader was not found');
      else if (!visible(leader) || !leader.getScreenCTM?.()) fail('anchor',a.id,'Leader is hidden or off the active scene');
      else if (!['path','line'].includes(leader.localName) || !leader.getPointAtLength || !leader.getTotalLength)
        unsupported('anchor',a.id,'Leader is not an SVG line or path');
      else {
        const matrix = leader.getScreenCTM();
        const length = leader.getTotalLength();
        const ends = [0,length].map(d => leader.getPointAtLength(d).matrixTransform(matrix));
        const at = (p,b) => p.x >= b.left-3 && p.x <= b.right+3 && p.y >= b.top-3 && p.y <= b.bottom+3;
        if (!(length && ((at(ends[0],labelBox) && at(ends[1],target)) || (at(ends[1],labelBox) && at(ends[0],target)))))
          fail('anchor',a.id,`Leader must connect the label to ${a.target}`);
      }
    } else unsupported('anchor',a.id,'Endpoint attribution needs separate visible target and label boxes');
    for (const l of labels) if (l.id !== a.id && (!seen.has(l.id)) && overlaps(labelBox,l.box))
      issue('overlap',a.id,l.id,`Annotation overlaps ${l.id}`);
    const s = getComputedStyle(label);
    let solid = !label.children.length;
    for (let el=label; el; el=el.parentElement) {
      const computed=getComputedStyle(el);
      if (Number(computed.opacity) < 1 || computed.filter !== 'none' || computed.mixBlendMode !== 'normal') solid=false;
    }
    const fg = luminance(s.color), bg = luminance(s.backgroundColor);
    if (!solid || fg === null || bg === null || s.backgroundImage !== 'none')
      unsupported('contrast',a.id,'Contrast requires an opaque, solid sRGB background on the label and unmodified text');
    else {
      const ratio = (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
      if (ratio < 4.5) fail('contrast',a.id,`Contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
    }
  }
  const status = findings.some(f => f.status === 'failed') ? 'failed' :
    findings.some(f => f.status === 'unsupported') ? 'unsupported' :
    regions.length || annotations.length ? 'passed' : 'not-declared';
  return {status, findings};
}
