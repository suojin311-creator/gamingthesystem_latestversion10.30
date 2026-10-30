import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
const checks=[];
const check=(name,run)=>{run();checks.push(name);console.log('PASS',name)};
try {
 const {nextExperiment,meetsExperiment,experimentHint,MIN_TRIALS,MAX_TRIALS,canCompare,canTryAgain}=await server.ssrLoadModule('/src/levels/level3/experiments.ts');
 const {validWeights,effortAt}=await server.ssrLoadModule('/src/levels/level3/weights.ts');
 const {copyRun,cinematicRequest,effortChanged}=await server.ssrLoadModule('/src/levels/level3/data.ts');
 const {workbenchDialogue}=await server.ssrLoadModule('/src/levels/level3/dialogue.ts');
 const ids=['prep','part','focus','discuss','reflect','peer'];
 const trios=ids.flatMap((a,i)=>ids.slice(i+1).flatMap((b,j)=>ids.slice(i+j+2).map(c=>[a,b,c])));
 const run=(weights,round=1,metricIds=ids.slice(0,3))=>({round,kind:'player',metricIds,weights});

 check('The initial question has no implied earlier allocation or preferred balance, and later questions follow the actual evidence',()=>{
  const first=nextExperiment([]);
  assert.equal(first.question,'How would you split the 100%?');
  assert.doesNotMatch(JSON.stringify(first),/different|even|equal|balance|higher|lower/i);
  assert.match(first.hint,/Move any slider/);
  const neglected=nextExperiment([run([70,20,10])]);
  assert.match(neglected.question,/Participation and Focus/);
  assert.equal(neglected.hint,'Give a neglected task more weight. Watch what happens to the others.');
  assert.doesNotMatch(neglected.hint,/even|equal|balance|\d/);
  const covered=nextExperiment([run([34,33,33])]);
  assert.equal(covered.question,'All three got attention. Has that solved the problem?');
  assert.match(covered.hint,/still stop once the criteria are met/);
  assert.doesNotMatch(covered.hint,/even|equal|balance/);
 });

 check('Two real observations unlock comparison; a third experiment is optional and no fourth can run',()=>{
  assert.equal(MIN_TRIALS,2);assert.equal(MAX_TRIALS,3);
  const records=[[70,20,10],[34,33,33],[20,70,10]].map((weights,i)=>run(weights,i+1));
  for(let count=0;count<=3;count++) {
   const history=records.slice(0,count);
   assert.equal(canCompare(history),count>=2);
   assert.equal(canTryAgain(history),count<3);
  }
  assert.ok(!meetsExperiment([45,45,10],records));
  assert.ok(!canCompare([...records,run([45,45,10],4)]));
 });

 check('Every new positive split is valid for the second and optional third trials, including unchanged effort bands',()=>{
  for(const history of [[],[[70,20,10]],[[34,33,33]],[[70,20,10],[80,10,10]],[[34,33,33],[40,30,30]],[[70,20,10],[34,33,33]]]){
   const runs=history.map((weights,i)=>run(weights,i+1)),saved=JSON.stringify(runs);
   for(let a=1;a<=98;a++)for(let b=1;b<100-a;b++){
    const weights=[a,b,100-a-b];
    assert.equal(meetsExperiment(weights,runs),!history.some(old=>old.every((v,i)=>v===weights[i])));
   }
   assert.equal(JSON.stringify(runs),saved);
   for(const invalid of [[61,39,0],[99,0,1],[20,20,20],[33.5,33.5,33]])assert.ok(!meetsExperiment(invalid,runs));
  }
  assert.ok(meetsExperiment([40,31,29],[run([40,30,30])]));
  assert.ok(meetsExperiment([31,35,34],[run([34,33,33]),run([36,32,32],2)]));
  assert.match(experimentHint(),/already|tested|different|new/i);
 });

 check('All 20 trios receive concise observation-based questions and optional text hints without prefilled solutions',()=>{
  assert.equal(trios.length,20);
  const histories=[[],[[70,20,10]],[[45,45,10]],[[34,33,33]],[[50,25,25]],[[70,20,10],[80,10,10]],[[70,20,10],[34,33,33]],[[34,33,33],[70,20,10]],[[34,33,33],[40,30,30]]];
  const questions=new Set();
  for(const metricIds of trios)for(const history of histories){
   const runs=history.map((weights,i)=>run(weights,i+1,metricIds)),saved=JSON.stringify(runs);
   const plan=nextExperiment(runs);
   assert.equal(plan.purpose,!runs.length?'explore':runs.length===1?'respond':'verify');
   assert.equal((plan.question.match(/\?/g)||[]).length,1,plan.question);
   assert.ok(plan.question.split(/\s+/).length<=22,plan.question);
   assert.ok(plan.hint);
   assert.equal(plan.suggestion,undefined);
   assert.doesNotMatch(plan.hint,/\b\d+\s*%|\b\d+\s*\/\s*\d+/);
   assert.doesNotMatch(JSON.stringify(plan),/undefined/);
   assert.equal(JSON.stringify(runs),saved);
   questions.add(plan.question);
  }
  assert.ok(questions.size>=5,'Prompts must distinguish observed coverage, changes and repeated patterns.');
 });

 check('Every possible split gives a review of actual neglected tasks or score-based stopping; effort-change detection respects task identity',()=>{
  const baseline=run([34,33,33]);
  for(let a=1;a<=98;a++)for(let b=1;b<100-a;b++){
   const weights=[a,b,100-a-b],record=run(weights),lines=workbenchDialogue('result','Riley','first',[record]);
   assert.equal(lines.length,3);
   const text=lines.map(line=>line.text).join(' ');
   const low=record.metricIds.filter((_,i)=>effortAt(weights,i)==='low');
   if(!low.length) {
    assert.match(text,/done|stop|point|mark|requirement/i);
    assert.doesNotMatch(text,/rushed|quick version|little time/i);
   } else {
    for(const [index,name] of ['Preparation','Participation','Focus'].entries())if(effortAt(weights,index)==='low')assert.ok(text.includes(name),JSON.stringify({weights,text,name}));
   }
   assert.doesNotMatch(text,/learning improved|learned more|better learning/i);
   assert.equal(effortChanged(baseline,record),weights.some((_,i)=>effortAt(weights,i)!=='medium'));
   assert.ok(!effortChanged(record,{...record,metricIds:['focus','prep','part'],weights:[weights[2],weights[0],weights[1]]}));
  }
 });

 check('New trial and cinematic records need neither intent nor decision, and copied observations remain independent',()=>{
  for(const metricIds of trios){
   const records=[run([70,20,10],1,metricIds),run([34,33,33],2,metricIds)];
   const before=JSON.stringify(records),request=cinematicRequest('comparison','Riley',records);
   assert.equal(request.decision,undefined);
   assert.ok(request.runs.every(record=>record.intent===undefined));
   const copy=copyRun(records[0]);copy.weights[0]=1;copy.metricIds[0]='peer';
   request.runs[1].weights[0]=1;request.runs[1].metricIds.length=0;
   assert.equal(JSON.stringify(records),before);
   assert.ok(validWeights(records[0].weights));
  }
 });
 mkdirSync('test-results',{recursive:true});
 writeFileSync('test-results/experiment-rules-results.json',JSON.stringify({passed:checks.length,checks},null,2)+'\n');
} finally {await server.close()}
