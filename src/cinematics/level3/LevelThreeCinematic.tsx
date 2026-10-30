import { useEffect, useRef } from 'react';
import film from 'virtual:level3-cinematic-film';
import type { LevelThreeCinematicRequest } from '../../levels/level3/data';
import { weightedSceneReply } from '../../levels/level3/dialogue';
import CinematicPlaceholder from '../../levels/level3/CinematicPlaceholder';
import './styles.css';
import { cinematicRunId } from '../../shared/utils/cinematicRunId';

function WeightedFilm({ request,onComplete }:{request:LevelThreeCinematicRequest;onComplete:()=>void}){
  const frame=useRef<HTMLIFrameElement>(null),runId=useRef(cinematicRunId()),sent=useRef(false),callback=useRef(onComplete);
  callback.current=onComplete;
  useEffect(()=>{
    frame.current?.scrollIntoView({block:'center',behavior:'instant'});
    const receive=(event:MessageEvent)=>{
      const data=event.data;
      if(event.source!==frame.current?.contentWindow||data?.channel!=='level3a-cinematic')return;
      if(data.type==='ready')frame.current.contentWindow?.postMessage({channel:'level3a-cinematic',type:'start',runId:runId.current,request:{...request,shots:request.shots.map((shot,index)=>({...shot,caption:weightedSceneReply(request,index)}))},reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches},'*');
      if(data.type==='complete'&&data.runId===runId.current&&!sent.current){sent.current=true;callback.current();}
    };
    window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
  },[request.sceneId,request.playerName]);
  return <section className="level3-cinematic" data-testid="level3-cinematic" data-scene-id={request.sceneId} aria-label="Level 3A classroom animation"><iframe ref={frame} title="Level 3A classroom animation" srcDoc={film} allow="autoplay; fullscreen" allowFullScreen/></section>;
}
export default function LevelThreeCinematic(props:{request:LevelThreeCinematicRequest;onComplete:()=>void}){
  return props.request.kind==='weights'?<WeightedFilm {...props}/>:<CinematicPlaceholder {...props}/>;
}
