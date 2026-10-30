import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';
const root=resolve(fileURLToPath(new URL('../level3-source/',import.meta.url)));
const here=fileURLToPath(new URL('.',import.meta.url));
export default {root,base:'./',esbuild:{jsx:'automatic'},resolve:{dedupe:['react','react-dom'],alias:{'@partner':root+'/src'}},
 plugins:[{name:'approved-level3a-entry',enforce:'pre',transform(code,id){if(id===root+'/src/main.tsx')return `import ${JSON.stringify(here+'film-entry.jsx')};`;}},viteSingleFile()]};
