import './styles.css';
import MetricResult from './MetricResult';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getMetric, type Metric, type MetricId } from './metrics';
import { INITIAL_SESSION, type Phase } from './state';
import Icon from '../../shared/components/Icon';
import LearningRisk from '../../shared/components/LearningRisk';
import MetricSelection from '../../shared/components/MetricSelection';
import ObservationContent from '../../shared/components/ObservationContent';
import ManagementSatisfaction, { MANAGEMENT_PROGRESS, type ManagementReplay } from '../../shared/components/ManagementSatisfaction';
import Dialogue from './components/Dialogue';
import CinematicPlaceholder, { type CinematicRequest } from './components/CinematicPlaceholder';
import { useFeedback } from '../../shared/hooks/useFeedback';
import WorkbenchGuide from './components/WorkbenchGuide';
import { useVisibleDelay } from '../../shared/hooks/useVisibleDelay';
import { findingReadingTime } from '../../shared/utils/conversationTiming';
import { resolvePlayerName } from '../../shared/utils/playerName';

export type LevelOneResult = {
  metricId: MetricId; prediction: string;
  reportedScore: { before: number; after: number; target: number };
};
export type LevelOneSettlement = {
  result: LevelOneResult;
  onReplay: () => void;
  onContinue?: () => void;
};
export type LevelOneProps = {
  playerName?: string;
  renderCinematic?: (request: CinematicRequest, onComplete: () => void) => ReactNode;
  onComplete?: (result: LevelOneResult) => void;
  onContinue?: () => void;
  showIntro?: boolean;
  initialGuideDelay?: number;
  /** Run the cinematic before a dialogue-free assessment settlement. */
  renderSettlement?: (context: LevelOneSettlement) => ReactNode;
};

const steps = ['Choose', 'Predict', 'Evaluate', 'Observe'];
const phaseStep: Record<Phase, number> = { choose: 0, predict: 1, result: 2, cinematic: 3, review: 3 };
const TARGET = 70;

function ResultChart({ metric, ready, score, assessmentReport = false }: { metric: Metric; ready: boolean; score: number; assessmentReport?: boolean }) {
  return <div className="score-paper" data-ready={ready}>
    <div className="score-paper-top"><span className="eyebrow">{metric.shortName}</span><span className="score-state">{ready ? 'Evaluation complete' : 'Evaluating…'}</span></div>
    {assessmentReport && <p className="assessment-report-label">Percentage of students meeting the criteria</p>}
    <div className="score-numbers" aria-label={assessmentReport ? `Percentage of students meeting the criteria: ${metric.before}% at the first assessment, ${metric.after}% at the second assessment` : `Reported score: ${metric.before} before, ${metric.after} after`}>
      <span className="before-score">{metric.before}{assessmentReport && <span className="score-unit">%</span>}<small>{assessmentReport ? 'First assessment' : 'BEFORE'}</small></span>
      <Icon name="arrow" className="score-arrow" />
      <span className="after-score">{score}{assessmentReport && <span className="score-unit">%</span>}<small>{assessmentReport ? 'Second assessment' : 'AFTER'}</small></span>
    </div>
    <div className="score-track" aria-hidden="true"><span className="score-track-before" style={{ width: `${metric.before}%` }} /><span className="score-track-after" style={{ width: `${score}%` }} />{!assessmentReport && <i style={{ left: `${TARGET}%` }} />}</div>
    <div className="score-track-labels"><span>{assessmentReport ? '0%' : '0'}</span>{!assessmentReport && <span className="target-label" style={{ left: `${TARGET}%` }}>Target {TARGET}</span>}<span>{assessmentReport ? '100%' : '100'}</span></div>
    <p className="data-note">{assessmentReport ? 'Illustrative class data' : 'Illustrative score'}</p>
  </div>;
}

