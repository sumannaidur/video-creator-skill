// Data Storytelling rendering backend (style implementation #5, P017.4): Chromium + inline SVG on the shared shot core
// (engine, scene view and preflight inspection carried by Tech Explainer), with its own host page, stylesheet, kit,
// `bars` transition and topic global (globalThis.dataStoryTopic).
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShotBackend } from '../tech-explainer/backend.mjs';

export const backend = createShotBackend({name: 'data-storytelling', dir: dirname(fileURLToPath(import.meta.url)), host: 'host.html', kit: 'kit.js',
  styleFiles: ['data.css'], topicGlobal: 'dataStoryTopic', label: 'Data Storytelling'});
