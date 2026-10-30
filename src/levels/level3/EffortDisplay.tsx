import TaskEffort from '../../shared/components/TaskEffort';
import type { MetricId } from '../../shared/data/metrics';
import { EFFORT_LABELS } from './data';
import type { Effort } from './weights';

export default function EffortDisplay({ metricId, effort }: { metricId: MetricId; effort: Effort }) {
  return <span className="l3-effort"><TaskEffort metricId={metricId} effort={effort} /><span className="l3-effort-detail"><span className="l3-effort-bars" aria-hidden="true">{[0, 1, 2].map(i => <i key={i} data-active={i < (effort === 'low' ? 1 : effort === 'medium' ? 2 : 3)} />)}</span><strong className="l3-effort-label">{EFFORT_LABELS[effort]}</strong></span></span>;
}
