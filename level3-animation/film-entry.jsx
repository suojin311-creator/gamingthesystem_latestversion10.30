import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MetricAdaptationSequence} from '@partner/cinematics/level3/MetricAdaptationSequence';
import {preloadAdaptationArt} from '@partner/cinematics/level3/MetricAdaptationScene';
import {validatedClips} from './request.mjs';
import {createPacing,sampleAt} from './pacing.mjs';
import {SPEAKER_COLORS,CAPTION_SHADOW} from '../../src/shared/data/cinematicPalette.js';
import './film.css';
const CHANNEL='level3a-cinematic';const IGNORE=()=>{};
function Film({config}){
 const clips=useMemo(()=>validatedClips(config.request),[config]);const pacing=useMemo(()=>createPacing(clips),[clips]);
 const original=useMemo(()=>({requestId:config.runId,cinematicId:'level3',level:3,input:{selectedMetrics:clips.map(c=>c.metric),weights:Object.fromEntries(clips.map((c,i)=>[c.metric,config.request.shots[i].weight])),intensity:Object.fromEntries(clips.map(c=>[c.metric,c.intensity]))}}),[config,clips]);
 const[elapsed,setElapsed]=useState(0);const completed=useRef(false);const finished=elapsed>=pacing.duration;
 useEffect(()=>{let frame,last=performance.now(),clock=0;const reset=()=>{last=performance.now();};document.addEventListener('visibilitychange',reset);const tick=now=>{if(!document.hidden)clock=Math.min(pacing.duration,clock+Math.min(100,Math.max(0,now-last))/1000);last=now;setElapsed(clock);if(clock<pacing.duration)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',reset);};},[pacing]);
 useEffect(()=>{window.parent.postMessage({channel:'gts-audio',playing:!finished,time:elapsed},'*');},[finished,Math.floor(elapsed*4)]);
 useEffect(()=>{if(!finished||completed.current)return;const frame=requestAnimationFrame(()=>{if(completed.current)return;completed.current=true;window.parent.postMessage({channel:CHANNEL,type:'complete',runId:config.runId},'*');});return()=>cancelAnimationFrame(frame);},[finished,config.runId]);
 const sample=sampleAt(pacing,elapsed);
 return <main className="l3-film" data-scene-id={config.request.sceneId} data-shot-id={sample.sceneId} data-metric={sample.metric} data-intensity={sample.intensity} data-phase={sample.phase} data-source-time={sample.clipTime.toFixed(3)} data-elapsed={elapsed.toFixed(3)} data-duration={pacing.duration.toFixed(3)} data-finished={finished}>
  <MetricAdaptationSequence request={original} elapsed={sample.sourceTime} active={!finished} reducedMotion={config.reducedMotion} onComplete={IGNORE} hideClipDialogue/>
  {sample.phase==='clip'&&<div className="l3-spoken" style={{color:SPEAKER_COLORS.alex,textShadow:CAPTION_SHADOW}}><p className="l3-speaker">Alex</p><p role="status">{sample.caption}</p></div>}
  <div className="l3-end-cover" aria-hidden="true" style={{opacity:Math.max(0,Math.min(1,(elapsed-(pacing.duration-.45))/.4))}}/>
 </main>;
}
function Entry(){const[config,setConfig]=useState(null),[failed,setFailed]=useState(false);const started=useRef(false);
 useEffect(()=>{const receive=event=>{const d=event.data;if(event.source!==parent||d?.channel!==CHANNEL||d.type!=='start'||started.current||typeof d.runId!=='string')return;try{validatedClips(d.request);}catch{return;}started.current=true;preloadAdaptationArt().then(()=>setConfig(d),()=>setFailed(true));};addEventListener('message',receive);parent.postMessage({channel:CHANNEL,type:'ready'},'*');return()=>removeEventListener('message',receive);},[]);
 return config?<Film config={config}/>:<p className="l3-loading" role="status">{failed?'The classroom could not load. Please reopen the game.':'Preparing the classroom…'}</p>;}
createRoot(document.getElementById('root')).render(<Entry/>);
