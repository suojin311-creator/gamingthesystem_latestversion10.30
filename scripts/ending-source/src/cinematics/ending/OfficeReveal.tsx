import { Img } from 'remotion';
import office from '../../../assets/backgrounds/BG_Office_FirstPerson_v01.png';
import { CinematicCamera } from '../shared/engine/CinematicCamera/CinematicCamera';
import { EnvironmentMotion } from '../shared/engine/EnvironmentMotion/EnvironmentMotion';
import { ease, QUESTION, QUOTE } from './endingTimeline';
import { RecapMemories } from './EndingMemories';
import type { EndingProps } from './types';

const metricLabels = ['Preparation', 'Participation', 'On-task focus', 'Discussion quality', 'Learning reflection', 'Peer response'];

export function OfficeReveal({ seconds, ...props }: EndingProps & { seconds: number }) {
  const officeTime = seconds - 31;
  const darkness = ease(seconds, 40.2, 2.3);
  const theory = seconds >= 43;
  const recap = seconds >= 48.8;
  const glow = ease(officeTime, .5, 1.7) * (1 - darkness * .93);
  const question = ease(seconds, 35.5, 1.9) * (1 - ease(seconds, 40.2, 1));
  return <>
    <div className="end-office" style={{ opacity: ease(officeTime, 0, 1.3) }}>
      <CinematicCamera pose={{ scale: props.reducedMotion ? 1 : 1 + ease(officeTime, 0, 9) * .055, x: props.reducedMotion ? 0 : ease(officeTime, 0, 9) * 1.2, y: 0, vignette: .25 + darkness * .45 }}>
        <Img className="end-world" src={office} />
        {/* Same laptop plane as the Opening, in the original artwork coordinates. */}
        <svg className="end-office-plane" viewBox="0 0 1672 941" preserveAspectRatio="none">
          <foreignObject x="0" y="0" width="1672" height="941">
            <div className="end-dashboard" style={{ opacity: glow }}>
              <div className="end-dashboard-heading">Learning indicators <span>✓</span></div>
              <div className="end-dashboard-grid">{metricLabels.map(label => <div key={label}><span>{label}</span><i /><b>✓</b></div>)}</div>
            </div>
          </foreignObject>
        </svg>
        <EnvironmentMotion progress={props.reducedMotion ? 0 : officeTime / 80} style={{ opacity: .18 * (1 - darkness) }} />
        <div className="end-office-night" style={{ opacity: .1 + darkness * .84 }} />
        <div className="end-residual-glow" style={{ opacity: darkness * .1 }} />
      </CinematicCamera>
    </div>
    {seconds >= 35 && seconds < 43 && <div className="end-central-question" style={{ opacity: question }}><p>{QUESTION}</p></div>}
    {theory && <div className={`end-theory ${recap ? 'end-theory-recap' : ''}`} style={{ opacity: ease(seconds, 43.25, 1.1), top: `${29 - ease(seconds, 48.8, 1.1) * 15}%` }}>
      <span className="end-theory-rule" />
      <h1 style={{ letterSpacing: `${.12 - ease(seconds, 43.25, 1.6) * .065}em` }}>GOODHART’S LAW</h1>
      <p style={{ opacity: ease(seconds, 45.2, 1.2) }}>“{QUOTE}”</p>
    </div>}
    {recap && <RecapMemories {...props} time={seconds - 48.8} />}
    {seconds >= 55.2 && <div className="end-handoff-ghost" style={{ opacity: ease(seconds, 55.7, 1) }}>GO TO DESIGN LAB <span>→</span></div>}
  </>;
}
