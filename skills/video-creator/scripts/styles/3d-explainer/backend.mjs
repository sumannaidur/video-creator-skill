// 3D Explainer rendering backend (style implementation #9, P017.8): genuine 3D in Chromium WebGL2, drawn by the kit's
// own compact renderer on the shared shot core (engine, scene view, captions and preflight inspection carried by Tech
// Explainer). Rendering is CPU-only through Chromium's bundled SwiftShader, pinned by these browser flags (recorded in
// the render configuration), so no GPU, driver or extra software is required.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShotBackend } from '../tech-explainer/backend.mjs';

export const backend = createShotBackend({name: '3d-explainer', dir: dirname(fileURLToPath(import.meta.url)), host: 'host.html', kit: 'kit.js',
  styleFiles: ['stage3d.css'], topicGlobal: 'explainer3dTopic', label: '3D Explainer',
  browserArgs: ['--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
