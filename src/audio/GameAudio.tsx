import { useEffect } from 'react';
import AudioControls from './AudioControls';
import { audioDirector, type Scene } from './director';

type FilmState={ playing:boolean; section?:string; time?:number };
export default function GameAudio(){
 useEffect(()=>{
  const films=new Map<Window,FilmState>();let frame=0;let previousPage='';let warning='';
  const scan=()=>{
   frame=0;
   const ending=document.querySelector<HTMLIFrameElement>('.ending-cinematic iframe');
   const movie=ending||document.querySelector<HTMLIFrameElement>('.settlement-cinematic iframe,.level-one-cinematic iframe,.level2-cinematic iframe,.level3-cinematic iframe,.cinematic-slot iframe');
   const film=movie?.contentWindow?films.get(movie.contentWindow):undefined;
   const page=document.querySelector<HTMLElement>('.game-page');
   const opening=document.querySelector<HTMLElement>('.opening-scene .stage');
   let scene:Scene='office',intensity=.6;
   if(document.querySelector('[data-padlet-lab]')){scene='silent';intensity=0;}else if(ending){
    const time=film?.time??0;
    scene=time>=10.1&&time<16.5?'reflection':time>=16.5?'lab':'reflection';
    intensity=time>=10.1&&time<16.5?.26:time>=16.5?.6:.65;
   }else if(movie){scene='metrics';intensity=page?.classList.contains('level-two')?.95:.8;}
   else if(page){scene='metrics';intensity=.5;}
   else if(opening){scene=opening.dataset.beat==='title'?'silent':'office';intensity=.62;}
   audioDirector.setScene(scene,intensity,film?.playing===false);
   const key=`${page?.className}:${page?.dataset.phase}:${page?.dataset.round}`;
   if(previousPage&&key!==previousPage&&page?.dataset.phase==='intro')audioDirector.cue('chapter');
   previousPage=key;
   const students=document.querySelector('.l2-students.l2-has-observation,.l1-settlement .student.has-evidence');
   const warningKey=students?key:'';
   if(warningKey&&warning!==warningKey)audioDirector.cue('warning');
   warning=warningKey;
  };
  const queue=()=>{if(!frame)frame=requestAnimationFrame(scan);};
  const unlock=()=>{audioDirector.unlock();queue();};
  const receive=(event:MessageEvent)=>{
   const d=event.data;
   if(d?.channel!=='gts-audio'||typeof d.playing!=='boolean')return;
   const owned=Array.from(document.querySelectorAll('iframe')).some(el=>!el.closest('[data-padlet-lab]')&&el.contentWindow===event.source);
   if(!owned)return;
   films.set(event.source as Window,{playing:d.playing,time:d.time,section:d.section});queue();
  };
  const observer=new MutationObserver(queue);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-phase','data-round','data-beat']});
  addEventListener('message',receive);document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);scan();
  return()=>{observer.disconnect();cancelAnimationFrame(frame);removeEventListener('message',receive);document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);audioDirector.setScene('silent');};
 },[]);
 return <AudioControls/>;
}
