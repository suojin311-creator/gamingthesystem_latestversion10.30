import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { CinematicComplete } from '../../shared/contracts';
import { DialogueLayer } from '../shared/engine/DialogueLayer/DialogueLayer';
import { useCinematicAudio, type CinematicAudioSources } from '../shared/engine/audio/useCinematicAudio';
import { AlexPriorityAnchor, MetricAdaptationScene } from './MetricAdaptationScene';
import { metricLabel, sequenceFrame, suppliedClips, SEQUENCE_DURATION, type AdaptationRequest } from './adaptationTimeline';

export type AdaptationAudioCue = 'ambience' | 'paper' | 'typing' | 'chair' | 'phone' | 'criteria' | 'bridge';
const NO_AUDIO: CinematicAudioSources<AdaptationAudioCue> = {};

export type MetricAdaptationSequenceProps = {
  request: AdaptationRequest;
  hideClipDialogue?: boolean;
  elapsed: number;
  active?: boolean;
  reducedMotion?: boolean;
  onComplete: (event: CinematicComplete) => void;
  /** Optional real scene recordings. No success/failure/reward sounds. */
  audioSources?: CinematicAudioSources<AdaptationAudioCue>;
};

/** Presentation-only adapter for the existing level3 contract. */
export function MetricAdaptationSequence({ request, elapsed, active = true, reducedMotion, onComplete, audioSources = NO_AUDIO, hideClipDialogue = false }: MetricAdaptationSequenceProps) {
  const systemReduced = useReducedMotion();
  const reduced = reducedMotion ?? !!systemReduced;
  const clips = suppliedClips(request);
  const frame = sequenceFrame(elapsed);
  const completed = useRef(new Set<string>());
  const audio = useCinematicAudio(audioSources);
  const previousCue = useRef('');
  const validTime = Number.isFinite(elapsed) && elapsed >= 0;

  useEffect(() => {
    if (!clips || !validTime || !active || elapsed < SEQUENCE_DURATION || completed.current.has(request.requestId)) return;
    completed.current.add(request.requestId);
    onComplete({ type: 'animationComplete', requestId: request.requestId, cinematicId: 'level3' });
  }, [clips, validTime, active, elapsed, request.requestId, onComplete]);

  useEffect(() => {
    if (!clips || !validTime || !active || elapsed >= SEQUENCE_DURATION) return;
    audio.play('ambience', { loop: true, volume: 0.15 });
    return () => { (['ambience', 'paper', 'typing', 'chair', 'phone', 'criteria', 'bridge'] as const).forEach(audio.stop); };
  }, [!!clips, validTime, active, request.requestId, elapsed >= SEQUENCE_DURATION, audio.play, audio.stop]);

  const cueKey = `${request.requestId}:${frame.phase}:${frame.clipIndex}`;
  useEffect(() => {
    if (!clips || !validTime || !active || previousCue.current === cueKey || elapsed >= SEQUENCE_DURATION) return;
    previousCue.current = cueKey;
    const id = clips[frame.clipIndex].metric;
    if (frame.phase === 'bridge') audio.play('bridge', { volume: 0.13 });
    else if (frame.phase === 'clip') audio.play(id === 'pre-class-preparation' ? 'paper' : id === 'in-class-participation' || id === 'in-class-discussion-quality' ? 'chair' : id === 'on-task-focus' ? 'phone' : 'typing', { volume: 0.13 });
  }, [cueKey, clips, validTime, active, elapsed, frame.phase, frame.clipIndex, audio.play]);

  if (!clips || !validTime) return <div className="l3a-invalid" role="alert">CIN-03A needs exactly three different selected metrics, their supplied intensity states, and a finite playback time. No behaviour has been inferred from weights.</div>;
  const clip = clips[frame.clipIndex];
  return <div className={`l3a-sequence ${reduced ? 'l3a-reduced' : ''}`} data-phase={frame.phase} data-clip-index={frame.clipIndex} data-request={request.requestId}>
    {frame.phase === 'entry' || frame.phase === 'exit' ? <section className="l3a-scene" data-storyboard={frame.phase === 'entry' ? 'CIN3A-S01' : 'CIN3A-S21'}>
      <AlexPriorityAnchor time={frame.time} reduced={reduced} />
      <div className={`l3a-priority-sheet ${frame.phase === 'exit' ? 'l3a-result-anchor' : ''}`}>
        <small>{frame.phase === 'entry' ? 'COURSE ASSESSMENT' : 'CURRENT PRIORITIES'}</small>
        <h2>{frame.phase === 'entry' ? 'What counts this time' : 'Student effort'}</h2>
        {clips.map((c, i) => <div className="l3a-priority-row" key={c.metric} style={{ opacity: frame.phase === 'entry' && Math.floor(frame.time) !== i ? 0.65 : 1 }}>
          <span>{metricLabel(c.metric)}</span><b>{Number.isFinite(request.input.weights[c.metric]) ? `${request.input.weights[c.metric]}%` : '—'}</b>
        </div>)}
      </div>
      {frame.phase === 'entry' && <DialogueLayer style={{ bottom: '5%', fontSize: 'clamp(15px, 1.9cqw, 28px)' }}>Let’s see how changing the weights affects student behaviour.</DialogueLayer>}
      <div className="l3a-foreground" aria-hidden="true" />
    </section> : <MetricAdaptationScene {...clip} time={frame.time} reducedMotion={reduced} hideDialogue={hideClipDialogue || frame.phase === 'bridge'} />}
    {frame.phase === 'bridge' && <div className="l3a-match-bridge" data-storyboard="CIN3A-S20" aria-hidden="true" style={{ opacity: reduced ? 0 : Math.sin(frame.bridge * Math.PI) * 0.27, transform: `translateX(${reduced ? 0 : (frame.bridge - 0.5) * 8}%)` }} />}
  </div>;
}
