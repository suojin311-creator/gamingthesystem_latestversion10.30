import './styles.css';
import EndingCinematic from '../../cinematics/ending/EndingCinematic';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { METRIC_CATALOG, metricDefinition, type MetricId } from '../../shared/data/metrics';
import Icon from '../../shared/components/Icon';
import ChapterTransition from '../../shared/components/ChapterTransition';
import Conversation from '../../shared/components/Conversation';
import LearningRisk from '../../shared/components/LearningRisk';
import MetricSelection from '../../shared/components/MetricSelection';
import EffortDisplay from './EffortDisplay';
import CriteriaStop from './CriteriaStop';
import WeightComparison from './WeightComparison';
import WeightGuide from './WeightGuide';
import ExperimentPrompt from './ExperimentPrompt';
import { MAX_TRIALS, MIN_TRIALS, canCompare, canTryAgain, experimentHint, meetsExperiment, nextExperiment } from './experiments';
import ManagementSatisfaction, { MANAGEMENT_PROGRESS } from '../../shared/components/ManagementSatisfaction';
import { useFeedback } from '../../shared/hooks/useFeedback';
import { useVisibleDelay } from '../../shared/hooks/useVisibleDelay';
import { resolvePlayerName } from '../../shared/utils/playerName';
import LevelThreeCinematic from '../../cinematics/level3/LevelThreeCinematic';
import { workbenchDialogue } from './dialogue';
import { EFFORT_LABELS, observedStudentBehaviour, cinematicRequest, compareRuns, copyRun, type LevelThreeCinematicRequest, type LevelThreeResult, type WeightRun } from './data';
import { MIN_WEIGHT, MAX_WEIGHT, startAllocation, allocateWeight, canRun, confirmWeight, effortAt, maximumWeight, type Confirmed, type WeightGoal, type Weights } from './weights';

type Phase = 'intro' | 'choose' | 'weights' | 'publish' | 'scene' | 'result' | 'compare' | 'comparison-scene' | 'theory' ;
export type LevelThreeProps = {
  playerName?: string;
  initialMetricIds?: readonly MetricId[];
  levelOneMetricId?: MetricId;
  renderCinematic?: (request: LevelThreeCinematicRequest, onComplete: () => void) => ReactNode;
  onComplete?: (result: LevelThreeResult) => void;
  onDesignLab?: () => void;
};
const STAGES = ['Choose three', 'Set weights', 'Observe & adjust', 'Compare'];
const EMPTY_CONFIRMATIONS: Confirmed = [false, false, false];
const dialogueTime = (text: string) => Math.min(2500, Math.max(1300, 450 + text.split(/\s+/).length * 110));

function RunRows({ run, shown = 3 }: { run: WeightRun; shown?: number }) {
  return <div className="l3-run-table"><div className="l3-result-legend" aria-hidden="true"><span>METRIC</span><span>WEIGHT</span><span>ALEX’S EFFORT</span></div><ol className="l3-run-rows">{run.metricIds.map((id, index) => {
    const effort = effortAt(run.weights, index);
    return <li key={id} data-metric={id} data-effort={effort} data-shown={index < shown} aria-hidden={index >= shown} aria-label={`${metricDefinition(id).name}: score weight ${run.weights[index]} percent; Alex’s effort: ${EFFORT_LABELS[effort]}`} style={{ '--row-index': index } as React.CSSProperties}>
      <span className="l3-row-metric"><Icon name={id} /><span>{metricDefinition(id).shortName}</span></span>
      <strong className="l3-row-weight">{run.weights[index]}<small>%</small></strong>
      <EffortDisplay metricId={id} effort={effort} />
    </li>;
  })}</ol></div>;
}

