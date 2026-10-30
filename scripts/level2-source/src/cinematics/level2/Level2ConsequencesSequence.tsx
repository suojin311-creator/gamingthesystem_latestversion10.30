import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import visibleClassroom from '../../../docs/visual-style/references/Level 2 - More Metrics Consequences/    REF-L2-001 — Visible-heavy Classroom.png';
import qualityClassroom from '../../../docs/visual-style/references/Level 2 - More Metrics Consequences/    REF-L2-002 — Quality-heavy Classroom.png';
// Vite's dev static-file guard rejects a literal colon in this existing filename.
// Inline the original bytes in this lazy preview module; never rename or alter the source art.
import mixedClassroom from '../../../docs/visual-style/references/Level 2 - More Metrics Consequences/REF-L2-003 — Mixed : Broad Classroom.png?inline';
import type { CinematicComplete } from '../../shared/contracts';
import { CinematicCamera } from '../shared/engine/CinematicCamera/CinematicCamera';
import { DialogueLayer } from '../shared/engine/DialogueLayer/DialogueLayer';
import { EnvironmentMotion } from '../shared/engine/EnvironmentMotion/EnvironmentMotion';
import { useCinematicAudio, type CinematicAudioSources } from '../shared/engine/audio/useCinematicAudio';
import { clamp01 } from '../shared/engine/timeline/animationMath';
import { ChecklistSystem, type ChecklistCount, type ChecklistMode } from './ChecklistSystem';
import { getLevel2Shots, metricLabel, sequenceDuration, shotAt, type Level2Request, type ThreeMetricCategory } from './level2Timeline';
import './level2.css';
import { AlexCheckingSequence } from './AlexCheckingSequence';
import { AlexPerformance } from './AlexPerformance';
import { alexCheckingFrame } from './alexCheckingTimeline';
import { level2Performance } from './level2Performance';
import { checkingPenState } from './checklistPresentation';

export type Level2AudioCue = 'ambience' | 'tick' | 'paper' | 'link' | 'tension';
const SILENT_SOURCES: CinematicAudioSources<Level2AudioCue> = {};
const PLATES: Record<ThreeMetricCategory, string> = {
  'visible-behaviour-heavy': visibleClassroom,
  'quality-depth-heavy': qualityClassroom,
  'mixed-broad': mixedClassroom,
};
const CAPTIONS: Record<string, string> = {
  ten: 'Complete the requirements',
  'twenty-five': 'Connect the evidence',
  hundred: 'Close the remaining gaps',
};

type Props = {
  request: Level2Request;
  /** Seconds supplied by a playback clock, never by gameplay calculations. */
  elapsed: number;
  active?: boolean;
  /** Preview accessibility override; the OS preference remains the default. */
  reducedMotion?: boolean;
  onComplete: (completion: CinematicComplete) => void;
  audioSources?: CinematicAudioSources<Level2AudioCue>;
};

