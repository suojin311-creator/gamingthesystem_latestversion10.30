import Icon from './Icon';
import CharacterPortrait from './CharacterPortrait';
import { METRIC_CATALOG, type MetricId } from '../data/metrics';
import '../styles/observation.css';

export default function ObservationContent({ evidence, metricIds }: { evidence: string; metricIds: readonly MetricId[] }) {
  const contrast = evidence.indexOf(', but ');
  const sentence = evidence.search(/[.!?]\s/);
  const split = contrast >= 0 ? contrast + 1 : sentence >= 0 ? sentence + 1 : evidence.length;
  const fact = evidence.slice(0, split);
  const change = evidence.slice(split).trim();
  return <>
    <span className="eyebrow">IN THE CLASSROOM</span>
    <div className="observation-picture" aria-hidden="true">
      <div className="observation-alex"><CharacterPortrait role="student" /></div>
      <div className="observation-notebook"><i className="observation-binding" />{metricIds.map(id => <span key={id}><Icon name={id} /><Icon name="check" /></span>)}</div>
      {metricIds.length < 6 && <div className="observation-outside">{METRIC_CATALOG.filter(metric => !metricIds.includes(metric.id)).map(metric => <Icon key={metric.id} name={metric.id} />)}</div>}
    </div>
    <p className="observation-copy"><span>{fact}{change && ' '}</span>{change && <strong>{change}</strong>}</p>
  </>;
}
