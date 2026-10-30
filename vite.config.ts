import { endingFilmPlugin } from './scripts/ending-film.mjs';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { levelOneFilmPlugin } from './scripts/level1-film.mjs';
import { levelTwoFilmPlugin } from './scripts/level2-film.mjs';
import { levelThreeFilmPlugin } from './scripts/level3-film.mjs';

export default defineConfig({
  base: './',
  plugins: [levelOneFilmPlugin(), levelTwoFilmPlugin(), levelThreeFilmPlugin(), endingFilmPlugin(), viteSingleFile()],
  build: { target: 'es2022', reportCompressedSize: false },
});
