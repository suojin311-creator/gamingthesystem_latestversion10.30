import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { startAllocation, allocateWeight, canRun, confirmWeight, effortAt, goalMet, isNearEven, maximumWeight, spread, validWeights, MIN_WEIGHT, MAX_WEIGHT } from '../src/levels/level3/weights.ts';

const checks = [];
const check = (name, run) => { run(); checks.push(name); console.log('PASS', name); };
check('Starting with any card creates an exact positive allocation from the requested value, including safe bounds and no preferred first split', () => {
  for (let index = 0; index < 3; index++) for (let requested = -2; requested <= 102; requested++) {
    const next = startAllocation(index, requested);
    assert.ok(validWeights(next));
    assert.equal(next[index], Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, requested)));
    const others = next.filter((_, i) => i !== index);
    assert.ok(Math.abs(others[0] - others[1]) <= 1);
    assert.deepEqual(startAllocation(index, requested), next);
    const confirmed = confirmWeight([false, false, false], index);
    assert.equal(next[index], allocateWeight(next, confirmed, (index + 1) % 3, 20)[index]);
  }
  for (const index of [-1, 3, .5, NaN]) assert.equal(startAllocation(index, 50), null);
  for (const value of [NaN, Infinity, -Infinity]) assert.equal(startAllocation(0, value), null);
  assert.deepEqual(startAllocation(0, 70), [70,15,15]);
  assert.deepEqual(startAllocation(0, 34), [34,33,33]);
  assert.deepEqual(startAllocation(2, 98), [1,1,98]);
});
check('Every possible integer split preserves total 100, range 1–98 and deterministic proportional reallocation without reversing the edited priority', () => {
  for (let a = 1; a <= 98; a++) for (let b = 1; b < 100 - a; b++) {
    const weights = [a, b, 100 - a - b];
    assert.ok(validWeights(weights));
    assert.equal(isNearEven(weights),Math.max(...weights)-Math.min(...weights)<=10);
    assert.ok(!isNearEven(weights) || weights.every((_, i) => effortAt(weights, i) === 'medium'));
    for (let index = 0; index < 3; index++) for (const requested of Array.from({length:101},(_,i)=>i)) {
      const next = allocateWeight(weights, [false, false, false], index, requested);
      assert.ok(validWeights(next));
      const ranks={low:0,medium:1,high:2};
      if(next[index]>weights[index])assert.ok(ranks[effortAt(next,index)]>=ranks[effortAt(weights,index)],JSON.stringify({weights,next,index}));
      if(next[index]<weights[index])assert.ok(ranks[effortAt(next,index)]<=ranks[effortAt(weights,index)],JSON.stringify({weights,next,index}));
      assert.deepEqual(allocateWeight(weights,[false,false,false],index,weights[index]),weights);
      assert.deepEqual(allocateWeight(weights, [false, false, false], index, requested), next);
    }
  }
});
check('Whole-distribution effort handles one high, two high, near-even and graduated priorities in every card order', () => {
  const cases=[
    [[49,26,25],['high','low','low']],[[49,27,24],['high','low','low']],
    [[70,20,10],['high','low','low']],[[45,45,10],['high','high','low']],
    [[34,33,33],['medium','medium','medium']],[[40,30,30],['medium','medium','medium']],
    [[40,31,29],['high','medium','low']],[[60,30,10],['high','medium','low']],
    [[65,24,11],['high','medium','low']],
    [[40,50,10],['high','high','low']],[[25,50,25],['low','high','low']],
  ];
  const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  for(const [weights,expected] of cases)for(const order of orders){
    const next=order.map(i=>weights[i]);assert.ok(validWeights(next));
    assert.deepEqual(next.map((_,i)=>effortAt(next,i)),order.map(i=>expected[i]));
  }
  // The same 40% can be shared attention or a relative priority depending on
  // the other two shares. There is no absolute 24/25 or 66/67 cutoff.
  assert.equal(effortAt([40,30,30],0),'medium');
  assert.equal(effortAt([40,50,10],0),'high');
});
check('Across all 4,851 positive splits, raising a share cannot lower its own effort; equal weights and reordered cards stay consistent', () => {
  const rank={low:0,medium:1,high:2};let splits=0,transfers=0;
  const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  for(let a=1;a<=98;a++)for(let b=1;b<100-a;b++){
    const w=[a,b,100-a-b],efforts=w.map((_,i)=>effortAt(w,i));splits++;
    for(const order of orders)assert.deepEqual(order.map((_,i)=>effortAt(order.map(j=>w[j]),i)),order.map(i=>efforts[i]));
    for(let i=0;i<3;i++)for(let j=0;j<3;j++){
      if(w[i]===w[j])assert.equal(efforts[i],efforts[j]);
      if(i===j||w[j]===1)continue;
      const next=[...w];next[i]++;next[j]--;transfers++;
      assert.ok(rank[effortAt(next,i)]>=rank[efforts[i]],JSON.stringify({w,next,i}));
    }
  }
  assert.equal(splits,4851);assert.equal(transfers,28518);
});
check('Relative similarity uses an inclusive ten-point tolerance without a near-even override reducing a raised share', () => {
  assert.ok(isNearEven([40,30,30]));assert.ok(!isNearEven([40,31,29]));
  assert.deepEqual([0,1,2].map(i=>effortAt([40,30,30],i)),['medium','medium','medium']);
  assert.deepEqual([0,1,2].map(i=>effortAt([40,31,29],i)),['high','medium','low']);
  assert.equal(effortAt([40,30,30],1),effortAt([40,31,29],1));
  assert.deepEqual([0,1,2].map(i=>effortAt([50,25,25],i)),['high','low','low']);
});
check('Either remaining card confirms the pair after any first-card choice', () => {
  for (let first = 0; first < 3; first++) for (const second of [0,1,2].filter(i=>i!==first)) {
    const weights = allocateWeight([34,33,33], [false,false,false], first, 80);
    const locked = confirmWeight([false,false,false], first);
    assert.equal(locked.filter(Boolean).length,1);
    const remaining = [0,1,2].find(i=>i!==first&&i!==second);
    const next = allocateWeight(weights,locked,second,15);
    assert.equal(next[first],80);assert.equal(next[second],15);assert.equal(next[remaining],5);
    assert.ok(validWeights(next));
    const finished=confirmWeight(locked,second);
    assert.deepEqual(finished,[true,true,true]);
    assert.ok(canRun(next,finished,[34,33,33],'first'));
    for (let i=0;i<3;i++) assert.deepEqual(allocateWeight(next,finished,i,50),next);
  }
});
check('Both equal remaining sliders can move in either direction before confirmation', () => {
  const weights=[80,10,10],locked=[true,false,false];
  assert.deepEqual(allocateWeight(weights,locked,1,15),[80,15,5]);
  assert.deepEqual(allocateWeight(weights,locked,2,15),[80,5,15]);
  assert.deepEqual(allocateWeight(weights,locked,1,0),[80,1,19]);
  assert.deepEqual(allocateWeight(weights,locked,2,20),[80,1,19]);
  assert.deepEqual(weights,[80,10,10]);
});
check('Available bounds clamp safely, reserving one percent, without changing locked weights or snapshots', () => {
  const old=[70,20,10];
  assert.deepEqual(allocateWeight(old,[true,false,false],1,80),[70,29,1]);
  assert.equal(maximumWeight(old,[true,false,false],1),29);
  assert.deepEqual(allocateWeight([34,33,33],[false,false,false],0,-100),[1,50,49]);
  assert.deepEqual(allocateWeight([34,33,33],[false,false,false],0,100),[98,1,1]);
  assert.deepEqual(old,[70,20,10]);
  assert.deepEqual(allocateWeight(old,[false,false,false],0,NaN),old);
  assert.deepEqual(allocateWeight([98,1,1],[true,false,false],1,20),[98,1,1]);
});
check('Near-even accepts gaps through 10 points inclusively, rejects 11, and produces three medium shots', () => {
  for (const weights of [[36,33,31],[37,33,30],[38,33,29],[40,30,30]]) {
    for (const order of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) {
      const permuted=order.map(index=>weights[index]);
      assert.ok(isNearEven(permuted));
      assert.deepEqual([0,1,2].map(i=>effortAt(permuted,i)),['medium','medium','medium']);
    }
  }
  assert.ok(!isNearEven([40,31,29]));
  assert.ok(!isNearEven([29,40,31]));
  assert.deepEqual([0,1,2].map(i=>effortAt([34,33,33],i)), ['medium','medium','medium']);
  assert.deepEqual([0,1,2].map(i=>effortAt([49,26,25],i)),[0,1,2].map(i=>effortAt([49,27,24],i)));
});
check('Run requires all three confirmed weights (including the linked pair) and a valid complete allocation', () => {
  for (const confirmed of [[false,false,false], [true,true,false], [true,false,true], [false,true,true]]) assert.ok(!canRun([34,33,33], confirmed, [34,33,33], 'first'));
  assert.ok(canRun([70,20,10], [true,true,true], [34,33,33], 'first'));
  assert.ok(!canRun([100,0,0], [true,true,true], [34,33,33], 'first'));
  assert.ok(!canRun([61,39,0], [true,true,true], [34,33,33], 'first'));
  assert.ok(canRun([98,1,1], [true,true,true], [34,33,33], 'first'));
  assert.equal(MIN_WEIGHT,1);assert.equal(MAX_WEIGHT,98);
  assert.deepEqual(allocateWeight([61,20,19],[true,false,false],1,39),[61,38,1]);
  assert.ok(canRun([90,5,5], [true,true,true], [34,33,33], 'first'));
  for (const weights of [[30,30,30], [-1,51,50], [101,0,-1], [33.5,33.5,33]]) assert.ok(!validWeights(weights));
});
check('The second experiment requires a changed split and never forces a direction or degree of balance', () => {
  assert.ok(!goalMet([34,33,33], [34,33,33], 'different'));
  for (const weights of [[40,30,30],[33,34,33],[70,20,10]]) assert.ok(goalMet(weights,[34,33,33],'different'));
  assert.ok(!goalMet([70,20,10], [70,20,10], 'different'));
  for (const weights of [[80,10,10],[50,30,20],[34,33,33]]) assert.ok(goalMet(weights,[70,20,10],'different'));
  assert.ok(canRun([80,10,10],[true,true,true],[70,20,10],'different'));
});
mkdirSync('test-results', {recursive:true});
writeFileSync('test-results/level3-rules-results.json', JSON.stringify({passed:checks.length, checks},null,2)+'\n');