export default function LevelThree({ playerName: suppliedName, initialMetricIds, levelOneMetricId, renderCinematic, onComplete }: LevelThreeProps) {
  const playerName = resolvePlayerName(suppliedName);
  const carried = METRIC_CATALOG.filter(metric => initialMetricIds?.includes(metric.id)).map(metric => metric.id);
  const initialSelection = carried.length === 3 ? carried : [];
  const [phase, setPhase] = useState<Phase>('intro');
  const [selected, setSelected] = useState<MetricId[]>(initialSelection);
  const [weights, setWeights] = useState<Weights | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmed>(EMPTY_CONFIRMATIONS);
  const [autoConfirmedIndex, setAutoConfirmedIndex] = useState<number | null>(null);
  const [runs, setRuns] = useState<WeightRun[]>([]);
  const [goal, setGoal] = useState<WeightGoal>('first');
  const [guideOpen, setGuideOpen] = useState(false);
  const [promptAttended, setPromptAttended] = useState(false);
  const [guideSeen, setGuideSeen] = useState(false);
  const [published, setPublished] = useState(0);
  const [reportReady, setReportReady] = useState(false);
  const [resultRows, setResultRows] = useState(0);
  const [resultTalkReady, setResultTalkReady] = useState(false);
  const [routineReady, setRoutineReady] = useState(false);
  const [dialogueReady, setDialogueReady] = useState(false);
  const [runId, setRunId] = useState(0);
  const [hint, setHint] = useState('');
  const title = useRef<HTMLHeadingElement>(null);
  const completionReported = useRef(false);
  const lastTick = useRef(0);
  const feedback = useFeedback();
  const current = runs.at(-1);
  const baseline = current?.weights;
  const experiment = nextExperiment(runs);
  const readyToRun = !!weights && canTryAgain(runs) && canRun(weights, confirmed, baseline ?? weights, goal) && meetsExperiment(weights, runs);
  const compared = compareRuns(runs);
  const key = `${runId}:${phase}:${runs.length}`;
  const confirmedCount = confirmed.filter(Boolean).length;
  const showPerspectives = phase === 'publish' || phase === 'result' || phase === 'compare';
  const hasReport = phase !== 'publish' || reportReady;
  const completedReports = runs.length - (hasReport ? 0 : 1);
  const satisfaction = MANAGEMENT_PROGRESS.weightTests[Math.min(completedReports, 3)];
  const hasObservation = phase === 'compare' || phase === 'result' && resultRows === 3;
  const stage = phase === 'intro' || phase === 'choose' ? 0 : ['compare', 'comparison-scene', 'theory'].includes(phase) ? 3 : phase === 'weights' && !runs.length ? 1 : 2;
  const sceneKind = phase === 'scene' ? 'weights' : phase === 'comparison-scene' ? 'comparison' : phase === 'theory' ? 'theory' : null;
  const request = sceneKind ? cinematicRequest(sceneKind, playerName, runs) : null;
  const lines = workbenchDialogue(phase, playerName, goal, runs);

  function move(next: Phase) { feedback.stop(); setHint(''); setResultTalkReady(false); setRoutineReady(false); setDialogueReady(false); setPhase(next); }
  function choose(id: MetricId) {
    if (selected.includes(id)) setSelected(selected.filter(value => value !== id));
    else if (selected.length < 3) setSelected(METRIC_CATALOG.map(metric => metric.id).filter(value => value === id || selected.includes(value)));
    else { setHint('Three selected. Deselect one to swap it.'); return; }
    setHint(''); feedback.play('tick');
  }
  function startEditor(next: WeightGoal) {
    setGoal(next); setWeights(baseline ? [...baseline] : null); setPromptAttended(false);
    if (!guideSeen) { setGuideOpen(true); setGuideSeen(true); }
    setConfirmed(EMPTY_CONFIRMATIONS); setAutoConfirmedIndex(null); move('weights');
  }
  function adjust(index: number, value: number) {
    setPromptAttended(true);
    const next = weights ? allocateWeight(weights, confirmed, index, value) : startAllocation(index, value);
    setWeights(next);
    if (performance.now() - lastTick.current > 130) { feedback.play('tick'); lastTick.current = performance.now(); }
  }
  function confirm(index: number) {
    if (!weights || confirmed[index]) return;
    setPromptAttended(true);
    const automatic = confirmedCount === 1 ? confirmed.findIndex((locked, i) => !locked && i !== index) : -1;
    setAutoConfirmedIndex(automatic >= 0 ? automatic : null);
    setConfirmed(confirmWeight(confirmed, index)); feedback.play('tick');
  }
  function resetWeights() {
    setPromptAttended(true);
    setWeights(baseline ? [...baseline] : null); setConfirmed(EMPTY_CONFIRMATIONS); setAutoConfirmedIndex(null); feedback.play('tick');
  }
  function publish() {
    if (!readyToRun || !weights) return;
    setGuideOpen(false);
    const record: WeightRun = { round: runs.length + 1, kind: 'player', metricIds: [...selected], weights: [...weights] };
    setRuns([...runs, record]); setPublished(0); setReportReady(false); setResultRows(0); move('publish');
  }
  function completeLevel() {
    if (!canCompare(runs) || completionReported.current) return;
    completionReported.current = true;
    onComplete?.({ selectedMetricIds: [...selected], runs: runs.map(copyRun), compared });
  }
  function finishScene() {
    if (phase === 'scene') { setResultRows(0); move('result'); }
    else if (phase === 'comparison-scene') move('theory');
    // The final theory placeholder is the end of this preview.
  }
  function resetForNewVisit() {
    completionReported.current = false; setSelected(initialSelection); setWeights(null); setConfirmed(EMPTY_CONFIRMATIONS);
    setRuns([]); setGoal('first'); setGuideOpen(false); setGuideSeen(false); setPublished(0); setReportReady(false); setResultRows(0); setAutoConfirmedIndex(null);
    setRunId(value => value + 1); feedback.reset(); move('intro');
  }

  useVisibleDelay(`${key}:${published}`, '.l3-publish', 550, phase === 'publish' && published < 3, () => {
    setPublished(value => value + 1); feedback.play('tick');
  });
  useVisibleDelay(key, '.l3-publish', 650, phase === 'publish' && published === 3 && !reportReady, () => { setReportReady(true); feedback.play('report'); });
  useVisibleDelay(`${key}:${resultRows}`, '.l3-results', 700, phase === 'result' && resultRows < 3, () => {
    setResultRows(value => value + 1); feedback.play('evidence');
  });
  useVisibleDelay(`${key}:dialogue`, '.l3-results', 450, phase === 'result' && resultRows === 3 && routineReady && !resultTalkReady, () => {
    setResultTalkReady(true);
    requestAnimationFrame(() => document.querySelector('.level-three .l3-bottom-dialogue')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  });
  useEffect(() => {
    if (request || guideOpen) return;
    title.current?.focus({ preventScroll: true });
    const rect = title.current?.getBoundingClientRect();
    if (rect && (rect.top < 0 || rect.bottom > innerHeight)) title.current?.scrollIntoView({ block: 'start' });
  }, [phase, runId, runs.length]);
  useEffect(() => {
    const fresh = (event: PageTransitionEvent) => { if (event.persisted) resetForNewVisit(); };
    window.addEventListener('pageshow', fresh);
    return () => window.removeEventListener('pageshow', fresh);
  });

  const action = current && <button className="button primary-button" onClick={() => runs.length < MIN_TRIALS ? startEditor('different') : move('compare')}>{runs.length < MIN_TRIALS ? 'Try another split' : 'Compare the results'}<Icon name="arrow" /></button>;

  if (phase === 'comparison-scene' && !renderCinematic) return <EndingCinematic playerName={playerName} levelOneMetricId={levelOneMetricId ?? selected[0]} runs={runs} />;

  return <div className="game-page level-three" data-phase={phase} data-round={runs.length} onPointerDown={feedback.unlock} onKeyDown={event => { feedback.unlock(); if (event.key === 'Escape') setGuideOpen(false); }}>
    <header className="l3-masthead"><a className="l3-wordmark" href="#level-three-main" aria-label="Gaming the System, skip to game"><span className="l3-emblem" aria-hidden="true">g<span>s</span><i /></span><span>GAMING<br /><b>THE SYSTEM</b></span></a><div className="l3-header-controls">{phase === 'weights' && <button className="guide-button" onClick={() => setGuideOpen(true)}><Icon name="question" /><span>Guide</span></button>}<button aria-pressed={!feedback.muted} disabled={!feedback.available} onClick={feedback.toggle}><Icon name={feedback.muted || !feedback.available ? 'muted' : 'sound'} /><span>{!feedback.available ? 'No audio' : feedback.muted ? 'Sound off' : 'Sound on'}</span></button></div></header>
    <main className="l3-workbench" id="level-three-main">
      {phase !== 'intro' && <><div className="l3-heading"><div><span className="chapter-number">03</span><h1>The weighting trap.</h1></div><span className="l3-location"><i />THE OFFICE</span></div>
      <nav className="l3-stepper" aria-label="Level 3 progress"><ol>{STAGES.map((label, index) => <li key={label} className={stage === index ? 'current' : stage > index ? 'done' : ''} aria-current={stage === index ? 'step' : undefined}><span>{stage > index ? <Icon name="check" /> : `0${index + 1}`}</span>{label}</li>)}</ol></nav></>}
      {request ? (renderCinematic ? renderCinematic(request, finishScene) : <LevelThreeCinematic key={`${key}:${request.sceneId}`} request={request} onComplete={finishScene} />)
        : phase === 'intro' ? <ChapterTransition key={`intro:${runId}`} level={3} playerName={playerName} initialMetricIds={initialSelection} play={feedback.play} onStart={() => move('choose')} />
        : <div className={`l3-body ${showPerspectives ? 'l3-with-perspectives' : ''}`}><section className="l3-decision">
          <div className="section-intro"><span className="eyebrow l3-round-label">{phase === 'weights' ? runs.length === MAX_TRIALS - 1 ? 'OPTIONAL TEST' : `TEST ${runs.length + 1}` : current && phase !== 'choose' ? `TEST ${current.round}` : 'CHOOSE EXACTLY THREE'}</span><h2 ref={title} tabIndex={-1}>{phase === 'choose' ? 'Which three would I prioritize?' : phase === 'weights' ? runs.length === 0 ? 'Set your first split.' : runs.length === 1 ? 'Follow what you observed.' : 'Test another idea.' : phase === 'publish' ? reportReady ? 'Weights published.' : 'Sharing the new weights…' : phase === 'result' ? 'Where did the effort go?' : 'What changed—and what stayed the same?'}</h2></div>
          {phase === 'choose' && <><MetricSelection level={3} capacity={3} selected={selected} onToggle={choose} hint={hint} /><div className="action-row l3-only-action"><button className="button primary-button" disabled={selected.length !== 3} onClick={() => startEditor('first')}>Set the weights<Icon name="arrow" /></button></div></>}
          {phase === 'weights' && <><ExperimentPrompt experiment={experiment} previous={current} attended={promptAttended} paused={guideOpen} />{guideOpen && <WeightGuide onClose={() => setGuideOpen(false)} />}{weights && confirmedCount === 3 && !meetsExperiment(weights, runs) && <p className="l3-edit-error" role="alert">{experimentHint()}</p>}<div className="l3-weight-grid">{selected.map((id, index) => {
            const locked = confirmed[index];
            const automatic = autoConfirmedIndex === index;
            const value = weights?.[index] ?? 0;
            const maximum = weights ? locked ? value : maximumWeight(weights, confirmed, index) : MAX_WEIGHT;
            return <article className="l3-weight-card" data-testid={`weight-card-${id}`} data-assigned={!!weights} data-confirmed={locked} data-auto-confirmed={automatic} key={id} style={{ '--card-index': index } as React.CSSProperties}>
              <div className="l3-weight-card-top"><Icon name={id} /><span>{locked ? <><Icon name="check" />{automatic ? 'Auto-confirmed' : 'Locked'}</> : confirmedCount ? `Up to ${maximum}%` : ''}</span></div><h3><label htmlFor={`weight-${id}`}>{metricDefinition(id).name}</label></h3><output htmlFor={`weight-${id}`} className="l3-weight-value" aria-label={weights ? undefined : 'Not assigned'}>{weights ? <>{value}<span>%</span></> : '—'}</output>
              <input id={`weight-${id}`} type="range" min={weights ? MIN_WEIGHT : 0} max={maximum} aria-valuemin={weights ? MIN_WEIGHT : 0} aria-valuemax={maximum} step={1} value={value} disabled={locked} aria-label={`${metricDefinition(id).name} weight`} aria-valuetext={weights ? `${value} percent${locked ? automatic ? ', confirmed automatically' : ', confirmed' : ''}` : 'Not assigned. Move this slider to start.'} onChange={event => adjust(index, Number(event.target.value))} />
              <button className={`button ${locked ? 'secondary-button' : 'primary-button'}`} disabled={!weights || locked} data-testid={`confirm-${id}`} onClick={() => confirm(index)}>{locked ? <><Icon name="check" />{automatic ? 'Auto-confirmed' : 'Confirmed'}</> : 'Confirm weight'}</button>
            </article>;
          })}</div><div className="l3-editor-tools"><button className="text-button" onClick={resetWeights}><Icon name="restart" />Reset weights</button></div><div className={`action-row l3-run-action ${canCompare(runs) ? '' : 'l3-only-action'}`}>{canCompare(runs) && <button className="text-button" onClick={() => move('compare')}>Back to comparison</button>}<button className="button primary-button" disabled={!readyToRun} onClick={() => publish()}>Run evaluation<Icon name="arrow" /></button></div></>}
          {phase === 'publish' && current && <><div className="l3-publish" role="status"><ol>{selected.map((id, index) => <li key={id} data-published={index < published}><Icon name={id} /><span>{metricDefinition(id).shortName}</span><strong>{current.weights[index]}%</strong><span>{index < published ? <Icon name="check" /> : <i className="l3-pending-dot" />}</span></li>)}</ol></div><div className="action-row l3-only-action"><button className="button primary-button" disabled={!reportReady} onClick={() => move('scene')}><Icon name="play" />Observe the class</button></div></>}
          {phase === 'result' && current && <><div className="l3-results"><RunRows run={current} shown={resultRows} />{resultRows === 3 && <CriteriaStop key={key} runKey={key} run={current} onComplete={() => setRoutineReady(true)} />}{resultRows < 3 && <p className="l3-watching" role="status">Watching Alex adapt…</p>}</div><div className="action-row"><button className="text-button" onClick={() => move('scene')}>Replay scene</button>{resultRows === 3 && dialogueReady ? action : <span className="l3-action-space" aria-hidden="true" />}</div></>}
          {phase === 'compare' && <><WeightComparison runs={runs} /><div className="action-row l3-compare-actions">{canTryAgain(runs) && <button className="text-button" onClick={() => startEditor('different')}>Test another idea<Icon name="arrow" /></button>}<button className="button primary-button" onClick={() => { completeLevel(); move('comparison-scene'); }}>Step back and reflect<Icon name="arrow" /></button></div></>}

        </section>{showPerspectives && current && <aside className="l3-perspectives"><section className="l3-perspective l3-management" data-management-panel data-reported={hasReport}><h3><Icon name="school" />Management’s view</h3><ManagementSatisfaction value={satisfaction}>{hasReport ? '3 priorities · 100% allocated' : 'Publishing weights…'}</ManagementSatisfaction></section><section className={`l3-perspective student ${hasObservation ? 'l3-observed' : ''}`}><h3><Icon name="student" />Students</h3>{hasObservation ? <LearningRisk behaviour={phase === 'compare' ? 'Scores still set the stopping point.' : observedStudentBehaviour(current.weights)} /> : <><Icon name="eye" /><p className="l3-awaiting">Awaiting observation</p></>}</section></aside>}</div>}
      {lines.length > 0 && <div className="l3-bottom-dialogue" aria-label="Player dialogue"><Conversation key={`workbench:${key}:${goal}`} lines={lines} enabled={resultTalkReady} typingDelay={300} readDelay={dialogueTime} play={feedback.play} onLastMessage={() => setDialogueReady(true)} onSettled={() => {}} /></div>}
    </main><footer className="l3-footer"><span>GAMING THE SYSTEM</span><span>LEVEL 03</span></footer>

  </div>;
}
