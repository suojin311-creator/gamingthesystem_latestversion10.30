import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { revisionTimeline, revisionAt } from '../scripts/level2-animation/revision-timeline.mjs';
import { readingSeconds } from '../scripts/cinematic-reading.mjs';

// Compile the actual unchanged game data, including its extensionless imports.
const compiled = await build({ entryPoints: ['src/levels/level2/data.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const game = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
test('all 20 real combinations keep their original three outcome categories', () => {
  const ids = ['prep', 'part', 'focus', 'discuss', 'reflect', 'peer'];
  const counts = { visible: 0, quality: 0, mixed: 0 };
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 5; j++) for (let k = j + 1; k < 6; k++) {
    const selected = [ids[i], ids[j], ids[k]];
    counts[game.classifyTrio(selected)]++;
    for (const count of [3, 6, 100]) {
      const request = game.sceneRequest(count, selected, 'Lin');
      assert.deepEqual(request.selectedMetricIds, selected);
      assert.equal(request.branch, game.classifyTrio(selected));
      assert.equal(request.playerName, 'Lin');
    }
  }
  assert.deepEqual(counts, { visible: 1, quality: 1, mixed: 18 });
  assert.equal(new Set(Object.values(game.THREE_OUTCOMES).map(result => result.evidence)).size, 3);
});
test('REV-05 is exactly the five-shot story; gameplay alone retains outcome data', () => {
  const plan = revisionTimeline('three');
  assert.deepEqual(plan.shots.map(shot => [shot.id, shot.speaker, shot.text]), [
    ['classmates-question', 'Classmates', 'How did you get such high scores?'],
    ['alex-continues', 'Alex', 'Why spend time on things that don’t count?'],
    ['alex-explains', 'Alex', 'Here’s the trick: focus on the three metrics the professor is grading.'],
    ['strategy-spreading', null, 'Alex’s strategy is starting to catch on.'],
    ['professor-reflection', 'You', 'They’re focusing on what I measure. But am I seeing the whole picture? Maybe I need to measure more.'],
  ]);
  assert.equal(plan.shots.at(-1).view, 'professor-wide');
  assert.equal(revisionAt(plan, plan.duration + 100).shot.id, 'professor-reflection');
  for (const shot of plan.shots.filter(shot => shot.text)) assert.ok(shot.end - shot.start >= readingSeconds(shot.text));
  assert.equal(plan.shots[3].end - plan.shots[3].start, 3);
  assert.equal(new Set(Object.values(game.THREE_OUTCOMES).map(outcome => outcome.evidence)).size, 3);
});
test('REV-06 gives six real checklist labels time to complete and leaves selection to gameplay', () => {
  const plan = revisionTimeline('six');
  const reveal = plan.shots.find(shot => shot.view === 'six-paper');
  assert.ok(reveal.end - reveal.start >= 8);
  assert.equal(plan.shots.at(-1).speaker, 'You');
  const gameSource = readFileSync('src/levels/level2/LevelTwo.tsx', 'utf8');
  assert.ok(gameSource.includes('count === 6'));
  assert.equal(game.nextCount(6), 10);
  assert.equal(game.nextCount(10), 25);
  assert.equal(game.nextCount(25), 100);
});
test('REV-07 preserves the entire original evidence interval and final dialogue', () => {
  const reflection = [{ text: 'Maybe adding more metrics isn’t the answer...' }, { text: 'What if some metrics mattered more than others?' }];
  const plan = revisionTimeline('checklist', reflection);
  const evidence = plan.shots.find(shot => shot.view === 'evidence');
  assert.ok(Math.abs(evidence.end - evidence.start - 5.649) < 1e-9);
  assert.equal(plan.shots.at(-1).text, reflection[1].text);
  assert.equal(revisionAt(plan, plan.duration).shot.id, 'original-reflection-1');
  for (const shot of plan.shots.filter(shot => shot.text)) assert.ok(shot.end - shot.start >= readingSeconds(shot.text));
  assert.throws(() => revisionTimeline('checklist'), /reflection/);
  assert.throws(() => revisionTimeline('10'));
  assert.throws(() => revisionTimeline('25'));
});
