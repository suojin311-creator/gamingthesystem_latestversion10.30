import assert from 'node:assert/strict';
import { createPacing } from '../scripts/level1-settlement/pacing.mjs';
import { finalCoverOpacity } from '../scripts/level1-settlement/transitions.mjs';
// Authored dialogue from the pinned partner delivery, not the game-side recap.
const samples = [
 ['prep','I finished everything on the list!','What was the main idea in the reading?','Uh... I finished the checklist.'],
 ['part','I agree! Same here!','Can you explain why?','I just wanted to participate.'],
 ['focus','Look, I stayed on task the whole time!','What did you discover?','I... kept the page open.'],
 ['discuss','Could you elaborate? I’d like to build on that.','What new idea came out of the discussion?','I followed the discussion checklist.'],
 ['reflect','Before, I thought... Now, I think...','What actually changed your mind?','That’s the format on the rubric.'],
 ['peer','Specific suggestion? Check. Follow-up question? Check!','Did you really discuss their ideas?','I met every response criterion.'],
];
for (const [id, boast, question, reveal] of samples) {
  const pacing = createPacing({boast, question, reveal});
  assert.equal(Number((pacing.duration - pacing.transitionStart).toFixed(3)), 25.2);
  assert.equal(pacing.timeline.length, 7, id + ': consequence segments retained');
  for (const [index, text] of [[1,boast],[3,question],[5,reveal]]) {
    const segment=pacing.timeline[index];
    assert(segment.end-segment.start >= text.trim().split(/\s+/).length*.25+.25, id+': original reading hold');
  }
  assert.equal(pacing.sourceSeconds(0),0);
  assert.equal(pacing.sourceSeconds(pacing.transitionStart),12.6);
  assert.equal(pacing.sourceSeconds(pacing.duration),12.6);
  let previous=-1;
  for(let frame=0;frame<Math.ceil(pacing.duration*30);frame++){
    const source=pacing.sourceSeconds(frame/30);assert(source>=previous&&source<=12.6);previous=source;
  }
  for(const reduced of [false,true]) assert.equal(finalCoverOpacity(pacing,(Math.ceil(pacing.duration*30)-1)/30,reduced),1);
  console.log('PASS',id,pacing.duration.toFixed(2)+'s; unchanged consequence → 25.2s shared transition → covered settlement');
}
