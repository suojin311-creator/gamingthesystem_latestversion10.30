import PadletLab from '../../design-lab/PadletLab';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import film from 'virtual:ending-cinematic-film';
import type { MetricId } from '../../shared/data/metrics';
import type { WeightRun } from '../../levels/level3/data';
import { endingInputFromRuns } from './input';
import './styles.css';
import { audioDirector } from '../../audio/director';
import { cinematicRunId } from '../../shared/utils/cinematicRunId';

/** The approved film holds its final page; it never opens the old theory slot. */
export default function EndingCinematic({ levelOneMetricId, runs, playerName = '' }: { playerName?: string; levelOneMetricId: MetricId; runs: WeightRun[] }) {
  const frame=useRef<HTMLIFrameElement>(null),runId=useRef(cinematicRunId());
  const [input]=useState(()=>endingInputFromRuns(levelOneMetricId,runs,playerName));
  const [finished,setFinished]=useState(false);
  const [labOpen,setLabOpen]=useState(false),[leaving,setLeaving]=useState(false);
  const completed=useRef(false),navigating=useRef(false),navigationTimer=useRef(0);
  useEffect(()=>()=>clearTimeout(navigationTimer.current),[]);
  useEffect(()=>{
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const receive=(event:MessageEvent)=>{
      const data=event.data;
      if(event.source!==frame.current?.contentWindow||data?.channel!=='ending-cinematic')return;
      if(data.type==='ready')frame.current.contentWindow?.postMessage({channel:'ending-cinematic',type:'start',runId:runId.current,input,reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches},'*');
      if(data.type==='complete'&&data.runId===runId.current&&!completed.current){completed.current=true;setFinished(true);}
      if(data.type==='enter-lab'&&data.runId===runId.current&&completed.current&&!navigating.current){
        navigating.current=true;audioDirector.unlock();audioDirector.cue('transition');
        setLeaving(true);navigationTimer.current=window.setTimeout(()=>setLabOpen(true),550);
      }
    };
    addEventListener('message',receive);
    return()=>{removeEventListener('message',receive);document.body.style.overflow=previous;};
  },[input]);
  if(labOpen)return createPortal(<PadletLab/>,document.body);
  return createPortal(<section className="ending-cinematic" data-testid="ending-cinematic" data-scene-id="level3.compare" data-finished={finished} aria-label="Ending animation"><iframe ref={frame} title="Ending animation" srcDoc={film} allow="autoplay; fullscreen" allowFullScreen />{leaving&&<div className="ending-lab-fade"/>}</section>,document.body);
}
