// Read-only: list installed style backends and run each backend's optional probe(). Prints JSON. Used by doctor.py.
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const styles = join(dirname(fileURLToPath(import.meta.url)), '..', 'styles');
const chrome = process.argv[2] || undefined;
const out = {};
for (const name of readdirSync(styles, {withFileTypes: true}).filter(d => d.isDirectory()).map(d => d.name)) {
  const file = join(styles, name, 'backend.mjs');
  if (!existsSync(file)) continue;
  try {
    const {backend} = await import(pathToFileURL(file).href);
    const contract = ['name', 'sources', 'open'].every(k => backend?.[k]);
    out[name] = {backend: backend.name, contract, requirements: backend.requirements ?? [],
      sourcesPresent: (backend.sources ?? []).every(existsSync), probe: backend.probe ? await backend.probe({chrome}) : null};
  } catch (error) { out[name] = {contract: false, error: error.message}; }
}
console.log(JSON.stringify(out));
