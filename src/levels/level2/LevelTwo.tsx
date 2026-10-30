import './styles.css';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { METRIC_CATALOG, metricDefinition, type MetricId } from '../../shared/data/metrics';
import Icon from '../../shared/components/Icon';
import CharacterPortrait from '../../shared/components/CharacterPortrait';
import '../../shared/styles/conversation.css';
import GrowthSequence from './GrowthSequence';
import ChapterTransition from '../../shared/components/ChapterTransition';
import { useFeedback } from '../../shared/hooks/useFeedback';
import { useVisibleDelay } from '../../shared/hooks/useVisibleDelay';
import { findingReadingTime } from '../../shared/utils/conversationTiming';
import MetricSelection from '../../shared/components/MetricSelection';
import ObservationContent from '../../shared/components/ObservationContent';
import LevelTwoCinematic from '../../cinematics/level2/LevelTwoCinematic';
import { resolvePlayerName } from '../../shared/utils/playerName';
import Perspectives from './Perspectives';
import { FINAL_EVIDENCE, SIX_EVIDENCE, THREE_OUTCOMES, classifyTrio, nextCount, sceneRequest, type LevelTwoCinematicRequest, type LevelTwoResult, type RoundCount } from './data';

type Phase = 'intro' | 'choose' | 'evaluate' | 'scene' | 'observe' | 'complete';
export type LevelTwoProps = {
  playerName?: string;
  previousMetricId?: MetricId;
  previousObservation?: string;
  renderCinematic?: (request: LevelTwoCinematicRequest, onComplete: () => void) => ReactNode;
  onComplete?: (result: LevelTwoResult) => void;
  onContinue?: (result: LevelTwoResult) => void;
};
const ALL_IDS = METRIC_CATALOG.map(metric => metric.id);
const STAGES = ['Choose three', 'Cover the gaps', 'Keep adding'];

