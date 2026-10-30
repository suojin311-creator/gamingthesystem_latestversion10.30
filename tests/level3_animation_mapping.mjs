import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {adaptationClips,METRICS,INTENSITIES} from '../src/cinematics/level3/mapping.mjs';
import {effortAt} from '../src/levels/level3/weights.ts';
import {createPacing,sampleAt} from '../scripts/level3-animation/pacing.mjs';
const {suppliedClips,storyboardId,participationBeat}=await import(pathToFileURL(resolve('scripts/level3-source/src/cinematics/level3/adaptationTimeline.ts')));
const ids=Object.keys(METRICS);
const request=(trio,weights)=>({kind:'weights',shots:trio.map((metricId,i)=>({metricId,effort:effortAt(weights,i),sceneId:`level3.${metricId}.${effortAt(weights,i)}`,caption:'The task caption.'}))});
test('all 4851 valid allocations map each game effort to exactly the supplied Level 3A state',()=>{
 let count=0;
 for(let a=1;a<=98;a++)for(let b=1;b<100-a;b++){
  const weights=[a,b,100-a-b];
  for(const trio of [ids.slice(0,3),ids.slice(3)]){
   const clips=adaptationClips(request(trio,weights));
   const input={selectedMetrics:clips.map(c=>c.metric),weights:{},intensity:Object.fromEntries(clips.map(c=>[c.metric,c.intensity]))};
   assert.deepEqual(suppliedClips({requestId:'mapping',input}),clips.map(({metric,intensity})=>({metric,intensity})));
   clips.forEach((c,i)=>assert.equal(c.intensity,INTENSITIES[effortAt(weights,i)]));
  }count++;
 }assert.equal(count,4851);
});
test('every trio and order preserve metric identity and explicit supplied states, regardless of numeric weights',()=>{
 const permutations=([a,b,c])=>[[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];
 const seen=new Set();
 for(let a=0;a<4;a++)for(let b=a+1;b<5;b++)for(let c=b+1;c<6;c++)for(const trio of permutations([ids[a],ids[b],ids[c]])){
  const r=request(trio,[60,30,10]);
  r.shots.forEach((s,i)=>{s.effort=['low','high','medium'][i];s.weight=[98,1,1][i];});
  const clips=adaptationClips(r);
  clips.forEach((clip,i)=>{assert.equal(clip.metric,METRICS[trio[i]]);assert.equal(clip.intensity,INTENSITIES[r.shots[i].effort]);seen.add(storyboardId(clip));});
 }assert.equal(seen.size,18);
 assert.throws(()=>adaptationClips({kind:'comparison',shots:[]}));
 assert.throws(()=>adaptationClips({kind:'weights',shots:[{metricId:'prep',effort:'unknown'}]}));
});
test('approved original clip windows retain all acting beats instead of earlier editorial crops',()=>{
 for(const metric of Object.values(METRICS))for(const intensity of Object.values(INTENSITIES)){
  const clips=[{metric,intensity,caption:'A supplied line.'},...Object.values(METRICS).filter(m=>m!==metric).slice(0,2).map(m=>({metric:m,intensity:'Medium',caption:'A supplied line.'}))];
  const p=createPacing(clips),first=p.timeline[0];
  assert.equal(sampleAt(p,0).phase,'entry');
  assert.ok(sampleAt(p,first.start+.001).clipTime<.01);
  assert.ok(sampleAt(p,first.end-.001).clipTime>3.99);
  assert.equal(sampleAt(p,p.duration).phase,'exit');
 }
});
test('reading holds cover each complete game-supplied line and end on the last actual task',()=>{
 const r=request(['prep','discuss','peer'],[60,30,10]);
 r.shots[0].caption='A longer supplied sentence remains readable while the actual preparation action completes without an unrelated cutaway.';
 const p=createPacing(adaptationClips(r));
 for(const clip of p.timeline)assert.ok(clip.end-clip.start>=clip.caption.split(/\s+/).length*.27+.4);
 assert.equal(sampleAt(p,p.duration).sceneId,r.shots[2].sceneId);
});
