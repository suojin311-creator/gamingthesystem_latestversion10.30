import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '../styles/management-satisfaction.css';

// Narrative checkpoints, not measured learning or a score for the player.
// Each chapter starts at the preceding chapter's final report, including
// standalone previews. Deriving this from reports prevents replay rewards.
export const MANAGEMENT_PROGRESS = {
  awaiting: 12,
  targetMet: 44,
  metrics: { 3: 60, 6: 70, 10: 77, 25: 82, 100: 86 },
  weightTests: [86, 90, 93, 95],
} as const;

export type ManagementReplay = { from: number; enabled: boolean; onComplete: () => void };

export default function ManagementSatisfaction({ value, children, replay }: { value: number; children: ReactNode; replay?: ManagementReplay }) {
  const host = useRef<HTMLDivElement>(null);
  const previousValue = useRef(value);
  const [notice, setNotice] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [replayStarted, setReplayStarted] = useState(false);
  const [replayEnded, setReplayEnded] = useState(false);
  const replayReported = useRef(false);
  const replayCallback = useRef(replay?.onComplete);
  replayCallback.current = replay?.onComplete;
  const replayEnabled = !!replay?.enabled;
  const replayFrom = replay?.from;
  const fill = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (value > previousValue.current) setNotice(value);
    else if (value < previousValue.current) setNotice(null);
    previousValue.current = value;
  }, [value]);
  useEffect(() => {
    const panel = host.current?.closest('[data-management-panel]');
    const observer = new IntersectionObserver(entries => setInView(entries[0].intersectionRatio >= .15), { threshold: .15 });
    if (panel) observer.observe(panel);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (replayFrom === undefined || !replayEnabled || !inView || !pageVisible || replayStarted) return;
    let second = 0;
    // Paint the previous report position before starting the opt-in recap replay.
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => {
      setReplayStarted(true);
      setNotice(value);
    }); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [replayFrom, replayEnabled, inView, pageVisible, replayStarted, value]);
  useEffect(() => {
    if (!replayStarted) return;
    // Reduced motion and an unchanged endpoint have no transitionend event.
    const duration = fill.current ? getComputedStyle(fill.current).transitionDuration : '0s';
    if (replayFrom === value || duration.split(',').every(part => parseFloat(part) === 0)) setReplayEnded(true);
  }, [replayStarted, replayFrom, value]);
  useEffect(() => {
    if (!replayEnded || !inView || !pageVisible || replayReported.current) return;
    replayReported.current = true;
    replayCallback.current?.();
  }, [replayEnded, inView, pageVisible]);
  const status = value >= 93 ? 'Delighted' : value >= 70 ? 'Very satisfied' : value >= 44 ? 'Satisfied' : 'Awaiting results';
  return <div ref={host} className="management-satisfaction" data-awaiting={value < 44} data-replay-state={replay ? replayEnded ? 'complete' : replayStarted ? 'rising' : 'waiting' : undefined}>
    {notice !== null && <span key={notice} className="management-attention" aria-hidden="true" style={{ animationPlayState: inView && pageVisible ? 'running' : 'paused', '--attention-play-state': inView && pageVisible ? 'running' : 'paused' } as CSSProperties} onAnimationEnd={() => setNotice(current => current === notice ? null : current)} />}
    <span className="management-satisfaction-label">Satisfaction</span>
    <strong className="management-satisfaction-state" aria-live="polite" aria-atomic="true">{status}</strong>
    <div className="management-satisfaction-track" role="progressbar" aria-label="Management satisfaction" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={status}>
      <span ref={fill} style={{ width: `${replay && !replayStarted ? replay.from : value}%` }} onTransitionEnd={event => {
        if (replayStarted && event.target === fill.current && event.propertyName === 'width') setReplayEnded(true);
      }} />
    </div>
    {children != null && <div className="management-satisfaction-evidence">{children}</div>}
  </div>;
}
