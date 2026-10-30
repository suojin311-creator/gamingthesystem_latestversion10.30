import { useEffect, useState } from 'react';
import AudioControls from './AudioControls';
import { audioDirector, type Cue } from './director';
const effects:[Cue,string][]=[['tick','Select / tick'],['paper','Open / turn paper'],['notification','Email arrives'],['report','Result ready'],['warning','Learning at risk'],['transition','Change chapter'],['submit','Submit reflection'],['vote','Agree / Disagree']];
export default function SoundReview(){
 const [state,setState]=useState(audioDirector.state);
 useEffect(()=>{const timer=setInterval(()=>setState(audioDirector.state),150);return()=>{clearInterval(timer);audioDirector.setScene('silent');};},[]);
 return <main style={{minHeight:'100vh',boxSizing:'border-box',padding:'8vh max(24px,8vw)',background:'#f8f4ea',color:'#34382e',font:'17px/1.6 Georgia,serif'}} data-audio-scene={state.scene} data-audio-playing={state.playing} data-audio-voices={state.voices}>
  <p style={{color:'#ad5840',font:'12px Arial',letterSpacing:'.15em'}}>GAMING THE SYSTEM · SOUND PREVIEW</p><h1 style={{fontWeight:400,fontSize:'clamp(36px,5vw,64px)',margin:'16px 0'}}>Listen, then play.</h1><p>Background music is off. Try an interaction sound below.</p>
  <h2 style={{fontWeight:400,marginTop:28}}>Sound effects</h2><div style={{display:'flex',gap:12,flexWrap:'wrap'}}>{effects.map(([cue,label])=><button style={{padding:'10px 16px'}} key={cue} onClick={()=>{audioDirector.unlock();audioDirector.cue(cue);}}>{label}</button>)}</div>
  <nav style={{display:'flex',gap:24,marginTop:38,flexWrap:'wrap'}}><a href="/game">Play from the opening →</a>{[1,2,3].map(n=><a key={n} href={`/game?level=${n}`}>Level {n} →</a>)}<a href="/">Design Lab →</a></nav><AudioControls/>
 </main>;
}
