import { teacherSpeech } from '../../shared/utils/teacherSpeech';
import { useEffect, useRef, useState } from 'react';
import classroom from '../../assets/classroom.png';
import Icon from '../../shared/components/Icon';
import { THREE_OUTCOMES, type LevelTwoCinematicRequest } from './data';
import { classroomDialogue } from './dialogue';

export default function CinematicPlaceholder({ request, onComplete }: {
  request: LevelTwoCinematicRequest; onComplete: () => void;
}) {
  const [line, setLine] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  const lines = classroomDialogue(request);
  const current = lines[line];
  return <section className="l2-cinematic" aria-label="Level 2 classroom story placeholder" data-testid="level2-cinematic" data-scene-id={request.sceneId}>
    <img src={classroom} className="l2-scene-background" alt="A sunlit classroom." />
    <div className="l2-scene-header"><span className="l2-film-label"><Icon name="play" />Story placeholder</span><span>{request.metricCount} METRICS</span></div>
    <div className="l2-scene-intro"><span className="eyebrow">BACK IN THE CLASSROOM</span><h2 ref={title} tabIndex={-1}>What counts now?</h2><p>{request.kind === 'three' ? THREE_OUTCOMES[request.branch].action : request.kind === 'six' ? 'Alex opens a longer checklist and marks all six requirements complete.' : 'A green dashboard sits beside Alex’s carefully managed checklist.'}</p><small>A temporary reading. The finished cinematic will take its place.</small></div>
    <div className="l2-scene-caption" key={line} aria-live="polite"><span>{current.speaker}</span><p>“{current.speaker === 'Alex' ? current.text : teacherSpeech(current.text)}”</p></div>
    <div className="l2-scene-controls"><span className="l2-scene-dots" aria-label={`Line ${line + 1} of ${lines.length}`}>{lines.map((_, index) => <i key={index} data-active={index <= line} />)}</span><button className="button l2-light-button" onClick={() => line === lines.length - 1 ? onComplete() : setLine(value => value + 1)}>{line === lines.length - 1 ? 'Return to dashboard' : 'Continue scene'}<Icon name="arrow" /></button></div>
  </section>;
}
