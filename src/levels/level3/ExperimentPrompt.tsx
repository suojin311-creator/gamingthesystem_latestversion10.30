import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Icon from '../../shared/components/Icon';
import { metricDefinition } from '../../shared/data/metrics';
import { EFFORT_LABELS, observedStudentBehaviour, type WeightRun } from './data';
import { effortAt } from './weights';
import type { Experiment } from './experiments';

export default function ExperimentPrompt({ experiment, previous, attended, paused }: {
  experiment: Experiment; previous?: WeightRun; attended: boolean; paused: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const [attention, setAttention] = useState(true);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries[0].intersectionRatio >= .15), { threshold: .15 });
    if (root.current) observer.observe(root.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <section ref={root} className="l3-experiment" data-purpose={experiment.purpose} data-attention={attention && !attended} aria-labelledby="experiment-question" style={{ '--prompt-play-state': visible && pageVisible && !paused ? 'running' : 'paused' } as CSSProperties} onAnimationEnd={event => { if (event.target === event.currentTarget) setAttention(false); }}>
    <div className="l3-experiment-question"><h3 id="experiment-question">{experiment.question}</h3></div>
    {previous && <div className="l3-previous" role="group" aria-label="Last observation"><div className="l3-previous-heading"><span className="eyebrow">LAST OBSERVATION</span><span className="l3-stopping-reminder"><Icon name="warning" />{observedStudentBehaviour(previous.weights)}</span></div><ul>{previous.metricIds.map((id, index) => {
      const effort = effortAt(previous.weights, index);
      return <li key={id} data-metric={id} data-effort={effort}><Icon name={id} /><span><b>{metricDefinition(id).shortName}</b><span className="l3-context-effort"><span className="l3-effort-bars" aria-hidden="true">{[0, 1, 2].map(i => <i key={i} data-active={i < (effort === 'low' ? 1 : effort === 'medium' ? 2 : 3)} />)}</span>{EFFORT_LABELS[effort]}</span></span></li>;
    })}</ul></div>}
    <details className="l3-strategy-hint"><summary>Need a hint?</summary><p>{experiment.hint}</p></details>
  </section>;
}
