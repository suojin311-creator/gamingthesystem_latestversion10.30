import { fileURLToPath } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { levelOneFilmPlugin } from '../level1-film.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default {
  root, base: './',
  plugins: [levelOneFilmPlugin(), { name: 'independent-level1-settlement', enforce: 'pre',
    transform(code, id) { if (id === root + 'src/main.tsx') return "import './previews/level1-settlement/entry';"; },
  }, viteSingleFile()],
  build: { target: 'es2022' },
};
