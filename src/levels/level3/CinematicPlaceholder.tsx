import { useEffect, useRef, useState } from 'react';
import classroom from '../../assets/classroom.png';
import Icon from '../../shared/components/Icon';
import { metricDefinition } from '../../shared/data/metrics';
import { EFFORT_LABELS, comparisonSummary, type LevelThreeCinematicRequest } from './data';
import { comparisonDialogue, weightedSceneAction, weightedSceneReply } from './dialogue';

export default function CinematicPlaceholder({ request, onComplete }: { request: LevelThreeCinematicRequest; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), [index]);
  const lines = request.kind === 'weights' ? request.shots.map((shot, index) => ({
    speaker: 'Alex', text: weightedSceneReply(request, index),
    title: metricDefinition(shot.metricId).name, action: weightedSceneAction(request, index),
    badge: `${shot.weight}% · ${EFFORT_LABELS[shot.effort]}`,
  })) : request.kind === 'comparison' ? comparisonDialogue(request.playerName, request.runs, request.decision).map(line => ({ ...line, title: 'The same rules. A different split.', action: comparisonSummary(request.runs), badge: 'COMPARE THE PATTERNS' })) : [
    { speaker: request.playerName, text: 'Am I improving learning, or just improving the numbers?', title: 'One pattern. Three levels.', action: 'One metric became a target. More metrics became a checklist. We tested how weights guide Alex’s choices.', badge: 'FINAL SCENE' },
    { speaker: 'Goodhart’s Law', text: 'When a measure becomes a target, it ceases to be a good measure.', title: 'Goodhart’s Law', action: 'Better indicators and better weighting can help. Higher scores alone do not show that learning improved.', badge: 'THEORY REVEAL' },
  ];
  const line = lines[index];
  const finalFrame = request.kind === 'theory' && index === lines.length - 1;
  return <section className="l3-cinematic" data-testid="level3-cinematic" data-scene-id={request.sceneId} data-shot-id={request.shots[index]?.sceneId} aria-label="Level 3 story placeholder">
    <img src={classroom} className="l3-scene-background" alt="A sunlit classroom." />
    <div className="l3-scene-top"><span><Icon name="play" />Story placeholder</span><span>{request.kind === 'weights' ? `ROUND ${request.runs.at(-1)!.round}` : line.badge}</span></div>
    <div className="l3-scene-copy"><span className="eyebrow">{request.kind === 'weights' ? 'ALEX READS THE NEW SCORING PERCENTAGES' : 'TEMPORARY CINEMATIC'}</span><h2 tabIndex={-1} ref={title}>{line.title}</h2><p>{line.action}</p>{request.kind === 'weights' && <strong className="l3-shot-badge">{line.badge}</strong>}<small>The finished cinematic will replace this reading.</small></div>
    <div className="l3-scene-caption" key={index} aria-live="polite"><span>{line.speaker}</span><p>“{line.text}”</p></div>
    <div className="l3-scene-actions"><span className="l3-scene-dots" aria-label={`Shot ${index + 1} of ${lines.length}`}>{lines.map((_, i) => <i key={i} data-active={i <= index} />)}</span>{!finalFrame && <button className="button" onClick={() => index === lines.length - 1 ? onComplete() : setIndex(index + 1)}>{index < lines.length - 1 ? 'Continue scene' : request.kind === 'weights' ? 'Return to dashboard' : request.kind === 'comparison' ? 'Reveal Goodhart’s Law' : 'Continue scene'}<Icon name="arrow" /></button>}{finalFrame && <span className="l3-preview-end">End of preview</span>}</div>
  </section>;
}
