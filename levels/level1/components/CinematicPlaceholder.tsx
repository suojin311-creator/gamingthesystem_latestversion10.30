import { teacherSpeech } from '../../../shared/utils/teacherSpeech';
import { useEffect, useRef, useState } from 'react';
import classroom from '../../../assets/classroom.png';
import { getMetric, type MetricId } from '../metrics';
import Icon from '../../../shared/components/Icon';

export type CinematicRequest = { sceneId: string; metricId: MetricId; playerName: string };

export default function CinematicPlaceholder({ request, onComplete }: {
  request: CinematicRequest; onComplete: () => void;
}) {
  const metric = getMetric(request.metricId)!;
  const [line, setLine] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  const current = metric.scene[line];
  const last = line === metric.scene.length - 1;

  return <section className="interlude" aria-label="Classroom story placeholder" data-testid="cinematic-placeholder">
    <img className="interlude-background" src={classroom} alt="A sunlit classroom, ready for the next story scene." />
    <div className="interlude-shade" />
    <div className="interlude-header"><span className="film-label"><span /> Story placeholder</span><span>CLASSROOM / {metric.shortName}</span></div>
    <div className="interlude-title"><p className="eyebrow light">AFTER THE EVALUATION</p><h2 ref={title} tabIndex={-1}>Back in the classroom.</h2><p>A temporary reading of this branch.<br />The finished cinematic will take its place.</p></div>
    <div className="scene-caption" aria-live="polite" aria-atomic="true" key={line}>
      <span className={`speaker-label ${current.speaker.toLowerCase()}`}>{current.speaker === 'Maya' ? request.playerName : 'Alex'}</span>
      <p>“{current.speaker === 'Maya' ? teacherSpeech(current.text) : current.text}”</p>
    </div>
    <div className="interlude-controls"><div className="scene-dots" aria-label={`Line ${line + 1} of ${metric.scene.length}`}>{metric.scene.map((_, index) => <span key={index} className={index <= line ? 'filled' : ''} />)}</div><button className="button light-button" onClick={() => last ? onComplete() : setLine(value => value + 1)}>{last ? 'Return to dashboard' : 'Continue scene'}<Icon name="arrow" /></button></div>
  </section>;
}
