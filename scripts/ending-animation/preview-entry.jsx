import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { preloadAdaptationArt } from '@level3a/cinematics/level3/MetricAdaptationScene';
import { branches } from '@ending/cinematics/level1/level1Content';
import office from '@ending-assets/backgrounds/BG_Office_FirstPerson_v01.png';
import hand from '@ending-assets/characters/alex-rig/production/actions/checking/ALEX-HAND-CHECKING.png';
import { validateEndingInput } from '../../src/cinematics/ending/input';
import { dissolveFrame } from '../cinematic-dissolve.mjs';
import Composition from './Composition';
import { DURATION, SECTIONS, sectionAt } from './timeline.mjs';

const EMBEDDED = import.meta.env.VITE_ENDING_EMBEDDED === '1';
const CHANNEL = 'ending-cinematic';
function Preview() {
  const [gameInput,setGameInput] = useState(null), [gameReduced,setGameReduced] = useState(false);
  const [labPreviewNote,setLabPreviewNote] = useState(false);
  const runId=useRef(null);
  const [ready,setReady] = useState(false), [error,setError] = useState(false);
  const [time,setTime] = useState(0), [playing,setPlaying] = useState(true), [speed,setSpeed] = useState(1), [completed,setCompleted] = useState(0);
  const reducedMotion = gameReduced || matchMedia('(prefers-reduced-motion:reduce)').matches;
  const viewport=useRef(null),surface=useRef(null),clock=useRef(0),changing=useRef(false),transition=useRef(null),done=useRef(false),currentKey=useRef('opening');
  const input=gameInput;
  const labSent=useRef(false);
  useEffect(()=>{if(EMBEDDED)parent.postMessage({channel:'gts-audio',playing:(playing||time>=DURATION)&&ready,time},'*');},[playing,ready,Math.floor(time*4)]);
  // Decode every image once, including lazy recollection artwork, before autoplay.
  useEffect(()=>{let live=true;const urls=[office,hand,...Object.values(branches).map(branch=>branch.plate)];Promise.all([preloadAdaptationArt(),...urls.map(url=>{const image=new Image();image.src=url;return image.decode();})]).then(()=>{if(live)setReady(true);},()=>{if(live)setError(true);});return()=>{live=false;};},[]);
  useEffect(()=>{
    if(!EMBEDDED || !ready)return;
    const receive=event=>{
      const data=event.data;
      if(event.source!==parent || data?.channel!==CHANNEL || data.type!=='start' || typeof data.runId!=='string' || runId.current)return;
      let validated;try{validated=validateEndingInput(data.input);}catch{setError(true);return;}
      setError(false);runId.current=data.runId;setGameInput(validated);setGameReduced(!!data.reducedMotion);
    };
    addEventListener('message',receive);
    parent.postMessage({channel:CHANNEL,type:'ready'},'*');
    return()=>removeEventListener('message',receive);
  },[ready]);
  const keyAt=t=>{const section=sectionAt(t);return section.id==='suspense'?'office':section.id;};
  const seek=(next,resume=false)=>{
    transition.current?.cancel();changing.current=false;
    setLabPreviewNote(false);
    const t=Math.max(0,Math.min(DURATION,next));clock.current=t;currentKey.current=keyAt(t);setTime(t);setPlaying(resume);
    if(t<DURATION)done.current=false;
  };
  useEffect(()=>{
    if(!ready||!playing||(EMBEDDED&&!gameInput))return;
    let raf=0,last=performance.now();
    const tick=now=>{
      if(!document.hidden&&!changing.current){
        const next=Math.min(DURATION,clock.current+Math.min(100,now-last)/1000*speed),key=keyAt(next);
        const commit=()=>{clock.current=next;currentKey.current=key;setTime(next);};
        if(key!==currentKey.current){
          changing.current=true;
          // The handoff reframes 16:9 into the viewport. Freeze the surrounding
          // matte too so the aspect-ratio change is covered by the same dissolve.
          const handoff=key==='reveal';
          transition.current=dissolveFrame(handoff?viewport.current:surface.current,commit,{duration:handoff?650:520,reducedMotion});
          transition.current.finished.then(()=>{changing.current=false;});
        }
        else commit();
        if(next>=DURATION){setPlaying(false);if(!done.current){done.current=true;setCompleted(n=>n+1);if(EMBEDDED)parent.postMessage({channel:CHANNEL,type:'complete',runId:runId.current},'*');}return;}
      }
      last=now;raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[ready,playing,speed,input,reducedMotion,gameInput]);
  useEffect(()=>()=>transition.current?.cancel(),[]);
  const pause=()=>{setPlaying(false);transition.current?.pause();};
  const play=()=>{setPlaying(true);transition.current?.play();};
  const reset=()=>{seek(0,true);setCompleted(0);done.current=false;};
  return <>
    <div ref={viewport} className="ending-viewport" data-completions={completed} data-mode="integrated-rev08"><div className="ending-screen" data-layout={sectionAt(time).id==='reveal'?'reveal':'film'}>
      {input&&<Composition {...{input,time,reducedMotion,surface}} onEnterLab={time>=DURATION?()=>{if(EMBEDDED&&!labSent.current){labSent.current=true;parent.postMessage({channel:CHANNEL,type:'enter-lab',runId:runId.current},'*');}}:undefined} />}
      {(!ready||error)&&<div className="ending-loading" role="status">{error?'The animation could not load. Please reopen the game.':'Preparing the ending…'}</div>}
    </div></div>

  </>;
}
createRoot(document.getElementById('root')).render(<Preview/>);
