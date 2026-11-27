// Documentary rendering backend (style implementation #8, P017.7): Chromium + inline SVG on the shared shot core
// (engine, scene view and preflight inspection carried by Tech Explainer), with its own host page, stylesheet, kit,
// `dip` transition and topic global (globalThis.documentaryTopic).
//
// Media: photographs and footage come only from a verified asset manifest (schema video-creator.assets v1), passed as
// --options '{"assets": {"manifest": "<path>", "sha256": "<manifest sha256>"}}'. Before the topic runs, `prepare`:
//   - checks the manifest file against the sha256 given in --options (so every asset change changes the render
//     configuration, which already includes --options);
//   - requires for every asset: id, kind (original | licensed | public-domain | user-supplied), license, source,
//     attribution, authenticity (authentic | reconstruction | illustration | procedural) and media (image | frames);
//   - refuses licence "unknown" or empty, paths outside the manifest folder, unsupported file types, and any file whose
//     sha256 differs from the manifest;
//   - injects the verified files as data URIs with their metadata into globalThis.docAssets.
// Video is supported as verified frame sequences (media: "frames"): decoding a video file inside the browser is not
// frame-deterministic, so footage is extracted to stills (for example with local FFmpeg) and listed frame by frame.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShotBackend } from '../tech-explainer/backend.mjs';

const KINDS = ['original', 'licensed', 'public-domain', 'user-supplied'];
const AUTHENTICITY = ['authentic', 'reconstruction', 'illustration', 'procedural'];
const MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'};
const fail = (code, message) => { const e = new Error(`[${code}] ${message}`); e.code = code; throw e; };
const sha = buf => createHash('sha256').update(buf).digest('hex');

export async function verifyAssets(spec) {
  if (!spec?.manifest || !/^[0-9a-f]{64}$/.test(spec.sha256 ?? '')) fail('asset-manifest', 'options.assets needs {manifest, sha256}');
  const file = resolve(spec.manifest), raw = await readFile(file).catch(() => fail('asset-manifest', `cannot read ${file}`));
  if (sha(raw) !== spec.sha256) fail('asset-manifest-changed', 'asset manifest sha256 differs from --options (re-verify and update)');
  let m; try { m = JSON.parse(raw.toString('utf8')); } catch { fail('asset-manifest', 'manifest is not JSON'); }
  if (m.schema !== 'video-creator.assets' || m.version !== 1 || !Array.isArray(m.assets)) fail('asset-manifest', 'expected schema video-creator.assets version 1');
  const base = dirname(file), out = {};
  for (const a of m.assets) {
    const where = `asset ${JSON.stringify(a?.id)}`;
    if (!/^[a-z][a-z0-9-]*$/.test(a?.id ?? '') || out[a.id]) fail('asset-invalid', `${where}: unique lowercase id required`);
    if (!KINDS.includes(a.kind)) fail('asset-provenance', `${where}: kind must be one of ${KINDS}`);
    if (!AUTHENTICITY.includes(a.authenticity)) fail('asset-provenance', `${where}: authenticity must be one of ${AUTHENTICITY}`);
    for (const k of ['license', 'source', 'attribution']) if (typeof a[k] !== 'string' || !a[k].trim()) fail('asset-provenance', `${where}: ${k} required`);
    if (/^(unknown|unclear|none)$/i.test(a.license.trim())) fail('asset-license', `${where}: licence is ${a.license}; unclear rights are never rendered`);
    const files = a.media === 'image' ? [a] : a.media === 'frames' ? a.frames : fail('asset-invalid', `${where}: media must be image or frames`);
    if (!Array.isArray(files) || !files.length) fail('asset-invalid', `${where}: no files`);
    const uris = [];
    for (const f of files) {
      const p = resolve(base, f.file ?? ''), rel = relative(base, p);
      if (!f.file || rel.startsWith('..') || isAbsolute(rel)) fail('asset-path', `${where}: ${f.file} is outside the manifest folder`);
      const mime = MIME[extname(p).toLowerCase()] ?? fail('asset-type', `${where}: unsupported file type ${extname(p)}`);
      const buf = await readFile(p).catch(() => fail('asset-missing', `${where}: cannot read ${f.file}`));
      if (sha(buf) !== f.sha256) fail('asset-hash', `${where}: ${f.file} sha256 differs from the manifest`);
      uris.push(`data:${mime};base64,${buf.toString('base64')}`);
    }
    out[a.id] = {media: a.media, uris, width: a.width ?? null, height: a.height ?? null, fps: a.fps ?? null,
      meta: {kind: a.kind, authenticity: a.authenticity, license: a.license, source: a.source, attribution: a.attribution, title: a.title ?? a.id}};
  }
  return out;
}

export const backend = createShotBackend({name: 'documentary', dir: dirname(fileURLToPath(import.meta.url)), host: 'host.html', kit: 'kit.js',
  styleFiles: ['doc.css'], topicGlobal: 'documentaryTopic', label: 'Documentary',
  prepare: async ({topicOptions}) => topicOptions?.assets ? `globalThis.docAssets = ${JSON.stringify(await verifyAssets(topicOptions.assets))};` : 'globalThis.docAssets = {};'});
