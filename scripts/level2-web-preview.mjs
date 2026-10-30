// Build just the exact Level 2 film/review page. Full-game ZIPs are a separate release.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { prepareLevelTwoFilm } from './level2-film.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = process.env.LEVEL2_ANIMATION_SOURCE;
if (!source) throw new Error('Set LEVEL2_ANIMATION_SOURCE to the pinned, read-only Level 2 delivery.');
const build = resolve(root, 'node_modules/.cache/level2-web-review');
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
prepareLevelTwoFilm();
run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--config', 'scripts/level2-animation-preview.config.mjs', '--outDir', build, '--emptyOutDir']);
run('python3', ['scripts/package_level2_animation_preview.py', build, source, '--web-dir', 'docs/animation-preview']);
