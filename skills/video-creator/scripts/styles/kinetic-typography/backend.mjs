// Kinetic Typography rendering backend (style implementation #6, P017.5): Chromium + inline SVG on the shared shot core
// (engine, scene view and preflight inspection carried by Tech Explainer), with its own host page, stylesheet, kit,
// `shutter` transition and topic global (globalThis.kineticTopic).
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShotBackend } from '../tech-explainer/backend.mjs';

export const backend = createShotBackend({name: 'kinetic-typography', dir: dirname(fileURLToPath(import.meta.url)), host: 'host.html', kit: 'kit.js',
  styleFiles: ['type.css'], topicGlobal: 'kineticTopic', label: 'Kinetic Typography'});
