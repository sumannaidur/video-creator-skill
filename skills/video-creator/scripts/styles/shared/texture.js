// Shared procedural texture baking (P018.3). Browser script, evaluated before a shot engine; used only by style kits.
//
// vcTexture.bake({kind, size, seed, ...}) draws a seeded, seamlessly tiling texture into a canvas once and returns a PNG
// data URL, so artwork can carry paper fibre, gouache grain or brushed metal as a bitmap <pattern> instead of a per-frame
// SVG filter (filters are re-rasterized whenever a layer moves, bitmaps are not). Deterministic: the same arguments
// give the same pixels on the same renderer; results are cached per argument set. Grayscale value noise (period = tile
// size, so tiles join without seams) mapped to a tint with an alpha range; style kits decide where it is used.
(() => {
  const cache = new Map();
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const smooth = t => t * t * (3 - 2 * t);
  // Periodic value noise: lattice of `px` by `py` cells wrapping at the tile edge.
  const value = (u, v, px, py, seed) => {
    const x = u * px, y = v * py, x0 = Math.floor(x), y0 = Math.floor(y), fx = smooth(x - x0), fy = smooth(y - y0);
    const g = (i, j) => hash(((i % px) + px) % px, ((j % py) + py) % py, seed);
    const a = g(x0, y0), b = g(x0 + 1, y0), c = g(x0, y0 + 1), d = g(x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  const KINDS = {
    // fine paper tooth plus a softer mottling (Painted Story / Paper Collage surfaces)
    paper: {cells: [[4, 4, .35], [16, 16, .3], [64, 64, .35]]},
    // gouache: broad uneven pigment pooling with a little tooth
    gouache: {cells: [[3, 3, .45], [7, 7, .3], [48, 48, .25]]},
    // brushed metal: long horizontal streaks
    brushed: {cells: [[2, 96, .5], [4, 192, .3], [1, 32, .2]]},
    // even speckle (dust, sand, ash)
    speckle: {cells: [[96, 96, .7], [24, 24, .3]]},
  };
  function bake({kind = 'paper', size = 256, seed = 1, tint = [40, 36, 30], alpha = [0, .22], contrast = 1.6, fibres = 0} = {}) {
    const spec = KINDS[kind];
    if (!spec) throw new Error(`vcTexture: unknown kind ${kind}`);
    if (!(Number.isInteger(size) && size >= 32 && size <= 1024)) throw new Error('vcTexture: size must be an integer 32-1024');
    const key = JSON.stringify([kind, size, seed, tint, alpha, contrast, fibres]);
    if (cache.has(key)) return cache.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d'), img = g.createImageData(size, size), px = img.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let n = 0;
      spec.cells.forEach(([cx, cy, w], k) => { n += w * value(x / size, y / size, cx, cy, seed * 7 + k); });
      n = Math.max(0, Math.min(1, .5 + (n - .5) * contrast));
      const i = (y * size + x) * 4;
      px[i] = tint[0]; px[i + 1] = tint[1]; px[i + 2] = tint[2];
      px[i + 3] = Math.round(255 * (alpha[0] + (alpha[1] - alpha[0]) * n));
    }
    g.putImageData(img, 0, 0);
    // optional paper fibres: short seeded strokes, wrapped so the tile stays seamless
    if (fibres) {
      g.lineCap = 'round';
      for (let i = 0; i < fibres; i++) {
        const x = hash(i, 1, seed) * size, y = hash(i, 2, seed) * size, l = 6 + hash(i, 3, seed) * 22, a = (hash(i, 4, seed) - .5) * .9;
        g.strokeStyle = `rgba(${tint.join(',')},${(alpha[1] * (.4 + .6 * hash(i, 5, seed))).toFixed(3)})`;
        g.lineWidth = .6 + hash(i, 6, seed) * .9;
        for (const [ox, oy] of [[0, 0], [-size, 0], [0, -size], [-size, -size]]) {
          g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke();
        }
      }
    }
    const url = canvas.toDataURL('image/png');
    cache.set(key, url);
    return url;
  }
  // <pattern> markup for a baked texture: tile `size` user units (choose it relative to the symbol's viewBox).
  const pattern = (id, url, size, {rotate = 0} = {}) =>
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}"${rotate ? ` patternTransform="rotate(${rotate})"` : ''}>` +
    `<image href="${url}" width="${size}" height="${size}" preserveAspectRatio="none"/></pattern>`;
  globalThis.vcTexture = {bake, pattern, KINDS: Object.keys(KINDS)};
})();
