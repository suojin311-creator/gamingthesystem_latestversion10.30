import { useState, useSyncExternalStore } from 'react';
import { audioDirector } from './director';
import './audio.css';
export default function AudioControls() {
 const [open,setOpen]=useState(false);
 const p=useSyncExternalStore(audioDirector.subscribe,audioDirector.musicSnapshot);
 return <aside className="gts-music-controls" aria-label="Background music">
  <button aria-label={p.enabled?'Mute music':'Unmute music'} aria-pressed={!p.enabled} onClick={()=>audioDirector.setMusic({enabled:!p.enabled})}>{p.enabled?'🔊':'🔇'}<span className="gts-music-label"> Music {p.enabled?'on':'off'}</span></button>
  <button aria-label="Music volume settings" aria-expanded={open} onClick={()=>setOpen(!open)}>⚙</button>
  {open&&<div className="gts-music-settings"><label htmlFor="gts-music-volume">Music volume {Math.round(p.volume*100)}%</label><input id="gts-music-volume" type="range" min="0" max="100" value={Math.round(p.volume*100)} onChange={e=>audioDirector.setMusic({volume:Number(e.target.value)/100})}/></div>}
  {p.blocked&&<button onClick={audioDirector.startMusic}>Play music</button>}
 </aside>;
}
