import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Local dependency subset imported by approved REV-05/06/07; no original worktree is mutated.
const root = resolve(fileURLToPath(new URL('../level2-source/', import.meta.url)));
const here = fileURLToPath(new URL('.', import.meta.url));
const replace = (code, from, to) => {
  if (!code.includes(from)) throw new Error('Review the pinned Level 2 presentation adapter: missing ' + from);
  return code.replace(from, to);
};
export default {
  root, base: './',
  esbuild: { jsx: 'automatic' },
  resolve: { dedupe: ['react', 'react-dom'], alias: { '@partner': root + '/src', '@partner-assets': root + '/assets', '@partner-scenes': root + '/docs/visual-style/references/Level 2 - More Metrics Consequences' } },
  plugins: [{ name: 'placeholder-only-level2-film', enforce: 'pre', transform(code, id) {
    if (id === root + '/src/main.tsx') return `import ${JSON.stringify(here + 'film-entry.jsx')};`;
    if (id === root + '/src/cinematics/level2/Level2ConsequencesSequence.tsx') {
      // Only the final 100-metric prelude needs the original mixed classroom.
      // The three-metric establishing shots stay trimmed as previously requested.
      code = code.replace(/^import (visibleClassroom|qualityClassroom) from [^\n]+;$/gm, 'const $1 = "";');
      code = replace(code, 'const cameraDrift = reduced ? 0 : Math.sin(Math.PI * clamp01(elapsed / duration));', 'const cameraDrift = 0;');
      code = replace(code, 'const cameraScale = 1.04 + cameraDrift * 0.045;', 'const cameraScale = 1.025;');
      return replace(code, 'vignette: final ? 0.62 : 0.35', 'vignette: 0');
    }
  } }, viteSingleFile()],
};
