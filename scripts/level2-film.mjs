import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cache = resolve(root, 'node_modules/.cache/level2-cinematic');
const html = resolve(cache, 'index.html');
const manifest = resolve(cache, 'manifest.json');
const sourceRevision = 'REV-05/06/07';
const sha = data => createHash('sha256').update(data).digest('hex');
function filesIn(directory) {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(entry => {
    const path = directory + '/' + entry.name;
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}
// Include the actual approved artwork, isolated dependencies, adapters and locked tools.
const sourceFiles = [
  ...filesIn('scripts/level2-source'),
  ...filesIn('revision-assets/level2'),
  'scripts/level2-film.mjs',
  ...filesIn('scripts/level2-animation'),
  'scripts/cinematic-reading.mjs', 'src/shared/data/metrics.ts', 'src/levels/level2/data.ts',
  'src/shared/data/cinematicPalette.js', 'src/shared/data/professorLabel.js', 'package.json', 'package-lock.json',
].sort();
const fingerprint = () => sha(Buffer.concat(sourceFiles.map(path => Buffer.concat([
  Buffer.from(path + '\0'), readFileSync(resolve(root, path)), Buffer.from('\0'),
]))));
function cached() {
  if (!existsSync(html) || !existsSync(manifest)) return false;
  const saved = JSON.parse(readFileSync(manifest, 'utf8'));
  return saved.sourceRevision === sourceRevision && saved.sourceSha256 === fingerprint()
    && saved.htmlSha256 === sha(readFileSync(html));
}
export function prepareLevelTwoFilm() {
  if (process.env.LEVEL2_CINEMATIC_HTML) throw new Error('REV-05/06/07 must be built from its recorded local sources; unchecked HTML overrides are not supported.');
  if (cached()) {
    process.stdout.write('Reusing the source-verified REV-05/06/07 Level 2 cinematic cache.\n');
    return;
  }
  const result = spawnSync(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'),
    'build', '--config', resolve(root, 'scripts/level2-animation/cinematic.config.mjs'),
    '--outDir', cache, '--emptyOutDir'], { cwd: root, env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`REV-05/06/07 Level 2 cinematic build failed (${result.status}).`);
  mkdirSync(cache, { recursive: true });
  writeFileSync(manifest, JSON.stringify({ sourceRevision, sourceSha256: fingerprint(),
    htmlSha256: sha(readFileSync(html)), sourceInventory: sourceFiles,
    provenance: relative(root, resolve(root, 'docs/INT03_SOURCE.json')) }, null, 2) + '\n');
}
export function levelTwoFilmPlugin() {
  return { name: 'level-two-cinematic-html', enforce: 'pre',
    resolveId(id) { if (id === 'virtual:level2-cinematic-film') return '\0' + id; },
    load(id) {
      if (id !== '\0virtual:level2-cinematic-film') return;
      if (!cached()) throw new Error('REV-05/06/07 film cache is missing or stale. Run the existing cinematic:prepare script.');
      return 'export default ' + JSON.stringify(readFileSync(html, 'utf8')) + ';';
    },
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepareLevelTwoFilm();
