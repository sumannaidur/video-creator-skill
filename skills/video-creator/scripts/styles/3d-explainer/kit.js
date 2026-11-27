// 3D Explainer kit (browser script, loaded after the shared shot core by backend.mjs). Style implementation #9 (P017.8).
// Genuine 3D: a compact WebGL2 renderer (no third-party library) with perspective cameras, triangle meshes (box,
// cylinder, extruded gear, ground plane), Blinn-Phong materials (metal/plastic/glass, emissive), sky/ground ambient,
// a directional key light with a 2048² shadow map (3×3 PCF), sorted transparency, and a gradient backdrop.
// Runs on CPU through Chromium's SwiftShader (pinned by the backend's browser flags). Every transform is a pure function
// of time, so frames are deterministic and checkpointable.
// Integration with the shared shot core:
//  - each 3D node can mirror into a DOM proxy object: the engine animates the proxy's opacity (speech-cue visibility
//    checks use it) and this kit resizes the proxy to the node's projected screen bounds every frame, so preflight's
//    required-object-bounds check applies to the real 3D geometry;
//  - the engine's `frame` hook draws the active shot's scene; the `dolly` transition pushes the 3D camera through the cut.
(() => {
  const fail = m => { throw new Error('k3d: ' + m); };
  const num = (x, what) => (typeof x === 'number' && Number.isFinite(x)) ? x : fail(`${what} must be a number`);
  const D2R = Math.PI / 180;

  // ---------- 4×4 matrices (column-major, as WebGL expects) ----------
  const M = {
    id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    mul: (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
    persp: (fovy, aspect, near, far) => { const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far); return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]; },
    ortho: (l, r, b, t, n, f) => [2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1],
    lookAt: (e, c, u) => {
      let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; const zl = Math.hypot(...z); z = z.map(v => v / zl);
      let x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]]; const xl = Math.hypot(...x); x = x.map(v => v / xl);
      const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
      return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
    },
    // translate · rotateY · rotateX · rotateZ · scale (Euler degrees)
    trs: ([tx, ty, tz] = [0, 0, 0], [rx, ry, rz] = [0, 0, 0], [sx, sy, sz] = [1, 1, 1]) => {
      const [a, b, c] = [rx * D2R, ry * D2R, rz * D2R], [ca, sa, cb, sb, cc, sc] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(c), Math.sin(c)];
      const Ry = [cb, 0, -sb, 0, 0, 1, 0, 0, sb, 0, cb, 0, 0, 0, 0, 1], Rx = [1, 0, 0, 0, 0, ca, sa, 0, 0, -sa, ca, 0, 0, 0, 0, 1], Rz = [cc, sc, 0, 0, -sc, cc, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      const S = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1], T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1];
      return M.mul(T, M.mul(Ry, M.mul(Rx, M.mul(Rz, S))));
    },
    normal: m => { // inverse-transpose of the upper 3×3
      const [a, b, c, d, e, f, g, h, i] = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
      const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C || 1;
      return [A, B, C, -(b * i - c * h), a * i - c * g, -(a * h - b * g), b * f - c * e, -(a * f - c * d), a * e - b * d].map(v => v / det);
    },
    xform: (m, [x, y, z]) => { const w = m[3] * x + m[7] * y + m[11] * z + m[15]; return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w]; },
  };

  // ---------- meshes: flat arrays of [x, y, z, nx, ny, nz] per vertex (triangles) ----------
  const quad = (out, a, b, c, d, n) => { for (const p of [a, b, c, a, c, d]) out.push(...p, ...n); };
  const box = (w, h, d) => {
    const [x, y, z] = [w / 2, h / 2, d / 2], o = [];
    quad(o, [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], [0, 0, 1]); quad(o, [x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z], [0, 0, -1]);
    quad(o, [x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z], [1, 0, 0]); quad(o, [-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z], [-1, 0, 0]);
    quad(o, [-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z], [0, 1, 0]); quad(o, [-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], [0, -1, 0]);
    return {data: o, bounds: [[-x, -y, -z], [x, y, z]]};
  };
  // Extrusion of a star-shaped closed outline in the XY plane, thickness along Z (caps fan from the origin).
  const extrude = (outline, depth) => {
    const z = depth / 2, o = [], n = outline.length;
    for (let i = 0; i < n; i++) {
      const [ax, ay] = outline[i], [bx, by] = outline[(i + 1) % n], l = Math.hypot(by - ay, ax - bx) || 1, nn = [(by - ay) / l, (ax - bx) / l, 0];
      quad(o, [ax, ay, z], [ax, ay, -z], [bx, by, -z], [bx, by, z], nn);
      o.push(0, 0, z, 0, 0, 1, ax, ay, z, 0, 0, 1, bx, by, z, 0, 0, 1, 0, 0, -z, 0, 0, -1, bx, by, -z, 0, 0, -1, ax, ay, -z, 0, 0, -1);
    }
    const r = Math.max(...outline.map(p => Math.hypot(...p)));
    return {data: o, bounds: [[-r, -r, -z], [r, r, z]]};
  };
  const cylinder = (r, depth, seg = 40) => extrude(Array.from({length: seg}, (_, i) => [Math.cos(i / seg * Math.PI * 2) * r, Math.sin(i / seg * Math.PI * 2) * r]), depth);
  // Spur gear: pitch radius r = m·z/2, addendum m, dedendum 1.25m (dimensionally consistent meshing pairs).
  const gear = (z, m, depth) => {
    if (!Number.isInteger(z) || z < 6) fail('gear teeth must be an integer ≥ 6');
    const r = m * z / 2, ra = r + m, rf = r - 1.25 * m, pts = [];
    for (let i = 0; i < z; i++) { const a = i / z * Math.PI * 2, s = Math.PI / z;
      for (const [rr, da] of [[rf, -s * .55], [ra, -s * .3], [ra, s * .3], [rf, s * .55]]) pts.push([Math.cos(a + da) * rr, Math.sin(a + da) * rr]); }
    return Object.assign(extrude(pts, depth), {pitch: r, outer: ra});
  };
  const plane = (w, d) => { const o = []; quad(o, [-w / 2, 0, d / 2], [w / 2, 0, d / 2], [w / 2, 0, -d / 2], [-w / 2, 0, -d / 2], [0, 1, 0]); return {data: o, bounds: [[-w / 2, 0, -d / 2], [w / 2, 0, d / 2]]}; };

  // ---------- materials ----------
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const material = (color, {metal = 0, rough = .5, emissive = '#000000', opacity = 1} = {}) => ({color: hex(color), metal, rough, emissive: hex(emissive), opacity});

  // ---------- WebGL2 renderer ----------
  const VS = `#version 300 es
    in vec3 aPos; in vec3 aNor; uniform mat4 uModel, uView, uProj, uLight; uniform mat3 uNM;
    out vec3 vN; out vec3 vW; out vec4 vL;
    void main() { vec4 w = uModel * vec4(aPos, 1.); vW = w.xyz; vN = normalize(uNM * aNor); vL = uLight * w; gl_Position = uProj * uView * w; }`;
  const FS = `#version 300 es
    precision highp float; precision highp sampler2DShadow;
    in vec3 vN; in vec3 vW; in vec4 vL; out vec4 o;
    uniform vec3 uColor, uEmis, uEye, uLdir, uSky, uGround, uKey; uniform float uMetal, uRough, uAlpha, uShadowOn; uniform sampler2DShadow uShadow;
    float shadow() { vec3 p = vL.xyz / vL.w * .5 + .5; if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1.) return 1.;
      float s = 0.; vec2 px = vec2(1. / 2048.); for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) s += texture(uShadow, vec3(p.xy + vec2(x, y) * px, p.z - .0015)); return s / 9.; }
    void main() {
      vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
      vec3 v = normalize(uEye - vW), l = normalize(-uLdir), h = normalize(l + v);
      float sh = mix(1., shadow(), uShadowOn), nd = max(dot(n, l), 0.);
      float shin = mix(120., 6., uRough), spec = pow(max(dot(n, h), 0.), shin) * mix(.25, 1., uMetal) * (1. - uRough * .7);
      // colours arrive in sRGB: shade in linear light, encode once on output
      vec3 col = pow(uColor, vec3(2.2)), key = pow(uKey, vec3(2.2)), sky = pow(uSky, vec3(2.2)), gnd = pow(uGround, vec3(2.2));
      vec3 amb = mix(gnd, sky, n.y * .5 + .5);
      vec3 base = col * (1. - uMetal * .35);
      vec3 specC = mix(vec3(1.), col, uMetal);
      float fres = pow(1. - max(dot(n, v), 0.), 4.);
      vec3 c = base * amb * .6 + base * key * nd * sh * 1.1 + specC * key * spec * sh + fres * sky * .12 + pow(uEmis, vec3(2.2));
      o = vec4(pow(c, vec3(1. / 2.2)), uAlpha * mix(1., .6 + .4 * fres, step(uAlpha, .99)));
    }`;
  const SVS = `#version 300 es
    in vec3 aPos; uniform mat4 uModel, uLight; void main() { gl_Position = uLight * uModel * vec4(aPos, 1.); }`;
  const SFS = `#version 300 es
    precision mediump float; out vec4 o; void main() { o = vec4(1.); }`;
  const BVS = `#version 300 es
    out vec2 vUv; void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2. - 1., 1., 1.); }`;
  const BFS = `#version 300 es
    precision mediump float; in vec2 vUv; uniform vec3 uTop, uBot; out vec4 o;
    void main() { float v = length((vUv - vec2(.5, .58)) * vec2(1.2, 1.)); vec3 c = mix(uBot, uTop, smoothstep(0., 1., vUv.y)) * (1. - .45 * smoothstep(.35, .95, v)); o = vec4(c, 1.); }`;

  let canvas = null, gl = null, progs = null, shadowFb = null, shadowTex = null;
  const compile = (vs, fs) => {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) fail('shader: ' + gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) fail('link: ' + gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) { const n = gl.getActiveUniform(p, i).name; u[n] = gl.getUniformLocation(p, n); }
    return {p, u, aPos: gl.getAttribLocation(p, 'aPos'), aNor: gl.getAttribLocation(p, 'aNor')};
  };
  const ensureGL = () => {
    if (gl) return;
    canvas = document.createElement('canvas');
    canvas.className = 'k3d-canvas';
    gl = canvas.getContext('webgl2', {antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: false}) ?? fail('WebGL2 is unavailable (run with the backend\'s SwiftShader flags)');
    progs = {main: compile(VS, FS), shadow: compile(SVS, SFS), back: compile(BVS, BFS)};
    shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, 2048, 2048);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    shadowFb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  const buffers = new Map();
  const vao = mesh => {
    if (buffers.has(mesh)) return buffers.get(mesh);
    const v = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.data), gl.STATIC_DRAW);
    for (const pr of [progs.main, progs.shadow]) {
      gl.enableVertexAttribArray(pr.aPos); gl.vertexAttribPointer(pr.aPos, 3, gl.FLOAT, false, 24, 0);
      if (pr.aNor >= 0) { gl.enableVertexAttribArray(pr.aNor); gl.vertexAttribPointer(pr.aNor, 3, gl.FLOAT, false, 24, 12); }
    }
    const e = {v, count: mesh.data.length / 6}; buffers.set(mesh, e); return e;
  };

  // ---------- scenes ----------
  const scenes = {};
  const at = (f, t) => typeof f === 'function' ? f(t) : f;
  // scene(sceneId, {background: [top, bottom], light: {dir, color}, sky, ground, camera: t => {pos, target, fov}})
  const scene = (id, opts) => { scenes[id] = {nodes: [], ...opts}; return scenes[id]; };
  // node(sceneId, {id, mesh, material, pos, rot, scale, parent, proxy, castShadow}); pos/rot/scale may be functions of t.
  const node = (sceneId, spec) => { const s = scenes[sceneId] ?? fail(`unknown scene ${sceneId}`); const n = {castShadow: true, ...spec}; s.nodes.push(n); return n; };
  const world = (s, n, t) => { const m = M.trs(at(n.pos, t), at(n.rot, t), at(n.scale, t)); return n.parent ? M.mul(world(s, s.nodes.find(x => x.id === n.parent) ?? fail(`parent ${n.parent}`), t), m) : m; };

  // ---------- camera helpers ----------
  // Orbit view: azimuth (deg, from +Z toward +X), elevation (deg), distance, target, vertical fov (deg).
  const orbit = ({az, el, dist, target = [0, 0, 0], fov = 30}) => ({pos: [target[0] + dist * Math.cos(el * D2R) * Math.sin(az * D2R), target[1] + dist * Math.sin(el * D2R),
    target[2] + dist * Math.cos(el * D2R) * Math.cos(az * D2R)], target, fov});
  // Distance at which a sphere of radius r fits both the vertical and horizontal field of view (with margin).
  const fitDistance = (r, fov, aspect, margin = 1.12) => { const v = fov * D2R / 2, h = Math.atan(Math.tan(v) * aspect); return r * margin / Math.sin(Math.min(v, h)); };
  const ease = p => p * p * (3 - 2 * p);
  // Interpolate orbit keys [[t, {az, el, dist, target, fov}], ...] (smooth), returning a camera at time t.
  const orbitKeys = keys => t => {
    if (t <= keys[0][0]) return orbit(keys[0][1]);
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
      const [a, A] = keys[i - 1], [b, B] = keys[i], p = ease((t - a) / (b - a || 1)), mix = (x, y) => x + (y - x) * p;
      return orbit({az: mix(A.az, B.az), el: mix(A.el, B.el), dist: mix(A.dist, B.dist), fov: mix(A.fov ?? 30, B.fov ?? 30),
        target: (A.target ?? [0, 0, 0]).map((v, k) => mix(v, (B.target ?? [0, 0, 0])[k]))});
    }
    return orbit(keys.at(-1)[1]);
  };
  // Keyed vector animation [[t, [x, y, z]], ...] (smooth) for positions, rotations or scales.
  const keys = ks => t => {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { const [a, A] = ks[i - 1], [b, B] = ks[i], p = ease((t - a) / (b - a || 1)); return A.map((v, k) => v + (B[k] - v) * p); }
    return ks.at(-1)[1];
  };

  // ---------- drawing ----------
  let current = null;
  const proxyEl = id => id ? document.getElementById(id) : null;
  const draw = ({t, scene: sceneId, tr, k, before, stage, W, H}) => {
    const s = scenes[sceneId];
    if (!s) return;
    ensureGL();
    if (canvas.parentNode !== stage) stage.prepend(canvas);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    let cam = at(s.camera, t);
    if (tr?.type === 'dolly' && k > 0) { const f = 1 - .62 * k; cam = {...cam, pos: cam.pos.map((v, i) => cam.target[i] + (v - cam.target[i]) * f)}; }
    const view = M.lookAt(cam.pos, cam.target, [0, 1, 0]), proj = M.persp((cam.fov ?? 30) * D2R, W / H, .1, 200);
    const L = s.light ?? {dir: [-.5, -1, -.4], color: '#fff4e6'}, ld = L.dir.map(v => v / Math.hypot(...L.dir)), R = s.shadowRadius ?? 6;
    const lightVP = M.mul(M.ortho(-R, R, -R, R, .1, 4 * R), M.lookAt(ld.map(v => -v * 2 * R), [0, 0, 0], Math.abs(ld[1]) > .99 ? [0, 0, 1] : [0, 1, 0]));
    const items = s.nodes.map(n => ({n, m: world(s, n, t), alpha: (Number(proxyEl(n.proxy)?.style.opacity ?? 1) || 0) * (n.material?.opacity ?? 1)})).filter(x => x.alpha > .003 && x.n.mesh);
    // shadow pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb); gl.viewport(0, 0, 2048, 2048); gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    gl.useProgram(progs.shadow.p); gl.uniformMatrix4fv(progs.shadow.u.uLight, false, lightVP);
    for (const {n, m, alpha} of items) if (n.castShadow && alpha > .5) { const b = vao(n.mesh); gl.bindVertexArray(b.v); gl.uniformMatrix4fv(progs.shadow.u.uModel, false, m); gl.drawArrays(gl.TRIANGLES, 0, b.count); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    // backdrop
    gl.disable(gl.DEPTH_TEST); gl.useProgram(progs.back.p);
    const bg = (s.background ?? ['#2a3442', '#0c1016']).map(hex); gl.uniform3fv(progs.back.u.uTop, bg[0]); gl.uniform3fv(progs.back.u.uBot, bg[1]);
    gl.bindVertexArray(null); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    // main pass: opaque first, then transparent back to front
    const P = progs.main, u = P.u; gl.useProgram(P.p);
    gl.uniformMatrix4fv(u.uView, false, view); gl.uniformMatrix4fv(u.uProj, false, proj); gl.uniformMatrix4fv(u.uLight, false, lightVP);
    gl.uniform3fv(u.uEye, cam.pos); gl.uniform3fv(u.uLdir, ld); gl.uniform3fv(u.uKey, hex(L.color));
    gl.uniform3fv(u.uSky, hex(s.sky ?? '#b9c8d8')); gl.uniform3fv(u.uGround, hex(s.ground ?? '#3a3028'));
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shadowTex); gl.uniform1i(u.uShadow, 0); gl.uniform1f(u.uShadowOn, 1);
    const depth = m => { const p = M.xform(view, [m[12], m[13], m[14]]); return p[2]; };
    const opaque = items.filter(x => x.alpha >= .999), clear = items.filter(x => x.alpha < .999).sort((a, b) => depth(a.m) - depth(b.m));
    for (const [list, blend] of [[opaque, false], [clear, true]]) {
      if (blend) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); } else { gl.disable(gl.BLEND); gl.depthMask(true); }
      for (const {n, m, alpha} of list) {
        const mt = n.material ?? material('#cccccc'), b = vao(n.mesh), em = at(n.emissive, t);
        gl.bindVertexArray(b.v); gl.uniformMatrix4fv(u.uModel, false, m); gl.uniformMatrix3fv(u.uNM, false, M.normal(m));
        gl.uniform3fv(u.uColor, mt.color); gl.uniform3fv(u.uEmis, em ? hex(em.color).map(v => v * em.amount) : mt.emissive);
        gl.uniform1f(u.uMetal, mt.metal); gl.uniform1f(u.uRough, mt.rough); gl.uniform1f(u.uAlpha, alpha);
        gl.drawArrays(gl.TRIANGLES, 0, b.count);
      }
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
    // proxies follow the projected bounds of their nodes (so preflight can check the real 3D geometry)
    const vp = M.mul(proj, view);
    for (const {n, m} of s.nodes.map(n => ({n, m: world(s, n, t)}))) {
      const el = proxyEl(n.proxy); if (!el || !n.mesh) continue;
      const [lo, hi] = n.mesh.bounds, xs = [], ys = [];
      for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) { const p = M.xform(M.mul(vp, m), [x, y, z]); xs.push((p[0] * .5 + .5) * W); ys.push((1 - (p[1] * .5 + .5)) * H); }
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      Object.assign(el.style, {left: `${((x0 + x1) / 2 / W * 100).toFixed(3)}%`, top: `${((y0 + y1) / 2 / H * 100).toFixed(3)}%`, width: `${(x1 - x0).toFixed(1)}px`, height: `${(y1 - y0).toFixed(1)}px`});
    }
    current = sceneId;
  };

  // ---------- transition: dolly — the 3D camera pushes in through the cut while the frame dims; the next shot pulls back ----------
  const setup = stage => { const o = document.createElement('div'); o.className = 'k3d-dim'; stage.append(o); return {dim: o}; };
  const dolly = ({tr, k, overlays}) => { if (overlays?.dim) overlays.dim.style.opacity = tr ? String((k * .92).toFixed(3)) : '0'; };
  const LABEL_STYLES = ['title', 'spec', 'badge'];
  globalThis.vcShotStyle = {labelStyles: LABEL_STYLES, setup, frame: draw, transitions: {dolly: {defaults: {lead: .45, tail: .45}, needsSymbol: false, render: dolly}}};
  const css = `
    .piece-label { font:650 36px/1.5 "Nirmala UI", "Segoe UI", sans-serif; color:#eef3f8; text-shadow:0 2px 8px #000a }
    .label-title .piece-label { font-size:50px; font-weight:750 }
    .label-spec .piece-label { font-size:32px; padding:6px 18px; border-left:5px solid var(--label-accent, #6fc3ff); background:#0b1118b3; text-shadow:none }
    .label-badge .piece-label { font-size:28px; padding:6px 18px; border-radius:999px; color:#0b1118; background:var(--label-accent, #ffc857); text-shadow:none }
  `;

  // ---------- motion helpers: visibility through DOM proxies (speech-cue checks), 3D motion as functions of t ----------
  function motion(ctx) {
    const {key, N, track, show, showHide} = ctx.motion;
    const when = (at, id) => typeof at === 'string' ? ctx.motion.speechCue(at, id) : num(at, 'time');
    return {
      when,
      // A node (via its proxy id) fades in at `at`.
      appear: (proxyId, at, dur = .4) => { const t = when(at, proxyId); show(proxyId, t, [0, 0, 0, 1, 0], dur); return t; },
      label: (id, at, off) => { const t = when(at, id); off === undefined ? show(id, t, [0, .01, 0, 1, 0], .3) : showHide(id, t, [0, .01, 0, 1, 0], when(off), .25); return t; },
      // Meshing gears about their Z axes: ω2 = −ω1 · z1 / z2, with gear 2 offset by half a tooth so teeth interleave.
      mesh: (z1, z2, deg, phase = 0) => [t => [0, 0, phase + deg * t], t => [0, 0, 180 / z2 - deg * t * z1 / z2]],
      // Exploded-view offset: from rest to `delta` over [t, t + dur].
      explode: (rest, delta, t, dur = .8) => keys([[t, rest], [t + dur, rest.map((v, i) => v + delta[i])]]),
      // Emissive highlight from `t` (seconds), returned as a node `emissive` function.
      highlight: (color, t, amount = .35, dur = .3) => tt => ({color, amount: amount * Math.max(0, Math.min(1, (tt - t) / dur))}),
      // Orbit camera keyed at the plan's camera moments for a shot: views [{az, el, dist, target, fov}] (one per moment),
      // plus a starting view at the shot start and an optional end view.
      planOrbit: (shotId, startView, views, endView) => {
        const shot = ctx.plan?.shots.find(s => s.id === shotId) ?? fail(`planOrbit: shot ${shotId} is not in the resolved plan (--plan)`);
        const moments = shot.camera ?? [];
        if (views.length !== moments.length) fail(`planOrbit: shot ${shotId} has ${moments.length} planned camera keys; give exactly one view for each`);
        return orbitKeys([[shot.start.seconds, startView], ...moments.map((m, i) => [m.seconds, views[i]]), ...(endView ? [[shot.end.seconds, endView]] : [])]);
      },
    };
  }

  globalThis.k3d = {M, mesh: {box, cylinder, gear, plane, extrude}, material, scene, node, orbit, orbitKeys, keys, fitDistance, css, LABEL_STYLES, motion,
    info: () => { ensureGL(); const d = gl.getExtension('WEBGL_debug_renderer_info'); return {renderer: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)}; }};
})();
