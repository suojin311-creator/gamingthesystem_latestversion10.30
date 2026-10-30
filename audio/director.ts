import musicUrl from './assets/gymnopedie-no1.mp3?inline';
export type Scene = 'office' | 'metrics' | 'reflection' | 'lab' | 'reveal' | 'silent';
export type Cue = 'tick' | 'report' | 'evidence' | 'message' | 'paper' | 'chapter' | 'notification' | 'warning' | 'submit' | 'vote' | 'transition';
type Preferences = { muted: boolean; music: number; effects: number };
const defaults: Preferences = { muted: false, music: 0, effects: .65 };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
function saved(): Preferences {
  try { const p=JSON.parse(localStorage.getItem('gts-sound')||'{}'); return { muted:p.muted===true,music:0,effects:Number.isFinite(p.effects)?clamp(p.effects):defaults.effects }; } catch { return defaults; }
}

/** One output owner per document. Films report state; they never create competing music. */
type MusicPreferences = { enabled: boolean; volume: number; blocked: boolean };
function savedMusic(): MusicPreferences {
  try { const p=JSON.parse(localStorage.getItem('gts-bgm-v1')||'{}');
    return {enabled:p.enabled!==false,volume:Number.isFinite(p.volume)?clamp(p.volume):.2,blocked:false};
  } catch { return {enabled:true,volume:.2,blocked:false}; }
}
class Director {
  musicPreferences = savedMusic();
  private music: HTMLAudioElement | null = null;
  private musicStarted = false;
  private playPending = false;
  readonly musicSnapshot = () => this.musicPreferences;
  private publishMusic() { this.subscribers.forEach(fn=>fn()); }
  setMusic(change: Partial<Pick<MusicPreferences, 'enabled' | 'volume'>>) {
    this.musicPreferences={...this.musicPreferences,...change};
    this.musicPreferences.volume=clamp(this.musicPreferences.volume);
    try { localStorage.setItem('gts-bgm-v1',JSON.stringify(this.musicPreferences)); } catch { /* Storage is optional. */ }
    this.applyMusic(); this.publishMusic();
    if(this.musicStarted && this.musicPreferences.enabled) this.startMusic();
  }
  private applyMusic() {
    if(!this.music)return;
    this.music.volume=this.musicPreferences.volume;
    this.music.muted=!this.musicPreferences.enabled;
  }
  readonly startMusic = () => {
    this.musicStarted=true;
    if(!this.musicPreferences.enabled)return;
    if(!this.music) {
      this.music=new Audio(musicUrl); this.music.loop=true; this.music.preload='auto';
      this.music.dataset.gtsBgm='true'; this.applyMusic();
    }
    if(this.playPending || !this.music.paused)return;
    this.playPending=true;
    void this.music.play().then(()=>{
      this.musicPreferences={...this.musicPreferences,blocked:false};
    }).catch(()=>{
      this.musicPreferences={...this.musicPreferences,blocked:true};
    }).finally(()=>{this.playPending=false;this.publishMusic();});
  };