export function PerspectivePanel({ metric, evaluated, observed, highlight, managementReplay, studentIllustration, assessmentReport = false, studentBehaviour }: {
  metric?: Metric; evaluated: boolean; observed: boolean; highlight: 'university' | null;
  managementReplay?: ManagementReplay; studentIllustration?: ReactNode;
  assessmentReport?: boolean; studentBehaviour?: string;
}) {
  return <aside className="perspectives" aria-label="Two perspectives">
    <section className={`perspective university ${evaluated ? 'has-result' : ''} ${highlight === 'university' ? 'just-updated' : ''}`} aria-labelledby="university-title" data-management-panel data-updated={highlight === 'university'} tabIndex={-1}>
      <div className="perspective-heading"><Icon name="school" /><h3 id="university-title">Management’s view</h3>{highlight === 'university' && <span className="new-badge">NEW</span>}</div>
      <ManagementSatisfaction value={evaluated ? MANAGEMENT_PROGRESS.targetMet : MANAGEMENT_PROGRESS.awaiting} replay={managementReplay}>
        {assessmentReport ? null : evaluated && metric ? <><span className="university-value">Reported score {metric.after}</span> · target met</> : 'Run an evaluation'}
      </ManagementSatisfaction>
    </section>
    <section className={`perspective student ${observed ? 'has-evidence' : ''}`} aria-labelledby="student-title" tabIndex={-1}>
      <div className="perspective-heading"><Icon name="student" /><h3 id="student-title">Students</h3></div>
      {observed && metric ? <><LearningRisk behaviour={studentBehaviour ?? metric.studentBehaviour} />{studentIllustration}</> : <><span className="perspective-label">Classroom response</span><div className="student-signal waiting-signal"><Icon name="eye" /></div><p className="pending-title">Not observed yet</p></>}
    </section>
  </aside>;
}

