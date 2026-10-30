import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import ChecklistGrowth from './ChecklistGrowth';
import Icon from '../../shared/components/Icon';

/** Keep the desk, counter and paper in place throughout the continuous escalation. */
export default function GrowthSequence({ count, beat, shown, leaving, counter, ready, onObserve }: {
  count: 10 | 25 | 100; beat: number; shown: boolean; leaving: boolean; counter: ReactNode; ready: boolean; onObserve: () => void;
}) {
  const article = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries[0].intersectionRatio >= .15), { threshold: .15 });
    if (article.current) observer.observe(article.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <div className="l2-growth-sequence" data-state={leaving ? 'leaving' : shown ? 'shown' : 'loading'} style={{ '--growth-play-state': visible && pageVisible ? 'running' : 'paused' } as CSSProperties}>
    {counter}
    <div className="l2-observation-slot"><article ref={article} className="l2-observation l2-checklist l2-checklist-stack" data-load={count}>
      <ChecklistGrowth count={count} beat={beat} />
    </article></div>
    <div className="l2-growth-beats" aria-label="Checklist growth" role="group">{[10, 25, 100].map(value => <span key={value} data-current={value === count} data-done={value < count} data-next={leaving && value === (count === 10 ? 25 : 100)} aria-label={`${value} metrics${value === count ? ', current' : value < count ? ', observed' : ''}`}>{value < count ? <Icon name="check" /> : value}</span>)}</div>
    <div className="action-row l2-growth-actions">{ready ? <button className="button primary-button" onClick={onObserve}><Icon name="play" />Observe the class</button> : <span className="l2-next-space" aria-hidden="true" />}</div>
  </div>;
}
