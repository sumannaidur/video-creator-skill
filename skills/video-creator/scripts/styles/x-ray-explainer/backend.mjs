// X-Ray Explainer rendering backend (style implementation #7, P017.6): Chromium + inline SVG on the shared shot core
// (engine, scene view and preflight inspection carried by Tech Explainer), with its own host page, stylesheet, kit,
// `sweep` transition and topic global (globalThis.xrayTopic).
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShotBackend } from '../tech-explainer/backend.mjs';

export const backend = createShotBackend({name: 'x-ray-explainer', dir: dirname(fileURLToPath(import.meta.url)), host: 'host.html', kit: 'kit.js',
  styleFiles: ['xray.css'], topicGlobal: 'xrayTopic', label: 'X-Ray Explainer'});
