import { useEffect, useState } from 'react';
import Opening from './cinematics/opening/Opening';
import Gameplay from './Gameplay';
import { useFeedback } from './shared/hooks/useFeedback';
import ChapterTransition from './shared/components/ChapterTransition';
import './shared/styles/first-handoff.css';
import officeBackground from './cinematics/opening/assets/backgrounds/BG_Office_FirstPerson_v01.png';

/** The opening owns identity; Gameplay stays mounted across all three levels. */
export default function FullGame() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [chapterReady, setChapterReady] = useState(false);
  const [chapterFinished,setChapterFinished] = useState(false);
  const { reset, play, unlock } = useFeedback();
  useEffect(() => {
    const fresh = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      reset();
      setPlayerName(null);
      setChapterReady(false);
      setChapterFinished(false);
    };
    window.addEventListener('pageshow', fresh);
    return () => window.removeEventListener('pageshow', fresh);
  }, [reset]);
  return playerName === null
    ? <Opening onComplete={setPlayerName} />
    : <div className="first-handoff" data-entering={chapterReady}>
      {chapterReady && <div className="first-handoff-incoming"><Gameplay playerName={playerName} initialGuideDelay={1050} /></div>}
      {!chapterFinished && <div className="first-handoff-outgoing" aria-hidden={chapterReady} inert={chapterReady} onAnimationEnd={event=>{
        if(event.target===event.currentTarget&&event.animationName==='first-handoff-out')setChapterFinished(true);
      }}><main className="first-chapter-shell" onPointerDown={unlock} onKeyDown={unlock}><ChapterTransition level={1} backdrop={officeBackground} playerName={playerName} play={play} onStart={()=>{
        setChapterReady(true);window.scrollTo(0,0);
        if(matchMedia('(prefers-reduced-motion: reduce)').matches)setChapterFinished(true);
      }} /></main></div>}
    </div>;
}
