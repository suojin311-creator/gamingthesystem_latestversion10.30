import { useState } from 'react';
import './padlet.css';
export const PADLET_URL = 'https://padlet.com/embed/s024sqd75q7kuy5xciyy';
export default function PadletLab(){
 const [loaded,setLoaded]=useState(false);
 return <section className="padlet-lab" data-padlet-lab aria-label="Design Lab">
  <header><h1>Design Lab</h1><a href={PADLET_URL} target="_blank" rel="noopener noreferrer">Open in a new tab <span aria-hidden="true">↗</span></a></header>
  <div className="padlet-lab-board">{!loaded&&<p role="status">Loading Design Lab…</p>}<iframe title="Design Lab · Padlet" src={PADLET_URL} allow="camera; microphone; geolocation; display-capture; clipboard-write" onLoad={()=>setLoaded(true)}/></div>
 </section>;
}
