import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
const checks=[];const check=(name,run)=>{run();checks.push(name);console.log('PASS',name)};
try{
 const {copyRun,cinematicRequest,compareRuns}=await server.ssrLoadModule('/src/levels/level3/data.ts');
 const {sceneRequest}=await server.ssrLoadModule('/src/levels/level2/data.ts');
 check('Actual trial snapshots and partner/comparison copies remain independent after removing the forecast layer',()=>{
  const run={round:1,kind:'player',metricIds:['prep','part','focus'],weights:[70,20,10]};
  const baseline=JSON.stringify(run),copy=copyRun(run);copy.metricIds[0]='peer';copy.weights[0]=12;
  const second={...run,round:2,weights:[34,33,33]};
  const request=cinematicRequest('weights','Jordan',[run,second]);request.runs[0].metricIds.length=0;request.runs[1].weights[0]=50;
  const compared=compareRuns([run,second]);compared.uneven.weights[0]=40;
  assert.equal(JSON.stringify(run),baseline);assert.deepEqual(second.weights,[34,33,33]);
  assert.ok(!('predictedMetricIds' in request.runs[0]));
 });
 check('All 20 trios retain the original animation request fields without generated peer-story data',()=>{
  const ids=['prep','part','focus','discuss','reflect','peer'];
  const trios=ids.flatMap((a,i)=>ids.slice(i+1).flatMap((b,j)=>ids.slice(i+j+2).map(c=>[a,b,c])));
  for(const trio of trios)for(const count of [3,6,100]){
   const request=sceneRequest(count,trio,'Jordan');assert.deepEqual(Object.keys(request).sort(),['branch','kind','metricCount','playerName','sceneId','selectedMetricIds'].sort());
   assert.deepEqual(request.selectedMetricIds,trio);assert.equal(request.playerName,'Jordan');assert.equal(request.metricCount,count);
   request.selectedMetricIds.length=0;assert.deepEqual(sceneRequest(count,trio,'Jordan').selectedMetricIds,trio);
  }
 });
 mkdirSync('test-results',{recursive:true});writeFileSync('test-results/learning-contract-results.json',JSON.stringify({passed:checks.length,checks},null,2)+'\n');
}finally{await server.close()}
