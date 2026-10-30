import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Icon from '../../shared/components/Icon';
import LearningRisk from '../../shared/components/LearningRisk';
import ManagementSatisfaction, { MANAGEMENT_PROGRESS } from '../../shared/components/ManagementSatisfaction';
import { STUDENT_OBSERVATIONS, type RoundCount } from './data';

export default function Perspectives({ count, reportedCount, observedCount, evaluating }: {
  count: RoundCount; reportedCount: number; observedCount: RoundCount | null;
  evaluating: boolean;
}) {
  const reported = reportedCount === count;
  const observed = observedCount === count;
  const students = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => setInView(entries[0].intersectionRatio >= .15), { threshold: .15 });
    if (students.current) observer.observe(students.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const satisfaction = MANAGEMENT_PROGRESS.metrics[reportedCount as RoundCount] ?? MANAGEMENT_PROGRESS.targetMet;
  return <aside className="l2-perspectives" aria-label="Two perspectives">
    <section className={`l2-perspective l2-management ${reportedCount > 0 ? 'l2-has-report' : ''}`} data-round={count} data-management-panel>
      <div className="l2-perspective-heading"><Icon name="school" /><h3>Management’s view</h3></div>
      <ManagementSatisfaction value={satisfaction}>
        {reported ? <><span className="l2-reported-count">{count}</span> metrics tracked{count <= 6 ? ' · targets met' : ''}</> : evaluating ? 'Evaluating…' : 'Previous target met'}
      </ManagementSatisfaction>
    </section>
    <section ref={students} className={`l2-perspective l2-students ${observed ? 'l2-has-observation' : ''}`} data-round={count} data-observed={observed} style={{ '--student-warning-play-state': inView && pageVisible ? 'running' : 'paused' } as CSSProperties}>
      <div className="l2-perspective-heading"><Icon name="student" /><h3>Students</h3></div>
      {observed ? <LearningRisk behaviour={STUDENT_OBSERVATIONS[count]} /> : <>
        <div className="l2-pending-eye"><Icon name="eye" /></div>
        <p className="l2-awaiting-observation">Awaiting observation</p>
      </>}
    </section>
  </aside>;
}
