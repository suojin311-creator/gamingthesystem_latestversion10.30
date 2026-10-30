import React from 'react';
import { professorLabel } from '../../src/shared/data/professorLabel.js';
import group from '@partner-scenes/    REF-L2-002 — Quality-heavy Classroom.png';
import professorWide from '../../revision-assets/level2/L2-Professor-POV-Extreme-Wide.png';
import './three-metrics.css';

export { professorWide };

function Emphasis({ text, phrase }) {
  if (!phrase || !text.includes(phrase)) return text;
  const index = text.indexOf(phrase);
  return <>{text.slice(0, index)}<strong>{phrase}</strong>{text.slice(index + phrase.length)}</>;
}

export function ThreeMetricsScene({ shot, time, request, reducedMotion }) {
  const wide = shot.view === 'professor-wide';
  const narrative = shot.id === 'strategy-spreading';
  const progress = Math.min(1, time / (shot.end - shot.start));
  // The first three dialogue beats share a stationary image. Only the narrative
  // gently pulls back; the approved Professor image always keeps its full frame.
  const zoom = wide || reducedMotion ? 1 : narrative ? 1.025 - progress * .025 : 1.025;
  const captionOpacity = reducedMotion ? 1 : Math.min(1, time / .2, Math.max(0, (shot.end - shot.start - time) / .3));
  const speaker = shot.speaker === 'You' ? professorLabel(request.playerName) : shot.speaker;
  return <section className={'l2-revision-scene l2-three-scene ' + (wide ? 'l2-three-wide' : 'l2-three-group')} data-revision-shot={shot.id} data-branch={request.branch}>
    <div className="l2-three-camera" style={{ transform: `scale(${zoom})` }}>
      <img className="l2-three-plate" src={wide ? professorWide : group} alt={wide ? 'Approved extreme-wide classroom viewed from the Professor’s observation point.' : 'Alex in his orange hoodie talking with the surrounding classmates.'} />
    </div>
    {narrative ? <p className="l2-three-narrative" role="status" style={{ opacity: captionOpacity }}>{shot.text}</p> : <div role="status" className={'l2-comic-bubble l2-three-bubble speaker-' + (wide ? 'professor' : shot.speaker === 'Alex' ? 'alex' : 'classmate')} data-speaker={shot.speaker}>
      <span className="l2-comic-speaker">{speaker}</span><p><Emphasis text={shot.text} phrase={shot.emphasis} /></p>
    </div>}
  </section>;
}
