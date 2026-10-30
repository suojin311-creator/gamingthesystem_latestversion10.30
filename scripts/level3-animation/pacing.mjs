import {ENTRY_DURATION,CLIP_DURATION,BRIDGE_DURATION,EXIT_DURATION,sequenceFrame} from '../level3-source/src/cinematics/level3/adaptationTimeline.ts';
// Presentation clock only: all effort is supplied by Gameplay, never derived here.
export function createPacing(clips){
 let time=ENTRY_DURATION;
 const timeline=clips.map((clip,index)=>{const duration=Math.max(CLIP_DURATION,clip.caption.trim().split(/\s+/).length*.27+.8);const item={...clip,index,start:time,end:time+duration};time+=duration+(index<clips.length-1?BRIDGE_DURATION:0);return item;});
 return {timeline,exitStart:time,duration:time+EXIT_DURATION+.45};
}
export function sampleAt(pacing,elapsed){
 let sourceTime;
 if(elapsed<ENTRY_DURATION)sourceTime=elapsed;
 else if(elapsed>=pacing.exitStart)sourceTime=ENTRY_DURATION+3*CLIP_DURATION+2*BRIDGE_DURATION+Math.min(EXIT_DURATION,elapsed-pacing.exitStart);
 else{
  const clip=pacing.timeline.find(c=>elapsed<c.end)??pacing.timeline.at(-1);
  const previous=pacing.timeline[clip.index-1];
  sourceTime=elapsed<clip.start?ENTRY_DURATION+clip.index*CLIP_DURATION+(clip.index-1)*BRIDGE_DURATION+elapsed-previous.end:ENTRY_DURATION+clip.index*(CLIP_DURATION+BRIDGE_DURATION)+Math.min(CLIP_DURATION,(elapsed-clip.start)/(clip.end-clip.start)*CLIP_DURATION);
 }
 const frame=sequenceFrame(sourceTime);return {...pacing.timeline[frame.clipIndex],phase:frame.phase,sourceTime,clipTime:frame.time};
}
