import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const checks = [];
const check = (name, run) => { run(); checks.push(name); console.log('PASS', name); };
try {
  const { workbenchDialogue: talk, weightPattern, weightedSceneAction, weightedSceneReply, comparisonDialogue } = await server.ssrLoadModule('/src/levels/level3/dialogue.ts');
  const { cinematicRequest, compareRuns, comparisonSummary } = await server.ssrLoadModule('/src/levels/level3/data.ts');
  const { observationDialogue, classroomDialogue } = await server.ssrLoadModule('/src/levels/level2/dialogue.ts');
  const { sceneRequest } = await server.ssrLoadModule('/src/levels/level2/data.ts');
  const { METRICS } = await server.ssrLoadModule('/src/levels/level1/metrics.ts');
  const { canCompare, meetsExperiment } = await server.ssrLoadModule('/src/levels/level3/experiments.ts');
  const { effortAt, isNearEven } = await server.ssrLoadModule('/src/levels/level3/weights.ts');
  const ids = METRICS.map(m => m.id);
  const trios = ids.flatMap((a, i) => ids.slice(i + 1).flatMap((b, j) => ids.slice(i + j + 2).map(c => [a, b, c])));
  assert.equal(trios.length, 20);
  const makeRun = (metricIds, weights, round = 1, kind = 'player') => ({ round, kind, metricIds, weights });
  const splitCases = [[80,10,10],[70,20,10],[20,70,10],[45,45,10],[45,10,45],[46,43,11],[34,33,33],[40,30,30],[31,35,34],[50,25,25],[24,25,51]];
  check('Every valid integer split uses the 10-point near-even boundary and the relative one/two higher-reward or graduated family', () => {
    for (let a = 1; a <= 98; a++) for (let b = 1; b < 100-a; b++) {
      const w = [a,b,100-a-b];
      const levels=w.map((_,i)=>effortAt(w,i));
      const expected = isNearEven(w) ? 'near-even' : levels.includes('medium') ? 'mixed' : levels.filter(level=>level==='high').length===2 ? 'two-higher' : 'one-higher';
      assert.equal(weightPattern(makeRun(ids.slice(0,3), w)), expected);
    }
  });
  check('All 20 trios have concise reviews naming actual low-effort tasks; covered tasks expose the scoring stopping rule', () => {
    const reviews = new Set();
    for (const trio of trios) {
      const families = [[70,20,10],[45,45,10],[34,33,33]].map(weights => {
        const run = makeRun(trio, weights);
        for (const phase of ['choose','weights','publish','compare']) assert.deepEqual(talk(phase,'Riley','first',[run]), []);
        const review = talk('result','Riley','first',[run]);
        assert.equal(review.length,3); assert.equal(review[0].name,'Riley');
        assert.equal(review.filter(line=>line.speaker==='Alex').length,2);
        assert.ok(review.every(line=>line.text.length && !line.text.includes('undefined')));
        assert.ok(review.every(line=>line.text.split(/\s+/).length<=18));
        if (weights.some((_,i)=>effortAt(weights,i)==='low')) {
          const lower = trio.filter((_,i)=>effortAt(weights,i)==='low').map(id=>METRICS.find(m=>m.id===id).shortName);
          lower.forEach(name=>assert.ok(review.some(line=>line.text.includes(name))));
        } else {
          assert.match(review[1].text,/extra points/);assert.match(review[2].text,/I’m done/);
        }
        reviews.add(JSON.stringify(review));return review;
      });
      assert.equal(new Set(families.map(f=>f[0].text)).size,3);
    }
    assert.ok(reviews.size>=41);
  });
  check('Medium scene actions and score-based stopping replies depend on the task effort, including graduated priorities', () => {
    for(const trio of trios)for(let index=0;index<3;index++) {
      const actionByShare=[];
      for(const base of [[33,34,33],[30,60,10],[33,55,12]]) {
        const weights=[1,1,1];weights[index]=base[0];weights[(index+1)%3]=base[1];weights[(index+2)%3]=base[2];
        const request=cinematicRequest('weights','Riley',[makeRun(trio,weights)]);
        assert.equal(request.shots[index].effort,'medium');
        actionByShare.push(weightedSceneAction(request,index));
        assert.match(weightedSceneReply(request,index),/requirement|criteri|mark|point|tick|box|checklist|required|format|rubric|count/i);
      }
      assert.equal(new Set(actionByShare).size,1);
      const runs=[[34,33,33],[36,32,32],[31,35,34]].map((weights,i)=>makeRun(trio,weights,i+1));
      const replies=runs.map((_,i)=>weightedSceneReply(cinematicRequest('weights','Riley',runs.slice(0,i+1)),index));
      assert.equal(new Set(replies).size,3);
      assert.equal(weightedSceneAction(cinematicRequest('weights','Riley',runs),index),actionByShare[0]);
    }
  });
  check('Second-result questions describe actual increases, decreases and unchanged effort bands', () => {
    const trio=ids.slice(0,3);
    const question=(a,b)=>talk('result','Riley','different',[makeRun(trio,a),makeRun(trio,b,2)])[0].text;
    assert.match(question([70,20,10],[20,70,10]),/from Preparation to Participation/);
    assert.match(question([70,20,10],[80,10,10]),/same routine/);
    assert.match(question([34,33,33],[40,30,30]),/change your goal/);
    assert.match(question([70,20,10],[34,33,33]),/What made you stop/);
    assert.match(question([45,45,10],[70,20,10]),/ease off on Participation/);
  });
  check('Both two-trial and three-trial comparisons describe actual effort without assuming an improvement or a shift', () => {
    const cases=[[[70,20,10],[34,33,33]],[[34,33,33],[70,20,10]],[[70,20,10],[80,10,10]],[[34,33,33],[40,30,30]],[[70,20,10],[34,33,33],[10,70,20]],[[34,33,33],[40,30,30],[31,35,34]]];
    for (const sequence of cases) {
      const runs=sequence.map((weights,i)=>makeRun(ids.slice(0,3),weights,i+1));
      assert.ok(canCompare(runs));
      assert.equal(!!compareRuns(runs),runs.some(run=>isNearEven(run.weights))&&runs.some(run=>!isNearEven(run.weights)));
      const same=runs.slice(1).every(run=>run.metricIds.every((id,i)=>effortAt(run.weights,i)===effortAt(runs[0].weights,runs[0].metricIds.indexOf(id))));
      assert.match(comparisonSummary(runs),same?/same effort pattern/:/shifts effort/);
      assert.ok(!JSON.stringify(comparisonDialogue('Riley',runs)).includes('Balancing the weights helped'));
      const request=cinematicRequest('comparison','Riley',runs);
      assert.equal(request.runs.length,runs.length);assert.equal(request.decision,undefined);
    }
    const fixed=[[34,33,33],[36,32,32],[31,35,34]].map((weights,i)=>makeRun(ids.slice(0,3),weights,i+1));
    const shifted=[[70,20,10],[34,33,33],[10,70,20]].map((weights,i)=>makeRun(ids.slice(0,3),weights,i+1));
    assert.notEqual(comparisonSummary(fixed),comparisonSummary(shifted));
    assert.doesNotMatch(JSON.stringify(comparisonDialogue('Riley',fixed)),/\b(?:moved|shifted|switched)\b.*\beffort\b/i);
    const reordered=[makeRun(['prep','part','focus'],[70,20,10]),makeRun(['part','focus','prep'],[10,20,70],2),makeRun(['focus','prep','part'],[15,75,10],3)];
    assert.match(comparisonSummary(reordered),/same effort pattern/);
  });
  let paths=0;
  check('No dialogue or emoji repeats across complete trial paths, including graduated priorities and unchanged scene intensity', () => {
    for (const trio of trios) for (const first of splitCases) for (const second of splitCases) {
      if(JSON.stringify(first)===JSON.stringify(second))continue;
      const runs=[]; const story=[];
      const append=lines=>story.push(...lines.map(line=>({speaker:line.speaker==='Maya'||line.speaker==='Riley'?'teacher':line.speaker,text:line.text})));
      append(talk('weights','Riley','first',runs));
      for(const weights of [first,second]) {
        if(runs.length)append(talk('weights','Riley','different',runs));
        runs.push(makeRun(trio,weights,runs.length+1));
        append(talk('publish','Riley',runs.length===1?'first':'different',runs));
        const request=cinematicRequest('weights','Riley',runs);
        append(request.shots.map((_,i)=>({speaker:'Alex',text:weightedSceneReply(request,i)})));
        append(talk('result','Riley',runs.length===1?'first':'different',runs));
      }
      const third=splitCases.find(weights=>meetsExperiment(weights,runs));
      {
        assert.ok(third);
        runs.push(makeRun(trio,third,3));
        append(talk('publish','Riley','different',runs));
        const request=cinematicRequest('weights','Riley',runs);
        append(request.shots.map((_,i)=>({speaker:'Alex',text:weightedSceneReply(request,i)})));
        append(talk('result','Riley','different',runs));
      }
      append(talk('compare','Riley','different',runs));append(comparisonDialogue('Riley',runs));
      for(const metric of METRICS){
        const earlier=[...metric.scene.map(line=>({speaker:line.speaker==='Maya'?'teacher':line.speaker,text:line.text})),{speaker:'teacher',text:metric.reviewQuestion},...metric.studentReplies.map(text=>({speaker:'Alex',text}))];
        for(const count of [3,6,100]) earlier.push(...classroomDialogue(sceneRequest(count,trio,'Riley')).map(line=>({speaker:line.speaker==='Riley'?'teacher':line.speaker,text:line.text})));
        for(const count of [3,6,100])earlier.push(...observationDialogue(count===100,count,trio,'Riley').map(line=>({speaker:line.speaker==='Maya'?'teacher':line.speaker,text:line.text})));
        const full=[...earlier,...story];
        const normalized=full.map(line=>`${line.speaker}:${line.text.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'')}`);
        assert.equal(new Set(normalized).size,normalized.length,JSON.stringify({trio,first,second,duplicates:normalized.filter((text,i)=>normalized.indexOf(text)!==i)}));
        const emojis=full.flatMap(line=>[...line.text.matchAll(/\p{Extended_Pictographic}/gu)].map(match=>match[0]));
        assert.equal(new Set(emojis).size,emojis.length);
        paths++;
      }
      // Changing a reply never changes the scene IDs, effort rules or replayed request.
      const request=cinematicRequest('weights','Riley',runs);
      const snapshot=JSON.stringify(request);
      request.shots.forEach((shot,i)=>{
        assert.equal(shot.effort,effortAt(runs.at(-1).weights,i));
        assert.equal(weightedSceneReply(request,i),weightedSceneReply(request,i));
      });
      assert.equal(JSON.stringify(request),snapshot);
    }
    assert.equal(paths,trios.length*splitCases.length*(splitCases.length-1)*METRICS.length);
  });
  check('Six Level 1 review questions and all 20 Level 2 trio exchanges differ; player names remain supplied text', () => {
    assert.equal(new Set(METRICS.map(m=>m.reviewQuestion)).size,6);
    const seen=new Set();
    for(const trio of trios){
      const lines=observationDialogue(false,3,trio,'Alex');
      assert.equal(lines[0].speaker,'Maya');assert.equal(lines[0].name,'Alex');
      seen.add(JSON.stringify(lines));
    }
    assert.equal(seen.size,20);
  });
  mkdirSync('test-results',{recursive:true});
  writeFileSync('test-results/dialogue-narrative-results.json',JSON.stringify({passed:checks.length,checks,completeTrialPaths:paths},null,2)+'\n');
} finally { await server.close(); }
