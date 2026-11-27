// Flat Science rendering backend (style implementation #4, P017.3): Chromium + inline SVG on the shared shot core
// (engine, scene view and preflight inspection carried by Tech Explainer), with its own host page, stylesheet, kit,
// `magnify` transition and topic global (globalThis.flatScienceTopic).
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShotBackend } from '../tech-explainer/backend.mjs';

export const backend = createShotBackend({name: 'flat-science', dir: dirname(fileURLToPath(import.meta.url)), host: 'host.html', kit: 'kit.js',
  styleFiles: ['science.css'], topicGlobal: 'flatScienceTopic', label: 'Flat Science'});