export default function LevelTwo({ playerName: suppliedName, previousMetricId, previousObservation, renderCinematic, onComplete, onContinue }: LevelTwoProps) {
  const playerName = resolvePlayerName(suppliedName);
  const [phase, setPhase] = useState<Phase>('intro');
  const [selected, setSelected] = useState<MetricId[]>([]);
  const [count, setCount] = useState<RoundCount>(3);
  const [reportedCount, setReportedCount] = useState(0);
  const [observedCount, setObservedCount] = useState<RoundCount | null>(null);
  const [checked, setChecked] = useState<MetricId[]>([]);
  const [evaluationReady, setEvaluationReady] = useState(false);
  const [fromCount, setFromCount] = useState(0);
  const [shownCount, setShownCount] = useState(0);
  const [counterDone, setCounterDone] = useState(false);
  const [evidenceVisible, setEvidenceVisible] = useState(false);
  const [checklistRows, setChecklistRows] = useState(0);
  const [roundReady, setRoundReady] = useState(false);
  const [growthLeaving, setGrowthLeaving] = useState(false);
  const [hint, setHint] = useState('');
  const [runId, setRunId] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  const completionReported = useRef(false);
  const feedback = useFeedback();
  const paused = false;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const branch = selected.length === 3 ? classifyTrio(selected) : null;
  const growth = count >= 10;
  const growthCount = count as 10 | 25 | 100;
  const growthObservation = phase === 'observe' && growth;
  const resultPage = phase === 'complete' || phase === 'observe' && !growth;
  const currentIds = count === 3 ? selected : ALL_IDS;
  const pendingId = currentIds.find(id => !checked.includes(id));
  const evaluationFinished = growth ? counterDone : !pendingId;
  const evidence = phase === 'complete' ? FINAL_EVIDENCE : count === 3 && branch ? THREE_OUTCOMES[branch].evidence : SIX_EVIDENCE;
  const followingCount = nextCount(count);
  const stage = phase === 'complete' && roundReady ? 3 : count === 3 ? 0 : count === 6 ? 1 : 2;
  const beatKey = `${runId}:${phase}:${count}`;

  function bringIntoView(selector: string) {
    requestAnimationFrame(() => {
      const target = document.querySelector(`.level-two ${selector}`);
      const rect = target?.getBoundingClientRect();
      if (rect && (rect.bottom > innerHeight || rect.top < 0)) target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
  function movePhase(next: Phase) {
    feedback.stop();
    setGrowthLeaving(false); setEvidenceVisible(false); setChecklistRows(0); setRoundReady(false); setHint('');
    setPhase(next);
  }
  function chooseMetric(id: MetricId) {
    if (selected.includes(id)) { setSelected(selected.filter(value => value !== id)); setHint(''); }
    else if (selected.length < 3) { setSelected(ALL_IDS.filter(value => value === id || selected.includes(value))); setHint(''); }
    else { setHint('Three selected. Deselect one to make a swap.'); return; }
    feedback.play('tick');
  }
  function beginRound(next: RoundCount) {
    setFromCount(reportedCount); setShownCount(reportedCount); setCounterDone(false);
    setChecked(next === 6 ? [...selected] : []); setEvaluationReady(false); setCount(next); setObservedCount(null);
    movePhase('evaluate');
    if (next === 10) requestAnimationFrame(() => bringIntoView('.l2-growth-sequence'));
  }
  function finishScene() { movePhase(count === 100 ? 'complete' : 'observe'); }
  function toggleGapMetric(id: MetricId) {
    if (phase !== 'evaluate' || count !== 6 || selected.includes(id)) return;
    const next = checked.includes(id) ? checked.filter(value => value !== id) : ALL_IDS.filter(value => value === id || checked.includes(value));
    const ready = next.length === ALL_IDS.length;
    setChecked(next); setEvaluationReady(ready); setReportedCount(ready ? 6 : 3);
    feedback.play(ready ? 'report' : 'tick');
  }
  function settleRound() {
    setRoundReady(true);
    if (phase === 'complete' && branch && !completionReported.current) {
      completionReported.current = true;
      onComplete?.({ selectedMetricIds: [...selected], branch, metricsTracked: 100 });
    }
  }
  function resetForNewVisit() {
    completionReported.current = false;
    setSelected([]); setCount(3); setReportedCount(0); setObservedCount(null); setChecked([]);
    setShownCount(0); setFromCount(0); setCounterDone(false); setEvaluationReady(false);
    setRunId(value => value + 1); feedback.reset(); movePhase('intro');
  }

  useVisibleDelay(`${beatKey}:${checked.length}`, '.l2-evaluation', 480, phase === 'evaluate' && count === 3 && !!pendingId && !paused, () => {
    if (pendingId) setChecked(value => [...value, pendingId]);
    feedback.play('tick');
  });
  useVisibleDelay(beatKey, growth ? '.l2-growth-sequence .l2-counter' : '.l2-evaluation', 650, phase === 'evaluate' && evaluationFinished && !evaluationReady && !paused, () => {
    setReportedCount(count); setEvaluationReady(true); feedback.play('report');
  });
  useVisibleDelay(beatKey, '.l2-growth-sequence .l2-counter', 300, phase === 'evaluate' && growth && evaluationReady && !paused, () => movePhase('observe'));
  useVisibleDelay(beatKey, '.l2-observation-slot', growthObservation ? 350 : 900, (phase === 'observe' || phase === 'complete') && !evidenceVisible && !paused, () => {
    setEvidenceVisible(true); setObservedCount(count); setChecklistRows(growthObservation ? 1 : 0);
    feedback.play('evidence'); if (!growthObservation) bringIntoView('.l2-observation');
  });
  useVisibleDelay(`${beatKey}:${checklistRows}`, '.l2-checklist', 300, growthObservation && evidenceVisible && checklistRows < 3 && !paused, () => setChecklistRows(value => value + 1));
  useVisibleDelay(beatKey, '.l2-checklist', count < 100 ? 3500 : 1000, growthObservation && checklistRows === 3 && !growthLeaving && !roundReady && !paused, () => { if (followingCount) { setGrowthLeaving(true); feedback.play('paper'); } else setRoundReady(true); });
  useVisibleDelay(`${beatKey}:turn`, '.l2-checklist', 700, growthLeaving && !paused, () => { if (followingCount) beginRound(followingCount); });
  useVisibleDelay(beatKey, '.l2-observation', findingReadingTime(evidence), resultPage && evidenceVisible && !roundReady && !paused, settleRound);

  useEffect(() => {
    if (phase === 'scene' || growth && (phase === 'evaluate' || phase === 'observe')) return;
    const target = title.current;
    target?.focus({ preventScroll: true });
    const rect = target?.getBoundingClientRect();
    if (rect && (rect.top < 0 || rect.bottom > innerHeight)) target?.scrollIntoView({ block: 'start' });
  }, [phase, count, runId]);
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => { if (event.persisted) resetForNewVisit(); };
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  });
  useEffect(() => {
    if (phase !== 'evaluate' || !growth) return;
    let frame = 0, elapsed = 0, last = performance.now(), lastTick = 0;
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200;
    const advance = (now: number) => {
      const rect = document.querySelector('.l2-counter')?.getBoundingClientRect();
      const visible = rect && rect.bottom > 0 && rect.top < innerHeight;
      const canAdvance = !document.hidden && !pausedRef.current && visible;
      // Browsers suspend animation frames in background tabs. Do not count
      // that suspended interval as time the player has watched the counter.
      if (canAdvance) elapsed += Math.min(now - last, 64);
      last = now;
      if (!canAdvance) { frame = requestAnimationFrame(advance); return; }
      const progress = duration ? Math.min(1, elapsed / duration) : 1;
      setShownCount(Math.round(fromCount + (count - fromCount) * (1 - (1 - progress) ** 2)));
      const tick = Math.floor(progress * 4);
      if (tick > lastTick) { lastTick = tick; feedback.play('tick'); }
      if (progress < 1) frame = requestAnimationFrame(advance);
      else setCounterDone(true);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [phase, count, growth, fromCount, runId, feedback.play]);

  const request = phase === 'scene' ? sceneRequest(count as 3 | 6 | 100, selected, playerName) : null;
  const counter = <div className="l2-counter" data-load={count} aria-label={`${shownCount} metrics tracked`}><div className="l2-counter-value"><span className="eyebrow">METRICS TRACKED</span><strong>{shownCount}</strong><span className="l2-count-change">{fromCount}<Icon name="arrow" />{count}</span></div><div className="l2-matrix" aria-hidden="true">{Array.from({ length: 100 }, (_, index) => <i key={index} data-active={index < shownCount}><Icon name="check" /></i>)}</div></div>;

  return <div className="game-page level-two" data-phase={phase} data-round={count} data-branch={branch || ''} onPointerDown={feedback.unlock} onKeyDown={feedback.unlock}>
    <header className="l2-masthead"><a className="l2-wordmark" href="#level-two-main" aria-label="Gaming the System, skip to game"><span className="l2-emblem" aria-hidden="true">g<span>s</span><i /></span><span>GAMING<br /><b>THE SYSTEM</b></span></a><div className="l2-header-controls"><button aria-pressed={!feedback.muted} disabled={!feedback.available} onClick={feedback.toggle}><Icon name={feedback.muted || !feedback.available ? 'muted' : 'sound'} /><span>{!feedback.available ? 'No audio' : feedback.muted ? 'Sound off' : 'Sound on'}</span></button></div></header>
    <main id="level-two-main" className="l2-workbench">
      {phase !== 'intro' && <><div className="l2-heading"><div><span className="chapter-number">02</span><h1>More metrics.</h1></div><span className="l2-location"><i />THE OFFICE</span></div>
      <nav className="l2-stepper" aria-label="Level 2 progress"><ol>{STAGES.map((label, index) => <li key={label} className={stage === index ? 'current' : stage > index ? 'done' : ''} aria-current={stage === index ? 'step' : undefined}><span>{stage > index ? <Icon name="check" /> : `0${index + 1}`}</span>{label}</li>)}</ol></nav></>}
      {request ? (renderCinematic ? renderCinematic(request, finishScene) : <LevelTwoCinematic key={`${runId}:${request.sceneId}`} request={request} onComplete={finishScene} />)
        : phase === 'intro' ? <ChapterTransition key={`intro:${runId}`} level={2} playerName={playerName} previousMetricId={previousMetricId} previousObservation={previousObservation} play={feedback.play} onStart={() => movePhase('choose')} />
        : <div className={`l2-body ${phase === 'choose' ? 'l2-choosing' : ''} ${resultPage ? 'l2-results' : ''} ${phase === 'observe' && count === 6 ? 'l2-more-metrics-prompt' : ''}`}>
          {resultPage && <div className="l2-results-handoff" aria-hidden="true" />}
          <section className="l2-decision">
          <div className={`section-intro ${phase === 'observe' && count === 6 ? 'l2-growth-question' : ''}`}><h2 ref={title} tabIndex={-1}>{growth && phase !== 'complete' ? 'Testing more metrics.' : phase === 'choose' ? 'Which three will you track?' : phase === 'evaluate' ? evaluationReady ? count === 3 && branch ? THREE_OUTCOMES[branch].report : count === 6 ? 'Six metrics. Six green ticks.' : 'More of the picture?' : growth ? 'Expanding the system…' : count === 6 ? 'Cover the gaps' : 'Watch the metrics.' : phase === 'complete' ? 'More metrics. Still chasing marks.' : growth ? `${count} metrics. What counts now?` : count === 6 ? 'Would more metrics help learning?' : 'Look a little closer.'}</h2>{phase === 'observe' && count === 6 && <div className="l2-growth-proposal" aria-hidden="true"><span><Icon name="reflect" /><b>6</b></span><Icon name="arrow" /><span><Icon name="reflect" /><b>?</b></span></div>}{phase === 'choose' && <>{previousMetricId && <p className="l2-previous">Previously tracked: {metricDefinition(previousMetricId).shortName}</p>}</>}</div>
          {phase === 'choose' && <>
            <MetricSelection level={2} capacity={3} selected={selected} onToggle={chooseMetric} hint={hint} />
            <div className="action-row only-action"><button className="button primary-button" disabled={selected.length !== 3} onClick={() => beginRound(3)}>Run evaluation<Icon name="arrow" /></button></div>
          </>}
          {phase === 'evaluate' && !growth && <><section className="l2-evaluation" aria-label="Metric evaluation"><ul className="l2-evaluation-list">{currentIds.map(id => {
            const done = checked.includes(id);
            const content = <><span className="l2-eval-name"><Icon name={id} />{metricDefinition(id).shortName}</span><span className="l2-eval-result">{done ? <><Icon name="check" />Improved</> : count === 6 ? <span className="l2-empty-check" aria-hidden="true" /> : <><i className="l2-checking" />Checking</>}</span></>;
            return <li key={id} data-checked={done} className={count === 6 ? 'l2-manual-metric' : undefined}>{count === 6 ? <button type="button" role="checkbox" className="l2-gap-metric" aria-label={metricDefinition(id).shortName} aria-checked={done} disabled={selected.includes(id)} data-testid={`level2-gap-metric-${id}`} onClick={() => toggleGapMetric(id)}>{content}</button> : content}</li>;
          })}</ul></section><div className="action-row only-action"><button className="button primary-button" disabled={!evaluationReady} onClick={() => movePhase('scene')}><Icon name="play" />Observe the class</button></div></>}
          {growth && (phase === 'evaluate' || phase === 'observe') && <GrowthSequence count={growthCount} beat={checklistRows} shown={evidenceVisible} leaving={growthLeaving} counter={counter} ready={roundReady} onObserve={() => movePhase('scene')} />}
          {resultPage && <><div className="l2-observation-slot">{evidenceVisible ? <article className="l2-observation classroom-observation" key={beatKey}><ObservationContent evidence={evidence} metricIds={currentIds} /></article> : <div className="l2-waiting" role="status"><Icon name="eye" /><span>Looking closer…</span></div>}</div>{phase === 'observe' && count === 6 && <section className="conversation l2-teacher-prompt" aria-label="Teacher reflection"><div className="dialogue-character maya-character"><span className="avatar maya-avatar" aria-hidden="true"><CharacterPortrait role="teacher" /></span><div className="speech-bubble maya-bubble"><span className="speaker-name">{playerName}</span><p>Would more metrics help?</p></div></div></section>}<div className="action-row"><button className="text-button" onClick={() => movePhase('scene')}>Replay scene</button>{roundReady ? phase === 'complete' ? <button className="button primary-button" disabled={!onContinue} onClick={() => { settleRound(); if (branch) onContinue?.({ selectedMetricIds: [...selected], branch, metricsTracked: 100 }); }}>Continue to Level 3<Icon name="arrow" /></button> : count === 3 ? <button className="button primary-button" onClick={() => beginRound(6)}>Cover the gaps<Icon name="arrow" /></button> : <button className="button primary-button" onClick={() => beginRound(10)}>Test more metrics<Icon name="arrow" /></button> : <span className="l2-next-space" aria-hidden="true" />}</div></>}

        </section>{phase !== 'choose' && <Perspectives count={count} reportedCount={reportedCount} observedCount={observedCount} evaluating={phase === 'evaluate'} />}</div>}
    </main>
    <footer className="l2-footer"><span>GAMING THE SYSTEM</span><span>LEVEL 02</span></footer>

  </div>;
}
