import neutral from '../../../assets/characters/alex-rig/production/base/ALEX-PROD-001 — Seated Alex Neutral.png';
import blink from '../../../assets/characters/alex-rig/production/expressions/ALEX-PROD-002 — Blink.png';
import pleased from '../../../assets/characters/alex-rig/production/expressions/ALEX-PROD-003 — Pleased.png';
import uncertain from '../../../assets/characters/alex-rig/production/expressions/ALEX-PROD-004 — Uncertain.png';
import { alexBlinkAt, type AlexExpression } from './level2Performance';
import './alexPerformance.css';

/** Neutral/pleased share a fixed pose; uncertainty is a motivated tighter cut. */
export function AlexPerformance({ elapsed, expression = 'neutral', uncertainty = 0, reducedMotion = false }: {
  elapsed: number; expression?: AlexExpression; uncertainty?: number; reducedMotion?: boolean;
}) {
  const closed = expression !== 'uncertain' && !reducedMotion && alexBlinkAt(elapsed);
  const breathing = reducedMotion ? 0 : Math.sin(elapsed * 1.35) * .12;
  return <div className={`l2-alex-performance${expression === 'uncertain' ? ' l2-alex-performance--uncertain' : ''}`} role="img" aria-label={`Alex, ${expression === 'uncertain' ? 'quietly uncertain after a pause' : expression === 'pleased' ? 'quietly satisfied' : 'attentive'}`} data-expression={expression} data-blink={closed} data-reaction-progress={uncertainty}>
    <div className="l2-alex-body" style={{ transform: `translateY(${breathing}%)` }}>
      <img src={expression === 'uncertain' ? uncertain : neutral} alt="" />
      {expression === 'pleased' && <img className="l2-alex-face" src={pleased} alt="" />}
      {closed && <img className="l2-alex-eyelids" src={blink} alt="" />}
    </div>
  </div>;
}
