import look from '../../../assets/characters/alex-rig/production/actions/checking/ALEX-PROD-005-CLEAN.png';
import hand from '../../../assets/characters/alex-rig/production/actions/checking/ALEX-HAND-CHECKING.png';
import reaction from '../../../assets/characters/alex-rig/production/expressions/ALEX-PROD-003 — Pleased.png';
import { useLayoutEffect, useRef, useState } from 'react';
import { checkingPenState } from './checklistPresentation';
import { ChecklistSystem, type ChecklistCount, type ChecklistMode } from './ChecklistSystem';
import { alexCheckingFrame } from './alexCheckingTimeline';
import './alexChecking.css';

/** Reusable three-shot insert. No independent timers, baked checks or gameplay state.
 * Identity/framing reference: CHAR-L1-001 — Alex Character Set (existing asset).
 */
export function AlexCheckingSequence({ elapsed, reducedMotion = false, count = 3, mode = 'complete', labels, progress, insertOnly = false }: {
  elapsed: number; reducedMotion?: boolean; count?: ChecklistCount; mode?: ChecklistMode;
  labels?: readonly string[]; progress?: number; insertOnly?: boolean;
}) {
  const frame = alexCheckingFrame(elapsed);
  const paperProgress = progress ?? frame.progress;
  const pen = checkingPenState(count, paperProgress);
  const shot = insertOnly ? 'insert' : frame.shot;
  const notebook = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useLayoutEffect(() => {
    const paper = notebook.current;
    if (!paper || shot !== 'insert') return;
    const reframe = () => {
      const box = paper.querySelector(`[data-criterion="${pen.criterion}"] .l2-checklist-box`);
      const stage = paper.parentElement;
      if (!box || !stage) return;
      const b = box.getBoundingClientRect();
      const p = paper.getBoundingClientRect();
      setOffset({ x: stage.clientWidth * .54 - (b.x - p.x + b.width / 2), y: stage.clientHeight * .59 - (b.y - p.y + b.height / 2) });
    };
    reframe();
    const observer = new ResizeObserver(reframe);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [count, pen.criterion, shot]);
  const mark = progress === undefined && paperProgress < 1 ? frame.mark : pen.mark;
  // Follow ChecklistSystem's actual SVG stroke: M3 10.5 L8 15 L18 3.
  const firstLeg = Math.hypot(5, 4.5) / (Math.hypot(5, 4.5) + Math.hypot(10, 12));
  const leg = mark <= firstLeg ? mark / firstLeg : (mark - firstLeg) / (1 - firstLeg);
  const x = mark <= firstLeg ? 3 + 5 * leg : 8 + 10 * leg;
  const y = mark <= firstLeg ? 10.5 + 4.5 * leg : 15 - 12 * leg;
  const approach = progress === undefined ? frame.approach : pen.approach;
  const lift = progress === undefined ? frame.lift : pen.lift;
  const hover = approach * (reducedMotion ? 0 : 32) + lift * (reducedMotion ? 0 : 38);
  return (
    <div className={`l2-checking l2-checking--${shot}`} data-checking-shot={shot} data-pen-contact={shot === 'insert' && approach === 0 && lift === 0}>
      {shot === 'insert' ? (
        <div className="l2-checking-desk">
          <div ref={notebook} className={`l2-checking-notebook l2-checking-notebook--${count}`} style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
            <ChecklistSystem count={count} mode={mode} labels={labels} progress={paperProgress} reducedMotion={reducedMotion}
              markOverlay={{ criterion: pen.criterion, content: <span className="l2-checking-pen-anchor" style={{ left: `${-15 + x * 7}%`, top: `${-30 + y * 7 - hover}%` }}>
                <img className="l2-checking-hand" style={{ width: `${count === 100 ? 28.7 : count === 25 ? 41.3 : count === 10 ? 57.4 : 78}cqw` }} src={hand} alt="" draggable={false} />
              </span> }} />
          </div>
        </div>
      ) : (
        <img className="l2-checking-portrait" src={frame.shot === 'look' ? look : reaction} alt={frame.shot === 'look' ? 'Alex looks down at his checklist.' : 'Alex gives a small, satisfied smile.'}
          style={{ transform: `scale(${reducedMotion ? 1 : 1 + frame.push * 0.025})` }} />
      )}
      <div className="l2-checking-light" aria-hidden="true" />
    </div>
  );
}