  preferences = saved();
  private subscribers = new Set<() => void>();
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effectsBus: GainNode | null = null;
  private voices = new Set<AudioScheduledSourceNode>();
  private hidden = document.hidden;
  private lastCue = new Map<string,number>();
  readonly subscribe = (fn: () => void) => { this.subscribers.add(fn); return () => { this.subscribers.delete(fn); }; };
  readonly snapshot = () => this.preferences;
  get available() { return typeof window.AudioContext === 'function'; }
  get running() { return this.context?.state === 'running'; }
  get state() { return { scene:'silent' as Scene, playing:false, unlocked:!!this.context, voices:this.voices.size, offset:0 }; }
  constructor() {
    document.addEventListener('visibilitychange',()=>{this.hidden=document.hidden;this.applyGains();if(this.hidden)this.stopEffects();});
  }
  readonly unlock = () => {
    if (!this.available) return;
    if (!this.context) {
      try {
        this.context=new AudioContext();this.master=this.context.createGain();this.master.connect(this.context.destination);
        this.effectsBus=this.context.createGain();this.effectsBus.connect(this.master);
        this.applyGains();
      } catch { return; }
    }
    const resume=this.context.state==='suspended'?this.context.resume():Promise.resolve();
    void resume.catch(()=>{});
  };
  setPreferences(change: Partial<Preferences>) {
    this.preferences={...this.preferences,...change,music:0};
    try { localStorage.setItem('gts-sound',JSON.stringify(this.preferences)); } catch { /* Private mode. */ }
    this.applyGains();
    if(this.preferences.muted)this.stopEffects();
    this.subscribers.forEach(fn=>fn());
  }
  readonly toggle = () => { this.setPreferences({muted:!this.preferences.muted});if(!this.preferences.muted)this.unlock(); };
  private applyGains() {
    if(!this.context)return;
    const t=this.context.currentTime;
    const set=(node:GainNode|null,value:number,seconds:number)=>{
      if(!node)return;
      node.gain.cancelScheduledValues(t);
      // Zero must remain exact even if Chromium suspended a silent graph's
      // automation processing before the next interaction sound starts.
      if(value===0)node.gain.setValueAtTime(0,t);
      else node.gain.setTargetAtTime(value,t,seconds);
    };
    set(this.master,this.preferences.muted||this.hidden?0:1,.035);
    set(this.effectsBus,this.preferences.effects*.34,.03);
  }
  // Compatibility with scene adapters: music has been removed, including decoding
  // and bundled tracks. Saved music preferences cannot restore playback.
  setScene(_scene: Scene, _intensity=.8, _paused=false) {}
  readonly stopEffects = () => {this.voices.forEach(s=>{try{s.stop();}catch{/* Ended. */}});this.voices.clear();};
  readonly cue = (cue: Cue) => {
    const c=this.context,bus=this.effectsBus;
    if(!c||!bus||c.state!=='running'||this.preferences.muted||this.hidden)return;
    const now=c.currentTime,previous=this.lastCue.get(cue)??-100;
    if(now-previous<(cue==='tick'?.11:.18))return;
    this.lastCue.set(cue,now);
    const voice=(freq:number,when:number,length:number,amp:number,noise=false)=>{
      const env=c.createGain(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=noise?1900:2600;
      let s:AudioBufferSourceNode|OscillatorNode;
      if(noise){const b=c.createBuffer(1,Math.ceil(c.sampleRate*length),c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;s=c.createBufferSource();s.buffer=b;}
      else {s=c.createOscillator();s.type='sine';s.frequency.setValueAtTime(freq,when);}
      env.gain.setValueAtTime(0,when);env.gain.linearRampToValueAtTime(amp,when+.008);env.gain.exponentialRampToValueAtTime(.0001,when+length);
      s.connect(filter);filter.connect(env);env.connect(bus);this.voices.add(s);
      s.onended=()=>{this.voices.delete(s);s.disconnect();filter.disconnect();env.disconnect();};s.start(when);s.stop(when+length+.02);
    };
    if(cue==='paper'){voice(0,now,.22,.16,true);return;}
    if(cue==='tick'){voice(540,now,.055,.26);voice(1090,now,.027,.07);voice(0,now,.025,.04,true);return;}
    if(cue==='warning'){voice(174.61,now,.6,.2);voice(220,now+.07,.5,.12);return;}
    if(cue==='message')return; // Authored dialogue stays quiet; no repetitive notification chatter.
    if(cue==='notification'){voice(659.25,now,.45,.2);voice(783.99,now+.12,.5,.17);return;}
    if(cue==='report'||cue==='submit'){voice(392,now,.28,.18);voice(523.25,now+.07,.34,.14);return;}
    if(cue==='chapter'||cue==='transition'){voice(196,now,.7,.15);voice(293.66,now+.12,.65,.08);return;}
    // Both voting choices deliberately share this neutral confirmation.
    voice(cue==='vote'?440:330,now,.16,.16);voice(660,now+.025,.12,.045);
  };
}
export const audioDirector=new Director();
