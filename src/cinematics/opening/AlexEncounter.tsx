import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ComicBubble from '../comic/ComicBubble';
import alexNeutral from '../../../revision-assets/references/alex/ALEX-PROD-001 — Seated Alex Neutral.png';
import { useVisibleDelay } from '../../shared/hooks/useVisibleDelay';
import './alex-encounter.css';

const LINES = [
  <>Professor, what exactly do we need to do to get a <strong>good score?</strong></>,
  <>Engagement is about <strong>more than just getting a score</strong>, Alex.</>,
  <>Sure! But what exactly will you be <strong>measuring?</strong></>,
  <>That’s actually a <strong>good question…</strong></>,
];

/** Opening presentation only. ClassroomScene owns the once-per-run completion gate. */
export default function AlexEncounter({ playerName, onComplete }: { playerName: string; onComplete: () => void }) {
  const [line, setLine] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [changing, setChanging] = useState(false);
  const lock = useRef(false);
  const finished = useRef(false);
  const action = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const introduction = line === null;
  const professor = line === 1 || line === 3;
  useVisibleDelay('alex-introduction', '.alex-encounter', reduced ? 100 : 1500, loaded && !failed, () => setIntroReady(true));
  useEffect(() => { if (introReady && !changing) action.current?.focus({ preventScroll: true }); }, [introReady, changing, line]);
  const advance = () => {
    if (lock.current || finished.current || !introReady) return;
    lock.current = true;
    if (line === LINES.length - 1) {
      finished.current = true;
      onComplete();
    } else {
      setChanging(true);
      setLine(line === null ? 0 : line + 1);
    }
  };
  const fade = { duration: reduced ? 0 : .25 };
  return <motion.section className={`alex-encounter ${introduction ? 'alex-encounter--intro' : 'alex-encounter--dialogue'}`} aria-label={introduction ? 'Alex character introduction' : 'Conversation with Alex'} data-line={line ?? 'intro'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade}>
    <div className="alex-encounter__backdrop" aria-hidden="true" />
    <div className="alex-encounter__portrait" role="img" aria-label="Alex looking toward you, framed from his approved seated artwork">
      <img src={alexNeutral} alt="" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
    </div>
    {loaded && !failed && (introduction ? <div className="alex-encounter__intro">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade}>ALEX <span>— THE STRATEGIC ACHIEVER</span></motion.h2>
      {['Top of the class. Every. Single. Semester.', 'Need study tips? His classmates know exactly who to ask.', 'Deep thinking? Only if it can be measured.'].map((text, index) => <motion.p key={text} initial={{ opacity: 0, y: reduced ? 0 : 7 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: reduced ? 0 : .25 + index * .3 }}>{text}</motion.p>)}
    </div> : <div className={`alex-encounter__placement alex-encounter__placement--${professor ? 'professor' : 'alex'}`} aria-live="polite" aria-atomic="true">
      <motion.div key={line} initial={{ opacity: 0, y: reduced ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={fade} onAnimationComplete={() => { lock.current = false; setChanging(false); }}>
        <ComicBubble speaker={professor ? 'professor' : 'alex'} speakerName={professor ? playerName : 'Alex'}>{LINES[line!]}</ComicBubble>
      </motion.div>
    </div>)}
    {introReady && !failed && <motion.div className="alex-encounter__actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade}>
      {!introduction && <span className="alex-encounter__counter" aria-label={`Dialogue ${line + 1} of 4`}>{line + 1} / 4</span>}
      <button ref={action} className="opening-action" disabled={changing} onClick={advance}>{introduction ? 'TALK TO ALEX' : line === 3 ? 'CONTINUE OBSERVING' : 'Continue'} <span aria-hidden="true">→</span></button>
    </motion.div>}
    {!loaded && !failed && <p className="alex-encounter__status" role="status">Preparing Alex’s introduction…</p>}
    {failed && <p className="alex-encounter__status" role="alert">Alex’s image could not load. Please refresh to try again.</p>}
  </motion.section>;
}
