import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';
// Only the dependency files actually imported by approved REV-04 are vendored.
const root = resolve(fileURLToPath(new URL('../level1-source/', import.meta.url)));
const here = fileURLToPath(new URL('.', import.meta.url));
export default {
  root, base: './',
  // Partner TSX uses the automatic JSX runtime; preserve that contract here.
  esbuild: { jsx: 'automatic' },
  resolve: {
    dedupe: ['react', 'react-dom', 'remotion', '@remotion/player'],
    alias: { '@partner': root + '/src', '@partner-assets': root + '/assets', '@preview-rev04': here + 'rev04.mjs', '@preview-pacing': here + 'pacing.mjs', '@preview-presentation': here + 'presentation.jsx', '@preview-transitions': here + 'transitions.mjs' },
  },
  plugins: [{ name: 'independent-level1-film', enforce: 'pre', transform(code, id) {
    if (id === root + '/src/main.tsx') return readFileSync(here + 'cinematic-entry.jsx', 'utf8');
    if (id === root + '/src/cinematics/level1/ConsequenceScene.tsx') {
      // Freeze framing in this review build only; keep original prop animations.
      const start = code.indexOf('  const cameraPose = {');
      const end = code.indexOf('\n  };', start);
      if (start < 0 || end < start) throw new Error('Review the partner camera adapter: source structure changed.');
      return code.slice(0, start) + '  const cameraPose = { scale: 1.025, x: 0, y: 0, vignette: 0 };' + code.slice(end + '\n  };'.length).replace('<div className="l1-scene-shading" />', '');
    }
  } }, viteSingleFile()],
};
