import type { CSSProperties } from 'react';
import Icon from '../../shared/components/Icon';
import { metricDefinition } from '../../shared/data/metrics';
import { EFFORT_LABELS, type WeightRun } from './data';
import { effortAt, isNearEven } from './weights';
import EffortDisplay from './EffortDisplay';

const testName = (round: number) => round === 1 ? 'First test' : round === 2 ? 'Second test' : 'Third test';
const intensity = { low: 0, medium: 1, high: 2 };
const CHANGE = { baseline: ['—', 'First result'], same: ['=', 'Same effort'], more: ['↑', 'More effort'], less: ['↓', 'Less effort'] };

export default function WeightComparison({ runs }: { runs: WeightRun[] }) {
  return <div className="l3-comparison" data-testid="weight-comparison">
    <table className="l3-compare-table" aria-label="Alex’s effort across all tested weights" style={{ '--trial-count': runs.length } as CSSProperties}>
      <thead><tr><th scope="col" className="l3-compare-metric-heading">Metric</th>{runs.map((run, i) => <th scope="col" key={run.round} data-run={run.round} data-kind={run.kind} className={isNearEven(run.weights) ? 'near-even' : 'uneven'}><span className="eyebrow">{run.kind !== 'player' ? 'Reference' : testName(run.round)}</span><small>{isNearEven(run.weights) ? 'Near-even weights' : 'Uneven weights'}</small><span className="l3-comparison-basis">{i ? `Effort vs ${testName(runs[i - 1].round)}` : 'Starting observation'}</span></th>)}</tr></thead>
      <tbody>{runs[0].metricIds.map(id => <tr key={id} data-metric={id}>
        <th scope="row"><Icon name={id} /><span>{metricDefinition(id).shortName}</span></th>
        {runs.map((run, runIndex) => {
          const index = run.metricIds.indexOf(id);
          const effort = effortAt(run.weights, index);
          const previous = runs[runIndex - 1];
          const delta = previous ? intensity[effort] - intensity[effortAt(previous.weights, previous.metricIds.indexOf(id))] : 0;
          const change = !previous ? 'baseline' : delta > 0 ? 'more' : delta < 0 ? 'less' : 'same';
          const [symbol, label] = CHANGE[change];
          return <td key={run.round} data-run={run.round} data-effort={effort} data-effort-change={change} className={isNearEven(run.weights) ? 'near-even' : 'uneven'} aria-label={`${metricDefinition(id).name}, ${run.kind !== 'player' ? 'reference' : `test ${run.round}`}: score weight ${run.weights[index]} percent; Alex’s effort: ${EFFORT_LABELS[effort]}; ${label}${previous ? ` compared with ${testName(previous.round)}` : ''}`}>
            <span className="l3-compare-weight"><span className="sr-only">Score weight: </span><strong className="l3-row-weight">{run.weights[index]}<small>%</small></strong></span>
            <EffortDisplay metricId={id} effort={effort} />
            <span className="l3-effort-change" data-change={change}><span aria-hidden="true">{symbol}</span>{label}</span>
          </td>;
        })}
      </tr>)}</tbody>
    </table>
  </div>;
}