export function Level2ConsequencesSequence({ request, elapsed, active = true, reducedMotion, onComplete, audioSources = SILENT_SOURCES }: Props) {
  const systemReduced = useReducedMotion();
  const reduced = reducedMotion ?? !!systemReduced;
  const shots = getLevel2Shots(request);
  const current = shotAt(shots, elapsed);
  const sent = useRef<string | null>(null);
  const audio = useCinematicAudio(audioSources);
  const cueKey = useRef('');
  const duration = sequenceDuration(shots);
  const labels = request.input.selectedMetrics.map(metricLabel);
  const validMetrics = labels.length >= 3 && labels.every(Boolean);
  const valid = !!current && validMetrics;

  useEffect(() => {
    if (valid && elapsed >= duration && sent.current !== request.requestId) {
      sent.current = request.requestId;
      onComplete({ type: 'animationComplete', requestId: request.requestId, cinematicId: 'level2' });
    }
  }, [duration, elapsed, onComplete, request.requestId, valid]);

  useEffect(() => {
    if (!valid || !active || elapsed >= duration) return;
    audio.play('ambience', { loop: true, volume: 0.16 });
    return () => {
      (['ambience', 'tick', 'paper', 'link', 'tension'] as const).forEach(audio.stop);
    };
  }, [audio.play, audio.stop, request.requestId, valid, active, elapsed >= duration]);

  const id = current?.shot.id ?? 'entry';
  const time = current?.time ?? 0;
  const progress = current ? clamp01(time / current.shot.duration) : 0;
  const performance = level2Performance(id, time);
  const count: ChecklistCount = id === 'checking' || id === 'three-checklist' || id === 'entry' || id === 'pattern' ? 3
    : id === 'six-checklist' || id === 'expand' ? 6 : id === 'ten' ? 10 : id === 'twenty-five' ? 25 : 100;
  const mode: ChecklistMode = count === 25 ? 'criteria-management' : count === 100 ? 'optimization' : 'complete';
  const dialogue = current?.shot.dialogue?.find(line => time >= line.start && time < line.end);
  const marked = id === 'checking' || id === 'three-checklist' ? alexCheckingFrame(time).progress
    : id === 'entry' || id === 'pattern' || id === 'expand' ? 1
    : performance.progress ?? progress;
  const pen = checkingPenState(count, marked);
  const cue = `${request.requestId}:${id}:${['perfect', 'reflection', 'priority'].includes(id) ? 0 : `${pen.criterion}:${pen.mark > 1e-6 ? 'writing' : 'waiting'}`}`;
  useEffect(() => {
    if (!valid || !active || elapsed >= duration || cueKey.current === cue) return;
    cueKey.current = cue;
    if ((performance.view === 'insert' || performance.view === 'checking' || id === 'checking') && pen.mark <= 1e-6) return;
    if ((performance.view === 'checking' || id === 'checking') && alexCheckingFrame(time).shot !== 'insert') return;
    audio.play(id === 'perfect' || id === 'reflection' ? 'tension' : count >= 25 ? 'link' : 'tick', { volume: 0.15 });
  }, [audio.play, count, cue, id, valid, active, elapsed, duration, performance.view, pen.mark, time]);

  if (!valid || !current) {
    return <div className="l2-scene l2-invalid" role="alert">This cinematic needs a supplied category, selected metrics and a supported preview segment. No result has been inferred.</div>;
  }

  if (id === 'checking') {
    return <section className="l2-scene" aria-label="Alex checking cinematic" data-shot={id} data-request={request.requestId}>
      <AlexCheckingSequence elapsed={time} reducedMotion={reduced} />
    </section>;
  }

  const category = request.input.resultCategory as ThreeMetricCategory | undefined;
  const classroom = id === 'entry' || id === 'pattern' || id === 'three-checklist' ? (category ? PLATES[category] : mixedClassroom) : mixedClassroom;
  const notebookVisible = !['entry', 'pattern'].includes(id);
  const final = ['perfect', 'reflection', 'priority'].includes(id);
  // Flat artwork supports reframing, not invented eye/mouth or hand rigging.
  const cameraDrift = reduced ? 0 : Math.sin(Math.PI * clamp01(elapsed / duration));
  const cameraScale = 1.04 + cameraDrift * 0.045;
  // All motion derives from the playhead: pause and scrubbing freeze the same frame.
  const focus = reduced ? 0 : id === 'three-checklist'
    ? clamp01((time - 4.35) / 0.65) * (1 - clamp01((time - 7.2) / 0.65))
    : id === 'six-checklist' ? clamp01((time - 6.05) / 0.65) : 0;
  const paperEntrance = id === 'three-checklist' || elapsed === time ? clamp01(time / 0.65) : 1;
  const priorityExit = id === 'priority' ? 1 - clamp01(time / 0.8) : 1;
  const reflectionFade = id === 'reflection' ? 1 - 0.55 * clamp01(time / 0.8) : id === 'priority' ? 0.45 : 1;


  return (
    <section className={`l2-scene l2-shot-${id} ${reduced ? 'l2-reduced' : ''}`} aria-label="Level 2 consequence cinematic" data-shot={id} data-storyboard={current.shot.storyboard} data-category={category} data-count={count} data-request={request.requestId} data-performance={performance.view}>
      <CinematicCamera pose={{ scale: cameraScale, x: -cameraDrift, y: 0, vignette: final ? 0.62 : 0.35 }}>
        {performance.view === 'portrait'
          ? <AlexPerformance elapsed={time} expression={performance.expression} uncertainty={performance.uncertainty} reducedMotion={reduced} />
          : <img className="l2-world-plate" src={classroom} alt="Alex, in his rust-orange hoodie, with classmates in a warm sunlit university classroom." />}
        <div className="l2-world-grade" />
        <EnvironmentMotion progress={reduced ? 0 : elapsed / 18} seed={26} style={{ opacity: 0.6 }} />
        {id === 'pattern' && <div className="l2-pattern-notes" aria-hidden="true" style={{ opacity: clamp01((time - 2.7) / 1.5) }}>
          {labels.map(label => <span key={label}>✓ {label}</span>)}
        </div>}
        {notebookVisible && (performance.view === 'world' || final) && <div className={`l2-paper-placement ${final ? 'l2-paper-final' : ''}`} style={{ opacity: paperEntrance * reflectionFade * priorityExit, transform: `perspective(1000px) rotateX(8deg) rotateY(-5deg) rotateZ(-3deg) translate(${focus * 7}%, ${focus * 5 + (reduced ? 0 : (1 - paperEntrance) * 4)}%) scale(${1 - focus * 0.09})` }}>
          <ChecklistSystem count={count} mode={mode} labels={count <= 6 ? labels : undefined} progress={marked} allComplete={final} reducedMotion={reduced} />
        </div>}
        {id === 'expand' && <div className="l2-expanding-lines" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => <div key={i} style={{ opacity: clamp01(progress * 2 - i * 0.12), transform: `translateX(${reduced ? 0 : (1 - progress) * (i + 1) * 6}px)` }}>□ <span /></div>)}
        </div>}
        {final && <div className="l2-system-success" style={{ opacity: (id === 'perfect' ? clamp01(time / 0.8) : id === 'reflection' ? 1 - 0.3 * clamp01(time / 0.8) : 0.7) * priorityExit }} aria-label="Measurement system: all 100 requirements tracked and complete">
          <span>MEASUREMENT RECORD</span><strong>100 / 100</strong><p>Requirements tracked</p><div className="l2-success-rule" /><p className="l2-green">✓ All requirements covered</p>
          <div className="l2-record-lines" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div key={i}><i style={{ width: `${80 + i * 3}%` }} /><b>✓</b></div>)}</div>
        </div>}
        {id === 'priority' && <div className="l2-priority" style={{ opacity: clamp01((time - 0.5) / 0.6) }}>
          <p>SET PRIORITIES</p><h2>What matters most?</h2><div className="l2-priority-slots" aria-label="Three empty priority slots">{[1, 2, 3].map(n => <div key={n}><span>0{n}</span><i /></div>)}</div>
        </div>}
      </CinematicCamera>
      {(performance.view === 'checking' || performance.view === 'insert') && <AlexCheckingSequence elapsed={performance.checkingTime} reducedMotion={reduced} count={count} mode={mode} labels={count <= 6 ? labels : undefined} progress={performance.view === 'checking' ? undefined : marked} insertOnly={performance.view === 'insert'} />}
      <div className="l2-foreground-shade" />
      <div className="l2-chapter"><span>LEVEL 02</span><i /><span>MORE METRICS</span></div>
      {id === 'entry' && <div className="l2-entry-result" style={{ opacity: 1 - clamp01((time - 0.65) / 1.1), transform: `scale(${reduced ? 1 : 1 - progress * 0.07})` }}>
        <p>RESULT RECORDED</p><h2>Three metrics improved.</h2>{labels.map(label => <div key={label}><span>{label}</span><b>✓</b></div>)}
      </div>}
      {CAPTIONS[id] && performance.view === 'world' && <div className="l2-stage-caption"><span>{count} REQUIREMENTS</span><h2>{CAPTIONS[id]}</h2></div>}
      {id === 'expand' && <DialogueLayer style={{ bottom: '12%', fontSize: '2.2cqw' }}>Would more metrics finally close the gap?</DialogueLayer>}
      {dialogue && <div className={`l2-dialogue ${dialogue.speaker === 'You' ? 'l2-inner-voice' : ''}`} data-speaker={dialogue.speaker}>
        <span>{dialogue.speaker === 'Alex' ? 'ALEX' : 'YOUR THOUGHT'}</span>
        <DialogueLayer style={{ position: 'relative', inset: 'auto', fontSize: '2.1cqw', lineHeight: 1.5 }}>{dialogue.text}</DialogueLayer>
      </div>}
      {id === 'priority' && <p className="l2-priority-question">Which THREE metrics would you prioritize?</p>}
      <span className="l2-reference-credit">Level 2 · cinematic candidate</span>
    </section>
  );
}
