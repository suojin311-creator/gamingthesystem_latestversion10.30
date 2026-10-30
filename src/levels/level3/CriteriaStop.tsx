import { useState } from 'react';
import { useVisibleDelay } from '../../shared/hooks/useVisibleDelay';
import Icon from '../../shared/components/Icon';
import { effortAt } from './weights';
import type { WeightRun } from './data';

/** Show the stopping rule, separately from the amount of effort in the rows. */
export default function CriteriaStop({ runKey, run, onComplete }: { runKey: string; run: WeightRun; onComplete: () => void }) {
  const [beat, setBeat] = useState(0);
  const covered = run.metricIds.map((_, index) => effortAt(run.weights, index) !== 'low');
  useVisibleDelay(`${runKey}:routine:${beat}`, '.l3-criteria-stop', beat === 2 ? 500 : 650, beat < 3, () => {
    setBeat(value => value + 1);
    if (beat === 2) onComplete();
  });
  return <figure className="l3-criteria-stop" data-testid="criteria-stop" data-covered-count={covered.filter(Boolean).length} aria-label="Alex checks what earns marks, collects marks from the tasks he prioritizes, then packs up and stops.">
    {[0, 1, 2].map(index => <div className="l3-routine-beat" key={index} data-shown={index <= beat}>
      <svg viewBox="0 0 160 90" fill="none" aria-hidden="true">
        <ellipse cx="80" cy="80" rx="54" ry="4" fill="#bda783" opacity=".15" />
        {index < 2 ? <>
          <path d="M50 12h56v62H50Z" fill="#fffaf0" stroke="#b6a17c" strokeWidth="1.6" />
          <path d="M65 9h26v8H65Z" fill="#d8c5a1" stroke="#b6a17c" strokeWidth="1.3" />
          {[29, 44, 59].map((y, taskIndex) => <g key={y} data-task-covered={covered[taskIndex]}><rect x="59" y={y} width="9" height="9" rx="1" stroke="#9c9876" strokeWidth="1.4" /><path d={`M75 ${y+4}h22`} stroke="#c1b494" strokeWidth="2" />{index === 1 && covered[taskIndex] && <path data-mark-earned d={`m60 ${y+4} 3 3 6-7`} stroke="#788b60" strokeWidth="2.3" strokeLinecap="round" />}</g>)}
          {index === 0 && <><path d="M22 43s9-14 21-14 21 14 21 14-9 14-21 14S22 43 22 43Z" fill="#efe6d3" stroke="#a88e67" strokeWidth="1.5" /><circle cx="43" cy="43" r="6" stroke="#a88e67" strokeWidth="2" /></>}
        </> : <>
          <path d="M55 31v-8c0-8 28-8 28 0v8" stroke="#a99068" strokeWidth="3" />
          <path d="M43 31h53l8 43H36Z" fill="#d7c29b" stroke="#a99068" strokeWidth="1.7" />
          <path d="M44 46h51M49 46v21h40V46" stroke="#a99068" strokeWidth="1.7" />
          <path className="l3-pack-paper" d="M47 22l10-6 28 8-4 9H47Z" fill="#fff8e8" stroke="#a99068" strokeWidth="1.5" />
          <rect x="107" y="23" width="24" height="24" fill="#b66c50" rx="3" /><path d="M115 30h8v10h-8Z" fill="#fff8e8" />
        </>}
      </svg>
      <span className="l3-routine-label">{index === 0 ? 'Checks what counts' : index === 1 ? 'Gets the marks' : 'Packs up. Stops.'}</span>
      {index < 2 && <Icon name="arrow" className="l3-routine-arrow" />}
    </div>)}
  </figure>;
}
