import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
const checks=[];const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name)};
try {
 const {default:Comparison}=await server.ssrLoadModule('/src/levels/level3/WeightComparison.tsx');
 const {effortAt}=await server.ssrLoadModule('/src/levels/level3/weights.ts');
 const {nextExperiment}=await server.ssrLoadModule('/src/levels/level3/experiments.ts');
 const ids=['prep','part','peer'];
 const run=(weights,round,metricIds=ids)=>({round,kind:'player',metricIds,weights});
 const cells=html=>[...html.matchAll(/<tr data-metric="([^"]+)">([\s\S]*?)<\/tr>/g)].map(match=>({id:match[1],changes:[...match[2].matchAll(/<td[^>]*data-effort-change="([^"]+)"/g)].map(cell=>cell[1])}));
 check('Weight changes within steady effort stay explicitly Same effort, for genuinely similar distributions',()=>{
  const html=renderToStaticMarkup(React.createElement(Comparison,{runs:[run([34,33,33],1),run([36,32,32],2),run([31,35,34],3)]}));
  assert.deepEqual(cells(html),ids.map(id=>({id,changes:['baseline','same','same']})));
  for(const label of ['Effort vs First test','Effort vs Second test','Same effort'])assert.ok(html.includes(label));
  assert.ok(!html.includes('data-changed='));assert.ok(html.includes('Same effort compared with First test'));
 });
 check('Actual intensity changes are labelled against the immediately previous test',()=>{
  const html=renderToStaticMarkup(React.createElement(Comparison,{runs:[run([70,20,10],1),run([34,33,33],2),run([10,70,20],3)]}));
  assert.deepEqual(cells(html),[{id:'prep',changes:['baseline','less','less']},{id:'part',changes:['baseline','more','more']},{id:'peer',changes:['baseline','more','less']}]);
  for(const label of ['More effort','Less effort'])assert.ok(html.includes(label));
 });
 check('Comparisons follow each metric identity through reordered runs and distinguish changed weights from unchanged effort',()=>{
  const reordered=renderToStaticMarkup(React.createElement(Comparison,{runs:[run([34,33,33],1),run([33,34,33],2,['peer','prep','part']),run([35,31,34],3,['part','peer','prep'])]}));
  assert.deepEqual(cells(reordered),ids.map(id=>({id,changes:['baseline','same','same']})));
  const reorderedChanges=renderToStaticMarkup(React.createElement(Comparison,{runs:[run([70,20,10],1),run([33,34,33],2,['peer','prep','part']),run([70,20,10],3,['part','peer','prep'])]}));
  assert.deepEqual(cells(reorderedChanges),[{id:'prep',changes:['baseline','less','less']},{id:'part',changes:['baseline','more','more']},{id:'peer',changes:['baseline','more','less']}]);
  const html=renderToStaticMarkup(React.createElement(Comparison,{runs:[run([70,20,10],1),run([80,10,10],2),run([10,70,20],3)]}));
  assert.deepEqual(cells(html),[{id:'prep',changes:['baseline','same','less']},{id:'part',changes:['baseline','same','more']},{id:'peer',changes:['baseline','same','same']}]);
 });
 check('All trio prompts stay concise without requiring a purpose choice or supplying numerical answers',()=>{
  const all=['prep','part','focus','discuss','reflect','peer'];
  const trios=all.flatMap((a,i)=>all.slice(i+1).flatMap((b,j)=>all.slice(i+j+2).map(c=>[a,b,c])));
  for(const ids of trios)for(const history of [[],[[70,20,10]],[[45,45,10]],[[34,33,33]],[[70,20,10],[45,45,10]],[[34,33,33],[40,30,30]],[[43,29,28],[34,33,33]]]){
   const plan=nextExperiment(history.map((w,i)=>run(w,i+1,ids)));
   assert.equal((plan.question.match(/\?/g)||[]).length,1);assert.ok(plan.question.split(/\s+/).length<=22,plan.question);
   assert.equal(plan.suggestion,undefined);assert.ok(plan.hint);
  }
 });
 check('Two-trial comparison preserves the same evidence labels without a synthetic third column',()=>{
  for(const weights of [[34,33,33],[80,10,10],[10,70,20]]) {
   const records=[run([70,20,10],1),run(weights,2)],snapshot=JSON.stringify(records);
   const html=renderToStaticMarkup(React.createElement(Comparison,{runs:records}));
   assert.equal(cells(html).length,3);
   assert.ok(cells(html).every(row=>row.changes.length===2));
   assert.ok(html.includes('First test'));assert.ok(html.includes('Second test'));assert.ok(!html.includes('Third test'));
   assert.ok(!html.includes('System reference'));assert.ok(!html.includes('Keep Alex exploring'));
   assert.equal(JSON.stringify(records),snapshot);
  }
 });
 check('All 20 trios display every actual observation and match effort changes by metric identity',()=>{
  const all=['prep','part','focus','discuss','reflect','peer'];
  const trios=all.flatMap((a,i)=>all.slice(i+1).flatMap((b,j)=>all.slice(i+j+2).map(c=>[a,b,c])));
  const histories=[[[34,33,33],[40,30,30],[31,35,34]],[[70,20,10],[34,33,33],[10,70,20]],[[45,45,10],[10,45,45],[45,10,45]],[[24,25,51],[25,24,51],[25,50,25]]];
  const rank={low:0,medium:1,high:2};
  for(const trio of trios)for(const history of histories)for(const length of [2,3]) {
   const records=history.slice(0,length).map((weights,i)=>run(weights,i+1,i===1?[trio[2],trio[0],trio[1]]:trio));
   const html=renderToStaticMarkup(React.createElement(Comparison,{runs:records}));
   const expected=trio.map(id=>({id,changes:records.map((record,i)=>{
    if(i===0)return 'baseline';
    const previous=records[i-1],delta=rank[effortAt(record.weights,record.metricIds.indexOf(id))]-rank[effortAt(previous.weights,previous.metricIds.indexOf(id))];
    return delta>0?'more':delta<0?'less':'same';
   })}));
   assert.deepEqual(cells(html),expected);
  }
 });
 mkdirSync('test-results',{recursive:true});writeFileSync('test-results/task-clarity-contract-results.json',JSON.stringify({passed:checks.length,checks},null,2)+'\n');
} finally {await server.close()}
