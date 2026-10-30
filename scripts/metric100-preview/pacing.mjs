import { readingSeconds } from '../cinematic-reading.mjs';

// Re-edit the pinned original, independently of the current game's Level 2 cut.
export function createHundredPacing(shots) {
  const hundred=shots.find(shot=>shot.id==='hundred'),reflection=shots.find(shot=>shot.id==='reflection');
  if(!hundred || !reflection?.dialogue?.length)throw new Error('Expected the original 100-metric film and its authored conversation.');
  const offset=shots.slice(0,shots.indexOf(reflection)).reduce((n,shot)=>n+shot.duration,0);
  const timeline=[];let duration=0;
  const add=(id,from,to,hold,dialogue=null)=>{timeline.push({id,from,to,start:duration,end:duration+hold,dialogue});duration+=hold;};
  // Start on the original pen insert. Preserve all subsequent paper actions,
  // evidence references, the complete Coverage map and completion tally.
  add('checking',.25,1.499,1.249);
  add('coverage',1.5,hundred.duration-.001,hundred.duration-1.501);
  // The old five-second silent portrait is unnecessary. Enter the actual
  // conversation pose immediately, and begin its first subtitle one second later.
  const conversationAt=duration;
  add('conversation',offset,offset+.099,1);
  reflection.dialogue.forEach((line,index)=>{
    const to=index===0?Math.min(line.end,1.64):line.end;
    add('line-'+index,offset+line.start,offset+to,readingSeconds(line.text),line);
  });
  return {timeline,duration,conversationAt,firstSubtitleAt:conversationAt+1};
}
export function sampleAt(pacing,time){
  const part=pacing.timeline.find(part=>time<part.end)??pacing.timeline.at(-1);
  const progress=Math.max(0,Math.min(1,(time-part.start)/(part.end-part.start)));
  return {...part,sourceSeconds:part.from+(part.to-part.from)*progress};
}