export default function LevelOne({ playerName: suppliedName, renderCinematic, onComplete, onContinue, showIntro = true, initialGuideDelay = 0, renderSettlement }: LevelOneProps) {
  const assessmentReport = Boolean(renderSettlement);
  const playerName = resolvePlayerName(suppliedName);
  const [session, setSession] = useState(() => ({ ...INITIAL_SESSION }));
  const [guideOpen, setGuideOpen] = useState(showIntro && initialGuideDelay === 0);
  const [initialGuidePending,setInitialGuidePending] = useState(showIntro && initialGuideDelay > 0);
  const [runId, setRunId] = useState(0);
  const [resultReady, setResultReady] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [dialogueSettled, setDialogueSettled] = useState(false);
  const [highlight, setHighlight] = useState<'university' | null>(null);
  const [reviewTalkReady, setReviewTalkReady] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const guideButton = useRef<HTMLButtonElement>(null);
  const guideWasAutomatic = useRef(showIntro);
  const predictionField = useRef<HTMLTextAreaElement>(null);
  const completionReported = useRef(false);
  const feedback = useFeedback();
  const paused = guideOpen;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const { phase, prediction, metricId, resultReported, reviewStep } = session;
  const metric = getMetric(metricId);
  const observed = phase === 'review' && reviewStep === 1;
  const evaluated = (phase === 'result' && resultReported) || ['cinematic', 'review'].includes(phase);
  const dialogueEnabled = phase === 'result' ? resultReported : phase === 'review' ? reviewTalkReady : true;
  const currentStep = phase === 'review' && (dialogueSettled || renderSettlement) ? steps.length : phaseStep[phase];

  useVisibleDelay(`initial-guide:${runId}`, '.level-one .workbench', initialGuideDelay,
    initialGuidePending && phase === 'choose', () => {
      setInitialGuidePending(false);guideWasAutomatic.current=true;setGuideOpen(true);
    });
  useVisibleDelay(`report:${runId}:${phase}:${metricId}:${resultReported}`, '.score-paper', 900,
    !assessmentReport && phase === 'result' && resultReady && !resultReported && !paused, showReport);
  useVisibleDelay(`report-emphasis:${runId}:${phase}:${metricId}:${resultReported}`, '.perspective.university', 1600,
    phase === 'result' && highlight === 'university' && !paused, () => setHighlight(null));
  useVisibleDelay(`evidence:${runId}:${phase}:${metricId}:${reviewStep}`, '.prediction-recap', 1000,
    phase === 'review' && !renderSettlement && reviewStep === 0 && !paused, showObservation);
  // Match Level 2’s evidence-to-conversation rhythm.
  useVisibleDelay(`conversation:${runId}:${phase}:${metricId}:${reviewStep}`, '.observation-recap', findingReadingTime(metric?.evidence || ''),
    phase === 'review' && !renderSettlement && reviewStep === 1 && !paused && !reviewTalkReady, () => {
      setReviewTalkReady(true);
      bringIntoView('.dialogue-strip');
    });

  useEffect(() => {
    setDialogueSettled(false);
    setHighlight(null);
    setReviewTalkReady(false);
    if (phase === 'predict') predictionField.current?.focus({ preventScroll: true });
    else if (phase !== 'cinematic') title.current?.focus({ preventScroll: true });
    const target = title.current;
    if (phase !== 'cinematic' && target && (target.getBoundingClientRect().top < 0 || target.getBoundingClientRect().top > window.innerHeight * 0.7)) target.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [phase, runId]);
  useEffect(() => {
    const onReturn = (event: PageTransitionEvent) => { if (event.persisted) resetForNewVisit(); };
    window.addEventListener('pageshow', onReturn);
    return () => window.removeEventListener('pageshow', onReturn);
  }, [showIntro, feedback.reset]);
  useEffect(() => {
    if (assessmentReport || phase !== 'result' || !metric) { setResultReady(false); return; }
    if (resultReported) { setAnimatedScore(metric.after); setResultReady(true); return; }
    setResultReady(false);
    setAnimatedScore(metric.before);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1500;
    let frame = 0;
    let elapsed = 0;
    let last = performance.now();
    let lastTick = 0;
    const tick = (now: number) => {
      // Accumulate visible time so returning to a hidden tab cannot skip the result.
      if (!document.hidden && !pausedRef.current) elapsed += Math.min(now - last, 64);
      last = now;
      const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
      const score = Math.round(metric.before + (metric.after - metric.before) * (1 - Math.pow(1 - progress, 3)));
      setAnimatedScore(score);
      const segment = Math.floor(progress * 5);
      if (segment > lastTick && segment < 5) { feedback.play('tick'); lastTick = segment; }
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setResultReady(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, metric, resultReported, feedback.play]);

  // The settlement path completes on the actual full-cinematic callback. It does
  // not wait for the legacy review chat, and replay cannot report completion twice.
  useEffect(() => {
    if (!renderSettlement || phase !== 'review' || !metric || completionReported.current) return;
    completionReported.current = true;
    onComplete?.({ metricId: metric.id, prediction: prediction.trim(), reportedScore: { before: metric.before, after: metric.after, target: TARGET } });
  }, [renderSettlement, phase, metric, prediction, onComplete]);

  function go(next: Phase) {
    feedback.stop();
    setSession(value => ({ ...value, phase: next, reviewStep: next === 'review' || next === 'cinematic' ? 0 : value.reviewStep }));
  }
  function choose(id: MetricId) {
    feedback.play('tick');
    setSession(value => ({ ...value, metricId: value.metricId === id ? null : id, prediction: '', resultReported: false, reviewStep: 0 }));
  }
  function bringIntoView(selector: string) {
    window.requestAnimationFrame(() => {
      const panel = document.querySelector<HTMLElement>(selector);
      if (!panel) return;
      if (panel.getBoundingClientRect().top < 0 || panel.getBoundingClientRect().bottom > window.innerHeight) panel.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }
  function showReport() {
    setSession(value => ({ ...value, resultReported: true }));
    feedback.play('report');
    setHighlight('university');
    bringIntoView('.perspective.university');
  }
  function showObservation() {
    setSession(value => ({ ...value, reviewStep: 1 }));
    feedback.play('evidence');
    bringIntoView('.observation-recap');
  }
  function settleDialogue() {
    setDialogueSettled(true);
    if (phase !== 'review' || !metric || completionReported.current) return;
    completionReported.current = true;
    onComplete?.({ metricId: metric.id, prediction: prediction.trim(), reportedScore: { before: metric.before, after: metric.after, target: TARGET } });
  }
  function resetForNewVisit() {
    feedback.reset();
    completionReported.current = false;
    setSession({ ...INITIAL_SESSION });
    setRunId(value => value + 1);

    guideWasAutomatic.current = showIntro;
    setInitialGuidePending(showIntro && initialGuideDelay > 0);
    setGuideOpen(showIntro && initialGuideDelay === 0);
  }
  function openGuide() { setInitialGuidePending(false);feedback.stop(); guideWasAutomatic.current = false; setGuideOpen(true); }
  function closeGuide() {
    setInitialGuidePending(false);
    setGuideOpen(false);
    window.requestAnimationFrame(() => {
      if (guideWasAutomatic.current) {
        title.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
        title.current?.focus({ preventScroll: true });
      } else guideButton.current?.focus({ preventScroll: true });
      guideWasAutomatic.current = false;
    });
  }

  const dialogue = <Dialogue key={`${runId}:${phase}`} phase={phase} playerName={playerName} studentReplies={metric?.studentReplies} reviewQuestion={metric?.reviewQuestion} enabled={dialogueEnabled} paused={paused} play={feedback.play} onSettled={settleDialogue} assessmentReport={assessmentReport} />;
  const request: CinematicRequest | null = phase === 'cinematic' && metric ? { sceneId: `level1.${metric.id}`, metricId: metric.id, playerName } : null;

  return <div className="game-page level-one" onPointerDownCapture={feedback.unlock} onKeyDownCapture={feedback.unlock}>
    <header className="masthead"><a className="wordmark" href="#main-content" aria-label="Gaming the System, skip to game"><span className="brand-emblem" aria-hidden="true">g<span>s</span><i /></span><span>GAMING<br /><b>THE SYSTEM</b></span></a><div className="header-controls">{phase !== 'cinematic' && !(phase === 'review' && renderSettlement) && <button ref={guideButton} className="guide-button" aria-label="Guide" onClick={openGuide}><Icon name="question" /><span>Guide</span></button>}<button className="sound-button" aria-pressed={!feedback.muted} disabled={!feedback.available} onClick={feedback.toggle} title={feedback.available ? 'Toggle feedback sounds' : 'Audio is unavailable in this browser'}><Icon name={feedback.muted || !feedback.available ? 'muted' : 'sound'} /><span>{!feedback.available ? 'No audio' : feedback.muted ? 'Sound off' : 'Sound on'}</span></button></div></header>

    <main className="workbench" id="main-content">
      <div className="workbench-heading"><div className="chapter-heading"><span className="chapter-number">01</span><h1>One metric.</h1></div><span className="office-location"><span /> THE OFFICE</span></div>
      <nav className="stepper" aria-label="Level 1 progress"><ol>{steps.map((step, index) => <li key={step} className={`${currentStep === index ? 'current' : ''} ${currentStep > index ? 'done' : ''}`} aria-current={currentStep === index ? 'step' : undefined}><span className="step-number">{currentStep > index ? <Icon name="check" /> : `0${index + 1}`}</span><span>{step}</span></li>)}</ol></nav>

      {request ? (renderCinematic ? renderCinematic(request, () => go('review')) : <CinematicPlaceholder request={request} onComplete={() => go('review')} />) : phase === 'result' && metric && assessmentReport ? <MetricResult key={`${runId}:${metric.id}`} metric={metric} paused={paused} onReport={showReport} onObserve={() => go('cinematic')} play={feedback.play} renderPerspectives={(reported,complete) => <PerspectivePanel metric={metric} evaluated={reported} observed={false} highlight={null} assessmentReport managementReplay={{from:MANAGEMENT_PROGRESS.awaiting,enabled:reported,onComplete:complete}} />} />: phase === 'review' && metric && renderSettlement ? renderSettlement({ result: { metricId: metric.id, prediction: prediction.trim(), reportedScore: { before: metric.before, after: metric.after, target: TARGET } }, onReplay: () => go('cinematic'), onContinue }) : <>
        <div className={`workbench-body phase-${phase}`}>
          <section className="decision-area" aria-label="Current decision">
            {phase === 'choose' && <>
              <div className="section-intro"><h2 ref={title} tabIndex={-1}>{assessmentReport ? 'What will count in the next assessment?' : 'What will you measure?'}</h2>{assessmentReport && <p className="assessment-context">Choose one metric. Students will earn marks for meeting its criteria.</p>}</div>
              <MetricSelection level={1} capacity={1} selected={metricId ? [metricId] : []} onToggle={choose} />
              <div className="action-row only-action"><button className="button primary-button" disabled={!metric} onClick={() => go('predict')}>Make a prediction<Icon name="arrow" /></button></div>
            </>}

            {phase === 'predict' && metric && <>
              <div className="section-intro"><h2 ref={title} tabIndex={-1}>What do you expect?</h2></div>
              <div className="selected-focus"><span className="metric-illustration"><Icon name={metric.id} /></span><h3>{metric.name}</h3><button className="text-button" onClick={() => go('choose')}>Change</button></div>
              {assessmentReport && <p className="assessment-criteria" id="assessment-criteria"><strong>Assessment criteria:</strong> {metric.assessmentCriteria}</p>}
              <form className="prediction-form" onSubmit={event => { event.preventDefault(); if (prediction.trim()) setSession(value => ({ ...value, prediction: value.prediction.trim(), phase: 'result', resultReported: false })); }}>
                <label htmlFor="prediction" className="sr-only">{assessmentReport ? 'How will students respond when this counts towards their marks?' : 'What do you expect students to do?'}</label>
                <div className="prediction-paper"><span className="paper-corner" aria-hidden="true" /><textarea ref={predictionField} id="prediction" maxLength={100} value={prediction} placeholder={`e.g. ${metric.example}`} aria-describedby={assessmentReport ? 'assessment-criteria prediction-count' : 'prediction-count'} onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
                    event.preventDefault();
                    if (prediction.trim() && !event.repeat) event.currentTarget.form?.requestSubmit();
                  }
                }} onChange={event => setSession(value => ({ ...value, prediction: event.target.value }))} /><div id="prediction-count" className="character-counter">{prediction.length}<span> / 100</span></div></div>
                <div className="action-row prediction-actions"><button type="submit" className="button primary-button" disabled={!prediction.trim()}>{assessmentReport ? 'View assessment results' : 'Run evaluation'}<Icon name="arrow" /></button></div>
              </form>
            </>}

            {phase === 'result' && metric && <>
              <div className="section-intro"><h2 ref={title} tabIndex={-1}>{assessmentReport ? 'Assessment results.' : resultReported ? 'Target achieved.' : 'Watch the score.'}</h2></div>
              <ResultChart metric={metric} ready={resultReady} score={animatedScore} assessmentReport={assessmentReport} />
              <div className="action-row only-action"><button className="button primary-button" disabled={!resultReported} onClick={() => go('cinematic')}><Icon name="play" />{assessmentReport ? 'Look behind the result' : 'Observe the class'}</button></div>
            </>}

            {phase === 'review' && metric && <>
              <div className="section-intro"><h2 ref={title} tabIndex={-1}>Look a little closer.</h2></div>
              <div className="comparison-stack"><article className="prediction-recap"><span className="eyebrow">YOU EXPECTED</span><blockquote>“{prediction}”</blockquote></article>
                {observed ? <article className="observation-recap classroom-observation" key="evidence"><ObservationContent evidence={metric.evidence} metricIds={[metric.id]} /></article> : <div className="observation-waiting"><span>Recalling the classroom…</span></div>}
              </div>
              {dialogue}
              <div className="action-row"><button className="text-button" onClick={() => go('cinematic')}>Replay scene</button>{dialogueSettled ? <button className="button primary-button level-finished" disabled={!onContinue} onClick={onContinue}>Continue to Level 2<Icon name="arrow" /></button> : <span className="next-action-space" aria-hidden="true" />}</div>
            </>}
          </section>
          <PerspectivePanel metric={metric} evaluated={evaluated} observed={observed} highlight={highlight} assessmentReport={assessmentReport} />
        </div>
        {phase !== 'review' && dialogue}
      </>}
    </main>
    <footer className="page-footer">GAMING THE SYSTEM · LEVEL 01</footer>
    {guideOpen && <WorkbenchGuide key={runId} onClose={closeGuide} assessmentReport={assessmentReport} />}

  </div>;
}
