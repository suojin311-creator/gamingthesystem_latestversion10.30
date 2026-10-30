import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cache = resolve(root, 'node_modules/.cache/ending-cinematic');
const html = resolve(cache, 'index.html');
const manifest = resolve(cache, 'manifest.json');
const sourceRevision = 'REV-08';
const sha = data => createHash('sha256').update(data).digest('hex');
function filesIn(directory) {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(entry => {
    const path = directory + '/' + entry.name;
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}
// Include the actual approved artwork, isolated dependencies, adapters and locked tools.
const sourceFiles = [
  ...filesIn('scripts/ending-source'), ...filesIn('scripts/level3-source'),
  'scripts/ending-film.mjs',
  ...filesIn('scripts/ending-animation'), 'scripts/cinematic-dissolve.mjs',
  'scripts/level3-animation/cinematic.config.mjs', 'scripts/level1-settlement/content.mjs',
  'src/cinematics/opening/styles.css', 'src/cinematics/ending/input.ts',
  'src/cinematics/level3/mapping.mjs', 'src/levels/level3/data.ts', 'src/levels/level3/dialogue.ts',
  'src/levels/level3/weights.ts', 'src/shared/data/metrics.ts',
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
export function prepareEndingFilm() {
  if (process.env.ENDING_CINEMATIC_HTML) throw new Error('REV-08 must be built from its recorded local sources; unchecked HTML overrides are not supported.');
  if (cached()) {
    process.stdout.write('Reusing the source-verified REV-08 Ending cinematic cache.\n');
    return;
  }
  const result = spawnSync(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'),
    'build', '--config', resolve(root, 'scripts/ending-animation/preview.config.mjs'),
    '--outDir', cache, '--emptyOutDir'], { cwd: root, env: {...process.env,VITE_ENDING_EMBEDDED:'1'}, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`REV-08 Ending cinematic build failed (${result.status}).`);
  mkdirSync(cache, { recursive: true });
  writeFileSync(manifest, JSON.stringify({ sourceRevision, sourceSha256: fingerprint(),
    htmlSha256: sha(readFileSync(html)), sourceInventory: sourceFiles,
    provenance: relative(root, resolve(root, 'docs/INT05_SOURCE.json')) }, null, 2) + '\n');
}
export function endingFilmPlugin() {
  return { name: 'ending-cinematic-html', enforce: 'pre',
    resolveId(id) { if (id === 'virtual:ending-cinematic-film') return '\0' + id; },
    load(id) {
      if (id !== '\0virtual:ending-cinematic-film') return;
      if (!cached()) throw new Error('REV-08 film cache is missing or stale. Run the existing cinematic:prepare script.');
      return 'export default ' + JSON.stringify(readFileSync(html, 'utf8')) + ';';
    },
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepareEndingFilm();
