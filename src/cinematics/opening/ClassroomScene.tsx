import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ClassroomAmbient from './ClassroomAmbient';
import { STUDENTS } from './classroomMedia';
import InteractionCue from './InteractionCue';
import { useVisibleDelay } from '../../shared/hooks/useVisibleDelay';
import AlexEncounter from './AlexEncounter';

type StudentId = 'sleeping' | 'phone' | 'unprepared';
type Phase = 'waiting' | 'establishing' | 'explore' | 'focus' | 'response' | 'alex' | 'returnWide' | 'settle' | 'thought' | 'exitCue' | 'exitFocus' | 'leaving';
type Cue = 'studentInspect' | 'transition';

const WIDE = { scale: 1.01, x: '0%', y: '0%' };
const EXIT_CUE = { scale: 1.09, x: '-3%', y: '0%' };
const EXIT_FOCUS = { scale: 1.6, x: '-27%', y: '5%' };

export default function ClassroomScene({ playerName, active, onReturn, play, startClassroom, fadeClassroomOut }: {
  playerName: string;
  active: boolean;
  onReturn: () => void;
  play: (cue: Cue) => void;
  startClassroom: () => void;
  fadeClassroomOut: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [selected, setSelected] = useState<StudentId | null>(null);
  const [keyboardTarget, setKeyboardTarget] = useState<StudentId | null>(null);
  const [sleepingInspected, setSleepingInspected] = useState(false);
  const [phoneInspected, setPhoneInspected] = useState(false);
  const [unpreparedInspected, setUnpreparedInspected] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [alexComplete, setAlexComplete] = useState(false);
  const reducedMotion = useReducedMotion();
  const interactionLock = useRef(false);
  const returned = useRef(false);
  const returnButton = useRef<HTMLButtonElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const allInspected = sleepingInspected && phoneInspected && unpreparedInspected;
  const classroomComplete = allInspected && alexComplete;
  const inspected = { sleeping: sleepingInspected, phone: phoneInspected, unprepared: unpreparedInspected };
  const nextStudent = STUDENTS.find(student => !inspected[student.id])?.id;
  const guidedStudent = keyboardTarget && !inspected[keyboardTarget] ? keyboardTarget : nextStudent;
  const focused = STUDENTS.find(student => student.id === selected);
  const camera = ['focus', 'response', 'alex'].includes(phase) && focused ? focused.camera
    : phase === 'exitCue' ? EXIT_CUE
    : ['exitFocus', 'leaving'].includes(phase) ? EXIT_FOCUS : WIDE;

  useEffect(() => {
    if (!active) {
      setPhase('waiting'); setSelected(null); setKeyboardTarget(null);
      setSleepingInspected(false); setPhoneInspected(false); setUnpreparedInspected(false);
      setAlexComplete(false);
      interactionLock.current = false;
      returned.current = false;
      return;
    }
    if (mediaReady && phase === 'waiting') {
      startClassroom();
      setPhase('establishing');
    }
  }, [active, mediaReady, phase, startClassroom]);

  // Reading holds start after arrival. Camera and exposure callbacks own movement.
  const hold = phase === 'establishing' ? 1000 : phase === 'response' ? 1700 : phase === 'settle' ? 550 : phase === 'thought' ? 1900 : 0;
  useVisibleDelay(`opening-classroom:${phase}:${selected}`, '.opening-scene .stage', hold, active && hold > 0, () => {
    if (phase === 'establishing') setPhase('explore');
    else if (phase === 'response') {
      if (selected === 'sleeping') setSleepingInspected(true);
      if (selected === 'phone') setPhoneInspected(true);
      if (selected === 'unprepared') setUnpreparedInspected(true);
      setPhase(selected === 'phone' && !alexComplete ? 'alex' : 'returnWide');
    } else if (phase === 'settle') setPhase('thought');
    else if (phase === 'thought') setPhase('exitCue');
  });

  const cameraArrived = () => {
    if (phase === 'focus') setPhase('response');
    else if (phase === 'returnWide') {
      setSelected(null);
      interactionLock.current = false;
      setPhase(classroomComplete ? 'settle' : 'explore');
    } else if (phase === 'exitFocus') {
      fadeClassroomOut();
      setPhase('leaving');
    }
  };

  useEffect(() => {
    if (phase === 'explore' && !allInspected) {
      setKeyboardTarget(null);
      const button = world.current?.querySelector<HTMLButtonElement>('.student-hotspot[data-inspected="false"]');
      button?.focus({ preventScroll: true });
    }
    if (phase === 'exitCue') returnButton.current?.focus({ preventScroll: true });
  }, [phase, allInspected]);

  return (
    <motion.div ref={world} className="classroom-world" aria-label="First-person classroom" aria-hidden={!active} inert={!active} data-phase={phase} data-alex-complete={alexComplete} initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: active ? 0.6 : 0 }}>
      <motion.div className="classroom-camera" aria-hidden={phase === 'alex'} inert={phase === 'alex'} initial={WIDE} animate={camera} transition={{ duration: reducedMotion ? 0 : phase === 'exitFocus' ? 1.1 : phase === 'returnWide' ? 0.85 : 0.9, ease: [0.4, 0, 0.2, 1] }} onAnimationComplete={cameraArrived}>
        <ClassroomAmbient active={active} onReady={setMediaReady} />
        <div className="classroom-interactions" aria-label="Student observations">
        {STUDENTS.map(student => (
          <button key={student.id} className={`student-hotspot hotspot-${student.id}`} style={student.hotspot} aria-label={student.label} data-inspected={inspected[student.id]} disabled={!active || phase !== 'explore'} onFocus={event => {
            if (event.currentTarget.matches(':focus-visible') && !inspected[student.id]) setKeyboardTarget(student.id);
          }} onClick={() => {
            if (interactionLock.current || phase !== 'explore') return;
            interactionLock.current = true;
            setSelected(student.id); play('studentInspect'); setPhase('focus');
          }}>{phase === 'explore' && student.id === guidedStudent && <span className="opening-student-marker"><InteractionCue /></span>}</button>
        ))}
        </div>
        <AnimatePresence>
          {phase === 'exitCue' && classroomComplete && <motion.button key="exit" ref={returnButton} className="opening-action classroom-exit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} onClick={() => {
            if (interactionLock.current || !classroomComplete) return;
            interactionLock.current = true; play('transition'); setPhase('exitFocus');
          }}>RETURN TO OFFICE <span aria-hidden="true">→</span></motion.button>}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {phase === 'explore' && !allInspected && <motion.p key="look" className="classroom-look" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>Come closer to take a look at the students.</motion.p>}
        {phase === 'response' && focused && <motion.p key={focused.id} className={`student-dialogue ${focused.id === 'sleeping' ? 'sleeping-response' : ''}`} role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>{focused.id === 'sleeping' ? focused.dialogue : `“${focused.dialogue}”`}</motion.p>}
        {phase === 'thought' && <motion.p key="thought" className="classroom-thought" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>Okay... this is worse than I thought.</motion.p>}
      </AnimatePresence>
      {phase === 'alex' && <AlexEncounter playerName={playerName} onComplete={() => {
        setAlexComplete(true);
        setPhase('returnWide');
      }} />}
      {active && !['waiting','establishing','leaving', 'alex'].includes(phase) && <div className="opening-observation-progress" role="img" aria-label={`Observe all three students: ${Object.values(inspected).filter(Boolean).length} of 3 complete`}>
        {STUDENTS.map(student => <span key={student.id} data-student={student.id} data-complete={inspected[student.id]}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">{inspected[student.id] ? <path d="m5 12 4 4L19 6" /> : <><circle cx="12" cy="7" r="3" /><path d="M5 21v-4a7 7 0 0 1 14 0v4" /></>}</svg></span>)}
      </div>}
      <motion.div className="classroom-exposure" aria-hidden="true" initial={{ opacity: 1 }} animate={{ opacity: !active || phase === 'waiting' || phase === 'leaving' ? 1 : 0 }} transition={{ duration: reducedMotion ? 0.1 : 0.7 }} onAnimationComplete={() => { if (active && phase === 'leaving' && !returned.current) { returned.current = true; onReturn(); } }} />
      {active && phase === 'waiting' && <p className="load-status" role="status">Entering the classroom…</p>}
    </motion.div>
  );
}
