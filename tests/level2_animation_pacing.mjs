import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createPacing, sampleAt, readingSeconds, finalCover } from '../scripts/level2-animation/pacing.mjs';

process.env.LEVEL2_ANIMATION_SOURCE ||= resolve('scripts/level2-source');
const { getLevel2Shots, shotAt } = await import(pathToFileURL(resolve(process.env.LEVEL2_ANIMATION_SOURCE, 'src/cinematics/level2/level2Timeline.ts')));
const { level2Performance } = await import(pathToFileURL(resolve(process.env.LEVEL2_ANIMATION_SOURCE, 'src/cinematics/level2/level2Performance.ts')));
const scenes = ['three', 'six', 'checklist'].map(kind => {
  const shots = getLevel2Shots({ input: { phase: kind === 'checklist' ? '100' : kind, resultCategory: 'mixed-broad' } });
  return { kind, shots, pacing: createPacing(kind, shots) };
});
test('three-metric films start exactly on the requested first line, after all establishing/checking shots', () => {
  const { shots, pacing } = scenes[0];
  const first = sampleAt(pacing, 0);
  assert.equal(first.dialogue.text, 'I’ve completed all three requirements!');
  assert.equal(shotAt(shots, first.sourceSeconds).shot.id, 'three-checklist');
  assert.ok(Math.abs(first.sourceSeconds - 9.2) < 1e-9);
});
test('every frame stays inside requested placeholder material and excludes expansion, priority and extra 10/25 animations', () => {
  const allowed = { three: ['three-checklist'], six: ['six-checklist'], checklist: ['hundred', 'reflection'] };
  for (const { kind, shots, pacing } of scenes) {
    for (let time = 0; time <= pacing.duration; time += .005) {
      assert.ok(allowed[kind].includes(shotAt(shots, sampleAt(pacing, time).sourceSeconds).shot.id));
    }
    assert.ok(allowed[kind].includes(shotAt(shots, sampleAt(pacing, pacing.duration + 100).sourceSeconds).shot.id));
  }
});
test('all retained authored lines get the approved English-reading hold without added narration', () => {
  for (const { shots, pacing } of scenes) {
    const expected = shots.flatMap(shot => shot.dialogue ?? []);
    const actual = pacing.timeline.filter(part => part.dialogue);
    assert.deepEqual(actual.map(part => part.dialogue.text), expected.map(line => line.text));
    for (const part of actual) assert.ok(part.end - part.start >= readingSeconds(part.dialogue.text) - 1e-9);
  }
});
test('three/six fade out; 100 ends on its final dialogue; unsupported scenes are rejected', () => {
  for (const { pacing } of scenes) {
    assert.equal(finalCover(pacing, 0), 0);
    assert.equal(finalCover(pacing, pacing.duration), pacing.kind === 'checklist' ? 0 : 1);
  }
  assert.throws(() => createPacing('10', []));
  assert.throws(() => createPacing('25', []));
});
test('each final-reflection covered cut introduces its new caption immediately with the new portrait', () => {
  const { shots, pacing } = scenes.find(scene => scene.kind === 'checklist');
  let previous = null;
  const cuts = [];
  for (let time = 0; time < pacing.duration; time += .005) {
    const sample = sampleAt(pacing, time);
    const { shot, time: sourceTime } = shotAt(shots, sample.sourceSeconds);
    const acting = level2Performance(shot.id, sourceTime);
    const frame = { key: `${shot.id}:${acting.view}:${acting.expression === 'uncertain'}`, text: sample.dialogue?.text ?? null };
    if (previous && frame.key !== previous.key && shot.id === 'reflection') {
      if (previous.key.startsWith('reflection:')) {
        assert.ok(frame.text, 'A new reflection portrait must carry its new caption.');
        assert.notEqual(frame.text, previous.text, 'A portrait cut must not reopen on the old sentence.');
      } else assert.equal(frame.text, null, 'The conversation begins with its approved one-second lead-in.');
      cuts.push(frame.text);
    }
    previous = frame;
  }
  assert.deepEqual(cuts, [null, shots.find(shot => shot.id === 'reflection').dialogue[1].text]);
});
test('100-metric film preserves the original paper, waits one second in the conversation, and ends with its last line', () => {
  const { shots, pacing } = scenes.find(scene => scene.kind === 'checklist');
  const first = shotAt(shots, sampleAt(pacing, 0).sourceSeconds);
  assert.equal(first.shot.id, 'hundred');
  assert.equal(first.time, .25);
  assert.equal(level2Performance(first.shot.id, first.time).view, 'insert');
  const views = new Set();
  let firstCaption = null;
  for (let time = 0; time < pacing.duration; time += .005) {
    const sample = sampleAt(pacing, time);
    const { shot, time: sourceTime } = shotAt(shots, sample.sourceSeconds);
    if (shot.id === 'hundred') views.add(level2Performance(shot.id, sourceTime).view);
    if (sample.dialogue && firstCaption === null) firstCaption = time;
  }
  assert.deepEqual([...views], ['insert', 'world']);
  assert.ok(Math.abs(firstCaption - pacing.conversationAt - 1) < .006, 'First subtitle begins one second after conversation entrance.');
  assert.equal(pacing.timeline.some(part => shotAt(shots, part.from).shot.id === 'perfect'), false);
  const last = pacing.timeline.at(-1);
  assert.ok(last.dialogue);
  assert.equal(last.end, pacing.duration);
  assert.equal(sampleAt(pacing, pacing.duration).dialogue.text, shots.find(shot => shot.id === 'reflection').dialogue.at(-1).text);
});
