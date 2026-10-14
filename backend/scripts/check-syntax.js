import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

async function findJs(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) results.push(...await findJs(file));
    else if (entry.isFile() && file.endsWith('.js')) results.push(file);
  }
  return results;
}
const files = [...await findJs(fileURLToPath(new URL('../src/', import.meta.url))), ...await findJs(fileURLToPath(new URL('./', import.meta.url)))];
for (const file of files) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || `Syntax error in ${file}`); process.exitCode = 1; }
}
if (!process.exitCode) console.info(`${files.length} backend JavaScript files passed syntax checks.`);
