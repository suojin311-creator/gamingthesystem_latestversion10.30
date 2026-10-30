import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import officeBackground from './assets/backgrounds/BG_Office_FirstPerson_v01.png';
import { useSceneAudio } from './useSceneAudio';
import ClassroomScene from './ClassroomScene';
import InteractionCue from './InteractionCue';
import './styles.css';
import { useVisibleDelay } from '../../shared/hooks/useVisibleDelay';
import { SPEAKER_COLORS, CAPTION_SHADOW } from '../../shared/data/cinematicPalette';

type Beat = 'title' | 'reveal' | 'identity' | 'seating' | 'quiet' | 'cue' | 'laptopFocus' | 'notification' | 'emailFocus' | 'reading' | 'thought' | 'ready' | 'pullback' | 'door' | 'depart' | 'classroom' | 'returnArrival' | 'returnReveal' | 'officeReflect' | 'officeQuestion' | 'handoff';
// WATCH beats advance automatically; ACT beats wait indefinitely.
const TIMELINE: Partial<Record<Beat, { next: Beat; ms: number }>> = {
  reveal: { next: 'identity', ms: 1100 },
  quiet: { next: 'cue', ms: 650 }, cue: { next: 'laptopFocus', ms: 450 },
  reading: { next: 'thought', ms: 750 }, thought: { next: 'ready', ms: 1400 },
  officeReflect: { next: 'officeQuestion', ms: 2500 },
  officeQuestion: { next: 'handoff', ms: 4000 },
};
// A fixed centre origin: x = (50 - targetX) * scale, likewise for y.
const CAMERAS = {
  opening: { scale: 1.01, x: '0%', y: '0%' },
  seated: { scale: 1.08, x: '0%', y: '0%' },
  laptop: { scale: 2.25, x: '52.875%', y: '-1.125%' },
  pullback: { scale: 1.25, x: '8%', y: '0%' },
  door: { scale: 2, x: '-47%', y: '6%' },
};

