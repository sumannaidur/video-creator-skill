// Whiteboard rendering backend (style implementation #3, P017.2): Chromium + inline SVG. It reuses the shared shot core
// (engine, scene view and preflight inspection, carried by Tech Explainer) and supplies its own host page, board
// stylesheet, marker kit, `erase` transition and topic global (globalThis.whiteboardTopic).
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShotBackend } from '../tech-explainer/backend.mjs';

export const backend = createShotBackend({name: 'whiteboard', dir: dirname(fileURLToPath(import.meta.url)), host: 'host.html', kit: 'kit.js',
  styleFiles: ['board.css'], topicGlobal: 'whiteboardTopic', label: 'Whiteboard'});
