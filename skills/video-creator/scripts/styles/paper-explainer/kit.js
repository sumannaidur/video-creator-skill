// Paper Explainer kit (browser script, loaded after engine.js by backend.mjs): optional artistic primitives and motion
// helpers generalized from the accepted P012/P013 work. Style-specific: nothing here is part of the core renderer or other styles.
// Every helper returns raw SVG markup, keyframes or object specs for the topic to place; none of them decides a scene,
// a layout, an object, a metaphor or a time. Deterministic: variation comes only from the seed you pass.
(() => {
  const {f, rnd, blob, sym} = globalThis.paperShotArt;
  const INK = '#252A30', PAPER = '#fff9ee';
  const fail = message => { throw new Error('Paper kit: ' + message); };
  const num = (x, name) => (typeof x === 'number' && Number.isFinite(x)) ? x : fail(`${name} must be a number`);

  // ---------- art (SVG markup strings) ----------
  // Paper-fibre hatching for flat areas (P013 `hatch`): short, slightly tilted strokes scattered over a box.
  const fibres = (seed, count, x, y, w, h, color = '#d8cdb6', opacity = .35) => Array.from({length: count}, (_, i) => {
    const px = x + rnd(seed + i) * w, py = y + rnd(seed + 100 + i) * h, l = 18 + rnd(seed + 200 + i) * 34;
    return `<path d="M${f(px)} ${f(py)}l${f(l)} ${f(-l * .12)}" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="${opacity}"/>`;
  }).join('');

  // A cut paper sheet with irregular hand-cut corners, ink edge and fibres (the cards/tickets/boards of P012-P013).
  const sheet = (w, h, {seed = 1, fill = PAPER, stroke = INK, strokeWidth = 4, wobble = .012, fibreColor = '#ddd3bf', fibreCount = 0} = {}) => {
    const j = k => (rnd(seed + k) - .5) * 2 * wobble;
    const pts = [[w * (.01 + j(1)), h * (.02 + j(2))], [w * (.99 + j(3)), h * (.01 + j(4))], [w * (.99 + j(5)), h * (.98 + j(6))], [w * (.01 + j(7)), h * (.99 + j(8))]];
    return `<path d="M${pts.map(p => p.map(f).join(' ')).join('L')}Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>` +
      (fibreCount ? fibres(seed + 31, fibreCount, w * .05, h * .05, w * .85, h * .9, fibreColor, .5) : '');
  };

  // Organic cut-paper shape with a darker underlayer offset for thickness (dimensional construction of P013 clouds/hills).
  const layered = (cx, cy, rx, ry, {seed = 1, fill = '#fbfaf5', under = '#d4dde0', edge = null, depth = [8, 12], n = 14, amp = .16} = {}) =>
    `<path d="${blob(cx + depth[0], cy + depth[1], rx, ry, n, amp, seed)}" fill="${under}"/>` +
    `<path d="${blob(cx, cy, rx, ry, n, amp, seed + 3)}" fill="${fill}"${edge ? ` stroke="${edge}" stroke-width="2"` : ''}/>`;

  // Soft cast shadow for a floating cut-out (P013 aircraft shadow). Give each a unique filter id.
  const castShadow = (filterId, w = 400, h = 60, {opacity = .35, blur = 7, color = '#2c3035'} = {}) =>
    `<defs><filter id="${filterId}" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>` +
    `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * .45}" ry="${h * .27}" fill="${color}" opacity="${opacity}" filter="url(#${filterId})"/>`;

  // Hand-drawn emphasis ring (P013 price/fare rings): dashed ellipse; pair with motion.ring for the drawn-on reveal.
  const ring = (w = 400, h = 200, {color = '#DAB357', width = 10, dash = '40 14'} = {}) =>
    `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - width - 4}" ry="${h / 2 - width - 8}" fill="none" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}" stroke-linecap="round"/>`;

  // Dashed string or explanatory connector through points (P013 strings behind the price); `sag` bows each span.
  const connector = (points, {color = INK, width = 3, dash = '7 7', sag = 0, opacity = 1} = {}) => {
    if (!Array.isArray(points) || points.length < 2) fail('connector needs at least two points');
    let d = `M${points[0].map(f).join(' ')}`;
    for (let i = 1; i < points.length; i++) {
      const [a, b] = [points[i - 1], points[i]], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag];
      d += sag ? ` Q${mid.map(f).join(' ')} ${b.map(f).join(' ')}` : ` L${b.map(f).join(' ')}`;
    }
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}" stroke-linecap="round" opacity="${opacity}"/>`;
  };

  // Scattered paper-tile texture for `dissolve` transitions (P013 tile dissolves): fills a 1000x1600 frame.
  const tileTexture = (seed, palette, {count = 40, ground = INK, rMin = 40, rMax = 130} = {}) =>
    `<rect width="1000" height="1600" fill="${ground}"/>` + Array.from({length: count}, (_, i) =>
      `<path d="${blob(rnd(seed + i) * 1000, rnd(seed + 50 + i) * 1600, rMin + rnd(seed + 99 + i) * (rMax - rMin), rMin + rnd(seed + 149 + i) * (rMax - rMin), 10, .14, seed + i)}" fill="${palette[i % palette.length]}"/>`).join('');

  // Several symbols sharing one viewBox, so separate parts (far wing, body, near wing...) stack into one dimensional
  // object across layers and can move independently (P013 aircraft construction). parts: {suffix: markup}.
  const parts = (prefix, viewBox, partMarkup) => Object.entries(partMarkup).map(([name, body]) => sym(`${prefix}-${name}`, viewBox, body)).join('');

  // ---------- P018.3 richness (optional): one key light, cut-paper depth, gouache volume, layered environments ----------
  // Reference characteristics (P018.1 audit, Paper Collage / Painted Story): layered torn-paper depth with crisp offset
  // shadows, gouache/paper grain, stratified ground, sky with sun halo, aerial haze between depth planes. None of these is
  // applied automatically; a topic calls them where its composition needs them.
  const hex = c => { const v = c.replace('#', ''); const n = v.length === 3 ? v.split('').map(x => x + x).join('') : v.slice(0, 6); return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16)); };
  const mix = (a, b, t) => '#' + hex(a).map((x, i) => Math.round(x + (hex(b)[i] - x) * t).toString(16).padStart(2, '0')).join('');
  // A key light: `dir` is the direction light travels (screen units, y down). Shadows fall along it; lit rims face against it.
  const light = ({dir = [.55, .85], warm = '#fff4dc', shade = '#2a2116'} = {}) => { const l = Math.hypot(...dir) || 1; return {dir: [dir[0] / l, dir[1] / l], warm, shade}; };
  let clipN = 0;
  // Cut-paper layer of thickness `depth`: a crisp offset shadow along the light, the body, and a lit rim on the side
  // facing the light (the stroke is shifted toward the light and clipped to the shape). Optional texture overlay.
  const cut = (d, {fill, depth = 10, lit = light(), shadowOpacity = .26, rim = .55, edge = null, texture = null, textureOpacity = 1, id = null} = {}) => {
    const [dx, dy] = lit.dir, cid = id ?? `pk-cut-${++clipN}`;
    return `<path d="${d}" fill="${lit.shade}" opacity="${shadowOpacity}" transform="translate(${f(dx * depth)} ${f(dy * depth)})"/>` +
      `<path d="${d}" fill="${fill}"${edge ? ` stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"` : ''}/>` +
      (texture ? `<path d="${d}" fill="url(#${texture})" opacity="${textureOpacity}"/>` : '') +
      (rim ? `<clipPath id="${cid}"><path d="${d}"/></clipPath><path d="${d}" fill="none" stroke="${lit.warm}" stroke-width="${f(Math.max(3, depth * .5))}" opacity="${rim}" clip-path="url(#${cid})" transform="translate(${f(dx * depth * .35)} ${f(dy * depth * .35)})"/>` : '');
  };
  // Gouache volume: a gradient along the light (lit side warmer and lighter, far side darker), for rounded objects.
  const gouache = (d, {fill, id, lit = light(), strength = .32, texture = null, edge = null} = {}) => {
    if (!id) fail('gouache needs a unique gradient id');
    const [dx, dy] = lit.dir;
    return `<defs><linearGradient id="${id}" x1="${f(.5 - dx * .5)}" y1="${f(.5 - dy * .5)}" x2="${f(.5 + dx * .5)}" y2="${f(.5 + dy * .5)}">` +
      `<stop offset="0" stop-color="${mix(fill, lit.warm, strength)}"/><stop offset=".55" stop-color="${fill}"/><stop offset="1" stop-color="${mix(fill, lit.shade, strength)}"/></linearGradient></defs>` +
      `<path d="${d}" fill="url(#${id})"${edge ? ` stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"` : ''}/>` + (texture ? `<path d="${d}" fill="url(#${texture})"/>` : '');
  };
  // A wavy band edge from x=0 to x=w at height y (shared by ridges and strata).
  const wave = (w, y, {seed = 1, amp = 14, n = 9} = {}) => {
    let d = `M0 ${f(y + (rnd(seed) - .5) * amp)}`;
    for (let i = 1; i <= n; i++) { const x = w * i / n, px = w * (i - .5) / n; d += ` Q${f(px)} ${f(y + (rnd(seed + i * 3) - .5) * amp * 2)} ${f(x)} ${f(y + (rnd(seed + i) - .5) * amp)}`; }
    return d;
  };
  // Distant ridge silhouette (mountains, dunes, skyline mass): closed path from a jagged top down to `bottom`.
  const ridge = (w, y, bottom, {seed = 1, amp = 120, n = 6} = {}) => {
    let d = `M0 ${f(bottom)}L0 ${f(y + rnd(seed) * amp * .4)}`;
    for (let i = 1; i <= n; i++) { const x = w * i / n; d += ` L${f(x - w / n * (.35 + rnd(seed + i) * .3))} ${f(y - rnd(seed + 10 + i) * amp)} L${f(x)} ${f(y + rnd(seed + 20 + i) * amp * .35)}`; }
    return d + `L${w} ${f(bottom)}Z`;
  };
  // Stratified ground (cross-sections): bands from `top` down, each a wavy cut-paper layer with an optional pebble scatter.
  // bands: [{h, color, pebbles?, pebbleColor?}] top to bottom.
  const strata = (w, top, bands, {seed = 1, lit = light(), texture = null} = {}) => {
    let y = top, out = '';
    const tops = bands.map(b => { const t = y; y += b.h; return t; });
    bands.forEach((b, i) => {
      const yy = tops[i], bottom = (tops[i + 1] ?? y) + 30;
      const d = `${wave(w, yy, {seed: seed + i * 17, amp: 10 + i * 2})} L${w} ${f(bottom)} L0 ${f(bottom)}Z`;
      out += cut(d, {fill: b.color, depth: 7, lit, rim: .35, texture, shadowOpacity: .22});
      for (let k = 0; k < (b.pebbles ?? 0); k++) {
        const px = rnd(seed + i * 101 + k) * w, py = yy + 22 + rnd(seed + i * 131 + k) * (b.h - 30), r = 5 + rnd(seed + i * 151 + k) * 11;
        out += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(r * 1.4)}" ry="${f(r)}" fill="${b.pebbleColor ?? mix(b.color, '#000000', .25)}" opacity=".7"/>` +
          `<ellipse cx="${f(px - r * .35)}" cy="${f(py - r * .35)}" rx="${f(r * .5)}" ry="${f(r * .3)}" fill="#ffffff" opacity=".18"/>`;
      }
    });
    return out;
  };
  // Painted sky: vertical gradient plus an optional sun disc with a soft halo (radial gradients, no filters).
  const sky = (w, h, {id, top = '#f2c9a2', bottom = '#f7e6c8', sun = null} = {}) => {
    if (!id) fail('sky needs a unique id');
    let s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>` +
      (sun ? `<radialGradient id="${id}-halo"><stop offset="0" stop-color="${sun.halo ?? '#fff1c9'}" stop-opacity=".85"/><stop offset="1" stop-color="${sun.halo ?? '#fff1c9'}" stop-opacity="0"/></radialGradient>` : '') +
      `</defs><rect width="${w}" height="${h}" fill="url(#${id})"/>`;
    if (sun) s += `<circle cx="${sun.x}" cy="${sun.y}" r="${f(sun.r * 3.2)}" fill="url(#${id}-halo)"/><circle cx="${sun.x}" cy="${sun.y}" r="${sun.r}" fill="${sun.color ?? '#f4b350'}"/>`;
    return s;
  };
  // Aerial perspective: a haze band (paper colour fading in) laid over far layers to push them back.
  const haze = (w, y, h, {id, color = '#f4efe4', opacity = .55} = {}) => {
    if (!id) fail('haze needs a unique id');
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".6" stop-color="${color}" stop-opacity="${opacity}"/>` +
      `<stop offset="1" stop-color="${color}" stop-opacity="${f(opacity * .4)}"/></linearGradient></defs><rect y="${f(y)}" width="${w}" height="${f(h)}" fill="url(#${id})"/>`;
  };
  // Baked paper/gouache textures as <pattern> defs (shared/texture.js). Returns markup; use the ids as `texture`.
  const textures = (prefix, {tile = 360, seed = 3} = {}) => {
    const T = globalThis.vcTexture ?? fail('textures need shared/texture.js');
    return `<defs>${T.pattern(`${prefix}-paper`, T.bake({kind: 'paper', seed, tint: [60, 44, 26], alpha: [0, .16], fibres: 120}), tile)}` +
      `${T.pattern(`${prefix}-gouache`, T.bake({kind: 'gouache', seed: seed + 1, tint: [40, 28, 16], alpha: [0, .2]}), tile * 1.6)}` +
      `${T.pattern(`${prefix}-speckle`, T.bake({kind: 'speckle', seed: seed + 2, tint: [30, 24, 18], alpha: [0, .28], contrast: 2.4}), tile * .6)}</defs>`;
  };


  // Level, one-point ground projection for topic-authored environments. Units are arbitrary but consistent.
  // x is horizontal, z is positive depth from the camera, h is height above the ground.
  // This is a layout tool for 2D art, not a 3D renderer or an automatic environment generator.
  const groundPlane = ({cx, horizon, focal, eyeHeight, near = .1} = {}) => {
    [cx, horizon, focal, eyeHeight, near].forEach((v, i) => num(v, ['cx','horizon','focal','eyeHeight','near'][i]));
    if (focal <= 0 || eyeHeight <= 0 || near <= 0) fail('groundPlane requires positive focal, eyeHeight and near');
    const project = (x, z, h = 0) => {
      num(x, 'x'); num(z, 'z'); num(h, 'h');
      if (z < near) fail('groundPlane point is behind near plane');
      const scale = focal / z, px = cx + x * scale, py = horizon + (eyeHeight - h) * scale;
      [scale, px, py].forEach(v => num(v, 'projected coordinate'));
      if (scale <= 0) fail('groundPlane scale underflow');
      return {x: px, y: py, scale};
    };
    // Footprints and paths share the same ground projection as standing artwork.
    const polygon = (points) => {
      if (!Array.isArray(points) || points.length < 3 || points.length > 256) fail('groundPlane polygon needs 3..256 points');
      return 'M' + points.map(p => {
        if (!Array.isArray(p) || p.length !== 2) fail('groundPlane footprint point must be [x,z]');
        const q = project(p[0], p[1]);
        return f(q.x) + ' ' + f(q.y);
      }).join('L') + 'Z';
    };
    // Place authored upright artwork in local world units with its base at (0,0).
    // Caller owns markup, clipping, occlusion, style and detail. Draw far objects first.
    const upright = (x, z, markup) => {
      if (typeof markup !== 'string') fail('groundPlane upright requires markup');
      const q = project(x, z);
      return '<g transform="translate(' + f(q.x) + ' ' + f(q.y) + ') scale(' + f(q.scale) + ')">' + markup + '</g>';
    };
    // Grounded contact and directional cast shadows in world coordinates. A capsule-like
    // silhouette is an approximation for a standing object, not physical light simulation.
    // Draw on the receiving plane before the occluding art. No filters, IDs or per-frame textures.
    const shadow = (x, z, {radius = .25, height = 1, direction = [1, .5],
      lengthPerHeight = 1, softness = .25, opacity = .28, color = '#302b26'} = {}) => {
      [x,z,radius,height,lengthPerHeight,softness,opacity].forEach(v => num(v, 'shadow parameter'));
      if (radius <= 0 || height < 0 || lengthPerHeight < 0 || softness < 0 ||
          softness > 1 || opacity < 0 || opacity > 1) fail('invalid ground shadow range');
      if (!Array.isArray(direction) || direction.length !== 2) fail('shadow direction must be [dx,dz]');
      direction.forEach(v => num(v, 'shadow direction'));
      const norm = Math.hypot(...direction);
      if (!Number.isFinite(norm) || norm <= 0) fail('shadow direction must be nonzero');
      if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) fail('shadow color must be #rrggbb');
      const dx = direction[0]/norm, dz = direction[1]/norm;
      const length = height * lengthPerHeight;
      num(length, 'shadow length');
      // Convex projected capsules with fixed vertex count; decreasing opacity toward edge.
      // For a zero-length shadow this reduces to concentric contact footprints.
      const capsule = (r, l) => {
        const points = [];
        for (let i = 0; i <= 8; i++) {
          const theta = -Math.PI/2 + Math.PI*i/8;
          const u = Math.cos(theta)*r, v = Math.sin(theta)*r;
          points.push([x+dx*(l+u)-dz*v,z+dz*(l+u)+dx*v]);
        }
        for (let i = 0; i <= 8; i++) {
          const theta = Math.PI/2 + Math.PI*i/8;
          const u = Math.cos(theta)*r, v = Math.sin(theta)*r;
          points.push([x+dx*u-dz*v,z+dz*u+dx*v]);
        }
        return polygon(points);
      };
      const layers = [[1+softness,.22],[1+softness*.5,.30],[1,.48]];
      let out = '';
      for (const [spread, alpha] of layers) {
        const d = capsule(radius*spread,length);
        out += '<path d="'+d+'" fill="'+color+'" opacity="'+f(opacity*alpha)+'"/>';
      }
      // A compact darker footprint anchors the object even with a long cast shadow.
      out += '<path d="'+capsule(radius*.72,0)+'" fill="'+color+'" opacity="'+f(opacity*.65)+'"/>';
      return out;
    };
    return {project, polygon, upright, shadow};
  };

  // A level camera expressed in shared world coordinates. Positive yaw looks toward +x.
  // The old groundPlane remains unchanged; shadows are constructed in camera coordinates.
  const worldCamera = ({x = 0, z = 0, yaw = 0, ...settings} = {}) => {
    [x,z,yaw].forEach(v => num(v, 'world camera parameter'));
    const angle = (yaw % 360) * Math.PI / 180;
    const c = Math.cos(angle), s = Math.sin(angle);
    const g = groundPlane(settings);
    const direction = (dx,dz) => [c*dx-s*dz,s*dx+c*dz];
    const local = (wx,wz) => {
      num(wx,'world x'); num(wz,'world z');
      const q = direction(wx-x,wz-z);
      q.forEach(v=>num(v,'camera coordinate'));
      return q;
    };
    const project = (wx,wz,h=0) => g.project(...local(wx,wz),h);
    const polygon = points => {
      if (!Array.isArray(points) || points.length<3 || points.length>256)
        fail('worldCamera polygon needs 3..256 points');
      return g.polygon(points.map(p=>{
        if (!Array.isArray(p)||p.length!==2) fail('worldCamera footprint point must be [x,z]');
        return local(...p);
      }));
    };
    const upright = (wx,wz,markup) => g.upright(...local(wx,wz),markup);
    const shadow = (wx,wz,{direction:dir=[1,.5],...options}={}) => {
      if (!Array.isArray(dir)||dir.length!==2) fail('shadow direction must be [dx,dz]');
      dir.forEach(v=>num(v,'shadow direction'));
      return g.shadow(...local(wx,wz),{...options,direction:direction(...dir)});
    };
    // Author a planar face from world points. No clipping, culling or automatic depth sort.
    const face = points => {
      if (!Array.isArray(points)||points.length<3||points.length>256)
        fail('worldCamera face needs 3..256 points');
      return 'M'+points.map(p=>{
        if (!Array.isArray(p)||p.length!==3) fail('worldCamera face point must be [x,z,h]');
        const q=project(...p);
        return f(q.x)+' '+f(q.y);
      }).join('L')+'Z';
    };
    const depth = (wx,wz) => local(wx,wz)[1];
    return {project,polygon,upright,shadow,face,depth};
  };



  // Level world camera trajectory: absolute timeline seconds, no accumulated state.
  // Each key is a complete pose; yaw is explicitly unwrapped by the author.
  const cameraPath = ({cx,horizon,focal,near=.1,keys,target,interpolation='segment'}={}) => {
    [cx,horizon,focal,near].forEach(v=>num(v,'cameraPath projection'));
    if(focal<=0||near<=0) fail('cameraPath positive focal and near required');
    if(target!==undefined&&typeof target!=='function') fail('cameraPath target must be a function');
    if(!Array.isArray(keys)||!keys.length||keys.length>256) fail('cameraPath needs 1..256 keys');
    if(!['segment','continuous'].includes(interpolation)) fail('cameraPath unknown interpolation');
    const curves={linear:p=>p,smooth:p=>p*p*(3-2*p)};
    const frames=keys.map((k,i)=>{
      if(!k||typeof k!=='object'||Array.isArray(k)) fail('cameraPath invalid key');
      const {t,x,z,eyeHeight,yaw=0,ease='smooth'}=k;
      [t,x,z,eyeHeight,yaw].forEach(v=>num(v,'cameraPath key'));
      if(t<0||(i&&t<=keys[i-1].t)||eyeHeight<=0) fail('cameraPath keys require increasing nonnegative times and positive eyeHeight');
      if(!Object.hasOwn(curves,ease)) fail('cameraPath unknown ease');
      return {t,x,z,eyeHeight,yaw,ease};
    });
    // Shape-preserving cubic Hermite per coordinate. Weighted harmonic slopes
    // accommodate uneven key spacing and avoid overshoot on monotone segments.
    // End slopes are zero to match the clamped portions of the path.
    const channels=['x','z','eyeHeight','yaw'];
    const slopes=interpolation==='continuous'?Object.fromEntries(channels.map(name=>{
      const h=frames.slice(1).map((b,i)=>num(b.t-frames[i].t,'cameraPath interval'));
      const d=h.map((dt,i)=>num((frames[i+1][name]-frames[i][name])/dt,'cameraPath slope'));
      const m=frames.map((_,i)=>{
        if(i===0||i===frames.length-1) return 0;
        const a=d[i-1],b=d[i];
        if(a===0||b===0||Math.sign(a)!==Math.sign(b)) return 0;
        // Normalize weights and slopes before the harmonic mean.
        const maxH=Math.max(h[i-1],h[i]), left=h[i-1]/maxH,right=h[i]/maxH;
        const w=(2*right+left)/(3*(left+right));
        const low=Math.min(Math.abs(a),Math.abs(b));
        return num(Math.sign(a)*low/(w*(low/Math.abs(a))+(1-w)*(low/Math.abs(b))),'cameraPath tangent');
      });
      return [name,m];
    })):null;
    const poseAt=t=>{
      num(t,'cameraPath time');
      let a=frames[0],b=a,p=0,segment=-1;
      if(t>=frames.at(-1).t) a=b=frames.at(-1);
      else if(t>frames[0].t){
        const i=frames.findIndex(k=>k.t>=t);
        a=frames[i-1];b=frames[i];segment=i-1;
        const u=(t-a.t)/(b.t-a.t);
        p=slopes?u:curves[b.ease](u);
      }
      const lerp=(u,v)=>num(u*(1-p)+v*p,'cameraPath interpolated value');
      const pose={x:lerp(a.x,b.x),z:lerp(a.z,b.z),eyeHeight:lerp(a.eyeHeight,b.eyeHeight),yaw:lerp(a.yaw,b.yaw)};
      if(slopes&&segment>=0){
        const u=p,u2=u*u,u3=u2*u,h=b.t-a.t;
        for(const name of channels){
          const m=slopes[name];
          const y=(2*u3-3*u2+1)*a[name]+(u3-2*u2+u)*h*m[segment]+(-2*u3+3*u2)*b[name]+(u3-u2)*h*m[segment+1];
          pose[name]=num(y,'cameraPath cubic value');
        }
      }
      if(target){
        // Target is sampled at the requested absolute time, even outside the camera keys.
        const q=target(t);
        if(!Array.isArray(q)||q.length!==2) fail('cameraPath target must return [x,z]');
        const dx=num(q[0],'target x')-pose.x,dz=num(q[1],'target z')-pose.z;
        num(dx,'target delta');num(dz,'target delta');
        if(Math.hypot(dx,dz)<near) fail('cameraPath target too close');
        pose.yaw=Math.atan2(dx,dz)*180/Math.PI;
      }
      return pose;
    };
    const at=t=>worldCamera({cx,horizon,focal,near,...poseAt(t)});
    return {poseAt,at};
  };

  // ---------- P018.4 construction: recognizable objects built from components (not decorated basic shapes) ----------
  // Reference characteristics (P018.1 audit, Painted Story / Paper Collage): buildings with windows, frames, sills,
  // shutters and roof tiles; stone and brick masonry; layered foliage; water with depth and ripples; characters with
  // faces and posable limbs. Each helper returns SVG markup in the caller's coordinates; seeds give variation, the topic
  // decides what, where and how many. Light comes from `lit` (see light()) so all parts share one key light.
  let constructN = 0;
  // Coursed brick/stone masonry in a rectangle: per-brick tone variation, chipped bricks, lit top edges, mortar, an
  // optional coping course on top and weathering/moss at the foot.
  const masonry = (x, y, w, h, {seed = 1, brick = [52, 22], gap = 3, mortar = '#cbbda3', colors = ['#a9553b', '#b8643f', '#9a4a31', '#b05c3e', '#a24f39'],
    coping = '#c9c0ae', moss = '#6f7d45', lit = light()} = {}) => {
    const id = `pk-mas-${++constructN}`, [bw, bh] = brick;
    let b = '';
    for (let r = 0, yy = y; yy < y + h; r++, yy += bh) {
      for (let xx = x - (r % 2 ? bw / 2 : 0); xx < x + w; xx += bw) {
        const k = rnd(seed + r * 97 + Math.round(xx)), c = colors[Math.floor(k * colors.length)], chip = rnd(seed + r * 31 + Math.round(xx) * 7) > .93;
        b += `<rect x="${f(xx + gap / 2)}" y="${f(yy + gap / 2)}" width="${f(bw - gap)}" height="${f(bh - gap)}" rx="2" fill="${chip ? mix(c, '#3a2418', .3) : mix(c, k > .5 ? '#ffffff' : '#000000', (k % .25) * .5)}"/>` +
          `<path d="M${f(xx + gap)} ${f(yy + gap / 2 + 1)}h${f(bw - 2 * gap)}" stroke="${lit.warm}" stroke-opacity=".35" stroke-width="1.5"/>`;
      }
    }
    const cop = coping ? Array.from({length: Math.ceil(w / (bw * 1.6))}, (_, i) => `<rect x="${f(x + i * bw * 1.6 + 1)}" y="${f(y - bh * .9)}" width="${f(bw * 1.6 - 3)}" height="${f(bh * .95)}" rx="5" fill="${mix(coping, '#000000', rnd(seed + 400 + i) * .12)}"/>` +
      `<path d="M${f(x + i * bw * 1.6 + 5)} ${f(y - bh * .9 + 2)}h${f(bw * 1.6 - 12)}" stroke="#ffffff" stroke-opacity=".45" stroke-width="2"/>`).join('') : '';
    return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><linearGradient id="${id}-m" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset=".55" stop-color="${moss}" stop-opacity="0"/><stop offset="1" stop-color="${moss}" stop-opacity=".55"/></linearGradient></defs>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${mortar}"/><g clip-path="url(#${id})">${b}` +
      Array.from({length: Math.round(w / 90)}, (_, i) => `<path d="M${f(x + rnd(seed + 600 + i) * w)} ${f(y + h * (.2 + rnd(seed + 700 + i) * .3))}v${f(h * (.3 + rnd(seed + 800 + i) * .5))}" stroke="#2f2a22" stroke-opacity=".16" stroke-width="${f(6 + rnd(seed + 900 + i) * 10)}" stroke-linecap="round"/>`).join('') +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}-m)"/></g>${cop}`;
  };
  // A building facade standing on ground line y (bottom-left corner x): wall, quoins, string courses, framed windows
  // with mullions, sills, lintels, optional shutters and flower boxes, a panelled door with steps, a tiled roof with
  // chimney pots. floors x columns follow from size unless given.
  const facade = (x, y, w, h, {seed = 1, floors = Math.max(1, Math.round(h / 150)), cols = Math.max(1, Math.round(w / 120)), wall = '#e9d6b4', trim = '#f7efe0',
    glass = '#3e5468', roof = '#9c4a35', shutter = null, door = '#4f6b5a', chimney = true, lit = light(), texture = null} = {}) => {
    const top = y - h, fh = h / floors, out = [];
    const roofH = Math.min(120, w * .28);
    out.push(cut(`M${x - 14} ${top}L${x + w * .12} ${top - roofH}L${x + w * .88} ${top - roofH}L${x + w + 14} ${top}Z`, {fill: roof, depth: 6, lit, rim: .5}));
    for (let r = 1; r < roofH / 14; r++) out.push(`<path d="M${f(x - 14 + w * .12 * r * 14 / roofH)} ${f(top - r * 14)}H${f(x + w + 14 - w * .12 * r * 14 / roofH)}" stroke="${mix(roof, '#000000', .3)}" stroke-width="2" opacity=".55"/>`);
    if (chimney) {
      const cx = x + w * (.25 + rnd(seed) * .45);
      out.push(cut(`M${f(cx)} ${f(top - roofH + 20)}V${f(top - roofH - 60)}H${f(cx + 46)}V${f(top - roofH + 20)}Z`, {fill: mix(roof, '#6b5b4f', .5), depth: 5, lit, rim: .4}) +
        `<rect x="${f(cx - 5)}" y="${f(top - roofH - 68)}" width="56" height="10" rx="2" fill="#5b4c42"/><rect x="${f(cx + 8)}" y="${f(top - roofH - 88)}" width="12" height="22" rx="3" fill="#a5523a"/><rect x="${f(cx + 26)}" y="${f(top - roofH - 84)}" width="12" height="18" rx="3" fill="#a5523a"/>`);
    }
    out.push(cut(`M${x} ${y}V${top}H${x + w}V${y}Z`, {fill: wall, depth: 9, lit, rim: .45, texture}));
    for (let q = 0; q < h / 34; q++) out.push(`<rect x="${q % 2 ? x : x - 2}" y="${f(y - (q + 1) * 34 + 2)}" width="${q % 2 ? 22 : 30}" height="30" fill="${mix(wall, '#000000', .1)}"/><rect x="${q % 2 ? x + w - 22 : x + w - 28}" y="${f(y - (q + 1) * 34 + 2)}" width="${q % 2 ? 22 : 30}" height="30" fill="${mix(wall, '#000000', .1)}"/>`);
    const ww = Math.min(64, w / cols * .5), wh = Math.min(96, fh * .55);
    for (let fl = 0; fl < floors; fl++) {
      const fy = y - fl * fh;
      if (fl) out.push(`<rect x="${x}" y="${f(fy - 6)}" width="${w}" height="10" fill="${trim}"/><rect x="${x}" y="${f(fy + 3)}" width="${w}" height="3" fill="#000000" opacity=".12"/>`);
      for (let c = 0; c < cols; c++) {
        const cx = x + (c + .5) * w / cols, isDoor = fl === 0 && c === Math.floor(cols / 2);
        if (isDoor) {
          const dw = Math.min(70, w / cols * .62), dh = Math.min(fh * .78, 120), dy = fy - dh;
          out.push(`<path d="M${f(cx - dw / 2 - 8)} ${fy}V${f(dy + dw / 2)}A${f(dw / 2 + 8)} ${f(dw / 2 + 8)} 0 0 1 ${f(cx + dw / 2 + 8)} ${f(dy + dw / 2)}V${fy}Z" fill="${trim}"/>` +
            `<path d="M${f(cx - dw / 2)} ${fy}V${f(dy + dw / 2)}A${f(dw / 2)} ${f(dw / 2)} 0 0 1 ${f(cx + dw / 2)} ${f(dy + dw / 2)}V${fy}Z" fill="${door}"/>` +
            `<rect x="${f(cx - dw * .36)}" y="${f(dy + dw * .62)}" width="${f(dw * .3)}" height="${f(dh * .3)}" rx="3" fill="none" stroke="#000000" stroke-opacity=".25" stroke-width="2.5"/>` +
            `<rect x="${f(cx + dw * .06)}" y="${f(dy + dw * .62)}" width="${f(dw * .3)}" height="${f(dh * .3)}" rx="3" fill="none" stroke="#000000" stroke-opacity=".25" stroke-width="2.5"/>` +
            `<circle cx="${f(cx + dw * .3)}" cy="${f(fy - dh * .42)}" r="4" fill="#d9b25a"/><rect x="${f(cx - dw / 2 - 16)}" y="${f(fy - 3)}" width="${f(dw + 32)}" height="9" fill="#b7ab98"/>`);
          continue;
        }
        const wy = fy - fh * .5 - wh / 2 + (fl ? 0 : 6);
        if (shutter) out.push(`<rect x="${f(cx - ww / 2 - ww * .52)}" y="${f(wy)}" width="${f(ww * .48)}" height="${f(wh)}" fill="${shutter}"/><rect x="${f(cx + ww / 2 + ww * .04)}" y="${f(wy)}" width="${f(ww * .48)}" height="${f(wh)}" fill="${shutter}"/>` +
          [0, 1, 2, 3].map(i => `<path d="M${f(cx - ww / 2 - ww * .5)} ${f(wy + wh * (i + .6) / 4.4)}h${f(ww * .44)}M${f(cx + ww / 2 + ww * .06)} ${f(wy + wh * (i + .6) / 4.4)}h${f(ww * .44)}" stroke="#000000" stroke-opacity=".2" stroke-width="2"/>`).join(''));
        const lintelArch = rnd(seed + fl * 13 + c) > .5;
        out.push(`<rect x="${f(cx - ww / 2 - 7)}" y="${f(wy - 7)}" width="${f(ww + 14)}" height="${f(wh + 14)}" rx="${lintelArch ? f(ww / 2 + 7) : 3}" ry="${lintelArch ? 22 : 3}" fill="${trim}"/>` +
          `<rect x="${f(cx - ww / 2)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" rx="${lintelArch ? f(ww / 2) : 2}" ry="${lintelArch ? 16 : 2}" fill="${glass}"/>` +
          `<path d="M${f(cx - ww / 2 + 4)} ${f(wy + wh * .75)}L${f(cx + ww * .1)} ${f(wy + 6)}L${f(cx + ww * .3)} ${f(wy + 6)}L${f(cx - ww / 2 + 4)} ${f(wy + wh * .95)}Z" fill="#ffffff" opacity=".14"/>` +
          `<path d="M${f(cx)} ${f(wy + 2)}V${f(wy + wh)}M${f(cx - ww / 2)} ${f(wy + wh * .48)}H${f(cx + ww / 2)}" stroke="${trim}" stroke-width="5"/>` +
          `<rect x="${f(cx - ww / 2 - 12)}" y="${f(wy + wh + 4)}" width="${f(ww + 24)}" height="9" fill="${trim}"/><rect x="${f(cx - ww / 2 - 12)}" y="${f(wy + wh + 13)}" width="${f(ww + 24)}" height="4" fill="#000000" opacity=".15"/>`);
        if (fl && rnd(seed + 50 + fl * 7 + c) > .55) out.push(`<rect x="${f(cx - ww / 2 - 4)}" y="${f(wy + wh + 13)}" width="${f(ww + 8)}" height="16" fill="#7a4e2e"/>` +
          [0, 1, 2, 3].map(i => `<circle cx="${f(cx - ww / 2 + 4 + i * (ww / 3.4))}" cy="${f(wy + wh + 10)}" r="${f(8 + rnd(seed + i) * 3)}" fill="${['#d9534f', '#f0c24b', '#e87ca0', '#5c8a4f'][(i + c) % 4]}"/>`).join(''));
      }
    }
    return out.join('');
  };
  // A tree: tapering trunk with two branches and a canopy of overlapping leaf clusters (dark back clusters away from
  // the light, mid clusters, small highlight clusters toward the light) plus leaf flecks.
  const foliage = (cx, cy, r, {seed = 1, colors = ['#3f6b3c', '#5b8a4a', '#86ad5d'], trunk = '#6b4a33', lit = light(), height = r * 1.6} = {}) => {
    const [dx, dy] = lit.dir, base = cy + height;
    let s = cut(`M${f(cx - r * .09)} ${f(base)}C${f(cx - r * .06)} ${f(cy + height * .5)} ${f(cx - r * .02)} ${f(cy + r * .3)} ${f(cx - r * .3)} ${f(cy - r * .1)}L${f(cx - r * .22)} ${f(cy - r * .14)}C${f(cx)} ${f(cy + r * .1)} ${f(cx + r * .05)} ${f(cy)} ${f(cx + r * .3)} ${f(cy - r * .25)}L${f(cx + r * .36)} ${f(cy - r * .18)}C${f(cx + r * .1)} ${f(cy + r * .2)} ${f(cx + r * .08)} ${f(cy + height * .5)} ${f(cx + r * .1)} ${f(base)}Z`, {fill: trunk, depth: 5, lit, rim: .35});
    const cl = (k, n, rr, spread, col, rim) => Array.from({length: n}, (_, i) => {
      const a = rnd(seed + k * 50 + i) * Math.PI * 2, d = spread * Math.sqrt(rnd(seed + k * 70 + i));
      const x = cx + Math.cos(a) * d * r - dx * k * r * .1, y = cy - r * .25 + Math.sin(a) * d * r * .8 - dy * k * r * .1;
      return cut(blob(x, y, rr * r * (.8 + rnd(seed + k * 90 + i) * .4), rr * r * .85, 11, .16, seed + k * 13 + i), {fill: col, depth: 6, lit, rim});
    }).join('');
    s += cl(-1, 6, .42, .55, colors[0], .2) + cl(0, 6, .34, .5, colors[1], .35) + cl(1, 4, .2, .45, colors[2], .5);
    s += Array.from({length: 26}, (_, i) => { const a = rnd(seed + 300 + i) * 6.28, d = rnd(seed + 330 + i) * r * .85;
      return `<ellipse cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy - r * .25 + Math.sin(a) * d * .8)}" rx="7" ry="4" transform="rotate(${f(a * 57)} ${f(cx + Math.cos(a) * d)} ${f(cy - r * .25 + Math.sin(a) * d * .8)})" fill="${colors[2]}" opacity=".8"/>`; }).join('');
    return s;
  };
  // Water body: depth gradient, darker edge under the bank, staggered ripple highlights and a few glints.
  const water = (x, y, w, h, {id, color = '#5d8ea0', deep = '#2f5566', seed = 1, ripples = 18} = {}) => {
    if (!id) fail('water needs a unique id');
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})"/><rect x="${x}" y="${y}" width="${w}" height="10" fill="#000000" opacity=".18"/>` +
      Array.from({length: ripples}, (_, i) => { const rx = x + rnd(seed + i) * w, ry = y + 20 + rnd(seed + 40 + i) * (h - 30), l = 30 + rnd(seed + 80 + i) * 70;
        return `<path d="M${f(rx)} ${f(ry)}q${f(l / 4)} -5 ${f(l / 2)} 0t${f(l / 2)} 0" fill="none" stroke="#ffffff" stroke-opacity="${f(.18 + rnd(seed + 120 + i) * .25)}" stroke-width="3" stroke-linecap="round"/>`; }).join('');
  };
  // A posable cut-paper figure in a shared 300x640 viewBox (stand on y≈630, facing right in three-quarter view). Returns
  // the parts as markup plus transform origins (CSS, relative to the part box) for the engine's `origin` option, so the
  // topic can place body, head, near arm and eyelids as separate objects at the same position and width:
  //   body (legs, boots, torso, far arm), head (neck, face, ear, hair, optional cap), arm (near arm; pivot = shoulder),
  //   blink (closed eyelids, normally hidden; see motion.blink).
  const figure = ({skin = '#c98d63', hair = '#2f2621', shirt = '#f1ebe0', vest = '#3e5a7a', trousers = '#4a4038', boots = '#2a211c', cap = '#2f3f55', scarf = null, lit = light(), mouth = 'smile'} = {}) => {
    const C = (d, fill, o = {}) => cut(d, {fill, depth: 4, lit, rim: .4, ...o});
    const shade = c => mix(c, '#000000', .22);
    const body =
      // far arm (behind)
      C('M118 196C104 226 100 282 106 330C108 344 124 346 126 332C128 290 132 244 140 208Z', shade(shirt)) + C('M104 326C100 342 106 356 118 356C128 356 130 342 126 330Z', shade(skin)) +
      // legs and boots
      C('M120 352L112 600L146 602L156 400L168 600L202 598L192 352Z', trousers) + `<path d="M156 400L156 360" stroke="#000000" stroke-opacity=".25" stroke-width="3"/>` +
      C('M106 594C104 616 110 628 122 630L170 630C176 616 162 604 148 598Z', boots) + C('M164 592C162 614 168 628 180 630L226 630C232 614 218 600 202 594Z', boots) +
      // torso: shirt, vest with buttons, belt, collar, scarf
      C('M110 196C112 172 136 160 156 160C182 160 200 172 204 198L202 360L114 360Z', shirt) +
      C('M116 206C118 186 130 176 140 174L158 250L174 174C188 178 198 190 198 208L196 356L118 356Z', vest) +
      [0, 1, 2, 3].map(i => `<circle cx="${160 + i * 1.5}" cy="${264 + i * 22}" r="4.5" fill="#d9b25a"/>`).join('') +
      `<rect x="114" y="338" width="88" height="16" rx="3" fill="#2b211b"/><rect x="152" y="337" width="18" height="18" rx="3" fill="none" stroke="#d9b25a" stroke-width="3"/>` +
      C('M138 168L158 196L176 168C170 158 146 158 138 168Z', mix(shirt, '#ffffff', .3)) +
      (scarf ? C('M136 170C150 186 170 186 182 170L186 182C170 198 148 198 132 182Z', scarf) : '');
    const eyes = `<ellipse cx="170" cy="100" rx="9" ry="11" fill="#ffffff"/><circle cx="173" cy="101" r="6" fill="#2a2420"/><circle cx="175" cy="98" r="2" fill="#ffffff"/>` +
      `<ellipse cx="138" cy="100" rx="7" ry="10" fill="#ffffff"/><circle cx="141" cy="101" r="5" fill="#2a2420"/><circle cx="142.5" cy="98.5" r="1.6" fill="#ffffff"/>`;
    const mouths = {smile: 'M146 134C154 144 170 144 178 132', open: 'M148 132C154 148 172 148 178 130Z', flat: 'M150 136H176'};
    const head =
      C('M136 146L136 172L172 172L170 144Z', shade(skin)) +
      C('M104 98C104 62 128 40 156 40C186 40 206 62 206 96C206 108 212 116 214 124C214 130 206 132 204 136C200 156 182 168 158 168C126 168 104 140 104 98Z', skin, {rim: .5}) +
      C('M110 104C102 102 98 112 104 122C108 128 116 126 118 120Z', shade(skin)) +
      `<path d="M106 92C104 60 130 38 158 40C178 42 194 52 200 68C186 60 160 60 140 66C130 72 120 86 118 104C114 100 110 96 106 92Z" fill="${hair}"/>` +
      (cap ? C('M98 70C98 40 126 22 158 22C188 22 208 40 208 66L98 74Z', cap) + C('M190 62C214 60 236 64 244 72C232 78 212 78 196 74Z', shade(cap)) + `<rect x="100" y="66" width="108" height="8" rx="3" fill="${shade(cap)}"/>` : '') +
      eyes + `<path d="M160 84Q170 78 182 84M128 86Q138 80 148 86" stroke="${hair}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      `<path d="M188 104C196 114 198 122 190 124" stroke="${shade(skin)}" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="184" cy="124" rx="10" ry="6" fill="#e0776b" opacity=".35"/><ellipse cx="128" cy="122" rx="9" ry="6" fill="#e0776b" opacity=".3"/>` +
      `<path d="${mouths[mouth] ?? mouths.smile}" stroke="#6b2f2a" stroke-width="4" fill="${mouth === 'open' ? '#6b2f2a' : 'none'}" stroke-linecap="round"/>`;
    const blink = `<path d="M160 90C164 86 178 86 182 92L182 104C176 110 164 110 160 104Z" fill="${skin}"/><path d="M160 104C166 110 176 110 182 104" stroke="#2a2420" stroke-width="2.5" fill="none"/>` +
      `<path d="M130 92C134 88 144 88 146 94L146 104C142 110 132 110 130 104Z" fill="${skin}"/><path d="M130 104C134 109 142 109 146 104" stroke="#2a2420" stroke-width="2.5" fill="none"/>`;
    // near arm: upper arm from the shoulder (196,196), forearm bent forward, hand
    const arm = C('M188 186C204 182 218 194 216 214L210 290C208 302 192 302 192 290L190 222Z', shirt) +
      C('M194 284C200 272 214 272 220 282L252 318C258 328 248 338 240 332L200 302Z', shirt) +
      C('M240 316C252 308 268 314 270 328C272 340 260 348 248 344C242 342 236 334 238 326Z', skin) +
      `<path d="M200 214C204 240 204 262 202 286" stroke="#000000" stroke-opacity=".12" stroke-width="4" fill="none"/>`;
    return {body, head, arm, blink, origin: {arm: `${(198 / 300 * 100).toFixed(1)}% ${(196 / 640 * 100).toFixed(1)}%`, head: `${(156 / 300 * 100).toFixed(1)}% ${(168 / 640 * 100).toFixed(1)}%`}, viewBox: '0 0 300 640'};
  };

  // ---------- P023.1 craft: hand-cut paper (extracted from E21; reference study: layered cut-paper illustration) ----------
  // Observed in professional layered paper work: wide, low-opacity shadows that are darkest at the cut edge and fade
  // outward, all along one light; crisp but irregular hand-cut silhouettes; a lighter paper core visible on cut edges;
  // folded pieces with a lit and a shaded half; translucent vellum. All optional; the topic decides where they serve.
  const smoothClosed = pts => { const n = pts.length, md = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let d = `M${md(pts[n - 1], pts[0]).map(f).join(' ')}`;
    for (let i = 0; i < n; i++) d += ` Q${pts[i].map(f).join(' ')} ${md(pts[i], pts[(i + 1) % n]).map(f).join(' ')}`; return d + 'Z'; };
  // Hand-cut outline: a polygon densified every `step` units and nudged by up to ±amp/2 (seeded), then smoothed.
  const deckle = (pts, seed = 1, amp = 2.4, step = 16) => {
    const out = [];
    pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / step));
      for (let k = 0; k < n; k++) out.push([p[0] + (q[0] - p[0]) * k / n + (rnd(seed + out.length) - .5) * amp, p[1] + (q[1] - p[1]) * k / n + (rnd(seed + 99 + out.length) - .5) * amp]); });
    return smoothClosed(out);
  };
  // Soft paper shadow without a blur filter (no per-frame filter cost): three stacked silhouettes, each further along the
  // light and wider (round-joined stroke), at low opacity, so the shadow is darkest near the cut edge and fades outward.
  const penumbra = (d, {lit = light(), depth = 8, opacity = .16} = {}) => [[.7, 2, .5], [1.4, depth * .9, .32], [2.2, depth * 1.8, .18]].map(([k, w, o]) =>
    `<path d="${d}" fill="${lit.shade}" stroke="${lit.shade}" stroke-width="${f(w)}" stroke-linejoin="round" opacity="${f(opacity * o * 2)}" transform="translate(${f(lit.dir[0] * depth * k)} ${f(lit.dir[1] * depth * k)})"/>`).join('');
  // A paper piece: soft penumbra + cut (crisp contact shadow, lit rim, optional texture) + the lighter cut-edge core.
  // `soft: 'blur'` uses an SVG blur filter instead (pass `filter`, an existing filter id); prefer the default for animated pieces.
  const piece = (d, {fill, lit = light(), depth = 8, ambient = .16, rim = .45, texture = null, textureOpacity = .95, core = .5, soft = 'stack', filter = null} = {}) =>
    (soft === 'blur' && filter ? `<path d="${d}" fill="${lit.shade}" opacity="${ambient}" filter="url(#${filter})" transform="translate(${f(lit.dir[0] * depth * 2.2)} ${f(lit.dir[1] * depth * 2.2)})"/>`
      : soft ? penumbra(d, {lit, depth, opacity: ambient}) : '') +
    cut(d, {fill, lit, depth: depth * .5, rim, shadowOpacity: .34, texture, textureOpacity}) +
    (core ? `<path d="${d}" fill="none" stroke="${mix(fill, '#ffffff', core)}" stroke-width="1.6" opacity=".75"/>` : '');
  // Folded piece (petal, leaf, wing, paper fold): crease from base b to tip t, half-width wd; the half facing away from the
  // light is shaded, the crease catches a highlight.
  const folded = (b, t, wd, {fill, lit = light(), depth = 6, seed = 1, texture = null} = {}) => {
    const [bx, by] = b, [tx, ty] = t, dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const side = sgn => [b, ...[.25, .5, .75].map(k => [bx + dx * k + nx * sgn * wd * Math.sin(Math.PI * (k * .9 + .05)), by + dy * k + ny * sgn * wd * Math.sin(Math.PI * (k * .9 + .05))]), t];
    const away = nx * lit.dir[0] + ny * lit.dir[1] < 0 ? -1 : 1;
    return piece(deckle([...side(1), ...side(-1).slice(1, -1).reverse()], seed, 2), {fill, lit, depth, texture}) +
      `<path d="${deckle(side(away), seed + 7, 1.4)}" fill="${mix(fill, lit.shade, .22)}" opacity=".85"/>` +
      `<path d="M${f(bx)} ${f(by)}L${f(tx)} ${f(ty)}" stroke="${mix(fill, '#ffffff', .45)}" stroke-width="2" opacity=".7"/>`;
  };
  // Vellum (tracing paper): translucent sheet with optional vein or fold lines and a bright cut edge.
  const vellum = (d, {lines = '', texture = null, opacity = .62} = {}) => `<path d="${d}" fill="#2a1d10" opacity=".08" transform="translate(6 10)"/>` +
    `<path d="${d}" fill="#f4f8f6" opacity="${opacity}"/>` + (texture ? `<path d="${d}" fill="url(#${texture})" opacity=".7"/>` : '') +
    (lines ? `<path d="${lines}" stroke="#8b8a80" stroke-width="1.6" fill="none" opacity=".7"/>` : '') + `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="2" opacity=".8"/>`;
  // Nested layers receding to a lit core (tunnel / burrow / cell / portal framing): n deckled rings from the frame edge
  // toward (cx, cy), darkest outside and brightest at the core, each with a soft penumbra. A strong focal device; use it
  // when the story pulls the eye into one place.
  const recede = (w, h, cx, cy, {colors, seed = 1, lit = light(), depth = 10, amp = 10, n = colors?.length ?? 5} = {}) => {
    if (!Array.isArray(colors) || colors.length < 2) fail('recede needs colors (outer to core)');
    let s = `<rect width="${f(w)}" height="${f(h)}" fill="${colors[0]}"/>`;
    for (let i = 1; i < colors.length; i++) {
      const k = 1 - i / (colors.length + .4), rx = Math.max(cx, w - cx) * k * 1.15, ry = Math.max(cy, h - cy) * k * 1.1;
      const pts = Array.from({length: 24}, (_, j) => { const a = j / 24 * Math.PI * 2, wob = 1 + (rnd(seed + i * 31 + j) - .5) * .16; return [cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob]; });
      s += piece(deckle(pts, seed + i * 7, amp, 30), {fill: colors[i], lit, depth, rim: .3, core: .3});
    }
    return s;
  };


  // 2D forward kinematics in SVG units (+y down; positive rotation clockwise).
  // A node's pivot maps to its offset in the parent's local coordinate system.
  const rig2D = specs => {
    if (!Array.isArray(specs) || !specs.length || specs.length>128) fail('rig2D needs 1..128 nodes');
    const validId = id => typeof id==='string' && /^[a-z][a-z0-9-]*$/.test(id);
    const pair = (v,name) => {
      if (!Array.isArray(v)||v.length!==2) fail(name+' needs [x,y]');
      return [num(v[0],name),num(v[1],name)];
    };
    const nodes = new Map();
    for (const spec of specs) {
      if (!validId(spec?.id)||nodes.has(spec.id)) fail('rig2D requires unique node IDs');
      const {id,parent=null,offset=[0,0],pivot=[0,0],anchors={}}=spec;
      if (parent!==null&&!validId(parent)) fail('rig2D invalid parent');
      if (!anchors || typeof anchors!=='object'||Array.isArray(anchors)) fail('rig2D invalid anchors');
      const named=new Map();
      for (const [name,point] of Object.entries(anchors)) {
        if (!validId(name)) fail('rig2D invalid anchor name');
        named.set(name,pair(point,'anchor'));
      }
      nodes.set(id,{parent,offset:pair(offset,'offset'),pivot:pair(pivot,'pivot'),anchors:named});
    }
    const order=[], visiting=new Set(), done=new Set();
    const visit=id=>{
      if (done.has(id)) return;
      if (visiting.has(id)) fail('rig2D cyclic hierarchy');
      const node=nodes.get(id);
      if (!node) fail('rig2D unknown parent '+id);
      visiting.add(id);
      if (node.parent!==null) visit(node.parent);
      visiting.delete(id);done.add(id);order.push(id);
    };
    for (const id of nodes.keys()) visit(id);
    // pose maps node IDs to local overrides {offset, angle (degrees), scale (>0)}.
    // No previous-frame state is retained.
    const evaluate=(pose={})=>{
      if (!pose||typeof pose!=='object'||Array.isArray(pose)) fail('rig2D invalid pose');
      for(const id of Object.keys(pose)) if(!nodes.has(id)) fail('rig2D unknown pose node '+id);
      const matrices=new Map();
      const mul=(p,m)=>[
        p[0]*m[0]+p[2]*m[1],p[1]*m[0]+p[3]*m[1],
        p[0]*m[2]+p[2]*m[3],p[1]*m[2]+p[3]*m[3],
        p[0]*m[4]+p[2]*m[5]+p[4],p[1]*m[4]+p[3]*m[5]+p[5]];
      for(const id of order){
        const n=nodes.get(id), q=Object.hasOwn(pose,id)?pose[id]:{};
        if(!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).some(k=>!['offset','angle','scale'].includes(k))) fail('rig2D invalid node pose');
        const [x,y]=q.offset===undefined?n.offset:pair(q.offset,'pose offset');
        const angle=num(q.angle===undefined?0:q.angle,'angle')%360*Math.PI/180;
        const scale=num(q.scale===undefined?1:q.scale,'scale');
        if(scale<=0) fail('rig2D scale must be positive');
        const c=Math.cos(angle)*scale,s=Math.sin(angle)*scale,[px,py]=n.pivot;
        const local=[c,s,-s,c,x-c*px+s*py,y-s*px-c*py];
        const m=n.parent===null?local:mul(matrices.get(n.parent),local);
        m.forEach(v=>num(v,'rig matrix'));matrices.set(id,m);
      }
      const matrix=id=>{
        if(!matrices.has(id)) fail('rig2D unknown node '+id);
        return matrices.get(id).slice();
      };
      const point=(id,p)=>{
        const [x,y]=pair(p,'point'),[a,b,c,d,e,f]=matrix(id);
        return [num(a*x+c*y+e,'point x'),num(b*x+d*y+f,'point y')];
      };
      const anchor=(id,name)=>{
        if(!nodes.get(id)?.anchors.has(name)) fail('rig2D unknown anchor '+name);
        return point(id,nodes.get(id).anchors.get(name));
      };
      const group=(id,markup)=>{
        if(typeof markup!=='string') fail('rig2D group needs markup');
        return '<g transform="matrix('+matrix(id).join(' ')+')">'+markup+'</g>';
      };
      return {matrix,point,anchor,group};
    };
    return {evaluate};
  };



  // Analytic two-bone IK; neutral bones point along local +y, angles are clockwise degrees.
  // The target is relative to the first joint in its parent's coordinate axes.
  const twoBoneIK = ({target,lengths,bend=1}={}) => {
    const pair=(v,name)=>{
      if(!Array.isArray(v)||v.length!==2) fail('twoBoneIK '+name+' needs two numbers');
      return v.map(x=>num(x,'twoBoneIK '+name));
    };
    const [x,y]=pair(target,'target'),[a,b]=pair(lengths,'lengths');
    if(a<=0||b<=0) fail('twoBoneIK lengths must be positive');
    if(bend!==1&&bend!==-1) fail('twoBoneIK bend must be +1 or -1');
    const outer=num(a+b,'twoBoneIK reach'),inner=Math.abs(a-b);
    const distance=num(Math.hypot(x,y),'twoBoneIK distance');
    const reach=Math.max(inner,Math.min(outer,distance));
    const direction=distance===0?0:Math.atan2(-x,y);
    // Normalize the triangle to avoid squaring large dimensional quantities.
    const A=a/outer,B=b/outer,R=reach/outer;
    if(A===0||B===0) fail('twoBoneIK degenerate length ratio');
    const clamp=v=>Math.max(-1,Math.min(1,v));
    let relative,first;
    if(reach===0){relative=bend*Math.PI;first=direction;}
    else if(reach===outer){relative=0;first=direction;}
    else if(reach===inner){relative=bend*Math.PI;first=direction-(a<b?bend*Math.PI:0);}
    else{
      relative=bend*Math.acos(clamp((R*R-A*A-B*B)/(2*A*B)));
      first=direction-Math.atan2(B*Math.sin(relative),A+B*Math.cos(relative));
    }
    const endpoint=[num(-a*Math.sin(first)-b*Math.sin(first+relative),'IK endpoint'),num(a*Math.cos(first)+b*Math.cos(first+relative),'IK endpoint')];
    return {angles:[first*180/Math.PI,relative*180/Math.PI],endpoint,
      reachable:distance>=inner&&distance<=outer,error:num(Math.hypot(x-endpoint[0],y-endpoint[1]),'IK error')};
  };

  // Reusable front-view articulated anatomy in SVG coordinates, pelvis origin.
  // Artwork is supplied independently by the topic; the skeleton does not prescribe a style.
  const characterRig = ({height=640, proportions={}}={}) => {
    num(height,'character height');
    if(height<=0) fail('character height must be positive');
    if(!proportions||typeof proportions!=='object'||Array.isArray(proportions)) fail('character proportions must be an object');
    const defaults={torso:.29,neck:.035,head:.14,shoulder:.13,hip:.075,upperArm:.155,forearm:.14,hand:.065,thigh:.22,shin:.22,foot:.09,ankle:.045};
    for(const name of Object.keys(proportions)) if(!Object.hasOwn(defaults,name)) fail('unknown character proportion '+name);
    const d=Object.fromEntries(Object.entries({...defaults,...proportions}).map(([name,v])=>{
      num(v,'character proportion '+name);
      if(v<=0||v>1) fail('character proportion outside (0,1]');
      return [name,num(v*height,'character dimension')];
    }));
    // Neutral legs extend down; torso extends upward. Anatomical left appears screen-right.
    const specs=[
      {id:'pelvis',anchors:{centre:[0,0]}},
      {id:'torso',parent:'pelvis',anchors:{neck:[0,-d.torso],chest:[0,-d.torso*.7]}},
      {id:'neck',parent:'torso',offset:[0,-d.torso]},
      {id:'head',parent:'neck',offset:[0,-d.neck],anchors:{crown:[0,-d.head],eyes:[0,-d.head*.55]}}
    ];
    for(const [side,sign] of [['left',1],['right',-1]]){
      const id=n=>side+'-'+n;
      specs.push(
        {id:id('upper-arm'),parent:'torso',offset:[sign*d.shoulder,-d.torso*.86],anchors:{elbow:[0,d.upperArm]}},
        {id:id('forearm'),parent:id('upper-arm'),offset:[0,d.upperArm],anchors:{wrist:[0,d.forearm]}},
        {id:id('hand'),parent:id('forearm'),offset:[0,d.forearm],anchors:{grip:[0,d.hand*.5],tip:[0,d.hand]}},
        {id:id('thigh'),parent:'pelvis',offset:[sign*d.hip,0],anchors:{knee:[0,d.thigh]}},
        {id:id('shin'),parent:id('thigh'),offset:[0,d.thigh],anchors:{ankle:[0,d.shin]}},
        {id:id('foot'),parent:id('shin'),offset:[0,d.shin],anchors:{sole:[0,d.ankle],toe:[sign*d.foot,d.ankle]}}
      );
    }
    const rig=rig2D(specs);
    const ids=specs.map(s=>s.id);
    // Pose overrides are restricted to rotations and pelvis translation/scale:
    // limb lengths and joints cannot accidentally be changed mid-performance.
    const evaluate=(pose={})=>{
      if(!pose||typeof pose!=='object'||Array.isArray(pose)) fail('character pose must be an object');
      for(const [id,q] of Object.entries(pose)){
        if(!ids.includes(id)) fail('unknown character joint '+id);
        if(!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).some(k=>!(id==='pelvis'?['angle','offset','scale']:['angle']).includes(k)))
          fail('character pose only permits joint angles and pelvis placement');
      }
      return rig.evaluate(pose);
    };
    // Absolute groups, deliberately no automatic facing/depth decisions.
    const draw=(pose,parts,order=ids)=>{
      if(!parts||typeof parts!=='object'||Array.isArray(parts)) fail('character parts must be an object');
      for(const [id,markup] of Object.entries(parts)) if(!ids.includes(id)||typeof markup!=='string') fail('invalid character artwork part '+id);
      if(!Array.isArray(order)||new Set(order).size!==order.length||order.some(id=>!ids.includes(id))) fail('invalid character draw order');
      if(Object.keys(parts).some(id=>!order.includes(id))) fail('character draw order omits artwork');
      const p=evaluate(pose);
      return order.filter(id=>Object.hasOwn(parts,id)).map(id=>p.group(id,parts[id])).join('');
    };
    // Solve a wrist or ankle in stage coordinates; preserve all other pose overrides.
    const solve=(pose,{side,limb,target,bend=1}={})=>{
      if(!['left','right'].includes(side)||!['arm','leg'].includes(limb)) fail('character IK invalid side or limb');
      if(!Array.isArray(target)||target.length!==2) fail('character IK target needs [x,y]');
      const [x,y]=target.map(v=>num(v,'character IK target'));
      const upper=side+(limb==='arm'?'-upper-arm':'-thigh');
      const lower=side+(limb==='arm'?'-forearm':'-shin');
      const parent=limb==='arm'?'torso':'pelvis';
      const lengths=limb==='arm'?[d.upperArm,d.forearm]:[d.thigh,d.shin];
      const p=evaluate(pose),origin=p.point(upper,[0,0]),[a,b]=p.matrix(parent);
      const scale=num(Math.hypot(a,b),'character IK parent scale');
      if(scale<=0) fail('character IK degenerate parent scale');
      const dx=num((x-origin[0])/scale,'character IK delta'),dy=num((y-origin[1])/scale,'character IK delta');
      const c=a/scale,s=b/scale;
      const local=twoBoneIK({target:[c*dx+s*dy,-s*dx+c*dy],lengths,bend});
      const next={...pose,[upper]:{angle:local.angles[0]},[lower]:{angle:local.angles[1]}};
      const endpoint=evaluate(next).anchor(lower,limb==='arm'?'wrist':'ankle');
      return {pose:next,endpoint,reachable:local.reachable,error:num(Math.hypot(x-endpoint[0],y-endpoint[1]),'character IK error')};
    };
    // Oriented grip/sole contact in stage space, blended from an authored free pose.
    const contact=(pose,{side,limb,target,angle,bend=1,weight=1}={})=>{
      if(!['left','right'].includes(side)||!['arm','leg'].includes(limb)) fail('character contact invalid side or limb');
      if(!Array.isArray(target)||target.length!==2) fail('character contact target needs [x,y]');
      const [x,y]=target.map(v=>num(v,'contact target'));
      num(angle,'contact angle');num(weight,'contact weight');
      if(weight<0||weight>1) fail('contact weight must be in [0,1]');
      const id=side+(limb==='arm'?'-hand':'-foot');
      const anchor=limb==='arm'?'grip':'sole';
      const lower=side+(limb==='arm'?'-forearm':'-shin');
      const p=evaluate(pose),start=p.anchor(id,anchor),[a,b]=p.matrix(id);
      const scale=num(Math.hypot(a,b),'contact scale');
      if(scale<=0) fail('contact degenerate scale');
      const initial=Math.atan2(b,a)*180/Math.PI;
      const wrap=v=>((v%360+540)%360)-180;
      const desired=initial+wrap(angle%360-initial)*weight;
      const blended=[start[0]*(1-weight)+x*weight,start[1]*(1-weight)+y*weight];
      const offset=(limb==='arm'?d.hand*.5:d.ankle)*scale;
      const rad=desired*Math.PI/180;
      const wrist=[blended[0]+Math.sin(rad)*offset,blended[1]-Math.cos(rad)*offset];
      // Zero weight must preserve the free pose, even if its elbow bends differently.
      let next=pose,reachable=true;
      if(weight!==0){
        const s=solve(pose,{side,limb,target:wrist,bend});
        next=s.pose;reachable=s.reachable;
        const [c,e]=evaluate(next).matrix(lower);
        next={...next,[id]:{angle:wrap(desired-Math.atan2(e,c)*180/Math.PI)}};
      }else if(bend!==1&&bend!==-1) fail('twoBoneIK bend must be +1 or -1');
      const result=evaluate(next),endpoint=result.anchor(id,anchor),[c,e]=result.matrix(id);
      return {pose:next,endpoint,reachable,error:num(Math.hypot(endpoint[0]-blended[0],endpoint[1]-blended[1]),'contact error'),
        targetError:num(Math.hypot(endpoint[0]-x,endpoint[1]-y),'contact target error'),
        angleError:Math.abs(wrap(Math.atan2(e,c)*180/Math.PI-desired))};
    };
    // Attach local artwork to an oriented hand or sole anchor. Local contact point
    // maps to that anchor; inherit the actor's uniform scale and terminal rotation.
    const attachment=(pose,{side,limb='arm',point=[0,0],angle=0}={})=>{
      if(!['left','right'].includes(side)||!['arm','leg'].includes(limb)) fail('character attachment invalid side or limb');
      if(!Array.isArray(point)||point.length!==2) fail('attachment point needs [x,y]');
      const [px,py]=point.map(v=>num(v,'attachment point'));
      num(angle,'attachment angle');
      const id=side+(limb==='arm'?'-hand':'-foot'),p=evaluate(pose);
      const [a,b]=p.matrix(id),[x,y]=p.anchor(id,limb==='arm'?'grip':'sole');
      const rad=(angle%360)*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);
      const A=a*c-b*s,B=b*c+a*s;
      const matrix=[A,B,-B,A,x-A*px+B*py,y-B*px-A*py];
      matrix.forEach(v=>num(v,'attachment matrix'));
      return {matrix,group:markup=>{
        if(typeof markup!=='string') fail('attachment group needs markup');
        return '<g transform="matrix('+matrix.join(' ')+')">'+markup+'</g>';
      }};
    };
    return {dimensions:{...d},joints:ids.slice(),evaluate,draw,solve,contact,attachment};
  };


  // Steady level-ground planar gait. A stride is one complete cycle of either foot.
  // World/stage coordinates, not screen-relative offsets: stance targets stay fixed.
  const walkCycle = (actor,{origin=[0,0],stride,period=1.2,stance=.62,lift,bob,armSwing=18,direction=1,scale=1,heightRatio,stop}={})=>{
    if(!actor||typeof actor.solve!=='function'||typeof actor.evaluate!=='function'||!actor.dimensions) fail('walkCycle needs a character rig');
    if(!Array.isArray(origin)||origin.length!==2) fail('walkCycle origin needs [x,groundY]');
    const [x0,ground]=origin.map(v=>num(v,'walkCycle origin'));
    const {thigh,shin,ankle,hip}=actor.dimensions;
    const leg=num((thigh+shin)*scale,'walkCycle leg length');
    const footHeight=num(ankle*scale,'walkCycle ankle height');
    stride=stride===undefined?leg*.55:stride;
    lift=lift===undefined?leg*.10:lift;
    bob=bob===undefined?leg*.025:bob;
    [stride,period,stance,lift,bob,armSwing,scale].forEach(v=>num(v,'walkCycle parameter'));
    if(scale<=0||leg<=0||footHeight<=0||stride<=0||period<=0||stance<=.5||stance>=1||lift<0||bob<0||armSwing<0||armSwing>90||![1,-1].includes(direction)) fail('walkCycle invalid gait parameters');
    const speed=num(stride/period,'walkCycle speed');
    // Conservative reach envelope: both legs remain within their annulus.
    const adaptive=heightRatio!==undefined;
    if(adaptive){num(heightRatio,'walkCycle height ratio');if(heightRatio<=0||heightRatio>=1) fail('walkCycle invalid height ratio');}
    const height=leg*(heightRatio??.88);
    const maxHorizontal=stride*Math.max(stance/2,1-stance/2);
    const limit=leg*.995, softness=leg*.005, inner=Math.abs(thigh-shin)*scale;
    if((adaptive?(maxHorizontal>=limit||Math.sqrt(Math.max(0,limit*limit-maxHorizontal*maxHorizontal))-lift-softness<=inner):Math.hypot(maxHorizontal,height+bob)>leg)||height-bob-lift<=inner)
      fail('walkCycle stride/lift/bob exceeds conservative leg reach');
    const smooth=u=>u*u*(3-2*u);
    let braking=null;
    if(stop!==undefined){
      if(!stop||typeof stop!=='object'||Array.isArray(stop)) fail('walkCycle invalid stop');
      const {at:finish,duration=.6,settle=.4}=stop;
      [finish,duration,settle].forEach(v=>num(v,'walkCycle stop'));
      const begin=finish-duration/2,end=finish+duration/2;
      const phase=finish/period-Math.floor(finish/period);
      if(duration<=0||settle<=0||begin<0||!Number.isFinite(end+settle)||!(phase<stance&&(phase+.5)%1<stance))
        fail('walkCycle stop needs double support and positive transition durations');
      braking={finish,duration,settle,begin,end};
    }
    const smoothMax=(a,b)=>a+(b-a+Math.hypot(a-b,softness))/2;
    const at=t=>{
      num(t,'walkCycle time');
      let time=t,rate=1,rest=0;
      if(braking&&t>=braking.begin){
        const {begin,end,duration,finish,settle}=braking;
        const u=Math.min(1,(t-begin)/duration);
        time=t>=end?finish:begin+duration*(u-u*u/2);
        rate=1-u;rest=smooth(Math.max(0,Math.min(1,(t-end)/settle)));
      }
      const cycle=num(time/period,'walkCycle phase');
      const phase=cycle-Math.floor(cycle);
      const x=num(x0+direction*speed*time,'walkCycle root x');
      const feet={},targets=[];
      let y=ground-footHeight-(height+bob*Math.cos(4*Math.PI*phase))*(adaptive?1-rest:1)-leg*.98*(adaptive?rest:0);
      if(!adaptive&&rest>0) y=ground-footHeight-leg*.98;
      for(const [side,offset,sign] of [['left',0,1],['right',.5,-1]]){
        const q=cycle+offset,k=Math.floor(q),u=q-k;
        const planted=u<stance;
        const v=planted?0:(u-stance)/(1-stance);
        const px=x0+direction*stride*(k-offset+stance/2+smooth(v))+sign*hip*scale;
        const py=ground-footHeight-lift*Math.sin(Math.PI*v)**2;
        targets.push({side,planted,px,py,u,sign});
        if(adaptive||rest>0){
          const dx=px-x-sign*hip*scale;
          y=smoothMax(y,py-Math.sqrt(Math.max(0,limit*limit-dx*dx)));
        }
      }
      // Keep legacy steady gait unchanged; stopping without adaptive height
      // blends toward the same reach-aware standing height.
      if(!adaptive&&rest>0){
        const base=ground-footHeight-height-bob*Math.cos(4*Math.PI*phase);
        y=base*(1-rest)+y*rest;
      }
      let pose={pelvis:{offset:[x,y],scale},torso:{angle:direction*-4*(1-rest)}};
      for(const {side,planted,px,py,u} of targets){
        const solved=actor.solve(pose,{side,limb:'leg',target:[px,py],bend:direction});
        if((adaptive||braking)&&!solved.reachable) fail('walkCycle unreachable pose');
        pose=solved.pose;
        // Counter-rotate the foot to keep its sole horizontal in stage coordinates.
        pose[side+'-foot']={angle:-pose[side+'-thigh'].angle-pose[side+'-shin'].angle};
        const swing=direction*armSwing*Math.cos(2*Math.PI*u);
        pose[side+'-upper-arm']={angle:swing*(1-rest)};
        pose[side+'-forearm']={angle:-direction*12*(1-rest)};
        feet[side]={planted,target:[px,py],reachable:solved.reachable,error:solved.error};
      }
      const p=actor.evaluate(pose);
      for(const side of ['left','right']) feet[side].sole=p.anchor(side+'-foot','sole');
      return {pose,feet,phase,speed:speed*rate,root:[x,y]};
    };
    return {at,speed,stride,period};
  };


  // Artwork-independent performance curves. Each channel has independent absolute-time keys.
  const characterPerformance = ({tracks={},blinks=[],gestures={}}={})=>{
    const ranges={gazeX:[-1,1],gazeY:[-1,1],lidLeft:[0,1],lidRight:[0,1],browLeft:[-1,1],browRight:[-1,1],smile:[-1,1],mouthOpen:[0,1],mouthRound:[0,1]};
    const object=(v,name)=>{
      if(!v||typeof v!=='object'||Array.isArray(v)) fail('performance '+name+' must be an object');
    };
    object(tracks,'tracks');object(gestures,'gestures');
    const curve=(keys,lo,hi,name)=>{
      if(!Array.isArray(keys)||!keys.length||keys.length>1024) fail('performance '+name+' needs 1..1024 keys');
      const frames=keys.map((k,i)=>{
        if(!Array.isArray(k)||k.length<2||k.length>3) fail('performance invalid key '+name);
        const [t,v,ease='smooth']=k;
        num(t,'performance time');num(v,'performance value');
        if(t<0||(i&&t<=keys[i-1][0])||v<lo||v>hi||!['linear','smooth'].includes(ease)) fail('performance invalid key '+name);
        return [t,v,ease];
      });
      return t=>{
        if(t<=frames[0][0]) return frames[0][1];
        if(t>=frames.at(-1)[0]) return frames.at(-1)[1];
        const i=frames.findIndex(k=>k[0]>=t),a=frames[i-1],b=frames[i];
        let u=(t-a[0])/(b[0]-a[0]);
        if(b[2]==='smooth') u=u*u*(3-2*u);
        return a[1]*(1-u)+b[1]*u;
      };
    };
    for(const name of Object.keys(tracks)) if(!Object.hasOwn(ranges,name)) fail('performance unknown channel '+name);
    const facial=Object.entries(tracks).map(([name,keys])=>[name,curve(keys,...ranges[name],name)]);
    const allowed=['torso','neck','head',...['left','right'].flatMap(side=>['upper-arm','forearm','hand'].map(part=>side+'-'+part))];
    const joints=Object.entries(gestures).map(([id,keys])=>{
      if(!allowed.includes(id)) fail('performance invalid gesture joint '+id);
      return [id,curve(keys,-360,360,id)];
    });
    if(!Array.isArray(blinks)||blinks.length>1024) fail('performance invalid blinks');
    const events=blinks.map(e=>{
      if(!e||typeof e!=='object'||Array.isArray(e)) fail('performance invalid blink');
      const {t,close=.06,hold=.02,open=.10,side='both'}=e;
      [t,close,hold,open].forEach(v=>num(v,'performance blink'));
      const end=num(t+close+hold+open,'performance blink end');
      if(t<0||close<=0||hold<0||open<=0||!['left','right','both'].includes(side)||end<=t) fail('performance invalid blink');
      return {t,close,hold,open,side,end};
    });
    const smooth=u=>u*u*(3-2*u);
    const at=(t,base={})=>{
      num(t,'performance time');object(base,'base pose');
      const face=Object.fromEntries(Object.keys(ranges).map(name=>[name,0]));
      for(const [name,fn] of facial) face[name]=fn(t);
      for(const e of events){
        if(t<e.t||t>=e.end) continue;
        const u=t-e.t;
        const v=u<e.close?smooth(u/e.close):u<e.close+e.hold?1:smooth(Math.max(0,1-(u-e.close-e.hold)/e.open));
        if(e.side!=='right') face.lidLeft=Math.max(face.lidLeft,v);
        if(e.side!=='left') face.lidRight=Math.max(face.lidRight,v);
      }
      const pose={...base};
      for(const [id,fn] of joints) pose[id]={...base[id],angle:num((base[id]?.angle??0)+fn(t),'performance gesture angle')};
      return {face,pose};
    };
    return {at};
  };


  // A source-only identity definition. Registry versions pin the authored factory,
  // not a generated image. All appearances share the same rig and identity palette.
  const characterIdentity = ({id,height=640,proportions={},palette,features=[],appearances}={})=>{
    const valid=name=>typeof name==='string'&&/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(name)&&name.length<=80;
    const object=(v,name)=>{
      if(!v||typeof v!=='object'||Array.isArray(v)) fail('character identity invalid '+name);
    };
    if(!valid(id)) fail('character identity invalid id');
    object(palette,'palette');object(appearances,'appearances');
    if(!Object.keys(palette).length||Object.keys(palette).length>32) fail('character identity palette size');
    for(const [key,value] of Object.entries(palette)){
      if(!valid(key)||typeof value!=='string'||!/^#[0-9a-fA-F]{6}$/.test(value)) fail('character identity invalid palette color');
    }
    if(!Array.isArray(features)||features.length>32||features.some(v=>typeof v!=='string'||!v.trim()||v.length>200)) fail('character identity invalid features');
    const actor=characterRig({height,proportions});
    const colors=Object.freeze({...palette}),details=Object.freeze(features.slice()),dimensions=Object.freeze({...actor.dimensions});
    const names=Object.keys(appearances);
    if(!names.length||names.length>32||!names.includes('default')) fail('character identity needs default appearance');
    const views=new Map();
    for(const [name,spec] of Object.entries(appearances)){
      if(!valid(name)) fail('character identity invalid appearance name');
      object(spec,'appearance');
      const {build,order=actor.joints}=spec;
      if(typeof build!=='function') fail('character identity appearance needs build function');
      if(!Array.isArray(order)||new Set(order).size!==order.length||order.some(id=>!actor.joints.includes(id))) fail('character identity invalid order');
      views.set(name,{build,order:order.slice()});
    }
    const context=Object.freeze({id,palette:colors,features:details,dimensions});
    const draw=(pose,{appearance='default',face={}}={})=>{
      if(!views.has(appearance)) fail('character identity unknown appearance');
      object(face,'face');
      const {build,order}=views.get(appearance);
      // The authored builder must be pure; fixed geometry can be cached in its closure.
      const parts=build(context,Object.freeze({...face}));
      return actor.draw(pose,parts,order);
    };
    return {id,actor,palette:colors,features:details,appearances:names.slice(),draw};
  };


  // A single tapered silhouette around a three-point articulated centreline.
  // Rounded elbow/knee joins are geometry, not separately outlined joint pieces.
  const limbContour = (points,{widths,fill=INK,stroke=INK,strokeWidth=3}={})=>{
    if(!Array.isArray(points)||points.length!==3||!Array.isArray(widths)||widths.length!==3) fail('limbContour needs three points and widths');
    const [a,b,c]=points.map(p=>{
      if(!Array.isArray(p)||p.length!==2) fail('limbContour invalid point');
      return p.map(v=>num(v,'limbContour coordinate'));
    });
    const [ra,rb,rc]=widths.map(w=>{num(w,'limbContour width');if(w<=0) fail('limbContour width must be positive');return w/2;});
    num(strokeWidth,'limbContour stroke width');
    if(strokeWidth<0||![fill,stroke].every(v=>typeof v==='string'&&/^(?:#[0-9a-fA-F]{6}|none)$/.test(v))) fail('limbContour invalid paint');
    const unit=(p,q)=>{
      const dx=q[0]-p[0],dy=q[1]-p[1],l=num(Math.hypot(dx,dy),'limbContour length');
      if(l<=0) fail('limbContour coincident joints');
      return [dx/l,dy/l];
    };
    const u=unit(a,b),v=unit(b,c),n=[-u[1],u[0]],m=[-v[1],v[0]];
    const dot=u[0]*v[0]+u[1]*v[1],cross=u[0]*v[1]-u[1]*v[0];
    // Extremely folded bones overlap in projection; one outline cannot
    // reliably represent their occlusion. Require separate authored parts.
    if(dot<-.95) fail('limbContour extreme fold needs authored occlusion');
    const offset=(p,k,r,s)=>[p[0]+k[0]*r*s,p[1]+k[1]*r*s];
    const fmt=p=>p.map(x=>f(num(x,'limbContour path'))).join(' ');
    const side=s=>{
      const start=offset(a,n,ra,s),end=offset(c,m,rc,s);
      const p=offset(b,n,rb,s),q=offset(b,m,rb,s);
      // Inside corner uses the intersection of the offset lines; cap the
      // miter to avoid spikes at deep bends. Outside corner is quadratic.
      const k=[n[0]+m[0],n[1]+m[1]],factor=Math.min(2,1/(1+dot));
      const join=offset(b,k,rb*factor,s);
      const outer=cross*s<0;
      return {start,end,p,q,join,outer};
    };
    const l=side(1),r=side(-1);
    const path='M'+fmt(l.start)+(l.outer?'L'+fmt(l.p)+'Q'+fmt(l.join)+' '+fmt(l.q):'L'+fmt(l.join))+
      'L'+fmt(l.end)+'L'+fmt(r.end)+(r.outer?'L'+fmt(r.q)+'Q'+fmt(r.join)+' '+fmt(r.p):'L'+fmt(r.join))+'L'+fmt(r.start)+'Z';
    return '<path d="'+path+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+strokeWidth+'" stroke-linejoin="round"/>';
  };

  // ---------- label treatments (object option labelStyle; CSS below, include kit.css in topic.css) ----------
  const LABEL_STYLES = ['tag', 'accent', 'plain', 'chip'];
  const css = `
    .label-accent .piece-label { border-left:10px solid var(--label-accent, #BF5942) }
    .label-plain .piece-label { background:transparent; box-shadow:none; padding:0 6px; font-weight:800 }
    .label-chip .piece-label { background:${INK}; color:${PAPER}; font-size:28px; padding:2px 14px; box-shadow:none }`;

  // ---------- motion helpers (bound to ctx; `at` is seconds or a resolved-plan cue id) ----------
  function motion(ctx) {
    const {key, N, track, show, showHide, reveal} = ctx.motion;
    // A cue id (string) is looked up in the resolved plan, registering its visibility check on the object it animates.
    const when = (at, id) => typeof at === 'string' ? ctx.motion.speechCue(at, id) : num(at, 'time');
    return {
      when,
      // Slide-and-settle entrance with an eased landing (P013 `land`); `from` is the starting [x,y,rot,scale,opacity].
      settle: (id, at, from = [0, .03, -4, .92, 0], dur = .45, rest = N) => { const t = when(at, id); track(id, [key(t, from), key(t + dur, rest, 'out')]); return t; },
      // Paper tag that rises into place and optionally leaves (P013 `lab`).
      label: (id, at, off) => { const t = when(at, id); off === undefined ? show(id, t, [0, .012, 0, .92, 0], .3) : showHide(id, t, [0, .012, 0, .92, 0], when(off), .25); return t; },
      // Emphasis ring drawn on left to right (P013 `ring`), optionally removed.
      ring: (id, at, off, draw = .45) => {
        const t = when(at, id), o = off === undefined ? undefined : when(off);
        track(id, [key(t, [0, 0, 0, 1, 0]), key(t + .05, N), ...(o !== undefined ? [key(o, N), key(o + .2, [0, 0, 0, 1, 0])] : [])]);
        reveal(id, t, t + draw, 'rightward'); return t;
      },
      // Glow or highlight overlay that swells in, holds and fades (P013 seat glow).
      pulse: (id, at, hold = .85, fadeIn = .25, fadeOut = .4) => {
        const t = when(at, id); track(id, [key(t, [0, 0, 0, 1, 0]), key(t + fadeIn, N), key(t + fadeIn + hold, N), key(t + fadeIn + hold + fadeOut, [0, 0, 0, 1, 0])]); return t;
      },
      // Directional draw-on (connectors, strings, outlines) using the engine's clip reveals.
      draw: (id, at, dur = .5, dir = 'rightward') => { const t = when(at, id); show(id, t, [0, 0, 0, 1, 0], .05); reveal(id, t, t + dur, dir); return t; },
      // Camera keys at the resolved plan's camera moments for a shot: you supply one [cx,cy,zoom] (and optional ease)
      // per planned camera key, in order; a shot-start key is added if the plan has none at its start.
      planCamera: (shotId, views) => {
        const shot = ctx.plan?.shots.find(s => s.id === shotId) ?? fail(`planCamera: shot ${shotId} is not in the resolved plan (--plan)`);
        const moments = shot.camera ?? [];
        if (!Array.isArray(views) || views.length !== moments.length) fail(`planCamera: shot ${shotId} has ${moments.length} planned camera keys; give exactly one view for each`);
        const keys = moments.map((m, i) => key(m.seconds, views[i].slice(0, 3), views[i][3] ?? 'smooth'));
        return !keys.length || keys[0][0] > shot.start.seconds + 1e-9 ? [key(shot.start.seconds, keys[0]?.[1] ?? [0, 0, 1]), ...keys] : keys;
      },
      // P018.3: continuous camera travel through a shot (keeps a held shot alive between cues). views: [[t, cx, cy, zoom, ease?], ...]
      // with t in seconds or a cue id; the shot start and end are added from the first and last view.
      travel: (shotId, views) => {
        const s = ctx.shot(shotId), ks = views.map(([t, cx, cy, z, e]) => key(when(t), [cx, cy, z], e ?? 'smooth'));
        return [key(s.start, ks[0][1]), ...ks.filter(k => k[0] > s.start + 1e-6 && k[0] < s.end - 1e-6), key(s.end, ks.at(-1)[1], 'linear')];
      },
      // Cut-paper particles thrown from a point under gravity (sparks, lava, seeds, confetti): each id rises with its own
      // seeded spread and spin, arcs over and fades. Returns the burst time.
      burst: (ids, at, {spread = .16, rise = .22, fall = .12, dur = 1.4, seed = 1, stagger = .03} = {}) => {
        const t0 = when(at, ids[0]);
        ids.forEach((id, i) => {
          const t = t0 + i * stagger, dx = (rnd(seed + i) - .5) * 2 * spread, up = rise * (.6 + .4 * rnd(seed + 50 + i)), spin = (rnd(seed + 90 + i) - .5) * 360;
          track(id, [key(t, [0, 0, 0, .4, 0]), key(t + dur * .12, [dx * .15, -up * .35, spin * .1, 1, 1], 'out'),
            key(t + dur * .5, [dx * .65, -up, spin * .5, 1, 1], 'out'), key(t + dur, [dx, -up + fall + up * .55, spin, .9, 0], 'in')]);
        });
        return t0;
      },
      // A soft mass that billows up and grows (smoke, ash, clouds, foam), drifting by (dx, dy) stage fractions.
      billow: (id, at, {dx = .02, dy = -.12, grow = 1.6, dur = 2.2} = {}) => {
        const t = when(at, id); track(id, [key(t, [0, 0, -4, .35, 0]), key(t + dur * .25, [dx * .3, dy * .3, 0, .8, 1], 'out'), key(t + dur, [dx, dy, 4, grow, 1], 'out')]); return t;
      },
      // P018.4 figure motion. pose: rotation keys for one part about its origin, [[t, degrees, ease?], ...] (t in seconds or
      // a cue id; the first key registers the cue's visibility check only if the part is hidden before it).
      pose: (id, keys, {dx = 0, dy = 0} = {}) => { track(id, keys.map(([t, deg, e]) => key(when(t), [dx, dy, deg, 1, 1], e ?? 'smooth'))); return when(keys[0][0]); },
      // Eyelids shown for ~0.13 s at each time (natural blinks; give irregular times).
      blink: (id, times) => { track(id, [key(0, [0, 0, 0, 1, 0]), ...times.flatMap(t => [key(t, [0, 0, 0, 1, 0], 'linear'), key(t + .04, N, 'linear'), key(t + .1, N, 'linear'), key(t + .14, [0, 0, 0, 1, 0], 'linear')])]); },
    };
  }

  globalThis.paperKit = {art: {fibres, sheet, layered, castShadow, ring, connector, tileTexture, parts,
    light, mix, cut, gouache, wave, ridge, strata, sky, haze, textures, groundPlane, worldCamera, cameraPath, rig2D, twoBoneIK, characterRig, walkCycle, characterPerformance, characterIdentity, limbContour, masonry, facade, foliage, water, figure, deckle, penumbra, piece, folded, vellum, recede}, css, LABEL_STYLES, motion};
})();