export default function Opening({ onComplete }: { onComplete: (playerName: string) => void }) {
  const [beat, setBeat] = useState<Beat>('title');
  const [playerName, setPlayerName] = useState('');
  const [draftName, setDraftName] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const reducedMotion = useReducedMotion();
  const nameInput = useRef<HTMLInputElement>(null);
  const notification = useRef<HTMLButtonElement>(null);
  const subject = useRef<HTMLHeadingElement>(null);
  const visit = useRef<HTMLButtonElement>(null);
  const completed = useRef(false);
  const audio = useSceneAudio();
  const returnToOffice = useCallback(() => setBeat('returnArrival'), []);
  const emailOpen = ['emailFocus', 'reading', 'thought', 'ready'].includes(beat);
  const classroomActive = beat === 'classroom' || beat === 'returnArrival';
  const laptopCue = ['cue', 'laptopFocus', 'notification'].includes(beat);
  const camera = emailOpen || ['laptopFocus', 'notification'].includes(beat) ? CAMERAS.laptop
    : beat === 'pullback' ? CAMERAS.pullback
    : ['door', 'depart', 'classroom'].includes(beat) ? CAMERAS.door
    : ['title', 'reveal', 'identity'].includes(beat) ? CAMERAS.opening : CAMERAS.seated;

  const step = TIMELINE[beat];
  useVisibleDelay(`opening:${beat}`, '.opening-scene .stage', step?.ms ?? 0, loaded && !!step, () => {
    if (step) setBeat(step.next);
  });
  useEffect(() => {
    if (beat !== 'returnArrival') return;
    // Keep the opaque classroom mounted while resetting the hidden office camera.
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setBeat('returnReveal')); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [beat]);
  useEffect(() => {
    if (beat === 'identity') nameInput.current?.focus({ preventScroll: true });
    if (beat === 'notification') notification.current?.focus({ preventScroll: true });
    if (beat === 'reading') subject.current?.focus({ preventScroll: true });
    if (beat === 'ready') visit.current?.focus({ preventScroll: true });
    if (beat === 'returnReveal') audio.startOffice();
    if (beat === 'cue') audio.play('notification');
    if (beat === 'depart') audio.fadeOfficeOut();
  }, [beat, audio.play, audio.fadeOfficeOut, audio.startOffice]);

  const cameraArrived = () => {
    if (beat === 'seating') setBeat('quiet');
    else if (beat === 'laptopFocus') setBeat('notification');
    else if (beat === 'pullback') setBeat('door');
    else if (beat === 'door') setBeat('depart');
  };
  const exposureArrived = () => {
    if (beat === 'depart') setBeat('classroom');
    else if (beat === 'returnReveal') setBeat('officeReflect');
    else if (beat === 'handoff' && !completed.current) {
      completed.current = true;
      audio.reset();
      onComplete(playerName);
    }
  };

  const fade = { duration: reducedMotion ? 0.1 : 0.45 };
  return (
    <main className="opening-scene game-shell" style={{ '--teacher-caption': SPEAKER_COLORS.player, '--student-caption': SPEAKER_COLORS.alex, '--caption-shadow': CAPTION_SHADOW } as CSSProperties} onPointerDown={audio.unlock} onKeyDown={audio.unlock}>
      <div className="stage" aria-label="First-person cinematic opening" data-beat={beat}>
        {/* Keep the world still while reading; the email is a separate unscaled layer. */}
        <motion.div className="office-camera" aria-hidden={classroomActive} inert={classroomActive} initial={CAMERAS.opening} animate={camera} transition={{ duration: reducedMotion || beat === 'returnArrival' ? 0 : beat === 'door' ? 1.25 : beat === 'pullback' ? 1.15 : 1.05, ease: [0.4, 0, 0.2, 1] }} onAnimationComplete={cameraArrived}>
          <img className="office-background" src={officeBackground} alt="Your desk in a sunlit office, with a laptop to the left and an office door to the right." onLoad={() => setLoaded(true)} onError={() => setLoadError(true)} />
          <div className="laptop-screen">
            <motion.div className="screen-cue" aria-hidden="true" animate={{ opacity: laptopCue ? 0.35 : 0 }} transition={{ duration: 0.65 }} />
            <AnimatePresence>
              {beat === 'notification' && (
                <motion.button key="notification" ref={notification} className="notification" aria-label="Open urgent email from University Management" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={() => { audio.play('emailOpen'); setBeat('emailFocus'); }}>
                  <span className="envelope" aria-hidden="true">✉</span>
                  <span><strong>University Management</strong><span className="notification-detail">New message <i aria-hidden="true" /></span><b>Urgent Mission</b></span>
                  <InteractionCue className="opening-email-cue" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        <ClassroomScene playerName={playerName} active={classroomActive} onReturn={returnToOffice} play={audio.play} startClassroom={audio.startClassroom} fadeClassroomOut={audio.fadeClassroomOut} />
        <div className="vignette" aria-hidden="true" />
        {(emailOpen || beat === 'pullback') && (
          <motion.div className="email-reader" initial={{ opacity: 0 }} animate={{ opacity: emailOpen ? 1 : 0 }} transition={{ duration: reducedMotion ? 0.1 : 0.3 }} inert={!emailOpen} aria-hidden={!emailOpen} style={{ pointerEvents: emailOpen ? 'auto' : 'none' }} onAnimationComplete={() => { if (beat === 'emailFocus') setBeat('reading'); }}>
            <article className="email" aria-label="Email from University Management">
              <header className="mail-bar"><span aria-hidden="true">✉</span> University <span className="inbox-label">INBOX / 1</span></header>
              <div className="mail-content">
                <div className="sender"><span className="sender-seal" aria-hidden="true">U</span><div><small>From</small><strong>University Management</strong></div><time>Monday, 9:12 AM</time></div>
                <h2 ref={subject} tabIndex={-1}>Urgent Mission</h2>
                <p className="salutation">Dear <span>{playerName}</span>,</p>
                <p>Student engagement is at an all-time low.</p>
                <div className="mission"><strong>Your mission:</strong><p>Improve student engagement before the next evaluation.</p></div>
                <p>We need <strong className="underline">measurable results.</strong></p>
                <p>Good luck,<br />University Management</p>
              </div>
              <footer className="email-action"><button ref={visit} className="primary" onClick={() => { audio.play('transition'); setBeat('pullback'); }}>VISIT CLASSROOM</button></footer>
            </article>
          </motion.div>
        )}
        <motion.div className="exposure" aria-hidden="true" initial={{ opacity: 1 }} animate={{ opacity: beat === 'title' ? 0.97 : ['reveal', 'identity'].includes(beat) ? 0.45 : ['depart', 'returnArrival','handoff'].includes(beat) ? 1 : 0 }} transition={{ duration: beat === 'returnArrival' ? 0 : reducedMotion ? 0.1 : beat === 'reveal' ? 1.05 : 0.75 }} onAnimationComplete={exposureArrived} />
        <AnimatePresence mode="wait">
          {beat === 'title' && (
            <motion.div key="title" className="title-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
              <h1>GAMING<br /><span>THE SYSTEM</span></h1>
              <motion.p className="subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }}>When you set the metrics, what are you measuring?</motion.p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.4 }}><button className="cinematic-button" disabled={!loaded} onClick={() => { audio.startOffice(); audio.play('interaction'); setBeat('reveal'); }}>START GAME</button></motion.div>
            </motion.div>
          )}
          {beat === 'identity' && (
            <motion.form key="identity" className="identity-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} onSubmit={(event) => {
              event.preventDefault();
              if (!draftName.trim()) return;
              setPlayerName(draftName.trim()); audio.play('transition'); setBeat('seating');
            }}>
              <h1>This desk is yours now.</h1>
              <label htmlFor="player-name">What name should we put on it?</label>
              <input ref={nameInput} id="player-name" autoComplete="off" maxLength={40} value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Name on the desk..." required />
              <button className="opening-action" disabled={!draftName.trim()}>TAKE YOUR SEAT <span aria-hidden="true">→</span></button>
            </motion.form>
          )}
          {beat === 'seating' && <motion.p key="time" className="time-caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>Monday, 9:12 AM</motion.p>}
          {(beat === 'officeReflect' || beat === 'officeQuestion') && <motion.p key={beat} className="office-reflection" role="status" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={fade}>{beat === 'officeReflect' ? 'They’re here, but they’re not really engaged.' : <>Management wants measurable results.<br />I need a sign I can track.</>}</motion.p>}
        </AnimatePresence>
        {loadError && <p className="load-status" role="alert">The office background could not load. Please refresh to try again.</p>}
        {!loaded && !loadError && <p className="load-status" role="status">Preparing your desk…</p>}
        {audio.available && <button className="sound-toggle" onClick={audio.toggleMuted} aria-pressed={audio.muted}>{audio.muted ? 'SOUND OFF' : 'SOUND ON'}</button>}
      </div>
    </main>
  );
}
