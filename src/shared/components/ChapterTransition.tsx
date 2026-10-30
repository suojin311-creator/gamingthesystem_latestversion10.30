import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { metricDefinition, type MetricId } from '../data/metrics';
import { useVisibleDelay } from '../hooks/useVisibleDelay';
import type { Cue } from '../hooks/useFeedback';
import CharacterPortrait from './CharacterPortrait';
import Icon from './Icon';
import '../styles/conversation.css';
import '../styles/chapter-transition.css';

type Props = {
  level: 1 | 2 | 3;
  backdrop?: string;
  playerName: string;
  previousMetricId?: MetricId;
  previousObservation?: string;
  initialMetricIds?: readonly MetricId[];
  play: (cue: Cue) => void;
  onStart: () => void;
};
type Beat = 'hold' | 'turn' | 'chapter' | 'ready';

/** A chapter break, not a reward: carry the unresolved consequence into a new experiment. */
export default function ChapterTransition({ level, backdrop, playerName, previousMetricId, previousObservation, initialMetricIds, play, onStart }: Props) {
  const [beat, setBeat] = useState<Beat>('hold');
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const entry = useRef<HTMLDivElement>(null);
  const [entrySettled, setEntrySettled] = useState(false);
  const started = useRef(false);
  const weights = level === 3;
  const first = level === 1;
  const carried = weights && initialMetricIds?.length === 3 ? initialMetricIds : [];
  const ready = beat === 'ready';
  const chapterVisible = beat === 'chapter' || ready;
  const titleText = first ? 'One metric.' : weights ? 'The weighting trap.' : 'More metrics.';
  const question = first ? 'Which metric would tell me the most?' : weights ? 'I’ll change how much each one counts.' : 'What if I checked three areas?';

  useVisibleDelay(`chapter:${level}:${beat}`, '.chapter-transition', beat === 'hold' ? 900 : beat === 'turn' ? 1000 : 1100, !ready, () => {
    if (beat === 'hold') { setBeat('turn'); play('paper'); }
    else if (beat === 'turn') { setBeat('chapter'); play('chapter'); }
    else setBeat('ready');
  });

  // Wait for the final dialogue entrance, then hold two visible seconds.
  useEffect(() => {
    if (!ready || !entry.current) return;
    const style = getComputedStyle(entry.current);
    if (style.animationName === 'none' || style.animationDuration.split(',').every(t => parseFloat(t) === 0)) setEntrySettled(true);
  }, [ready]);
  useVisibleDelay(`chapter:${level}:enter`, '.chapter-transition', 2000, ready && entrySettled, () => {
    if (started.current) return;
    started.current = true;
    onStart();
  });

  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries[0].intersectionRatio >= .15), { threshold: .15 });
    if (root.current) observer.observe(root.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => { if (chapterVisible) title.current?.focus({ preventScroll: true }); }, [chapterVisible]);

  return <section ref={root} className="chapter-transition" data-level={level} data-beat={beat} aria-label={`Level ${level} introduction`} style={{ '--chapter-play-state': visible && pageVisible ? 'running' : 'paused' } as CSSProperties}>
    {backdrop && <img className="chapter-origin-backdrop" src={backdrop} alt="" aria-hidden="true" />}
    <div className="chapter-recap" aria-label="Previous experiment">
      <span className="chapter-last-level">{first ? 'THE MISSION' : `LEVEL 0${level - 1}`}</span>
      <span className="chapter-report"><Icon name={first ? 'eye' : 'check'} />{first ? 'Improve engagement' : weights ? '100 requirements tracked' : 'Target met'}</span>
      <span className="chapter-consequence"><Icon name="student" />{first ? 'What will I measure?' : weights ? 'Chasing ticks.' : previousObservation || 'Learning still unclear.'}</span>
    </div>
    <div className="chapter-heading" aria-hidden={!chapterVisible}>
      <span className="chapter-label">LEVEL <b>0{level}</b></span>
      <h1 ref={title} tabIndex={-1}>{titleText}</h1>
      <span className="chapter-rule" aria-hidden="true" />
    </div>
    <div className="chapter-stage">
      <div className={`chapter-outgoing ${weights ? 'chapter-checklist' : 'chapter-single'}`} aria-hidden={beat !== 'hold'}>
        {weights ? <><span className="chapter-checklist-binding" /><span className="chapter-paper-label">ALEX’S CHECKLIST</span><strong>100<span> / 100</span></strong><div className="chapter-checklist-lines" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <span key={index}><Icon name="check" /><i /></span>)}</div></>
          : <><Icon name={previousMetricId || 'eye'} /><span>{first ? 'Engagement' : previousMetricId ? metricDefinition(previousMetricId).shortName : 'One metric'}</span>{!first && <span className="chapter-card-check"><Icon name="check" /></span>}</>}
      </div>
      <div className={`chapter-incoming ${weights ? 'chapter-priorities' : 'chapter-empty-slots'}`} role="group" aria-hidden={beat === 'hold'} aria-label={first ? 'One metric to choose' : weights ? carried.length === 3 ? 'Your three priorities, ready to weight' : 'Three priorities to choose and weight' : 'Three empty metric slots'}>
        {Array.from({ length: first ? 1 : 3 }, (_, index) => {
          const id = carried[index];
          return <div className="chapter-new-card" key={index} data-metric={id} style={{ '--chapter-card': index } as CSSProperties}>
            {weights ? <><Icon name={id || 'question'} /><span>{id ? metricDefinition(id).shortName : `Priority ${index + 1}`}</span><div className="chapter-slider" aria-hidden="true"><i /></div></>
              : <><span className="chapter-slot-number">0{index + 1}</span><span className="chapter-empty-mark" aria-hidden="true">+</span><span className="sr-only">Empty metric slot {index + 1}</span></>}
          </div>;
        })}
      </div>
    </div>
    <div ref={entry} className="chapter-entry" onAnimationEnd={event => { if (event.target === event.currentTarget && ready) setEntrySettled(true); }}>
      {ready && <>
        <div className="conversation chapter-bridge" aria-label="Character dialogue"><div className="dialogue-character maya-character"><span className="avatar maya-avatar" aria-hidden="true"><CharacterPortrait role="teacher" /></span><div className="speech-bubble maya-bubble"><span className="speaker-name">{playerName}</span><p>{question}</p></div></div></div>
      </>}
    </div>
  </section>;
}
