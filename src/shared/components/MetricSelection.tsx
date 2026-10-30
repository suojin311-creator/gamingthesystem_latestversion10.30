import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { METRIC_CATALOG, metricDefinition, type MetricId } from '../data/metrics';
import '../styles/metric-selection.css';

type Props = {
  level: 1 | 2 | 3;
  selected: readonly MetricId[];
  capacity: 1 | 3;
  onToggle: (id: MetricId) => void;
  hint?: string;
};

/** The same six cards and physical selection tray in every chapter. */
export default function MetricSelection({ level, selected, capacity, onToggle, hint }: Props) {
  const [inspected, setInspected] = useState<MetricId | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const flights = useRef(new Set<HTMLElement>());
  const frames = useRef(new Set<number>());
  const detailId = inspected && selected.includes(inspected) ? inspected : selected.at(-1);
  const detail = detailId ? metricDefinition(detailId) : null;
  const cardClass = level === 1 ? 'metric-card' : `l${level}-metric-card`;
  const gridClass = level === 1 ? 'metric-grid' : `l${level}-metric-grid`;

  useEffect(() => () => {
    frames.current.forEach(cancelAnimationFrame);
    flights.current.forEach(element => element.remove());
  }, []);

  function toggle(id: MetricId, source?: HTMLButtonElement) {
    const adding = !selected.includes(id) && (capacity === 1 || selected.length < capacity);
    const start = source?.getBoundingClientRect();
    onToggle(id);
    if (!adding) return;
    setInspected(id);
    if (!start || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const frame = requestAnimationFrame(() => {
      frames.current.delete(frame);
      const destination = root.current?.querySelector(`[data-slot-metric="${id}"]`);
      const end = destination?.getBoundingClientRect();
      if (!end || end.bottom < 0 || end.top > innerHeight) return;
      const tile = document.createElement('div');
      tile.className = 'metric-card-flight';
      tile.setAttribute('aria-hidden', 'true');
      tile.textContent = metricDefinition(id).shortName;
      Object.assign(tile.style, { left: `${start.left}px`, top: `${start.top}px`, width: `${start.width}px`, height: `${start.height}px` });
      document.body.append(tile); flights.current.add(tile);
      const animation = tile.animate([
        { transform: 'translate(0, 0) rotate(-2deg)', opacity: .85 },
        { transform: `translate(${end.left - start.left}px, ${end.top - start.top}px) scale(${end.width / start.width}, ${end.height / start.height}) rotate(0deg)`, opacity: 0 },
      ], { duration: 420, easing: 'cubic-bezier(.2,.7,.3,1)' });
      animation.onfinish = animation.oncancel = () => { tile.remove(); flights.current.delete(tile); };
    });
    frames.current.add(frame);
  }

  return <div className="metric-choice" ref={root} data-capacity={capacity}>
    <div className={`choice-grid ${gridClass}`} role="group" aria-label={capacity === 1 ? 'Choose one metric' : 'Choose three metrics'}>
      {METRIC_CATALOG.map(metric => <button key={metric.id} type="button"
        className={`choice-card ${cardClass} ${selected.includes(metric.id) ? 'selected' : ''}`}
        data-testid={`${level === 1 ? '' : `level${level}-`}metric-${metric.id}`}
        aria-label={metric.name} aria-pressed={selected.includes(metric.id)}
        aria-disabled={capacity === 3 && selected.length === capacity && !selected.includes(metric.id)}
        onClick={event => toggle(metric.id, event.currentTarget)}>
        <span className="choice-card-mark" aria-hidden="true">{selected.includes(metric.id) && <Icon name="check" />}</span>
        <span className="choice-card-art"><Icon name={metric.id} /></span>
        <h3>{metric.shortName}</h3>
      </button>)}
    </div>
    <aside className="choice-tray" data-testid={level === 2 ? 'level2-choice-checklist' : 'metric-choice-tray'} aria-label={level === 2 ? 'Alex’s Checklist' : capacity === 1 ? 'Your metric' : 'Your three priorities'}>
      <span className="eyebrow">{level === 2 ? 'ALEX’S CHECKLIST' : capacity === 1 ? 'YOUR METRIC' : 'YOUR PRIORITIES'}</span>
      <ol className="choice-slots">{Array.from({ length: capacity }, (_, index) => {
        const id = selected[index];
        return <li className="choice-slot" key={id || `empty-${index}`} data-filled={!!id} data-checked={!!id} data-slot-metric={id} data-inspected={id === detailId}>
          {id ? <>
            <button type="button" className="choice-slot-inspect" aria-label={`Review ${metricDefinition(id).shortName}`} onClick={() => setInspected(id)}>
              <Icon name={id} /><span>{metricDefinition(id).shortName}</span>
            </button>
            <button type="button" className="choice-slot-remove" aria-label={`Remove ${metricDefinition(id).shortName}`} onClick={() => toggle(id)}>×</button>
          </> : <span className="choice-slot-empty" aria-label={`Metric ${index + 1}: not selected`}><span>{index + 1}</span><i /></span>}
        </li>;
      })}</ol>
      <span className="sr-only" role="status">{selected.length} / {capacity} selected</span>
      <div className="choice-detail" aria-live="polite" aria-atomic="true">
        {detail ? <div key={detail.id}><strong>{detail.name}</strong><p>{detail.description}</p></div> : <div className="choice-detail-empty" aria-hidden="true"><Icon name="spark" /><i /><i /></div>}
      </div>
      {hint && <p className="choice-hint" role="status">{hint}</p>}
    </aside>
  </div>;
}
