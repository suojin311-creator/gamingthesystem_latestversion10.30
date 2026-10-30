import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';
if (!process.env.LEVEL3_ANIMATION_SOURCE) throw new Error('Set LEVEL3_ANIMATION_SOURCE to the pinned Level 3A delivery.');
const root = resolve(process.env.LEVEL3_ANIMATION_SOURCE);
const here = fileURLToPath(new URL('.', import.meta.url));
const replace = (code, from, to) => { if (!code.includes(from)) throw new Error('Review Level 3A adapter: missing ' + from); return code.replace(from, to); };
export default {
  root, base: './',
  resolve: { dedupe: ['react', 'react-dom'], alias: { '@partner': root + '/src' } },
  plugins: [{ name: 'game-owned-level3a-only', enforce: 'pre', transform(code, id) {
    if (id === root + '/src/main.tsx') return `import ${JSON.stringify(here + 'film-entry.jsx')};`;
    if (id !== root + '/src/cinematics/level3/MetricAdaptationScene.tsx') return;
    // The single portrait was explicitly rejected. Never import/display it.
    code = replace(code, "import highFocus from '../../../docs/visual-style/references/level3-metric-adaptations/REF-L3A-S10 — High On-Task Focus.png';", 'const highFocus = "";');
    code = replace(code, "source = { url: highFocus, width: 1672, height: 940, crop: [0, 0, 1672, 940] };", "source = panel(metric, 'High', [8, 85, 670, 377]);");
    code = replace(code, "beat === 'listen' ? [8, 150, 625, 352] : beat === 'raise' ? [100, 0, 420, 236] : beat === 'reaction' ? [388, 260, 240, 135] : [145, 210, 420, 236]", '[8, 150, 625, 352]');
    // Keep Alex present while the useful task/criteria props animate beside him.
    const start = code.indexOf("    if (metric === 'pre-class-preparation' && intensity === 'High' && time < 0.65) {");
    const end = code.indexOf('      // Tight actor crop', start);
    if (start < 0 || end < 0) throw new Error('Review Level 3A preparation framing.');
    code = code.slice(0, start) + '    {\n' + code.slice(end);
    code = code.replace(/^import readingProp from [^\n]+;$/m, 'const readingProp = "";');
    code = replace(code, "    if (beat === 'consult-card') source = { url: discussionProp, width: 1536, height: 1024, crop: [35, 90, 800, 450] };", '');
    code = replace(code, '[...Object.values(SOURCES), highFocus, classroom, readingProp, discussionProp]', 'Object.values(SOURCES)');
    // Fixed framing avoids compound zooms during a cross-dissolve.
    code = replace(code, "scale: 1 + travel * (metric === 'on-task-focus' ? 0.045 : 0.022), x: desk ? -travel * 0.5 : travel * 0.3, y: 0, vignette: 0.28", 'scale: 1.025, x: 0, y: 0, vignette: 0');
    return code;
  } }, viteSingleFile()],
};
