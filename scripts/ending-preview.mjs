import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),build=resolve(root,'node_modules/.cache/ending-preview');
const sources=[['ENDING_ANIMATION_SOURCE','e467998dfb07abc028e4e0fcb5567006e4eaa07d'],['LEVEL3_ANIMATION_SOURCE','ba9f81ee619c14b3342104228cdd2a5cc2bc2b3b']];
function run(command,args,options={}){const r=spawnSync(command,args,{cwd:root,encoding:'utf8',...options});if(r.error)throw r.error;if(r.status!==0)throw new Error(r.stderr||command+' failed');return r.stdout;}
for(const [env,pin]of sources){const dir=process.env[env];if(!dir||run('git',['-C',dir,'rev-parse','HEAD']).trim()!==pin)throw new Error('Use the pinned read-only source: '+env);run('git',['-C',dir,'diff','--quiet','HEAD']);}
run(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'build','--config',resolve(root,'scripts/ending-animation/preview.config.mjs'),'--outDir',build,'--emptyOutDir'],{stdio:'inherit'});
const sha=b=>createHash('sha256').update(b).digest('hex');
const paths=[...readdirSync(resolve(root,'scripts/ending-animation')).map(n=>'scripts/ending-animation/'+n),'scripts/cinematic-dissolve.mjs','scripts/level3-animation/cinematic.config.mjs','src/cinematics/opening/styles.css','src/cinematics/ending/input.ts','src/cinematics/level3/mapping.mjs','src/shared/data/cinematicPalette.js','src/levels/level3/data.ts','src/levels/level3/weights.ts','src/levels/level3/dialogue.ts','src/shared/data/metrics.ts'];
writeFileSync(resolve(build,'source-manifest.json'),JSON.stringify({sources:sources.map(([env,commit])=>({source:env,commit})),sourceSha256:sha(Buffer.concat(paths.map(p=>Buffer.concat([Buffer.from(p+'\0'),readFileSync(resolve(root,p))])))),htmlSha256:sha(readFileSync(resolve(build,'index.html')))},null,2)+'\n');
run('python3',[resolve(root,'scripts/package_ending_preview.py'),build],{stdio:'inherit'});
